const express = require('express');
const router = express.Router();
const { calculateFare, getFareByStops, getAllFares } = require('../controllers/fareController');

// Calculate fare based on origin/destination (Google Maps integration)
router.post('/calculate', calculateFare);

// Get fare based on number of stops
router.get('/stops/:stops', getFareByStops);

// Get all available fare sections
router.get('/all', getAllFares);

module.exports = router;
