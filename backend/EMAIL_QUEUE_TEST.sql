-- Email Queue System Test SQL Script

-- 1. Check if email_queue table exists
SHOW TABLES LIKE 'email_queue';

-- 2. View email_queue table structure
DESCRIBE email_queue;

-- 3. Check if CC and BCC columns exist in email_templates
SHOW COLUMNS FROM email_templates LIKE 'CC';
SHOW COLUMNS FROM email_templates LIKE 'BCC';

-- 4. Insert test email template
INSERT INTO email_templates (Template_Code, Subject_Line, CC, BCC, Body_HTML, Description, Is_Active)
VALUES (
    'TEST_EMAIL',
    'Test Email - {{Account_No}}',
    'billing@atssfiber.ph',
    'archive@atssfiber.ph',
    '<html><body><h1>Test Email</h1><p>Dear {{Full_Name}},</p><p>This is a test email.</p><p>Account: {{Account_No}}</p></body></html>',
    'Test email template',
    1
)
ON DUPLICATE KEY UPDATE
    Subject_Line = VALUES(Subject_Line),
    CC = VALUES(CC),
    BCC = VALUES(BCC),
    Body_HTML = VALUES(Body_HTML),
    Is_Active = VALUES(Is_Active);

-- 5. Insert SOA email template
INSERT INTO email_templates (Template_Code, Subject_Line, CC, BCC, Body_HTML, Description, Is_Active)
VALUES (
    'SOA_DESIGN_EMAIL',
    'Statement of Account - {{Account_No}}',
    'billing@atssfiber.ph',
    '',
    '<html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Statement of Account</h2>
            <p>Dear {{Full_Name}},</p>
            <p>Please find attached your Statement of Account.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Account Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{Account_No}}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Statement Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{Statement_Date}}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Due Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{Due_Date}}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total Amount Due:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>PHP {{Total_Due}}</strong></td></tr>
            </table>
            
            <p>For inquiries, contact us at {{Provider_Hotline}}</p>
            <p>Thank you for choosing {{Company_Name}}!</p>
        </div>
    </body>
    </html>',
    'SOA Email Notification',
    1
)
ON DUPLICATE KEY UPDATE
    Subject_Line = VALUES(Subject_Line),
    CC = VALUES(CC),
    BCC = VALUES(BCC),
    Body_HTML = VALUES(Body_HTML),
    Is_Active = VALUES(Is_Active);

-- 6. View all email templates
SELECT Template_Code, Subject_Line, CC, BCC, Is_Active, Description
FROM email_templates
ORDER BY Template_Code;

-- 7. Queue status summary
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM email_queue
GROUP BY status;

-- 8. View pending emails
SELECT * FROM email_queue 
WHERE status = 'pending' 
ORDER BY created_at ASC 
LIMIT 10;

-- 9. View failed emails
SELECT id, account_no, recipient_email, subject, attempts, error_message, created_at
FROM email_queue 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;

-- 10. View sent emails (last 24 hours)
SELECT id, account_no, recipient_email, subject, sent_at
FROM email_queue 
WHERE status = 'sent' 
AND sent_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY sent_at DESC;

-- 11. Count emails by account
SELECT account_no, status, COUNT(*) as count
FROM email_queue
GROUP BY account_no, status
ORDER BY count DESC
LIMIT 10;

-- 12. Reset failed email for retry
-- UPDATE email_queue 
-- SET status = 'pending', error_message = NULL 
-- WHERE id = [email_id];

-- 13. Delete old sent emails (older than 30 days)
-- DELETE FROM email_queue 
-- WHERE status = 'sent' 
-- AND sent_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 14. Verify email queue summary
SELECT COUNT(*) as total_emails,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
       SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM email_queue;
