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
// @desc    Universal handler for both web and mobile
// @access  Public
router.get('/universal/:token', (req, res) => {
  const { token } = req.params;
  const userAgent = req.get('User-Agent') || '';
  
  console.log('Universal reset link accessed:', {
    token,
    userAgent,
    headers: req.headers
  });
  
  // Check if request is from mobile app
  if (userAgent.includes('BusHubLK') || userAgent.includes('Mobile') || req.headers['x-mobile-app']) {
    // Redirect to mobile deep link
    return res.redirect(`bushublk://reset-password?token=${token}`);
  }
  
  // For web browsers, serve the HTML page with token in URL
  res.redirect(`/api/password-reset/web/${token}?token=${token}`);
});

// @route   GET /api/password-reset/web/:token
// @desc    Serve web reset password page
// @access  Public
router.get('/web/:token', (req, res) => {
  const { token } = req.params;
  
  // Read the HTML file and inject the token
  const fs = require('fs');
  const htmlPath = path.join(__dirname, '../public/reset-password.html');
  
  try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Inject token into the HTML
    html = html.replace(
      '<input type="hidden" id="tokenInput" name="token" value="">',
      `<input type="hidden" id="tokenInput" name="token" value="${token}">`
    );
    
    res.send(html);
  } catch (error) {
    console.error('Error serving reset page:', error);
    res.status(500).send('Error loading reset page');
  }
});

module.exports = router;
