const CeoModel = require('../models/ceoModel');

const getRegions = async (req, res) => {
  try {
    const regions = await CeoModel.getRegions();
    res.json({ success: true, data: regions });
  } catch (err) {
    console.error('Get regions error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch regions', details: err.message });
  }
};

const getDepots = async (req, res) => {
  try {
    const depots = await CeoModel.getDepots();
    res.json({ success: true, data: depots });
  } catch (err) {
    console.error('Get depots error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch depots', details: err.message });
  }
};

const getDepotsByRegion = async (req, res) => {
  const { id } = req.params;
  try {
    const depots = await CeoModel.getDepotsByRegion(id);
    res.json({ success: true, data: depots });
  } catch (err) {
    console.error('Get depots by region error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch depots', details: err.message });
  }
};

const getDepotRoutes = async (req, res) => {
  const { id } = req.params;
  try {
    const routes = await CeoModel.getDepotRoutes(id);
    res.json({ success: true, data: routes });
  } catch (err) {
    console.error('Get depot routes error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch depot routes', details: err.message });
  }
};

const getDepotBuses = async (req, res) => {
  const { id } = req.params;
  try {
    const buses = await CeoModel.getDepotBuses(id);
    res.json({ success: true, data: buses });
  } catch (err) {
    console.error('Get depot buses error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch depot buses', details: err.message });
  }
};

module.exports = {
  getRegions,
  getDepots,
  getDepotsByRegion,
  getDepotRoutes,
  getDepotBuses
};