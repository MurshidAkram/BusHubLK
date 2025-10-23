// backend/routes/safetyRoutes.js
const express = require('express');
const router = express.Router();
const {
  getSafetySummary,
  getIncidentTrend,
  getIncidentsByRegion,
  getIncidentsByDepot,
  getRecentIncidents,
  getIncidentSeverity,
  getIncidentsOverview,
  getIncidentById,
  updateIncidentStatus,
  getIncidentStats
} = require('../controllers/safetyController');

// Import authentication middleware
const { authenticateJWT, authorizeCEO } = require('../middlewares/authMiddleware');

// ============================================
// PRIMARY ENDPOINT (Used by React Frontend)
// ============================================

// Combined endpoint - fetches all incident data in one request
// GET /api/ceo/incidents
router.get('/incidents', authenticateJWT, authorizeCEO, getIncidentsOverview);

// ============================================
// INDIVIDUAL DATA ENDPOINTS (Optional/Granular Access)
// ============================================

// Get summary statistics (total incidents, breakdowns, accidents, pending, resolved)
// GET /api/ceo/summary?months=6
router.get('/summary', authenticateJWT, authorizeCEO, getSafetySummary);

// Get incident trend over time (monthly breakdown)
// GET /api/ceo/incident-trend?months=6
router.get('/incident-trend', authenticateJWT, authorizeCEO, getIncidentTrend);

// Get incidents grouped by region
// GET /api/ceo/incidents-by-region?months=6
router.get('/incidents-by-region', authenticateJWT, authorizeCEO, getIncidentsByRegion);

// Get top depots by incident count
// GET /api/ceo/incidents-by-depot?limit=10
router.get('/incidents-by-depot', authenticateJWT, authorizeCEO, getIncidentsByDepot);

// Get recent incidents log
// GET /api/ceo/recent-incidents?limit=15
router.get('/recent-incidents', authenticateJWT, authorizeCEO, getRecentIncidents);

// Get incident severity distribution (High/Medium/Low)
// GET /api/ceo/incident-severity
router.get('/incident-severity', authenticateJWT, authorizeCEO, getIncidentSeverity);

// ============================================
// DETAILED INCIDENT MANAGEMENT
// ============================================

// Get detailed information about a specific incident
// GET /api/ceo/incidents/:id
router.get('/incidents/:id', authenticateJWT, authorizeCEO, getIncidentById);

// Update incident status (resolve, investigate, etc.)
// PUT /api/ceo/incidents/:id/status
// Body: { status: 'resolved', notes: 'Fixed by mechanic team' }
router.put('/incidents/:id/status', authenticateJWT, authorizeCEO, updateIncidentStatus);

// ============================================
// STATISTICS & ANALYTICS
// ============================================

// Get custom incident statistics for date range
// GET /api/ceo/incident-stats?startDate=2024-01-01&endDate=2024-12-31
router.get('/incident-stats', authenticateJWT, authorizeCEO, getIncidentStats);

module.exports = router;