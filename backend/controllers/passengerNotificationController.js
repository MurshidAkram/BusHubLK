const passengerNotificationService = require('../services/passengerNotificationService');

const getPassengerIdFromRequest = (req) => {
  if (!req.user || !req.user.userId) {
    return null;
  }
  return req.user.userId;
};

exports.getNotifications = async (req, res) => {
  try {
    const passengerId = getPassengerIdFromRequest(req);

    if (!passengerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = 1, limit = 20, includeRead = 'true', category } = req.query;

    const includeReadFlag = includeRead === 'true' || includeRead === true;

    const result = await passengerNotificationService.getNotificationsForPassenger(passengerId, {
      page: Number(page),
      limit: Number(limit),
      includeRead: includeReadFlag,
      category: category || null
    });

    return res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const passengerId = getPassengerIdFromRequest(req);

    if (!passengerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const unreadCount = await passengerNotificationService.getUnreadCount(passengerId);

    return res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const passengerId = getPassengerIdFromRequest(req);

    if (!passengerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { notificationId } = req.params;

    const updated = await passengerNotificationService.markNotificationAsRead(notificationId, passengerId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.json({
      success: true,
      message: 'Notification marked as read',
      data: updated
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const passengerId = getPassengerIdFromRequest(req);

    if (!passengerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const updatedIds = await passengerNotificationService.markAllNotificationsAsRead(passengerId);

    return res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { updatedIds }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const passengerId = getPassengerIdFromRequest(req);

    if (!passengerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { notificationId } = req.params;

    const deleted = await passengerNotificationService.deleteNotification(notificationId, passengerId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};
