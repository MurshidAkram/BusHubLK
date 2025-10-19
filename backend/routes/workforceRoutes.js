const express = require('express');
const router = express.Router();
const {
  getWorkforceSummary,
  getHeadcountByRegion,
  getHeadcountByDepot,
  getNewEmployeesByMonth
} = require('../controllers/workforceController');

const { authenticateJWT, authorizeCEO } = require('../middlewares/authMiddleware');

router.get('/summary', authenticateJWT, authorizeCEO, getWorkforceSummary);
router.get('/headcount/region', authenticateJWT, authorizeCEO, getHeadcountByRegion);
router.get('/headcount/depot', authenticateJWT, authorizeCEO, getHeadcountByDepot);
router.get('/new-employees', authenticateJWT, authorizeCEO, getNewEmployeesByMonth);

module.exports = router;
