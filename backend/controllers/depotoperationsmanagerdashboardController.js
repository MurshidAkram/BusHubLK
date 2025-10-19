const db = require('../config/db');

exports.getFleetStatus = async (req, res) => {
  const { depot_id } = req.params;
  try {
    const result = await db.query(
      `SELECT status, COUNT(*) AS count
       FROM buses
       WHERE depot_id = $1 AND is_deleted = false
       GROUP BY status`,
      [depot_id]
    );
    // Format the result as an object
    const statusMap = {
      active: 0,
      inService: 0,
      maintenance: 0,
      outOfService: 0,
      total: 0
    };
    result.rows.forEach(row => {
      const status = row.status.toLowerCase();
      if (status === 'active') statusMap.active = Number(row.count);
      else if (status === 'in service' || status === 'in_service') statusMap.inService = Number(row.count);
      else if (status === 'maintenance') statusMap.maintenance = Number(row.count);
      else if (status === 'out of service' || status === 'out_of_service') statusMap.outOfService = Number(row.count);
      statusMap.total += Number(row.count);
    });
    res.json(statusMap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};