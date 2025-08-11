const express = require('express');
const router = express.Router();
const {
  getAssignmentsByDepot,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentByDriver,
  getUpcomingAssignmentsByDriver,
  getAssignmentsByRoute,
  getTemplatesByRoute,
  assignSlot,
  softDeleteSlot
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

// Get all assignments for a specific route
router.get('/route/:route_id', authenticateJWT, authorizeAdmin, getAssignmentsByRoute);

// Fetch template slots for a route
router.get('/route/:route_id/templates', authenticateJWT, getTemplatesByRoute);

// Assign a slot (update template to assigned)
router.put('/assign/:assignment_id', authenticateJWT, assignSlot);

// Soft-delete a slot
router.put('/soft-delete/:assignment_id', authenticateJWT, softDeleteSlot);

module.exports = router;

