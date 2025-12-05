-- NOTE: This SQL is NOT needed anymore!
-- The system will use SOA_TEMPLATE for both PDF generation and email body.
-- You can delete this file or keep it for reference if you want to create
-- a separate email template in the future.

-- If you want a separate email template (recommended), uncomment below:
/*
INSERT INTO email_templates (Template_Code, Subject_Line, Body_HTML, Description, Is_Active) 
VALUES (
    'SOA_EMAIL_TEMPLATE',
    'Your Statement of Account - {{account_no}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">Statement of Account</h1>
        </div>

        <p style="color: #666; line-height: 1.6;">Dear {{customer_name}},</p>

        <p style="color: #666; line-height: 1.6;">
            Your Statement of Account for account <strong>{{account_no}}</strong> is now available.
        </p>

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0; color: #333;">
                <strong>Total Amount Due:</strong> ₱{{total_amount}}
            </p>
            <p style="margin: 10px 0; color: #333;">
                <strong>Due Date:</strong> {{due_date}}
            </p>
            <p style="margin: 10px 0; color: #333;">
                <strong>Plan:</strong> {{plan}}
            </p>
        </div>

        <p style="color: #666; line-height: 1.6;">
            Please find your detailed Statement of Account attached to this email.
        </p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{google_drive_url}}" style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Statement
            </a>
        </div>

        <p style="color: #666; line-height: 1.6; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            If you have any questions, please contact us at {{contact_no}}.
        </p>
        
        <p style="color: #999; text-align: center; font-size: 11px; margin-top: 20px;">
            This is an automated email. Please do not reply to this message.
        </p>
    </div>
</body>
</html>',
    'Email template for SOA notification with PDF attachment',
    1
);
