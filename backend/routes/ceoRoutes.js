// routes/ceoRoutes.js
const express = require('express');
const router = express.Router();
const ceoController = require('../controllers/ceoController');

// CEO Dashboard Routes
router.get('/regions', ceoController.getRegionalOverview);
router.get('/depots', ceoController.getDepotOverview);
router.get('/fleet-summary', ceoController.getFleetSummary);
router.get('/regions/:regionId/depots', ceoController.getRegionDepots);
router.get('/depots/:depotId/buses', ceoController.getDepotBuses);

module.exports = router;