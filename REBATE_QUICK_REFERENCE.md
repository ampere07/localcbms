# Rebate System Quick Reference

## Core Concept
Rebates are discounts based on customer location (LCP/NAP/Barangay) that are applied during invoice generation.

## Two-Table System

### rebates table
**Purpose:** Defines the rebate offer
**Status Logic:** Changes to "Used" when ALL accounts have used it

### rebates_usage table  
**Purpose:** Lists which accounts can use the rebate
**Status Logic:** Changes to "Used" immediately when that account's invoice is generated

## Key Rules

1. **Month Matching Required**
   - Rebate only applies if `rebates.month` matches current month
   - Example: Rebate with month='November' only applies in November

2. **Account Must Be Listed**
   - Account must have an entry in rebates_usage table
   - Entry must have status='Unused'
   - No entry = No rebate applied

3. **Status Update Flow**
   ```
   Invoice Generated → rebates_usage.status = 'Used'
                    → Check all rebates_usage for this rebate_id
                    → If all 'Used' → rebates.status = 'Used'
                    → If any 'Unused' → rebates.status stays 'Unused'
   ```

## Rebate Calculation Formula

```
rebate_amount = (monthly_fee / days_in_month) × number_of_dates
```

Example:
- Monthly fee: ₱1,299
- Days in November: 30
- Rebate days: 2
- Calculation: (1299 / 30) × 2 = ₱86.60

## Matching Logic

### Location-Based (rebate_type = 'location')
Matches if:
- Customer's `location` = rebate's `selected_rebate`, OR
- Customer's `barangay` = rebate's `selected_rebate`

### LCP-Based (rebate_type = 'lcp')
Matches if:
- Technical details `lcp` = rebate's `selected_rebate`

### LCPNAP-Based (rebate_type = 'lcpnap')
Matches if:
- Technical details `lcpnap` = rebate's `selected_rebate`

## SQL Quick Commands

### Create Rebate with Usage Entries
```sql
-- Create the rebate
INSERT INTO rebates (rebates_id, number_of_dates, rebate_type, selected_rebate, month, status)
VALUES (14, 2, 'location', 'Pasay', 'November', 'Unused');

-- Assign to accounts
INSERT INTO rebates_usage (rebates_id, account_no, status, month) VALUES
(14, 'A0001', 'Unused', 'November'),
(14, 'A0002', 'Unused', 'November');
```

### Check Status
```sql
SELECT 
    r.id, r.month, r.status as rebate_status,
    COUNT(ru.id) as total,
    SUM(CASE WHEN ru.status='Unused' THEN 1 ELSE 0 END) as unused,
    SUM(CASE WHEN ru.status='Used' THEN 1 ELSE 0 END) as used
FROM rebates r
LEFT JOIN rebates_usage ru ON r.id = ru.rebates_id
WHERE r.id = 14
GROUP BY r.id;
```

### Reset for Testing
```sql
UPDATE rebates SET status = 'Unused' WHERE id = 14;
UPDATE rebates_usage SET status = 'Unused' WHERE rebates_id = 14;
```

## Common Scenarios

### Scenario: 1 Account
```
Setup:    rebates(Unused) → rebates_usage(A0001, Unused)
After:    rebates(Used)   → rebates_usage(A0001, Used)
Result:   ✓ Both changed to Used
```

### Scenario: 3 Accounts
```
Setup:    rebates(Unused) → rebates_usage(A0001, Unused)
                          → rebates_usage(A0002, Unused)
                          → rebates_usage(A0003, Unused)

After A0001 invoice:
          rebates(Unused) → rebates_usage(A0001, Used)
                          → rebates_usage(A0002, Unused)
                          → rebates_usage(A0003, Unused)

After A0002 invoice:
          rebates(Unused) → rebates_usage(A0001, Used)
                          → rebates_usage(A0002, Used)
                          → rebates_usage(A0003, Unused)

After A0003 invoice:
          rebates(Used)   → rebates_usage(A0001, Used)
                          → rebates_usage(A0002, Used)
                          → rebates_usage(A0003, Used)
Result:   ✓ rebates changes to Used only after ALL are used
```

### Scenario: Wrong Month
```
Setup:    rebates(month=December, Unused)
Current:  November
Result:   ✗ Rebate NOT applied (month mismatch)
```

### Scenario: Account Not Listed
```
Setup:    rebates_usage(A0001, Unused)
Invoice:  A0002
Result:   ✗ Rebate NOT applied (A0002 not in usage table)
```

## Troubleshooting

### Rebate Not Applied?
Check in order:
1. ☐ rebates.month = current month?
2. ☐ rebates.status = 'Unused'?
3. ☐ Customer matches rebate criteria?
4. ☐ rebates_usage entry exists for account?
5. ☐ rebates_usage.status = 'Unused'?

### Status Not Updating?
Check:
1. ☐ Are there unused rebates_usage entries?
2. ☐ Check logs for "checkAndUpdateRebateStatus"
3. ☐ Run verification query (see above)

## Log Messages

Success indicators:
- `Rebate matched and applied` ✓
- `Marking rebate_usage as Used` ✓
- `All rebate_usage entries are used, marking rebate as Used` ✓

Warning indicators:
- `Rebate matched but no unused rebate_usage found` ⚠
- `Rebate still has unused entries` ⚠

## Files Reference

- Implementation: `backend/app/Services/EnhancedBillingGenerationService.php`
- Models: 
  - `backend/app/Models/MassRebate.php`
  - `backend/app/Models/RebateUsage.php`
- Documentation: `REBATE_AUTOGENERATION_IMPLEMENTATION.md`
- Testing: `REBATE_AUTOGENERATION_TESTING.sql`
- Flow Diagram: `REBATE_FLOW_DIAGRAM.md`

## Month Names (Case-Sensitive!)
```
January, February, March, April, May, June,
July, August, September, October, November, December
```

## Important Notes

- Month matching is case-sensitive
- Rebate calculation is automatic during invoice generation
- No manual intervention needed for status updates
- All operations are logged
- System handles multiple accounts progressively
- Backward compatible with existing system
