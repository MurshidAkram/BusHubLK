const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middlewares/authMiddleware');
const depotEngineerNotificationController = require('../controllers/depotEngineerNotificationController');

const ensureDepotEngineer = (req, res, next) => {
    if (req.user?.role !== 'depot_engineer') {
        return res.status(403).json({
            success: false,
            message: 'Depot engineer access required'
        });
    }
    next();
};

router.get('/notifications', authenticateJWT, ensureDepotEngineer, depotEngineerNotificationController.getNotifications);
router.get('/notifications/unread-count', authenticateJWT, ensureDepotEngineer, depotEngineerNotificationController.getUnreadCount);
router.post('/notifications/mark-read', authenticateJWT, ensureDepotEngineer, depotEngineerNotificationController.markAsRead);
router.post('/notifications/mark-all-read', authenticateJWT, ensureDepotEngineer, depotEngineerNotificationController.markAllAsRead);

module.exports = router;
