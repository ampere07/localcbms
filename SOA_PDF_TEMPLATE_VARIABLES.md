# SOA PDF Template Variable Mappings

## Overview
This document lists all available template variables for the Statement of Account (SOA) PDF generation.

## Available Template Variables

### Customer Information
| Variable | Source | Example |
|----------|--------|---------|
| `{{Full_Name}}` | customer.full_name | Juan S. Dela Cruz |
| `{{Address}}` | Complete address | 123 Main St, Pagsibol Northern, Muzon, San Jose del Monte, Bulacan |
| `{{Street}}` | customer.address | 123 Main St |
| `{{Barangay}}` | customer.barangay | Muzon |
| `{{City}}` | customer.city | San Jose del Monte |
| `{{Province}}` | customer.region | Bulacan |
| `{{Contact_No}}` | customer.contact_number_primary | 09171234567 |
| `{{Email}}` | customer.email_address | juan@example.com |

### Account Information
| Variable | Source | Example |
|----------|--------|---------|
| `{{Account_No}}` | account.account_no | A0001 |
| `{{Plan}}` | customer.desired_plan | Plan 1299 - 50 Mbps |
| `{{Statement_Date}}` | Current date | December 05, 2025 |

### Statement Details (SOA Only)
| Variable | Source | Example |
|----------|--------|---------|
| `{{SOA_No}}` | soa.id | 50 |
| `{{Due_Date}}` | soa.due_date | December 12, 2025 |
| `{{Period_Start}}` | soa.statement_date | December 05, 2025 |
| `{{Period_End}}` | soa.due_date | December 12, 2025 |

### Previous Charges Section
| Variable | Source (statement_of_accounts) | Example |
|----------|-------------------------------|---------|
| `{{Prev_Balance}}` | balance_from_previous_bill | 3,897.00 |
| `{{Prev_Payment}}` | payment_received_previous | 3,797.00 |
| `{{Rem_Balance}}` | remaining_balance_previous | 100.00 |

### Current Charges Section
| Variable | Source (statement_of_accounts) | Example |
|----------|-------------------------------|---------|
| `{{Monthly_Fee}}` | monthly_service_fee | 1,159.82 |
| `{{VAT}}` | vat | 139.18 |

### Others and Basic Charges - Individual Values
| Variable | Source (statement_of_accounts) | Example | Notes |
|----------|-------------------------------|---------|-------|
| `{{Amount_Discounts}}` | discounts | 0.00 | Always formatted with 2 decimals |
| `{{Amount_Rebates}}` | rebate | 86.60 | Always formatted with 2 decimals |
| `{{Amount_Service}}` | service_charge | 0.00 | Always formatted with 2 decimals |
| `{{Amount_Install}}` | staggered | 0.00 | Always formatted with 2 decimals |

### Others and Basic Charges - Labels
| Variable | Value | Condition |
|----------|-------|-----------|
| `{{Label_Discounts}}` | "- Discounts" | If discounts > 0 |
| `{{Label_Discounts}}` | "" (empty) | If discounts = 0 |
| `{{Label_Rebates}}` | "- Rebates" | If rebate > 0 |
| `{{Label_Rebates}}` | "" (empty) | If rebate = 0 |
| `{{Label_Service}}` | "Service Charge" | If service_charge > 0 |
| `{{Label_Service}}` | "" (empty) | If service_charge = 0 |
| `{{Label_Install}}` | "Staggered Payment" | If staggered > 0 |
| `{{Label_Install}}` | "" (empty) | If staggered = 0 |

### Amount Due Section
| Variable | Source (statement_of_accounts) | Example |
|----------|-------------------------------|---------|
| `{{Amount_Due}}` | amount_due | 1,299.00 |
| `{{Total_Due}}` | total_amount_due | 1,399.00 |

### Dynamic Row Templates (Legacy - Backward Compatibility)
| Variable | Output | Condition |
|----------|--------|-----------|
| `{{Row_Discounts}}` | `<tr><td>- Discounts</td><td align='right'>0.00</td></tr>` | If discounts > 0 |
| `{{Row_Discounts}}` | "" (empty) | If discounts = 0 |
| `{{Row_Rebates}}` | `<tr><td>- Rebates</td><td align='right'>86.60</td></tr>` | If rebate > 0 |
| `{{Row_Rebates}}` | "" (empty) | If rebate = 0 |
| `{{Row_Service}}` | `<tr><td>Service Charge</td><td align='right'>0.00</td></tr>` | If service_charge > 0 |
| `{{Row_Service}}` | "" (empty) | If service_charge = 0 |
| `{{Row_Staggered}}` | `<tr><td>Staggered Payment</td><td align='right'>0.00</td></tr>` | If staggered > 0 |
| `{{Row_Staggered}}` | "" (empty) | If staggered = 0 |

### Other
| Variable | Value | Example |
|----------|-------|---------|
| `{{Payment_Link}}` | config('app.payment_link') | https://pay.example.com |

## Database Table Mappings

### statement_of_accounts table columns → PDF variables

```
statement_of_accounts.id                        → {{SOA_No}}
statement_of_accounts.statement_date            → {{Period_Start}}
statement_of_accounts.balance_from_previous_bill → {{Prev_Balance}}
statement_of_accounts.payment_received_previous → {{Prev_Payment}}
statement_of_accounts.remaining_balance_previous → {{Rem_Balance}}
statement_of_accounts.monthly_service_fee       → {{Monthly_Fee}}
statement_of_accounts.discounts                 → {{Amount_Discounts}}
statement_of_accounts.rebate                    → {{Amount_Rebates}}
statement_of_accounts.service_charge            → {{Amount_Service}}
statement_of_accounts.staggered                 → {{Amount_Install}}
statement_of_accounts.vat                       → {{VAT}}
statement_of_accounts.due_date                  → {{Due_Date}}, {{Period_End}}
statement_of_accounts.amount_due                → {{Amount_Due}}
statement_of_accounts.total_amount_due          → {{Total_Due}}
```

## Template Usage Examples

### Example 1: Basic Table Structure
```html
<table>
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

### Example 2: Dynamic Rows (Auto-hide if zero)
```html
<table>
  {{Row_Discounts}}
  {{Row_Rebates}}
  {{Row_Service}}
  {{Row_Staggered}}
</table>
```

### Example 3: Conditional Display
```html
<!-- Only shows if discounts > 0 -->
{{Label_Discounts}}: {{Amount_Discounts}}

<!-- Always shows with value -->
Rebates: {{Amount_Rebates}}
```

## Implementation Notes

1. **Number Formatting**: All monetary values are formatted with `number_format($value, 2)`, so they always include 2 decimal places
2. **Empty Labels**: If an amount is zero, the corresponding label variable will be empty string
3. **Backward Compatibility**: Both individual variables (`{{Amount_X}}`, `{{Label_X}}`) and row templates (`{{Row_X}}`) are supported
4. **Data Source**: All SOA data comes from the `statement_of_accounts` table record passed to the PDF generation function

## Debugging

To verify template variables are being set correctly, check the Laravel logs:

```
[INFO] PDF data prepared for template {
    "document_type": "SOA",
    "account_no": "A0001",
    "soa_id": 50,
    "data_keys": [...all variable names...],
    "sample_data": {
        "Amount_Discounts": "0.00",
        "Amount_Rebates": "86.60",
        "Amount_Service": "0.00",
        "Amount_Install": "0.00"
    }
}
```

## Common Issues

### Issue: Variables showing as `{{Variable_Name}}`
**Cause**: Variable name mismatch or typo in template  
**Solution**: Check exact variable name from this document (case-sensitive)

### Issue: All amounts showing 0.00
**Cause**: SOA object not being passed to `preparePdfData()`  
**Solution**: Verify SOA is created before PDF generation

### Issue: Previous charges showing wrong values
**Cause**: Using old account_balance instead of latest SOA data  
**Solution**: Verify `getPreviousBalance()` queries statement_of_accounts table

## Files Involved

- **PDF Generation**: `backend/app/Services/PdfGenerationService.php`
- **SOA Creation**: `backend/app/Services/EnhancedBillingGenerationService.php`
- **Template Storage**: Database table `email_templates` (Template_Code = 'SOA_DESIGN')
