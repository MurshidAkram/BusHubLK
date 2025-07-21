const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getDailyAssignments,
  getAssignmentOptions,
  updateAssignmentStatus,
  deleteAssignment
} = require('../controllers/dailyAssignmentController');

const { authenticateJWT, authorizeDepotStaff } = require('../middlewares/authMiddleware');

// POST /api/assignments - Create new assignment
router.post('/',
  authenticateJWT,
  authorizeDepotStaff,
  createAssignment
);

// GET /api/assignments - Get today's assignments
router.get('/',
  authenticateJWT,
  authorizeDepotStaff,
  getDailyAssignments
);

// GET /api/assignments/options - Get available buses, routes, drivers, conductors
router.get('/options',
  authenticateJWT,
  authorizeDepotStaff,
  getAssignmentOptions
);

// PUT /api/assignments/:id/status - Update assignment status
router.put('/:id/status',
  authenticateJWT,
  authorizeDepotStaff,
  updateAssignmentStatus
);

// DELETE /api/assignments/:id - Delete assignment
router.delete('/:id',
  authenticateJWT,
  authorizeDepotStaff,
  deleteAssignment
);

module.exports = router;