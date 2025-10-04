const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const communicationController = require('../controllers/communicationController');

// All communication routes should be protected
router.use(authenticateJWT);

/**
 * @route   GET /api/communication/contacts
 * @desc    Get a list of users the current user can communicate with
 * @access  Private
 */
router.get('/contacts', communicationController.getContacts);

// We will add more routes here later for:
// GET /conversations
// GET /conversations/:id/messages
// POST /messages
// GET /announcements

module.exports = router;
