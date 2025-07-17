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

// @route   GET /api/password-reset/mobile/:token
// @desc    Mobile-optimized reset link that avoids "invalid address" error
// @access  Public
router.get('/mobile/:token', (req, res) => {
  const { token } = req.params;
  const userAgent = req.get('User-Agent') || '';
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  
  const deepLink = `bushublk://reset-password?token=${token}`;
  const webFallback = `/api/password-reset/web/${token}?token=${token}`;
  
  console.log('Mobile reset link accessed:', {
    token,
    userAgent,
    isIOS,
    isAndroid,
    deepLink,
    webFallback
  });
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>BusHubLK - Reset Password</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          text-align: center; 
          padding: 20px;
          background: linear-gradient(135deg, #1e3a8a, #3b82f6);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin: 0;
        }
        .container {
          background: white;
          color: #333;
          padding: 30px 20px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          max-width: 350px;
          width: 90%;
        }
        .logo { font-size: 2.5rem; margin-bottom: 10px; }
        .title { font-size: 1.5rem; font-weight: 600; margin-bottom: 20px; color: #1e3a8a; }
        .button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 10px;
          margin: 8px;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          min-width: 140px;
        }
        .button.secondary { background: #10b981; }
        .button:hover, .button:active { opacity: 0.9; }
        .instructions {
          font-size: 0.9rem;
          color: #6b7280;
          margin-top: 20px;
          line-height: 1.4;
        }
        .status {
          margin: 15px 0;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .status.info {
          background: #e0f2fe;
          color: #0277bd;
        }
        .status.success {
          background: #e8f5e8;
          color: #2e7d32;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🚌</div>
        <h1 class="title">BusHubLK</h1>
        <p>Choose how you'd like to reset your password:</p>
        
        <div id="status" class="status info">
          Ready to reset your password
        </div>
        
        <button onclick="tryOpenApp()" class="button" id="appButton">📱 Open in App</button>
        <br>
        <a href="${webFallback}" class="button secondary">🌐 Use Web Browser</a>
        
        <div class="instructions">
          <p><strong>Recommended:</strong> Use the app for the best experience.</p>
          <p>If you don't have the app installed, use the web browser option.</p>
        </div>
      </div>
      
      <script>
        function updateStatus(message, type = 'info') {
          const statusEl = document.getElementById('status');
          statusEl.textContent = message;
          statusEl.className = 'status ' + type;
        }
        
        function tryOpenApp() {
          const button = document.getElementById('appButton');
          const originalText = button.textContent;
          
          button.textContent = '⏳ Opening App...';
          button.disabled = true;
          updateStatus('Attempting to open BusHubLK app...', 'info');
          
          // Method 1: Direct window.location (works well on most devices)
          try {
            window.location.href = '${deepLink}';
            updateStatus('App should be opening now...', 'success');
          } catch (e) {
            console.log('Direct method failed:', e);
          }
          
          // Method 2: Create invisible iframe (fallback for some browsers)
          setTimeout(() => {
            try {
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              iframe.src = '${deepLink}';
              document.body.appendChild(iframe);
              
              setTimeout(() => {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
              }, 2000);
            } catch (e) {
              console.log('Iframe method failed:', e);
            }
          }, 100);
          
          // Reset button and offer alternatives after 3 seconds
          setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
            
            updateStatus('App not opening? Try the web browser option below.', 'info');
            
            // Show confirmation dialog after 5 seconds
            setTimeout(() => {
              if (confirm('App not opening? Would you like to use the web version instead?')) {
                window.location.href = '${webFallback}';
              }
            }, 2000);
          }, 3000);
        }
        
        // Auto-try to open app on iOS (works better on iOS)
        ${isIOS ? `
        window.addEventListener('load', function() {
          updateStatus('Auto-opening app for iOS...', 'info');
          setTimeout(() => {
            window.location.href = '${deepLink}';
          }, 1000);
        });
        ` : ''}
        
        // Handle page visibility change (when user returns from app)
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'visible') {
            updateStatus('Welcome back! Use web browser if app didn\\'t work.', 'info');
          }
        });
      </script>
    </body>
    </html>
  `);
});

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
    // Mobile device - redirect to mobile-optimized page
    res.redirect(`/api/password-reset/mobile/${token}`);
  } else {
    // Desktop/web browser - redirect to web version
    res.redirect(`/api/password-reset/web/${token}?token=${token}`);
  }
});

module.exports = router;
