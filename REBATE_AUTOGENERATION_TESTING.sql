-- REBATE AUTOGENERATION TESTING SCRIPT
-- Run these queries to test the rebate functionality

-- ============================================
-- SETUP: Clean slate for testing
-- ============================================

-- Clear existing test data (optional)
-- TRUNCATE TABLE rebates_usage;
-- DELETE FROM rebates WHERE id > 13;

-- ============================================
-- TEST CASE 1: Single Account Rebate
-- ============================================

-- Create a test rebate for November
INSERT INTO rebates (rebates_id, number_of_dates, rebate_type, selected_rebate, month, status, modified_by, modified_date)
VALUES (14, 2, 'lcpnap', 'LCP-JU1 to NAP-JU1', 'November', 'Unused', 'admin@amperecloud.com', NOW());

-- Create rebate_usage entry for one account
INSERT INTO rebates_usage (rebates_id, account_no, status, month)
VALUES (14, 'A0001', 'Unused', 'November');

-- Check setup
SELECT 'Test Setup' as step, r.*, ru.account_no, ru.status as usage_status
FROM rebates r
LEFT JOIN rebates_usage ru ON r.id = ru.rebates_id
WHERE r.id = 14;

-- After running invoice generation for A0001, verify:
SELECT 'After Invoice Generation' as step,
       r.id as rebate_id,
       r.status as rebate_status,
       ru.id as usage_id,
       ru.account_no,
       ru.status as usage_status
FROM rebates r
LEFT JOIN rebates_usage ru ON r.id = ru.rebates_id
WHERE r.id = 14;

-- Expected Result:
-- rebate_status = 'Used'
-- usage_status = 'Used'

-- ============================================
-- TEST CASE 2: Multiple Account Rebate
-- ============================================

-- Create a test rebate for November
INSERT INTO rebates (rebates_id, number_of_dates, rebate_type, selected_rebate, month, status, modified_by, modified_date)
VALUES (15, 3, 'location', 'Pasay', 'November', 'Unused', 'admin@amperecloud.com', NOW());

-- Create rebate_usage entries for three accounts
INSERT INTO rebates_usage (rebates_id, account_no, status, month) VALUES
(15, 'A0001', 'Unused', 'November'),
(15, 'A0002', 'Unused', 'November'),
(15, 'A0003', 'Unused', 'November');

-- Check setup
SELECT 'Test Setup - Multiple Accounts' as step, r.*, ru.account_no, ru.status as usage_status
FROM rebates r
LEFT JOIN rebates_usage ru ON r.id = ru.rebates_id
WHERE r.id = 15;

-- After first invoice (A0001), verify:
SELECT 'After First Invoice' as step,
       r.id as rebate_id,
       r.status as rebate_status,
       COUNT(CASE WHEN ru.status = 'Unused' THEN 1 END) as unused_count,
       COUNT(CASE WHEN ru.status = 'Used' THEN 1 END) as used_count
FROM rebates r
LEFT JOIN rebates_usage ru ON r.id = ru.rebates_id
WHERE r.id = 15
GROUP BY r.id, r.status;

-- Expected Result after first invoice:
-- rebate_status = 'Unused'
-- unused_count = 2
-- used_count = 1

-- After all invoices, verify:
SELECT 'After All Invoices' as step,
       r.id as rebate_id,
       r.status as rebate_status,
       COUNT(CASE WHEN ru.status = 'Unused' THEN 1 END) as unused_count,
       COUNT(CASE WHEN ru.status = 'Used' THEN 1 END) as used_count
FROM rebates r
LEFT JOIN rebates_usage ru ON r.id = ru.rebates_id
WHERE r.id = 15
GROUP BY r.id, r.status;

-- Expected Result after all invoices:
-- rebate_status = 'Used'
-- unused_count = 0
-- used_count = 3

-- ============================================
-- TEST CASE 3: Wrong Month
-- ============================================

-- Create a test rebate for December
INSERT INTO rebates (rebates_id, number_of_dates, rebate_type, selected_rebate, month, status, modified_by, modified_date)
VALUES (16, 2, 'lcpnap', 'LCP-JU1 to NAP-JU1', 'December', 'Unused', 'admin@amperecloud.com', NOW());

INSERT INTO rebates_usage (rebates_id, account_no, status, month)
VALUES (16, 'A0001', 'Unused', 'December');

-- Try to generate invoice in November (current month)
-- Expected: Rebate should NOT be applied because month doesn't match

-- Verify no changes:
SELECT 'Wrong Month Test' as step, r.*, ru.account_no, ru.status as usage_status
FROM rebates r
LEFT JOIN rebates_usage ru ON r.id = ru.rebates_id
WHERE r.id = 16;

-- Expected Result:
-- Both rebate_status and usage_status should remain 'Unused'

-- ============================================
-- TEST CASE 4: Account Not in Usage Table
-- ============================================

-- Use existing rebate but generate invoice for unlisted account
-- Rebate 14 is for A0001, try generating for A0999

-- Verify no changes to existing rebate_usage:
SELECT 'Account Not Listed' as step,
       ru.rebates_id,
       ru.account_no,
       ru.status
FROM rebates_usage ru
WHERE ru.rebates_id = 14;

-- Expected Result:
-- Only A0001 should be listed
-- A0999 should NOT receive the rebate

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all rebates and their usage status
SELECT 
    r.id as rebate_id,
    r.rebates_id,
    r.month,
    r.rebate_type,
    r.selected_rebate,
    r.number_of_dates,
    r.status as rebate_status,
    COUNT(ru.id) as total_accounts,
    COUNT(CASE WHEN ru.status = 'Unused' THEN 1 END) as unused_accounts,
    COUNT(CASE WHEN ru.status = 'Used' THEN 1 END) as used_accounts
FROM rebates r
LEFT JOIN rebates_usage ru ON r.id = ru.rebates_id
GROUP BY r.id, r.rebates_id, r.month, r.rebate_type, r.selected_rebate, r.number_of_dates, r.status
ORDER BY r.id DESC;

-- Check specific rebate usage details
SELECT 
    r.id as rebate_id,
    r.month as rebate_month,
    r.status as rebate_status,
    ru.id as usage_id,
    ru.account_no,
    ru.status as usage_status,
    ru.month as usage_month
FROM rebates r
LEFT JOIN rebates_usage ru ON r.id = ru.rebates_id
WHERE r.id >= 14
ORDER BY r.id, ru.account_no;

-- Check if there are any unused rebate_usage entries for a specific rebate
SELECT 
    rebates_id,
    COUNT(*) as unused_count
FROM rebates_usage
WHERE status = 'Unused'
  AND rebates_id IN (14, 15, 16)
GROUP BY rebates_id;

-- ============================================
-- CLEANUP (Run after testing if needed)
-- ============================================

-- Delete test data
-- DELETE FROM rebates_usage WHERE rebates_id IN (14, 15, 16);
-- DELETE FROM rebates WHERE id IN (14, 15, 16);

-- Reset test accounts if needed
-- UPDATE rebates SET status = 'Unused' WHERE id IN (14, 15, 16);
-- UPDATE rebates_usage SET status = 'Unused' WHERE rebates_id IN (14, 15, 16);
