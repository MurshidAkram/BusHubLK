const express = require('express');
const router = express.Router();
const {
    getDepotServiceSchedules,
    getSchedulesByDate,
    getDepotStats,
    getDepotBuses,
    createServiceSchedule,
    updateServiceSchedule,
    startWork,
    completeService,
    cancelService,
    getServiceScheduleById
} = require('../controllers/serviceScheduleController');

const { authenticateJWT, authorizeTechnical, authorizeAdmin } = require('../middlewares/authMiddleware');
const { body, param, query } = require('express-validator');

// Validation rules
const createServiceScheduleValidation = [
    body('service_type').notEmpty().withMessage('Service type is required'),
    body('bus_id').isInt().withMessage('Bus ID must be an integer'),
    body('scheduled_date').isDate().withMessage('Scheduled date must be a valid date')
];

const updateServiceScheduleValidation = [
    param('id').isInt().withMessage('Schedule ID must be an integer'),
    body('service_type').optional().notEmpty().withMessage('Service type cannot be empty'),
    body('bus_id').optional().isInt().withMessage('Bus ID must be an integer'),
    body('scheduled_date').optional().isDate().withMessage('Scheduled date must be a valid date')
];

const serviceScheduleIdValidation = [
    param('id').isInt().withMessage('Schedule ID must be an integer')
];

// GET /api/service-schedules - Get all service schedules for depot
router.get('/',
    authenticateJWT,
    authorizeTechnical,
    getDepotServiceSchedules
);

// GET /api/service-schedules/stats - Get depot statistics
router.get('/stats',
    authenticateJWT,
    authorizeTechnical,
    getDepotStats
);

// GET /api/service-schedules/buses - Get available buses for depot
router.get('/buses',
    authenticateJWT,
    authorizeTechnical,
    getDepotBuses
);

// GET /api/service-schedules/date/:date - Get schedules for specific date
router.get('/date/:date',
    authenticateJWT,
    authorizeTechnical,
    [param('date').isDate().withMessage('Date must be valid')],
    getSchedulesByDate
);

// GET /api/service-schedules/:id - Get service schedule by ID
router.get('/:id',
    authenticateJWT,
    authorizeTechnical,
    serviceScheduleIdValidation,
    getServiceScheduleById
);

// POST /api/service-schedules - Create new service schedule
router.post('/',
    authenticateJWT,
    authorizeTechnical,
    createServiceScheduleValidation,
    createServiceSchedule
);

// PUT /api/service-schedules/:id - Update service schedule
router.put('/:id',
    authenticateJWT,
    authorizeTechnical,
    updateServiceScheduleValidation,
    updateServiceSchedule
);

// PATCH /api/service-schedules/:id/start - Start work on service
router.patch('/:id/start',
    authenticateJWT,
    authorizeTechnical,
    serviceScheduleIdValidation,
    startWork
);

// PATCH /api/service-schedules/:id/complete - Complete service
router.patch('/:id/complete',
    authenticateJWT,
    authorizeTechnical,
    serviceScheduleIdValidation,
    completeService
);

// PATCH /api/service-schedules/:id/cancel - Cancel service
router.patch('/:id/cancel',
    authenticateJWT,
    authorizeTechnical,
    serviceScheduleIdValidation,
    cancelService
);

module.exports = router;
