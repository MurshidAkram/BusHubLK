const db = require('../config/db');
const DepotOperationsManagerNotificationsReadModel = require('../models/DepotOperationsManagerNotificationsReadModel');

const getDepotNotifications = async (req, res) => {
  try {
    const depot_id = parseInt(req.params.depot_id);
    const manager_user_id = req.user.userId; // <-- FIXED: use userId (capital I)

    // Get read notification IDs
    const readComplaintIds = await DepotOperationsManagerNotificationsReadModel.getReadNotificationIds(depot_id, manager_user_id, 'complaint');
    const readLostFoundIds = await DepotOperationsManagerNotificationsReadModel.getReadNotificationIds(depot_id, manager_user_id, 'lost_found');

    // Complaints: filter by depot (e.g., by route_number or location if you have a mapping)
    const complaints = await db.query(
      `SELECT c.id, c.incident_date, c.incident_time, c.route_number, c.bus_number, c.description, c.priority, c.complaint_type, u.first_name, u.last_name, u.phone
       FROM complaints c
       JOIN users u ON c.user_id = u.user_id
       WHERE NOT c.id = ANY($1::int[])
       ORDER BY c.created_at DESC
       LIMIT 20`,
      [readComplaintIds]
    );

    // Lost & found: filter by depot
    const lostFound = await db.query(
      `SELECT l.report_id, l.incident_date, l.incident_time, l.route_number, l.item_description, l.item_category, l.contact_phone, u.first_name, u.last_name
       FROM lost_found_reports l
       JOIN users u ON l.passenger_id = u.user_id
       WHERE l.handed_to_depot_id = $1 AND NOT l.report_id = ANY($2::int[])
       ORDER BY l.created_at DESC
       LIMIT 20`,
      [depot_id, readLostFoundIds]
    );

    // Format notifications
    const notifications = [
      ...complaints.rows.map(row => ({
        id: row.id,
        type: 'complaint',
        title: 'New Complaint',
        person_name: `${row.first_name} ${row.last_name}`,
        contact: row.phone,
        route_number: row.route_number,
        bus_number: row.bus_number,
        priority: row.priority,
        description: row.description,
        complaint_type: row.complaint_type,
        date: row.incident_date,
        time: row.incident_time
      })),
      ...lostFound.rows.map(row => ({
        id: row.report_id,
        type: 'lost_found',
        title: 'Lost & Found Report',
        person_name: `${row.first_name} ${row.last_name}`,
        contact: row.contact_phone,
        route_number: row.route_number,
        item_category: row.item_category,
        description: row.item_description,
        date: row.incident_date,
        time: row.incident_time
      }))
    ];

    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Depot notifications error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const markNotificationAsRead = async (req, res) => {
  const depot_id = parseInt(req.params.depot_id);
  const manager_user_id = req.user.userId; // <-- FIXED: use userId (capital I)
  const { notification_type, notification_id } = req.body;

  console.log('depot_id:', depot_id);
  console.log('manager_user_id:', manager_user_id);
  console.log('notification_type:', notification_type);
  console.log('notification_id:', notification_id);

  await DepotOperationsManagerNotificationsReadModel.markAsRead(depot_id, manager_user_id, notification_type, notification_id);
  res.json({ success: true });
};

module.exports = { getDepotNotifications, markNotificationAsRead };