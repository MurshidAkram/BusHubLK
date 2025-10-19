
const express = require('express');
const router = express.Router();
const {
  getAllRegions,
  getRegionById,
  createRegion,
  getAllDepots,
  getDepotById,
  getDepotsByRegion,
  createDepot,
  updateDepot,
  deleteDepot,
  getDepotServiceMonitor
} = require('../controllers/regionDepotController');

const { authenticateJWT, authorizeAdmin, authorizeRole } = require('../middlewares/authMiddleware');
const { body, param } = require('express-validator');

// Middleware to authorize regional technical officers and admins
const authorizeRegionalTechOrAdmin = authorizeRole(['regional_tech', 'admin', 'ceo', 'dgm_technical', 'dgm_operations']);

// Region routes
router.get('/regions', authenticateJWT, getAllRegions);
router.get('/regions/:id',
  authenticateJWT,
  param('id').isInt().withMessage('Region ID must be an integer'),
  getRegionById
);
router.post('/regions',
  authenticateJWT,
  authorizeAdmin,
  [
    body('region_name')
      .notEmpty().withMessage('Region name is required')
      .isLength({ max: 100 }).withMessage('Region name must be less than 100 characters')
  ],
  createRegion
);

// Depot routes
router.get('/depots', authenticateJWT, getAllDepots);

// Get depot service monitor data (bus status counts and last inspection dates)
// These specific routes must come BEFORE the parameterized routes
router.get('/depots/service-monitor', authenticateJWT, authorizeRegionalTechOrAdmin, getDepotServiceMonitor);
router.get('/depots/service-monitor/region/:region_id',
  authenticateJWT,
  authorizeRegionalTechOrAdmin,
  param('region_id').isInt().withMessage('Region ID must be an integer'),
  getDepotServiceMonitor
);

router.get('/depots/:id',
  authenticateJWT,
  param('id').isInt().withMessage('Depot ID must be an integer'),
  getDepotById
);
router.get('/depots/region/:region_id',
  authenticateJWT,
  param('region_id').isInt().withMessage('Region ID must be an integer'),
  getDepotsByRegion
);
router.post('/depots',
  authenticateJWT,
  authorizeAdmin,
  [
    body('depot_name')
      .notEmpty().withMessage('Depot name is required')
      .isLength({ max: 100 }).withMessage('Depot name must be less than 100 characters'),
    body('region_id').isInt().withMessage('Region ID must be an integer'),
    body('address').notEmpty().withMessage('Address is required'),
    body('contact_phone')
      .notEmpty().withMessage('Contact phone is required')
      .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Valid phone number required'),
    body('latitude').isFloat().withMessage('Valid latitude required'),
    body('longitude').isFloat().withMessage('Valid longitude required')
  ],
  createDepot
);
router.put('/depots/:id',
  authenticateJWT,
  authorizeAdmin,
  [
    param('id').isInt().withMessage('Depot ID must be an integer'),
    body('depot_name')
      .optional()
      .isLength({ max: 100 }).withMessage('Depot name must be less than 100 characters'),
    body('region_id').optional().isInt().withMessage('Region ID must be an integer'),
    body('address').optional().notEmpty().withMessage('Address cannot be empty'),
    body('contact_phone')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Valid phone number required'),
    body('latitude').optional().isFloat().withMessage('Valid latitude required'),
    body('longitude').optional().isFloat().withMessage('Valid longitude required')
  ],
  updateDepot
);
router.delete('/depots/:id',
  authenticateJWT,
  authorizeAdmin,
  param('id').isInt().withMessage('Depot ID must be an integer'),
  deleteDepot
);

module.exports = router;