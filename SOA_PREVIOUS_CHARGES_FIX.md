# SOA Previous Charges Fix - Implementation Summary

## Problem Identified

The "Previous Charges" section in the SOA PDF was not displaying the correct values from the latest Statement of Account record. The system was incorrectly using `account_balance` from the `billing_accounts` table instead of retrieving data from the most recent `statement_of_accounts` record.

## Root Cause

Two methods in `EnhancedBillingGenerationService` were not querying the `statement_of_accounts` table:

1. **`getPreviousBalance()`** - Was using `account->account_balance` instead of latest SOA `total_amount_due`
2. **`calculatePaymentReceived()`** - Was calculating from transactions table instead of using latest SOA payment data

## Solution Implemented

### 1. Updated `getPreviousBalance()` Method

**Before:**
```php
protected function getPreviousBalance(BillingAccount $account, Carbon $currentDate): float
{
    $accountBalance = floatval($account->account_balance);
    return $accountBalance;
}
```

**After:**
```php
protected function getPreviousBalance(BillingAccount $account, Carbon $currentDate): float
{
    // Get the most recent SOA
    $latestSOA = StatementOfAccount::where('account_no', $account->account_no)
        ->orderBy('statement_date', 'desc')
        ->orderBy('id', 'desc')
        ->first();
    
    if ($latestSOA) {
        // Use total_amount_due from latest SOA as previous balance
        return floatval($latestSOA->total_amount_due);
    }
    
    // Fallback to account_balance if no previous SOA exists
    return floatval($account->account_balance);
}
```

### 2. Updated `calculatePaymentReceived()` Method

**Before:**
```php
protected function calculatePaymentReceived(BillingAccount $account, Carbon $date): float
{
    $lastMonth = $date->copy()->subMonth();
    
    $transactions = DB::table('transactions')
        ->where('account_no', $account->account_no)
        ->where('status', 'Done')
        ->whereMonth('payment_date', $lastMonth->month)
        ->whereYear('payment_date', $lastMonth->year)
        ->sum('received_payment');

    return floatval($transactions);
}
```

**After:**
```php
protected function calculatePaymentReceived(BillingAccount $account, Carbon $date): float
{
    // Get the most recent SOA
    $latestSOA = StatementOfAccount::where('account_no', $account->account_no)
        ->orderBy('statement_date', 'desc')
        ->orderBy('id', 'desc')
        ->first();
    
    if ($latestSOA) {
        // Calculate payment as difference between previous total and remaining balance
        $payment = floatval($latestSOA->balance_from_previous_bill) 
                 - floatval($latestSOA->remaining_balance_previous);
        return $payment;
    }
    
    // Fallback to transaction-based calculation
    $lastMonth = $date->copy()->subMonth();
    $transactions = DB::table('transactions')
        ->where('account_no', $account->account_no)
        ->where('status', 'Done')
        ->whereMonth('payment_date', $lastMonth->month)
        ->whereYear('payment_date', $lastMonth->year)
        ->sum('received_payment');
    
    return floatval($transactions);
}
```

## How It Works Now

### Data Flow for Previous Charges Section

```
Latest SOA Record (statement_of_accounts table)
    ├─ total_amount_due → Balance from Previous Bill
    ├─ balance_from_previous_bill - remaining_balance_previous → Payment Received from Previous Bill
    └─ remaining_balance_previous → Remaining Balance from Previous Bill
```

### Example Calculation

**Latest SOA (Previous Period):**
- Balance from Previous Bill: ₱3,897.00
- Payment Received: ₱3,797.00
- Remaining Balance: ₱100.00
- Total Amount Due: ₱3,897.00

**New SOA (Current Period):**
- Balance from Previous Bill: **₱3,897.00** (from latest SOA `total_amount_due`)
- Payment Received: **₱3,797.00** (from latest SOA calculation)
- Remaining Balance: **₱100.00** (calculated: 3,897 - 3,797)

## Benefits

1. **Accurate Historical Data** - SOA now correctly references previous billing period data
2. **Data Consistency** - Uses single source of truth (statement_of_accounts table)
3. **Better Audit Trail** - Clear relationship between consecutive SOA records
4. **Fallback Protection** - Still works for first-time generation when no previous SOA exists

## Testing Steps

1. Generate SOA for an account that has previous billing records
2. Verify "Balance from Previous Bill" matches the latest SOA `total_amount_due`
3. Verify "Payment Received from Previous Bill" matches the payment calculation
4. Verify "Remaining Balance from Previous Bill" equals (Balance - Payment)
5. Check logs for confirmation of data source

## Log Messages

The updated methods now include comprehensive logging:

```
[INFO] Getting previous balance from latest SOA {
    "account_no": "A0001",
    "latest_soa_id": 45,
    "latest_soa_date": "2025-11-05",
    "total_amount_due": 3897.00,
    "previous_balance": 3897.00
}

[INFO] Calculating payment received from latest SOA {
    "account_no": "A0001",
    "latest_soa_id": 45,
    "balance_from_previous": 3897.00,
    "remaining_balance": 100.00,
    "payment_received": 3797.00
}
```

## Files Modified

- `backend/app/Services/EnhancedBillingGenerationService.php`
  - Updated `getPreviousBalance()` method (lines ~811-837)
  - Updated `calculatePaymentReceived()` method (lines ~730-772)

## Deployment Notes

1. No database migration required
2. No frontend changes needed
3. Backward compatible - works for accounts without previous SOA records
4. Test with sample data before production deployment
