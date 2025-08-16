const express = require('express');
const router = express.Router();
const {
  createEmergencyReport,
  getReportWithMessages,
  addMessageToReport,
  getReportsByDriver,
} = require('../controllers/emergencyController');

// Assuming you have an authentication middleware named 'protect'
// const { protect } = require('../middleware/authMiddleware');

// For now, these routes are open. Add 'protect' middleware before controller
// functions to secure them, e.g., router.post('/', protect, createEmergencyReport);

// --- Emergency Report & Chat Routes ---

// POST /api/emergency
// Creates a new emergency report.
router.post('/', createEmergencyReport);

// GET /api/emergency/:reportId
// Gets a specific report and all its chat messages.
router.get('/:reportId', getReportWithMessages);

// POST /api/emergency/:reportId/messages
// Adds a new chat message to a report.
router.post('/:reportId/messages', addMessageToReport);
router.get('/driver/:driverId', getReportsByDriver); 

module.exports = router;