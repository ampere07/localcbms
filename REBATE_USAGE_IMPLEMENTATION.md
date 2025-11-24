# Rebate Usage Implementation Summary

## Overview
When a mass rebate is saved in the RebateFormModal, it now saves to TWO tables:
1. `rebates` table (main rebate record)
2. `rebates_usage` table (individual account records for each matching account)

## Implementation Details

### 1. Database Migration
**File**: `backend/database/migrations/2025_11_24_000006_create_rebates_usage_table.php`

Creates the `rebates_usage` table with:
- `id`: Primary key
- `rebates_id`: Foreign key to rebates table
- `account_no`: Account number from billing_accounts
- `status`: 'Unused' or 'Used' (default: 'Unused')
- `month`: Month from the rebate
- `modified_by`: User who created the record
- `modified_date`: Timestamp of creation

**Migration Command**:
```bash
php artisan migrate
```

### 2. Model Created
**File**: `backend/app/Models/RebateUsage.php`

Features:
- Fillable fields for mass assignment
- Relationship to MassRebate model
- Scopes for unused/used filtering
- Method to mark as used

### 3. Model Relationship Updated
**File**: `backend/app/Models/MassRebate.php`

Added `usages()` relationship method to link MassRebate to RebateUsage records.

### 4. API Route Logic Enhanced
**File**: `backend/routes/api.php`

The POST `/api/mass-rebates` route now:

#### Step 1: Creates the main rebate record
Inserts into `rebates` table with validated data.

#### Step 2: Finds matching accounts
Based on `rebate_type` and `selected_rebate`:

**For LCPNAP:**
```sql
SELECT billing_accounts.account_no
FROM billing_accounts
JOIN technical_details ON billing_accounts.id = technical_details.account_id
WHERE technical_details.lcpnap = [selected_rebate]
AND billing_accounts.date_installed IS NOT NULL
```

**For LCP:**
```sql
SELECT billing_accounts.account_no
FROM billing_accounts
JOIN technical_details ON billing_accounts.id = technical_details.account_id
WHERE technical_details.lcp = [selected_rebate]
AND billing_accounts.date_installed IS NOT NULL
```

**For Location:**
```sql
SELECT billing_accounts.account_no
FROM billing_accounts
JOIN customers ON billing_accounts.customer_id = customers.id
WHERE customers.village = [selected_rebate]
AND billing_accounts.date_installed IS NOT NULL
```

#### Step 3: Creates usage records
For each matching account, creates a record in `rebates_usage` with:
- Reference to the rebate (rebates_id)
- Account number
- Status: 'Unused'
- Month from the rebate
- Modified by user
- Current timestamp

#### Step 4: Transaction handling
Uses database transactions to ensure both operations succeed or both fail.

## Response Structure

### Success Response
```json
{
  "success": true,
  "message": "Mass rebate created successfully",
  "data": {
    "id": 1,
    "number_of_dates": 2,
    "rebate_type": "lcpnap",
    "selected_rebate": "LCP-001 to NAP-001",
    "month": "January",
    "status": "Unused",
    "modified_by": "admin@amperecloud.com",
    "modified_date": "2025-11-24 16:41:21"
  },
  "usage_records_created": 5
}
```

## Database Structure

### rebates table
```
id | number_of_dates | rebate_type | selected_rebate | month | status | modified_by | modified_date
```

### rebates_usage table
```
id | rebates_id | account_no | status | month | modified_by | modified_date
```

## Example Scenario

**Input:**
- Rebate Type: LCPNAP
- Selected: "LCP-001 to NAP-001"
- Month: "January"
- Number of Days: 2

**Result:**
1. Creates 1 record in `rebates` table
2. Finds all accounts with `technical_details.lcpnap = "LCP-001 to NAP-001"`
3. Creates 1 record in `rebates_usage` for each matching account

**If 10 accounts match:**
- 1 record in `rebates`
- 10 records in `rebates_usage`

## Usage
After running the migration, when you save a rebate in the RebateFormModal:
1. The main rebate is saved to `rebates`
2. The system automatically finds all matching accounts
3. Individual usage records are created for each account
4. All operations happen in a transaction (all succeed or all fail)

## Logging
The implementation includes comprehensive logging:
- Request received
- Validation passed
- Rebate created
- Matching accounts found
- Usage records created
- Success/failure details

Check Laravel logs at: `storage/logs/laravel.log`
