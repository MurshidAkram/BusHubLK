const BusTripSummary = require('../models/BusTripSummary');

const getTripSummariesByDepot = async (req, res) => {
  const { depot_id } = req.params;
  try {
    const trips = await BusTripSummary.getAllByDepot(depot_id);
    res.json({ success: true, data: trips });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trip summaries', details: err.message });
  }
};

module.exports = { getTripSummariesByDepot };