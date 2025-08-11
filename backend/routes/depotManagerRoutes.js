const express = require('express');
const router = express.Router();
// Make sure the path to your controller is correct
const managerController = require('../controllers/depotManagerController');

// --- THIS IS THE FIX ---
// Changed from '/escalated' to '/' to handle GET requests to /api/depot-manager
router.get('/', managerController.getManagerReports);

// NEW: Route to get the statistics for the manager dashboard cards
router.get('/statistics', managerController.getStats);

// Route for the manager to post a reply
router.post('/emergency/:reportId/reply', managerController.addManagerReply);

// Route for the manager to update a report's status
router.patch('/emergency/:reportId/status', managerController.updateReportStatus);


module.exports = router;