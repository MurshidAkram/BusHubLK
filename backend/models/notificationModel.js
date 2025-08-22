const pool = require('../config/db');

class Notification {
  // Create a new notification
  static async create(notificationData) {
    const {
      user_id,
      title,
      message,
      type = 'info',
      inspection_id = null,
      assigned_by = null
    } = notificationData;

    const query = `
      INSERT INTO notifications (user_id, title, message, type, inspection_id, assigned_by, read, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [user_id, title, message, type, inspection_id, assigned_by]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get notifications for a specific user
  static async getByUserId(userId) {
    const query = `
      SELECT 
        n.*,
        i.inspection_type
      FROM notifications n
      LEFT JOIN inspections i ON n.inspection_id = i.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get notifications for depot engineer (specific to their depot)
  static async getForDepotEngineer(userId) {
    const query = `
      SELECT 
        n.*,
        i.inspection_type
      FROM notifications n
      LEFT JOIN inspections i ON n.inspection_id = i.id
      WHERE n.user_id = $1 
        AND (n.type = 'inspection' OR n.type = 'urgent' OR n.type = 'info')
      ORDER BY n.created_at DESC
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    const query = `
      UPDATE notifications 
      SET read = true, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [notificationId, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET read = true, updated_at = NOW()
      WHERE user_id = $1 AND read = false
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Delete notification
  static async delete(notificationId, userId) {
    const query = `
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [notificationId, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get unread count for user
  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1 AND read = false
    `;

    try {
      const result = await pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Create notification when inspection is assigned
  static async createInspectionNotification(inspectionData, assignedToUserId, assignedByUserId) {
    const title = 'New Inspection Assigned';
    const message = `You have been assigned a new ${inspectionData.inspection_type} inspection scheduled for ${new Date(inspectionData.date).toLocaleDateString()}.`;
    
    return await this.create({
      user_id: assignedToUserId,
      title: title,
      message: message,
      type: 'inspection',
      inspection_id: inspectionData.id,
      assigned_by: assignedByUserId
    });
  }
}

module.exports = Notification;
