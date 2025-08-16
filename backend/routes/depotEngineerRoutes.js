const express = require('express');
const router = express.Router();
const depotEngineerController = require('../controllers/depotEngineerController');
const { getUsageHistoryByBus } = require('../controllers/sparePartsController');
const {
    getDepotServiceSchedules,
    getDepotStats,
    getDepotBuses,
    createServiceSchedule,
    updateServiceSchedule,
    startWork,
    completeService,
    cancelService,
    restoreService,
    getServiceScheduleById,
    updateAllAutomaticStatuses
} = require('../controllers/serviceScheduleController');
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

// GET /api/depot-engineer/buses/:bus_id/service-history - Get service history for a bus
router.get('/buses/:bus_id/service-history',
    authenticateJWT,
    authorizeTechnical,
    [
        param('bus_id').isInt().withMessage('Bus ID must be an integer')
    ],
    depotEngineerController.getServiceHistoryForBus
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

// === SERVICE SCHEDULE ROUTES ===

// GET /api/depot-engineer/service-schedules - Get all service schedules for depot
router.get('/service-schedules',
    authenticateJWT,
    authorizeTechnical,
    getDepotServiceSchedules
);

// GET /api/depot-engineer/service-schedules/stats - Get depot statistics
router.get('/service-schedules/stats',
    authenticateJWT,
    authorizeTechnical,
    getDepotStats
);

// GET /api/depot-engineer/service-schedules/buses - Get available buses for depot
router.get('/service-schedules/buses',
    authenticateJWT,
    authorizeTechnical,
    getDepotBuses
);

// POST /api/depot-engineer/service-schedules - Create new service schedule
router.post('/service-schedules',
    authenticateJWT,
    authorizeTechnical,
    [
        body('service_type').notEmpty().withMessage('Service type is required'),
        body('bus_id').isInt().withMessage('Bus ID must be an integer'),
        body('scheduled_date').isDate().withMessage('Scheduled date must be a valid date')
    ],
    createServiceSchedule
);

// PUT /api/depot-engineer/service-schedules/:id - Update service schedule
router.put('/service-schedules/:id',
    authenticateJWT,
    authorizeTechnical,
    [
        param('id').isInt().withMessage('Schedule ID must be an integer'),
        body('service_type').optional().notEmpty().withMessage('Service type cannot be empty'),
        body('bus_id').optional().isInt().withMessage('Bus ID must be an integer'),
        body('scheduled_date').optional().isDate().withMessage('Scheduled date must be a valid date')
    ],
    updateServiceSchedule
);

// GET /api/depot-engineer/service-schedules/:id - Get service schedule by ID
router.get('/service-schedules/:id',
    authenticateJWT,
    authorizeTechnical,
    [param('id').isInt().withMessage('Schedule ID must be an integer')],
    getServiceScheduleById
);

// PATCH /api/depot-engineer/service-schedules/:id/start - Start work on service
router.patch('/service-schedules/:id/start',
    authenticateJWT,
    authorizeTechnical,
    [param('id').isInt().withMessage('Schedule ID must be an integer')],
    startWork
);

// PATCH /api/depot-engineer/service-schedules/:id/complete - Complete service
router.patch('/service-schedules/:id/complete',
    authenticateJWT,
    authorizeTechnical,
    [param('id').isInt().withMessage('Schedule ID must be an integer')],
    completeService
);

// PATCH /api/depot-engineer/service-schedules/:id/cancel - Cancel service
router.patch('/service-schedules/:id/cancel',
    authenticateJWT,
    authorizeTechnical,
    [param('id').isInt().withMessage('Schedule ID must be an integer')],
    cancelService
);

// PATCH /api/depot-engineer/service-schedules/:id/restore - Restore cancelled service
router.patch('/service-schedules/:id/restore',
    authenticateJWT,
    authorizeTechnical,
    [param('id').isInt().withMessage('Schedule ID must be an integer')],
    restoreService
);

// POST /api/depot-engineer/service-schedules/update-statuses - Manually trigger status updates (for testing)
router.post('/service-schedules/update-statuses',
    authenticateJWT,
    authorizeTechnical,
    updateAllAutomaticStatuses
);

module.exports = router;