// routes/BusOccupancyRoutes.js
const express = require('express');
const router = express.Router();
const {
  createBusOccupancy,
  getAllBusOccupancies, // New function to fetch all occupancies
  getBusOccupancy,
  updateBusOccupancy,
  deleteBusOccupancy,
} = require('../controllers/BusOccupancyController');

// GET /api/bus-occupancy - Fetch all occupancy records
router.get('/', getAllBusOccupancies);

// GET /api/bus-occupancy/:busId - Fetch occupancy records for a specific bus
router.get('/:busId', getBusOccupancy);

// POST /api/bus-occupancy/:busId - Create a new occupancy record for a specific bus
router.post('/:busId', createBusOccupancy);

// PUT /api/bus-occupancy/:busId/:occupancyId - Update a specific occupancy record
router.put('/:busId/:occupancyId', updateBusOccupancy);

// DELETE /api/bus-occupancy/:busId/:occupancyId - Delete a specific occupancy record
router.delete('/:busId/:occupancyId', deleteBusOccupancy);

module.exports = router;