const express = require('express');
const router = express.Router();
const {
  updateBusPosition,
  getBusCurrentPosition,
  getBusesOnRoute,
  getAllActiveBuses,
  getNearbyBuses,
  getBusTrackingHistory,
  updateTrackingStatus,
  getDriverTrackingStatus,
  getTrackingStats,
  insertTestData
} = require('../controllers/BusLiveTrackingController');

const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

// ===============================================
// DRIVER ENDPOINTS (Authenticated drivers only)
// ===============================================

// POST /api/live-tracking/position - Update bus position
router.post('/position', authenticateJWT, updateBusPosition);

// GET /api/live-tracking/driver/status - Get driver's current tracking status
router.get('/driver/status', authenticateJWT, getDriverTrackingStatus);

// PUT /api/live-tracking/bus/:bus_id/status - Update tracking status
router.put('/bus/:bus_id/status', authenticateJWT, updateTrackingStatus);

// ===============================================
// PUBLIC ENDPOINTS (For passenger apps)
// ===============================================

// GET /api/live-tracking/bus/:bus_id - Get current position of specific bus
router.get('/bus/:bus_id', getBusCurrentPosition);

// GET /api/live-tracking/route/:route_number - Get all buses on a route
router.get('/route/:route_number', getBusesOnRoute);

// GET /api/live-tracking/buses/active - Get all currently active buses
router.get('/buses/active', getAllActiveBuses);

// GET /api/live-tracking/buses/nearby - Get nearby buses
// Query params: latitude, longitude, radius (optional, default 5km)
router.get('/buses/nearby', getNearbyBuses);

// ===============================================
// ADMIN ENDPOINTS (Authenticated admins only)
// ===============================================

// GET /api/live-tracking/history/bus/:bus_id - Get tracking history
// Query params: start_date, end_date (optional)
router.get('/history/bus/:bus_id', authenticateJWT, authorizeAdmin, getBusTrackingHistory);

// GET /api/live-tracking/stats - Get tracking statistics
router.get('/stats', authenticateJWT, authorizeAdmin, getTrackingStats);

// ===============================================
// TEST ENDPOINTS (Development only)
// ===============================================

if (process.env.NODE_ENV !== 'production') {
  // POST /api/live-tracking/test-data - Insert test tracking data
  router.post('/test-data', insertTestData);
}

module.exports = router;
