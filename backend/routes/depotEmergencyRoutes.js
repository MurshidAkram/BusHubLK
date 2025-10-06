const express = require('express');
const router = express.Router();
const depotController = require('../controllers/depotEmergencyController');

// GET /statistics - For the dashboard cards
router.get('/statistics', depotController.getDashboardStats);

// GET / - Get a list of all reports with filtering
router.get('/', depotController.getAllReports);

// --- DRIVER CHAT ROUTES ---
// GET /:reportId/messages - Get all messages for a specific report (with Driver)
router.get('/:reportId/messages', depotController.getReportMessages);

// POST /:reportId/messages - Depot sends a message (to Driver)
router.post('/:reportId/messages', depotController.addDepotMessage);

// --- MANAGER CHAT ROUTES (NEW) ---
// GET /:reportId/manager-chat - Get all messages for the manager chat
router.get('/:reportId/manager-chat', depotController.getManagerChatMessages);

// POST /:reportId/manager-chat - Depot sends a message to the manager
router.post('/:reportId/manager-chat', depotController.addManagerMessage);

// GET /:reportId - Get full details for one report
router.get('/:reportId', depotController.getReportDetails);

// PATCH /:reportId/status - Update report status
router.patch('/:reportId/status', depotController.updateReportStatus);

module.exports = router;