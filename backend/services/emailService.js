const sgMail = require('@sendgrid/mail');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@bushublk.com';
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || 'BusHubLK Support';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('[emailService] SENDGRID_API_KEY is not set. Emails will be logged but not sent.');
}

const buildResetEmail = (toEmail, name, resetLink) => {
  const safeName = name || 'there';
  return {
    to: toEmail,
    from: {
      email: DEFAULT_FROM_EMAIL,
      name: DEFAULT_FROM_NAME
    },
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

  if (!SENDGRID_API_KEY) {
    console.info('[emailService] SENDGRID_API_KEY missing. Logging reset link instead of sending email:', {
      toEmail,
      resetLink
    });
    return;
  }

  const message = buildResetEmail(toEmail, name, resetLink);

  try {
    await sgMail.send(message);
    console.log(`[emailService] Password reset email sent to ${toEmail}`);
  } catch (error) {
    console.error('[emailService] Failed to send password reset email:', error);
    if (error.response?.body) {
      console.error('[emailService] SendGrid response body:', error.response.body);
    }
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail
};
