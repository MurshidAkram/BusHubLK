const express = require('express');
const router = express.Router();
const {
  getAllBusTrackings,
  getBusTracking,
  getAllRoutes,
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
router.get('/route/:routeNumber', (req, res) => {
  // This is a placeholder - you'll need to implement this controller function
  const { routeNumber } = req.params;
  // Call the appropriate controller method
  // For now, return an empty array
  res.status(200).json([]);
});

module.exports = router;
