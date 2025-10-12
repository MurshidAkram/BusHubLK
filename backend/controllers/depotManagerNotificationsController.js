const db = require('../config/db');
const DepotManagerNotificationsReadModel = require('../models/DepotManagerNotificationsReadModel');

const getDepotManagerNotifications = async (req, res) => {
  try {
    const depot_id = parseInt(req.params.depot_id);
    const manager_user_id = req.user.userId;

    const ensureArray = (arr) => Array.isArray(arr) ? arr : [];
    const readEmergencyIds = ensureArray(await DepotManagerNotificationsReadModel.getReadNotificationIds(depot_id, manager_user_id, 'emergency'));
    const readInspectionIds = ensureArray(await DepotManagerNotificationsReadModel.getReadNotificationIds(depot_id, manager_user_id, 'inspection'));
    const readManagerChatIds = ensureArray(await DepotManagerNotificationsReadModel.getReadNotificationIds(depot_id, manager_user_id, 'manager_chat'));
    const readRtoManagerChatIds = ensureArray(await DepotManagerNotificationsReadModel.getReadNotificationIds(depot_id, manager_user_id, 'rto_manager_chat'));

    // Emergency reports: status = 'Escalated to Depot Manager'
    const emergencies = await db.query(
      `SELECT e.id, e.bus_id, e.incident_type, e.description, e.created_at
       FROM emergency_reports e
       JOIN buses b ON e.bus_id = b.bus_id
       WHERE b.depot_id = $1 AND e.status = 'Escalated to Depot Manager' AND NOT e.id = ANY($2::int[])
       ORDER BY e.created_at DESC
       LIMIT 20`,
      [depot_id, readEmergencyIds]
    );

    // Inspections for this depot
    const inspections = await db.query(
      `SELECT id, inspection_type, status, date, time, created_at
       FROM inspections
       WHERE depot_id = $1 AND NOT id = ANY($2::int[])
       ORDER BY created_at DESC
       LIMIT 20`,
      [depot_id, readInspectionIds]
    );

    // Get emergency report IDs for this depot (for chat notifications)
    const emergencyReportIdsResult = await db.query(
      `SELECT e.id
       FROM emergency_reports e
       JOIN buses b ON e.bus_id = b.bus_id
       WHERE b.depot_id = $1`,
      [depot_id]
    );
    const emergencyReportIds = emergencyReportIdsResult.rows.map(row => row.id);

    // Manager chats (sender_type = 'depot')
    const managerChats = emergencyReportIds.length > 0 ? await db.query(
      `SELECT id, report_id, sender_type, text, created_at
       FROM manager_chats
       WHERE sender_type = 'depot' AND report_id = ANY($1::int[]) AND NOT id = ANY($2::int[])
       ORDER BY created_at DESC
       LIMIT 20`,
      [emergencyReportIds, readManagerChatIds]
    ) : { rows: [] };

    // RTO manager chats (sender_type = 'rto')
    const rtoManagerChats = emergencyReportIds.length > 0 ? await db.query(
      `SELECT id, report_id, sender_type, text, created_at
       FROM rto_manager_chats
       WHERE sender_type = 'rto' AND report_id = ANY($1::int[]) AND NOT id = ANY($2::int[])
       ORDER BY created_at DESC
       LIMIT 20`,
      [emergencyReportIds, readRtoManagerChatIds]
    ) : { rows: [] };

    // Format notifications
    const notifications = [
      ...emergencies.rows.map(row => ({
        id: row.id,
        type: 'emergency',
        title: 'Emergency Report',
        bus_id: row.bus_id,
        incident_type: row.incident_type,
        description: row.description,
        date: row.created_at,
      })),
      ...inspections.rows.map(row => ({
        id: row.id,
        type: 'inspection',
        title: 'Inspection Report',
        inspection_type: row.inspection_type,
        status: row.status,
        date: row.date,
        time: row.time,
        created_at: row.created_at,
      })),
      ...managerChats.rows.map(row => ({
        id: row.id,
        type: 'manager_chat',
        title: 'Depot Emergency Message',
        report_id: row.report_id,
        sender_type: row.sender_type,
        text: row.text,
        date: row.created_at,
      })),
      ...rtoManagerChats.rows.map(row => ({
        id: row.id,
        type: 'rto_manager_chat',
        title: 'RTO Emergency Message',
        report_id: row.report_id,
        sender_type: row.sender_type,
        text: row.text,
        date: row.created_at,
      }))
    ];

    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Depot manager notifications error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const depot_id = parseInt(req.params.depot_id);
    const manager_user_id = req.user.userId;
    const { notification_type, notification_id } = req.body;

    if (!depot_id || !manager_user_id || !notification_type || !notification_id) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    await DepotManagerNotificationsReadModel.markAsRead(depot_id, manager_user_id, notification_type, notification_id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in markNotificationAsRead:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = { getDepotManagerNotifications, markNotificationAsRead };