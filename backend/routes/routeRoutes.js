const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute
} = require('../controllers/routeController');

// GET /api/routes
router.get('/', getAllRoutes);

// GET /api/routes/:id
router.get('/:id', getRouteById);

// POST /api/routes
router.post('/', createRoute);

// PUT /api/routes/:id
router.put('/:id', updateRoute);

// DELETE /api/routes/:id
router.delete('/:id', deleteRoute);

module.exports = router;