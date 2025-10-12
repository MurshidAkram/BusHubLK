const db = require('../config/db');

class PassengerNotification {
  static async create(notificationData, dbClient = db) {
    const {
      passenger_id = null,
      title,
      body,
      category = 'general',
      related_entity_type = null,
      related_entity_id = null,
      metadata = {},
      priority = 'normal'
    } = notificationData;

    const query = `
      INSERT INTO passenger_notifications (
        passenger_id,
        title,
        body,
        category,
        related_entity_type,
        related_entity_id,
        metadata,
        priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      RETURNING *
    `;

    const values = [
      passenger_id,
      title,
      body,
      category,
      related_entity_type,
      related_entity_id,
      JSON.stringify(metadata || {}),
      priority
    ];

    const executor = dbClient || db;
    const result = await executor.query(query, values);
    return result.rows[0];
  }

  static async createBroadcast(notificationData, dbClient = db) {
    const {
      title,
      body,
      category = 'general',
      related_entity_type = null,
      related_entity_id = null,
      metadata = {},
      priority = 'normal',
      excludePassengerIds = []
    } = notificationData;

    const exclusionArray = Array.isArray(excludePassengerIds)
      ? excludePassengerIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id))
      : excludePassengerIds != null
        ? [Number(excludePassengerIds)].filter((id) => Number.isFinite(id))
        : [];

    const query = `
      INSERT INTO passenger_notifications (
        passenger_id,
        title,
        body,
        category,
        related_entity_type,
        related_entity_id,
        metadata,
        priority
      )
      SELECT
        p.passenger_id,
        $1 AS title,
        $2 AS body,
        $3 AS category,
        $4 AS related_entity_type,
        $5 AS related_entity_id,
        $6::jsonb AS metadata,
        $7 AS priority
      FROM passengers p
      WHERE NOT (p.passenger_id = ANY($8::int[]))
      RETURNING *
    `;

    const values = [
      title,
      body,
      category,
      related_entity_type,
      related_entity_id,
      JSON.stringify(metadata || {}),
      priority,
      exclusionArray
    ];

    const executor = dbClient || db;
    const result = await executor.query(query, values);
    return result.rows;
  }

  static async findById(notificationId) {
    const query = 'SELECT * FROM passenger_notifications WHERE notification_id = $1';
    const result = await db.query(query, [notificationId]);
    return result.rows[0] || null;
  }

  static async findForPassenger(passengerId, options = {}, dbClient = db) {
    const {
      limit = 20,
      offset = 0,
      includeRead = true,
      category = null
    } = options;

    const filters = ['passenger_id = $1'];
    const values = [passengerId];
    let paramIndex = values.length;

    if (!includeRead) {
      paramIndex += 1;
      filters.push(`is_read = $${paramIndex}`);
      values.push(false);
    }

    if (category) {
      paramIndex += 1;
      filters.push(`category = $${paramIndex}`);
      values.push(category);
    }

    const query = `
      SELECT *
      FROM passenger_notifications
      WHERE ${filters.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramIndex + 1}
      OFFSET $${paramIndex + 2}
    `;

    values.push(limit);
    values.push(offset);

    const executor = dbClient || db;
    const result = await executor.query(query, values);
    return result.rows;
  }

  static async countForPassenger(passengerId, options = {}, dbClient = db) {
    const { includeRead = true, category = null } = options;
    const filters = ['passenger_id = $1'];
    const values = [passengerId];
    let paramIndex = values.length;

    if (!includeRead) {
      paramIndex += 1;
      filters.push(`is_read = $${paramIndex}`);
      values.push(false);
    }

    if (category) {
      paramIndex += 1;
      filters.push(`category = $${paramIndex}`);
      values.push(category);
    }

    const query = `
      SELECT COUNT(*) AS total
      FROM passenger_notifications
      WHERE ${filters.join(' AND ')}
    `;

    const executor = dbClient || db;
    const result = await executor.query(query, values);
    return parseInt(result.rows[0]?.total || 0, 10);
  }

  static async markAsRead(notificationId, passengerId, dbClient = db) {
    const query = `
      UPDATE passenger_notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE notification_id = $1 AND passenger_id = $2
      RETURNING *
    `;

    const executor = dbClient || db;
    const result = await executor.query(query, [notificationId, passengerId]);
    return result.rows[0] || null;
  }

  static async markAllAsRead(passengerId, dbClient = db) {
    const query = `
      UPDATE passenger_notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE passenger_id = $1 AND is_read = FALSE
      RETURNING notification_id
    `;

    const executor = dbClient || db;
    const result = await executor.query(query, [passengerId]);
    return result.rows.map((row) => row.notification_id);
  }

  static async delete(notificationId, passengerId, dbClient = db) {
    const query = `
      DELETE FROM passenger_notifications
      WHERE notification_id = $1 AND passenger_id = $2
      RETURNING notification_id
    `;

    const executor = dbClient || db;
    const result = await executor.query(query, [notificationId, passengerId]);
    return result.rows.length > 0;
  }
}

module.exports = PassengerNotification;
