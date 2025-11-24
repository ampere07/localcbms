# Rebate Autogeneration Implementation

## Overview
This document describes the implementation of the rebate functionality in the SOA and invoice autogeneration system.

## Database Tables

### rebates
- `id` - Primary key
- `rebates_id` - Unique rebate identifier
- `account_no` - Account number
- `number_of_dates` - Number of days for rebate
- `rebate_type` - Type: 'lcpnap', 'lcp', or 'location'
- `selected_rebate` - The specific LCP/NAP/Location value
- `month` - Month when rebate is applicable (e.g., 'November')
- `status` - Status: 'Unused' or 'Used'
- `modified_by` - User who modified
- `modified_date` - Last modification date

### rebates_usage
- `id` - Primary key
- `rebates_id` - Foreign key to rebates table
- `account_no` - Account number who will use the rebate
- `status` - Status: 'Unused' or 'Used'
- `month` - Month when rebate was used

## Implementation Flow

### Step 1: Calculate Rebates (During SOA/Invoice Generation)
Location: `EnhancedBillingGenerationService::calculateRebates()`

The system follows these steps:
1. Get current month from the generation date
2. Find all rebates with:
   - status = 'Unused'
   - month = current month
3. For each rebate, check if it matches the customer's:
   - LCP/NAP location (if rebate_type is 'lcpnap' or 'lcp')
   - Location/Barangay (if rebate_type is 'location')
4. If matched, check if there is a rebate_usage entry for this account with status 'Unused'
5. If rebate_usage exists:
   - Calculate rebate value: (monthly_fee / days_in_month) × number_of_dates
   - Add to total rebate amount
6. Return total rebate amount to be deducted

### Step 2: Mark Rebates as Used (After Invoice Creation)
Location: `EnhancedBillingGenerationService::markRebatesAsUsed()`

After invoice is successfully created:
1. Find all matching rebates (same logic as Step 1)
2. For each matched rebate:
   - Find the rebate_usage entry for this account
   - If found and status is 'Unused':
     - Update rebate_usage status to 'Used'
     - Call `checkAndUpdateRebateStatus()`

### Step 3: Check and Update Rebate Status
Location: `EnhancedBillingGenerationService::checkAndUpdateRebateStatus()`

This method ensures the rebates table status is only updated when ALL rebate_usage entries are used:
1. Count all rebate_usage entries with status 'Unused' for the given rebate_id
2. If count is 0 (all entries are used):
   - Update rebates table status to 'Used'
   - Update modified_by and modified_date
3. If count > 0:
   - Keep rebates table status as 'Unused'
   - Log the remaining unused count

## Key Features

### Month Filtering
- Rebates are filtered by month to ensure they are only applied in the correct billing period
- Uses `Carbon::format('F')` to get full month name (e.g., 'November')
- Matches against the `month` column in rebates table

### Rebate Usage Tracking
- Each customer who should receive a rebate has an entry in rebates_usage
- The rebate_usage table tracks which specific accounts have used the rebate
- Prevents the same rebate from being applied to accounts not listed in rebates_usage

### Status Management
- **rebates_usage.status**: Changes to 'Used' immediately when invoice is generated
- **rebates.status**: Only changes to 'Used' when ALL rebate_usage entries are 'Used'
- This allows partial usage tracking for rebates applied to multiple accounts

## Example Scenarios

### Scenario 1: Single Account Rebate
```
rebates table:
- id: 14, month: November, status: Unused

rebates_usage table:
- rebates_id: 14, account_no: A0001, status: Unused

Flow:
1. Generate invoice for A0001 in November
2. Rebate matches and rebate_usage is found
3. Rebate amount calculated and deducted
4. rebate_usage status → 'Used'
5. Check rebate_usage count for rebate_id 14
6. Count is 0 (all used)
7. rebates table status → 'Used'
```

### Scenario 2: Multiple Account Rebate
```
rebates table:
- id: 14, month: November, status: Unused

rebates_usage table:
- rebates_id: 14, account_no: A0001, status: Unused
- rebates_id: 14, account_no: A0002, status: Unused

Flow:
1. Generate invoice for A0001 in November
2. Rebate matches and rebate_usage is found
3. rebate_usage for A0001 → 'Used'
4. Check rebate_usage count for rebate_id 14
5. Count is 1 (A0002 still unused)
6. rebates table status → remains 'Unused'

Later:
7. Generate invoice for A0002 in November
8. Rebate matches and rebate_usage is found
9. rebate_usage for A0002 → 'Used'
10. Check rebate_usage count for rebate_id 14
11. Count is 0 (all used)
12. rebates table status → 'Used'
```

### Scenario 3: Account Not in Rebate Usage
```
rebates table:
- id: 14, month: November, status: Unused

rebates_usage table:
- rebates_id: 14, account_no: A0001, status: Unused

Flow:
1. Generate invoice for A0003 in November
2. Rebate matches by location
3. But no rebate_usage entry found for A0003
4. Rebate NOT applied
5. Status remains unchanged
```

## Code Changes Made

### EnhancedBillingGenerationService.php

#### 1. Added Import
```php
use App\Models\RebateUsage;
```

#### 2. Updated calculateRebates()
- Added current month filtering
- Added rebate_usage check before applying rebate
- Enhanced logging with rebate_usage_id

#### 3. Updated markRebatesAsUsed()
- Added current month filtering
- Changed to update rebate_usage status instead of rebates status directly
- Added call to checkAndUpdateRebateStatus()

#### 4. New Method: checkAndUpdateRebateStatus()
- Counts unused rebate_usage entries
- Updates rebates table status only when all entries are used
- Provides detailed logging

## Testing Recommendations

### Test Case 1: Single Account
1. Create a rebate for November
2. Create one rebate_usage entry for one account
3. Generate invoice for that account
4. Verify:
   - Rebate amount is deducted
   - rebate_usage status → 'Used'
   - rebates status → 'Used'

### Test Case 2: Multiple Accounts
1. Create a rebate for November
2. Create rebate_usage entries for three accounts
3. Generate invoice for first account
4. Verify:
   - Rebate applied to first account
   - rebate_usage status → 'Used' for first account
   - rebates status → remains 'Unused'
5. Generate invoices for remaining accounts
6. Verify:
   - After all three invoices generated
   - All rebate_usage entries → 'Used'
   - rebates status → 'Used'

### Test Case 3: Wrong Month
1. Create a rebate for November
2. Create rebate_usage entry
3. Try to generate invoice in December
4. Verify:
   - Rebate NOT applied
   - Status unchanged

### Test Case 4: Account Not in Usage Table
1. Create a rebate for November
2. Create rebate_usage for account A0001
3. Generate invoice for account A0002
4. Verify:
   - Rebate NOT applied to A0002
   - Status unchanged

## Logging

The implementation provides comprehensive logging at each step:
- Rebate calculation with match details
- Rebate usage lookup results
- Status updates with counts
- Useful for debugging and auditing

## Important Notes

1. The rebate amount is calculated as: `(monthly_fee / days_in_month) × number_of_dates`
2. Month matching is case-sensitive (e.g., 'November' not 'november')
3. The rebates table status is only updated when ALL associated rebate_usage entries are marked as used
4. Rebates are only applied during invoice generation, not during SOA generation
5. The system checks both `month` and `status` when querying rebates
