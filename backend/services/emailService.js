const nodemailer = require('nodemailer');
const { getDynamicBaseURL } = require('../utils/networkUtils');

const createTransport = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  
  switch (emailService.toLowerCase()) {
    case 'gmail':
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
    case 'outlook':
    case 'hotmail':
      return nodemailer.createTransport({
        service: 'hotmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
    case 'sendgrid':
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
      
    case 'smtp':
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
    default:
      throw new Error(`Unsupported email service: ${emailService}`);
  }
};

const sendPasswordResetEmail = async (email, firstName, resetToken) => {
  try {
    const transporter = createTransport();
    
    // Test the connection
    await transporter.verify();
    console.log('Email server connection verified');
    
    // Use dynamic IP address
    const baseURL = getDynamicBaseURL();
    const webResetUrl = `${baseURL}/api/password-reset/web/${resetToken}?token=${resetToken}`;
    const mobileResetUrl = `bushublk://reset-password?token=${resetToken}`;
    
    console.log('Generated reset URLs:', { webResetUrl, mobileResetUrl, baseURL });
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
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
              <p>We received a request to reset your password for your BusHubLK driver account.</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account is secure.
              </div>
              
              <p>Choose one of the following options to reset your password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${webResetUrl}" class="button">Reset Password (Web)</a>
                <a href="${mobileResetUrl}" class="button">Open in Mobile App</a>
              </div>
              
              <p><strong>Web Link:</strong><br>
              <a href="${webResetUrl}">${webResetUrl}</a></p>
              
              <p><strong>Mobile Deep Link:</strong><br>
              <code>${mobileResetUrl}</code></p>
              
              <div class="warning">
                <p><strong>Important:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>You can only use this link once</li>
                  <li>If the link expires, request a new password reset</li>
                </ul>
              </div>
              
              <p>If you're having trouble with the buttons above, copy and paste the web link into your browser.</p>
              
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
    console.log('Password reset email sent successfully:', result.messageId);
    return result;
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendPasswordResetEmail
};
