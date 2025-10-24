// backend/models/safetyModel.js
const db = require('../config/db');

const SafetyModel = {
  // Get summary statistics
  async getSafetySummary() {
    try {
      const query = `
        SELECT
          COUNT(*)::INTEGER AS total_incidents,
          COALESCE(SUM(CASE WHEN LOWER(condition_status) = 'major issues' THEN 1 ELSE 0 END)::INTEGER, 0) AS breakdowns,
          COALESCE(SUM(CASE WHEN LOWER(condition_status) = 'minor issues' THEN 1 ELSE 0 END)::INTEGER, 0) AS accidents,
          COALESCE(SUM(CASE WHEN review_status IS NULL OR LOWER(review_status) = 'pending' THEN 1 ELSE 0 END)::INTEGER, 0) AS pending,
          COALESCE(SUM(CASE WHEN LOWER(review_status) IN ('resolved', 'completed') THEN 1 ELSE 0 END)::INTEGER, 0) AS resolved
        FROM bus_condition_reports
        WHERE LOWER(condition_status) IN ('major issues', 'minor issues')
          AND report_time >= CURRENT_DATE - INTERVAL '6 months';
      `;
      const result = await db.query(query);
      console.log('✅ Summary query result:', result.rows[0]);
      return result.rows[0] || { 
        total_incidents: 0, 
        breakdowns: 0, 
        accidents: 0,
        pending: 0,
        resolved: 0
      };
    } catch (error) {
      console.error('❌ SafetyModel.getSafetySummary error:', error.message);
      console.error('Stack:', error.stack);
      throw error;
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
          COALESCE(SUM(CASE WHEN LOWER(condition_status) = 'minor issues' THEN 1 ELSE 0 END)::INTEGER, 0) AS accidents,
          COALESCE(SUM(CASE WHEN LOWER(condition_status) = 'major issues' THEN 1 ELSE 0 END)::INTEGER, 0) AS breakdowns
        FROM bus_condition_reports
        WHERE report_time >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${months - 1} months'
          AND LOWER(condition_status) IN ('major issues', 'minor issues')
        GROUP BY month_key, month
        ORDER BY month_key;
      `;
      const result = await db.query(query);
      console.log('✅ Trend query returned', result.rows.length, 'months');
      return result.rows;
    } catch (error) {
      console.error('❌ SafetyModel.getIncidentTrend error:', error.message);
      throw error;
    }
  },

  // Get incidents by region
  async getIncidentsByRegion(months = 6) {
    try {
      const query = `
        SELECT
          COALESCE(r.region_name, 'Unknown') AS region,
          COUNT(bcr.report_id)::INTEGER AS total_count,
          COALESCE(SUM(CASE WHEN LOWER(bcr.condition_status) = 'minor issues' THEN 1 ELSE 0 END)::INTEGER, 0) AS accidents,
          COALESCE(SUM(CASE WHEN LOWER(bcr.condition_status) = 'major issues' THEN 1 ELSE 0 END)::INTEGER, 0) AS breakdowns
        FROM bus_condition_reports bcr
        LEFT JOIN buses b ON bcr.bus_id = b.bus_id
        LEFT JOIN depots d ON b.depot_id = d.depot_id
        LEFT JOIN regions r ON d.region_id = r.region_id
        WHERE bcr.report_time >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${months - 1} months'
          AND LOWER(bcr.condition_status) IN ('major issues', 'minor issues')
        GROUP BY r.region_name
        HAVING COUNT(bcr.report_id) > 0
        ORDER BY total_count DESC;
      `;
      const result = await db.query(query);
      console.log('✅ Region query returned', result.rows.length, 'regions');
      return result.rows;
    } catch (error) {
      console.error('❌ SafetyModel.getIncidentsByRegion error:', error.message);
      throw error;
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
          AND LOWER(bcr.condition_status) IN ('major issues', 'minor issues')
        GROUP BY d.depot_name, r.region_name
        HAVING COUNT(bcr.report_id) > 0
        ORDER BY count DESC
        LIMIT $1;
      `;
      const result = await db.query(query, [limit]);
      console.log('✅ Depot query returned', result.rows.length, 'depots');
      return result.rows;
    } catch (error) {
      console.error('❌ SafetyModel.getIncidentsByDepot error:', error.message);
      throw error;
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
            ELSE 'unknown'
          END AS type,
          COALESCE(LOWER(bcr.review_status), 'pending') AS status,
          COALESCE(bcr.description, 'No description') AS description,
          COALESCE(u.first_name || ' ' || u.last_name, 'N/A') AS driver_name
        FROM bus_condition_reports bcr
        LEFT JOIN buses b ON bcr.bus_id = b.bus_id
        LEFT JOIN depots d ON b.depot_id = d.depot_id
        LEFT JOIN regions r ON d.region_id = r.region_id
        LEFT JOIN drivers dr ON bcr.driver_id = dr.driver_id
        LEFT JOIN users u ON dr.driver_id = u.user_id
        WHERE LOWER(bcr.condition_status) IN ('major issues', 'minor issues')
        ORDER BY bcr.report_time DESC
        LIMIT $1;
      `;
      const result = await db.query(query, [limit]);
      console.log('✅ Recent incidents query returned', result.rows.length, 'records');
      return result.rows;
    } catch (error) {
      console.error('❌ SafetyModel.getRecentIncidents error:', error.message);
      throw error;
    }
  },

  // Get incident severity breakdown
  async getIncidentSeverity() {
    try {
      const query = `
        WITH severity_data AS (
          SELECT
            CASE 
              WHEN LOWER(condition_status) = 'minor issues' THEN 'High'
              WHEN LOWER(condition_status) = 'major issues' THEN 'Medium'
              ELSE 'Low'
            END AS severity,
            COUNT(*)::INTEGER AS count
          FROM bus_condition_reports
          WHERE report_time >= CURRENT_DATE - INTERVAL '6 months'
            AND LOWER(condition_status) IN ('major issues', 'minor issues')
          GROUP BY condition_status
        )
        SELECT * FROM severity_data
        ORDER BY 
          CASE severity 
            WHEN 'High' THEN 1 
            WHEN 'Medium' THEN 2 
            ELSE 3 
          END;
      `;
      const result = await db.query(query);
      console.log('✅ Severity query returned', result.rows.length, 'levels:', JSON.stringify(result.rows));
      return result.rows;
    } catch (error) {
      console.error('❌ SafetyModel.getIncidentSeverity error:', error.message);
      throw error;
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
            ELSE 'unknown'
          END AS type,
          bcr.review_status AS status,
          bcr.description,
          COALESCE(b.registration_number, 'N/A') AS bus_number,
          COALESCE(d.depot_name, 'N/A') AS depot,
          COALESCE(r.region_name, 'N/A') AS region,
          COALESCE(u.first_name || ' ' || u.last_name, 'N/A') AS driver_name
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
      console.error('❌ SafetyModel.getIncidentById error:', error.message);
      throw error;
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
      console.error('❌ SafetyModel.updateIncidentStatus error:', error.message);
      throw error;
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
          COALESCE(SUM(CASE WHEN LOWER(condition_status) = 'minor issues' THEN 1 ELSE 0 END)::INTEGER, 0) AS accidents,
          COALESCE(SUM(CASE WHEN LOWER(condition_status) = 'major issues' THEN 1 ELSE 0 END)::INTEGER, 0) AS breakdowns
        FROM bus_condition_reports
        WHERE LOWER(condition_status) IN ('major issues', 'minor issues')
          ${dateFilter};
      `;
      
      const params = startDate && endDate ? [startDate, endDate] : [];
      const result = await db.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('❌ SafetyModel.getIncidentStats error:', error.message);
      throw error;
    }
  },

  // Combined overview endpoint
  async getIncidentsOverview() {
    try {
      console.log('📊 Starting incidents overview fetch...');
      
      const [summary, trend, byRegion, byDepot, recent, severity] = await Promise.all([
        this.getSafetySummary().catch(err => {
          console.error('Summary failed:', err.message);
          return { total_incidents: 0, breakdowns: 0, accidents: 0, pending: 0, resolved: 0 };
        }),
        this.getIncidentTrend(6).catch(err => {
          console.error('Trend failed:', err.message);
          return [];
        }),
        this.getIncidentsByRegion(6).catch(err => {
          console.error('Region failed:', err.message);
          return [];
        }),
        this.getIncidentsByDepot(10).catch(err => {
          console.error('Depot failed:', err.message);
          return [];
        }),
        this.getRecentIncidents(15).catch(err => {
          console.error('Recent failed:', err.message);
          return [];
        }),
        this.getIncidentSeverity().catch(err => {
          console.error('Severity failed:', err.message);
          return [];
        })
      ]);

      console.log('✅ Overview completed successfully');
      console.log('   Summary:', JSON.stringify(summary));
      console.log('   Trend months:', trend.length);
      console.log('   Regions:', byRegion.length);
      console.log('   Depots:', byDepot.length);
      console.log('   Recent:', recent.length);
      console.log('   Severity:', severity.length);

      return { 
        summary, 
        trend, 
        byRegion, 
        byDepot,
        recent,
        severity
      };
    } catch (error) {
      console.error('❌ SafetyModel.getIncidentsOverview critical error:', error);
      throw error;
    }
  }
};

module.exports = SafetyModel;