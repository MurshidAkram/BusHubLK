const express = require('express');
const router = express.Router();
const rtoController = require('../controllers/rtoController');
const rtoNotificationController = require('../controllers/rtoNotificationController');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

const ensureRTO = authorizeRole(['regional_tech']);

// Notification endpoints for RTO dashboard
router.get('/notifications', authenticateJWT, ensureRTO, rtoNotificationController.getNotifications);
router.get('/notifications/unread-count', authenticateJWT, ensureRTO, rtoNotificationController.getUnreadCount);
router.post('/notifications/mark-read', authenticateJWT, ensureRTO, rtoNotificationController.markAsRead);
router.post('/notifications/mark-all-read', authenticateJWT, ensureRTO, rtoNotificationController.markAllAsRead);

// GET / - Get all reports escalated to RTO
router.get('/', rtoController.getRTOReports);

// GET /:reportId/chat - Get chat messages between RTO and Manager
router.get('/emergency/:reportId/chat', rtoController.getRTOChatMessages);

// POST /:reportId/reply - RTO sends a message to manager
router.post('/emergency/:reportId/reply', rtoController.addRTOReply);

// PATCH /:reportId/status - Update report status (resolve/escalate)
router.patch('/emergency/:reportId/status', rtoController.updateReportStatus);

module.exports = router;
