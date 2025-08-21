const express = require('express');
const router = express.Router();
const {
  createInspection,
  getInspections,
  getUpcomingInspections,
  getPastInspections,
  markAsCompleted,
  updateInspection,
  deleteInspection,
  getUserDepots,
  getInspectionById,
  getInspectionsForDepotEngineer
} = require('../controllers/inspectionController');

const { authenticateJWT, authorizeRole, authorizeDepotStaff } = require('../middlewares/authMiddleware');
const { body, param } = require('express-validator');

// Middleware to ensure only regional technical officers can access these routes
const authorizeRegionalTech = authorizeRole(['regional_tech']);

// Route for depot engineers to get inspections assigned to their depot
router.get('/depot-engineer', authenticateJWT, authorizeDepotStaff, getInspectionsForDepotEngineer);

// Get depots for the logged-in regional technical officer
router.get('/depots', authenticateJWT, authorizeRegionalTech, getUserDepots);

// Get all inspections for the logged-in user
router.get('/', authenticateJWT, authorizeRegionalTech, getInspections);

// Get upcoming inspections
router.get('/upcoming', authenticateJWT, authorizeRegionalTech, getUpcomingInspections);

// Get past inspections (last month)
router.get('/past', authenticateJWT, authorizeRegionalTech, getPastInspections);

// Get inspection by ID
router.get('/:id',
  authenticateJWT,
  authorizeRegionalTech,
  param('id').isInt().withMessage('Inspection ID must be an integer'),
  getInspectionById
);

// Create new inspection
router.post('/',
  authenticateJWT,
  authorizeRegionalTech,
  [
    body('inspection_type')
      .notEmpty().withMessage('Inspection type is required')
      .isLength({ max: 100 }).withMessage('Inspection type must be less than 100 characters'),
    body('date')
      .notEmpty().withMessage('Date is required')
      .isISO8601().withMessage('Date must be in valid format (YYYY-MM-DD)'),
    body('time')
      .notEmpty().withMessage('Time is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
    body('depot_id')
      .notEmpty().withMessage('Depot is required')
      .isInt().withMessage('Depot ID must be an integer')
  ],
  createInspection
);

// Update inspection
router.put('/:id',
  authenticateJWT,
  authorizeRegionalTech,
  [
    param('id').isInt().withMessage('Inspection ID must be an integer'),
    body('inspection_type')
      .notEmpty().withMessage('Inspection type is required')
      .isLength({ max: 100 }).withMessage('Inspection type must be less than 100 characters'),
    body('date')
      .notEmpty().withMessage('Date is required')
      .isISO8601().withMessage('Date must be in valid format (YYYY-MM-DD)'),
    body('time')
      .notEmpty().withMessage('Time is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
    body('depot_id')
      .notEmpty().withMessage('Depot is required')
      .isInt().withMessage('Depot ID must be an integer')
  ],
  updateInspection
);

// Mark inspection as completed
router.patch('/:id/complete',
  authenticateJWT,
  authorizeRegionalTech,
  param('id').isInt().withMessage('Inspection ID must be an integer'),
  markAsCompleted
);

// Delete inspection
router.delete('/:id',
  authenticateJWT,
  authorizeRegionalTech,
  param('id').isInt().withMessage('Inspection ID must be an integer'),
  deleteInspection
);

module.exports = router;
