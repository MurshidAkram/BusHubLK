const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/authController');
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

module.exports = router;
