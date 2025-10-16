const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');
const passengerNotificationController = require('../controllers/passengerNotificationController');

router.use(authenticateJWT);
router.use(authorizeRole(['passenger']));

router.use((req, res, next) => {
	res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
	res.set('Pragma', 'no-cache');
	res.set('Expires', '0');
	res.set('Surrogate-Control', 'no-store');
	res.set('ETag', `${Date.now()}-${Math.random().toString(36).slice(2)}`);
	next();
});

router.get('/', passengerNotificationController.getNotifications);
router.get('/unread-count', passengerNotificationController.getUnreadCount);
router.post('/mark-all-read', passengerNotificationController.markAllAsRead);
router.post('/:notificationId/read', passengerNotificationController.markNotificationAsRead);
router.delete('/:notificationId', passengerNotificationController.deleteNotification);

module.exports = router;
