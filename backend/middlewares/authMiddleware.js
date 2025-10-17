const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const db = require('../config/db');

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is blacklisted
      const blacklisted = await db.query(
        'SELECT id FROM token_blacklist WHERE token = $1 AND expires_at > NOW() LIMIT 1',
        [token]
      );
      
      if (blacklisted.rows && blacklisted.rows.length > 0) {
        console.log('🚫 Token is blacklisted');
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      
      // Verify user still exists and is active
      const user = await User.findById(decoded.userId);
      if (!user) {
        console.log('❌ User not found for userId:', decoded.userId);
        return res.status(403).json({ error: 'Access denied. User account not found or inactive.' });
      }
      
      if (!user.is_active) {
        console.log('❌ User account is inactive:', decoded.userId);
        return res.status(403).json({ error: 'Access denied. User account not found or inactive.' });
      }

      req.user = {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role_name,
        first_name: user.first_name,
        last_name: user.last_name
      };
      next();
    } catch (err) {
      console.error('🔴 JWT verification error:', err.name, err.message);
      if (err.name === 'TokenExpiredError') {
        console.log('⏰ Token has expired at:', err.expiredAt);
      }
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  } else {
    res.status(401).json({ error: 'Access token required' });
  }
};

// Role-based authorization middleware
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Specific role authorization functions
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const authorizeCEO = (req, res, next) => {
  if (req.user.role !== 'ceo') {
    return res.status(403).json({ error: 'CEO access required' });
  }
  next();
};

const authorizeDGM = (req, res, next) => {
  if (!['dgm_technical', 'dgm_operations'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Deputy General Manager access required' });
  }
  next();
};

const authorizeRegionalOfficer = (req, res, next) => {
  if (!['regional_tech', 'regional_operations'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Regional Officer access required' });
  }
  next();
};

const authorizeDepotStaff = (req, res, next) => {
  if (!['depot_manager', 'depot_operations', 'depot_engineer'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Depot staff access required' });
  }
  next();
};

const authorizeDriverConductor = (req, res, next) => {
  if (!['driver', 'conductor'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Driver or Conductor access required' });
  }
  next();
};

// Management hierarchy authorization
const authorizeManagement = (req, res, next) => {
  const managementRoles = [
    'ceo',
    'dgm_technical',
    'dgm_operations',
    'regional_tech',
    'regional_operations',
    'depot_manager',
    'depot_operations'
  ];
  
  if (!managementRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Management access required' });
  }
  next();
};

// Technical staff authorization
const authorizeTechnical = (req, res, next) => {
  const technicalRoles = [
    'dgm_technical',
    'regional_tech',
    'depot_engineer'
  ];
  
  if (!technicalRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Technical staff access required' });
  }
  next();
};

// Operations staff authorization
const authorizeOperations = (req, res, next) => {
  const operationRoles = [
    'dgm_operations',
    'regional_operations',
    'depot_manager',
    'depot_operations'
  ];
  
  if (!operationRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Operations staff access required' });
  }
  next();
};

module.exports = {
  authenticateJWT,
  authorizeRole,
  authorizeAdmin,
  authorizeCEO,
  authorizeDGM,
  authorizeRegionalOfficer,
  authorizeDepotStaff,
  authorizeDriverConductor,
  authorizeManagement,
  authorizeTechnical,
  authorizeOperations
};