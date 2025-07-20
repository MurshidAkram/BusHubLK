const express = require('express');
const router = express.Router();
const {
  getAllBuses,
  getBusById,
  getBusesByDepot,
  getBusesByRegion,
  getBusesByStatus,
  getBusesByClass,
  searchBuses,
  createBus,
  updateBus,
  deleteBus
} = require('../controllers/busController');

const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

const { body, param, query } = require('express-validator');

// GET /api/buses - Get all buses (Admin only)
router.get('/', authenticateJWT, authorizeAdmin, getAllBuses);

// GET /api/buses/search - Search buses
router.get('/search', authenticateJWT, authorizeAdmin, [
  query('query').notEmpty().withMessage('Search query is required')
], searchBuses);

// GET /api/buses/:id - Get bus by ID
router.get('/:id', authenticateJWT, authorizeAdmin, [
  param('id').isInt().withMessage('Bus ID must be an integer')
], getBusById);

// GET /api/buses/depot/:depot_id - Get buses by depot
router.get('/depot/:depot_id', authenticateJWT, authorizeAdmin, [
  param('depot_id').isInt().withMessage('Depot ID must be an integer')
], getBusesByDepot);

// GET /api/buses/region/:region_id - Get buses by region
router.get('/region/:region_id', authenticateJWT, authorizeAdmin, [
  param('region_id').isInt().withMessage('Region ID must be an integer')
], getBusesByRegion);

// GET /api/buses/status/:status - Get buses by status
router.get('/status/:status', authenticateJWT, authorizeAdmin, [
  param('status').isIn(['Active', 'In Service', 'Maintenance', 'Out of Service', 'Retired'])
    .withMessage('Invalid status')
], getBusesByStatus);

// GET /api/buses/class/:class - Get buses by class
router.get('/class/:class', authenticateJWT, authorizeAdmin, [
  param('class').isIn(['A', 'B', 'C', 'D'])
    .withMessage('Invalid class (must be A, B, C, or D)')
], getBusesByClass);

// POST /api/buses - Create new bus (Admin only)
router.post('/', authenticateJWT, authorizeAdmin, [
  body('registration_number').notEmpty().withMessage('Registration number is required'),
  body('depot_id').optional().isInt().withMessage('Depot ID must be an integer'),
  body('class').isIn(['A', 'B', 'C', 'D']).withMessage('Invalid class'),
  body('manufacturer').notEmpty().withMessage('Manufacturer is required'),
  body('model').optional(),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Invalid year'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('Mileage must be a positive number'),
  body('status').optional().isIn(['Active', 'In Service', 'Maintenance', 'Out of Service', 'Retired'])
    .withMessage('Invalid status'),
  body('purchase_date').optional().isISO8601().withMessage('Invalid date format')
], createBus);

// PUT /api/buses/:id - Update bus (Admin only)
router.put('/:id', authenticateJWT, authorizeAdmin, [
  param('id').isInt().withMessage('Bus ID must be an integer'),
  body('registration_number').optional().notEmpty().withMessage('Registration number cannot be empty'),
  body('depot_id').optional().isInt().withMessage('Depot ID must be an integer'),
  body('class').optional().isIn(['A', 'B', 'C', 'D']).withMessage('Invalid class'),
  body('manufacturer').optional().notEmpty().withMessage('Manufacturer cannot be empty'),
  body('model').optional(),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Invalid year'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('Mileage must be a positive number'),
  body('status').optional().isIn(['Active', 'In Service', 'Maintenance', 'Out of Service', 'Retired'])
    .withMessage('Invalid status'),
  body('purchase_date').optional().isISO8601().withMessage('Invalid date format')
], updateBus);

// DELETE /api/buses/:id - Delete bus (Admin only)
router.delete('/:id', authenticateJWT, authorizeAdmin, [
  param('id').isInt().withMessage('Bus ID must be an integer')
], deleteBus);

module.exports = router;