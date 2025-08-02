const express = require('express');
const router = express.Router();
const depotEngineerController = require('../controllers/depotEngineerController');
const { getUsageHistoryByBus } = require('../controllers/sparePartsController');
const { authenticateJWT, authorizeDepotEngineer, authorizeTechnical } = require('../middlewares/authMiddleware');
const { body, param, query } = require('express-validator');

// GET /api/depot-engineer/buses - Get buses for depot engineer
router.get('/buses',
    authenticateJWT,
    authorizeTechnical,
    depotEngineerController.getBusesForDepotEngineer
);

// PUT /api/depot-engineer/buses/:bus_id/status - Update bus status
router.put('/buses/:bus_id/status',
    authenticateJWT,
    authorizeTechnical,
    [
        param('bus_id').isInt().withMessage('Bus ID must be an integer'),
        body('status').isIn(['Active', 'In Service', 'Maintenance', 'Out of Service'])
            .withMessage('Invalid status')
    ],
    depotEngineerController.updateBusStatus
);

// GET /api/depot-engineer/buses/:bus_id/spare-parts-usage - Get spare parts usage history for a bus
router.get('/buses/:bus_id/spare-parts-usage',
    authenticateJWT,
    authorizeTechnical,
    [
        param('bus_id').isInt().withMessage('Bus ID must be an integer')
    ],
    getUsageHistoryByBus
);



// GET /api/depot-engineer/condition-reports - Get reports for depot
router.get('/condition-reports',
    authenticateJWT,
    authorizeTechnical,
    [
        query('status').optional().isIn(['pending', 'reviewed'])
            .withMessage('Invalid status filter')
    ],
    depotEngineerController.getConditionReportsForDepot
);

// PUT /api/depot-engineer/condition-reports/:reportId/review - Review a report
router.put('/condition-reports/:reportId/review',
    authenticateJWT,
    authorizeTechnical,
    [
        param('reportId').isInt().withMessage('Report ID must be an integer')
    ],
    depotEngineerController.reviewConditionReport
);

// GET /api/depot-engineer/condition-reports/pending - Get pending reports
router.get('/condition-reports/pending',
    authenticateJWT,
    authorizeTechnical,
    depotEngineerController.getPendingReports
);

// GET /api/depot-engineer/condition-reports/stats - Get statistics
router.get('/condition-reports/stats',
    authenticateJWT,
    authorizeTechnical,
    depotEngineerController.getReportStatistics
);

module.exports = router;