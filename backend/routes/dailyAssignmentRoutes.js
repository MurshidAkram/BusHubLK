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
  softDeleteSlot,
  createTemplateSlot,
  updateTemplateSlot,
  assignSlotFromTemplate,
  getAvailableDrivers,
  getAvailableConductors,
  getAvailableBuses,
  getDailyScheduleForRoute
} = require('../controllers/dailyAssignmentController');

const { authenticateJWT, authorizeAdmin, authorizeRole } = require('../middlewares/authMiddleware');

const allowOperationsAccess = authorizeRole([
  'admin',
  'dgm_operations',
  'regional_operations',
  'depot_manager',
  'depot_operations'
]);

console.log('dailyAssignmentRoutes.js loaded');


// Get all assignments for depot
router.get('/depot/:depot_id', authenticateJWT, allowOperationsAccess, getAssignmentsByDepot);

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
router.get('/route/:route_id', authenticateJWT, getAssignmentsByRoute);

// Fetch template slots for a route
router.get('/route/:route_id/templates', authenticateJWT, getTemplatesByRoute);

// Assign a slot (update template to assigned)
router.put('/assign/:assignment_id',  authenticateJWT, assignSlot);

// Soft-delete a slot
router.put('/soft-delete/:assignment_id',  authenticateJWT, softDeleteSlot);

// Add new template slot
router.post('/route/:route_id/templates',  authenticateJWT, createTemplateSlot);

// Update an existing template slot
router.put('/route/:route_id/templates/:assignment_id', authenticateJWT, updateTemplateSlot);

// Update template slot (shift times)
router.put('/route/:route_id/templates/:assignment_id/times',  async (req, res) => {
  const { shift_start_time, shift_end_time } = req.body;
  const { assignment_id } = req.params;

  try {
    const updatedSlot = await updateTemplateSlot(assignment_id, shift_start_time, shift_end_time);
    return res.status(200).json(updatedSlot);
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while updating the template slot.' });
  }
});

// Assign a slot from template (copy template for a real day)
router.post('/assign-from-template/:assignment_id', authenticateJWT, assignSlotFromTemplate);

// Get available drivers
router.get('/available-drivers', authenticateJWT, getAvailableDrivers);

// Get available conductors
router.get('/available-conductors', authenticateJWT, getAvailableConductors);

// Get available buses
router.get('/available-buses', authenticateJWT, getAvailableBuses);

// Get daily schedule for a specific route
router.get('/route/:route_id/daily-schedule', authenticateJWT, getDailyScheduleForRoute);

// Get daily schedule for a specific route and date
router.get('/route/:route_id/daily-schedule', authenticateJWT, (req, res) => {
  const { route_id } = req.params;
  const { date } = req.query;

  // Call the controller function with the route_id and date
  getDailyScheduleForRoute(route_id, date)
    .then(schedule => res.json(schedule))
    .catch(err => res.status(500).json({ error: 'An error occurred while fetching the daily schedule.' }));
});

module.exports = router;

