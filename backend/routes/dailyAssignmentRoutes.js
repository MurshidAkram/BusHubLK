const express = require('express');
const router = express.Router();
const {
  getAssignmentsByDepot,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentByDriver,
  getUpcomingAssignmentsByDriver
} = require('../controllers/dailyAssignmentController');

const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

// Get all assignments for depot
router.get('/depot/:depot_id', authenticateJWT, authorizeAdmin, getAssignmentsByDepot);

// Create new assignment
router.post('/', authenticateJWT, authorizeAdmin, createAssignment);

// Update assignment
router.put('/:id', authenticateJWT, authorizeAdmin, updateAssignment);

// Delete assignment
router.delete('/:id', authenticateJWT, authorizeAdmin, deleteAssignment);

// Get assignment by driver ID
router.get('/driver/:driver_id', authenticateJWT, getAssignmentByDriver);

// Get upcoming assignments for driver (schedule view)
router.get('/driver/:driver_id/upcoming', authenticateJWT, getUpcomingAssignmentsByDriver);

module.exports = router;

