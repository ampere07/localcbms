# SOA Fix Implementation Checklist

## Pre-Implementation Verification

- [ ] Backend server is running on correct port
- [ ] Database connection is active
- [ ] Have access to email_templates table
- [ ] Have test account with billing data
- [ ] Can generate SOA records

## Code Changes Applied

### PdfGenerationService.php
- [ ] Added Amount_Discounts variable mapping
- [ ] Added Amount_Rebates variable mapping
- [ ] Added Amount_Service variable mapping
- [ ] Added Amount_Install variable mapping
- [ ] Added Label_Discounts conditional mapping
- [ ] Added Label_Rebates conditional mapping
- [ ] Added Label_Service conditional mapping
- [ ] Added Label_Install conditional mapping
- [ ] Added PDF data preparation logging

### EnhancedBillingGenerationService.php
- [ ] Updated getPreviousBalance() to query statement_of_accounts
- [ ] Updated calculatePaymentReceived() to use SOA data
- [ ] Added comprehensive logging for both methods

## Template Update Required

- [ ] Log into application admin panel
- [ ] Navigate to Email Templates management
- [ ] Find SOA_DESIGN template
- [ ] Update "Others and Basic Charges" section with proper variables
- [ ] Choose template style (static labels, dynamic labels, or row templates)
- [ ] Save template changes
- [ ] Mark template as Active

## Testing Phase

### 1. Database Verification
- [ ] Run query: Check latest SOA has data in discounts/rebate/service_charge/staggered columns
- [ ] Run query: Verify previous balance matches latest SOA total_amount_due
- [ ] Run query: Verify payment calculation is correct
- [ ] Run query: Check rebate values are not all zero

### 2. Generate Test SOA
- [ ] Navigate to Billing Generation in application
- [ ] Select test account (preferably with rebates)
- [ ] Click "Generate Sample Data" or trigger generation
- [ ] Wait for completion message
- [ ] Note the SOA ID generated

### 3. Log Verification
- [ ] Open Laravel log file: storage/logs/laravel.log
- [ ] Search for: "PDF data prepared for template"
- [ ] Verify log shows correct account_no
- [ ] Verify log shows soa_id
- [ ] Check Amount_Discounts value in log
- [ ] Check Amount_Rebates value in log
- [ ] Check Amount_Service value in log
- [ ] Check Amount_Install value in log
- [ ] Verify values match database query results

### 4. PDF Output Verification
- [ ] Locate generated PDF file
- [ ] Open PDF in viewer
- [ ] Check "Previous Charges" section shows correct values
- [ ] Check "Balance from Previous Bill" matches database
- [ ] Check "Payment Received" matches database
- [ ] Check "Remaining Balance" matches database
- [ ] Check "Monthly Service Fee" is correct
- [ ] Check "Others and Basic Charges" section exists
- [ ] Verify Discounts value (if applicable)
- [ ] Verify Rebates value (should show 86.60 if test data has it)
- [ ] Verify Service Charge value
- [ ] Verify Staggered Payment value
- [ ] Check labels appear/disappear correctly based on values
- [ ] Verify "Amount Due" is correct
- [ ] Verify "Total Amount Due" is correct

### 5. Edge Case Testing
- [ ] Test with account that has NO previous SOA (first generation)
- [ ] Test with account that has zero values for all charges
- [ ] Test with account that has all charges populated
- [ ] Test with account that has only rebates
- [ ] Test with account that has only discounts

## Verification Queries

### Query 1: Latest SOA Data
```sql
SELECT * FROM statement_of_accounts 
WHERE account_no = 'YOUR_TEST_ACCOUNT' 
ORDER BY statement_date DESC LIMIT 1;
```
- [ ] Query executed successfully
- [ ] Results match PDF values

### Query 2: Variable Mapping Check
```sql
SELECT 
    FORMAT(discounts, 2) AS Amount_Discounts,
    FORMAT(rebate, 2) AS Amount_Rebates,
    FORMAT(service_charge, 2) AS Amount_Service,
    FORMAT(staggered, 2) AS Amount_Install
FROM statement_of_accounts 
WHERE account_no = 'YOUR_TEST_ACCOUNT' 
ORDER BY statement_date DESC LIMIT 1;
```
- [ ] Query executed successfully
- [ ] Results match PDF "Others and Basic Charges" section

### Query 3: Previous Balance Verification
```sql
SELECT 
    'Current' AS type, balance_from_previous_bill
FROM statement_of_accounts 
WHERE account_no = 'YOUR_TEST_ACCOUNT' 
ORDER BY statement_date DESC LIMIT 1
UNION ALL
SELECT 
    'Previous' AS type, total_amount_due
FROM statement_of_accounts 
WHERE account_no = 'YOUR_TEST_ACCOUNT' 
ORDER BY statement_date DESC LIMIT 1 OFFSET 1;
```
- [ ] Query executed successfully
- [ ] Current balance_from_previous_bill matches Previous total_amount_due

## Post-Implementation Verification

### Functionality Checks
- [ ] SOA generation completes without errors
- [ ] PDF files are created successfully
- [ ] All template variables are replaced (no {{Variable}} text remains)
- [ ] Values are formatted correctly (2 decimal places)
- [ ] Labels appear/disappear based on values
- [ ] Previous charges section shows accurate historical data
- [ ] Current charges section calculates correctly
- [ ] Others and Basic Charges section shows all applicable charges

### Performance Checks
- [ ] Generation time is acceptable (check logs for duration)
- [ ] No timeout errors during generation
- [ ] PDF file size is reasonable
- [ ] Multiple concurrent generations work correctly

### Data Integrity Checks
- [ ] Previous SOA data is not modified during new generation
- [ ] Account balance updates correctly after invoice generation
- [ ] Rebate usage status updates correctly
- [ ] Discount status updates correctly
- [ ] Staggered payment months_to_pay decrements correctly

## Rollback Plan (If Issues Found)

### Code Rollback
- [ ] Backup modified files before implementation
- [ ] Keep original getPreviousBalance() logic
- [ ] Keep original calculatePaymentReceived() logic
- [ ] Keep original preparePdfData() method
- [ ] Document any custom changes made

### Template Rollback
- [ ] Export current SOA_DESIGN template before changes
- [ ] Save backup as SOA_DESIGN_BACKUP in database
- [ ] Can restore previous template if needed

### Database Rollback
- [ ] No database schema changes made (rollback not needed)
- [ ] Generated SOA records can be deleted if needed

## Documentation Review

- [ ] Read SOA_PREVIOUS_CHARGES_FIX.md
- [ ] Read SOA_PDF_TEMPLATE_VARIABLES.md
- [ ] Read QUICK_GUIDE_SOA_TEMPLATE_UPDATE.md
- [ ] Read SOA_DATA_VERIFICATION_SQL.md
- [ ] Read SOA_OTHERS_CHARGES_FIX_SUMMARY.md

## Production Deployment

### Pre-Deployment
- [ ] All tests passed in development environment
- [ ] Template updated and tested
- [ ] Log files reviewed for errors
- [ ] Backup production database
- [ ] Backup production code files

### Deployment Steps
- [ ] Deploy updated PdfGenerationService.php
- [ ] Deploy updated EnhancedBillingGenerationService.php
- [ ] Update SOA_DESIGN template in production database
- [ ] Clear application cache if applicable
- [ ] Restart queue workers if using queues

### Post-Deployment
- [ ] Generate test SOA in production
- [ ] Verify PDF output matches expected format
- [ ] Check production logs for errors
- [ ] Monitor for any user-reported issues
- [ ] Document any production-specific issues

## Support and Maintenance

### Known Issues Log
- [ ] Document any issues encountered during testing
- [ ] Document workarounds or solutions applied
- [ ] Create tickets for any bugs found
- [ ] Update documentation with lessons learned

### Monitoring
- [ ] Monitor Laravel logs daily for PDF generation errors
- [ ] Check storage space for PDF files
- [ ] Monitor database for SOA records growth
- [ ] Track generation performance metrics

## Sign-off

- [ ] Developer testing completed
- [ ] Code review completed (if applicable)
- [ ] QA testing completed (if applicable)
- [ ] Documentation reviewed and approved
- [ ] Production deployment approved
- [ ] User acceptance testing completed

---

**Implementation Date**: __________________

**Implemented By**: __________________

**Verified By**: __________________

**Approved By**: __________________

**Notes**:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
