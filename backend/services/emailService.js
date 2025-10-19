const nodemailer = require('nodemailer');

const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@bushublk.com';
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || 'BusHubLK Support';

// Create transporter using Gmail SMTP (Nodemailer only)
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for port 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Add debugging
    logger: true,
    debug: process.env.NODE_ENV === 'development'
  });
  
  // Verify transporter configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.error('[emailService] SMTP connection error:', error);
    } else {
      console.log('[emailService] SMTP server is ready to send emails');
    }
  });
  
  console.log('[emailService] Email service initialized with Nodemailer (Gmail SMTP)');
} else {
  console.warn('[emailService] EMAIL_USER or EMAIL_PASS not configured. Emails will be logged but not sent.');
  console.warn('[emailService] Please set EMAIL_USER and EMAIL_PASS in your .env file');
}

const buildResetEmail = (toEmail, name, resetLink) => {
  const safeName = name || 'there';
  return {
    from: `"${DEFAULT_FROM_NAME}" <${DEFAULT_FROM_EMAIL}>`,
    to: toEmail,
    subject: 'Reset your BusHubLK password',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="color: #2563eb;">Hi ${safeName},</h2>
        <p>We received a request to reset the password for your BusHubLK account.</p>
        <p>Please click the button below to set a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 60 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
        <p>Stay safe,<br/>The BusHubLK Team</p>
      </div>
    `,
    text: `Hi ${safeName},\n\nWe received a request to reset the password for your BusHubLK account.\n\nUse the link below to set a new password (valid for 60 minutes):\n${resetLink}\n\nIf you didn't request this, you can ignore this email.\n\nStay safe,\nThe BusHubLK Team`
  };
};

const sendPasswordResetEmail = async (toEmail, name, resetLink) => {
  if (!toEmail || !resetLink) {
    throw new Error('Missing required parameters for password reset email');
  }

  if (!transporter) {
    const errorMsg = 'Email service not configured. Please set EMAIL_USER and EMAIL_PASS in .env file.';
    console.error('[emailService]', errorMsg);
    console.info('[emailService] Reset link (not sent):', resetLink);
    throw new Error(errorMsg);
  }

  const message = buildResetEmail(toEmail, name, resetLink);

  try {
    const info = await transporter.sendMail(message);
    console.log(`[emailService] ✅ Password reset email sent successfully to ${toEmail}`);
    console.log(`[emailService] Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[emailService] ❌ Failed to send password reset email:', error.message);
    
    // Log specific error details
    if (error.code) {
      console.error('[emailService] Error code:', error.code);
    }
    if (error.command) {
      console.error('[emailService] Failed command:', error.command);
    }
    
    // Throw user-friendly error
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = {
  sendPasswordResetEmail
};
