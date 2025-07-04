const { validationResult } = require('express-validator');
const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    // Fetch user from DB
    const userRes = await db.query(
      `SELECT users.*, roles.name AS role 
       FROM users 
       JOIN roles ON users.role_id = roles.id 
       WHERE email = $1`, [email]
    );

    if (userRes.rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password' });

    const user = userRes.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    // Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role.toLowerCase(),
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Send response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { loginUser };
