const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  getDepots,
  createRoute,
  updateRoute,
  deactivateRoute
} = require('../controllers/routeController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

// GET /api/routes - Get all routes
router.get('/', authenticateJWT, authorizeAdmin, getAllRoutes);

// GET /api/routes/depots - Get all depots for dropdown
router.get('/depots', authenticateJWT, authorizeAdmin, getDepots);

// POST /api/routes - Create new route
router.post('/', authenticateJWT, authorizeAdmin, createRoute);

// PUT /api/routes/:id - Update route
router.put('/:id', authenticateJWT, authorizeAdmin, updateRoute);

// DELETE /api/routes/:id - Deactivate route
router.delete('/:id', authenticateJWT, authorizeAdmin, deactivateRoute);

module.exports = router;