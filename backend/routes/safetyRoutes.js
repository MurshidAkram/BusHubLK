// routes/safetyRoutes.js
const express = require('express');
const router = express.Router();
const {
  getSafetySummary,
  getIncidentTrend,
  getIncidentsByRegion,
  getRecentIncidents,
} = require('../controllers/safetyController');
const { authenticateJWT, authorizeCEO } = require('../middlewares/authMiddleware');

router.get('/summary', authenticateJWT, authorizeCEO, getSafetySummary);
router.get('/incident-trend', authenticateJWT, authorizeCEO, getIncidentTrend);
router.get('/incidents-by-region', authenticateJWT, authorizeCEO, getIncidentsByRegion);
router.get('/recent-incidents', authenticateJWT, authorizeCEO, getRecentIncidents);

module.exports = router;
