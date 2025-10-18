const express = require('express');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');
const dgmOperationsNotificationController = require('../controllers/dgmOperationsNotificationController');

const router = express.Router();

const ensureDGMOperations = authorizeRole(['dgm_operations']);

router.get('/notifications', authenticateJWT, ensureDGMOperations, dgmOperationsNotificationController.getNotifications);
router.get('/notifications/unread-count', authenticateJWT, ensureDGMOperations, dgmOperationsNotificationController.getUnreadCount);
router.post('/notifications/mark-read', authenticateJWT, ensureDGMOperations, dgmOperationsNotificationController.markAsRead);
router.post('/notifications/mark-all-read', authenticateJWT, ensureDGMOperations, dgmOperationsNotificationController.markAllAsRead);

module.exports = router;
