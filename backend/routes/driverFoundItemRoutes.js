const express = require('express');
const router = express.Router();
const driverFoundItemController = require('../controllers/driverFoundItemController');

// Submit a found item report from driver
router.post('/found-items', driverFoundItemController.uploadMiddleware, driverFoundItemController.submitFoundItem);

// Get all found items reported by drivers
router.get('/found-items', driverFoundItemController.getFoundItems);

// Get found item by ID
router.get('/found-items/:id', driverFoundItemController.getFoundItemById);

// Update found item status (claimed/unclaimed)
router.put('/found-items/:id/status', driverFoundItemController.updateItemStatus);

module.exports = router;
