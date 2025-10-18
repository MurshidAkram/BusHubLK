const pool = require('../config/db');

const VALID_SOURCE_TYPES = ['announcement', 'direct_message'];

const UNION_NOTIFICATIONS_CTE = `
  WITH union_notifications AS (
    SELECT
      'announcement'::text AS source_type,
      m.message_id::bigint AS source_id,
      COALESCE(m.created_at, NOW()) AS created_at,
      CONCAT(
        'Announcement - ',
        CASE
          WHEN COALESCE(u.first_name, '') <> '' OR COALESCE(u.last_name, '') <> '' THEN TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')))
          WHEN COALESCE(u.username, '') <> '' THEN u.username
          ELSE INITCAP(REPLACE(r.role_name, '_', ' '))
        END
      ) AS title,
      CASE
        WHEN m.message_text IS NULL OR TRIM(m.message_text) = '' THEN 'New announcement posted'
        WHEN LENGTH(m.message_text) > 200 THEN SUBSTRING(m.message_text FROM 1 FOR 197) || '...'
        ELSE m.message_text
      END AS message,
      'Announcement'::text AS status,
      NULL::integer AS bus_id,
      NULL::text AS registration_number,
      NULL::integer AS driver_id,
      NULL::integer AS depot_id,
      NULL::integer AS region_id,
      'medium'::text AS priority,
      jsonb_build_object(
        'channelId', m.channel_id,
        'channelName', c.channel_name,
        'senderRole', r.role_name,
        'senderName', COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), NULLIF(u.username, ''), INITCAP(REPLACE(r.role_name, '_', ' ')))
      ) AS meta
    FROM messages m
    JOIN communication_channels c ON m.channel_id = c.channel_id
    JOIN users u ON m.sender_id = u.user_id
    JOIN roles r ON u.role_id = r.role_id
    WHERE c.channel_type = 'announcement'
      AND r.role_name IN ('ceo', 'dgm_operations', 'admin')

    UNION ALL

    SELECT
      'direct_message'::text AS source_type,
      m.message_id::bigint AS source_id,
      COALESCE(m.created_at, NOW()) AS created_at,
      CONCAT(
        'Message from ',
        CASE
          WHEN COALESCE(u.first_name, '') <> '' OR COALESCE(u.last_name, '') <> '' THEN TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')))
          WHEN COALESCE(u.username, '') <> '' THEN u.username
          ELSE INITCAP(REPLACE(r.role_name, '_', ' '))
        END
      ) AS title,
      CASE
        WHEN m.message_text IS NULL OR TRIM(m.message_text) = '' THEN 'New message received'
        WHEN LENGTH(m.message_text) > 200 THEN SUBSTRING(m.message_text FROM 1 FOR 197) || '...'
        ELSE m.message_text
      END AS message,
      'New'::text AS status,
      NULL::integer AS bus_id,
      NULL::text AS registration_number,
      NULL::integer AS driver_id,
      NULL::integer AS depot_id,
      NULL::integer AS region_id,
      'high'::text AS priority,
      jsonb_build_object(
        'channelId', m.channel_id,
        'channelName', c.channel_name,
        'senderId', m.sender_id,
        'senderRole', r.role_name,
        'senderName', COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), NULLIF(u.username, ''), INITCAP(REPLACE(r.role_name, '_', ' '))),
        'channelType', c.channel_type
      ) AS meta
    FROM messages m
    JOIN communication_channels c ON m.channel_id = c.channel_id
    JOIN channel_participants cp_self ON cp_self.channel_id = c.channel_id AND cp_self.user_id = $1
    JOIN users u ON m.sender_id = u.user_id
    JOIN roles r ON u.role_id = r.role_id
    WHERE c.channel_type = 'direct'
      AND m.sender_id <> $1
      AND r.role_name IN ('admin', 'regional_tech', 'ceo')
      AND NOT EXISTS (
        SELECT 1
        FROM message_read_status mrs
        WHERE mrs.message_id = m.message_id
          AND mrs.user_id = $1
      )
  )
`;

const validateSourceType = (sourceType) => VALID_SOURCE_TYPES.includes(sourceType);

class DGMTechnicalNotificationModel {
    static async getNotifications({ userId, includeRead = false, limit = 100, offset = 0 }) {
        const query = `
      ${UNION_NOTIFICATIONS_CTE}
      SELECT
        un.source_type,
        un.source_id,
        un.created_at,
        un.title,
        un.message,
        un.status,
        un.bus_id,
        un.registration_number,
        un.driver_id,
        un.depot_id,
        un.region_id,
        un.priority,
        un.meta,
        dtnr.read_at,
        COALESCE(dtnr.is_read, false) AS is_read
      FROM union_notifications un
      LEFT JOIN dgm_technical_notifications_read dtnr
        ON dtnr.user_id = $1
       AND dtnr.source_type = un.source_type
       AND dtnr.source_id = un.source_id
      WHERE $2::boolean OR dtnr.id IS NULL
      ORDER BY un.created_at DESC
      LIMIT $3 OFFSET $4;
    `;

        const params = [userId, includeRead, limit, offset];
        const { rows } = await pool.query(query, params);
        return rows;
    }

    static async getUnreadCount({ userId }) {
        const query = `
      ${UNION_NOTIFICATIONS_CTE}
      SELECT COUNT(*)::int AS count
      FROM union_notifications un
      LEFT JOIN dgm_technical_notifications_read dtnr
        ON dtnr.user_id = $1
       AND dtnr.source_type = un.source_type
       AND dtnr.source_id = un.source_id
      WHERE dtnr.id IS NULL;
    `;

        const params = [userId];
        const { rows } = await pool.query(query, params);
        return rows[0]?.count || 0;
    }

    static async markAsRead({ userId, sourceType, sourceId, regionId = null }) {
        if (!validateSourceType(sourceType)) {
            throw new Error('Invalid source type provided');
        }

        const query = `
      INSERT INTO dgm_technical_notifications_read (user_id, source_type, source_id, region_id, is_read, read_at)
      VALUES ($1, $2, $3, $4, TRUE, NOW())
      ON CONFLICT (user_id, source_type, source_id)
      DO UPDATE SET is_read = TRUE, read_at = NOW(), region_id = EXCLUDED.region_id
      RETURNING *;
    `;

        const params = [userId, sourceType, sourceId, regionId];
        const { rows } = await pool.query(query, params);
        return rows[0];
    }

    static async markAllAsRead({ userId, regionId = null }) {
        const query = `
      ${UNION_NOTIFICATIONS_CTE}
      INSERT INTO dgm_technical_notifications_read (user_id, source_type, source_id, region_id, is_read, read_at)
      SELECT
        $1 AS user_id,
        un.source_type,
        un.source_id,
        $2 AS region_id,
        TRUE AS is_read,
        NOW() AS read_at
      FROM union_notifications un
      LEFT JOIN dgm_technical_notifications_read dtnr
        ON dtnr.user_id = $1
       AND dtnr.source_type = un.source_type
       AND dtnr.source_id = un.source_id
      WHERE dtnr.id IS NULL
      RETURNING source_type, source_id;
    `;

        const params = [userId, regionId];
        const { rows } = await pool.query(query, params);
        return rows;
    }
}

module.exports = DGMTechnicalNotificationModel;
