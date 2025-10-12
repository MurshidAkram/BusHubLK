const express = require('express');
const router = express.Router();
const { getDepotProfile, updateDepotProfile } = require('../controllers/depotController');
const { authenticateJWT, authorizeDepotStaff } = require('../middlewares/authMiddleware');

// Get depot profile (with bus count)
router.get('/:depot_id', authenticateJWT, getDepotProfile);

// Update depot profile (allow depot staff)
router.put('/:depot_id', authenticateJWT, authorizeDepotStaff, updateDepotProfile);

module.exports = router;