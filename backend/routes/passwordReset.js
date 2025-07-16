const express = require('express');
const path = require('path');
const { body, param } = require('express-validator');
const {
  requestPasswordReset,
  resetPassword,
  validateResetToken
} = require('../controllers/passwordResetController');

const router = express.Router();

// @route   POST /api/password-reset/request
// @desc    Request password reset
// @access  Public
router.post('/request', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], requestPasswordReset);

// @route   POST /api/password-reset/reset
// @desc    Reset password with token (handles both JSON and form data)
// @access  Public
router.post('/reset', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
  try {
    // Handle both JSON and form submissions
    const result = await resetPassword(req, res);
    
    // If it's a form submission (from web), redirect or show success page
    if (req.get('Content-Type') && req.get('Content-Type').includes('application/x-www-form-urlencoded')) {
      if (result && result.success) {
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Password Reset Success</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .success { color: #065f46; background: #d1fae5; padding: 20px; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="success">
              <h2>✅ Password Reset Successful!</h2>
              <p>Your password has been reset successfully. You can now login with your new password.</p>
              <p><a href="bushublk://login">Open BusHubLK App</a></p>
            </div>
          </body>
          </html>
        `);
      }
    }
  } catch (error) {
    console.error('Password reset error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }
});

// @route   GET /api/password-reset/validate/:token
// @desc    Validate reset token
// @access  Public
router.get('/validate/:token', [
  param('token')
    .notEmpty()
    .withMessage('Token is required')
], validateResetToken);

// @route   GET /api/password-reset/web/:token
// @desc    Serve web reset password page
// @access  Public
router.get('/web/:token', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/reset-password.html'));
});

module.exports = router;
