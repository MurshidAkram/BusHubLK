const express = require('express');
const router = express.Router();
const controller = require('../controllers/depotoperationsmanagerdashboardController');

// GET fleet status for a depot
router.get('/depot/:depot_id/fleet-status', controller.getFleetStatus);

module.exports = router;