const Notification = require('../models/notificationModel');

class NotificationController {
  // Get notifications for the current user
  static async getNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const notifications = await Notification.getByUserId(userId);

      res.status(200).json({
        success: true,
        notifications: notifications
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications'
      });
    }
  }

  // Get notifications specifically for depot engineers
  static async getDepotEngineerNotifications(req, res) {
    try {
      const userId = req.user.userId;
      
      // Verify user is a depot engineer
      if (req.user.role !== 'depot_engineer') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only depot engineers can access this endpoint.'
        });
      }

      const notifications = await Notification.getForDepotEngineer(userId);

      res.status(200).json({
        success: true,
        notifications: notifications
      });
    } catch (error) {
      console.error('Error fetching depot engineer notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications'
      });
    }
  }

  // Mark a notification as read
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const notification = await Notification.markAsRead(id, userId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        notification: notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const notifications = await Notification.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        updatedCount: notifications.length
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read'
      });
    }
  }

  // Delete a notification
  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const notification = await Notification.delete(id, userId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }
  }

  // Get unread notification count
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;
      const count = await Notification.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        unreadCount: count
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count'
      });
    }
  }

  // Create a new notification (admin/internal use)
  static async createNotification(req, res) {
    try {
      const { user_id, title, message, type, inspection_id, assigned_by } = req.body;

      if (!user_id || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'User ID, title, and message are required'
        });
      }

      const notification = await Notification.create({
        user_id,
        title,
        message,
        type,
        inspection_id,
        assigned_by
      });

      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        notification: notification
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification'
      });
    }
  }
}

module.exports = NotificationController;