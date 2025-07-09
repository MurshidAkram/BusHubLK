const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/db');

const router = express.Router();

// @route   POST /api/passengers/register
// @desc    Register a new passenger
// @access  Public
router.post('/register', [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('first_name')
    .isLength({ min: 1 })
    .withMessage('First name is required'),
  body('last_name')
    .isLength({ min: 1 })
    .withMessage('Last name is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, first_name, last_name, phone } = req.body;

  try {
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }

    // Get passenger role ID
    const roleResult = await db.query(
      'SELECT role_id FROM roles WHERE role_name = $1',
      ['passenger']
    );

    if (roleResult.rows.length === 0) {
      return res.status(500).json({ error: 'Passenger role not found' });
    }

    const role_id = roleResult.rows[0].role_id;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    await db.query('BEGIN');

    try {
      // Create user
      const userResult = await db.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role_id, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING user_id, username, email, first_name, last_name, phone, role_id, is_active, created_at`,
        [username, email, hashedPassword, first_name, last_name, phone, role_id, true]
      );

      const user = userResult.rows[0];

      // Create passenger profile - passenger_id references the user_id
      await db.query(
        `INSERT INTO passengers (passenger_id, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, created_at, updated_at) 
         VALUES ($1, NULL, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [user.user_id]
      );

      // Commit transaction
      await db.query('COMMIT');

      // Generate JWT token
      const payload = {
        userId: user.user_id,
        email: user.email,
        role: 'passenger'
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) {
            console.error('JWT signing error:', err);
            return res.status(500).json({ error: 'Token generation failed' });
          }
          
          res.json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
              id: user.user_id,
              email: user.email,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              phone: user.phone,
              role: 'passenger',
              is_active: user.is_active
            }
          });
        }
      );

    } catch (innerError) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw innerError;
    }

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   POST /api/passengers/login
// @desc    Login passenger
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user by email with role information
    const result = await db.query(
      `SELECT u.*, r.role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated. Please contact support.' });
    }

    // Check if user has passenger role
    if (user.role_name !== 'passenger') {
      return res.status(403).json({ error: 'Access denied. Passenger account required.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    // Generate JWT token
    const payload = {
      userId: user.user_id,
      email: user.email,
      role: user.role_name
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          return res.status(500).json({ error: 'Token generation failed' });
        }
        
        res.json({
          success: true,
          message: 'Login successful',
          token,
          user: {
            id: user.user_id,
            email: user.email,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            role: 'passenger',
            role_name: user.role_name,
            is_active: user.is_active
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   GET /api/passengers/profile
// @desc    Get passenger profile
// @access  Private (requires authentication middleware)
const { authenticateJWT } = require('../middlewares/authMiddleware');

router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await db.query(
      `SELECT u.*, r.role_name, p.date_of_birth, p.gender, p.address, 
              p.emergency_contact_name, p.emergency_contact_phone
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       LEFT JOIN passengers p ON u.user_id = p.passenger_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        address: user.address,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        role: 'passenger',
        role_name: user.role_name,
        is_active: user.is_active
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
});

// @route   PUT /api/passengers/profile
// @desc    Update passenger profile
// @access  Private
router.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      first_name, 
      last_name, 
      phone, 
      date_of_birth, 
      gender, 
      address, 
      emergency_contact_name, 
      emergency_contact_phone 
    } = req.body;

    // Start transaction
    await db.query('BEGIN');

    try {
      // Update user table
      await db.query(
        `UPDATE users 
         SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4`,
        [first_name, last_name, phone, userId]
      );

      // Update passengers table
      await db.query(
        `UPDATE passengers 
         SET date_of_birth = $1, gender = $2, address = $3, 
             emergency_contact_name = $4, emergency_contact_phone = $5, updated_at = CURRENT_TIMESTAMP
         WHERE passenger_id = $6`,
        [date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, userId]
      );

      // Commit transaction
      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });

    } catch (innerError) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw innerError;
    }

  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
});

// @route   DELETE /api/passengers/account
// @desc    Delete passenger account
// @access  Private
router.delete('/account', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Start transaction
    await db.query('BEGIN');

    try {
      // Delete from passengers table first (if foreign key constraints exist)
      await db.query('DELETE FROM passengers WHERE passenger_id = $1', [userId]);
      
      // Delete from users table
      await db.query('DELETE FROM users WHERE user_id = $1', [userId]);

      // Commit transaction
      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (innerError) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw innerError;
    }

  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Server error while deleting account' });
  }
});

module.exports = router;
