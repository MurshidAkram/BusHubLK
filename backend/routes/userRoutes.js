const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  getUsersByRole,
  getUsersByDepot,
  getUsersByRegion,
  updateUser,
  activateUser,
  deactivateUser,
  deleteUser,
  getAllRoles,
  resetUserPassword
} = require('../controllers/userController');

const { 
  authenticateJWT, 
  authorizeAdmin, 
  authorizeManagement,
  authorizeDepotStaff,
  authorizeRegionalOfficer 
} = require('../middlewares/authMiddleware');

const { body, param } = require('express-validator');

// GET /api/users - Get all users (Admin only)
router.get('/', authenticateJWT, authorizeAdmin, getAllUsers);

// GET /api/users/roles - Get all roles
router.get('/roles', authenticateJWT, getAllRoles);

// GET /api/users/:id - Get user by ID
router.get('/:id', 
  authenticateJWT, 
  param('id').isInt().withMessage('User ID must be an integer'),
  getUserById
);

// GET /api/users/role/:role - Get users by role
router.get('/role/:role',
  authenticateJWT,
  authorizeManagement,
  param('role').isIn([
    'ceo', 'dgm_technical', 'dgm_operations', 'regional_tech', 
    'regional_operations', 'depot_manager', 'depot_operations', 
    'depot_engineer', 'driver', 'conductor', 'passenger', 'admin'
  ]).withMessage('Invalid role'),
  getUsersByRole
);

// GET /api/users/depot/:depot_id - Get users by depot
router.get('/depot/:depot_id',
  authenticateJWT,
  authorizeDepotStaff,
  param('depot_id').isInt().withMessage('Depot ID must be an integer'),
  getUsersByDepot
);

// GET /api/users/region/:region_id - Get users by region
router.get('/region/:region_id',
  authenticateJWT,
  authorizeRegionalOfficer,
  param('region_id').isInt().withMessage('Region ID must be an integer'),
  getUsersByRegion
);

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id',
  authenticateJWT,
  authorizeAdmin,
  [
    param('id').isInt().withMessage('User ID must be an integer'),
    body('first_name')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be less than 50 characters'),
    body('last_name')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be less than 50 characters'),
    body('phone')
      .optional()
      .matches(/^[\+]?[(]?[\d\s\-\(\)]{10,15}$/)
      .withMessage('Phone number must be 10-15 digits and can include +, (), -, and spaces'),
    body('role_name')
      .optional()
      .isIn([
        'ceo', 'dgm_technical', 'dgm_operations', 'regional_tech', 
        'regional_operations', 'depot_manager', 'depot_operations', 
        'depot_engineer', 'driver', 'conductor', 'passenger', 'admin'
      ])
      .withMessage('Invalid role'),
    body('role_data')
      .optional()
      .isObject()
      .withMessage('Role data must be an object'),
    body('role_data.region_id')
      .optional()
      .isInt()
      .withMessage('Region ID must be an integer'),
    body('role_data.depot_id')
      .optional()
      .isInt()
      .withMessage('Depot ID must be an integer'),
    body('role_data.appointment_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format')
  ],
  updateUser
);

// PUT /api/users/:id/activate - Activate user (Admin only)
router.put('/:id/activate',
  authenticateJWT,
  authorizeAdmin,
  param('id').isInt().withMessage('User ID must be an integer'),
  activateUser
);

// PUT /api/users/:id/deactivate - Deactivate user (Admin only)
router.put('/:id/deactivate',
  authenticateJWT,
  authorizeAdmin,
  param('id').isInt().withMessage('User ID must be an integer'),
  deactivateUser
);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id',
  authenticateJWT,
  authorizeAdmin,
  param('id').isInt().withMessage('User ID must be an integer'),
  deleteUser
);

// POST /api/users/:id/reset-password - Reset user password (Admin only)
router.post('/:id/reset-password',
  authenticateJWT,
  authorizeAdmin,
  [
    param('id').isInt().withMessage('User ID must be an integer'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ],
  resetUserPassword
);

module.exports = router;