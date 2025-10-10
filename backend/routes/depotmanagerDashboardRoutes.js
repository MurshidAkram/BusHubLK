const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateJWT } = require('../middlewares/authMiddleware');

router.get('/depot/:depot_id/metrics', authenticateJWT, async (req, res) => {
  const { depot_id } = req.params;
  try {
    // Active Buses
    const activeBusesRes = await db.query(
      `SELECT COUNT(*) FROM buses WHERE depot_id = $1 AND status = 'Active' AND is_active = true AND is_deleted = false`,
      [depot_id]
    );
    // Maintenance Alerts
    const maintenanceRes = await db.query(
      `SELECT COUNT(*) FROM buses WHERE depot_id = $1 AND status = 'Maintenance' AND is_active = true AND is_deleted = false`,
      [depot_id]
    );
    // Staff on Duty (Drivers)
    const driversRes = await db.query(
      `SELECT COUNT(*) FROM crew_status cs
       JOIN drivers d ON cs.person_id = d.driver_id
       WHERE cs.status = 'On Duty' AND d.depot_id = $1`,
      [depot_id]
    );
    // Staff on Duty (Conductors)
    const conductorsRes = await db.query(
      `SELECT COUNT(*) FROM crew_status cs
       JOIN conductors c ON cs.person_id = c.conductor_id
       WHERE cs.status = 'On Duty' AND c.depot_id = $1`,
      [depot_id]
    );
    // Spare Parts by unit
    const sparePartsRes = await db.query(
      `SELECT unit, SUM(current_stock) AS total_stock
       FROM spare_parts_inventory
       WHERE depot_id = $1 AND (deleted_at IS NULL)
       GROUP BY unit`,
      [depot_id]
    );

    res.json({
      success: true,
      data: {
        activeBuses: Number(activeBusesRes.rows[0].count),
        maintenanceAlerts: Number(maintenanceRes.rows[0].count),
        staffOnDuty: {
          drivers: Number(driversRes.rows[0].count),
          conductors: Number(conductorsRes.rows[0].count),
          total: Number(driversRes.rows[0].count) + Number(conductorsRes.rows[0].count)
        },
        spareParts: sparePartsRes.rows // [{ unit: 'pieces', total_stock: 12 }, { unit: 'liters', total_stock: 50 }]
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch depot metrics', details: err.message });
  }
});

router.get('/depot/:depot_id/fleet-status', authenticateJWT, async (req, res) => {
  const { depot_id } = req.params;
  try {
    const result = await db.query(
      `SELECT status, COUNT(*) AS count
       FROM buses
       WHERE depot_id = $1 AND is_deleted = false
       GROUP BY status`,
      [depot_id]
    );
    // Format as { active, maintenance, outOfService }
    let active = 0, maintenance = 0, outOfService = 0, total = 0;
    result.rows.forEach(row => {
      total += Number(row.count);
      if (row.status === 'Active') active = Number(row.count);
      else if (row.status === 'Maintenance') maintenance = Number(row.count);
      else if (row.status === 'Out of Service') outOfService = Number(row.count);
    });
    res.json({
      success: true,
      data: { active, maintenance, outOfService, total }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fleet status', details: err.message });
  }
});

router.get('/depot/:depot_id/spare-parts-details', authenticateJWT, async (req, res) => {
  const { depot_id } = req.params;
  try {
    const result = await db.query(
      `SELECT part_id, part_name, current_stock, unit, last_restocked
       FROM spare_parts_inventory
       WHERE depot_id = $1 AND (deleted_at IS NULL)
       ORDER BY part_name`,
      [depot_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch spare parts details', details: err.message });
  }
});

router.get('/depot/:depot_id/todays-schedule', authenticateJWT, async (req, res) => {
  const { depot_id } = req.params;
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  try {
    const result = await db.query(
      `SELECT 
         da.assignment_id,
         r.route_number,
         r.route_name,
         da.shift_start_time,
         da.shift_end_time,
         b.registration_number,
         u.first_name AS driver_name,
         da.status
       FROM dailyassignment da
       JOIN routes r ON da.route_id = r.route_id
       JOIN buses b ON da.bus_id = b.bus_id
       JOIN drivers d ON da.driver_id = d.driver_id
       JOIN users u ON d.driver_id = u.user_id
       WHERE da.depot_id = $1
         AND da.assignment_date = $2
         AND da.is_active = TRUE
       ORDER BY da.shift_start_time`,
      [depot_id, today]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today\'s schedule', details: err.message });
  }
});

router.get('/depot/:depot_id/spare-parts-summary', authenticateJWT, async (req, res) => {
  const { depot_id } = req.params;
  try {
    const result = await db.query(
      `SELECT 
         part_name, 
         unit, 
         SUM(current_stock) AS total_stock,
         MAX(last_restocked) AS last_restocked
       FROM spare_parts_inventory
       WHERE depot_id = $1
       GROUP BY part_name, unit
       ORDER BY part_name, unit`,
      [depot_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch spare parts summary', details: err.message });
  }
});

router.get('/depot/:depot_id/recent-activities', authenticateJWT, async (req, res) => {
  const { depot_id } = req.params;
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  try {
    // Spare Parts: last entered today
    const sparePartRes = await db.query(
      `SELECT part_name, unit, current_stock, last_restocked, created_at
       FROM spare_parts_inventory
       WHERE depot_id = $1 AND DATE(created_at) = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [depot_id, today]
    );

    // Daily Assignment: last entered today
    const assignmentRes = await db.query(
      `SELECT da.assignment_id, r.route_number, b.registration_number, da.created_at
       FROM dailyassignment da
       JOIN routes r ON da.route_id = r.route_id
       JOIN buses b ON da.bus_id = b.bus_id
       WHERE da.depot_id = $1 AND da.assignment_date = $2
       ORDER BY da.created_at DESC
       LIMIT 1`,
      [depot_id, today]
    );

    // Inspection: last entered today (JOIN with dailyassignment for depot_id)
    const inspectionRes = await db.query(
      `SELECT id, inspection_type, status, user_id, created_at
       FROM inspections
       WHERE depot_id = $1 AND DATE(created_at) = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [depot_id, today]
    );

    // Emergency Report: last entered today (JOIN with buses for depot_id)
    const emergencyRes = await db.query(
      `SELECT e.id, e.incident_type, e.created_at
       FROM emergency_reports e
       JOIN buses b ON e.bus_id = b.bus_id
       WHERE b.depot_id = $1 AND DATE(e.created_at) = $2
       ORDER BY e.created_at DESC
       LIMIT 1`,
      [depot_id, today]
    );

    res.json({
      success: true,
      data: {
        sparePart: sparePartRes.rows[0] || null,
        assignment: assignmentRes.rows[0] || null,
        inspection: inspectionRes.rows[0] || null,
        emergency: emergencyRes.rows[0] || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent activities', details: err.message });
  }
});

module.exports = router;