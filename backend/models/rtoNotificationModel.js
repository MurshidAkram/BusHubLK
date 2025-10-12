const pool = require('../config/db');

const VALID_SOURCE_TYPES = [
    'emergency_escalated',
    'manager_chat'
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
