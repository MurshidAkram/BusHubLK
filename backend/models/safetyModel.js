// backend/models/safetyModel.js
const db = require('../config/db'); // assume this exports a `query` method like node-postgres

const SafetyModel = {
  // KPI SUMMARY
  async getSafetySummary() {
    const q = `
      SELECT
        COUNT(*)::INT AS total_incidents,
        SUM( CASE WHEN lower(condition_status) = 'breakdown' THEN 1 ELSE 0 END )::INT AS total_breakdowns,
        SUM( CASE WHEN lower(condition_status) = 'accident' THEN 1 ELSE 0 END )::INT AS total_accidents
      FROM bus_condition_reports;
    `;
    const result = await db.query(q);
    return result.rows[0] || { total_incidents: 0, total_breakdowns: 0, total_accidents: 0 };
  },

  // INCIDENT TREND (last 6 months) grouped by month name
  async getIncidentTrend(months = 6) {
    const q = `
      SELECT
        to_char(date_trunc('month', report_time), 'Mon') AS month,
        date_trunc('month', report_time) AS month_start,
        COUNT(*)::INT AS incidents
      FROM bus_condition_reports
      WHERE report_time >= (date_trunc('month', CURRENT_DATE) - INTERVAL '${months - 1} month')
      GROUP BY month_start
      ORDER BY month_start;
    `;
    const result = await db.query(q);
    // map to simple objects
    return result.rows.map(r => ({ month: r.month, incidents: parseInt(r.incidents, 10) }));
  },

  // INCIDENTS BY REGION (last 6 months)
  async getIncidentsByRegion(months = 6) {
    const q = `
      SELECT
        r.region_name AS region,
        COUNT(bcr.report_id)::INT AS count
      FROM bus_condition_reports bcr
      JOIN buses b ON bcr.bus_id = b.bus_id
      JOIN depots d ON b.depot_id = d.depot_id
      JOIN regions r ON d.region_id = r.region_id
      WHERE bcr.report_time >= (date_trunc('month', CURRENT_DATE) - INTERVAL '${months - 1} month')
        AND lower(bcr.condition_status) IN ('accident', 'breakdown')
      GROUP BY r.region_name
      ORDER BY count DESC;
    `;
    const result = await db.query(q);
    return result.rows.map(r => ({ region: r.region, count: parseInt(r.count, 10) }));
  },

  // RECENT INCIDENTS (latest 10)
  async getRecentIncidents(limit = 10) {
    const q = `
      SELECT 
        bcr.report_id AS id,
        to_char(bcr.report_time, 'YYYY-MM-DD') AS date,
        d.depot_name AS depot,
        COALESCE(b.registration_number, '') AS vehicle_number,
        bcr.condition_status AS type,
        COALESCE(bcr.review_status, 'pending') AS status,
        bcr.description
      FROM bus_condition_reports bcr
      LEFT JOIN buses b ON bcr.bus_id = b.bus_id
      LEFT JOIN depots d ON b.depot_id = d.depot_id
      WHERE lower(bcr.condition_status) IN ('accident', 'breakdown')
      ORDER BY bcr.report_time DESC
      LIMIT $1;
    `;
    const result = await db.query(q, [limit]);
    return result.rows;
  },

  // Combined helper to fetch all required pieces (one DB call per piece)
  async getIncidentsOverview() {
    const [summary, trend, byRegion, recent] = await Promise.all([
      this.getSafetySummary(),
      this.getIncidentTrend(6),
      this.getIncidentsByRegion(6),
      this.getRecentIncidents(10)
    ]);

    return { summary, trend, byRegion, recent };
  }
};

module.exports = SafetyModel;
