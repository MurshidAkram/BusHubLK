const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/userModel');
// const Driver = require('../models/Driver'); // Driver model import not used in provided snippet, can be removed if not needed elsewhere
const { sendPasswordResetEmail } = require('../services/emailService');
const db = require('../config/db'); // Use the same db connection as userModel
const { getDynamicBaseURL } = require('../utils/networkUtils'); // Import utility for base URL

// Store reset tokens temporarily (in production, use Redis or database)
const resetTokens = new Map(); // IMPORTANT: This is an in-memory store and will be cleared on server restart.
                               // For production, persist tokens in your database or a dedicated service like Redis.

const requestPasswordReset = async (req, res) => {
  console.log('🔄 Password reset request received');
  console.log('📧 Request body:', req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors for password reset request:', errors.array());
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email } = req.body;
  console.log('📧 Processing password reset for email:', email);

  try {
    // Find user by email
    console.log('🔍 Looking up user in database...');
    const user = await User.findByEmail(email);

    if (!user) {
      console.log(`⚠️ Password reset requested for non-existent email: ${email}`);
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent to your email.'
      });
    }

    console.log('✅ User found:', {
      user_id: user.user_id,
      email: user.email,
      role: user.role_name,
      is_active: user.is_active
    });

    // Check if user role is supported
    if (user.role_name !== 'driver' && user.role_name !== 'passenger' && user.role_name !== 'admin') {
      console.log(`⚠️ Password reset requested for unsupported role: ${user.role_name} for email: ${email}`);
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent to your email.'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      console.log(`❌ Attempted password reset for deactivated account: ${email}`);
      return res.status(400).json({
        success: false,
        error: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Generate reset token
    console.log('🔑 Generating reset token...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 86400000; // 24 hours from now (increased from 1 hour)

    // Store token with expiry
    resetTokens.set(resetToken, {
      userId: user.user_id,
      email: user.email,
      expiry: resetTokenExpiry
    });

    console.log('✅ Reset token stored:', {
      token: resetToken.substring(0, 10) + '...',
      userId: user.user_id,
      email: user.email,
      expiry: new Date(resetTokenExpiry).toISOString()
    });

    // Construct the universal reset link
    console.log('🌐 Getting base URL...');
    const baseURL = getDynamicBaseURL();
    console.log('📍 Base URL:', baseURL);

    const resetLink = `${baseURL}/api/password-reset/universal/${resetToken}?email=${encodeURIComponent(user.email)}`;
    console.log('🔗 Generated Reset Link:', resetLink);

    // Also generate a new request link for when tokens expire
    const newRequestLink = `${baseURL}/forgot-password?email=${encodeURIComponent(user.email)}`;
    console.log('🔄 New Request Link (for expired tokens):', newRequestLink);

    // Send reset email
    console.log('📧 Sending reset email...');
    await sendPasswordResetEmail(user.email, user.first_name, resetLink);
    console.log('✅ Reset email sent successfully');

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent to your email.'
    });

  } catch (error) {
    console.error('❌ Password reset request error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });

    res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const resetPassword = async (req, res) => {
  console.log('🔄 Password reset request received');
  console.log('📋 Request body keys:', Object.keys(req.body));
  console.log('📋 Request headers:', req.headers);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // THIS LINE IS CRUCIAL FOR DEBUGGING
    console.error('❌ Validation errors for password reset submission:', errors.array());

    return res.status(400).json({
      success: false,
      message: 'Password validation failed.', // This will be shown in frontend Alert
      errors: errors.array() // This provides specific details for debugging frontend
    });
  }

  const { token, email, newPassword } = req.body; // Added email from req.body for better validation/lookup

  try {
    console.log('✅ Validation passed');
    console.log('📧 Password reset attempt:', {
      token: token ? `${token.substring(0, 10)}...` : 'MISSING',
      email: email || 'MISSING',
      hasPassword: !!newPassword,
      passwordLength: newPassword?.length || 0
    });

    // Validate token
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      console.log('Token not found in memory store');
      // For form-urlencoded requests (web), redirect to an error page or show a message
      if (req.get('Content-Type') && req.get('Content-Type').includes('application/x-www-form-urlencoded')) {
        return res.status(400).send(`
          <!DOCTYPE html><html><head><title>Error</title></head><body>
          <h2 style="color:red;">Error: Invalid or expired reset token.</h2>
          <p>Please request a new password reset link.</p>
          <p><a href="/">Go to Homepage</a></p>
          </body></html>
        `);
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token.'
      });
    }

    console.log('Token data found:', tokenData);

    // Ensure the email from the request body matches the email associated with the token
    if (tokenData.email !== email) {
      console.log(`Email mismatch: token email=${tokenData.email}, request email=${email}`);
      if (req.get('Content-Type') && req.get('Content-Type').includes('application/x-www-form-urlencoded')) {
        return res.send(`
          <!DOCTYPE html><html><head><title>Error</title></head><body>
          <h2 style="color:red;">Error: Email mismatch.</h2>
          <p>The email provided does not match the one associated with the reset token.</p>
          </body></html>
        `);
      }
      return res.status(400).json({
        success: false,
        error: 'Email mismatch for the given token.'
      });
    }

    // Check if token is expired
    if (Date.now() > tokenData.expiry) {
      resetTokens.delete(token); // Clean up expired token
      console.log('Token expired');

      // Generate a new request link for convenience
      const baseURL = getDynamicBaseURL();
      const newRequestLink = `${baseURL}/forgot-password?email=${encodeURIComponent(tokenData.email)}`;

      if (req.get('Content-Type') && req.get('Content-Type').includes('application/x-www-form-urlencoded')) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Token Expired - BusHubLK</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f4f7f6; }
              .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
              h2 { color: #dc2626; margin-bottom: 20px; }
              p { color: #6b7280; margin-bottom: 30px; line-height: 1.6; }
              .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
              .button:hover { background: #1d4ed8; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>🔒 Reset Link Expired</h2>
              <p>Your password reset link has expired for security reasons.</p>
              <p>Don't worry! You can request a new password reset link.</p>
              <p><strong>What to do next:</strong></p>
              <ul style="text-align: left; display: inline-block; margin-bottom: 30px;">
                <li>Go back to the app and request a new password reset</li>
                <li>Check your email for the new reset link</li>
                <li>Use the link within 24 hours</li>
              </ul>
              <a href="${newRequestLink}" class="button">Request New Reset Link</a>
            </div>
          </body>
          </html>
        `);
      }
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired. Please request a new password reset link.',
        action: 'request_new_link',
        email: tokenData.email
      });
    }

    // Get user from DB using userId from tokenData (more robust)
    const user = await User.findById(tokenData.userId);
    if (!user) {
      resetTokens.delete(token); // Clean up invalid token
      console.log('User not found for ID:', tokenData.userId);
      if (req.get('Content-Type') && req.get('Content-Type').includes('application/x-www-form-urlencoded')) {
        return res.send(`
          <!DOCTYPE html><html><head><title>Error</title></head><body>
          <h2 style="color:red;">Error: User not found.</h2>
          <p>There was an issue locating your account. Please try again.</p>
          </body></html>
        `);
      }
      return res.status(400).json({
        success: false,
        error: 'User not found.'
      });
    }

    console.log('User found:', { userId: user.user_id, email: user.email });

    // Hash new password using SAME settings as userModel.js (10 rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Password hashed successfully with 10 rounds');

    // DIRECT DATABASE UPDATE using same connection as userModel
    try {
      console.log('Attempting direct database update...');

      const updateQuery = `
        UPDATE users
        SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING user_id, email, updated_at
      `;

      const updateResult = await db.query(updateQuery, [user.user_id, hashedPassword]);
      console.log('Database update result:', {
        rowCount: updateResult.rowCount,
        updatedUser: updateResult.rows[0]
      });

      if (updateResult.rowCount === 0) {
        throw new Error('User not found or password not updated');
      }

      // Verify the password was actually updated by fetching the user again
      const verifyUser = await User.findByEmail(user.email);
      console.log('Verification - Updated password hash length:', verifyUser.password_hash?.length);

      // Test the new password immediately
      const testMatch = await bcrypt.compare(newPassword, verifyUser.password_hash);
      console.log('Password verification test:', testMatch ? 'SUCCESS' : 'FAILED');

      if (!testMatch) {
        throw new Error('Password update verification failed');
      }

    } catch (dbError) {
      console.error('Direct database update error:', dbError);
      throw dbError;
    }

    // Remove used token
    resetTokens.delete(token);
    console.log('Token removed from memory store');

    // Handle HTML response for form submissions (e.g., from web browser)
    if (req.get('Content-Type') && req.get('Content-Type').includes('application/x-www-form-urlencoded')) {
      const APP_LOGIN_DEEPLINK = 'bushublkapp://login'; // Define or import this if it's constant
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Password Reset Success</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f2f5; }
            .success {
                color: #065f46;
                background: #d1fae5;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                max-width: 400px;
                margin: 50px auto;
            }
            h2 { color: #10b981; margin-bottom: 15px; }
            p { margin-bottom: 10px; line-height: 1.5; }
            a { color: #3b82f6; text-decoration: none; font-weight: bold; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="success">
            <h2>✅ Password Reset Successful!</h2>
            <p>Your password has been reset successfully.</p>
            <p>You can now log in to the BusHubLK app with your new password.</p>
            <p><a href="${APP_LOGIN_DEEPLINK}">Open BusHubLK App</a></p>
          </div>
        </body>
        </html>
      `);
    }

    // Default JSON response for API clients (like your React Native app)
    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    // Ensure response is only sent once
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

const validateResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    console.log('Validating token:', token);

    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      console.log('Token not found');
      return res.status(400).json({
        success: false,
        error: 'Invalid reset token.'
      });
    }

    if (Date.now() > tokenData.expiry) {
      resetTokens.delete(token); // Clean up expired token
      console.log('Token expired');
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired.'
      });
    }

    console.log('Token is valid');
    res.json({
      success: true,
      message: 'Token is valid.',
      email: tokenData.email
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error.'
    });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
  validateResetToken
};