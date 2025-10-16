const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/db');

// Fix the import to match your existing structure
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

    // Get depot information before generating JWT
    let depotInfo = null;
    let regionInfo = null;
    let depotManagerInfo = null;

    if (driver.depot_id) {
      try {
        console.log('Fetching depot info for depot_id:', driver.depot_id);
        const depotQuery = `
          SELECT d.depot_name, d.address, r.region_name
          FROM depots d
          LEFT JOIN regions r ON d.region_id = r.region_id
          WHERE d.depot_id = $1
        `;
        const depotResult = await db.query(depotQuery, [driver.depot_id]);
        console.log('Depot query result:', depotResult.rows);
        if (depotResult.rows && depotResult.rows.length > 0) {
          depotInfo = depotResult.rows[0];
          console.log('Depot info found:', depotInfo);
        }

        // Get depot manager information using the correct schema
        console.log('Fetching depot manager info for depot_id:', driver.depot_id);
        const managerQuery = `
          SELECT u.first_name, u.last_name, u.phone, u.email
          FROM depot_managers dm
          JOIN users u ON dm.depot_manager_id = u.user_id
          WHERE dm.depot_id = $1
        `;
        const managerResult = await db.query(managerQuery, [driver.depot_id]);
        console.log('Manager query result:', managerResult.rows);
        if (managerResult.rows && managerResult.rows.length > 0) {
          depotManagerInfo = managerResult.rows[0];
          console.log('Manager info found:', depotManagerInfo);
        }
      } catch (dbError) {
        console.warn('Could not fetch depot/manager info during login:', dbError);
      }
    }

    // If depot info failed but we have region_id, try to get region info directly
    if (!depotInfo && driver.region_id) {
      try {
        const regionQuery = 'SELECT region_name FROM regions WHERE region_id = $1';
        const regionResult = await db.query(regionQuery, [driver.region_id]);
        if (regionResult.rows && regionResult.rows.length > 0) {
          regionInfo = regionResult.rows[0];
        }
      } catch (dbError) {
        console.warn('Could not fetch region info during login:', dbError);
      }
    }

    // Get current daily assignment for today
    let currentAssignment = null;
    try {
      console.log('Fetching current assignment for driver:', driver.driver_id);
      const assignments = await DailyAssignment.getByDriverId(driver.driver_id);
      if (assignments && assignments.length > 0) {
        // Find today's assignment or the most recent one
        const todayAssignment = assignments.find(a => {
          const assignmentDate = new Date(a.assignment_date);
          const today = new Date();
          return assignmentDate.toDateString() === today.toDateString();
        });
        currentAssignment = todayAssignment || assignments[0]; // Use today's or most recent
        console.log('Current assignment found:', currentAssignment ? {
          assignment_id: currentAssignment.assignment_id,
          bus_id: currentAssignment.bus_id,
          route_id: currentAssignment.route_id,
          registration_number: currentAssignment.registration_number
        } : 'none');
      }
    } catch (assignmentError) {
      console.warn('Could not fetch current assignment during login:', assignmentError);
    }

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
            role_name: user.role_name,
            // Additional information
            depot_name: depotInfo?.depot_name || null,
            depot_location: depotInfo?.address || null,
            region_name: depotInfo?.region_name || regionInfo?.region_name || null,
            depot_manager_name: depotManagerInfo ? 
              `${depotManagerInfo.first_name} ${depotManagerInfo.last_name}` : null,
            depot_manager_phone: depotManagerInfo?.phone || null,
            depot_manager_email: depotManagerInfo?.email || null,
            // Assignment information for tracking and welcome banner
            busId: currentAssignment?.bus_id?.toString() || null,
            routeId: currentAssignment?.route_id?.toString() || null,
            assignmentId: currentAssignment?.assignment_id?.toString() || null,
            busRegistration: currentAssignment?.registration_number || null,
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

    // Get depot and region information with depot manager details
    let depotInfo = null;
    let regionInfo = null;
    let depotManagerInfo = null;

    try {
      // Get depot information
      const depotResult = await db.query(
        `SELECT d.depot_name, d.address, r.region_name 
         FROM depots d
         JOIN regions r ON d.region_id = r.region_id 
         WHERE d.depot_id = $1`,
        [driver.depot_id]
      );
      
      if (depotResult.rows.length > 0) {
        depotInfo = depotResult.rows[0];
      }

      // Get depot manager information
      const managerResult = await db.query(
        `SELECT u.first_name, u.last_name, u.phone, u.email
         FROM depot_managers dm
         JOIN users u ON dm.depot_manager_id = u.user_id
         WHERE dm.depot_id = $1`,
        [driver.depot_id]
      );
      
      if (managerResult.rows.length > 0) {
        depotManagerInfo = managerResult.rows[0];
      }

      // Get region information
      const regionResult = await db.query(
        'SELECT region_name FROM regions WHERE region_id = $1',
        [driver.region_id]
      );
      
      if (regionResult.rows.length > 0) {
        regionInfo = regionResult.rows[0];
      }
    } catch (infoError) {
      console.error('Error fetching depot/region info:', infoError);
      // Continue without this information - don't fail the entire request
    }

    // Get current daily assignment for today
    let currentAssignment = null;
    try {
      console.log('Fetching current assignment for driver profile:', driver.driver_id);
      const assignments = await DailyAssignment.getByDriverId(driver.driver_id);
      if (assignments && assignments.length > 0) {
        // Find today's assignment or the most recent one
        const todayAssignment = assignments.find(a => {
          const assignmentDate = new Date(a.assignment_date);
          const today = new Date();
          return assignmentDate.toDateString() === today.toDateString();
        });
        currentAssignment = todayAssignment || assignments[0]; // Use today's or most recent
        console.log('Current assignment found for profile:', currentAssignment ? {
          assignment_id: currentAssignment.assignment_id,
          bus_id: currentAssignment.bus_id,
          route_id: currentAssignment.route_id,
          registration_number: currentAssignment.registration_number
        } : 'none');
      }
    } catch (assignmentError) {
      console.warn('Could not fetch current assignment for profile:', assignmentError);
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
        is_active: user.is_active,
        // Additional information
        depot_name: depotInfo?.depot_name || null,
        depot_location: depotInfo?.address || null,
        region_name: depotInfo?.region_name || regionInfo?.region_name || null,
        depot_manager_name: depotManagerInfo ? 
          `${depotManagerInfo.first_name} ${depotManagerInfo.last_name}` : null,
        depot_manager_phone: depotManagerInfo?.phone || null,
        depot_manager_email: depotManagerInfo?.email || null,
        // Assignment information for tracking and welcome banner
        busId: currentAssignment?.bus_id?.toString() || null,
        routeId: currentAssignment?.route_id?.toString() || null,
        assignmentId: currentAssignment?.assignment_id?.toString() || null,
        busRegistration: currentAssignment?.registration_number || null,
      }
    });
  } catch (err) {
    console.error('Get driver profile error:', err);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
};

const updateDriverProfile = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  try {
    const userId = req.user.userId;
    const { email, phone } = req.body;

    // Check if email is already taken by another user
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.user_id !== userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is already in use by another account' 
      });
    }

    // Update user data
    const updateData = { email, phone };
    const updated = await User.updateUser(userId, updateData);
    
    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found or update failed' 
      });
    }

    // Get updated profile data
    const user = await User.findById(userId);
    const driver = await Driver.findByUserId(userId);

    // Get depot information
    let depotInfo = null;
    let regionInfo = null;
    let depotManagerInfo = null;

    if (driver.depot_id) {
      try {
        const depotQuery = `
          SELECT d.depot_name, d.address, r.region_name
          FROM depots d
          LEFT JOIN regions r ON d.region_id = r.region_id
          WHERE d.depot_id = $1
        `;
        const depotResult = await db.query(depotQuery, [driver.depot_id]);
        if (depotResult.rows && depotResult.rows.length > 0) {
          depotInfo = depotResult.rows[0];
        }

        // Get depot manager information
        const managerQuery = `
          SELECT u.first_name, u.last_name, u.phone, u.email
          FROM depot_managers dm
          JOIN users u ON dm.depot_manager_id = u.user_id
          WHERE dm.depot_id = $1
        `;
        const managerResult = await db.query(managerQuery, [driver.depot_id]);
        if (managerResult.rows && managerResult.rows.length > 0) {
          depotManagerInfo = managerResult.rows[0];
        }
      } catch (dbError) {
        console.warn('Could not fetch depot/manager info during update:', dbError);
      }
    }

    // If depot info failed but we have region_id, try to get region info directly
    if (!depotInfo && driver.region_id) {
      try {
        const regionQuery = 'SELECT region_name FROM regions WHERE region_id = $1';
        const regionResult = await db.query(regionQuery, [driver.region_id]);
        if (regionResult.rows && regionResult.rows.length > 0) {
          regionInfo = regionResult.rows[0];
        }
      } catch (dbError) {
        console.warn('Could not fetch region info during update:', dbError);
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
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
        is_active: user.is_active,
        // Additional information
        depot_name: depotInfo?.depot_name || null,
        depot_location: depotInfo?.address || null,
        region_name: depotInfo?.region_name || regionInfo?.region_name || null,
        depot_manager_name: depotManagerInfo ? 
          `${depotManagerInfo.first_name} ${depotManagerInfo.last_name}` : null,
        depot_manager_phone: depotManagerInfo?.phone || null,
        depot_manager_email: depotManagerInfo?.email || null,
      }
    });
  } catch (err) {
    console.error('Update driver profile error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error while updating profile' 
    });
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
  updateDriverProfile,
  getDriverAssignedBuses
};
