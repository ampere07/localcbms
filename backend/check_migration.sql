-- Check if the migration was executed
SELECT * FROM migrations WHERE migration LIKE '%add_account_no_to_service_orders%';

-- Check service_orders table structure
DESCRIBE service_orders;

-- If account_no doesn't exist, add it manually
-- ALTER TABLE service_orders ADD COLUMN account_no VARCHAR(255) AFTER id;
-- ALTER TABLE service_orders ADD INDEX idx_account_no (account_no);

-- Populate account_no if it's empty
-- UPDATE service_orders so
-- JOIN billing_accounts ba ON so.account_id = ba.id
-- SET so.account_no = ba.account_no
-- WHERE so.account_no IS NULL OR so.account_no = '';
