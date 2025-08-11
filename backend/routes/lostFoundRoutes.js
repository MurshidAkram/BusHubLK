const express = require('express');
const router = express.Router();
const lostFoundController = require('../controllers/lostFoundController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

// Public routes (for viewing reports)
router.get('/reports', lostFoundController.getReports);
router.get('/routes', lostFoundController.getRoutes);
router.get('/routes/search', lostFoundController.searchRoutes);
router.get('/regions', lostFoundController.getRegions);
router.get('/routes/:route_number/buses', lostFoundController.getBusesForRoute);
router.get('/statistics', lostFoundController.getStatistics);

// Submit a new lost/found report (public route)
router.post('/reports', lostFoundController.uploadMiddleware, lostFoundController.submitReport);

// Test image upload endpoint
router.post('/test-upload', lostFoundController.uploadMiddleware, lostFoundController.testImageUpload);

// Test endpoint for database insertion
router.post('/test-insert', lostFoundController.testInsert);

// Protected routes (require authentication)
router.use(authenticateJWT); // Apply auth middleware to all routes below

// Get user's own reports
router.get('/users/:passenger_id/reports', lostFoundController.getUserReports);

// Mark report as resolved
router.put('/reports/:report_id/resolve', lostFoundController.markReportResolved);

// Get matches for a specific report
router.get('/reports/:report_id/matches', lostFoundController.getMatches);

// Update match status
router.put('/matches/:match_id', lostFoundController.updateMatchStatus);

module.exports = router;