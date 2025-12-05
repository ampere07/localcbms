# Check and Fix SOA_DESIGN Template

## Step 1: Check Current Template Content

```sql
SELECT 
    Template_Code,
    Subject_Line,
    LEFT(Body_HTML, 500) AS Body_HTML_Preview,
    Is_Active,
    created_at,
    updated_at
FROM email_templates
WHERE Template_Code = 'SOA_DESIGN';
```

## Step 2: Check if Template Uses Old or New Variables

```sql
-- Check for old placeholder format (incorrect)
SELECT 
    Template_Code,
    CASE 
        WHEN Body_HTML LIKE '%{{Label_Discounts}}%' THEN 'Using Label variables'
        WHEN Body_HTML LIKE '%{{Amount_Discounts}}%' THEN 'Using Amount variables'
        WHEN Body_HTML LIKE '%{{Row_Discounts}}%' THEN 'Using Row variables'
        ELSE 'NOT using any charge variables'
    END AS variable_type,
    CASE
        WHEN Body_HTML LIKE '%{{Label_Discounts}}%' 
         AND Body_HTML LIKE '%{{Amount_Discounts}}%' THEN 'Complete (Label + Amount)'
        WHEN Body_HTML LIKE '%{{Row_Discounts}}%' THEN 'Using legacy Row format'
        ELSE 'Incomplete or missing'
    END AS completeness
FROM email_templates
WHERE Template_Code = 'SOA_DESIGN';
```

## Step 3: Sample Correct Template Structure

### Option A: Using Static Labels (Recommended)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; font-size: 10pt; margin: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; }
        .section-header { background-color: #f0f0f0; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; }
        .amount { text-align: right; }
    </style>
</head>
<body>
    <h1>BILLING SUMMARY</h1>
    
    <!-- Previous Charges Section -->
    <h2>Previous Charges</h2>
    <table>
        <tr>
            <td>Balance from Previous Bill</td>
            <td class="amount">{{Prev_Balance}}</td>
        </tr>
        <tr>
            <td>Payment Received from Previous Bill</td>
            <td class="amount">{{Prev_Payment}}</td>
        </tr>
        <tr>
            <td>Remaining Balance from Previous Bill</td>
            <td class="amount">{{Rem_Balance}}</td>
        </tr>
    </table>
    
    <!-- Current Charges Section -->
    <h2>Current Charges</h2>
    <table>
        <tr>
            <td>Monthly Service Fee</td>
            <td class="amount">{{Monthly_Fee}}</td>
        </tr>
    </table>
    
    <!-- Others and Basic Charges Section -->
    <h3>Others and Basic Charges</h3>
    <table>
        <tr>
            <td>- Discounts</td>
            <td class="amount">{{Amount_Discounts}}</td>
        </tr>
        <tr>
            <td>- Rebates</td>
            <td class="amount">{{Amount_Rebates}}</td>
        </tr>
        <tr>
            <td>Service Charge</td>
            <td class="amount">{{Amount_Service}}</td>
        </tr>
        <tr>
            <td>Staggered Payment</td>
            <td class="amount">{{Amount_Install}}</td>
        </tr>
    </table>
    
    <!-- Due Date and Amount Section -->
    <table style="margin-top: 20px;">
        <tr class="section-header">
            <td><strong>DUE DATE</strong></td>
            <td class="amount"><strong>AMOUNT DUE</strong></td>
        </tr>
        <tr>
            <td>PLEASE pay on or before {{Due_Date}}</td>
            <td class="amount"><strong>{{Total_Due}}</strong></td>
        </tr>
    </table>
</body>
</html>
```

### Option B: Using Dynamic Labels (Auto-hide when zero)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; font-size: 10pt; margin: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; }
        .section-header { background-color: #f0f0f0; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; }
        .amount { text-align: right; }
        tr:empty { display: none; }
    </style>
</head>
<body>
    <h1>BILLING SUMMARY</h1>
    
    <!-- Previous Charges Section -->
    <h2>Previous Charges</h2>
    <table>
        <tr>
            <td>Balance from Previous Bill</td>
            <td class="amount">{{Prev_Balance}}</td>
        </tr>
        <tr>
            <td>Payment Received from Previous Bill</td>
            <td class="amount">{{Prev_Payment}}</td>
        </tr>
        <tr>
            <td>Remaining Balance from Previous Bill</td>
            <td class="amount">{{Rem_Balance}}</td>
        </tr>
    </table>
    
    <!-- Current Charges Section -->
    <h2>Current Charges</h2>
    <table>
        <tr>
            <td>Monthly Service Fee</td>
            <td class="amount">{{Monthly_Fee}}</td>
        </tr>
    </table>
    
    <!-- Others and Basic Charges Section (Dynamic - only shows if not empty) -->
    <h3>Others and Basic Charges</h3>
    <table>
        <tr>
            <td>{{Label_Discounts}}</td>
            <td class="amount">{{Amount_Discounts}}</td>
        </tr>
        <tr>
            <td>{{Label_Rebates}}</td>
            <td class="amount">{{Amount_Rebates}}</td>
        </tr>
        <tr>
            <td>{{Label_Service}}</td>
            <td class="amount">{{Amount_Service}}</td>
        </tr>
        <tr>
            <td>{{Label_Install}}</td>
            <td class="amount">{{Amount_Install}}</td>
        </tr>
    </table>
    
    <!-- Due Date and Amount Section -->
    <table style="margin-top: 20px;">
        <tr class="section-header">
            <td><strong>DUE DATE</strong></td>
            <td class="amount"><strong>AMOUNT DUE</strong></td>
        </tr>
        <tr>
            <td>PLEASE pay on or before {{Due_Date}}</td>
            <td class="amount"><strong>{{Total_Due}}</strong></td>
        </tr>
    </table>
</body>
</html>
```

### Option C: Using Row Variables (Legacy)

```html
<!-- Others and Basic Charges Section -->
<h3>Others and Basic Charges</h3>
<table>
    {{Row_Discounts}}
    {{Row_Rebates}}
    {{Row_Service}}
    {{Row_Staggered}}
</table>
```

## Step 4: Update Template via SQL

### Quick Fix - Update to use static labels:

```sql
UPDATE email_templates
SET Body_HTML = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; font-size: 10pt; margin: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; }
        .amount { text-align: right; }
    </style>
</head>
<body>
    <h1>BILLING SUMMARY</h1>
    
    <h2>Previous Charges</h2>
    <table>
        <tr>
            <td>Balance from Previous Bill</td>
            <td class="amount">{{Prev_Balance}}</td>
        </tr>
        <tr>
            <td>Payment Received from Previous Bill</td>
            <td class="amount">{{Prev_Payment}}</td>
        </tr>
        <tr>
            <td>Remaining Balance from Previous Bill</td>
            <td class="amount">{{Rem_Balance}}</td>
        </tr>
    </table>
    
    <h2>Current Charges</h2>
    <table>
        <tr>
            <td>Monthly Service Fee</td>
            <td class="amount">{{Monthly_Fee}}</td>
        </tr>
    </table>
    
    <h3>Others and Basic Charges</h3>
    <table>
        <tr>
            <td>- Discounts</td>
            <td class="amount">{{Amount_Discounts}}</td>
        </tr>
        <tr>
            <td>- Rebates</td>
            <td class="amount">{{Amount_Rebates}}</td>
        </tr>
        <tr>
            <td>Service Charge</td>
            <td class="amount">{{Amount_Service}}</td>
        </tr>
        <tr>
            <td>Staggered Payment</td>
            <td class="amount">{{Amount_Install}}</td>
        </tr>
    </table>
    
    <table style="margin-top: 20px; border-top: 2px solid #000;">
        <tr>
            <td><strong>DUE DATE</strong></td>
            <td class="amount"><strong>AMOUNT DUE</strong></td>
        </tr>
        <tr>
            <td>PLEASE pay on or before {{Due_Date}}</td>
            <td class="amount"><strong>{{Total_Due}}</strong></td>
        </tr>
    </table>
</body>
</html>
',
updated_at = NOW()
WHERE Template_Code = 'SOA_DESIGN';
```

## Step 5: Verify Update

```sql
SELECT 
    Template_Code,
    Subject_Line,
    CASE
        WHEN Body_HTML LIKE '%{{Amount_Discounts}}%' THEN 'UPDATED - Has Amount variables'
        ELSE 'NOT UPDATED'
    END AS update_status,
    Is_Active,
    updated_at
FROM email_templates
WHERE Template_Code = 'SOA_DESIGN';
```

## Step 6: Test After Update

1. Go to Email Templates page in the application
2. Select SOA_DESIGN template
3. Verify it shows the proper HTML with `{{Amount_X}}` variables
4. Generate a test SOA PDF
5. Check if values now display correctly

## Important Notes

1. **Do NOT use backticks** in the UPDATE query - they will break the template
2. **Test with accounts that have rebate data** to see if values appear
3. **Check the logs** after generation to verify data is being passed
4. **The template MUST use the exact variable names** (case-sensitive):
   - `{{Amount_Discounts}}` NOT `{{amount_discounts}}`
   - `{{Amount_Rebates}}` NOT `{{Amount_Rebate}}`
   - `{{Amount_Service}}` NOT `{{Service}}`
   - `{{Amount_Install}}` NOT `{{Staggered}}`

## Troubleshooting

### Still showing placeholders after update?

Check if variables are being passed in logs:
```bash
tail -f storage/logs/laravel.log | grep "PDF data prepared"
```

Should show:
```json
{
    "Amount_Discounts": "0.00",
    "Amount_Rebates": "86.60",
    "Amount_Service": "0.00",
    "Amount_Install": "0.00"
}
```

### Values still 0.00 in PDF?

Check database has actual values:
```sql
SELECT discounts, rebate, service_charge, staggered
FROM statement_of_accounts
WHERE account_no = 'A0001'
ORDER BY statement_date DESC
LIMIT 1;
```
