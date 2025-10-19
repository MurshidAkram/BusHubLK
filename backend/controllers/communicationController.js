const Communication = require('../models/communicationModel');
const notifySmsService = require('../services/notifySmsService');

const maybeBroadcastNotifyAnnouncement = async ({ channelId, senderId, messageText }) => {
  if (!notifySmsService.hasNotifyCredentials) {
    console.warn('Notify.lk SMS: credentials missing, skipping broadcast.');
    return;
  }

  try {
    const channelInfo = await Communication.getChannelInfo(channelId, senderId);

    if (!channelInfo) {
      console.warn(`Notify.lk SMS: channel ${channelId} not found or inaccessible for sender ${senderId}.`);
      return;
    }

    const creatorParticipant = Array.isArray(channelInfo.participants)
      ? channelInfo.participants.find((participant) => participant.user_id === channelInfo.created_by)
      : null;

    const creatorRole = creatorParticipant?.role;

    const shouldBroadcast = notifySmsService.shouldTriggerCeoAnnouncementBroadcast({
      channelId,
      senderId,
      channelCreatorId: channelInfo.created_by,
      creatorRole
    });

    if (!shouldBroadcast) {
      console.info(
        `Notify.lk SMS: broadcast skipped (channelId=${channelId}, senderId=${senderId}, creatorId=${channelInfo.created_by}, role=${creatorRole}).`
      );
      return;
    }

    const announcementMessage = channelInfo.channel_name
      ? `${channelInfo.channel_name}: ${messageText}`
      : `CEO Announcement: ${messageText}`;

    const result = await notifySmsService.sendSmsToActivePassengers({
      message: announcementMessage,
      channelId,
      senderId
    });

    if (!result || result.requested === 0) {
      console.warn('Notify.lk broadcast executed but no valid passenger phone numbers were found.');
    }
  } catch (error) {
    const details = error?.response?.data || error.message;
    console.error('Failed to send Notify.lk announcement broadcast:', details);
  }
};

// Get all channels for the authenticated user
const getUserChannels = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`📡 getUserChannels called for userId: ${userId}`);
    
    const channels = await Communication.getUserChannels(userId);
    
    console.log(`✅ Found ${channels.length} channels for user ${userId}`);
    console.log('Channel details:', JSON.stringify(channels.map(ch => ({
      id: ch.channel_id,
      type: ch.channel_type,
      name: ch.channel_name,
      participants: ch.participants?.length || 0,
      unread: ch.unread_count
    })), null, 2));
    
    res.json({
      success: true,
      channels
    });
  } catch (error) {
    console.error('❌ Get user channels error:', error);
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

    const trimmedMessage = messageText.trim();

    const message = await Communication.sendMessage(channelId, senderId, trimmedMessage);

    await maybeBroadcastNotifyAnnouncement({
      channelId,
      senderId,
      messageText: trimmedMessage
    });
    
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

// Get regions list
const getRegions = async (req, res) => {
  try {
    const regions = await Communication.getRegions();
    res.json({
      success: true,
      regions
    });
  } catch (error) {
    console.error('Get regions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch regions'
    });
  }
};

// Get depots list (optionally filtered by region)
const getDepots = async (req, res) => {
  try {
    const { regionId } = req.query;
    const depots = await Communication.getDepots(regionId ? parseInt(regionId) : null);
    res.json({
      success: true,
      depots
    });
  } catch (error) {
    console.error('Get depots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch depots'
    });
  }
};

// Get available contacts with filters (for DGM)
const getAvailableContactsFiltered = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { regionId } = req.query;
    
    console.log(`📡 getAvailableContacts called for userId: ${userId}, regionId: ${regionId || 'all'}`);
    
    const filters = {};
    if (regionId) filters.regionId = parseInt(regionId);
    
    const contacts = await Communication.getAvailableContacts(userId, filters);
    
    console.log(`✅ Found ${contacts.length} contacts for user ${userId}`);
    if (contacts.length > 0) {
      console.log('Sample contacts:', contacts.slice(0, 3).map(c => ({ name: c.name, role: c.role })));
    }
    
    res.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('❌ Get available contacts error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contacts'
    });
  }
};

// Create announcement channel
const createAnnouncementChannel = async (req, res) => {
  try {
    const { targetType, targetId, channelName, initialMessage } = req.body;
    const creatorId = req.user.userId;

    if (!['region', 'depot'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target type. Must be "region" or "depot"'
      });
    }

    if (!targetId || !channelName) {
      return res.status(400).json({
        success: false,
        error: 'Target ID and channel name are required'
      });
    }

    // Create the announcement channel
    const channelId = await Communication.createAnnouncementChannel(
      creatorId,
      targetType,
      targetId,
      channelName
    );

    // Send initial message if provided
    if (initialMessage && initialMessage.trim()) {
      const trimmedInitialMessage = initialMessage.trim();
      await Communication.sendMessage(channelId, creatorId, trimmedInitialMessage);
      await maybeBroadcastNotifyAnnouncement({
        channelId,
        senderId: creatorId,
        messageText: trimmedInitialMessage
      });
    }

    // Get channel info
    const channelInfo = await Communication.getChannelInfo(channelId, creatorId);

    res.status(201).json({
      success: true,
      channel: channelInfo
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create announcement'
    });
  }
};

module.exports = {
  getUserChannels,
  getChannelMessages,
  sendMessage,
  getAvailableContacts: getAvailableContactsFiltered, // Updated
  createOrGetDirectChannel,
  markChannelAsRead,
  getChannelInfo,
  getRegions,
  getDepots,
  createAnnouncementChannel
};