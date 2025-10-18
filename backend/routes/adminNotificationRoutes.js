const express = require('express');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const adminNotificationController = require('../controllers/adminNotificationController');

const router = express.Router();

const ensureAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

router.get('/notifications', authenticateJWT, ensureAdmin, adminNotificationController.getNotifications);
router.get('/notifications/unread-count', authenticateJWT, ensureAdmin, adminNotificationController.getUnreadCount);
router.post('/notifications/mark-read', authenticateJWT, ensureAdmin, adminNotificationController.markAsRead);
router.post('/notifications/mark-all-read', authenticateJWT, ensureAdmin, adminNotificationController.markAllAsRead);

module.exports = router;
