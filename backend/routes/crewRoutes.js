const express = require('express');
const router = express.Router();
const { getCrew, updateCrewStatus } = require('../controllers/crewController');
const { authenticateJWT, authorizeAdmin, authorizeDepotStaff } = require('../middlewares/authMiddleware');

// GET /api/crew - Get all crew for a depot/region
// router.get('/', authenticateJWT, getCrew);
router.get('/', getCrew);

// PUT /api/crew/status - Update crew status (allow only depot staff or admin)
//router.put('/status', authenticateJWT, updateCrewStatus);
// Or for testing only:
router.put('/status', updateCrewStatus);

module.exports = router;