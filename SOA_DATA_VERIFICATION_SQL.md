# SOA Data Verification SQL Queries

## Check Latest SOA Record

### Get Latest SOA with All Charges
```sql
SELECT 
    id,
    account_no,
    statement_date,
    -- Previous Charges
    balance_from_previous_bill,
    payment_received_previous,
    remaining_balance_previous,
    -- Current Charges
    monthly_service_fee,
    -- Others and Basic Charges
    discounts,
    rebate,
    service_charge,
    staggered,
    -- Totals
    vat,
    amount_due,
    total_amount_due,
    due_date,
    created_at
FROM statement_of_accounts
WHERE account_no = 'A0001'
ORDER BY statement_date DESC, id DESC
LIMIT 1;
```

### Expected Output Example
```
+----+------------+-----------------+---------------------------+---------------------------+-----------------------------+---------------------+------------+---------+----------------+-----------+-------+------------+-----------------+------------+---------------------+
| id | account_no | statement_date  | balance_from_previous_bill | payment_received_previous | remaining_balance_previous | monthly_service_fee | discounts  | rebate  | service_charge | staggered | vat   | amount_due | total_amount_due | due_date   | created_at          |
+----+------------+-----------------+---------------------------+---------------------------+-----------------------------+---------------------+------------+---------+----------------+-----------+-------+------------+-----------------+------------+---------------------+
| 50 | A0001      | 2025-12-05      | 3897.00                   | 3797.00                   | 100.00                      | 1159.82             | 0.00       | 86.60   | 0.00           | 0.00      | 139.18| 1299.00    | 1399.00          | 2025-12-12 | 2025-12-05 14:30:00 |
+----+------------+-----------------+---------------------------+---------------------------+-----------------------------+---------------------+------------+---------+----------------+-----------+-------+------------+-----------------+------------+---------------------+
```

## Compare with PDF Variables

### Mapping Verification
```sql
SELECT 
    id AS 'SOA_No',
    account_no AS 'Account_No',
    -- Previous Charges Section
    FORMAT(balance_from_previous_bill, 2) AS 'Prev_Balance',
    FORMAT(payment_received_previous, 2) AS 'Prev_Payment',
    FORMAT(remaining_balance_previous, 2) AS 'Rem_Balance',
    -- Current Charges Section
    FORMAT(monthly_service_fee, 2) AS 'Monthly_Fee',
    FORMAT(vat, 2) AS 'VAT',
    -- Others and Basic Charges (VALUES)
    FORMAT(discounts, 2) AS 'Amount_Discounts',
    FORMAT(rebate, 2) AS 'Amount_Rebates',
    FORMAT(service_charge, 2) AS 'Amount_Service',
    FORMAT(staggered, 2) AS 'Amount_Install',
    -- Others and Basic Charges (LABELS)
    CASE WHEN discounts > 0 THEN '- Discounts' ELSE '' END AS 'Label_Discounts',
    CASE WHEN rebate > 0 THEN '- Rebates' ELSE '' END AS 'Label_Rebates',
    CASE WHEN service_charge > 0 THEN 'Service Charge' ELSE '' END AS 'Label_Service',
    CASE WHEN staggered > 0 THEN 'Staggered Payment' ELSE '' END AS 'Label_Install',
    -- Amount Due Section
    FORMAT(amount_due, 2) AS 'Amount_Due',
    FORMAT(total_amount_due, 2) AS 'Total_Due',
    DATE_FORMAT(due_date, '%M %d, %Y') AS 'Due_Date'
FROM statement_of_accounts
WHERE account_no = 'A0001'
ORDER BY statement_date DESC, id DESC
LIMIT 1;
```

## Check SOA History for Account

### Last 5 SOA Records
```sql
SELECT 
    id,
    statement_date,
    FORMAT(balance_from_previous_bill, 2) AS prev_balance,
    FORMAT(payment_received_previous, 2) AS payment,
    FORMAT(remaining_balance_previous, 2) AS remaining,
    FORMAT(monthly_service_fee, 2) AS monthly_fee,
    FORMAT(discounts, 2) AS discounts,
    FORMAT(rebate, 2) AS rebate,
    FORMAT(service_charge, 2) AS service,
    FORMAT(staggered, 2) AS staggered,
    FORMAT(total_amount_due, 2) AS total_due
FROM statement_of_accounts
WHERE account_no = 'A0001'
ORDER BY statement_date DESC, id DESC
LIMIT 5;
```

## Verify Previous Balance Calculation

### Check if Current SOA Previous Balance Matches Last SOA Total
```sql
-- Get current SOA previous balance
SELECT 
    'Current SOA' AS source,
    id AS soa_id,
    statement_date,
    FORMAT(balance_from_previous_bill, 2) AS value
FROM statement_of_accounts
WHERE account_no = 'A0001'
ORDER BY statement_date DESC, id DESC
LIMIT 1

UNION ALL

-- Get previous SOA total due (should match above)
SELECT 
    'Previous SOA' AS source,
    id AS soa_id,
    statement_date,
    FORMAT(total_amount_due, 2) AS value
FROM statement_of_accounts
WHERE account_no = 'A0001'
ORDER BY statement_date DESC, id DESC
LIMIT 1 OFFSET 1;
```

### Expected Result (Values Should Match)
```
+-------------+--------+-----------------+----------+
| source      | soa_id | statement_date  | value    |
+-------------+--------+-----------------+----------+
| Current SOA | 50     | 2025-12-05      | 3,897.00 |
| Previous SOA| 49     | 2025-11-05      | 3,897.00 |  ← Should match current's previous balance
+-------------+--------+-----------------+----------+
```

## Check All Accounts with Missing Values

### Find SOAs with Zero Values (Potential Issues)
```sql
SELECT 
    account_no,
    id AS soa_id,
    statement_date,
    CASE 
        WHEN discounts = 0 AND rebate = 0 AND service_charge = 0 AND staggered = 0 
        THEN 'ALL ZERO' 
        ELSE 'HAS VALUES' 
    END AS status,
    FORMAT(discounts, 2) AS discounts,
    FORMAT(rebate, 2) AS rebate,
    FORMAT(service_charge, 2) AS service_charge,
    FORMAT(staggered, 2) AS staggered
FROM statement_of_accounts
WHERE statement_date >= '2025-12-01'
ORDER BY statement_date DESC;
```

## Debug Payment Calculation

### Verify Payment Received Calculation
```sql
SELECT 
    s1.id AS current_soa_id,
    s1.account_no,
    s1.statement_date AS current_date,
    -- Current SOA data
    FORMAT(s1.balance_from_previous_bill, 2) AS current_prev_balance,
    FORMAT(s1.payment_received_previous, 2) AS current_payment,
    FORMAT(s1.remaining_balance_previous, 2) AS current_remaining,
    -- Previous SOA data (for comparison)
    s2.id AS previous_soa_id,
    s2.statement_date AS previous_date,
    FORMAT(s2.total_amount_due, 2) AS previous_total_due,
    -- Verification
    FORMAT(s1.balance_from_previous_bill - s1.remaining_balance_previous, 2) AS calculated_payment,
    CASE 
        WHEN s1.payment_received_previous = (s1.balance_from_previous_bill - s1.remaining_balance_previous)
        THEN '✓ CORRECT'
        ELSE '✗ MISMATCH'
    END AS payment_check
FROM statement_of_accounts s1
LEFT JOIN statement_of_accounts s2 ON s2.account_no = s1.account_no 
    AND s2.statement_date < s1.statement_date
WHERE s1.account_no = 'A0001'
ORDER BY s1.statement_date DESC
LIMIT 1;
```

## Check Rebate Application

### Verify Rebates are Being Applied
```sql
SELECT 
    soa.account_no,
    soa.statement_date,
    FORMAT(soa.rebate, 2) AS rebate_in_soa,
    mr.id AS rebate_id,
    mr.month AS rebate_month,
    mr.rebate_type,
    mr.selected_rebate,
    mr.number_of_dates AS rebate_days,
    mr.status AS rebate_status,
    ru.status AS usage_status
FROM statement_of_accounts soa
LEFT JOIN mass_rebates mr ON mr.month = DATE_FORMAT(soa.statement_date, '%M')
    AND mr.status IN ('Unused', 'Used')
LEFT JOIN rebates_usage ru ON ru.rebates_id = mr.id 
    AND ru.account_no = soa.account_no
WHERE soa.account_no = 'A0001'
ORDER BY soa.statement_date DESC
LIMIT 1;
```

## Check Recent Billing Generation Logs

### Last 10 SOA Generations
```sql
SELECT 
    id,
    account_no,
    statement_date,
    FORMAT(total_amount_due, 2) AS total,
    created_at,
    created_by
FROM statement_of_accounts
ORDER BY created_at DESC
LIMIT 10;
```

## Summary Query - Complete SOA Data

### Everything in One Query
```sql
SELECT 
    '═══════════════════════════════════' AS separator,
    'SOA COMPLETE DATA VERIFICATION' AS title,
    '═══════════════════════════════════' AS separator2

UNION ALL

SELECT 
    'Account Number:', account_no, ''
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1

UNION ALL

SELECT 
    'SOA ID:', CAST(id AS CHAR), ''
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1

UNION ALL

SELECT 
    '───────────────────────────────────', 'PREVIOUS CHARGES', '───────────────────────────────────'

UNION ALL

SELECT 
    'Balance from Previous Bill:', FORMAT(balance_from_previous_bill, 2), '{{Prev_Balance}}'
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1

UNION ALL

SELECT 
    'Payment Received:', FORMAT(payment_received_previous, 2), '{{Prev_Payment}}'
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1

UNION ALL

SELECT 
    'Remaining Balance:', FORMAT(remaining_balance_previous, 2), '{{Rem_Balance}}'
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1

UNION ALL

SELECT 
    '───────────────────────────────────', 'CURRENT CHARGES', '───────────────────────────────────'

UNION ALL

SELECT 
    'Monthly Service Fee:', FORMAT(monthly_service_fee, 2), '{{Monthly_Fee}}'
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1

UNION ALL

SELECT 
    'VAT:', FORMAT(vat, 2), '{{VAT}}'
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1

UNION ALL

SELECT 
    '───────────────────────────────────', 'OTHERS & BASIC CHARGES', '───────────────────────────────────'

UNION ALL

SELECT 
    'Discounts:', FORMAT(discounts, 2), '{{Amount_Discounts}}'
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1

UNION ALL

SELECT 
    'Rebates:', FORMAT(rebate, 2), '{{Amount_Rebates}}'
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1

UNION ALL

SELECT 
    'Service Charge:', FORMAT(service_charge, 2), '{{Amount_Service}}'
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1

UNION ALL

SELECT 
    'Staggered Payment:', FORMAT(staggered, 2), '{{Amount_Install}}'
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1

UNION ALL

SELECT 
    '───────────────────────────────────', 'TOTALS', '───────────────────────────────────'

UNION ALL

SELECT 
    'Amount Due:', FORMAT(amount_due, 2), '{{Amount_Due}}'
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1

UNION ALL

SELECT 
    'Total Amount Due:', FORMAT(total_amount_due, 2), '{{Total_Due}}'
FROM statement_of_accounts 
WHERE account_no = 'A0001' 
ORDER BY statement_date DESC 
LIMIT 1;
```

## Usage Instructions

1. Replace `'A0001'` with your actual account number in all queries
2. Run queries in your MySQL client or phpMyAdmin
3. Compare query results with PDF output
4. Check if values match the template variables shown

## Expected Workflow

```
1. Run "Get Latest SOA with All Charges" query
2. Verify all columns have data (not NULL or 0 unexpectedly)
3. Run "Mapping Verification" query
4. Compare output with PDF template variables
5. If mismatch found, check Laravel logs for PDF generation
```
