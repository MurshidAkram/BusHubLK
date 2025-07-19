const express = require('express');
const router = express.Router();
const {
  getAssignmentsByDepot,
  createAssignment,
  updateAssignment,
  deleteAssignment
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

module.exports = router;

