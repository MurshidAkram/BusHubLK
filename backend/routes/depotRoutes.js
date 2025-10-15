const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { getDepotProfile, updateDepotProfile } = require('../controllers/depotController');
const { authenticateJWT, authorizeDepotStaff } = require('../middlewares/authMiddleware');

// GET /api/depots?region_id=2
router.get('/', async (req, res) => {
  const { region_id } = req.query;
  try {
    if (region_id) {
      const result = await db.query(
        'SELECT depot_id, depot_name FROM depots WHERE region_id = $1',
        [region_id]
      );
      return res.json({ depots: result.rows });
    } else {
      // fallback: return all depots if no region_id provided
      const result = await db.query('SELECT depot_id, depot_name FROM depots');
      return res.json({ depots: result.rows });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch depots' });
  }
});

// Get depot profile (with bus count)
router.get('/:depot_id', authenticateJWT, getDepotProfile);

// Update depot profile (allow depot staff)
router.put('/:depot_id', authenticateJWT, authorizeDepotStaff, updateDepotProfile);

module.exports = router;