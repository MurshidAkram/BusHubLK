const express = require('express');
const router = express.Router();
const { 
  loginUser, 
  registerUser, 
  changePassword, 
  getProfile, 
  updateProfile 
} = require('../controllers/authController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  loginUser
);

// POST /api/auth/register
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('first_name')
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required and must be less than 50 characters'),
    body('last_name')
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required and must be less than 50 characters'),
    // Replace the phone validation in your authRoutes.js with this:
body('phone')
  .optional()
  .matches(/^[\+]?[(]?[\d\s\-\(\)]{10,15}$/)
  .withMessage('Phone number must be 10-15 digits and can include +, (), -, and spaces'),
    body('role_name')
      .isIn([
        'ceo', 'dgm_technical', 'dgm_operations', 'regional_tech', 
        'regional_operations', 'depot_manager', 'depot_operations', 
        'depot_engineer', 'driver', 'conductor', 'passenger', 'admin'
      ])
      .withMessage('Invalid role')
  ],
  registerUser
);

// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticateJWT,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ],
  changePassword
);


// GET /api/auth/profile
router.get('/profile', authenticateJWT, getProfile);

// PUT /api/auth/profile
router.put(
  '/profile',
  authenticateJWT,
  [
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('first_name')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be less than 50 characters'),
    body('last_name')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be less than 50 characters'),
    // Replace the phone validation in your authRoutes.js with this:
body('phone')
  .optional()
  .matches(/^[\+]?[(]?[\d\s\-\(\)]{10,15}$/)
  .withMessage('Phone number must be 10-15 digits and can include +, (), -, and spaces')
  ],
  updateProfile
);

module.exports = router;