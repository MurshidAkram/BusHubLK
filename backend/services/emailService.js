const nodemailer = require('nodemailer');
// Removed getDynamicBaseURL as it's no longer used directly in this file for link construction,
// but it's good that it's present in your project for controller-side link generation.
// const { getDynamicBaseURL } = require('../utils/networkUtils'); 

// Configure Nodemailer transport based on environment variables
const createTransport = () => {
    // Determine the email service, defaulting to 'smtp' if not specified
    const emailService = process.env.EMAIL_SERVICE ? process.env.EMAIL_SERVICE.toLowerCase() : 'smtp';
    console.log(`[emailService] Attempting to configure transport for service: '${emailService}'`);

    switch (emailService) {
        case 'gmail':
            console.log("[emailService] Using Gmail transport.");
            return nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

        case 'outlook':
        case 'hotmail':
            console.log("[emailService] Using Hotmail/Outlook transport.");
            return nodemailer.createTransport({
                service: 'hotmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

        case 'sendgrid':
            console.log("[emailService] Using SendGrid transport.");
            // Nodemailer's SendGrid service uses 'apikey' as user and SENDGRID_API_KEY as pass
            if (!process.env.SENDGRID_API_KEY) {
                console.error("[emailService] SENDGRID_API_KEY is not defined when EMAIL_SERVICE is 'sendgrid'.");
                throw new Error("SENDGRID_API_KEY is missing in .env for SendGrid service.");
            }
            return nodemailer.createTransport({
                service: 'SendGrid', // Ensure 'SendGrid' is capitalized
                auth: {
                    user: 'apikey',
                    pass: process.env.SENDGRID_API_KEY
                }
            });

        case 'smtp':
            console.log("[emailService] Using generic SMTP transport.");
            console.log(`[emailService] SMTP Host: ${process.env.SMTP_HOST}`);
            console.log(`[emailService] SMTP Port: ${process.env.SMTP_PORT || '587'}`);
            console.log(`[emailService] SMTP Secure: ${process.env.SMTP_SECURE === 'true'}`);
            // Generic SMTP configuration
            return nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

        default:
            console.error(`[emailService] Unsupported email service specified in .env: ${process.env.EMAIL_SERVICE}`);
            throw new Error(`Unsupported email service: ${emailService}. Check EMAIL_SERVICE in .env.`);
    }
};

// Function to send the password reset email
const sendPasswordResetEmail = async (email, firstName, resetLink) => {
    try {
        const transporter = createTransport();

        // Test the connection (recommended in development, can be removed in production for speed)
        // This 'verify' step is what attempts to connect to the configured SMTP server.
        await transporter.verify();
        console.log('[emailService] Email server connection verified.');

        const mailOptions = {
            // Prioritize EMAIL_FROM, then SENDER_EMAIL (if it was used), then EMAIL_USER
            from: process.env.EMAIL_FROM || process.env.SENDER_EMAIL || process.env.EMAIL_USER,
            to: email,
            subject: 'BusHubLK - Password Reset Request',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 10px 0; font-weight: 600; font-size: 16px; }
                    .button:hover { background: #2563eb; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🚌 BusHubLK</h1>
                      <h2>Password Reset Request</h2>
                    </div>
                    <div class="content">
                      <p>Hello ${firstName},</p>
                      <p>We received a request to reset your password for your BusHubLK account.</p>

                      <div class="warning">
                        <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account is secure.
                      </div>

                      <p>Click the button below to reset your password:</p>

                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" class="button">🔐 Reset My Password</a>
                      </div>

                      <p><strong>Direct Link:</strong><br>
                      <a href="${resetLink}">${resetLink}</a></p>

                      <div class="warning">
                        <p><strong>Important:</strong></p>
                        <ul>
                          <li>This link will expire in 1 hour</li>
                          <li>You can only use this link once</li>
                          <li>If the link expires, request a new password reset</li>
                        </ul>
                      </div>

                      <p>If you're having trouble with the button above, copy and paste the direct link into your browser.</p>

                      <p>Best regards,<br>
                      The BusHubLK Team</p>
                    </div>
                    <div class="footer">
                      <p>This is an automated message. Please do not reply to this email.</p>
                      <p>&copy; 2024 BusHubLK. All rights reserved.</p>
                    </div>
                  </div>
                </body>
                </html>
              `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('[emailService] Password reset email sent successfully:', result.messageId);
        return result;

    } catch (error) {
        console.error('[emailService] Error sending password reset email:', error);
        // Log more details about SendGrid specific errors if it's the service used
        if (error.response && error.response.body) {
            console.error('[emailService] SendGrid error response:', error.response.body);
        }
        throw new Error('Failed to send password reset email');
    }
};

module.exports = {
    sendPasswordResetEmail
};