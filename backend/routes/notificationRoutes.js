const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

// Protect all notification routes
router.use(authenticateJWT);

// Get notifications for current user
router.get('/', NotificationController.getNotifications);

// Get notifications specifically for depot engineers
router.get('/depot-engineer', NotificationController.getDepotEngineerNotifications);

// Get unread notification count
router.get('/unread-count', NotificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', NotificationController.markAllAsRead);

// Delete notification
router.delete('/:id', NotificationController.deleteNotification);

// Create notification (admin/internal use)
router.post('/', NotificationController.createNotification);

module.exports = router;