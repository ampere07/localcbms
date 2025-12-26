<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Exception;

class PaymentWorkerService
{
    private $lockFile;
    private $lockHandle;
    private $billingApiUrl;
    private $reconnectApiUrl;

    public function __construct()
    {
        $this->lockFile = storage_path('app/payment_worker.lock');
        $this->billingApiUrl = env('BILLING_API_URL', 'https://cbms.atssfiber.ph/billing_update.php');
        $this->reconnectApiUrl = env('RECONNECT_API_URL', 'https://cbms.atssfiber.ph/manual_dc_rc.php');
    }

    /**
     * Main worker function - processes queued payments
     */
    public function processPayments()
    {
        if (!$this->acquireLock()) {
            $this->workerLog('Another worker is already running. Exiting.');
            return false;
        }

        try {
            $this->workerLog('Payment Worker: Starting');

            // --- 1. INTELLIGENT SELECTION ---
            $payments = DB::table('payment_portal_logs')
                ->where('transaction_status', 'QUEUED')
                ->orWhere(function($query) {
                    $query->where('transaction_status', 'PENDING')
                          ->whereNotNull('callback_payload')
                          ->where(function($q) {
                              $q->where('callback_payload', 'LIKE', '%PAID%')
                                ->orWhere('callback_payload', 'LIKE', '%PAYMENT_SUCCESS%');
                          });
                })
                ->limit(20)
                ->get();

            if ($payments->isEmpty()) {
                $this->workerLog('No payments to process');
                return true;
            }

            $this->workerLog("Found {$payments->count()} transactions to audit");

            foreach ($payments as $payment) {
                $this->processPayment($payment);
            }

            $this->workerLog('Payment Worker: Completed');
            return true;

        } catch (Exception $e) {
            $this->workerLog('Worker Error: ' . $e->getMessage());
            Log::error('Payment Worker Exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        } finally {
            $this->releaseLock();
        }
    }

    /**
     * Process individual payment
     */
    private function processPayment($payment)
    {
        try {
            $id = $payment->id;
            $ref = $payment->reference_no;
            $accountId = $payment->account_id;
            $amount = $payment->total_amount;
            $rawPayload = $payment->callback_payload;

            // --- 2. INTERNAL AUDIT (SECURITY CHECK) ---
            if ($rawPayload) {
                $json = json_decode($rawPayload, true);
                $gwStatus = strtoupper($json['status'] ?? '');
                
                $isLegitPaid = in_array($gwStatus, ['PAID', 'COMPLETED', 'SETTLED', 'PAYMENT_SUCCESS']);

                if (!$isLegitPaid) {
                    $this->workerLog("AUDIT FAIL: Ref $ref has payload but status is $gwStatus. Marking FAILED.");
                    
                    DB::table('payment_portal_logs')
                        ->where('id', $id)
                        ->update(['transaction_status' => 'FAILED']);
                    
                    return;
                }
            }

            // --- 3. LOCK RECORD ---
            DB::table('payment_portal_logs')
                ->where('id', $id)
                ->update([
                    'transaction_status' => 'PROCESSING',
                    'updated_at' => now()
                ]);

            // --- 4. BILLING UPDATE ---
            $account = DB::table('accounts')
                ->join('customers', 'accounts.customer_id', '=', 'customers.id')
                ->where('accounts.id', $accountId)
                ->select(
                    'accounts.*',
                    'customers.full_name',
                    'customers.contact_number_primary',
                    'customers.desired_plan',
                    'customers.barangay',
                    'customers.city',
                    'customers.address'
                )
                ->first();

            if (!$account) {
                $this->workerLog("ERROR: Account not found for payment $ref");
                return;
            }

            $apiPayload = [
                'action' => 'updateBalance',
                'accountNumber' => $account->account_no,
                'paymentReceived' => $amount,
                'updatedBy' => 'Payment_Worker',
                'transactionId' => $ref
            ];

            $resp = $this->sendToExternalAPI($this->billingApiUrl, $apiPayload);
            $respStatus = $resp['status'] ?? 'error';

            if ($respStatus === 'success') {
                // SUCCESS SEQUENCE
                DB::table('payment_portal_logs')
                    ->where('id', $id)
                    ->update([
                        'transaction_status' => 'PAID',
                        'status' => 'Success'
                    ]);

                // --- A. UPDATE LOCAL ACCOUNT BALANCE ---
                $newBalance = $account->account_balance - $amount;
                if ($newBalance < 0) {
                    $newBalance = 0;
                }

                DB::table('accounts')
                    ->where('id', $accountId)
                    ->update([
                        'account_balance' => $newBalance,
                        'updated_at' => now()
                    ]);

                // --- B. INSERT TRANSACTION LOG ---
                $json = json_decode($rawPayload, true);
                $provider = 'XENDIT';
                $method = 'Online';
                $channel = $json['payment_channel'] ?? $json['bank_code'] ?? 'Xendit';
                $checkoutID = $json['id'] ?? $payment->checkout_id;
                $ewallet = '';

                if (strpos(strtoupper($method), 'WALLET') !== false) {
                    $ewallet = $channel;
                }

                DB::table('transactions')->insert([
                    'account_id' => $accountId,
                    'transaction_type' => 'payment',
                    'amount' => $amount,
                    'payment_method' => 'Online - Xendit',
                    'reference_number' => $ref,
                    'notes' => "Payment via Xendit Portal - $checkoutID",
                    'processed_by' => 'Payment Worker',
                    'transaction_date' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                $this->workerLog("Success: Logged Ref $ref - Amount: ₱" . number_format($amount, 2));

                // --- C. RECONNECT CHECK ---
                if ($newBalance == 0) {
                    $reconnectData = [
                        'action' => 'reconnectUser',
                        'accountNumber' => $account->account_no,
                        'username' => $account->username ?? '',
                        'plan' => $account->desired_plan ?? '',
                        'updatedBy' => 'Payment_Worker'
                    ];

                    $rcResp = $this->sendToExternalAPI($this->reconnectApiUrl, $reconnectData);
                    $rcStatus = ($rcResp['status'] ?? '') === 'success' ? 'success' : 'failed';
                    
                    $this->workerLog("Reconnect attempt for $ref: $rcStatus");
                }

            } else {
                // API FAILED - Mark as API_RETRY
                DB::table('payment_portal_logs')
                    ->where('id', $id)
                    ->update(['transaction_status' => 'API_RETRY']);
                
                $this->workerLog("Billing API Error for Ref $ref: " . ($resp['message'] ?? 'Unknown'));
            }

        } catch (Exception $e) {
            $this->workerLog("Failed to process payment {$payment->reference_no}: {$e->getMessage()}");
            
            DB::table('payment_portal_logs')
                ->where('id', $payment->id)
                ->update(['transaction_status' => 'API_RETRY']);
        }
    }

    /**
     * Send request to external API
     */
    private function sendToExternalAPI($url, $data)
    {
        try {
            $response = Http::timeout(30)
                ->post($url, $data);

            if ($response->failed()) {
                return [
                    'status' => 'error',
                    'message' => 'HTTP Error: ' . $response->status()
                ];
            }

            $result = $response->json();
            
            if (!$result) {
                return [
                    'status' => 'error',
                    'message' => 'Invalid JSON response'
                ];
            }

            return $result;

        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Acquire lock to prevent concurrent execution
     */
    private function acquireLock()
    {
        $this->lockHandle = fopen($this->lockFile, 'w+');
        
        if (!$this->lockHandle) {
            return false;
        }

        return flock($this->lockHandle, LOCK_EX | LOCK_NB);
    }

    /**
     * Release lock
     */
    private function releaseLock()
    {
        if ($this->lockHandle) {
            flock($this->lockHandle, LOCK_UN);
            fclose($this->lockHandle);
        }
    }

    /**
     * Write log message
     */
    private function workerLog($message)
    {
        Log::channel('single')->info('[Payment Worker] ' . $message);
    }

    /**
     * Get worker statistics
     */
    public function getStatistics()
    {
        return [
            'pending' => DB::table('payment_portal_logs')
                ->where('transaction_status', 'PENDING')
                ->count(),
            'queued' => DB::table('payment_portal_logs')
                ->where('transaction_status', 'QUEUED')
                ->count(),
            'processing' => DB::table('payment_portal_logs')
                ->where('transaction_status', 'PROCESSING')
                ->count(),
            'paid' => DB::table('payment_portal_logs')
                ->where('transaction_status', 'PAID')
                ->whereDate('updated_at', today())
                ->count(),
            'failed' => DB::table('payment_portal_logs')
                ->where('transaction_status', 'FAILED')
                ->whereDate('updated_at', today())
                ->count(),
            'api_retry' => DB::table('payment_portal_logs')
                ->where('transaction_status', 'API_RETRY')
                ->count(),
        ];
    }

    /**
     * Retry failed payments
     */
    public function retryFailedPayments()
    {
        $retryPayments = DB::table('payment_portal_logs')
            ->where('transaction_status', 'API_RETRY')
            ->limit(10)
            ->get();

        foreach ($retryPayments as $payment) {
            DB::table('payment_portal_logs')
                ->where('id', $payment->id)
                ->update(['transaction_status' => 'QUEUED']);
        }

        return $retryPayments->count();
    }
}
