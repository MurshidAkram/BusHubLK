const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');
const { createUser, getAllUsers } = require('../controllers/userController');

// POST /api/users - Admin creates a new user
router.post(
  '/',
  authenticateJWT,
  authorizeAdmin,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars'),
    body('role').notEmpty().withMessage('Role is required'),
  ],
  createUser
);

// GET /api/users - Get all users (admin only)
router.get(
  '/',
  authenticateJWT,
  authorizeAdmin,
  getAllUsers
);

module.exports = router;