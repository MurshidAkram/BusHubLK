const db = require('../config/db');

class LostFoundReport {
  constructor(data) {
    this.report_id = data.report_id;
    this.passenger_id = data.passenger_id;
    this.driver_id = data.driver_id;
    this.report_type = data.report_type;
    this.report_reference = data.report_reference;
    this.item_category = data.item_category;
    this.item_description = data.item_description;
    this.item_photo_url = data.item_photo_url;
    this.route_number = data.route_number;
    this.region_id = data.region_id;
    this.approximate_location = data.approximate_location;
    this.incident_date = data.incident_date;
    this.incident_time = data.incident_time;
    this.contact_email = data.contact_email;
    this.contact_phone = data.contact_phone;
    this.reward_offered = data.reward_offered;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.expires_at = data.expires_at;
    this.resolved_date = data.resolved_date;
    // Depot handover fields
    this.handed_to_depot_id = data.handed_to_depot_id;
    this.handover_date = data.handover_date;
    this.handover_notes = data.handover_notes;
    this.handover_updated_by = data.handover_updated_by;
  }

  // Create a new report
  static async create(reportData) {
    const query = `
      INSERT INTO lost_found_reports (
        passenger_id, driver_id, report_type, report_reference, item_category, 
        item_description, item_photo_url, route_number, region_id,
        approximate_location, incident_date, incident_time, 
        contact_email, contact_phone, reward_offered
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const values = [
      reportData.passenger_id,
      reportData.driver_id || null,
      reportData.report_type,
      reportData.report_reference,
      reportData.item_category,
      reportData.item_description,
      reportData.item_photo_url || null,
      reportData.route_number || null,
      reportData.region_id || null,
      reportData.approximate_location || null,
      reportData.incident_date,
      reportData.incident_time,
      reportData.contact_email || null,
      reportData.contact_phone,
      reportData.reward_offered || 0
    ];

    const result = await db.query(query, values);
    return new LostFoundReport(result.rows[0]);
  }

  // Find report by ID
  static async findById(reportId) {
    const query = 'SELECT * FROM lost_found_reports WHERE report_id = $1';
    const result = await db.query(query, [reportId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new LostFoundReport(result.rows[0]);
  }

  // Find report by reference
  static async findByReference(reference) {
    const query = 'SELECT * FROM lost_found_reports WHERE report_reference = $1';
    const result = await db.query(query, [reference]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new LostFoundReport(result.rows[0]);
  }

  // Find all reports with optional filters
  static async findAll(filters = {}) {
    let query = `
      SELECT
        r.*,
        p.first_name,
        p.last_name,
        COALESCE(CONCAT(drv.first_name, ' ', drv.last_name), 'Unknown') as driver_name,
        rt.route_name,
        reg.region_name,
        d.depot_name,
        d.contact_phone as depot_contact_phone,
        driver_depot.depot_name as driver_depot_name,
        driver_depot.contact_phone as driver_depot_phone,
        r.handover_date,
        r.handover_notes,
        CASE
          WHEN r.created_at > NOW() - INTERVAL '1 minute' THEN 'Just now'
          WHEN r.created_at > NOW() - INTERVAL '1 hour' THEN EXTRACT(MINUTE FROM NOW() - r.created_at) || ' minutes ago'
          WHEN r.created_at > NOW() - INTERVAL '1 day' THEN EXTRACT(HOUR FROM NOW() - r.created_at) || ' hours ago'
          ELSE EXTRACT(DAY FROM NOW() - r.created_at) || ' days ago'
        END as time_ago
      FROM lost_found_reports r
      LEFT JOIN passengers pas ON r.passenger_id = pas.passenger_id
      LEFT JOIN users p ON pas.passenger_id = p.user_id
      LEFT JOIN users drv ON r.driver_id = drv.user_id
      LEFT JOIN routes rt ON r.route_number = rt.route_number
      LEFT JOIN regions reg ON r.region_id = reg.region_id
      LEFT JOIN depots d ON r.handed_to_depot_id = d.depot_id
      LEFT JOIN (
        SELECT DISTINCT ON (d.driver_id) d.driver_id, dep.depot_name, dep.contact_phone
        FROM drivers d
        JOIN depots dep ON d.depot_id = dep.depot_id
      ) driver_depot ON r.driver_id = driver_depot.driver_id
      WHERE r.status = $1
    `;
    
    const values = ['active'];
    let paramCount = 1;

    // Add filters dynamically
    if (filters.item_category) {
      paramCount++;
      query += ` AND r.item_category = $${paramCount}`;
      values.push(filters.item_category);
    }

    if (filters.report_type) {
      paramCount++;
      query += ` AND r.report_type = $${paramCount}`;
      values.push(filters.report_type);
    }

    if (filters.route_number) {
      paramCount++;
      query += ` AND r.route_number = $${paramCount}`;
      values.push(filters.route_number);
    }

    if (filters.region_id) {
      paramCount++;
      query += ` AND r.region_id = $${paramCount}`;
      values.push(filters.region_id);
    }

    if (filters.passenger_id) {
      paramCount++;
      query += ` AND r.passenger_id = $${paramCount}`;
      values.push(filters.passenger_id);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (r.item_description ILIKE $${paramCount} OR r.approximate_location ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
    }

    // Add pagination
    query += ` ORDER BY r.created_at DESC`;
    
    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    if (filters.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
    }

    const result = await db.query(query, values);
    return result.rows.map(row => ({
      ...new LostFoundReport(row),
      first_name: row.first_name,
      last_name: row.last_name,
      driver_name: row.driver_name,
      route_name: row.route_name,
      region_name: row.region_name,
      depot_name: row.depot_name,
      depot_contact_phone: row.depot_contact_phone,
      driver_depot_name: row.driver_depot_name,
      driver_depot_phone: row.driver_depot_phone,
      handover_date: row.handover_date,
      handover_notes: row.handover_notes,
      time_ago: row.time_ago
    }));
  }

  // Update report
  static async update(reportId, updateData) {
    const setClause = [];
    const values = [];
    let paramCount = 0;

    // Build dynamic update query
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        paramCount++;
        setClause.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
      }
    });

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    paramCount++;
    values.push(reportId);

    const query = `
      UPDATE lost_found_reports 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE report_id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new LostFoundReport(result.rows[0]);
  }

  // Delete report (soft delete by setting status to 'deleted')
  static async delete(reportId) {
    const query = `
      UPDATE lost_found_reports 
      SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
      WHERE report_id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [reportId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new LostFoundReport(result.rows[0]);
  }

  // Check for duplicates
  static async checkDuplicate(passenger_id, item_category, item_description, incident_date, incident_time) {
    const query = `
      SELECT COUNT(*) as count
      FROM lost_found_reports
      WHERE passenger_id = $1 
        AND item_category = $2 
        AND item_description = $3 
        AND incident_date = $4 
        AND incident_time = $5
        AND status = 'active'
        AND created_at > NOW() - INTERVAL '24 hours'
    `;
    
    const result = await db.query(query, [
      passenger_id, 
      item_category, 
      item_description, 
      incident_date, 
      incident_time
    ]);
    
    return parseInt(result.rows[0].count) > 0;
  }

  // Find potential matches
  static async findPotentialMatches(reportId) {
    const query = `
      SELECT * FROM find_potential_matches(
        (SELECT report_type FROM lost_found_reports WHERE report_id = $1),
        (SELECT item_category FROM lost_found_reports WHERE report_id = $1),
        (SELECT item_description FROM lost_found_reports WHERE report_id = $1),
        (SELECT route_number FROM lost_found_reports WHERE report_id = $1),
        (SELECT region_id FROM lost_found_reports WHERE report_id = $1),
        (SELECT incident_date FROM lost_found_reports WHERE report_id = $1)
      )
    `;
    
    const result = await db.query(query, [reportId]);
    return result.rows;
  }

  // Get statistics
  static async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN report_type = 'lost' THEN 1 END) as lost_reports,
        COUNT(CASE WHEN report_type = 'found' THEN 1 END) as found_reports,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_reports
      FROM lost_found_reports
      WHERE status != 'deleted'
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  }

  // Clean up expired reports
  static async cleanupExpiredReports() {
    const query = `
      UPDATE lost_found_reports 
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE expires_at < CURRENT_TIMESTAMP 
        AND status = 'active'
      RETURNING COUNT(*) as expired_count
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  }
}

module.exports = LostFoundReport;