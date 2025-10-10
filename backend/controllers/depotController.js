const db = require('../config/db');

const getDepotProfile = async (req, res) => {
  try {
    const depotId = req.params.depot_id;
    // Get depot details
    const [depotRows] = await db.query('SELECT * FROM depots WHERE depot_id = ?', [depotId]);
    if (depotRows.length === 0) return res.status(404).json({ message: 'Depot not found' });

    // Get bus count for this depot
    const [busRows] = await db.query('SELECT COUNT(*) AS bus_count FROM buses WHERE depot_id = ? AND is_deleted = 0', [depotId]);
    const busCount = busRows[0]?.bus_count || 0;

    res.json({
      message: 'Depot retrieved successfully',
      depot: depotRows[0],
      bus_count: busCount
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving depot', error: err });
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