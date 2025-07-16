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
], resetPassword);

// @route   GET /api/password-reset/validate/:token
// @desc    Validate reset token
// @access  Public
router.get('/validate/:token', [
  param('token')
    .notEmpty()
    .withMessage('Token is required')
], validateResetToken);

// @route   GET /api/password-reset/universal/:token
// @desc    Universal reset password handler (detects mobile vs web)
// @access  Public
router.get('/universal/:token', (req, res) => {
  const { token } = req.params;
  const userAgent = req.get('User-Agent') || '';
  
  // Check if request is from mobile app
  const isMobileApp = userAgent.includes('BusHubLK') || 
                     userAgent.includes('ReactNative') ||
                     req.get('X-Requested-With') === 'com.anonymous.bushublkmobile';
  
  if (isMobileApp) {
    // Redirect to mobile deep link
    res.redirect(`bushublk://reset-password?token=${token}`);
  } else {
    // Serve web reset page
    res.sendFile(path.join(__dirname, '../public/reset-password.html'));
  }
});

// Keep the existing web route for backward compatibility
router.get('/web/:token', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/reset-password.html'));
});

module.exports = router;
