const express = require('express');
const router = express.Router();
const incidentManagementController = require('../controllers/incidentManagementController');

// Route to get all reports with filtering
router.get('/reports', incidentManagementController.getAllReports);

// Route to get a specific report by ID
router.get('/reports/:id', incidentManagementController.getReportById);

// Route to resolve a report
router.patch('/reports/:id/resolve', incidentManagementController.resolveReport);

// Route to update report status
router.patch('/reports/:id/status', incidentManagementController.updateReportStatus);

// Route to get statistics
router.get('/statistics', incidentManagementController.getStatistics);

// Route to get available years
router.get('/years', incidentManagementController.getAvailableYears);

// Route to get available categories
router.get('/categories', incidentManagementController.getItemCategories);

// Route to export data as CSV
router.get('/export/csv', incidentManagementController.exportToCSV);

module.exports = router;
