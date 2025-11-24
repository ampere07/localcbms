<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/debug/transaction-relationships', function() {
    try {
        // Get a sample transaction
        $transaction = \App\Models\Transaction::latest()->first();
        
        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'No transactions found'
            ]);
        }
        
        // Get the billing account manually
        $billingAccount = \App\Models\BillingAccount::where('account_no', $transaction->account_no)->first();
        
        // Get customer if billing account exists
        $customer = null;
        if ($billingAccount) {
            $customer = \App\Models\Customer::find($billingAccount->customer_id);
        }
        
        return response()->json([
            'success' => true,
            'transaction' => [
                'id' => $transaction->id,
                'account_no' => $transaction->account_no,
                'account_no_type' => gettype($transaction->account_no)
            ],
            'billing_account' => $billingAccount ? [
                'id' => $billingAccount->id,
                'account_no' => $billingAccount->account_no,
                'customer_id' => $billingAccount->customer_id,
                'account_no_type' => gettype($billingAccount->account_no)
            ] : null,
            'customer' => $customer ? [
                'id' => $customer->id,
                'first_name' => $customer->first_name,
                'middle_initial' => $customer->middle_initial,
                'last_name' => $customer->last_name,
                'full_name' => $customer->full_name
            ] : null,
            'relationship_loaded' => $transaction->account ? true : false,
            'relationship_data' => $transaction->account,
            'columns_in_transactions' => \Illuminate\Support\Facades\Schema::getColumnListing('transactions')
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});
