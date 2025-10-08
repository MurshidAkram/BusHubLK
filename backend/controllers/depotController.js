const Depot = require('../models/DepotModel');

const getDepotProfile = async (req, res) => {
  const depot_id = req.params.depot_id;
  try {
    const depot = await Depot.findById(depot_id);
    if (!depot) return res.status(404).json({ error: 'Depot not found' });
    const busCount = await Depot.getBusCount(depot_id);
    res.json({ ...depot, bus_count: busCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateDepotProfile = async (req, res) => {
  const depot_id = req.params.depot_id;
  const { depot_name, address, contact_phone } = req.body;
  try {
    const updated = await Depot.update(depot_id, { depot_name, address, contact_phone });
    const busCount = await Depot.getBusCount(depot_id);
    res.json({ ...updated, bus_count: busCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getDepotProfile, updateDepotProfile };