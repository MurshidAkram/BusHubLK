const express = require('express');
const router = express.Router();
const {
  createBusOccupancy,
  getBusOccupancy,
  updateBusOccupancy,
  deleteBusOccupancy,
} = require('../controllers/BusOccupancyController');

// GET all occupancy records for a specific bus
// Route: GET /api/bus-occupancy/:busId
router.get('/:busId', getBusOccupancy);

// POST a new occupancy record for a specific bus
// Route: POST /api/bus-occupancy/:busId
router.post('/:busId', createBusOccupancy);

// PUT (update) a specific occupancy record for a specific bus
// Route: PUT /api/bus-occupancy/:busId/:occupancyId
router.put('/:busId/:occupancyId', updateBusOccupancy);

// DELETE a specific occupancy record for a specific bus
// Route: DELETE /api/bus-occupancy/:busId/:occupancyId
router.delete('/:busId/:occupancyId', deleteBusOccupancy);

module.exports = router;