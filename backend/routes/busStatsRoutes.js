const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateJWT } = require('../middlewares/authMiddleware');

// Monthly/Yearly bus stats
router.get('/depot/:depot_id/bus-stats', authenticateJWT, async (req, res) => {
  try {
    const { depot_id } = req.params;
    const period = req.query.period || 'monthly';

    let groupBy, label;
    if (period === 'yearly') {
      groupBy = "EXTRACT(YEAR FROM created_at)";
      label = "year";
    } else {
      groupBy = "TO_CHAR(created_at, 'YYYY-MM')";
      label = "month";
    }

    const result = await db.query(`
      SELECT
        ${groupBy} AS ${label},
        COUNT(*) FILTER (WHERE status = 'Active' AND is_deleted = false) AS active,
        COUNT(*) FILTER (WHERE status = 'In Service' AND is_deleted = false) AS in_service
      FROM buses
      WHERE depot_id = $1 AND is_deleted = false
      GROUP BY ${label}
      ORDER BY ${label}
    `, [depot_id]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bus stats', details: err.message });
  }
});

module.exports = router;