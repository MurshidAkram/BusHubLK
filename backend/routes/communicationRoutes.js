const express = require('express');
const router = express.Router();
const {
  getUserChannels,
  getChannelMessages,
  sendMessage,
  getAvailableContacts,
  createOrGetDirectChannel,
  markChannelAsRead,
  getChannelInfo
} = require('../controllers/communicationController');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const { body, param } = require('express-validator');

// All routes require authentication
router.use(authenticateJWT);

// GET /api/communication/channels - Get all channels for the user
router.get('/channels', getUserChannels);

// GET /api/communication/contacts - Get available contacts
router.get('/contacts', getAvailableContacts);

// POST /api/communication/channels/direct - Create or get a direct channel
router.post(
  '/channels/direct',
  [
    body('contactId').isInt().withMessage('Valid contact ID is required')
  ],
  createOrGetDirectChannel
);

// GET /api/communication/channels/:channelId - Get channel info
router.get(
  '/channels/:channelId',
  [
    param('channelId').isInt().withMessage('Valid channel ID is required')
  ],
  getChannelInfo
);

// GET /api/communication/channels/:channelId/messages - Get messages for a channel
router.get(
  '/channels/:channelId/messages',
  [
    param('channelId').isInt().withMessage('Valid channel ID is required')
  ],
  getChannelMessages
);

// POST /api/communication/channels/:channelId/messages - Send a message
router.post(
  '/channels/:channelId/messages',
  [
    param('channelId').isInt().withMessage('Valid channel ID is required'),
    body('messageText')
      .notEmpty()
      .withMessage('Message text is required')
      .isLength({ max: 5000 })
      .withMessage('Message text must be less than 5000 characters')
  ],
  sendMessage
);

// PUT /api/communication/channels/:channelId/read - Mark channel as read
router.put(
  '/channels/:channelId/read',
  [
    param('channelId').isInt().withMessage('Valid channel ID is required')
  ],
  markChannelAsRead
);

module.exports = router;