const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Fix the import path to match your existing structure
const User = require('../models/userModel');
const Driver = require('../models/Driver');

const driverLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated. Please contact administrator.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has driver role
    if (user.role_name !== 'driver') {
      return res.status(403).json({ error: 'Access denied. Driver account required.' });
    }

    // Get driver-specific information
    const driver = await Driver.findByUserId(user.user_id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found. Please contact administrator.' });
    }

    // Update last login
    await User.updateLastLogin(user.user_id);

    // Generate JWT token - IMPORTANT: Use 'userId' to match your auth middleware
    const payload = {
      userId: user.user_id,  // Changed from 'user.id' to 'userId' to match your middleware
      email: user.email,
      role: user.role_name,
      driver_id: driver.driver_id
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
            driver_id: driver.driver_id,
            depot_id: driver.depot_id,
            region_id: driver.region_id,
            license_number: driver.license_number || null,
            role: 'driver',
            role_name: user.role_name
          }
        });
      }
    );
  } catch (err) {
    console.error('Driver login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const getDriverProfile = async (req, res) => {
  try {
    // Your auth middleware sets req.user.userId
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        driver_id: driver.driver_id,
        depot_id: driver.depot_id,
        region_id: driver.region_id,
        license_number: driver.license_number || null,
        role: 'driver',
        role_name: user.role_name,
        is_active: user.is_active
      }
    });
  } catch (err) {
    console.error('Get driver profile error:', err);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
};

module.exports = {
  driverLogin,
  getDriverProfile
};
