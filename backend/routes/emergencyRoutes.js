const express = require('express');
const router = express.Router();
const {
  createEmergencyReport,
  getReportWithMessages,
  addMessageToReport,
  getReportsByDriver,
  getDepotContact,
} = require('../controllers/emergencyController');

// --- Emergency Report & Chat Routes ---

// POST /api/emergency
router.post('/', createEmergencyReport);

// 👇 MOVED SPECIFIC GET ROUTES BEFORE THE GENERIC ONE

// GET /api/emergency/driver/:driverId 
// Note: This was also moved to avoid clashing with /:reportId
router.get('/driver/:driverId', getReportsByDriver); 

// GET /api/emergency/contact/:driverId
// Gets the contact number for the depot associated with the driver.
router.get('/contact/:driverId', getDepotContact);

// GET /api/emergency/:reportId 
// This generic route is now last among the GET routes.
router.get('/:reportId', getReportWithMessages);

// POST /api/emergency/:reportId/messages
router.post('/:reportId/messages', addMessageToReport);

module.exports = router;