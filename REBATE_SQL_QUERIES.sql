-- SQL QUERIES TO DIAGNOSE AND FIX REBATE ISSUE
-- ================================================

-- 1. Check current customer and technical details
-- ------------------------------------------------
SELECT 
    ba.account_no,
    c.first_name,
    c.last_name,
    c.location,
    c.barangay,
    td.lcpnap,
    td.lcp,
    td.nap
FROM billing_accounts ba
JOIN customers c ON c.id = ba.customer_id
LEFT JOIN technical_details td ON td.account_id = ba.id
WHERE ba.account_no = 'A0001';

-- Expected result: Check if td.lcpnap has a value
-- If NULL or doesn't match rebate, rebate won't apply


-- 2. Check available rebates
-- ---------------------------
SELECT 
    id,
    rebate_type,
    selected_rebate,
    number_of_dates,
    status,
    modified_date
FROM rebates
WHERE status = 'Unused';

-- Expected result: Should show rebate with selected_rebate value
-- This value must EXACTLY match the customer's lcpnap field


-- 3. Update customer's technical details (if missing)
-- ----------------------------------------------------
-- Option A: If technical_details record exists but lcpnap is NULL
UPDATE technical_details td
JOIN billing_accounts ba ON ba.id = td.account_id
SET td.lcpnap = 'LCP-001 to NAP-001',  -- Match this with the rebate's selected_rebate
    td.lcp = 'LCP-001',
    td.nap = 'NAP-001'
WHERE ba.account_no = 'A0001';

-- Option B: If no technical_details record exists
INSERT INTO technical_details (
    account_id,
    lcpnap,
    lcp,
    nap,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    ba.id,
    'LCP-001 to NAP-001',  -- Match this with the rebate's selected_rebate
    'LCP-001',
    'NAP-001',
    1,
    1,
    NOW(),
    NOW()
FROM billing_accounts ba
WHERE ba.account_no = 'A0001'
AND NOT EXISTS (
    SELECT 1 FROM technical_details td WHERE td.account_id = ba.id
);


-- 4. Verify the fix
-- ------------------
-- Run this after updating technical_details
SELECT 
    ba.account_no,
    td.lcpnap as customer_lcpnap,
    r.selected_rebate as rebate_value,
    r.rebate_type,
    r.number_of_dates,
    CASE 
        WHEN td.lcpnap = r.selected_rebate THEN 'MATCH ✓'
        ELSE 'NO MATCH ✗'
    END as match_status
FROM billing_accounts ba
JOIN customers c ON c.id = ba.customer_id
JOIN technical_details td ON td.account_id = ba.id
CROSS JOIN rebates r
WHERE ba.account_no = 'A0001'
AND r.status = 'Unused'
AND r.rebate_type = 'lcpnap';

-- Expected result: match_status should show 'MATCH ✓'


-- 5. Test calculation
-- -------------------
-- This shows what the rebate amount should be
SELECT 
    ba.account_no,
    p.price as monthly_fee,
    r.number_of_dates as rebate_days,
    (p.price / 30) as daily_rate,
    ((p.price / 30) * r.number_of_dates) as rebate_amount
FROM billing_accounts ba
JOIN customers c ON c.id = ba.customer_id
JOIN technical_details td ON td.account_id = ba.id
JOIN plan_list p ON p.plan_name = SUBSTRING_INDEX(c.desired_plan, ' - ', 1)
CROSS JOIN rebates r
WHERE ba.account_no = 'A0001'
AND r.status = 'Unused'
AND r.rebate_type = 'lcpnap'
AND td.lcpnap = r.selected_rebate;

-- Expected result: Should show rebate_amount that will be deducted


-- 6. After running billing generation, verify rebate was applied
-- --------------------------------------------------------------
SELECT 
    i.id as invoice_id,
    i.invoice_date,
    i.invoice_balance,
    i.others_and_basic_charges,
    i.total_amount,
    r.status as rebate_status,
    r.modified_date as rebate_used_date
FROM invoices i
JOIN billing_accounts ba ON ba.account_no = i.account_no
CROSS JOIN rebates r
WHERE ba.account_no = 'A0001'
AND i.invoice_date = CURDATE()
ORDER BY i.id DESC
LIMIT 1;

-- Expected result: 
-- - rebate_status should be 'Used'
-- - others_and_basic_charges should be reduced by rebate amount
