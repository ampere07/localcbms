# Quick Reference - SOA Template Variables

## Template Variables You MUST Use

```html
<!-- Previous Charges -->
{{Prev_Balance}}    → Balance from Previous Bill
{{Prev_Payment}}    → Payment Received from Previous Bill  
{{Rem_Balance}}     → Remaining Balance from Previous Bill

<!-- Current Charges -->
{{Monthly_Fee}}     → Monthly Service Fee
{{VAT}}             → VAT Amount

<!-- Others and Basic Charges - ALWAYS SHOW VALUES -->
{{Amount_Discounts}} → Discount amount (e.g., "0.00" or "50.00")
{{Amount_Rebates}}   → Rebate amount (e.g., "86.60")
{{Amount_Service}}   → Service charge (e.g., "0.00")
{{Amount_Install}}   → Staggered payment (e.g., "0.00")

<!-- Others and Basic Charges - LABELS (auto-hide if zero) -->
{{Label_Discounts}}  → Shows "- Discounts" if amount > 0, empty if 0
{{Label_Rebates}}    → Shows "- Rebates" if amount > 0, empty if 0
{{Label_Service}}    → Shows "Service Charge" if amount > 0, empty if 0
{{Label_Install}}    → Shows "Staggered Payment" if amount > 0, empty if 0

<!-- Totals -->
{{Amount_Due}}      → Current amount due
{{Total_Due}}       → Total amount due
{{Due_Date}}        → Due date
```

## Recommended Template Structure

```html
<h2>Previous Charges</h2>
<table>
  <tr><td>Balance from Previous Bill</td><td align="right">{{Prev_Balance}}</td></tr>
  <tr><td>Payment Received</td><td align="right">{{Prev_Payment}}</td></tr>
  <tr><td>Remaining Balance</td><td align="right">{{Rem_Balance}}</td></tr>
</table>

<h2>Current Charges</h2>
<table>
  <tr><td>Monthly Service Fee</td><td align="right">{{Monthly_Fee}}</td></tr>
</table>

<h3>Others and Basic Charges</h3>
<table>
  <tr><td>- Discounts</td><td align="right">{{Amount_Discounts}}</td></tr>
  <tr><td>- Rebates</td><td align="right">{{Amount_Rebates}}</td></tr>
  <tr><td>Service Charge</td><td align="right">{{Amount_Service}}</td></tr>
  <tr><td>Staggered Payment</td><td align="right">{{Amount_Install}}</td></tr>
</table>

<table>
  <tr>
    <td><strong>DUE DATE</strong></td>
    <td align="right"><strong>AMOUNT DUE</strong></td>
  </tr>
  <tr>
    <td>Please pay on or before {{Due_Date}}</td>
    <td align="right"><strong>{{Total_Due}}</strong></td>
  </tr>
</table>
```

## Quick Test

1. Update SOA_TEMPLATE with above structure
2. Generate test SOA
3. Check PDF - should see "86.60" for rebates (if test data has rebates)
4. Check logs - should see all Amount_X variables

## Template Name

Your template MUST be named: **SOA_TEMPLATE** (not SOA_DESIGN)

Set `Is_Active = true` in database.
