<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class TransactionController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $transactions = Transaction::with(['account', 'processedByUser'])
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
            $validated = $request->validate([
                'account_id' => 'nullable|exists:billing_accounts,id',
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
            ]);

            DB::beginTransaction();

            $validated['date_processed'] = $validated['date_processed'] ?? now();
            $validated['status'] = $validated['status'] ?? 'Pending';
            $validated['created_by_user_id'] = Auth::id();
            $validated['updated_by_user_id'] = Auth::id();

            $transaction = Transaction::create($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaction created successfully',
                'data' => $transaction->load(['account', 'processedByUser'])
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating transaction: ' . $e->getMessage());
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
            $transaction = Transaction::with(['account', 'processedByUser'])
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

            $accountId = $transaction->account_id;
            $paymentReceived = $transaction->received_payment;
            $transactionId = $transaction->id;
            $userId = Auth::id();
            $currentTime = now();

            if (!$accountId) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction has no associated billing account'
                ], 400);
            }

            $billingAccount = \App\Models\BillingAccount::find($accountId);
            if (!$billingAccount) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Billing account not found'
                ], 404);
            }

            $currentBalance = floatval($billingAccount->account_balance ?? 0);
            $newBalance = $currentBalance - $paymentReceived;

            $billingAccount->account_balance = $newBalance;
            $billingAccount->balance_update_date = $currentTime;
            $billingAccount->updated_by = $userId;
            $billingAccount->save();

            $this->updateInvoiceDetails($accountId, $paymentReceived, $transactionId, $userId, $currentTime);

            $hasPendingTransactions = Transaction::where('account_id', $accountId)
                ->where('id', '!=', $id)
                ->where('status', 'Pending')
                ->exists();

            $newStatus = $hasPendingTransactions ? 'Partial' : 'Done';

            $transaction->status = $newStatus;
            $transaction->date_processed = $currentTime;
            $transaction->updated_by_user_id = $userId;
            $transaction->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaction approved successfully',
                'data' => [
                    'transaction' => $transaction,
                    'new_balance' => $newBalance,
                    'status' => $newStatus
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error approving transaction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function updateInvoiceDetails(int $accountId, float $paymentReceived, int $transactionId, ?int $userId, $currentTime): void
    {
        $invoices = \App\Models\Invoice::where('account_id', $accountId)
            ->whereIn('status', ['Unpaid', 'Partial'])
            ->orderBy('invoice_date', 'asc')
            ->get();

        $remainingPayment = $paymentReceived;

        foreach ($invoices as $invoice) {
            if ($remainingPayment <= 0) {
                break;
            }

            $totalAmount = floatval($invoice->total_amount ?? 0);
            $currentReceived = floatval($invoice->received_payment ?? 0);
            $amountDue = $totalAmount - $currentReceived;

            if ($remainingPayment >= $amountDue) {
                $invoice->received_payment = $totalAmount;
                $invoice->status = 'Paid';
                $remainingPayment -= $amountDue;
            } else {
                $invoice->received_payment = $currentReceived + $remainingPayment;
                $invoice->status = 'Partial';
                $remainingPayment = 0;
            }

            $invoice->transaction_id = $transactionId;
            $invoice->updated_by_user_id = $userId;
            $invoice->updated_at = $currentTime;
            $invoice->save();
        }
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
