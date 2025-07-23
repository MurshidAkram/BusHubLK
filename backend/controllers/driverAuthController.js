const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Fix the import path to match your existing structure
const User = require('../models/userModel');
const Driver = require('../models/Driver');
const DailyAssignment = require('../models/DailyAssignmentModel');

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
      console.log('User not found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', {
      userId: user.user_id,
      email: user.email,
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash?.length
    });

    // Check if user is active
    if (!user.is_active) {
      console.log('User account is inactive:', user.user_id);
      return res.status(401).json({ error: 'Account is deactivated. Please contact administrator.' });
    }

    // Verify password with detailed logging
    console.log('Attempting password verification...');
    console.log('Input password length:', password.length);
    console.log('Stored hash length:', user.password_hash?.length);
    
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('Password verification failed for user:', user.user_id);
      
      // Additional debugging: try to hash the input password and compare lengths
      const testHash = await bcrypt.hash(password, 10);
      console.log('Test hash of input password:', testHash.length, 'chars');
      console.log('Stored hash:', user.password_hash?.substring(0, 20) + '...');
      console.log('Test hash:', testHash.substring(0, 20) + '...');
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Password verification successful for user:', user.user_id);

    // Check if user has driver role
    if (user.role_name !== 'driver') {
      console.log('User does not have driver role:', user.role_name);
      return res.status(403).json({ error: 'Access denied. Driver account required.' });
    }

    // Get driver-specific information
    const driver = await Driver.findByUserId(user.user_id);
    if (!driver) {
      console.log('Driver profile not found for user:', user.user_id);
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
        
        console.log('Login successful for user:', user.user_id);
        
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

const getDriverAssignedBuses = async (req, res) => {
  try {
    // Get driver ID from authenticated user
    const userId = req.user.userId;
    console.log('🔍 Getting buses for user ID:', userId);
    
    // Get driver information
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      console.log('❌ Driver profile not found for user ID:', userId);
      return res.status(404).json({ 
        success: false,
        error: 'Driver profile not found' 
      });
    }

    console.log('✅ Driver found:', { 
      driver_id: driver.driver_id, 
      depot_id: driver.depot_id 
    });

    // Get current assignments for the driver
    const assignments = await DailyAssignment.getByDriverId(driver.driver_id);
    console.log('📋 Assignments found:', assignments?.length || 0);
    
    if (!assignments || assignments.length === 0) {
      console.log('📭 No assignments found for driver:', driver.driver_id);
      return res.status(200).json({
        success: true,
        message: 'No bus assignments found',
        data: []
      });
    }

    // Log assignment details for debugging
    assignments.forEach((assignment, index) => {
      console.log(`   Assignment ${index + 1}:`, {
        bus_id: assignment.bus_id,
        registration_number: assignment.registration_number,
        status: assignment.status
      });
    });

    // Extract unique buses from assignments (in case driver has multiple assignments)
    const uniqueBuses = [];
    const busIds = new Set();
    
    assignments.forEach(assignment => {
      if (assignment.bus_id && !busIds.has(assignment.bus_id)) {
        busIds.add(assignment.bus_id);
        uniqueBuses.push({
          bus_id: assignment.bus_id,
          registration_number: assignment.registration_number,
          class: assignment.bus_class,
          manufacturer: assignment.manufacturer,
          model: assignment.model,
          status: assignment.bus_status,
          depot_id: assignment.depot_id,
          depot_name: assignment.depot_name
        });
      }
    });

    console.log('🚌 Unique buses extracted:', uniqueBuses.length);

    res.json({
      success: true,
      message: 'Assigned buses retrieved successfully',
      data: uniqueBuses
    });
  } catch (err) {
    console.error('❌ Get driver assigned buses error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching assigned buses',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  driverLogin,
  getDriverProfile,
  getDriverAssignedBuses
};
