const PassengerNotification = require('../models/PassengerNotification');
const db = require('../config/db');

const mapRowToNotification = (row) => {
  if (!row) {
    return null;
  }

  let metadata = row.metadata || {};
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (error) {
      metadata = {};
    }
  }

  return {
    id: row.notification_id,
    passengerId: row.passenger_id,
    title: row.title,
    body: row.body,
    category: row.category,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    metadata,
    priority: row.priority,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at
  };
};

const getPagination = ({ page, limit, total }) => {
  const currentPage = Number(page) || 1;
  const pageSize = Number(limit) || 20;
  const totalItems = Number(total) || 0;
  const totalPages = pageSize === 0 ? 0 : Math.ceil(totalItems / pageSize);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasMore: currentPage < totalPages
  };
};

const passengerNotificationService = {
  async createNotification(notificationData) {
    const row = await PassengerNotification.create(notificationData);
    return mapRowToNotification(row);
  },

  async createBroadcastNotification(notificationData) {
    const rows = await PassengerNotification.createBroadcast(notificationData);
    return rows.map(mapRowToNotification);
  },

  async createNotificationsForPassengers(passengerIds, notificationData) {
    if (!Array.isArray(passengerIds) || passengerIds.length === 0) {
      return [];
    }

    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const inserted = [];
      for (const passengerId of passengerIds) {
        const row = await PassengerNotification.create({
          ...notificationData,
          passenger_id: passengerId
        }, client);
        inserted.push(mapRowToNotification(row));
      }

      await client.query('COMMIT');
      return inserted;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getNotificationsForPassenger(passengerId, options = {}) {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 20;
    const offset = (page - 1) * limit;
    const includeRead = options.includeRead !== undefined ? options.includeRead : true;
    const category = options.category || null;
    const client = await db.connect();

    try {
      const rows = await PassengerNotification.findForPassenger(
        passengerId,
        {
          limit,
          offset,
          includeRead,
          category
        },
        client
      );

      const total = await PassengerNotification.countForPassenger(
        passengerId,
        {
          includeRead,
          category
        },
        client
      );

      return {
        notifications: rows.map(mapRowToNotification),
        pagination: getPagination({ page, limit, total })
      };
    } catch (error) {
      if (error?.message?.includes('Connection terminated unexpectedly')) {
        console.warn('Retrying passenger notifications after connection drop');
        const retryClient = await db.connect();
        try {
          const rows = await PassengerNotification.findForPassenger(
            passengerId,
            {
              limit,
              offset,
              includeRead,
              category
            },
            retryClient
          );

          const total = await PassengerNotification.countForPassenger(
            passengerId,
            {
              includeRead,
              category
            },
            retryClient
          );

          return {
            notifications: rows.map(mapRowToNotification),
            pagination: getPagination({ page, limit, total })
          };
        } finally {
          retryClient.release();
        }
      }

      throw error;
    } finally {
      client.release();
    }
  },

  async markNotificationAsRead(notificationId, passengerId) {
    const client = await db.connect();
    try {
      const row = await PassengerNotification.markAsRead(notificationId, passengerId, client);
      return mapRowToNotification(row);
    } finally {
      client.release();
    }
  },

  async markAllNotificationsAsRead(passengerId) {
    const client = await db.connect();
    try {
      return PassengerNotification.markAllAsRead(passengerId, client);
    } finally {
      client.release();
    }
  },

  async deleteNotification(notificationId, passengerId) {
    const client = await db.connect();
    try {
      return PassengerNotification.delete(notificationId, passengerId, client);
    } finally {
      client.release();
    }
  },

  async getUnreadCount(passengerId) {
    const client = await db.connect();
    try {
      const count = await PassengerNotification.countForPassenger(
        passengerId,
        {
          includeRead: false
        },
        client
      );
      return count;
    } finally {
      client.release();
    }
  }
};

module.exports = passengerNotificationService;
