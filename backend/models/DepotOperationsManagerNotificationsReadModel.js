const db = require('../config/db');

class DepotOperationsManagerNotificationsReadModel {
  static async markAsRead(depot_id, manager_user_id, notification_type, notification_id) {
    await db.query(
      `INSERT INTO depot_operations_manager_notifications_read (depot_id, manager_user_id, notification_type, notification_id, is_read, read_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW())
       ON CONFLICT (depot_id, manager_user_id, notification_type, notification_id)
       DO UPDATE SET is_read = EXCLUDED.is_read, read_at = NOW()`,
      [depot_id, manager_user_id, notification_type, notification_id]
    );
  }

  static async getReadNotificationIds(depot_id, manager_user_id, notification_type) {
    const result = await db.query(
      `SELECT notification_id FROM depot_operations_manager_notifications_read
       WHERE depot_id = $1 AND manager_user_id = $2 AND notification_type = $3 AND is_read = TRUE`,
      [depot_id, manager_user_id, notification_type]
    );
    return result.rows
      .map((row) => Number(row.notification_id))
      .filter((value) => Number.isFinite(value));
  }
}

module.exports = DepotOperationsManagerNotificationsReadModel;