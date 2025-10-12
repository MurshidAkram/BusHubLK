const express = require('express');
const { body } = require('express-validator');
const { driverLogin, getDriverProfile, updateDriverProfile, getDriverAssignedBuses } = require('../controllers/driverAuthController');

// Import the correct auth middleware function
const { authenticateJWT } = require('../middlewares/authMiddleware');

const router = express.Router();

// @route   POST /api/driver/login
// @desc    Driver login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
], driverLogin);

// @route   GET /api/driver/profile
// @desc    Get driver profile
// @access  Private (Driver only)
router.get('/profile', authenticateJWT, getDriverProfile);

// @route   PUT /api/driver/profile
// @desc    Update driver profile (email and phone only)
// @access  Private (Driver only)
router.put('/profile', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Please provide a valid phone number')
], authenticateJWT, updateDriverProfile);

// @route   GET /api/driver/buses
// @desc    Get buses assigned to the authenticated driver
// @access  Private (Driver only)
router.get('/buses', authenticateJWT, getDriverAssignedBuses);

// @route   GET /api/driver/test
// @desc    Test route to verify driver routes are working
// @access  Public
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Driver routes are working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
