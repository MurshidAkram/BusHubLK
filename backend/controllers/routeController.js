const Route = require('../models/routeModel');

const mapRoute = (route) => ({
  id: route.route_id,
  route_number: route.route_number,
  route_name: route.route_name,
  start_location: route.start_location,
  end_location: route.end_location,
  distance_km: route.distance_km,
  estimated_duration_minutes: route.estimated_duration_minutes,
  is_active: route.is_active,
  created_at: route.created_at,
  updated_at: route.updated_at,
});

// Get all routes
const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.getAll();
    res.json(routes.map(mapRoute));
  } catch (err) {
    console.error('Get all routes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get route by ID
const getRouteById = async (req, res) => {
  try {
    const route = await Route.getById(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(mapRoute(route));
  } catch (err) {
    console.error('Get route by ID error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create route
const createRoute = async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json(mapRoute(route));
  } catch (err) {
    console.error('Create route error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update route
const updateRoute = async (req, res) => {
  try {
    const route = await Route.update(req.params.id, req.body);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(mapRoute(route));
  } catch (err) {
    console.error('Update route error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete route
const deleteRoute = async (req, res) => {
  try {
    const deleted = await Route.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Route not found' });
    res.json({ message: 'Route deleted', id: req.params.id });
  } catch (err) {
    console.error('Delete route error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute
};