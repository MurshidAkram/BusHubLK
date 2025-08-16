const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeTechnical } = require('../middlewares/authMiddleware');
const {
    addSparePart,
    getSpareParts,
    updatePartStock,
    useSparePartStock,
    deleteSparepart,
    getUsageHistoryByBus,
    getAllUsageHistory,
    testSpareParts
} = require('../controllers/sparePartsController');

// Apply authentication and authorization middleware to all routes EXCEPT test
router.use('/test', (req, res, next) => {
    // Bypass auth for testing - mock user data
    req.user = {
        userId: 1,
        depot_id: 1,
        role: 'depot_engineer'
    };
    next();
});

router.use(authenticateJWT);
router.use(authorizeTechnical);

// GET /api/depot-engineer/spare-parts/test - Test endpoint
router.get('/test', testSpareParts);

// POST /api/depot-engineer/spare-parts/test - Test add part without auth
router.post('/test', async (req, res) => {
    try {
        console.log('🧪 Test POST called');
        console.log('📥 Body:', req.body);

        // Mock user data for testing
        req.user = {
            userId: 1,
            depot_id: 1,
            role: 'depot_engineer'
        };

        // Call the actual addSparePart function
        await addSparePart(req, res);
    } catch (error) {
        console.error('💥 Test POST error:', error);
        res.status(500).json({
            success: false,
            message: 'Test failed',
            error: error.message
        });
    }
});

// GET /api/depot-engineer/spare-parts - Get all spare parts for depot
router.get('/', getSpareParts);

// POST /api/depot-engineer/spare-parts - Add new spare part
router.post('/', addSparePart);

// PUT /api/depot-engineer/spare-parts/:part_id/restock - Update spare part stock (restock)
router.put('/:part_id/restock', updatePartStock);

// PUT /api/depot-engineer/spare-parts/:part_id/use - Use spare part (reduce stock)
router.put('/:part_id/use', useSparePartStock);

// DELETE /api/depot-engineer/spare-parts/:part_id - Delete spare part
router.delete('/:part_id', deleteSparepart);

// GET /api/depot-engineer/spare-parts/usage-history - Get all usage history for depot
router.get('/usage-history', getAllUsageHistory);

// GET /api/depot-engineer/spare-parts/usage-history/:bus_id - Get usage history for specific bus
router.get('/usage-history/:bus_id', getUsageHistoryByBus);

module.exports = router;
