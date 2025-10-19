const express = require('express');
const router = express.Router();
const {
  getRegions,
  getDepots,
  getDepotsByRegion,
  getDepotRoutes,
  getDepotBuses
} = require('../controllers/ceoController');

const { 
  authenticateJWT,
  authorizeCEO
} = require('../middlewares/authMiddleware');

const { param } = require('express-validator');

router.get('/regions',
  authenticateJWT,
  authorizeCEO,
  getRegions
);

router.get('/depots',
  authenticateJWT,
  authorizeCEO,
  getDepots
);

router.get('/regions/:id/depots',
  authenticateJWT,
  authorizeCEO,
  param('id').isInt().withMessage('Region ID must be an integer'),
  getDepotsByRegion
);

router.get('/depots/:id/routes',
  authenticateJWT,
  authorizeCEO,
  param('id').isInt().withMessage('Depot ID must be an integer'),
  getDepotRoutes
);

router.get('/depots/:id/buses',
  authenticateJWT,
  authorizeCEO,
  param('id').isInt().withMessage('Depot ID must be an integer'),
  getDepotBuses
);

module.exports = router;