const express = require('express');
const router = express.Router();
const { getAvailableRoutes } = require('../controllers/routeController');

router.get('/available', getAvailableRoutes);

module.exports = router;
