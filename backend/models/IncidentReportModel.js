const pool = require('../config/db');

class IncidentReportModel {
  // Get all reports with filtering and pagination
  static async getAllWithFilters(filters = {}, limit = 20, offset = 0) {
    try {
      console.log('🔍 IncidentReportModel.getAllWithFilters called with:', { filters, limit, offset });
      
      let query = `
        SELECT 
          lfr.report_id,
          lfr.passenger_id,
          lfr.incident_date,
          lfr.incident_time,
          COALESCE(CONCAT(pu.first_name, ' ', pu.last_name), SPLIT_PART(lfr.contact_email, '@', 1), 'Passenger') as passenger_name,
          INITCAP(lfr.report_type) as report_type,
          lfr.item_category,
          lfr.item_description,
          lfr.item_photo_url,
          lfr.route_number,
          NULL as bus_number,
          COALESCE(pu.email, lfr.contact_email) as contact_email,
          COALESCE(pu.phone, lfr.contact_phone) as contact_phone,
          CASE 
            WHEN lfr.status = 'active' THEN 'Pending'
            WHEN lfr.status = 'resolved' THEN 'Resolved'
            WHEN lfr.status = 'expired' THEN 'Expired'
            WHEN lfr.status = 'deleted' THEN 'Deleted'
            ELSE INITCAP(lfr.status)
          END as status,
          COALESCE(CONCAT(du.first_name, ' ', du.last_name), 'N/A') as driver_name,
          COALESCE(du.phone, 'N/A') as driver_phone,
          lfr.approximate_location as location_found,
          lfr.created_at,
          lfr.updated_at,
          NULL as resolved_by,
          lfr.resolved_date as resolution_date,
          NULL as resolution_notes
        FROM lost_found_reports lfr
        LEFT JOIN passengers p ON lfr.passenger_id = p.passenger_id
        LEFT JOIN users pu ON p.passenger_id = pu.user_id
        LEFT JOIN drivers d ON lfr.driver_id = d.driver_id
        LEFT JOIN users du ON d.driver_id = du.user_id
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;

      // Apply filters
      if (filters.search && filters.search.trim()) {
        query += ` AND (
          LOWER(CONCAT(pu.first_name, ' ', pu.last_name)) LIKE LOWER($${paramIndex}) OR 
          LOWER(SPLIT_PART(lfr.contact_email, '@', 1)) LIKE LOWER($${paramIndex + 1}) OR 
          LOWER(lfr.item_description) LIKE LOWER($${paramIndex + 2}) OR 
          LOWER(lfr.item_category) LIKE LOWER($${paramIndex + 3}) OR
          lfr.route_number LIKE $${paramIndex + 4} OR
          LOWER(lfr.approximate_location) LIKE LOWER($${paramIndex + 5}) OR
          LOWER(CONCAT(du.first_name, ' ', du.last_name)) LIKE LOWER($${paramIndex + 6})
        )`;
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        paramIndex += 7;
      }

      if (filters.type && filters.type !== 'All') {
        query += ` AND LOWER(lfr.report_type) = LOWER($${paramIndex})`;
        params.push(filters.type);
        paramIndex++;
      }

      if (filters.category && filters.category !== 'All') {
        query += ` AND lfr.item_category = $${paramIndex}`;
        params.push(filters.category.toLowerCase());
        paramIndex++;
      }

      if (filters.status && filters.status !== 'All') {
        let statusValue = filters.status;
        if (statusValue === 'Pending') statusValue = 'active';
        if (statusValue === 'Resolved') statusValue = 'resolved';
        query += ` AND lfr.status = $${paramIndex}`;
        params.push(statusValue);
        paramIndex++;
      }

      if (filters.date) {
        query += ` AND lfr.incident_date = $${paramIndex}`;
        params.push(filters.date);
        paramIndex++;
      }

      // Add ordering and pagination
      query += ` ORDER BY lfr.created_at DESC`;
      
      if (limit > 0) {
        query += ` LIMIT $${paramIndex}`;
        params.push(limit);
        paramIndex++;
        
        if (offset > 0) {
          query += ` OFFSET $${paramIndex}`;
          params.push(offset);
        }
      }

      console.log('📝 Executing query:', query);
      console.log('📝 Query params:', params);

      const result = await pool.query(query, params);
      
      console.log(`✅ Found ${result.rows.length} reports`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error in getAllWithFilters:', error);
      throw error;
    }
  }

  // Get count of reports with filters (for pagination)
  static async getCountWithFilters(filters = {}) {
    try {
      console.log('🔢 IncidentReportModel.getCountWithFilters called with:', filters);
      
      let query = `
        SELECT COUNT(*) as total 
        FROM lost_found_reports lfr
        LEFT JOIN passengers p ON lfr.passenger_id = p.passenger_id
        LEFT JOIN users pu ON p.passenger_id = pu.user_id
        LEFT JOIN drivers d ON lfr.driver_id = d.driver_id
        LEFT JOIN users du ON d.driver_id = du.user_id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      // Apply same filters as getAllWithFilters
      if (filters.search && filters.search.trim()) {
        query += ` AND (
          LOWER(CONCAT(pu.first_name, ' ', pu.last_name)) LIKE LOWER($${paramIndex}) OR 
          LOWER(SPLIT_PART(lfr.contact_email, '@', 1)) LIKE LOWER($${paramIndex + 1}) OR 
          LOWER(lfr.item_description) LIKE LOWER($${paramIndex + 2}) OR 
          LOWER(lfr.item_category) LIKE LOWER($${paramIndex + 3}) OR
          lfr.route_number LIKE $${paramIndex + 4} OR
          LOWER(lfr.approximate_location) LIKE LOWER($${paramIndex + 5}) OR
          LOWER(CONCAT(du.first_name, ' ', du.last_name)) LIKE LOWER($${paramIndex + 6})
        )`;
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        paramIndex += 7;
      }

      if (filters.type && filters.type !== 'All') {
        query += ` AND LOWER(lfr.report_type) = LOWER($${paramIndex})`;
        params.push(filters.type);
        paramIndex++;
      }

      if (filters.category && filters.category !== 'All') {
        query += ` AND lfr.item_category = $${paramIndex}`;
        params.push(filters.category.toLowerCase());
        paramIndex++;
      }

      if (filters.status && filters.status !== 'All') {
        let statusValue = filters.status;
        if (statusValue === 'Pending') statusValue = 'active';
        if (statusValue === 'Resolved') statusValue = 'resolved';
        query += ` AND lfr.status = $${paramIndex}`;
        params.push(statusValue);
        paramIndex++;
      }

      if (filters.date) {
        query += ` AND lfr.incident_date = $${paramIndex}`;
        params.push(filters.date);
        paramIndex++;
      }

      console.log('📝 Executing count query:', query);
      console.log('📝 Count params:', params);

      const result = await pool.query(query, params);
      const count = parseInt(result.rows[0].total);
      
      console.log(`✅ Total count: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ Error in getCountWithFilters:', error);
      throw error;
    }
  }

  // Get a single report by ID
  static async getById(reportId) {
    try {
      console.log('🔍 IncidentReportModel.getById called with ID:', reportId);
      
      const query = `
        SELECT 
          lfr.report_id,
          lfr.passenger_id,
          lfr.incident_date,
          lfr.incident_time,
          COALESCE(CONCAT(pu.first_name, ' ', pu.last_name), SPLIT_PART(lfr.contact_email, '@', 1), 'Passenger') as passenger_name,
          INITCAP(lfr.report_type) as report_type,
          lfr.item_category,
          lfr.item_description,
          lfr.item_photo_url,
          lfr.route_number,
          NULL as bus_number,
          COALESCE(pu.email, lfr.contact_email) as contact_email,
          COALESCE(pu.phone, lfr.contact_phone) as contact_phone,
          CASE 
            WHEN lfr.status = 'active' THEN 'Pending'
            WHEN lfr.status = 'resolved' THEN 'Resolved'
            WHEN lfr.status = 'expired' THEN 'Expired'
            WHEN lfr.status = 'deleted' THEN 'Deleted'
            ELSE INITCAP(lfr.status)
          END as status,
          COALESCE(CONCAT(du.first_name, ' ', du.last_name), 'N/A') as driver_name,
          COALESCE(du.phone, 'N/A') as driver_phone,
          lfr.approximate_location as location_found,
          lfr.created_at,
          lfr.updated_at,
          NULL as resolved_by,
          lfr.resolved_date as resolution_date,
          NULL as resolution_notes
        FROM lost_found_reports lfr
        LEFT JOIN passengers p ON lfr.passenger_id = p.passenger_id
        LEFT JOIN users pu ON p.passenger_id = pu.user_id
        LEFT JOIN drivers d ON lfr.driver_id = d.driver_id
        LEFT JOIN users du ON d.driver_id = du.user_id
        WHERE lfr.report_id = $1
      `;

      const result = await pool.query(query, [reportId]);
      
      if (result.rows.length === 0) {
        console.log('❌ Report not found');
        return null;
      }
      
      console.log('✅ Report found:', result.rows[0].report_id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in getById:', error);
      throw error;
    }
  }

  // Resolve a report
  static async resolveReport(reportId, resolvedBy, resolutionNotes) {
    try {
      console.log('✅ IncidentReportModel.resolveReport called:', { reportId, resolvedBy, resolutionNotes });
      
      const query = `
        UPDATE lost_found_reports 
        SET 
          status = 'resolved',
          resolved_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE report_id = $1 AND status = 'active'
      `;

      const result = await pool.query(query, [reportId]);
      
      const success = result.rowCount > 0;
      console.log(success ? '✅ Report resolved successfully' : '❌ Report not found or already resolved');
      return success;
    } catch (error) {
      console.error('❌ Error in resolveReport:', error);
      throw error;
    }
  }

  // Update report status
  static async updateStatus(reportId, status) {
    try {
      console.log('🔄 IncidentReportModel.updateStatus called:', { reportId, status });
      
      let dbStatus = status;
      if (status === 'Pending') dbStatus = 'active';
      if (status === 'Resolved') dbStatus = 'resolved';
      
      const query = `
        UPDATE lost_found_reports 
        SET 
          status = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE report_id = $1
      `;

      const result = await pool.query(query, [reportId, dbStatus]);
      
      const success = result.rowCount > 0;
      console.log(success ? '✅ Status updated successfully' : '❌ Report not found');
      return success;
    } catch (error) {
      console.error('❌ Error in updateStatus:', error);
      throw error;
    }
  }

  // Get statistics
  static async getStatistics(filters = {}) {
    try {
      console.log('📊 IncidentReportModel.getStatistics called with filters:', filters);
      
      let query = `
        SELECT 
          COUNT(*) as total_reports,
          COUNT(CASE WHEN lfr.report_type = 'lost' THEN 1 END) as lost_reports,
          COUNT(CASE WHEN lfr.report_type = 'found' THEN 1 END) as found_reports,
          COUNT(CASE WHEN lfr.status = 'resolved' THEN 1 END) as resolved_reports,
          COUNT(CASE WHEN lfr.status = 'active' THEN 1 END) as pending_reports
        FROM lost_found_reports lfr
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (filters.date) {
        query += ` AND lfr.incident_date = $${paramIndex}`;
        params.push(filters.date);
        paramIndex++;
      }

      console.log('📝 Executing statistics query:', query);
      console.log('📝 Statistics params:', params);

      const result = await pool.query(query, params);
      
      const stats = {
        total_reports: parseInt(result.rows[0].total_reports) || 0,
        lost_reports: parseInt(result.rows[0].lost_reports) || 0,
        found_reports: parseInt(result.rows[0].found_reports) || 0,
        resolved_reports: parseInt(result.rows[0].resolved_reports) || 0,
        pending_reports: parseInt(result.rows[0].pending_reports) || 0
      };
      
      console.log('✅ Statistics retrieved:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error in getStatistics:', error);
      throw error;
    }
  }

  // Get available years from reports
  static async getAvailableYears() {
    try {
      console.log('📅 IncidentReportModel.getAvailableYears called');
      
      const query = `
        SELECT DISTINCT EXTRACT(YEAR FROM incident_date) as year 
        FROM lost_found_reports 
        WHERE incident_date IS NOT NULL
        ORDER BY year DESC
      `;

      const result = await pool.query(query);
      const years = result.rows.map(row => parseInt(row.year));
      
      console.log('✅ Available years retrieved:', years);
      return years;
    } catch (error) {
      console.error('❌ Error in getAvailableYears:', error);
      throw error;
    }
  }

  // Get available item categories
  static async getItemCategories() {
    try {
      console.log('📦 IncidentReportModel.getItemCategories called');
      
      const query = `
        SELECT DISTINCT item_category 
        FROM lost_found_reports 
        WHERE item_category IS NOT NULL AND item_category != ''
        ORDER BY item_category ASC
      `;

      const result = await pool.query(query);
      const categories = result.rows.map(row => row.item_category);
      
      console.log('✅ Available categories retrieved:', categories);
      return categories;
    } catch (error) {
      console.error('❌ Error in getItemCategories:', error);
      // Return default categories if query fails
      return ['phone', 'wallet', 'bag', 'keys', 'clothing', 'documents', 'electronics', 'jewelry', 'other'];
    }
  }
}

module.exports = IncidentReportModel;
