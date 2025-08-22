const db = require('../config/db');

class DriverFoundItem {
  constructor(data) {
    this.id = data.id;
    this.reference = data.reference;
    this.item_category = data.item_category;
    this.item_description = data.item_description;
    this.item_photo_url = data.item_photo_url;
    this.location_found = data.location_found;
    this.route_number = data.route_number;
    this.bus_number = data.bus_number;
    this.incident_date = data.incident_date;
    this.incident_time = data.incident_time;
    this.driver_name = data.driver_name;
    this.driver_phone = data.driver_phone;
    this.driver_email = data.driver_email;
    this.status = data.status;
    this.claimed_by_name = data.claimed_by_name;
    this.claimed_by_phone = data.claimed_by_phone;
    this.claimed_at = data.claimed_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new found item report
  static async create(itemData) {
    const query = `
      INSERT INTO driver_found_items (
        reference, item_category, item_description, item_photo_url,
        location_found, route_number, bus_number, incident_date, 
        incident_time, driver_name, driver_phone, driver_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      itemData.reference,
      itemData.item_category,
      itemData.item_description,
      itemData.item_photo_url || null,
      itemData.location_found,
      itemData.route_number,
      itemData.bus_number,
      itemData.incident_date,
      itemData.incident_time,
      itemData.driver_name,
      itemData.driver_phone,
      itemData.driver_email || null
    ];

    const result = await db.query(query, values);
    return new DriverFoundItem(result.rows[0]);
  }

  // Find found item by ID
  static async findById(id) {
    const query = 'SELECT * FROM driver_found_items WHERE id = $1';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new DriverFoundItem(result.rows[0]);
  }

  // Find found item by reference
  static async findByReference(reference) {
    const query = 'SELECT * FROM driver_found_items WHERE reference = $1';
    const result = await db.query(query, [reference]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new DriverFoundItem(result.rows[0]);
  }

  // Find all found items with optional filters
  static async findAll(filters = {}) {
    let query = `
      SELECT 
        *,
        CASE
          WHEN created_at > NOW() - INTERVAL '1 hour' THEN 'Less than an hour ago'
          WHEN created_at > NOW() - INTERVAL '1 day' THEN EXTRACT(HOUR FROM NOW() - created_at) || ' hours ago'
          ELSE EXTRACT(DAY FROM NOW() - created_at) || ' days ago'
        END as time_ago
      FROM driver_found_items
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;

    // Apply filters
    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters.item_category) {
      paramCount++;
      query += ` AND LOWER(item_category) = LOWER($${paramCount})`;
      values.push(filters.item_category);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (
        LOWER(item_description) LIKE LOWER($${paramCount}) OR 
        LOWER(item_category) LIKE LOWER($${paramCount}) OR
        LOWER(location_found) LIKE LOWER($${paramCount}) OR
        route_number LIKE $${paramCount} OR
        bus_number LIKE UPPER($${paramCount})
      )`;
      values.push(`%${filters.search}%`);
    }

    // Order by creation date (newest first)
    query += ' ORDER BY created_at DESC';

    // Apply limit if provided
    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    console.log('🔍 Executing query:', query);
    console.log('📋 With values:', values);

    const result = await db.query(query, values);
    return result.rows.map(row => new DriverFoundItem(row));
  }

  // Update found item status
  static async updateStatus(id, updateData) {
    const { status, claimed_by_name, claimed_by_phone, claimed_at } = updateData;
    
    let query = `
      UPDATE driver_found_items 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
    `;
    const values = [status];
    let paramCount = 1;

    if (claimed_by_name) {
      paramCount++;
      query += `, claimed_by_name = $${paramCount}`;
      values.push(claimed_by_name);
    }

    if (claimed_by_phone) {
      paramCount++;
      query += `, claimed_by_phone = $${paramCount}`;
      values.push(claimed_by_phone);
    }

    if (claimed_at) {
      paramCount++;
      query += `, claimed_at = $${paramCount}`;
      values.push(claimed_at);
    }

    paramCount++;
    query += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new DriverFoundItem(result.rows[0]);
  }

  // Get statistics
  static async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN status = 'unclaimed' THEN 1 END) as unclaimed_items,
        COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed_items,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as items_this_week,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as items_this_month
      FROM driver_found_items
    `;

    const result = await db.query(query);
    return result.rows[0];
  }

  // Check for similar items (to prevent duplicates)
  static async checkSimilar(itemCategory, description, routeNumber, busNumber, incidentDate) {
    const query = `
      SELECT * FROM driver_found_items 
      WHERE LOWER(item_category) = LOWER($1) 
        AND LOWER(item_description) LIKE LOWER($2)
        AND route_number = $3
        AND bus_number = $4
        AND incident_date = $5
      LIMIT 1
    `;

    const result = await db.query(query, [
      itemCategory,
      `%${description}%`,
      routeNumber,
      busNumber,
      incidentDate
    ]);

    return result.rows.length > 0 ? new DriverFoundItem(result.rows[0]) : null;
  }
}

module.exports = DriverFoundItem;
