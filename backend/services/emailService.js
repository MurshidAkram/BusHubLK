const nodemailer = require('nodemailer');

const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@bushublk.com';
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || 'BusHubLK Support';

// Create transporter using Gmail SMTP (Nodemailer only)
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
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

  // Check if resetLink contains multiple links (development mode)
  const links = resetLink.split('\n\nFor mobile testing on any network:\n');
  const primaryLink = links[0];
  const mobileLink = links[1];

  let htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="color: #2563eb;">Hi ${safeName},</h2>
      <p>We received a request to reset the password for your BusHubLK account.</p>
      <p>Please click the button below to set a new password:</p>
      <p style="margin: 24px 0;">
        <a href="${primaryLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Reset Password
        </a>
      </p>`;

  let textContent = `Hi ${safeName},\n\nWe received a request to reset the password for your BusHubLK account.\n\nUse the link below to set a new password (valid for 24 hours):\n${primaryLink}\n`;

  if (mobileLink) {
    htmlContent += `
      <p style="margin: 16px 0; font-size: 14px; color: #6b7280;">
        <strong>For mobile testing:</strong> If you're testing on a mobile device connected to a different network, use this link instead:<br/>
        <a href="${mobileLink}" style="color: #2563eb;">${mobileLink}</a>
      </p>`;
    textContent += `\nFor mobile testing on any network:\n${mobileLink}\n`;
  }

  htmlContent += `
      <p>This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.</p>
      <p>Stay safe,<br/>The BusHubLK Team</p>
    </div>`;

  textContent += `\nIf you didn't request this, you can ignore this email.\n\nStay safe,\nThe BusHubLK Team`;

  return {
    from: `"${DEFAULT_FROM_NAME}" <${DEFAULT_FROM_EMAIL}>`,
    to: toEmail,
    subject: 'Reset your BusHubLK password',
    html: htmlContent,
    text: textContent
  };
};

const sendPasswordResetEmail = async (toEmail, name, resetLink) => {
  if (!toEmail || !resetLink) {
    throw new Error('Missing required parameters for password reset email');
  }

  // Development mode: Log the reset link instead of sending email
  if (!transporter) {
    console.warn('[emailService] ⚠️ Email service not configured - running in DEVELOPMENT MODE');
    console.log('[emailService] 📧 Password reset email would be sent to:', toEmail);
    console.log('[emailService] 🔗 Reset link:', resetLink);

    // In development, also show local network link for testing on mobile devices
    if (process.env.NODE_ENV === 'development') {
      const localIP = require('../utils/networkUtils').getLocalIPAddress();
      const localPort = process.env.PORT || 5000;
      const localLink = resetLink.replace(/https?:\/\/[^\/]+/, `http://${localIP}:${localPort}`);
      console.log('[emailService] 🔗 Local Network Link (for mobile testing):', localLink);
    }

    console.log('[emailService] 📝 User can copy this link to test password reset:');
    console.log('[emailService] ' + resetLink);

    // In development, don't throw error - just log and continue
    // This allows testing without SMTP configuration
    return {
      messageId: 'dev-mode-' + Date.now(),
      accepted: [toEmail],
      response: 'Development mode - email logged to console'
    };
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

    // In development, fallback to logging instead of failing
    if (process.env.NODE_ENV === 'development') {
      console.warn('[emailService] ⚠️ Email send failed - falling back to DEVELOPMENT MODE');
      console.log('[emailService] 🔗 Reset link:', resetLink);

      // Also show local network link for mobile testing
      const localIP = require('../utils/networkUtils').getLocalIPAddress();
      const localPort = process.env.PORT || 5000;
      const localLink = resetLink.replace(/https?:\/\/[^\/]+/, `http://${localIP}:${localPort}`);
      console.log('[emailService] 🔗 Local Network Link (for mobile testing):', localLink);

      return {
        messageId: 'dev-fallback-' + Date.now(),
        accepted: [toEmail],
        response: 'Development mode fallback - email logged to console',
        error: error.message
      };
    }

    // In production, throw error
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = {
  sendPasswordResetEmail
};
