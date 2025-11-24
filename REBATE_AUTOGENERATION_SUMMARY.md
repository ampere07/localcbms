# Rebate Autogeneration Update Summary

## Changes Made

### 1. EnhancedBillingGenerationService.php
Location: `backend/app/Services/EnhancedBillingGenerationService.php`

**Added Import:**
```php
use App\Models\RebateUsage;
```

**Modified Methods:**

#### calculateRebates()
- Added current month filtering to rebates query
- Added check for rebate_usage entry before applying rebate
- Only applies rebate if:
  - Rebate status is 'Unused'
  - Rebate month matches current month
  - Customer matches rebate criteria (LCP/NAP/Location)
  - rebate_usage entry exists for the account with status 'Unused'
- Enhanced logging with rebate_usage_id tracking

#### markRebatesAsUsed()
- Added current month filtering
- Changed to update rebate_usage status instead of directly updating rebates table
- Added call to checkAndUpdateRebateStatus() after marking usage as used
- Enhanced logging with rebate_usage_id tracking

#### checkAndUpdateRebateStatus() (NEW METHOD)
- Counts unused rebate_usage entries for a given rebate_id
- Only updates rebates table status to 'Used' when ALL rebate_usage entries are used
- Provides detailed logging for tracking status changes
- Ensures rebates table status accurately reflects usage across all assigned accounts

## How It Works

### Flow Diagram
```
1. Invoice Generation Triggered
   ↓
2. calculateRebates() called
   ↓
3. Find rebates with:
   - status = 'Unused'
   - month = current month
   ↓
4. For each matching rebate:
   ↓
5. Check if customer matches rebate criteria
   ↓
6. Look for rebate_usage entry for this account
   ↓
7. If rebate_usage exists and status = 'Unused':
   - Calculate rebate value
   - Add to total deduction
   ↓
8. Invoice Created
   ↓
9. markRebatesAsUsed() called
   ↓
10. For each matched rebate:
    ↓
11. Update rebate_usage status to 'Used'
    ↓
12. Call checkAndUpdateRebateStatus()
    ↓
13. Count unused rebate_usage entries
    ↓
14. If count = 0:
    - Update rebates status to 'Used'
    Else:
    - Keep rebates status as 'Unused'
```

## Key Features

1. **Month-Based Filtering**: Rebates only apply in their designated month
2. **Account-Specific Usage**: Only accounts listed in rebates_usage table receive the rebate
3. **Progressive Status Updates**: rebates_usage updates immediately, rebates table updates only when all are used
4. **Detailed Logging**: Comprehensive logs for debugging and auditing

## Testing Files Created

1. **REBATE_AUTOGENERATION_IMPLEMENTATION.md**
   - Detailed documentation of the implementation
   - Database schema explanation
   - Flow descriptions
   - Example scenarios
   - Testing recommendations

2. **REBATE_AUTOGENERATION_TESTING.sql**
   - SQL scripts for testing
   - 4 test cases:
     - Single account rebate
     - Multiple account rebate
     - Wrong month (should not apply)
     - Account not in usage table (should not apply)
   - Verification queries
   - Cleanup scripts

## Example Usage

### Scenario: Rebate for 3 Accounts

**Setup:**
```sql
-- Create rebate
INSERT INTO rebates (rebates_id, number_of_dates, rebate_type, selected_rebate, month, status)
VALUES (14, 2, 'lcpnap', 'LCP-JU1 to NAP-JU1', 'November', 'Unused');

-- Assign to 3 accounts
INSERT INTO rebates_usage (rebates_id, account_no, status, month) VALUES
(14, 'A0001', 'Unused', 'November'),
(14, 'A0002', 'Unused', 'November'),
(14, 'A0003', 'Unused', 'November');
```

**Invoice Generation Process:**

1. Generate invoice for A0001:
   - Rebate applied to A0001
   - rebates_usage for A0001 → 'Used'
   - rebates table → remains 'Unused' (2 accounts still unused)

2. Generate invoice for A0002:
   - Rebate applied to A0002
   - rebates_usage for A0002 → 'Used'
   - rebates table → remains 'Unused' (1 account still unused)

3. Generate invoice for A0003:
   - Rebate applied to A0003
   - rebates_usage for A0003 → 'Used'
   - rebates table → changes to 'Used' (all accounts now used)

## Benefits

1. **Accurate Tracking**: Know exactly which accounts have used a rebate
2. **Partial Usage Support**: Rebate can be applied to multiple accounts progressively
3. **Month Control**: Rebates only apply in their designated month
4. **Audit Trail**: Comprehensive logging of all rebate operations
5. **Status Integrity**: Rebates table status only updates when fully consumed

## Next Steps

1. Test with the provided SQL scripts
2. Monitor logs during invoice generation
3. Verify rebate calculations in generated invoices
4. Confirm status updates in both tables

## Important Notes

- The implementation maintains backward compatibility
- Existing rebate records without rebates_usage entries will not be applied
- Month names must match exactly (case-sensitive: 'November' not 'november')
- All database operations are logged for debugging
- No manual status updates needed - system handles everything automatically
