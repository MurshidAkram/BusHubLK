const express = require('express');
const router = express.Router();
const {
  createBusConditionReport,
  getAllBusConditionReports,
  getBusConditionReportsByBusId,
  getBusConditionReportById,
} = require('../controllers/BusConditionReportController');

// Create a new bus condition report
router.post('/', createBusConditionReport);

// Get all bus condition reports
router.get('/', getAllBusConditionReports);

// Get bus condition reports by busId
router.get('/bus/:busId', getBusConditionReportsByBusId);

// Get a bus condition report by reportId
router.get('/:reportId', getBusConditionReportById);

module.exports = router;
