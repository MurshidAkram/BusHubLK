const db = require('../config/db');
const DepotOperationsManagerNotificationsReadModel = require('../models/DepotOperationsManagerNotificationsReadModel');

const VALID_NOTIFICATION_TYPES = new Set(['complaint', 'lost_found', 'announcement', 'direct_message']);

const ROLE_LABELS = {
  ceo: 'CEO',
  dgm_technical: 'DGM Technical',
  dgm_operations: 'DGM Operations',
  depot_manager: 'Depot Manager',
  depot_engineer: 'Depot Engineer',
  depot_operations: 'Depot Operations Manager',
  regional_operations: 'Regional Operations Officer',
  admin: 'Administrator'
};

const PRIORITY_ORDER = {
  direct_message: 0,
  announcement: 1,
  complaint: 2,
  lost_found: 3
};

const formatDisplayName = (firstName, lastName, fallback) => {
  const combined = `${firstName || ''} ${lastName || ''}`.trim();
  if (combined.length > 0) {
    return combined;
  }
  return fallback || 'Unknown';
};

const toTitleCase = (value = '') =>
  value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const resolveRoleLabel = (roleName) => ROLE_LABELS[roleName] || toTitleCase(roleName);

const getDepotNotifications = async (req, res) => {
  try {
    const depotId = Number.parseInt(req.params.depot_id, 10);
    const managerUserId = req.user.userId;

    if (!Number.isFinite(depotId)) {
      return res.status(400).json({ success: false, error: 'Invalid depot id provided' });
    }

    const managerInfoResult = await db.query(
      `SELECT depot_id, region_id
         FROM depot_operation_managers
        WHERE depot_op_manager_id = $1
        LIMIT 1`,
      [managerUserId]
    );

    if (managerInfoResult.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Depot operations manager not found' });
    }

    const managerInfo = managerInfoResult.rows[0];

    if (managerInfo.depot_id !== depotId) {
      return res.status(403).json({ success: false, error: 'Access denied for the requested depot' });
    }

    const regionId = managerInfo.region_id;

    const [readComplaintIds, readLostFoundIds, readAnnouncementIds, readDirectMessageIds] = await Promise.all([
      DepotOperationsManagerNotificationsReadModel.getReadNotificationIds(depotId, managerUserId, 'complaint'),
      DepotOperationsManagerNotificationsReadModel.getReadNotificationIds(depotId, managerUserId, 'lost_found'),
      DepotOperationsManagerNotificationsReadModel.getReadNotificationIds(depotId, managerUserId, 'announcement'),
      DepotOperationsManagerNotificationsReadModel.getReadNotificationIds(depotId, managerUserId, 'direct_message')
    ]);

    const complaintsPromise = db.query(
      `SELECT c.id,
              c.incident_date,
              c.incident_time,
              c.route_number,
              c.bus_number,
              c.description,
              c.priority,
              c.complaint_type,
              c.created_at,
              u.first_name,
              u.last_name,
              u.phone
         FROM complaints c
         JOIN users u ON c.user_id = u.user_id
        WHERE NOT c.id = ANY($1::int[])
        ORDER BY c.created_at DESC
        LIMIT 20`,
      [readComplaintIds]
    );

    const lostFoundPromise = db.query(
      `SELECT l.report_id,
              l.incident_date,
              l.incident_time,
              l.route_number,
              l.item_description,
              l.item_category,
              l.contact_phone,
              l.created_at,
              u.first_name,
              u.last_name
         FROM lost_found_reports l
         JOIN users u ON l.passenger_id = u.user_id
        WHERE l.handed_to_depot_id = $1
          AND NOT l.report_id = ANY($2::int[])
        ORDER BY l.created_at DESC
        LIMIT 20`,
      [depotId, readLostFoundIds]
    );

    const announcementsPromise = db.query(
      `SELECT m.message_id,
              m.created_at,
              m.message_text,
              c.channel_id,
              c.channel_name,
              u.first_name,
              u.last_name,
              u.username,
              r.role_name
         FROM messages m
         JOIN communication_channels c ON m.channel_id = c.channel_id
         JOIN channel_participants cp ON cp.channel_id = c.channel_id AND cp.user_id = $1
         JOIN users u ON m.sender_id = u.user_id
         JOIN roles r ON u.role_id = r.role_id
        WHERE c.channel_type = 'announcement'
          AND r.role_name IN ('ceo', 'dgm_technical', 'dgm_operations')
          AND NOT m.message_id = ANY($2::bigint[])
        ORDER BY m.created_at DESC
        LIMIT 30`,
      [managerUserId, readAnnouncementIds]
    );

    const directMessagesPromise = db.query(
      `SELECT m.message_id,
              m.created_at,
              m.message_text,
              m.sender_id,
              c.channel_id,
              u.first_name,
              u.last_name,
              u.username,
              r.role_name
         FROM messages m
         JOIN communication_channels c ON m.channel_id = c.channel_id
         JOIN channel_participants cp ON cp.channel_id = c.channel_id AND cp.user_id = $1
         JOIN users u ON m.sender_id = u.user_id
         JOIN roles r ON u.role_id = r.role_id
         LEFT JOIN depot_engineers de ON r.role_name = 'depot_engineer' AND de.depot_engineer_id = u.user_id
         LEFT JOIN depot_managers dm ON r.role_name = 'depot_manager' AND dm.depot_manager_id = u.user_id
         LEFT JOIN regional_operations_officers roo ON r.role_name = 'regional_operations' AND roo.roo_id = u.user_id
        WHERE c.channel_type = 'direct'
          AND m.sender_id <> $1
          AND (
                (r.role_name = 'depot_engineer' AND de.depot_id = $2)
             OR (r.role_name = 'depot_manager' AND dm.depot_id = $2)
         OR (r.role_name = 'regional_operations' AND roo.region_id = $3)
         OR r.role_name = 'admin'
          )
          AND NOT m.message_id = ANY($4::bigint[])
          AND NOT EXISTS (
                SELECT 1
                  FROM message_read_status mrs
                 WHERE mrs.message_id = m.message_id
                   AND mrs.user_id = $1
          )
        ORDER BY m.created_at DESC
        LIMIT 50`,
      [managerUserId, depotId, regionId, readDirectMessageIds]
    );

    const [complaints, lostFound, announcements, directMessages] = await Promise.all([
      complaintsPromise,
      lostFoundPromise,
      announcementsPromise,
      directMessagesPromise
    ]);

    const notifications = [];

    complaints.rows.forEach((row) => {
      notifications.push({
        id: row.id,
        type: 'complaint',
        title: 'New Complaint',
        message: row.description,
        priority: row.priority || 'medium',
        created_at: row.created_at || row.incident_date,
        read: false,
        person_name: `${row.first_name} ${row.last_name}`.trim(),
        contact: row.phone,
        route_number: row.route_number,
        bus_number: row.bus_number,
        complaint_type: row.complaint_type,
        incident_date: row.incident_date,
        incident_time: row.incident_time
      });
    });

    lostFound.rows.forEach((row) => {
      notifications.push({
        id: row.report_id,
        type: 'lost_found',
        title: 'Lost & Found Report',
        message: row.item_description,
        priority: 'low',
        created_at: row.created_at || row.incident_date,
        read: false,
        person_name: `${row.first_name} ${row.last_name}`.trim(),
        contact: row.contact_phone,
        route_number: row.route_number,
        item_category: row.item_category,
        incident_date: row.incident_date,
        incident_time: row.incident_time
      });
    });

    announcements.rows.forEach((row) => {
      const senderName = formatDisplayName(row.first_name, row.last_name, row.username);
      const text = row.message_text?.trim() || 'New announcement posted';
      notifications.push({
        id: row.message_id,
        type: 'announcement',
        title: `Announcement - ${resolveRoleLabel(row.role_name)}`,
        message: text.length > 160 ? `${text.slice(0, 157)}...` : text,
        priority: 'medium',
        created_at: row.created_at,
        read: false,
        meta: {
          channelId: row.channel_id,
          channelName: row.channel_name,
          senderRole: row.role_name,
          senderName
        }
      });
    });

    directMessages.rows.forEach((row) => {
      const senderName = formatDisplayName(row.first_name, row.last_name, row.username);
      const roleLabel = resolveRoleLabel(row.role_name);
      const text = row.message_text?.trim() || 'New message received';
      notifications.push({
        id: row.message_id,
        type: 'direct_message',
        title: `Message from ${senderName}`,
        message: text.length > 160 ? `${text.slice(0, 157)}...` : text,
        priority: 'high',
        created_at: row.created_at,
        read: false,
        meta: {
          channelId: row.channel_id,
          senderId: row.sender_id,
          senderRole: row.role_name,
          senderRoleLabel: roleLabel
        }
      });
    });

    notifications.sort((a, b) => {
      const orderDiff = (PRIORITY_ORDER[a.type] ?? 99) - (PRIORITY_ORDER[b.type] ?? 99);
      if (orderDiff !== 0) {
        return orderDiff;
      }

      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Depot notifications error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const depotId = Number.parseInt(req.params.depot_id, 10);
    const managerUserId = req.user.userId;
    const { notification_type: notificationType, notification_id: notificationId } = req.body;

    if (!Number.isFinite(depotId)) {
      return res.status(400).json({ success: false, error: 'Invalid depot id provided' });
    }

    if (!VALID_NOTIFICATION_TYPES.has(notificationType)) {
      return res.status(400).json({ success: false, error: 'Invalid notification type' });
    }

    const resolvedNotificationId = Number(notificationId);
    if (!Number.isFinite(resolvedNotificationId)) {
      return res.status(400).json({ success: false, error: 'Invalid notification id' });
    }

    await DepotOperationsManagerNotificationsReadModel.markAsRead(
      depotId,
      managerUserId,
      notificationType,
      resolvedNotificationId
    );

    if (notificationType === 'direct_message') {
      await db.query(
        `INSERT INTO message_read_status (message_id, user_id, read_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (message_id, user_id)
         DO UPDATE SET read_at = NOW()`,
        [resolvedNotificationId, managerUserId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Depot notification read error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = { getDepotNotifications, markNotificationAsRead };