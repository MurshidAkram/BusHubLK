const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middlewares/authMiddleware');
const depotManagerNotificationsController = require('../controllers/depotManagerNotificationsController');

const ensureDepotManager = (req, res, next) => {
    if (req.user?.role !== 'depot_manager') {
        return res.status(403).json({
            success: false,
            message: 'Depot manager access required'
        });
    }

    next();
};

router.get(
    '/depot-manager/notifications',
    authenticateJWT,
    ensureDepotManager,
    depotManagerNotificationsController.getNotifications
);

router.get(
    '/depot-manager/notifications/unread-count',
    authenticateJWT,
    ensureDepotManager,
    depotManagerNotificationsController.getUnreadCount
);

router.post(
    '/depot-manager/notifications/mark-read',
    authenticateJWT,
    ensureDepotManager,
    depotManagerNotificationsController.markAsRead
);

router.post(
    '/depot-manager/notifications/mark-all-read',
    authenticateJWT,
    ensureDepotManager,
    depotManagerNotificationsController.markAllAsRead
);

module.exports = router;
