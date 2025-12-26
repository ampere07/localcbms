<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Exception;

class XenditPaymentController extends Controller
{
    private $xenditApiKey;
    private $xenditCallbackToken;
    private $portalLink;

    public function __construct()
    {
        $this->xenditApiKey = env('XENDIT_API_KEY');
        $this->xenditCallbackToken = env('XENDIT_CALLBACK_TOKEN');
        $this->portalLink = env('APP_URL', 'http://localhost:3000');
    }

    public function createPayment(Request $request)
    {
        try {
            $validated = $request->validate([
                'account_no' => 'required|string',
                'amount' => 'required|numeric|min:1',
            ]);

            $accountNo = $validated['account_no'];
            $amount = floatval($validated['amount']);

            $account = DB::table('accounts')
                ->join('customers', 'accounts.customer_id', '=', 'customers.id')
                ->where('accounts.account_no', $accountNo)
                ->select(
                    'accounts.*',
                    'customers.full_name',
                    'customers.email_address',
                    'customers.contact_number_primary',
                    'customers.desired_plan'
                )
                ->first();

            if (!$account) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Account not found'
                ], 404);
            }

            $dupCheck = DB::table('payment_portal_logs')
                ->where('account_id', $account->id)
                ->where('transaction_status', 'PENDING')
                ->where('date_time', '>', now()->subMinutes(5))
                ->first();

            if ($dupCheck) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You have a pending payment. Please wait a few minutes.',
                    'reference_no' => $dupCheck->reference_no,
                    'payment_url' => $dupCheck->payment_url
                ], 400);
            }

            $randomSuffix = bin2hex(random_bytes(10));
            $referenceNo = $accountNo . '-' . $randomSuffix;

            $redirectSuccess = $this->portalLink . '/payment-success?ref=' . $referenceNo;
            $redirectFail = $this->portalLink . '/payment-failed?ref=' . $referenceNo;

            $fullNameParts = explode(' ', trim($account->full_name ?? 'Customer'));
            $surname = (count($fullNameParts) > 1) ? array_pop($fullNameParts) : $fullNameParts[0];
            $givenName = implode(' ', $fullNameParts);
            if (empty($givenName)) {
                $givenName = $surname;
            }

            $mobile = preg_replace('/[^0-9]/', '', $account->contact_number_primary ?? '');
            if (strlen($mobile) === 10) {
                $mobile = '63' . $mobile;
            } elseif (strlen($mobile) === 11 && substr($mobile, 0, 1) === '0') {
                $mobile = '63' . substr($mobile, 1);
            }

            $payload = [
                'external_id' => $referenceNo,
                'amount' => $amount,
                'payer_email' => $account->email_address ?? 'noreply@atssfiber.ph',
                'description' => "Bill Payment - Account $accountNo",
                'invoice_duration' => 86400,
                'currency' => 'PHP',
                'customer' => [
                    'given_names' => $givenName,
                    'surname' => $surname,
                    'email' => $account->email_address ?? 'noreply@atssfiber.ph',
                    'mobile_number' => '+' . $mobile
                ],
                'items' => [
                    [
                        'name' => "Account $accountNo - " . ($account->desired_plan ?? 'Internet Service'),
                        'quantity' => 1,
                        'price' => $amount,
                        'category' => 'Internet Service'
                    ]
                ],
                'success_redirect_url' => $redirectSuccess,
                'failure_redirect_url' => $redirectFail
            ];

            $response = Http::withBasicAuth($this->xenditApiKey, '')
                ->timeout(30)
                ->post('https://api.xendit.co/v2/invoices', $payload);

            if (!$response->successful()) {
                Log::error('Xendit API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Payment gateway unavailable. Please try again later.'
                ], 500);
            }

            $xenditResponse = $response->json();
            $paymentId = $xenditResponse['id'] ?? null;
            $paymentUrl = $xenditResponse['invoice_url'] ?? null;

            if (!$paymentId || !$paymentUrl) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid response from payment gateway'
                ], 500);
            }

            DB::table('payment_portal_logs')->insert([
                'reference_no' => $referenceNo,
                'account_id' => $account->id,
                'total_amount' => $amount,
                'date_time' => now(),
                'checkout_id' => $paymentId,
                'status' => 'Pending',
                'transaction_status' => 'PENDING',
                'type' => 'Online',
                'payment_url' => $paymentUrl,
                'json_payload' => json_encode($payload)
            ]);

            Log::info('Payment created', [
                'reference_no' => $referenceNo,
                'account_no' => $accountNo,
                'amount' => $amount,
                'payment_id' => $paymentId
            ]);

            return response()->json([
                'status' => 'success',
                'reference_no' => $referenceNo,
                'payment_url' => $paymentUrl,
                'payment_id' => $paymentId,
                'amount' => $amount
            ]);

        } catch (Exception $e) {
            Log::error('Payment creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while creating payment'
            ], 500);
        }
    }

    public function handleWebhook(Request $request)
    {
        try {
            $incomingToken = $request->header('X-Callback-Token');

            if ($incomingToken !== $this->xenditCallbackToken) {
                Log::warning('Invalid webhook token', [
                    'ip' => $request->ip()
                ]);
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $payload = $request->all();
            $rawPayload = json_encode($payload);
            $referenceNo = $payload['external_id'] ?? null;
            $status = strtoupper($payload['status'] ?? '');

            if (!$referenceNo) {
                return response()->json(['message' => 'OK'], 200);
            }

            Log::info('Webhook received', [
                'reference_no' => $referenceNo,
                'status' => $status
            ]);

            $newStatus = 'PENDING';
            $isPaid = false;

            if (in_array($status, ['PAID', 'COMPLETED', 'SETTLED'])) {
                $isPaid = true;
                $newStatus = 'QUEUED';
            } elseif (in_array($status, ['EXPIRED', 'FAILED'])) {
                $newStatus = 'FAILED';
            }

            if ($newStatus !== 'PENDING') {
                DB::table('payment_portal_logs')
                    ->where('reference_no', $referenceNo)
                    ->where('transaction_status', '!=', 'PAID')
                    ->update([
                        'transaction_status' => $newStatus,
                        'status' => $isPaid ? 'Pending' : 'Failed',
                        'callback_payload' => $rawPayload
                    ]);

                Log::info('Payment status updated', [
                    'reference_no' => $referenceNo,
                    'new_status' => $newStatus
                ]);
            }

            return response()->json(['message' => 'OK'], 200);

        } catch (Exception $e) {
            Log::error('Webhook processing failed', [
                'error' => $e->getMessage()
            ]);

            return response()->json(['message' => 'OK'], 200);
        }
    }

    public function checkPaymentStatus(Request $request)
    {
        try {
            $referenceNo = $request->input('reference_no');

            if (!$referenceNo) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Reference number is required'
                ], 400);
            }

            $payment = DB::table('payment_portal_logs')
                ->where('reference_no', $referenceNo)
                ->first();

            if (!$payment) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Payment not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'payment' => [
                    'reference_no' => $payment->reference_no,
                    'amount' => $payment->total_amount,
                    'status' => $payment->status,
                    'transaction_status' => $payment->transaction_status,
                    'date_time' => $payment->date_time
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Payment status check failed', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check payment status'
            ], 500);
        }
    }
}
