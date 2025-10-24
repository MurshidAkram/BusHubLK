// backend/routes/workforceRoutes.js
const express = require('express');
const router = express.Router();
const {
  getWorkforceSummary,
  getHeadcountByRegion,
  getHeadcountByDepot,
  getNewEmployeesByMonth,
  getRoleDistribution  // ADD THIS
} = require('../controllers/workforceController');

const { authenticateJWT, authorizeCEO } = require('../middlewares/authMiddleware');

// Summary statistics
router.get('/summary', authenticateJWT, authorizeCEO, getWorkforceSummary);

// Headcount by region
router.get('/headcount/region', authenticateJWT, authorizeCEO, getHeadcountByRegion);

// Headcount by depot
router.get('/headcount/depot', authenticateJWT, authorizeCEO, getHeadcountByDepot);

// New employees trend
router.get('/new-employees', authenticateJWT, authorizeCEO, getNewEmployeesByMonth);

// Role distribution - ADD THIS ROUTE
router.get('/role-distribution', authenticateJWT, authorizeCEO, getRoleDistribution);

module.exports = router;