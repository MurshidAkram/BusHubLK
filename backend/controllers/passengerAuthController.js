const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/db');

const User = require('../models/userModel');
const Passenger = require('../models/Passenger');

const passengerRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    username, 
    email, 
    password, 
    first_name, 
    last_name, 
    phone,
    date_of_birth,
    gender,
    address,
    emergency_contact_name,
    emergency_contact_phone
  } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if username already exists
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Get passenger role ID (assuming role_id = 3 for passengers, adjust as needed)
    const roleResult = await db.query('SELECT role_id FROM roles WHERE role_name = $1', ['passenger']);
    if (roleResult.rows.length === 0) {
      return res.status(500).json({ error: 'Passenger role not found in system' });
    }
    const passengerRoleId = roleResult.rows[0].role_id;

    // Start transaction
    await db.query('BEGIN');

    try {
      // Create user
      const user = await User.create({
        username,
        email,
        password,
        first_name,
        last_name,
        phone,
        role_id: passengerRoleId
      });

      // Create passenger profile
      const passenger = await Passenger.create(user.user_id, {
        date_of_birth,
        gender,
        address,
        emergency_contact_name,
        emergency_contact_phone
      });

      // Commit transaction
      await db.query('COMMIT');

      // Generate JWT token
      const payload = {
        userId: user.user_id,
        email: user.email,
        role: 'passenger',
        passenger_id: passenger.passenger_id
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
          
          res.status(201).json({
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
              passenger_id: passenger.passenger_id,
              date_of_birth: passenger.date_of_birth,
              gender: passenger.gender,
              address: passenger.address,
              emergency_contact_name: passenger.emergency_contact_name,
              emergency_contact_phone: passenger.emergency_contact_phone,
              role: 'passenger'
            }
          });
        }
      );
    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Passenger registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

const passengerLogin = async (req, res) => {
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

    // Check if user has passenger role
    if (user.role_name !== 'passenger') {
      return res.status(403).json({ error: 'Access denied. Passenger account required.' });
    }

    // Get passenger-specific information
    const passenger = await Passenger.findByUserId(user.user_id);
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger profile not found. Please contact administrator.' });
    }

    // Update last login
    await User.updateLastLogin(user.user_id);

    // Generate JWT token
    const payload = {
      userId: user.user_id,
      email: user.email,
      role: user.role_name,
      passenger_id: passenger.passenger_id
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
            passenger_id: passenger.passenger_id,
            date_of_birth: passenger.date_of_birth,
            gender: passenger.gender,
            address: passenger.address,
            emergency_contact_name: passenger.emergency_contact_name,
            emergency_contact_phone: passenger.emergency_contact_phone,
            role: 'passenger',
            role_name: user.role_name
          }
        });
      }
    );
  } catch (err) {
    console.error('Passenger login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const getPassengerProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passenger = await Passenger.findByUserId(userId);
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger profile not found' });
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
        passenger_id: passenger.passenger_id,
        date_of_birth: passenger.date_of_birth,
        gender: passenger.gender,
        address: passenger.address,
        emergency_contact_name: passenger.emergency_contact_name,
        emergency_contact_phone: passenger.emergency_contact_phone,
        role: 'passenger',
        role_name: user.role_name,
        is_active: user.is_active
      }
    });
  } catch (err) {
    console.error('Get passenger profile error:', err);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
};

const updatePassengerProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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
      if (first_name || last_name || phone) {
        await User.updateProfile(userId, { first_name, last_name, phone });
      }

      // Update passenger table
      await Passenger.updateProfile(userId, {
        date_of_birth,
        gender,
        address,
        emergency_contact_name,
        emergency_contact_phone
      });

      // Commit transaction
      await db.query('COMMIT');

      // Get updated profile
      const updatedUser = await User.findById(userId);
      const updatedPassenger = await Passenger.findByUserId(userId);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.user_id,
          email: updatedUser.email,
          username: updatedUser.username,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          phone: updatedUser.phone,
          passenger_id: updatedPassenger.passenger_id,
          date_of_birth: updatedPassenger.date_of_birth,
          gender: updatedPassenger.gender,
          address: updatedPassenger.address,
          emergency_contact_name: updatedPassenger.emergency_contact_name,
          emergency_contact_phone: updatedPassenger.emergency_contact_phone,
          role: 'passenger'
        }
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Update passenger profile error:', err);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
};

module.exports = {
  passengerRegister,
  passengerLogin,
  getPassengerProfile,
  updatePassengerProfile
};
