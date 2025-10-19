const express = require('express');
const router = express.Router();
const regionalOperationsNotificationController = require('../controllers/regionalOperationsNotificationController');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

const ensureRegionalOperations = authorizeRole(['regional_operations']);

router.get('/notifications', authenticateJWT, ensureRegionalOperations, regionalOperationsNotificationController.getNotifications);
router.get('/notifications/unread-count', authenticateJWT, ensureRegionalOperations, regionalOperationsNotificationController.getUnreadCount);
router.post('/notifications/mark-read', authenticateJWT, ensureRegionalOperations, regionalOperationsNotificationController.markAsRead);
router.post('/notifications/mark-all-read', authenticateJWT, ensureRegionalOperations, regionalOperationsNotificationController.markAllAsRead);

module.exports = router;
