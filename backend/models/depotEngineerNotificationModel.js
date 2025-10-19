const pool = require('../config/db');

const VALID_SOURCE_TYPES = [
  'bus_condition_report',
  'emergency_report',
  'emergency_message',
  'inspection',
  'manager_chat',
  'announcement',
  'direct_message'
];

const UNION_NOTIFICATIONS_CTE = `
  WITH union_notifications AS (
    SELECT
      'bus_condition_report'::text AS source_type,
      bcr.report_id::bigint AS source_id,
      COALESCE(bcr.created_at, bcr.report_time, NOW()) AS created_at,
      CONCAT('Condition report • ', b.registration_number) AS title,
      COALESCE(NULLIF(bcr.description, ''), 'No description provided') AS message,
      COALESCE(NULLIF(bcr.review_status, ''), 'pending') AS status,
      bcr.bus_id,
      b.registration_number,
      bcr.driver_id,
      b.depot_id,
      d.region_id,
      'medium'::text AS priority,
      jsonb_build_object(
        'conditionStatus', bcr.condition_status,
        'reportTime', bcr.report_time,
        'reviewStatus', bcr.review_status
      ) AS meta
    FROM bus_condition_reports bcr
    JOIN buses b ON bcr.bus_id = b.bus_id
    JOIN depots d ON b.depot_id = d.depot_id
    WHERE b.depot_id = $2
      AND d.region_id = $3

    UNION ALL

    SELECT
      'emergency_report'::text AS source_type,
      er.id::bigint AS source_id,
      COALESCE(er.created_at, NOW()) AS created_at,
      CONCAT('Emergency report • ', COALESCE(b.registration_number, 'Unknown bus')) AS title,
      CONCAT('Incident type: ', COALESCE(NULLIF(er.incident_type, ''), 'Emergency'),
        CASE WHEN er.status IS NULL OR er.status = '' THEN '' ELSE ' • Status: ' || er.status END) AS message,
      COALESCE(NULLIF(er.status, ''), 'Pending') AS status,
      er.bus_id,
      COALESCE(b.registration_number, 'Unknown bus') AS registration_number,
      er.driver_id,
      COALESCE(b.depot_id, dr.depot_id) AS depot_id,
      d.region_id,
      'critical'::text AS priority,
      jsonb_build_object(
        'incidentType', er.incident_type,
        'assignmentId', er.assignment_id,
        'latitude', er.latitude,
        'longitude', er.longitude
      ) AS meta
    FROM emergency_reports er
    LEFT JOIN buses b ON er.bus_id = b.bus_id
    LEFT JOIN drivers dr ON er.driver_id = dr.driver_id
    JOIN depots d ON COALESCE(b.depot_id, dr.depot_id) = d.depot_id
    WHERE COALESCE(b.depot_id, dr.depot_id) = $2
      AND d.region_id = $3

    UNION ALL

    SELECT
      'manager_chat'::text AS source_type,
      mc.id::bigint AS source_id,
      COALESCE(mc.created_at, NOW()) AS created_at,
      CONCAT('Manager chat • ', COALESCE(b.registration_number, 'Unknown bus')) AS title,
      CONCAT('Manager response received for report #', er.id) AS message,
      COALESCE(NULLIF(er.status, ''), 'Pending') AS status,
      er.bus_id,
      COALESCE(b.registration_number, 'Unknown bus') AS registration_number,
      er.driver_id,
      COALESCE(b.depot_id, dr.depot_id) AS depot_id,
      d.region_id,
      'high'::text AS priority,
      jsonb_build_object(
        'reportId', er.id,
        'senderType', mc.sender_type
      ) AS meta
    FROM manager_chats mc
    JOIN emergency_reports er ON mc.report_id = er.id
    LEFT JOIN buses b ON er.bus_id = b.bus_id
    LEFT JOIN drivers dr ON er.driver_id = dr.driver_id
    JOIN depots d ON COALESCE(b.depot_id, dr.depot_id) = d.depot_id
    WHERE COALESCE(b.depot_id, dr.depot_id) = $2
      AND d.region_id = $3
      AND mc.sender_type = 'depot_manager'

    UNION ALL

    SELECT
      'emergency_message'::text AS source_type,
      em.id::bigint AS source_id,
      COALESCE(em.created_at, NOW()) AS created_at,
      CONCAT('Emergency message • ', COALESCE(b.registration_number, 'Unknown bus')) AS title,
      CONCAT('Driver emergency update • ', COALESCE(NULLIF(er.incident_type, ''), 'Emergency')) AS message,
      COALESCE(NULLIF(er.status, ''), 'Pending') AS status,
      er.bus_id,
      COALESCE(b.registration_number, 'Unknown bus') AS registration_number,
      er.driver_id,
      COALESCE(b.depot_id, dr.depot_id) AS depot_id,
      d.region_id,
      'high'::text AS priority,
      jsonb_build_object(
        'reportId', er.id,
        'senderType', em.sender_type
      ) AS meta
    FROM emergency_messages em
    JOIN emergency_reports er ON em.report_id = er.id
    LEFT JOIN buses b ON er.bus_id = b.bus_id
    LEFT JOIN drivers dr ON er.driver_id = dr.driver_id
    JOIN depots d ON COALESCE(b.depot_id, dr.depot_id) = d.depot_id
    WHERE COALESCE(b.depot_id, dr.depot_id) = $2
      AND d.region_id = $3

    UNION ALL

    SELECT
      'inspection'::text AS source_type,
      i.id::bigint AS source_id,
      COALESCE(i.updated_at, i.created_at, NOW()) AS created_at,
      CONCAT('Inspection • ', COALESCE(NULLIF(i.inspection_type, ''), 'General')) AS title,
      CONCAT(
        'Scheduled on ',
        COALESCE(i.date::text, 'Unknown date'),
        CASE
          WHEN i.time IS NULL OR i.time::text = '' THEN ''
          ELSE ' at ' || i.time::text
        END
      ) AS message,
      COALESCE(NULLIF(i.status, ''), 'pending') AS status,
      NULL::integer AS bus_id,
      NULL::text AS registration_number,
      i.user_id AS driver_id,
      i.depot_id,
      d.region_id,
      'medium'::text AS priority,
      jsonb_build_object(
        'inspectionType', i.inspection_type,
        'date', i.date,
        'time', i.time
      ) AS meta
    FROM inspections i
    JOIN depots d ON i.depot_id = d.depot_id
    WHERE i.depot_id = $2
      AND d.region_id = $3

    UNION ALL

    SELECT
      'announcement'::text AS source_type,
      m.message_id::bigint AS source_id,
      COALESCE(m.created_at, NOW()) AS created_at,
        CONCAT('Announcement - ',
        CASE r.role_name
          WHEN 'ceo' THEN 'CEO'
          WHEN 'dgm_technical' THEN 'DGM Technical'
          WHEN 'dgm_operations' THEN 'DGM Operations'
          ELSE INITCAP(REPLACE(r.role_name, '_', ' '))
        END
      ) AS title,
      CASE
        WHEN m.message_text IS NULL OR TRIM(m.message_text) = '' THEN 'New announcement posted'
        WHEN LENGTH(m.message_text) > 120 THEN SUBSTRING(m.message_text FROM 1 FOR 117) || '...'
        ELSE m.message_text
      END AS message,
      'New'::text AS status,
      NULL::integer AS bus_id,
      NULL::text AS registration_number,
      NULL::integer AS driver_id,
      $2 AS depot_id,
      $3 AS region_id,
      'medium'::text AS priority,
      jsonb_build_object(
        'channelId', m.channel_id,
        'channelName', c.channel_name,
        'senderRole', r.role_name,
        'senderId', m.sender_id
      ) AS meta
    FROM messages m
    JOIN communication_channels c ON m.channel_id = c.channel_id
    JOIN channel_participants cp ON cp.channel_id = c.channel_id
    JOIN users u ON m.sender_id = u.user_id
    JOIN roles r ON u.role_id = r.role_id
    WHERE c.channel_type = 'announcement'
      AND cp.user_id = $1
      AND r.role_name IN ('ceo', 'dgm_technical', 'dgm_operations')

    UNION ALL

    SELECT
      'direct_message'::text AS source_type,
      m.message_id::bigint AS source_id,
      COALESCE(m.created_at, NOW()) AS created_at,
      CONCAT('Message - ',
        CASE
          WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL THEN
            TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')))
          ELSE COALESCE(u.username, 'Unknown sender')
        END
      ) AS title,
      CASE
        WHEN m.message_text IS NULL OR TRIM(m.message_text) = '' THEN 'New reply received'
        WHEN LENGTH(m.message_text) > 120 THEN SUBSTRING(m.message_text FROM 1 FOR 117) || '...'
        ELSE m.message_text
      END AS message,
      'New'::text AS status,
      NULL::integer AS bus_id,
      NULL::text AS registration_number,
      NULL::integer AS driver_id,
      $2 AS depot_id,
      $3 AS region_id,
      'medium'::text AS priority,
      jsonb_build_object(
        'channelId', m.channel_id,
        'senderId', m.sender_id,
        'senderRole', r.role_name,
        'channelType', c.channel_type
      ) AS meta
    FROM messages m
    JOIN communication_channels c ON m.channel_id = c.channel_id
    JOIN channel_participants cp ON cp.channel_id = c.channel_id AND cp.user_id = $1
    JOIN users u ON m.sender_id = u.user_id
    JOIN roles r ON u.role_id = r.role_id
    WHERE c.channel_type = 'direct'
      AND m.sender_id <> $1
  AND r.role_name IN ('depot_manager', 'depot_operations', 'regional_tech', 'admin')
      AND NOT EXISTS (
        SELECT 1
        FROM message_read_status mrs
        WHERE mrs.message_id = m.message_id
          AND mrs.user_id = $1
      )
  )
`;

const validateSourceType = (sourceType) => {
  return VALID_SOURCE_TYPES.includes(sourceType);
};

class DepotEngineerNotificationModel {
  static async getNotifications({ userId, depotId, regionId, includeRead = false, limit = 100, offset = 0 }) {
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
  dir.read_at,
  COALESCE(dir.is_read, false) AS is_read
      FROM union_notifications un
      LEFT JOIN depot_engineer_notifications_read dir
        ON dir.user_id = $1
       AND dir.source_type = un.source_type
       AND dir.source_id = un.source_id
      WHERE $4::boolean OR dir.id IS NULL
      ORDER BY
        CASE
          WHEN un.source_type = 'emergency_report' THEN 0
          WHEN un.source_type = 'emergency_message' THEN 1
          WHEN un.source_type = 'manager_chat' THEN 2
          WHEN un.source_type = 'direct_message' THEN 3
          ELSE 4
        END,
        un.created_at DESC
      LIMIT $5 OFFSET $6;
    `;

    const params = [userId, depotId, regionId, includeRead, limit, offset];
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getUnreadCount({ userId, depotId, regionId }) {
    const query = `
      ${UNION_NOTIFICATIONS_CTE}
      SELECT COUNT(*)::int AS count
      FROM union_notifications un
      LEFT JOIN depot_engineer_notifications_read dir
        ON dir.user_id = $1
       AND dir.source_type = un.source_type
       AND dir.source_id = un.source_id
      WHERE dir.id IS NULL;
    `;

    const params = [userId, depotId, regionId];
    const { rows } = await pool.query(query, params);
    return rows[0]?.count || 0;
  }

  static async markAsRead({ userId, sourceType, sourceId, depotId, regionId }) {
    if (!validateSourceType(sourceType)) {
      throw new Error('Invalid source type provided');
    }

    const query = `
  INSERT INTO depot_engineer_notifications_read (user_id, source_type, source_id, depot_id, region_id, is_read, read_at)
  VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
  ON CONFLICT (user_id, source_type, source_id)
  DO UPDATE SET is_read = TRUE, read_at = NOW(), depot_id = EXCLUDED.depot_id, region_id = EXCLUDED.region_id
      RETURNING *;
    `;

    const params = [userId, sourceType, sourceId, depotId, regionId];
    const { rows } = await pool.query(query, params);

    if (sourceType === 'direct_message') {
      await pool.query(
        `INSERT INTO message_read_status (message_id, user_id, read_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (message_id, user_id)
           DO UPDATE SET read_at = NOW();`,
        [sourceId, userId]
      );
    }

    return rows[0];
  }

  static async markAllAsRead({ userId, depotId, regionId }) {
    const query = `
      ${UNION_NOTIFICATIONS_CTE}
      INSERT INTO depot_engineer_notifications_read (user_id, source_type, source_id, depot_id, region_id, is_read, read_at)
      SELECT
        $1 AS user_id,
        un.source_type,
        un.source_id,
        $2 AS depot_id,
        $3 AS region_id,
        TRUE AS is_read,
        NOW() AS read_at
      FROM union_notifications un
      LEFT JOIN depot_engineer_notifications_read dir
        ON dir.user_id = $1
       AND dir.source_type = un.source_type
       AND dir.source_id = un.source_id
      WHERE dir.id IS NULL
      RETURNING source_type, source_id;
    `;

    const params = [userId, depotId, regionId];
    const { rows } = await pool.query(query, params);

    const directMessageIds = rows
      .filter((row) => row.source_type === 'direct_message')
      .map((row) => Number(row.source_id))
      .filter((id) => Number.isFinite(id));

    if (directMessageIds.length > 0) {
      await pool.query(
        `INSERT INTO message_read_status (message_id, user_id, read_at)
                 SELECT UNNEST($1::bigint[]), $2, NOW()
                 ON CONFLICT (message_id, user_id)
                 DO UPDATE SET read_at = NOW();`,
        [directMessageIds, userId]
      );
    }

    return rows;
  }
}

module.exports = DepotEngineerNotificationModel;
