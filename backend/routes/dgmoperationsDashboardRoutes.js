const express = require('express');
const router = express.Router();
const controller = require('../controllers/dgmoperationsDashboardController');
const { authenticateJWT, authorizeDGM } = require('../middlewares/authMiddleware');

// optional test route (remove later)
router.get('/test', (req, res) => res.json({ success: true, message: 'dgm operations route mounted' }));

router.get('/overview', authenticateJWT, authorizeDGM, controller.getOverview);

module.exports = router;