const express = require('express');
const router = express.Router();
const {
  createBusConditionReport,
  getAllBusConditionReports,
  getBusConditionReportsByBusId,
  getBusConditionReportById,
  getBusConditionReportsByDriverId,
  updateBusConditionReport,
  deleteBusConditionReport,
} = require('../controllers/BusConditionReportController');

// Create a new bus condition report
router.post('/', createBusConditionReport);

// Get all bus condition reports
router.get('/', getAllBusConditionReports);

// Get bus condition reports by busId
router.get('/bus/:busId', getBusConditionReportsByBusId);

// Get bus condition reports by driverId
router.get('/driver/:driverId', getBusConditionReportsByDriverId);

// Get a bus condition report by reportId
router.get('/:reportId', getBusConditionReportById);

// Update a bus condition report
router.put('/:reportId', updateBusConditionReport);

// Delete a bus condition report
router.delete('/:reportId', deleteBusConditionReport);

module.exports = router;
