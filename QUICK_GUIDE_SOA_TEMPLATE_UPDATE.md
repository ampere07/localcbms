# Quick Guide: Update SOA Email Template for Others and Basic Charges

## Problem
The "Others and Basic Charges" section in the SOA PDF is not showing values because the template is using placeholder text like `{{Label_Discounts}}` and `{{Amount_Discounts}}` but these variables were not being populated.

## Solution Applied
Updated `PdfGenerationService.php` to add these variables to the data array.

## Available Variables (NEW)

### For Column Headers/Labels:
```
{{Label_Discounts}}  → Shows "- Discounts" if amount > 0, empty if 0
{{Label_Rebates}}    → Shows "- Rebates" if amount > 0, empty if 0
{{Label_Service}}    → Shows "Service Charge" if amount > 0, empty if 0
{{Label_Install}}    → Shows "Staggered Payment" if amount > 0, empty if 0
```

### For Amount Values:
```
{{Amount_Discounts}} → Always shows formatted amount (e.g. "0.00" or "50.00")
{{Amount_Rebates}}   → Always shows formatted amount (e.g. "86.60")
{{Amount_Service}}   → Always shows formatted amount (e.g. "0.00")
{{Amount_Install}}   → Always shows formatted amount (e.g. "0.00")
```

## Update Your Email Template

### Step 1: Login to your application
Navigate to Email Templates management

### Step 2: Edit SOA_DESIGN template
Find the template with Template_Code = `SOA_DESIGN`

### Step 3: Update the "Others and Basic Charges" section

**Replace this:**
```html
Others and Basic Charges
  {{Label_Discounts}}        {{Amount_Discounts}}
  {{Label_Rebates}}          {{Amount_Rebates}}
  {{Label_Service}}          {{Amount_Service}}
  {{Label_Install}}          {{Amount_Install}}
```

**With proper HTML table structure:**
```html
<h3>Others and Basic Charges</h3>
<table border="0" width="100%">
  <tr>
    <td>{{Label_Discounts}}</td>
    <td align="right">{{Amount_Discounts}}</td>
  </tr>
  <tr>
    <td>{{Label_Rebates}}</td>
    <td align="right">{{Amount_Rebates}}</td>
  </tr>
  <tr>
    <td>{{Label_Service}}</td>
    <td align="right">{{Amount_Service}}</td>
  </tr>
  <tr>
    <td>{{Label_Install}}</td>
    <td align="right">{{Amount_Install}}</td>
  </tr>
</table>
```

### Step 4: Alternative - Always Show All Rows
If you want to always display all rows even when values are 0:

```html
<h3>Others and Basic Charges</h3>
<table border="0" width="100%">
  <tr>
    <td>- Discounts</td>
    <td align="right">{{Amount_Discounts}}</td>
  </tr>
  <tr>
    <td>- Rebates</td>
    <td align="right">{{Amount_Rebates}}</td>
  </tr>
  <tr>
    <td>Service Charge</td>
    <td align="right">{{Amount_Service}}</td>
  </tr>
  <tr>
    <td>Staggered Payment</td>
    <td align="right">{{Amount_Install}}</td>
  </tr>
</table>
```

### Step 5: Alternative - Auto-hide Zero Rows
If you want rows to disappear when value is 0:

```html
<h3>Others and Basic Charges</h3>
<table border="0" width="100%">
  {{Row_Discounts}}
  {{Row_Rebates}}
  {{Row_Service}}
  {{Row_Staggered}}
</table>
```

## Test Your Template

### Step 1: Generate a test SOA
```
1. Go to Billing Generation
2. Click "Generate Sample Data"
3. Wait for generation to complete
```

### Step 2: Check the PDF
```
1. Find the generated SOA PDF
2. Look at "Others and Basic Charges" section
3. Verify values are showing correctly
```

### Step 3: Check the logs
```
1. Open backend logs: storage/logs/laravel.log
2. Search for "PDF data prepared for template"
3. Verify these values exist:
   - Amount_Discounts: "0.00" or actual value
   - Amount_Rebates: "86.60" or actual value
   - Amount_Service: "0.00" or actual value
   - Amount_Install: "0.00" or actual value
```

## Example Output

### When rebate = 86.60, others = 0:

**Using Label variables (auto-hide):**
```
Others and Basic Charges
  - Rebates              86.60
```

**Using static labels (always show):**
```
Others and Basic Charges
  - Discounts             0.00
  - Rebates              86.60
  Service Charge          0.00
  Staggered Payment       0.00
```

## Data Source

All values come from the `statement_of_accounts` table:
```sql
SELECT 
    discounts,      -- → {{Amount_Discounts}}
    rebate,         -- → {{Amount_Rebates}}
    service_charge, -- → {{Amount_Service}}
    staggered       -- → {{Amount_Install}}
FROM statement_of_accounts
WHERE account_no = 'A0001'
ORDER BY statement_date DESC
LIMIT 1;
```

## Troubleshooting

### Issue: Still showing placeholder text
**Check**: Template uses exact variable names (case-sensitive)
```
CORRECT: {{Amount_Discounts}}
WRONG:   {{amount_discounts}}
WRONG:   {{AmountDiscounts}}
```

### Issue: Values showing but not formatted
**Check**: PDF generation logs show formatted values
```
Expected: "86.60"
Not: 86.6 or 86.60000
```

### Issue: Labels not hiding when zero
**Solution**: Use `{{Label_X}}` variables, they auto-empty when amount is 0

## Files Modified

1. `backend/app/Services/PdfGenerationService.php`
   - Added Amount_Discounts, Amount_Rebates, Amount_Service, Amount_Install
   - Added Label_Discounts, Label_Rebates, Label_Service, Label_Install
   - Added logging for PDF data preparation

2. `email_templates` table (via UI)
   - Update SOA_DESIGN template Body_HTML
   - Use new variables in template structure
