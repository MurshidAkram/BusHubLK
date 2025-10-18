const pool = require('../config/db');

const VALID_SOURCE_TYPES = [
  'emergency_escalated',
  'manager_chat',
  'announcement',
  'direct_message'
];

const UNION_NOTIFICATIONS_CTE = `
  WITH union_notifications AS (
    SELECT
      'emergency_escalated'::text AS source_type,
      er.id::bigint AS source_id,
      COALESCE(er.updated_at, er.created_at, NOW()) AS created_at,
      CONCAT('Emergency escalated - ', COALESCE(b.registration_number, 'Unknown bus')) AS title,
      CONCAT(
        'Depot ',
        COALESCE(d.depot_name, 'manager'),
        ' escalated ',
        COALESCE(NULLIF(er.incident_type, ''), 'an emergency'),
        ' for RTO review.'
      ) AS message,
      COALESCE(NULLIF(er.status, ''), 'Escalated to RTO') AS status,
      COALESCE(er.bus_id, da.bus_id) AS bus_id,
      COALESCE(b.registration_number, 'Unknown bus') AS registration_number,
      er.driver_id,
      COALESCE(b.depot_id, dr.depot_id, da.depot_id) AS depot_id,
      COALESCE(d.region_id, dr.region_id) AS region_id,
      'critical'::text AS priority,
      jsonb_build_object(
        'reportId', er.id,
        'incidentType', er.incident_type,
        'depotId', COALESCE(b.depot_id, dr.depot_id, da.depot_id),
        'depotName', d.depot_name
      ) AS meta
    FROM emergency_reports er
    LEFT JOIN dailyassignment da ON er.assignment_id = da.assignment_id
    LEFT JOIN buses b ON COALESCE(er.bus_id, da.bus_id) = b.bus_id
    LEFT JOIN drivers dr ON er.driver_id = dr.driver_id
    LEFT JOIN depots d ON COALESCE(b.depot_id, dr.depot_id, da.depot_id) = d.depot_id
    WHERE er.status ILIKE '%RTO%'
      AND COALESCE(d.region_id, dr.region_id) = $2

    UNION ALL

    SELECT
      'manager_chat'::text AS source_type,
      rmc.id::bigint AS source_id,
      COALESCE(rmc.created_at, NOW()) AS created_at,
      CONCAT('Depot manager update - ', COALESCE(b.registration_number, 'Unknown bus')) AS title,
      COALESCE(NULLIF(rmc.text, ''), 'New message from depot manager') AS message,
      COALESCE(NULLIF(er.status, ''), 'Escalated to RTO') AS status,
      COALESCE(er.bus_id, da.bus_id) AS bus_id,
      COALESCE(b.registration_number, 'Unknown bus') AS registration_number,
      er.driver_id,
      COALESCE(b.depot_id, dr.depot_id, da.depot_id) AS depot_id,
      COALESCE(d.region_id, dr.region_id) AS region_id,
      'high'::text AS priority,
      jsonb_build_object(
        'reportId', er.id,
        'senderType', rmc.sender_type
      ) AS meta
    FROM rto_manager_chats rmc
    JOIN emergency_reports er ON rmc.report_id = er.id
    LEFT JOIN dailyassignment da ON er.assignment_id = da.assignment_id
    LEFT JOIN buses b ON COALESCE(er.bus_id, da.bus_id) = b.bus_id
    LEFT JOIN drivers dr ON er.driver_id = dr.driver_id
    LEFT JOIN depots d ON COALESCE(b.depot_id, dr.depot_id, da.depot_id) = d.depot_id
    WHERE rmc.sender_type IN ('depot_manager', 'manager')
      AND er.status ILIKE '%RTO%'
      AND COALESCE(d.region_id, dr.region_id) = $2

    UNION ALL

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
      $2 AS region_id,
      'medium'::text AS priority,
      jsonb_build_object(
        'channelId', m.channel_id,
        'channelName', c.channel_name,
        'senderRole', r.role_name,
        'senderName', COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), NULLIF(u.username, ''), INITCAP(REPLACE(r.role_name, '_', ' ')))
      ) AS meta
    FROM messages m
    JOIN communication_channels c ON m.channel_id = c.channel_id
    JOIN channel_participants cp ON cp.channel_id = c.channel_id AND cp.user_id = $1
    JOIN users u ON m.sender_id = u.user_id
    JOIN roles r ON u.role_id = r.role_id
    WHERE c.channel_type = 'announcement'
      AND r.role_name IN ('ceo', 'dgm_technical', 'dgm_operations', 'admin')

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
      COALESCE(dm.depot_id, de.depot_id) AS depot_id,
      COALESCE(dm.region_id, de.region_id, $2) AS region_id,
      'high'::text AS priority,
      jsonb_build_object(
        'channelId', m.channel_id,
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
    LEFT JOIN depot_managers dm ON r.role_name = 'depot_manager' AND dm.depot_manager_id = u.user_id
    LEFT JOIN depot_engineers de ON r.role_name = 'depot_engineer' AND de.depot_engineer_id = u.user_id
    WHERE c.channel_type = 'direct'
      AND m.sender_id <> $1
      AND (
        r.role_name IN ('admin', 'dgm_technical')
        OR (r.role_name = 'depot_manager' AND dm.region_id = $2)
        OR (r.role_name = 'depot_engineer' AND de.region_id = $2)
      )
      AND NOT EXISTS (
        SELECT 1
        FROM message_read_status mrs
        WHERE mrs.message_id = m.message_id
          AND mrs.user_id = $1
      )
  )
`;

const validateSourceType = (sourceType) => VALID_SOURCE_TYPES.includes(sourceType);

class RTONotificationModel {
  static async getNotifications({ userId, regionId, includeRead = false, limit = 100, offset = 0 }) {
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
        rnr.read_at,
        COALESCE(rnr.is_read, false) AS is_read
      FROM union_notifications un
      LEFT JOIN rto_notifications_read rnr
        ON rnr.user_id = $1
       AND rnr.source_type = un.source_type
       AND rnr.source_id = un.source_id
      WHERE $3::boolean OR rnr.id IS NULL
      ORDER BY un.created_at DESC
      LIMIT $4 OFFSET $5;
    `;

    const params = [userId, regionId, includeRead, limit, offset];
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getUnreadCount({ userId, regionId }) {
    const query = `
      ${UNION_NOTIFICATIONS_CTE}
      SELECT COUNT(*)::int AS count
      FROM union_notifications un
      LEFT JOIN rto_notifications_read rnr
        ON rnr.user_id = $1
       AND rnr.source_type = un.source_type
       AND rnr.source_id = un.source_id
      WHERE rnr.id IS NULL;
    `;

    const params = [userId, regionId];
    const { rows } = await pool.query(query, params);
    return rows[0]?.count || 0;
  }

  static async markAsRead({ userId, sourceType, sourceId, regionId }) {
    if (!validateSourceType(sourceType)) {
      throw new Error('Invalid source type provided');
    }

    const query = `
  INSERT INTO rto_notifications_read (user_id, source_type, source_id, region_id, is_read, read_at)
  VALUES ($1, $2, $3, $4, TRUE, NOW())
  ON CONFLICT (user_id, source_type, source_id)
  DO UPDATE SET is_read = TRUE, read_at = NOW(), region_id = EXCLUDED.region_id
  RETURNING *;
    `;

    const params = [userId, sourceType, sourceId, regionId];
    const { rows } = await pool.query(query, params);
    return rows[0];
  }

  static async markAllAsRead({ userId, regionId }) {
    const query = `
      ${UNION_NOTIFICATIONS_CTE}
      INSERT INTO rto_notifications_read (user_id, source_type, source_id, region_id, is_read, read_at)
      SELECT
        $1 AS user_id,
        un.source_type,
        un.source_id,
        $2 AS region_id,
        TRUE AS is_read,
        NOW() AS read_at
      FROM union_notifications un
      LEFT JOIN rto_notifications_read rnr
        ON rnr.user_id = $1
       AND rnr.source_type = un.source_type
       AND rnr.source_id = un.source_id
      WHERE rnr.id IS NULL
      RETURNING source_type, source_id;
    `;

    const params = [userId, regionId];
    const { rows } = await pool.query(query, params);
    return rows;
  }
}

module.exports = RTONotificationModel;
