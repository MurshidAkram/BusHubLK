// backend/routes/passwordReset.js
const express = require('express');
const path = require('path');
const { body, param } = require('express-validator');
const {
    requestPasswordReset, // Renamed from requestPasswordResetDb to match your controller's export
    resetPassword,       // Renamed from resetPasswordDb to match your controller's export
    validateResetToken   // Renamed from validateResetTokenDb to match your controller's export
} = require('../controllers/passwordResetController'); // <-- Crucial: Check this path and export names!

const router = express.Router();

// Define the deep link for success page, consistent with your .env
const APP_LOGIN_DEEPLINK = 'bushublkapp://login'; // Ensure this matches your app's scheme

// @route   POST /api/password-reset/request
// @desc    Request password reset
// @access  Public
router.post('/request', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
], requestPasswordReset); // Point to the function from the controller

// @route   POST /api/password-reset/reset
// @desc    Reset password with token
// @access  Public
// This route now directly calls the controller function, which will handle both
// JSON responses (for mobile app) and HTML responses (for web forms/emails).
router.post('/reset', [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], resetPassword); // Point to the function from the controller

// @route   GET /api/password-reset/validate/:token
// @desc    Validate reset token (used by the web page or internally)
// @access  Public
router.get('/validate/:token', [
    param('token')
        .notEmpty()
        .withMessage('Token is required')
], validateResetToken); // Point to the function from the controller

// Existing routes for web/mobile universal links
router.get('/web/:token', (req, res) => {
    // This serves the static HTML file for web-based password reset
    res.sendFile(path.join(__dirname, '../public/reset-password.html'));
});

router.get('/mobile/:token', (req, res) => {
    const { token } = req.params;
    const { email } = req.query;

    if (!email) {
        return res.status(400).send('Email parameter missing from mobile reset link.');
    }

    const userAgent = req.get('User-Agent') || '';
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);

    // This is the deep link the app will handle
    // IMPORTANT: Ensure 'bushublkapp' is your registered scheme in app.json/AndroidManifest.xml/Info.plist
    const deepLink = `bushublkapp://reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const webFallback = `/api/password-reset/web/${token}?token=${token}&email=${encodeURIComponent(email)}`;

    console.log('Mobile reset link accessed:', {
        token,
        email,
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
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f7f6; color: #333; }
            .container { background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); max-width: 500px; margin: 50px auto; }
            .logo { font-size: 4em; margin-bottom: 10px; }
            .title { font-size: 1.8em; color: #1e3a8a; margin-bottom: 20px; }
            .button {
              display: block; width: 80%; margin: 15px auto; padding: 12px 20px;
              background-color: #3b82f6; color: white; text-decoration: none;
              border-radius: 8px; font-size: 1.1em; border: none; cursor: pointer;
              transition: background-color 0.3s ease;
            }
            .button.secondary { background-color: #6c757d; }
            .button:hover, .button:active { background-color: #2563eb; }
            .instructions { margin-top: 20px; font-size: 0.9em; color: #666; }
            .status { margin-top: 20px; padding: 10px; border-radius: 5px; }
            .status.info { background-color: #e0f2f7; color: #007bff; border: 1px solid #b3e0ff; }
            .status.success { background-color: #d1fae5; color: #10b981; border: 1px solid #a7f3d0; }
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

                // Show confirmation dialog after 2 seconds (after the initial 3-second timeout)
                setTimeout(() => {
                  if (confirm('App not opening? Would you like to use the web version instead?')) {
                    window.location.href = '${webFallback}';
                  }
                }, 2000); // Wait 2 more seconds
              }, 3000); // 3 seconds after the initial click
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

router.get('/universal/:token', (req, res) => {
    const { token } = req.params;
    const { email } = req.query;

    if (!email) {
        console.error('Email missing from universal reset link:', req.url);
        return res.status(400).send('Invalid reset link: email parameter missing.');
    }

    const userAgent = req.get('User-Agent') || '';

    console.log('Universal reset link accessed:', {
        token,
        email,
        userAgent,
        headers: req.headers
    });

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (isMobile) {
        // Redirect to the /mobile route which then attempts deep link
        res.redirect(`/api/password-reset/mobile/${token}?email=${encodeURIComponent(email)}`);
    } else {
        // Redirect to the /web route which serves the HTML form
        res.redirect(`/api/password-reset/web/${token}?token=${token}&email=${encodeURIComponent(email)}`);
    }
});

module.exports = router;