# SOA "Others and Basic Charges" Fix - Complete Summary

## Issue Reported

The "Others and Basic Charges" section in the SOA PDF was showing empty values (0.00) even when data existed in the `statement_of_accounts` table.

### Screenshots Analysis
- **Image 1**: PDF template showing placeholders: `{{Label_Discounts}}`, `{{Amount_Discounts}}`, etc.
- **Image 2**: Database showing actual values: rebate = 86.60, but PDF showing 0.00

## Root Cause

The `PdfGenerationService.php` was not mapping the individual charge columns from the `statement_of_accounts` table to template variables. The template was trying to use `{{Amount_Discounts}}`, `{{Amount_Rebates}}`, etc., but these variables did not exist in the data array.

## Solution Implemented

### 1. Updated `PdfGenerationService.php`

Added new template variables to the `preparePdfData()` method:

```php
// Others and Basic Charges - Individual amounts
'Amount_Discounts' => number_format($soa->discounts, 2),
'Amount_Rebates' => number_format($soa->rebate, 2),
'Amount_Service' => number_format($soa->service_charge, 2),
'Amount_Install' => number_format($soa->staggered, 2),

// Others and Basic Charges - Labels
'Label_Discounts' => $soa->discounts > 0 ? '- Discounts' : '',
'Label_Rebates' => $soa->rebate > 0 ? '- Rebates' : '',
'Label_Service' => $soa->service_charge > 0 ? 'Service Charge' : '',
'Label_Install' => $soa->staggered > 0 ? 'Staggered Payment' : ''
```

### 2. Added Debug Logging

Added comprehensive logging to track PDF data preparation:

```php
Log::info('PDF data prepared for template', [
    'document_type' => $documentType,
    'account_no' => $account->account_no,
    'soa_id' => $soa?->id,
    'data_keys' => array_keys($pdfData),
    'sample_data' => [
        'Amount_Discounts' => $pdfData['Amount_Discounts'] ?? 'not set',
        'Amount_Rebates' => $pdfData['Amount_Rebates'] ?? 'not set',
        'Amount_Service' => $pdfData['Amount_Service'] ?? 'not set',
        'Amount_Install' => $pdfData['Amount_Install'] ?? 'not set',
    ]
]);
```

### 3. Fixed Previous Balance Calculation

Updated `getPreviousBalance()` to use the latest SOA record instead of account_balance:

```php
$latestSOA = StatementOfAccount::where('account_no', $account->account_no)
    ->orderBy('statement_date', 'desc')
    ->orderBy('id', 'desc')
    ->first();

if ($latestSOA) {
    return floatval($latestSOA->total_amount_due);
}
```

### 4. Fixed Payment Received Calculation

Updated `calculatePaymentReceived()` to use SOA data:

```php
if ($latestSOA) {
    $payment = floatval($latestSOA->balance_from_previous_bill) 
             - floatval($latestSOA->remaining_balance_previous);
    return $payment;
}
```

## Available Template Variables

### New Variables Added

| Template Variable | Database Column | Example Value | Notes |
|-------------------|-----------------|---------------|-------|
| `{{Amount_Discounts}}` | discounts | 0.00 | Always formatted |
| `{{Amount_Rebates}}` | rebate | 86.60 | Always formatted |
| `{{Amount_Service}}` | service_charge | 0.00 | Always formatted |
| `{{Amount_Install}}` | staggered | 0.00 | Always formatted |
| `{{Label_Discounts}}` | (conditional) | "- Discounts" or "" | Empty if amount = 0 |
| `{{Label_Rebates}}` | (conditional) | "- Rebates" or "" | Empty if amount = 0 |
| `{{Label_Service}}` | (conditional) | "Service Charge" or "" | Empty if amount = 0 |
| `{{Label_Install}}` | (conditional) | "Staggered Payment" or "" | Empty if amount = 0 |

### Existing Variables (Still Work)

| Template Variable | Purpose |
|-------------------|---------|
| `{{Row_Discounts}}` | Complete HTML row for discounts |
| `{{Row_Rebates}}` | Complete HTML row for rebates |
| `{{Row_Service}}` | Complete HTML row for service charge |
| `{{Row_Staggered}}` | Complete HTML row for staggered payment |

## Template Update Required

The email template (`SOA_DESIGN`) in the database needs to be updated to properly display the values.

### Option 1: Static Labels (Always Show All Rows)
```html
<h3>Others and Basic Charges</h3>
<table>
  <tr><td>- Discounts</td><td>{{Amount_Discounts}}</td></tr>
  <tr><td>- Rebates</td><td>{{Amount_Rebates}}</td></tr>
  <tr><td>Service Charge</td><td>{{Amount_Service}}</td></tr>
  <tr><td>Staggered Payment</td><td>{{Amount_Install}}</td></tr>
</table>
```

### Option 2: Dynamic Labels (Auto-hide When Zero)
```html
<h3>Others and Basic Charges</h3>
<table>
  <tr><td>{{Label_Discounts}}</td><td>{{Amount_Discounts}}</td></tr>
  <tr><td>{{Label_Rebates}}</td><td>{{Amount_Rebates}}</td></tr>
  <tr><td>{{Label_Service}}</td><td>{{Amount_Service}}</td></tr>
  <tr><td>{{Label_Install}}</td><td>{{Amount_Install}}</td></tr>
</table>
```

### Option 3: Complete HTML Rows (Legacy Support)
```html
<h3>Others and Basic Charges</h3>
<table>
  {{Row_Discounts}}
  {{Row_Rebates}}
  {{Row_Service}}
  {{Row_Staggered}}
</table>
```

## Testing Procedure

### 1. Generate Test SOA
```bash
# In your application
1. Navigate to Billing Generation
2. Click "Generate Sample Data"
3. Wait for completion
```

### 2. Verify Database Values
```sql
SELECT 
    id, account_no,
    FORMAT(discounts, 2) AS discounts,
    FORMAT(rebate, 2) AS rebate,
    FORMAT(service_charge, 2) AS service_charge,
    FORMAT(staggered, 2) AS staggered
FROM statement_of_accounts
WHERE account_no = 'A0001'
ORDER BY statement_date DESC
LIMIT 1;
```

### 3. Check Laravel Logs
```bash
# Look for this log entry
[INFO] PDF data prepared for template {
    "sample_data": {
        "Amount_Discounts": "0.00",
        "Amount_Rebates": "86.60",
        "Amount_Service": "0.00",
        "Amount_Install": "0.00"
    }
}
```

### 4. Verify PDF Output
```
1. Open generated SOA PDF
2. Check "Others and Basic Charges" section
3. Verify:
   - Rebates shows 86.60 (if applicable)
   - All other values show correctly
   - Labels appear/disappear based on values
```

## Files Modified

1. **backend/app/Services/PdfGenerationService.php**
   - Added Amount_X and Label_X variables
   - Added debug logging
   - Lines modified: ~240-270

2. **backend/app/Services/EnhancedBillingGenerationService.php**
   - Fixed getPreviousBalance() method
   - Fixed calculatePaymentReceived() method
   - Lines modified: ~730-772, ~811-837

## Documentation Created

1. **SOA_PREVIOUS_CHARGES_FIX.md** - Details about previous balance fix
2. **SOA_PDF_TEMPLATE_VARIABLES.md** - Complete variable reference
3. **QUICK_GUIDE_SOA_TEMPLATE_UPDATE.md** - Step-by-step template update guide
4. **SOA_DATA_VERIFICATION_SQL.md** - SQL queries for testing
5. **SOA_OTHERS_CHARGES_FIX_SUMMARY.md** - This document

## Benefits of This Fix

1. **Accurate Data Display** - All charges now show correct values from database
2. **Flexible Templates** - Multiple template options (static, dynamic, legacy)
3. **Better Debugging** - Comprehensive logs for troubleshooting
4. **Backward Compatible** - Old row templates still work
5. **Single Source of Truth** - All data from statement_of_accounts table

## Common Issues and Solutions

### Issue: Variables Still Showing as Placeholders
**Solution**: Check template variable names are exact (case-sensitive)

### Issue: All Values Showing 0.00
**Solution**: Verify SOA object is passed to generateBillingPdf()

### Issue: Labels Not Hiding When Zero
**Solution**: Use `{{Label_X}}` variables instead of static text

### Issue: Previous Balance Wrong
**Solution**: Verify getPreviousBalance() queries statement_of_accounts

## Next Steps

1. Update the `SOA_DESIGN` template in email_templates table
2. Generate test SOA for an account with rebates
3. Verify PDF shows correct values
4. Check logs confirm data is being passed
5. Deploy to production after testing

## Support

For issues or questions:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Run verification SQL queries from SOA_DATA_VERIFICATION_SQL.md
3. Review template variables from SOA_PDF_TEMPLATE_VARIABLES.md
4. Verify template syntax matches examples in QUICK_GUIDE_SOA_TEMPLATE_UPDATE.md
