const express = require('express');
const router = express.Router();
const { getTripSummariesByDepot } = require('../controllers/busTripSummaryController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

router.get('/depot/:depot_id', authenticateJWT, getTripSummariesByDepot);

module.exports = router;