const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middlewares/authMiddleware');
const depotManagerNotificationsController = require('../controllers/depotManagerNotificationsController');

router.get('/depot-manager/:depot_id/notifications', authenticateJWT, depotManagerNotificationsController.getDepotManagerNotifications);
router.post('/depot-manager/:depot_id/notifications/read', authenticateJWT, depotManagerNotificationsController.markNotificationAsRead);

module.exports = router;