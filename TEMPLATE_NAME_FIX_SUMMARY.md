# Template Name Fix - SOA_DESIGN vs SOA_TEMPLATE

## Issue Discovered

From the logs:
```log
[2025-12-05 15:10:16] local.INFO: Updating email template 
{"template_code":"SOA_TEMPLATE",...}
```

Your database has a template named `SOA_TEMPLATE`, but the code was looking for `SOA_DESIGN`.

## Solution Applied

Updated `PdfGenerationService.php` to use `_TEMPLATE` suffix instead of `_DESIGN`:

```php
// Changed from:
$templateCode = $documentType . '_DESIGN';  // Would look for "SOA_DESIGN"

// Changed to:
$templateCode = $documentType . '_TEMPLATE';  // Now looks for "SOA_TEMPLATE"
```

## What This Means

The system will now look for these template codes in the `email_templates` table:
- **SOA_TEMPLATE** - For Statement of Account PDFs
- **INVOICE_TEMPLATE** - For Invoice PDFs (if you have invoices)
- **OVERDUE_TEMPLATE** - For Overdue notices (if used)
- **DCNOTICE_TEMPLATE** - For disconnection notices (if used)

## Next Steps

### 1. Verify Template is Active
```sql
SELECT Template_Code, Is_Active, Subject_Line
FROM email_templates
WHERE Template_Code = 'SOA_TEMPLATE';
```

Should show `Is_Active = 1` (or `true`)

### 2. Update Your SOA_TEMPLATE

Make sure your `SOA_TEMPLATE` uses the correct variables:

**Required Variables for Others and Basic Charges:**
- `{{Amount_Discounts}}` - Shows discount amount
- `{{Amount_Rebates}}` - Shows rebate amount  
- `{{Amount_Service}}` - Shows service charge
- `{{Amount_Install}}` - Shows staggered payment

**Example HTML:**
```html
<h3>Others and Basic Charges</h3>
<table>
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

### 3. Test PDF Generation

1. Generate a test SOA
2. Check logs for:
   ```log
   [INFO] PDF data prepared for template {
       "document_type": "SOA",
       "template_code": "SOA_TEMPLATE",  ← Should now say TEMPLATE not DESIGN
       "Amount_Rebates": "86.60"
   }
   ```
3. Open generated PDF
4. Verify "Others and Basic Charges" shows actual values

## If You Want to Use SOA_DESIGN Instead

If you prefer to keep the `_DESIGN` naming convention:

### Option 1: Rename in Database
```sql
UPDATE email_templates 
SET Template_Code = 'SOA_DESIGN'
WHERE Template_Code = 'SOA_TEMPLATE';
```

Then revert the code change back to `_DESIGN`

### Option 2: Keep Both
You can have both templates:
- `SOA_TEMPLATE` - Production template
- `SOA_DESIGN` - Design/testing template

But make sure the one you want to use has `Is_Active = true`

## Files Modified

- `backend/app/Services/PdfGenerationService.php`
  - Line 37: Changed from `_DESIGN` to `_TEMPLATE`
  - Line 60: Improved error message

## Verification Checklist

- [ ] Code updated to use `_TEMPLATE` suffix
- [ ] Database has `SOA_TEMPLATE` with `Is_Active = true`
- [ ] Template HTML uses `{{Amount_X}}` variables
- [ ] Test SOA generation completes without errors
- [ ] PDF shows actual values, not placeholders
- [ ] Logs show correct template_code being used
