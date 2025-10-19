// models/safetyModel.js
const db = require('../config/db');

const SafetyModel = {
  // --- KPI SUMMARY ---
  async getSafetySummary() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) AS total_incidents,
        SUM(CASE WHEN LOWER(condition_status) = 'breakdown' THEN 1 ELSE 0 END) AS total_breakdowns,
        SUM(CASE WHEN LOWER(condition_status) = 'accident' THEN 1 ELSE 0 END) AS total_accidents
      FROM bus_condition_reports;
    `);
    return rows[0];
  },

  // --- INCIDENT TREND (Last 6 months) ---
  async getIncidentTrend() {
    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(report_time, '%b') AS month,
        COUNT(*) AS incidents
      FROM bus_condition_reports
      WHERE report_time >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(report_time, '%b'), MONTH(report_time)
      ORDER BY MONTH(report_time);
    `);
    return rows;
  },

  // --- INCIDENTS BY REGION ---
  async getIncidentsByRegion() {
    const [rows] = await db.query(`
      SELECT 
        r.region_name AS region,
        COUNT(bcr.report_id) AS count
      FROM bus_condition_reports bcr
      JOIN buses b ON bcr.bus_id = b.bus_id
      JOIN depots d ON b.depot_id = d.depot_id
      JOIN regions r ON d.region_id = r.region_id
      WHERE bcr.report_time >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        AND LOWER(bcr.condition_status) IN ('accident', 'breakdown')
      GROUP BY r.region_name
      ORDER BY count DESC;
    `);
    return rows;
  },

  // --- RECENT INCIDENTS TABLE ---
  async getRecentIncidents() {
    const [rows] = await db.query(`
      SELECT 
        bcr.report_id AS id,
        DATE_FORMAT(bcr.report_time, '%Y-%m-%d') AS date,
        d.depot_name AS depot,
        b.bus_number AS vehicle_number,
        bcr.condition_status AS type,
        bcr.review_status AS status
      FROM bus_condition_reports bcr
      JOIN buses b ON bcr.bus_id = b.bus_id
      JOIN depots d ON b.depot_id = d.depot_id
      WHERE LOWER(bcr.condition_status) IN ('accident', 'breakdown')
      ORDER BY bcr.report_time DESC
      LIMIT 10;
    `);
    return rows;
  },
};

module.exports = SafetyModel;
