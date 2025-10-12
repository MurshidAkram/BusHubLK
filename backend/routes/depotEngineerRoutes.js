    const express = require('express');
    const router = express.Router();
    const depotEngineerController = require('../controllers/depotEngineerController');
    const { authenticateJWT, authorizeDepotEngineer, authorizeTechnical } = require('../middlewares/authMiddleware');
    const { body, param } = require('express-validator');

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

    // GET /api/depot-engineer/buses/:bus_id/service-history - Get completed service history for a bus
    router.get('/buses/:bus_id/service-history',
        authenticateJWT,
        authorizeTechnical,
        [
            param('bus_id').isInt().withMessage('Bus ID must be an integer')
        ],
        depotEngineerController.getServiceHistoryForBus
    );

    module.exports = router;