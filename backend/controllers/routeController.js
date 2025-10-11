const Route = require('../models/routeModel');
const db = require('../config/db');

const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.getAll();
    res.json({ routes });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getDepots = async (req, res) => {
  try {
    const result = await db.query(`SELECT depot_id, depot_name FROM depots WHERE is_active = TRUE ORDER BY depot_name`);
    res.json({ depots: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createRoute = async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json({ route });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateRoute = async (req, res) => {
  try {
    const route = await Route.update(req.params.id, req.body);
    res.json({ route });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deactivateRoute = async (req, res) => {
  try {
    const route = await Route.deactivate(req.params.id);
    res.json({ route });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllRoutes,
  getDepots,
  createRoute,
  updateRoute,
  deactivateRoute
};