const Communication = require('../models/communicationModel');

// Get all channels for the authenticated user
const getUserChannels = async (req, res) => {
  try {
    const userId = req.user.userId;
    const channels = await Communication.getUserChannels(userId);
    
    res.json({
      success: true,
      channels
    });
  } catch (error) {
    console.error('Get user channels error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch channels'
    });
  }
};

// Get messages for a specific channel
const getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await Communication.getChannelMessages(channelId, userId, limit, offset);
    
    // Mark channel as read when fetching messages
    await Communication.markChannelAsRead(channelId, userId);
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get channel messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { messageText } = req.body;
    const senderId = req.user.userId;

    if (!messageText || messageText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }

    const message = await Communication.sendMessage(channelId, senderId, messageText.trim());
    
    // Emit socket event (will be handled by socket.io)
    if (req.io) {
      req.io.to(`channel_${channelId}`).emit('new_message', {
        channelId,
        message
      });
    }
    
    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message'
    });
  }
};

// Get available contacts
const getAvailableContacts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const contacts = await Communication.getAvailableContacts(userId);
    
    res.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Get available contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contacts'
    });
  }
};

// Create or get a direct channel with a contact
const createOrGetDirectChannel = async (req, res) => {
  try {
    const { contactId } = req.body;
    const userId = req.user.userId;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        error: 'Contact ID is required'
      });
    }

    const channelId = await Communication.getOrCreateDirectChannel(userId, contactId);
    const channelInfo = await Communication.getChannelInfo(channelId, userId);
    
    res.json({
      success: true,
      channel: channelInfo
    });
  } catch (error) {
    console.error('Create/get channel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create or get channel'
    });
  }
};

// Mark messages as read
const markChannelAsRead = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    await Communication.markChannelAsRead(channelId, userId);
    
    res.json({
      success: true,
      message: 'Channel marked as read'
    });
  } catch (error) {
    console.error('Mark channel as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark channel as read'
    });
  }
};

// Get channel info
const getChannelInfo = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    const channelInfo = await Communication.getChannelInfo(channelId, userId);
    
    if (!channelInfo) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found or access denied'
      });
    }
    
    res.json({
      success: true,
      channel: channelInfo
    });
  } catch (error) {
    console.error('Get channel info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch channel info'
    });
  }
};

module.exports = {
  getUserChannels,
  getChannelMessages,
  sendMessage,
  getAvailableContacts,
  createOrGetDirectChannel,
  markChannelAsRead,
  getChannelInfo
};