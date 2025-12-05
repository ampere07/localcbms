-- Check service_orders table structure
DESCRIBE service_orders;

-- Check service_orders data
SELECT id, account_id, account_no, timestamp, support_status 
FROM service_orders 
LIMIT 5;

-- Check if account_no exists and is populated
SELECT 
    COUNT(*) as total_records,
    COUNT(account_id) as has_account_id,
    COUNT(account_no) as has_account_no
FROM service_orders;
