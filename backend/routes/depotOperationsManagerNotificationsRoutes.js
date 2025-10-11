const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middlewares/authMiddleware');
const depotOperationsManagerNotificationsController = require('../controllers/depotOperationsManagerNotificationsController');

router.get('/depot/:depot_id/notifications', authenticateJWT, depotOperationsManagerNotificationsController.getDepotNotifications);
router.post('/depot/:depot_id/notifications/read', authenticateJWT, depotOperationsManagerNotificationsController.markNotificationAsRead);

module.exports = router;