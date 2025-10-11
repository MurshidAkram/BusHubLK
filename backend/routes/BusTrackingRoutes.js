const express = require('express');
const router = express.Router();
const {
  getAllBusTrackings,
  getBusTracking,
  getAllRoutes,
  getBusesByRouteNumber,
} = require('../controllers/BusTrackingController');

// GET /api/bus-tracking - Fetch all nearby bus records
router.get('/', getAllBusTrackings);

// GET /api/bus-tracking/nearby - Fetch nearby buses (alias for consistency)
router.get('/nearby', getAllBusTrackings);

// GET /api/bus-tracking/routes - Fetch all active routes
router.get('/routes', getAllRoutes);

// GET /api/bus-tracking/:busId - Fetch bus records for a specific bus
router.get('/:busId', getBusTracking);

// GET /api/bus-tracking/route/:routeNumber - Fetch buses by route number
router.get('/route/:routeNumber', getBusesByRouteNumber);

module.exports = router;
