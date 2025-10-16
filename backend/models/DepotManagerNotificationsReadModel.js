const db = require('../config/db');

class DepotManagerNotificationsReadModel {
  static async markAsRead(depot_id, manager_user_id, notification_type, notification_id) {
    await db.query(
      `INSERT INTO depot_manager_notifications_read (depot_id, manager_user_id, notification_type, notification_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (depot_id, manager_user_id, notification_type, notification_id) DO NOTHING`,
      [depot_id, manager_user_id, notification_type, notification_id]
    );
  }

  static async getReadNotificationIds(depot_id, manager_user_id, notification_type) {
    const result = await db.query(
      `SELECT notification_id FROM depot_manager_notifications_read
       WHERE depot_id = $1 AND manager_user_id = $2 AND notification_type = $3`,
      [depot_id, manager_user_id, notification_type]
    );
    return result.rows.map(row => row.notification_id);
  }
}

module.exports = DepotManagerNotificationsReadModel;