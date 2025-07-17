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

// @route   GET /api/password-reset/universal/:token
// @desc    Universal reset link that detects device and redirects appropriately
// @access  Public
router.get('/universal/:token', (req, res) => {
  const { token } = req.params;
  const userAgent = req.get('User-Agent') || '';
  
  console.log('Universal reset link accessed:', {
    token,
    userAgent,
    headers: req.headers
  });
  
  // Check if it's a mobile device
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  if (isMobile) {
    // Try to open the mobile app first, then fallback to web
    const deepLink = `bushublk://reset-password?token=${token}`;
    const webFallback = `/api/password-reset/web/${token}?token=${token}`;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Opening BusHubLK...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px 20px;
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .container {
            background: white;
            color: #333;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
          }
          .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px;
          }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚌 BusHubLK</h1>
          <div class="spinner"></div>
          <p>Opening the BusHubLK app...</p>
          <p>If the app doesn't open automatically:</p>
          <a href="${deepLink}" class="button">Open App</a>
          <a href="${webFallback}" class="button">Use Web Version</a>
        </div>
        
        <script>
          // Try to open the app immediately
          window.location.href = '${deepLink}';
          
          // Fallback to web version after 3 seconds
          setTimeout(function() {
            window.location.href = '${webFallback}';
          }, 3000);
        </script>
      </body>
      </html>
    `);
  } else {
    // Desktop/web browser - redirect to web version
    res.redirect(`/api/password-reset/web/${token}?token=${token}`);
  }
});

// @route   GET /api/password-reset/web/:token
// @desc    Serve web reset password page
// @access  Public
router.get('/web/:token', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/reset-password.html'));
});

module.exports = router;
