-- ============================================================================
-- Email Templates for Billing Notification System
-- ============================================================================
-- Run this SQL in your database to create all necessary templates
-- ============================================================================

-- SOA Email Template
INSERT INTO `email_templates` (`Template_Code`, `Subject_Line`, `CC`, `BCC`, `Body_HTML`, `Description`, `Is_Active`) VALUES
('SOA_DESIGN_EMAIL', 
 'Statement of Account - {{Account_No}} - Due {{due_date}}',
 '',
 'billing@yourcompany.com',
 '<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#2c3e50;color:#fff;padding:20px;text-align:center}.content{padding:20px;background:#f9f9f9}.amount-box{background:#fff;border:2px solid #e74c3c;padding:15px;margin:20px 0;text-align:center}.amount{font-size:24px;font-weight:700;color:#e74c3c}.footer{padding:20px;text-align:center;font-size:12px;color:#666}.button{display:inline-block;padding:12px 30px;background:#e74c3c;color:#fff;text-decoration:none;border-radius:5px;margin:10px 0}</style></head><body><div class="container"><div class="header"><h1>Statement of Account</h1><p>Account: {{account_no}}</p></div><div class="content"><p>Dear <strong>{{customer_name}}</strong>,</p><p>Your Statement of Account is now available.</p><div class="amount-box"><p>Total Amount Due</p><div class="amount">₱{{total_amount}}</div><p>Due Date: <strong>{{due_date}}</strong></p></div><p>Plan: {{plan}}</p><p style="text-align:center"><a href="{{Payment_Link}}" class="button">Pay Now</a></p></div><div class="footer"><p>This is an automated message.</p></div></div></body></html>',
 'SOA notification email',
 1);

-- Overdue Email
INSERT INTO `email_templates` (`Template_Code`, `Subject_Line`, `CC`, `BCC`, `Body_HTML`, `Description`, `Is_Active`) VALUES
('OVERDUE_DESIGN_EMAIL',
 'OVERDUE NOTICE - {{account_no}}',
 '',
 'billing@yourcompany.com',
 '<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#f39c12;color:#fff;padding:20px;text-align:center}.content{padding:20px;background:#fff3cd}.warning-box{background:#fff;border:3px solid #f39c12;padding:15px;margin:20px 0;text-align:center}.amount{font-size:28px;font-weight:700;color:#f39c12}.button{display:inline-block;padding:12px 30px;background:#f39c12;color:#fff;text-decoration:none;border-radius:5px;margin:10px 0}</style></head><body><div class="container"><div class="header"><h1>⚠️ OVERDUE NOTICE</h1></div><div class="content"><p>Dear <strong>{{customer_name}}</strong>,</p><p style="color:#e74c3c;font-weight:700">Your account has an overdue balance.</p><div class="warning-box"><p>Overdue Amount</p><div class="amount">₱{{total_amount}}</div></div><p style="text-align:center"><a href="{{Payment_Link}}" class="button">Pay Now</a></p></div></div></body></html>',
 'Overdue notice email',
 1);

-- DC Notice Email
INSERT INTO `email_templates` (`Template_Code`, `Subject_Line`, `CC`, `BCC`, `Body_HTML`, `Description`, `Is_Active`) VALUES
('DCNOTICE_DESIGN_EMAIL',
 '🚨 DISCONNECTION NOTICE - {{account_no}}',
 '',
 'billing@yourcompany.com',
 '<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#e74c3c;color:#fff;padding:20px;text-align:center}.content{padding:20px;background:#fce4e4}.critical-box{background:#fff;border:3px solid #e74c3c;padding:20px;margin:20px 0;text-align:center}.amount{font-size:28px;font-weight:700;color:#e74c3c}.button{display:inline-block;padding:15px 40px;background:#e74c3c;color:#fff;text-decoration:none;border-radius:5px;font-weight:700}</style></head><body><div class="container"><div class="header"><h1>🚨 DISCONNECTION NOTICE</h1></div><div class="content"><p>Dear <strong>{{customer_name}}</strong>,</p><p style="color:#e74c3c;font-weight:700;font-size:18px">⚠️ YOUR SERVICE WILL BE DISCONNECTED</p><div class="critical-box"><p>Outstanding Balance</p><div class="amount">₱{{total_amount}}</div><p style="font-size:20px;font-weight:700">Disconnection Date: {{DC_Date}}</p></div><p style="text-align:center"><a href="{{Payment_Link}}" class="button">PAY NOW</a></p></div></div></body></html>',
 'DC notice email',
 1);

-- SOA PDF Template
INSERT INTO `email_templates` (`Template_Code`, `Subject_Line`, `Body_HTML`, `Description`, `Is_Active`) VALUES
('SOA_DESIGN', '', '<!DOCTYPE html><html><head><style>@page{margin:0}body{margin:0;padding:40px;font-family:Helvetica,Arial,sans-serif;font-size:10pt}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:10px}.header h1{margin:0;font-size:18pt}table{width:100%;border-collapse:collapse;margin:20px 0}table.bordered td,table.bordered th{border:1px solid #333;padding:8px}.total-row{font-weight:700;font-size:12pt;background:#333;color:#fff}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #ccc;font-size:9pt;text-align:center}</style></head><body><div class="header"><h1>STATEMENT OF ACCOUNT</h1><p>SOA No: {{SOA_No}}</p></div><p><strong>Account No:</strong> {{Account_No}}</p><p><strong>Name:</strong> {{Full_Name}}</p><p><strong>Address:</strong> {{Address}}</p><p><strong>Plan:</strong> {{Plan}}</p><table class="bordered"><tr><td>Statement Date:</td><td>{{Statement_Date}}</td></tr><tr><td>Due Date:</td><td>{{Due_Date}}</td></tr></table><h3>Account Summary</h3><table class="bordered"><tr><td>Previous Balance</td><td align="right">₱{{Prev_Balance}}</td></tr><tr><td>Payment Received</td><td align="right">₱{{Prev_Payment}}</td></tr><tr><td>Monthly Service Fee</td><td align="right">₱{{Monthly_Fee}}</td></tr><tr><td>VAT (12%)</td><td align="right">₱{{VAT}}</td></tr>{{Row_Service}}{{Row_Staggered}}{{Row_Discounts}}{{Row_Rebates}}<tr class="total-row"><td>TOTAL AMOUNT DUE</td><td align="right">₱{{Total_Due}}</td></tr></table><div class="footer"><p>Pay online: {{Payment_Link}}</p></div></body></html>', 'SOA PDF template', 1);

-- Overdue PDF Template  
INSERT INTO `email_templates` (`Template_Code`, `Subject_Line`, `Body_HTML`, `Description`, `Is_Active`) VALUES
('OVERDUE_DESIGN', '', '<!DOCTYPE html><html><head><style>@page{margin:0}body{margin:0;padding:40px;font-family:Helvetica,Arial,sans-serif;font-size:10pt}.header{text-align:center;margin-bottom:30px;background:#f39c12;color:#fff;padding:20px}.header h1{margin:0;font-size:20pt}.warning{background:#fff3cd;border:3px solid #f39c12;padding:15px;margin:20px 0;text-align:center}.amount{font-size:24pt;color:#f39c12}.footer{margin-top:40px;text-align:center;font-size:9pt}</style></head><body><div class="header"><h1>⚠️ OVERDUE NOTICE</h1></div><div class="warning"><p style="font-weight:700;font-size:12pt">PAYMENT OVERDUE</p><p class="amount">₱{{Total_Due}}</p></div><p><strong>Account No:</strong> {{Account_No}}</p><p><strong>Name:</strong> {{Full_Name}}</p><p><strong>Original Due Date:</strong> {{Due_Date}}</p><div class="footer"><p>Pay online: {{Payment_Link}}</p></div></body></html>', 'Overdue PDF template', 1);

-- DC Notice PDF Template
INSERT INTO `email_templates` (`Template_Code`, `Subject_Line`, `Body_HTML`, `Description`, `Is_Active`) VALUES
('DCNOTICE_DESIGN', '', '<!DOCTYPE html><html><head><style>@page{margin:0}body{margin:0;padding:40px;font-family:Helvetica,Arial,sans-serif;font-size:10pt}.header{text-align:center;margin-bottom:30px;background:#e74c3c;color:#fff;padding:20px}.header h1{margin:0;font-size:20pt}.critical{background:#fce4e4;border:4px solid #e74c3c;padding:20px;margin:20px 0;text-align:center}.amount{font-size:28pt;color:#e74c3c}.dc-date{font-size:18pt;color:#c0392b}.footer{margin-top:40px;text-align:center;font-size:9pt;border-top:2px solid #e74c3c;padding-top:20px}</style></head><body><div class="header"><h1>🚨 DISCONNECTION NOTICE</h1><h2>FINAL WARNING</h2></div><div class="critical"><p style="font-weight:700;font-size:14pt">SERVICE WILL BE DISCONNECTED</p><p class="dc-date">{{DC_Date}}</p><p class="amount">₱{{Total_Due}}</p></div><p><strong>Account No:</strong> {{Account_No}}</p><p><strong>Name:</strong> {{Full_Name}}</p><p><strong>Address:</strong> {{Address}}</p><div class="footer"><p>Pay Now: {{Payment_Link}}</p></div></body></html>', 'DC Notice PDF template', 1);
