const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middlewares/authMiddleware');

// Placeholder notification routes for roles that are not yet wired to a dedicated
// notification service. These endpoints keep the API surface stable so the
// clients receive a predictable response instead of a server start failure.
// When a full notification pipeline is available, replace these handlers with
// real implementations.

router.get('/', authenticateJWT, (req, res) => {
  res.status(200).json({
    success: true,
    notifications: [],
    message: 'Notification feed is not yet implemented for this role.'
  });
});

router.get('/unread-count', authenticateJWT, (req, res) => {
  res.status(200).json({
    success: true,
    unreadCount: 0
  });
});

module.exports = router;
