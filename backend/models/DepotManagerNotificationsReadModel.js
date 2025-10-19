const pool = require('../config/db');

const VALID_SOURCE_TYPES = [
  'emergency_report',
  'manager_chat',
  'rto_manager_chat',
  'announcement',
  'direct_message'
];

const UNION_NOTIFICATIONS_CTE = `
	WITH union_notifications AS (
		SELECT
			'emergency_report'::text AS source_type,
			er.id::bigint AS source_id,
			COALESCE(er.updated_at, er.created_at, NOW()) AS created_at,
			CONCAT('Emergency escalated • ', COALESCE(b.registration_number, 'Unknown bus')) AS title,
			CONCAT(
				'Incident: ',
				COALESCE(NULLIF(er.incident_type, ''), 'Emergency'),
				CASE
					WHEN COALESCE(er.status, '') = '' THEN ''
					ELSE ' • Status: ' || er.status
				END
			) AS message,
			COALESCE(NULLIF(er.status, ''), 'Pending') AS status,
			COALESCE(er.bus_id, da.bus_id) AS bus_id,
			COALESCE(b.registration_number, 'Unknown bus') AS registration_number,
			er.driver_id,
			d.depot_id,
			d.region_id,
			'critical'::text AS priority,
			jsonb_build_object(
				'reportId', er.id,
				'incidentType', er.incident_type,
				'status', er.status
			) AS meta
		FROM emergency_reports er
		LEFT JOIN dailyassignment da ON er.assignment_id = da.assignment_id
		LEFT JOIN buses b ON COALESCE(er.bus_id, da.bus_id) = b.bus_id
		LEFT JOIN drivers dr ON er.driver_id = dr.driver_id
		LEFT JOIN depots d ON COALESCE(b.depot_id, dr.depot_id, da.depot_id) = d.depot_id
		WHERE d.depot_id = $2
			AND LOWER(COALESCE(er.status, '')) IN ('escalated to depot manager', 'escalated to rto')

		UNION ALL

		SELECT
			'manager_chat'::text AS source_type,
			mc.id::bigint AS source_id,
			COALESCE(mc.created_at, NOW()) AS created_at,
			CONCAT('Depot engineer update • ', COALESCE(b.registration_number, 'Unknown bus')) AS title,
			COALESCE(NULLIF(mc.text, ''), 'New message from depot engineer') AS message,
			COALESCE(NULLIF(er.status, ''), 'Pending') AS status,
			COALESCE(er.bus_id, da.bus_id) AS bus_id,
			COALESCE(b.registration_number, 'Unknown bus') AS registration_number,
			er.driver_id,
			d.depot_id,
			d.region_id,
			'high'::text AS priority,
			jsonb_build_object(
				'reportId', er.id,
				'senderType', mc.sender_type
			) AS meta
		FROM manager_chats mc
		JOIN emergency_reports er ON mc.report_id = er.id
		LEFT JOIN dailyassignment da ON er.assignment_id = da.assignment_id
		LEFT JOIN buses b ON COALESCE(er.bus_id, da.bus_id) = b.bus_id
		LEFT JOIN drivers dr ON er.driver_id = dr.driver_id
		LEFT JOIN depots d ON COALESCE(b.depot_id, dr.depot_id, da.depot_id) = d.depot_id
		WHERE d.depot_id = $2
			AND mc.sender_type <> 'depot_manager'

		UNION ALL

		SELECT
			'rto_manager_chat'::text AS source_type,
			rmc.id::bigint AS source_id,
			COALESCE(rmc.created_at, NOW()) AS created_at,
			CONCAT('RTO response • ', COALESCE(b.registration_number, 'Unknown bus')) AS title,
			COALESCE(NULLIF(rmc.text, ''), 'New message from RTO or DGM') AS message,
			COALESCE(NULLIF(er.status, ''), 'Pending') AS status,
			COALESCE(er.bus_id, da.bus_id) AS bus_id,
			COALESCE(b.registration_number, 'Unknown bus') AS registration_number,
			er.driver_id,
			d.depot_id,
			d.region_id,
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
		WHERE d.depot_id = $2
			AND rmc.sender_type <> 'depot_manager'

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
			$2 AS depot_id,
			$3 AS region_id,
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
		LEFT JOIN depot_operation_managers dom ON r.role_name = 'depot_operations' AND dom.depot_op_manager_id = u.user_id
		LEFT JOIN depot_engineers den ON r.role_name = 'depot_engineer' AND den.depot_engineer_id = u.user_id
		LEFT JOIN regional_operations_officers roo ON r.role_name = 'regional_operations' AND roo.roo_id = u.user_id
		LEFT JOIN regional_technical_officers rto ON r.role_name = 'regional_tech' AND rto.rto_id = u.user_id
		WHERE c.channel_type = 'announcement'
			AND (
				r.role_name IN ('ceo', 'dgm_operations', 'dgm_technical', 'admin')
				OR (r.role_name = 'regional_operations' AND roo.region_id = $3)
				OR (r.role_name = 'regional_tech' AND rto.region_id = $3)
				OR (r.role_name = 'depot_operations' AND dom.depot_id = $2)
				OR (r.role_name = 'depot_engineer' AND den.depot_id = $2)
			)

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
			$2 AS depot_id,
			$3 AS region_id,
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
		LEFT JOIN depot_operation_managers dom ON r.role_name = 'depot_operations' AND dom.depot_op_manager_id = u.user_id
		LEFT JOIN depot_engineers den ON r.role_name = 'depot_engineer' AND den.depot_engineer_id = u.user_id
		LEFT JOIN regional_operations_officers roo ON r.role_name = 'regional_operations' AND roo.roo_id = u.user_id
		LEFT JOIN regional_technical_officers rto ON r.role_name = 'regional_tech' AND rto.rto_id = u.user_id
		WHERE c.channel_type = 'direct'
			AND m.sender_id <> $1
			AND (
				r.role_name IN ('ceo', 'dgm_operations', 'dgm_technical', 'admin')
				OR (r.role_name = 'regional_operations' AND roo.region_id = $3)
				OR (r.role_name = 'regional_tech' AND rto.region_id = $3)
				OR (r.role_name = 'depot_operations' AND dom.depot_id = $2)
				OR (r.role_name = 'depot_engineer' AND den.depot_id = $2)
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

class DepotManagerNotificationModel {
  static async getNotifications({ userId, depotId, regionId, includeRead = false, limit = 100, offset = 0 }) {
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), 200) : 100;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

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
					dmnr.read_at,
					(dmnr.id IS NOT NULL) AS is_read
			FROM union_notifications un
			LEFT JOIN depot_manager_notifications_read dmnr
						ON dmnr.manager_user_id = $1
					 AND dmnr.notification_type = un.source_type
					 AND dmnr.notification_id = un.source_id
			WHERE $4::boolean OR dmnr.id IS NULL
			ORDER BY
				CASE
					WHEN un.source_type = 'emergency_report' THEN 0
					WHEN un.source_type = 'rto_manager_chat' THEN 1
					WHEN un.source_type = 'manager_chat' THEN 2
					WHEN un.source_type = 'direct_message' THEN 3
					ELSE 4
				END,
				un.created_at DESC
			LIMIT $5 OFFSET $6;
		`;

    const params = [userId, depotId, regionId, includeRead, safeLimit, safeOffset];
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getUnreadCount({ userId, depotId, regionId }) {
    const query = `
			${UNION_NOTIFICATIONS_CTE}
			SELECT COUNT(*)::int AS count
			FROM union_notifications un
					LEFT JOIN depot_manager_notifications_read dmnr
						ON dmnr.manager_user_id = $1
					 AND dmnr.notification_type = un.source_type
					 AND dmnr.notification_id = un.source_id
			WHERE dmnr.id IS NULL;
		`;

    const params = [userId, depotId, regionId];
    const { rows } = await pool.query(query, params);
    return rows[0]?.count || 0;
  }

  static async markAsRead({ userId, sourceType, sourceId, depotId }) {
    if (!validateSourceType(sourceType)) {
      const error = new Error('Invalid source type provided');
      error.statusCode = 400;
      throw error;
    }

    const query = `
									INSERT INTO depot_manager_notifications_read (depot_id, manager_user_id, notification_type, notification_id, read_at)
									VALUES ($4, $1, $2, $3, NOW())
									ON CONFLICT (depot_id, manager_user_id, notification_type, notification_id)
									DO UPDATE SET
										read_at = NOW()
			RETURNING *;
		`;

    const params = [userId, sourceType, sourceId, depotId];
    const { rows } = await pool.query(query, params);
    return rows[0];
  }

  static async markAllAsRead({ userId, depotId, regionId }) {
    const query = `
			${UNION_NOTIFICATIONS_CTE}
									INSERT INTO depot_manager_notifications_read (depot_id, manager_user_id, notification_type, notification_id, read_at)
			SELECT
								$2 AS depot_id,
								$1 AS manager_user_id,
								un.source_type,
								un.source_id,
										NOW() AS read_at
			FROM union_notifications un
			LEFT JOIN depot_manager_notifications_read dmnr
						ON dmnr.manager_user_id = $1
					 AND dmnr.notification_type = un.source_type
					 AND dmnr.notification_id = un.source_id
			WHERE dmnr.id IS NULL
					RETURNING notification_type AS source_type, notification_id AS source_id;
		`;

    const params = [userId, depotId, regionId];
    const { rows } = await pool.query(query, params);
    return rows;
  }
}

module.exports = DepotManagerNotificationModel;
