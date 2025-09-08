const express = require('express');
const router = express.Router();
const {
    getAllRegions,
    getDepotsByRegion,
    getAllDepots,
    getBusesByDepot,
    getBusDetails,
    getFleetOverview,
    getDashboardSummary,
    getServiceHistory,
    getPartsHistory,
    getInspectionHistory,
    generateRegionalReport,
    generateDepotReport
} = require('../controllers/dgmTechnicalController');

// GET /api/dgm-technical/regions - Get all regions with depot and bus counts
router.get('/regions', getAllRegions);

// GET /api/dgm-technical/regions/:regionId/depots - Get depots by region
router.get('/regions/:regionId/depots', getDepotsByRegion);

// GET /api/dgm-technical/depots - Get all depots grouped by region
router.get('/depots', getAllDepots);

// GET /api/dgm-technical/depots/:depotId/buses - Get buses by depot with pagination and filters
router.get('/depots/:depotId/buses', getBusesByDepot);

// GET /api/dgm-technical/buses/:busId - Get detailed bus information
router.get('/buses/:busId', getBusDetails);

// GET /api/dgm-technical/fleet-overview - Get comprehensive fleet statistics
router.get('/fleet-overview', getFleetOverview);

// GET /api/dgm-technical/dashboard-summary - Get dashboard summary for DGM Technical
router.get('/dashboard-summary', getDashboardSummary);

// GET /api/dgm-technical/service-history - Get service history with filtering
router.get('/service-history', getServiceHistory);

// GET /api/dgm-technical/parts-history - Get parts replacement history with filtering
router.get('/parts-history', getPartsHistory);

// GET /api/dgm-technical/inspection-history - Get inspection history with filtering
router.get('/inspection-history', getInspectionHistory);

// GET /api/dgm-technical/reports/regional - Generate regional performance and maintenance reports
router.get('/reports/regional', generateRegionalReport);

// GET /api/dgm-technical/reports/depot - Generate depot-level performance and maintenance reports
router.get('/reports/depot', generateDepotReport);

module.exports = router;
