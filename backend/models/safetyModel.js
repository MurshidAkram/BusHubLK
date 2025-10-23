// backend/models/safetyModel.js
const db = require('../config/db');

const SafetyModel = {
  // Get summary statistics
  async getSafetySummary() {
    try {
      const query = `
        SELECT
          COUNT(*)::INTEGER AS total_incidents,
          SUM(CASE WHEN LOWER(condition_status) LIKE '%breakdown%' OR LOWER(condition_status) = 'major issues' THEN 1 ELSE 0 END)::INTEGER AS breakdowns,
          SUM(CASE WHEN LOWER(condition_status) LIKE '%accident%' OR LOWER(condition_status) = 'minor issues' THEN 1 ELSE 0 END)::INTEGER AS accidents,
          SUM(CASE WHEN LOWER(review_status) = 'pending' OR review_status IS NULL THEN 1 ELSE 0 END)::INTEGER AS pending,
          SUM(CASE WHEN LOWER(review_status) = 'resolved' OR LOWER(review_status) = 'completed' THEN 1 ELSE 0 END)::INTEGER AS resolved
        FROM bus_condition_reports
        WHERE LOWER(condition_status) IN ('major issues', 'minor issues', 'accident', 'breakdown')
          AND report_time >= CURRENT_DATE - INTERVAL '6 months';
      `;
      const result = await db.query(query);
      return result.rows[0] || { 
        total_incidents: 0, 
        breakdowns: 0, 
        accidents: 0,
        pending: 0,
        resolved: 0
      };
    } catch (error) {
      console.error('SafetyModel.getSafetySummary error:', error);
      throw new Error(`Failed to get safety summary: ${error.message}`);
    }
  },

  // Get incident trend for last N months
  async getIncidentTrend(months = 6) {
    try {
      const query = `
        SELECT
          TO_CHAR(DATE_TRUNC('month', report_time), 'Mon YYYY') AS month,
          TO_CHAR(DATE_TRUNC('month', report_time), 'YYYY-MM') AS month_key,
          COUNT(*)::INTEGER AS incidents,
          SUM(CASE WHEN LOWER(condition_status) IN ('minor issues', 'accident') THEN 1 ELSE 0 END)::INTEGER AS accidents,
          SUM(CASE WHEN LOWER(condition_status) IN ('major issues', 'breakdown') THEN 1 ELSE 0 END)::INTEGER AS breakdowns
        FROM bus_condition_reports
        WHERE report_time >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${months - 1} months'
          AND LOWER(condition_status) IN ('major issues', 'minor issues', 'accident', 'breakdown')
        GROUP BY month_key, month
        ORDER BY month_key;
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('SafetyModel.getIncidentTrend error:', error);
      throw new Error(`Failed to get incident trend: ${error.message}`);
    }
  },

  // Get incidents by region
  async getIncidentsByRegion(months = 6) {
    try {
      const query = `
        SELECT
          COALESCE(r.region_name, 'Unknown') AS region,
          COUNT(bcr.report_id)::INTEGER AS total_count,
          SUM(CASE WHEN LOWER(bcr.condition_status) IN ('minor issues', 'accident') THEN 1 ELSE 0 END)::INTEGER AS accidents,
          SUM(CASE WHEN LOWER(bcr.condition_status) IN ('major issues', 'breakdown') THEN 1 ELSE 0 END)::INTEGER AS breakdowns
        FROM bus_condition_reports bcr
        LEFT JOIN buses b ON bcr.bus_id = b.bus_id
        LEFT JOIN depots d ON b.depot_id = d.depot_id
        LEFT JOIN regions r ON d.region_id = r.region_id
        WHERE bcr.report_time >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${months - 1} months'
          AND LOWER(bcr.condition_status) IN ('major issues', 'minor issues', 'accident', 'breakdown')
        GROUP BY r.region_name
        ORDER BY total_count DESC;
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('SafetyModel.getIncidentsByRegion error:', error);
      throw new Error(`Failed to get incidents by region: ${error.message}`);
    }
  },

  // Get incidents by depot (top N)
  async getIncidentsByDepot(limit = 10) {
    try {
      const query = `
        SELECT
          COALESCE(d.depot_name, 'Unknown') AS depot,
          COALESCE(r.region_name, 'Unknown') AS region,
          COUNT(bcr.report_id)::INTEGER AS count
        FROM bus_condition_reports bcr
        LEFT JOIN buses b ON bcr.bus_id = b.bus_id
        LEFT JOIN depots d ON b.depot_id = d.depot_id
        LEFT JOIN regions r ON d.region_id = r.region_id
        WHERE bcr.report_time >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '6 months'
          AND LOWER(bcr.condition_status) IN ('major issues', 'minor issues', 'accident', 'breakdown')
        GROUP BY d.depot_name, r.region_name
        ORDER BY count DESC
        LIMIT $1;
      `;
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('SafetyModel.getIncidentsByDepot error:', error);
      throw new Error(`Failed to get incidents by depot: ${error.message}`);
    }
  },

  // Get recent incidents
  async getRecentIncidents(limit = 15) {
    try {
      const query = `
        SELECT 
          bcr.report_id AS id,
          TO_CHAR(bcr.report_time, 'YYYY-MM-DD HH24:MI') AS date,
          COALESCE(d.depot_name, 'N/A') AS depot,
          COALESCE(r.region_name, 'N/A') AS region,
          COALESCE(b.registration_number, 'N/A') AS number,
          CASE 
            WHEN LOWER(bcr.condition_status) = 'major issues' THEN 'breakdown'
            WHEN LOWER(bcr.condition_status) = 'minor issues' THEN 'accident'
            ELSE LOWER(bcr.condition_status)
          END AS type,
          COALESCE(bcr.review_status, 'pending') AS status,
          COALESCE(bcr.description, 'No description') AS description,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'N/A') AS driver_name
        FROM bus_condition_reports bcr
        LEFT JOIN buses b ON bcr.bus_id = b.bus_id
        LEFT JOIN depots d ON b.depot_id = d.depot_id
        LEFT JOIN regions r ON d.region_id = r.region_id
        LEFT JOIN drivers dr ON bcr.driver_id = dr.driver_id
        LEFT JOIN users u ON dr.driver_id = u.user_id
        WHERE LOWER(bcr.condition_status) IN ('major issues', 'minor issues', 'accident', 'breakdown')
        ORDER BY bcr.report_time DESC
        LIMIT $1;
      `;
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('SafetyModel.getRecentIncidents error:', error);
      throw new Error(`Failed to get recent incidents: ${error.message}`);
    }
  },

  // Get incident severity breakdown
  async getIncidentSeverity() {
    try {
      const query = `
        SELECT
          CASE 
            WHEN LOWER(condition_status) IN ('accident', 'minor issues') THEN 'High'
            WHEN LOWER(condition_status) IN ('breakdown', 'major issues') THEN 'Medium'
            ELSE 'Low'
          END AS severity,
          COUNT(*)::INTEGER AS count
        FROM bus_condition_reports
        WHERE report_time >= CURRENT_DATE - INTERVAL '6 months'
          AND LOWER(condition_status) IN ('major issues', 'minor issues', 'accident', 'breakdown')
        GROUP BY severity
        ORDER BY 
          CASE severity 
            WHEN 'High' THEN 1 
            WHEN 'Medium' THEN 2 
            ELSE 3 
          END;
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('SafetyModel.getIncidentSeverity error:', error);
      throw new Error(`Failed to get incident severity: ${error.message}`);
    }
  },

  // Get detailed incident by ID
  async getIncidentById(id) {
    try {
      const query = `
        SELECT 
          bcr.report_id AS id,
          bcr.report_time AS date,
          CASE 
            WHEN LOWER(bcr.condition_status) = 'major issues' THEN 'breakdown'
            WHEN LOWER(bcr.condition_status) = 'minor issues' THEN 'accident'
            ELSE LOWER(bcr.condition_status)
          END AS type,
          bcr.review_status AS status,
          bcr.description,
          COALESCE(b.registration_number, 'N/A') AS bus_number,
          COALESCE(d.depot_name, 'N/A') AS depot,
          COALESCE(r.region_name, 'N/A') AS region,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'N/A') AS driver_name
        FROM bus_condition_reports bcr
        LEFT JOIN buses b ON bcr.bus_id = b.bus_id
        LEFT JOIN depots d ON b.depot_id = d.depot_id
        LEFT JOIN regions r ON d.region_id = r.region_id
        LEFT JOIN drivers dr ON bcr.driver_id = dr.driver_id
        LEFT JOIN users u ON dr.driver_id = u.user_id
        WHERE bcr.report_id = $1;
      `;
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('SafetyModel.getIncidentById error:', error);
      throw new Error(`Failed to get incident by ID: ${error.message}`);
    }
  },

  // Update incident status
  async updateIncidentStatus(id, status, notes = null) {
    try {
      const query = `
        UPDATE bus_condition_reports
        SET review_status = $2
        WHERE report_id = $1
        RETURNING report_id, review_status;
      `;
      const result = await db.query(query, [id, status]);
      
      if (result.rows.length === 0) {
        throw new Error('Incident not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('SafetyModel.updateIncidentStatus error:', error);
      throw new Error(`Failed to update incident status: ${error.message}`);
    }
  },

  // Get incident statistics for date range
  async getIncidentStats(startDate, endDate) {
    try {
      const dateFilter = startDate && endDate
        ? `AND report_time BETWEEN $1 AND $2`
        : `AND report_time >= CURRENT_DATE - INTERVAL '6 months'`;
      
      const query = `
        SELECT
          COUNT(*)::INTEGER AS total,
          SUM(CASE WHEN LOWER(condition_status) IN ('minor issues', 'accident') THEN 1 ELSE 0 END)::INTEGER AS accidents,
          SUM(CASE WHEN LOWER(condition_status) IN ('major issues', 'breakdown') THEN 1 ELSE 0 END)::INTEGER AS breakdowns
        FROM bus_condition_reports
        WHERE LOWER(condition_status) IN ('major issues', 'minor issues', 'accident', 'breakdown')
          ${dateFilter};
      `;
      
      const params = startDate && endDate ? [startDate, endDate] : [];
      const result = await db.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('SafetyModel.getIncidentStats error:', error);
      throw new Error(`Failed to get incident statistics: ${error.message}`);
    }
  },

  // Combined overview endpoint
  async getIncidentsOverview() {
    try {
      console.log('📊 Fetching incidents overview...');
      
      const [summary, trend, byRegion, byDepot, recent, severity] = await Promise.all([
        this.getSafetySummary(),
        this.getIncidentTrend(6),
        this.getIncidentsByRegion(6),
        this.getIncidentsByDepot(10),
        this.getRecentIncidents(15),
        this.getIncidentSeverity()
      ]);

      console.log('✅ Overview fetched successfully');
      console.log('Summary:', summary);
      console.log('Trend records:', trend.length);
      console.log('Regions:', byRegion.length);
      console.log('Depots:', byDepot.length);
      console.log('Recent incidents:', recent.length);
      console.log('Severity levels:', severity.length);

      return { 
        summary, 
        trend, 
        byRegion, 
        byDepot,
        recent,
        severity
      };
    } catch (error) {
      console.error('❌ SafetyModel.getIncidentsOverview error:', error);
      throw new Error(`Failed to get incidents overview: ${error.message}`);
    }
  }
};

module.exports = SafetyModel;