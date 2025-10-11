const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  getDepots,
  getRouteStopsAutocomplete,
  findRoutesBetweenStops,
  createRoute,
  updateRoute,
  deactivateRoute
} = require('../controllers/routeController');
const { authenticateJWT, authorizeAdmin, authorizeDepotStaff} = require('../middlewares/authMiddleware');

// GET /api/routes - Get all routes
router.get('/', authenticateJWT,  getAllRoutes);

// GET /api/routes/depots - Get all depots for dropdown
router.get('/depots', authenticateJWT, getDepots);

// GET /api/routes/stops/autocomplete - Get route stops autocomplete suggestions (public)
router.get('/stops/autocomplete', getRouteStopsAutocomplete);

// POST /api/routes/find - Find routes between two stops (public)
router.post('/find', findRoutesBetweenStops);

// POST /api/routes - Create new route
router.post('/', authenticateJWT, authorizeAdmin, createRoute);

// PUT /api/routes/:id - Update route
router.put('/:id', authenticateJWT, authorizeAdmin, updateRoute);

// DELETE /api/routes/:id - Deactivate route
router.delete('/:id', authenticateJWT, authorizeAdmin, deactivateRoute);

module.exports = router;
