const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/userModel');
const Driver = require('../models/Driver');
const { sendPasswordResetEmail } = require('../services/emailService');

// Store reset tokens temporarily (in production, use Redis or database)
const resetTokens = new Map();

const requestPasswordReset = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Check if user is a driver
    if (user.role_name !== 'driver') {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Store token with expiry
    resetTokens.set(resetToken, {
      userId: user.user_id,
      email: user.email,
      expiry: resetTokenExpiry
    });

    // Send reset email
    await sendPasswordResetEmail(user.email, user.first_name, resetToken);

    res.json({
      success: true,
      message: 'Password reset link has been sent to your email address.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.'
    });
  }
};

const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { token, newPassword } = req.body;

  try {
    // Validate token
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token.'
      });
    }

    // Check if token is expired
    if (Date.now() > tokenData.expiry) {
      resetTokens.delete(token);
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired. Please request a new one.'
      });
    }

    // Get user
    const user = await User.findById(tokenData.userId);
    if (!user) {
      resetTokens.delete(token);
      return res.status(400).json({
        success: false,
        error: 'User not found.'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await User.updatePassword(user.user_id, hashedPassword);

    // Remove used token
    resetTokens.delete(token);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.'
    });
  }
};

const validateResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reset token.'
      });
    }

    if (Date.now() > tokenData.expiry) {
      resetTokens.delete(token);
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired.'
      });
    }

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
