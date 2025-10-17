const express = require('express');
const router = express.Router();
const regionalController = require('../controllers/regionaloperationsDashboardController');
const { authenticateJWT, authorizeRegionalOfficer } = require('../middlewares/authMiddleware');

// Protect this route so only authenticated regional officers (or allowed management roles) can access
router.get('/region/:region_id/overview', authenticateJWT, authorizeRegionalOfficer, regionalController.getRegionOverview);

module.exports = router;