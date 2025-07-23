const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignmentsByDepot,
  updateAssignment,
  deleteAssignment
} = require('../controllers/assignmentController');

const { 
  authenticateJWT,
  authorizeDepotStaff
} = require('../middlewares/authMiddleware');

const { body, param } = require('express-validator');

// POST /api/assignments - Create new assignment
router.post('/',
  authenticateJWT,
  authorizeDepotStaff,
  [
    body('bus_id').isInt().withMessage('Bus ID must be an integer'),
    body('route_id').isInt().withMessage('Route ID must be an integer'),
    body('driver_id').isInt().withMessage('Driver ID must be an integer'),
    body('conductor_id').isInt().withMessage('Conductor ID must be an integer'),
    body('depot_id').isInt().withMessage('Depot ID must be an integer'),
    // ADDED: Validation for new fields
    body('assignment_date').isISO8601().withMessage('Invalid date format'),
    body('shift_start_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid start time format (HH:MM)'),
    body('shift_end_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid end time format (HH:MM)'),
    body('status').notEmpty().withMessage('Status is required')
  ],
  createAssignment
);

// GET /api/assignments/depot/:depot_id - Get assignments by depot
router.get('/depot/:depot_id',
  authenticateJWT,
  authorizeDepotStaff,
  param('depot_id').isInt().withMessage('Depot ID must be an integer'),
  getAssignmentsByDepot
);

// PUT /api/assignments/:id - Update assignment
router.put('/:id',
  authenticateJWT,
  authorizeDepotStaff,
  [
    param('id').isInt().withMessage('Assignment ID must be an integer'),
    body('bus_id').isInt().withMessage('Bus ID must be an integer'),
    body('route_id').isInt().withMessage('Route ID must be an integer'),
    body('driver_id').isInt().withMessage('Driver ID must be an integer'),
    body('conductor_id').isInt().withMessage('Conductor ID must be an integer')
  ],
  updateAssignment
);

// DELETE /api/assignments/:id - Delete assignment
router.delete('/:id',
  authenticateJWT,
  authorizeDepotStaff,
  param('id').isInt().withMessage('Assignment ID must be an integer'),
  deleteAssignment
);

module.exports = router;