// backend/routes/safetyRoutes.js
const express = require('express');
const router = express.Router();
const {
  getSafetySummary,
  getIncidentTrend,
  getIncidentsByRegion,
  getRecentIncidents,
  getIncidentsOverview
} = require('../controllers/safetyController');

// If you have auth middlewares, keep them; for testing you can remove/disable.
// const { authenticateJWT, authorizeCEO } = require('../middlewares/authMiddleware');

// Combined endpoint used by the React CEO page:
router.get('/incidents', /* authenticateJWT, authorizeCEO, */ getIncidentsOverview);

// Individual endpoints (optional)
router.get('/summary', /* authenticateJWT, authorizeCEO, */ getSafetySummary);
router.get('/incident-trend', /* authenticateJWT, authorizeCEO, */ getIncidentTrend);
router.get('/incidents-by-region', /* authenticateJWT, authorizeCEO, */ getIncidentsByRegion);
router.get('/recent-incidents', /* authenticateJWT, authorizeCEO, */ getRecentIncidents);

module.exports = router;
