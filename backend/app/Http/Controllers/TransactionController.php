<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\BillingAccount;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class TransactionController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $transactions = Transaction::with(['account.customer', 'account.technicalDetails', 'processedByUser'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $transactions,
                'count' => $transactions->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching transactions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            \Log::info('Transaction store request received', [
                'request_data' => $request->all()
            ]);

            $validated = $request->validate([
                'account_no' => 'nullable|exists:billing_accounts,account_no',
                'transaction_type' => 'required|in:Installation Fee,Recurring Fee,Security Deposit',
                'received_payment' => 'required|numeric|min:0',
                'payment_date' => 'required|date',
                'date_processed' => 'nullable|date',
                'processed_by_user_id' => 'nullable|exists:users,id',
                'payment_method' => 'required|string|max:255',
                'reference_no' => 'required|string|max:255',
                'or_no' => 'required|string|max:255',
                'remarks' => 'nullable|string',
                'status' => 'nullable|string|max:100',
                'image_url' => 'nullable|string|max:255',
                'auto_apply_payment' => 'nullable|boolean',
            ]);

            \Log::info('Transaction validation passed', [
                'validated_data' => $validated
            ]);

            DB::beginTransaction();

            $validated['date_processed'] = $validated['date_processed'] ?? now();
            $validated['status'] = $validated['status'] ?? 'Pending';
            $validated['created_by_user_id'] = Auth::id();
            $validated['updated_by_user_id'] = Auth::id();

            $autoApplyPayment = $validated['auto_apply_payment'] ?? false;
            unset($validated['auto_apply_payment']);

            \Log::info('Creating transaction record', [
                'data_to_create' => $validated
            ]);

            $transaction = Transaction::create($validated);

            \Log::info('Transaction record created', [
                'transaction_id' => $transaction->id,
                'account_no' => $transaction->account_no
            ]);

            if ($autoApplyPayment && $transaction->account_no) {
                \Log::info('Auto-applying payment', [
                    'transaction_id' => $transaction->id,
                    'account_no' => $transaction->account_no
                ]);

                $billingAccount = BillingAccount::where('account_no', $transaction->account_no)->first();
                if ($billingAccount) {
                    $this->applyPaymentToAccount(
                        $billingAccount->id,
                        $transaction->account_no,
                        $transaction->received_payment,
                        $transaction->id,
                        Auth::id(),
                        now()
                    );

                    $transaction->status = 'Done';
                    $transaction->save();

                    \Log::info('Payment auto-applied successfully', [
                        'transaction_id' => $transaction->id
                    ]);
                } else {
                    \Log::warning('Billing account not found for auto-apply', [
                        'account_no' => $transaction->account_no
                    ]);
                }
            }

            DB::commit();

            \Log::info('Transaction created successfully', [
                'transaction_id' => $transaction->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Transaction created successfully',
                'data' => $transaction->load(['account.customer', 'account.technicalDetails', 'processedByUser'])
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            \Log::error('Transaction validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating transaction', [
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $transaction = Transaction::with(['account.customer', 'account.technicalDetails', 'processedByUser'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $transaction
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching transaction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function approve(string $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $transaction = Transaction::findOrFail($id);

            if ($transaction->status !== 'Pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending transactions can be approved'
                ], 400);
            }

            $accountNo = $transaction->account_no;
            $paymentReceived = $transaction->received_payment;
            $transactionId = $transaction->id;
            $userId = Auth::id();
            $currentTime = now();

            if (!$accountNo) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction has no associated account number'
                ], 400);
            }

            $billingAccount = BillingAccount::where('account_no', $accountNo)->first();
            if (!$billingAccount) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Billing account not found'
                ], 404);
            }

            \Log::info('Transaction approval started', [
                'transaction_id' => $transactionId,
                'account_no' => $accountNo,
                'account_id' => $billingAccount->id,
                'payment_received' => $paymentReceived,
                'current_balance' => $billingAccount->account_balance
            ]);

            $currentBalance = floatval($billingAccount->account_balance ?? 0);
            $newBalance = $currentBalance - $paymentReceived;

            $billingAccount->account_balance = round($newBalance, 2);
            $billingAccount->balance_update_date = $currentTime;
            $billingAccount->updated_by = $userId;
            $billingAccount->save();

            \Log::info('Account balance updated', [
                'account_no' => $accountNo,
                'account_id' => $billingAccount->id,
                'old_balance' => $currentBalance,
                'new_balance' => $newBalance,
                'payment_applied' => $paymentReceived
            ]);

            $invoiceUpdateResult = $this->updateInvoiceDetails($accountNo, $paymentReceived, $transactionId, $userId, $currentTime);

            $transaction->status = 'Done';
            $transaction->date_processed = $currentTime;
            $transaction->updated_by_user_id = $userId;
            $transaction->save();

            DB::commit();

            \Log::info('Transaction approved successfully', [
                'transaction_id' => $transactionId,
                'account_no' => $accountNo,
                'status' => 'Done',
                'invoices_paid' => $invoiceUpdateResult['invoices_paid'],
                'invoices_partial' => $invoiceUpdateResult['invoices_partial']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Transaction approved successfully',
                'data' => [
                    'transaction' => $transaction,
                    'new_balance' => $newBalance,
                    'status' => 'Done',
                    'invoices_paid' => $invoiceUpdateResult['invoices_paid'],
                    'invoices_partial' => $invoiceUpdateResult['invoices_partial'],
                    'payment_distribution' => $invoiceUpdateResult['distribution']
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error approving transaction: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function applyPaymentToAccount(int $accountId, string $accountNo, float $paymentReceived, int $transactionId, ?int $userId, $currentTime): array
    {
        $billingAccount = BillingAccount::find($accountId);
        if (!$billingAccount) {
            throw new \Exception('Billing account not found');
        }

        $currentBalance = floatval($billingAccount->account_balance ?? 0);
        $newBalance = $currentBalance - $paymentReceived;

        $billingAccount->account_balance = round($newBalance, 2);
        $billingAccount->balance_update_date = $currentTime;
        $billingAccount->updated_by = $userId;
        $billingAccount->save();

        $invoiceResults = $this->updateInvoiceDetails($accountNo, $paymentReceived, $transactionId, $userId, $currentTime);

        return [
            'old_balance' => $currentBalance,
            'new_balance' => $newBalance,
            'payment_applied' => $paymentReceived,
            'invoices_updated' => $invoiceResults
        ];
    }

    private function updateInvoiceDetails(string $accountNo, float $paymentReceived, int $transactionId, ?int $userId, $currentTime): array
    {
        $invoices = \App\Models\Invoice::where('account_no', $accountNo)
            ->whereIn('status', ['Unpaid', 'Partial'])
            ->orderBy('invoice_date', 'asc')
            ->get();

        \Log::info('Processing invoices for payment', [
            'account_no' => $accountNo,
            'payment_amount' => $paymentReceived,
            'unpaid_invoices_count' => $invoices->count()
        ]);

        $remainingPayment = $paymentReceived;
        $invoicesPaid = [];
        $invoicesPartial = [];
        $distribution = [];

        foreach ($invoices as $invoice) {
            if ($remainingPayment <= 0) {
                break;
            }

            $totalAmount = floatval($invoice->total_amount ?? 0);
            $currentReceived = floatval($invoice->received_payment ?? 0);
            $amountDue = $totalAmount - $currentReceived;

            \Log::info('Processing invoice', [
                'invoice_id' => $invoice->id,
                'total_amount' => $totalAmount,
                'current_received' => $currentReceived,
                'amount_due' => $amountDue,
                'remaining_payment' => $remainingPayment
            ]);

            $paymentApplied = 0;

            if ($remainingPayment >= $amountDue) {
                $invoice->received_payment = round($totalAmount, 2);
                $invoice->status = 'Paid';
                $paymentApplied = $amountDue;
                $remainingPayment -= $amountDue;
                $invoicesPaid[] = [
                    'invoice_id' => $invoice->id,
                    'invoice_date' => $invoice->invoice_date,
                    'amount_paid' => $amountDue,
                    'total_amount' => $totalAmount,
                    'status' => 'Paid'
                ];
                \Log::info('Invoice fully paid', [
                    'invoice_id' => $invoice->id,
                    'amount_paid' => $amountDue,
                    'remaining_payment' => $remainingPayment
                ]);
            } else {
                $invoice->received_payment = round($currentReceived + $remainingPayment, 2);
                $invoice->status = 'Partial';
                $paymentApplied = $remainingPayment;
                $invoicesPartial[] = [
                    'invoice_id' => $invoice->id,
                    'invoice_date' => $invoice->invoice_date,
                    'amount_paid' => $remainingPayment,
                    'amount_due' => $amountDue - $remainingPayment,
                    'total_amount' => $totalAmount,
                    'status' => 'Partial'
                ];
                \Log::info('Invoice partially paid', [
                    'invoice_id' => $invoice->id,
                    'amount_paid' => $remainingPayment,
                    'new_received' => $invoice->received_payment,
                    'still_owed' => $amountDue - $remainingPayment
                ]);
                $remainingPayment = 0;
            }

            $distribution[] = [
                'invoice_id' => $invoice->id,
                'invoice_date' => $invoice->invoice_date,
                'total_amount' => $totalAmount,
                'previous_received' => $currentReceived,
                'payment_applied' => $paymentApplied,
                'new_received' => $invoice->received_payment,
                'status' => $invoice->status
            ];

            $invoice->transaction_id = $transactionId;
            $invoice->updated_by_user_id = $userId;
            $invoice->updated_at = $currentTime;
            $invoice->save();
        }

        \Log::info('Invoice payment distribution complete', [
            'total_payment' => $paymentReceived,
            'remaining_payment' => $remainingPayment,
            'invoices_paid_count' => count($invoicesPaid),
            'invoices_partial_count' => count($invoicesPartial)
        ]);

        return [
            'invoices_paid' => $invoicesPaid,
            'invoices_partial' => $invoicesPartial,
            'distribution' => $distribution,
            'remaining_payment' => $remainingPayment
        ];
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        try {
            $request->validate([
                'status' => 'required|string|in:Pending,Done,Processing,Cancelled'
            ]);

            DB::beginTransaction();

            $transaction = Transaction::findOrFail($id);
            $transaction->status = $request->status;
            $transaction->updated_by_user_id = Auth::id();
            $transaction->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaction status updated successfully',
                'data' => $transaction
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating transaction status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update transaction status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function uploadImages(Request $request): JsonResponse
    {
        try {
            $folderName = $request->input('folder_name', 'transactions');
            
            $googleDriveService = new \App\Services\GoogleDriveService();
            $folderId = $googleDriveService->createFolder($folderName);
            
            $imageUrls = [];
            
            if ($request->hasFile('payment_proof_image')) {
                $file = $request->file('payment_proof_image');
                $fileName = 'payment_proof_' . time() . '.' . $file->getClientOriginalExtension();
                
                $fileUrl = $googleDriveService->uploadFile(
                    $file,
                    $folderId,
                    $fileName,
                    $file->getMimeType()
                );
                
                if ($fileUrl) {
                    $imageUrls['payment_proof_image_url'] = $fileUrl;
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Images uploaded successfully',
                'data' => $imageUrls,
                'folder_id' => $folderId
            ]);
        } catch (\Exception $e) {
            \Log::error('Error uploading transaction images: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload images',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
