const express = require('express');
const router = express.Router();
const {
  createBusTracking,
  getAllBusTrackings,
  getBusTracking,
  updateBusTracking,
  deleteBusTracking,
  getAllRoutes,
} = require('../controllers/BusTrackingController');

// GET /api/bus-tracking - Fetch all bus records
router.get('/', getAllBusTrackings);

// GET /api/bus-tracking/routes - Fetch all active routes
router.get('/routes', getAllRoutes);

// GET /api/bus-tracking/:busId - Fetch bus records for a specific bus
router.get('/:busId', getBusTracking);

// POST /api/bus-tracking/:busId - Create a new bus record
router.post('/:busId', createBusTracking);

// PUT /api/bus-tracking/:busId - Update a specific bus record
router.put('/:busId', updateBusTracking);

// DELETE /api/bus-tracking/:busId - Delete a specific bus record
router.delete('/:busId', deleteBusTracking);

module.exports = router;