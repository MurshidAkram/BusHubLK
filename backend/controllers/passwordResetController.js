const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/userModel');
const Driver = require('../models/Driver');
const { sendPasswordResetEmail } = require('../services/emailService');
const db = require('../config/db'); // Use the same db connection as userModel

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

    console.log('Reset token stored:', {
      token: resetToken,
      userId: user.user_id,
      email: user.email,
      expiry: new Date(resetTokenExpiry)
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
    console.log('Password reset attempt:', { token, hasPassword: !!newPassword });
    
    // Validate token
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      console.log('Token not found in memory store');
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token.'
      });
    }

    console.log('Token data found:', tokenData);

    // Check if token is expired
    if (Date.now() > tokenData.expiry) {
      resetTokens.delete(token);
      console.log('Token expired');
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired. Please request a new one.'
      });
    }

    // Get user
    const user = await User.findById(tokenData.userId);
    if (!user) {
      resetTokens.delete(token);
      console.log('User not found for ID:', tokenData.userId);
      return res.status(400).json({
        success: false,
        error: 'User not found.'
      });
    }

    console.log('User found:', { userId: user.user_id, email: user.email });

    // Hash new password using SAME settings as userModel.js (10 rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Password hashed successfully with 10 rounds');

    // Get current password hash for comparison
    const currentUser = await User.findByEmail(user.email);
    console.log('Current password hash length:', currentUser.password_hash?.length);
    console.log('New password hash length:', hashedPassword.length);

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
      resetTokens.delete(token);
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
