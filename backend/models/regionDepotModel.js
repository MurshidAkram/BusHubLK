const db = require('../config/db'); // Adjust the path as necessary

class RegionDepot {
  // Region operations
  static async getAllRegions() {
    const result = await db.query(
      `SELECT reg.*, 
         u_rto.first_name AS rto_first_name,
         u_rto.last_name AS rto_last_name,
         u_rto.phone AS rto_phone,
         u_roo.first_name AS roo_first_name,
         u_roo.last_name AS roo_last_name,
         u_roo.phone AS roo_phone
       FROM regions reg
       LEFT JOIN regional_technical_officers rto ON rto.region_id = reg.region_id
       LEFT JOIN users u_rto ON u_rto.user_id = rto.rto_id
       LEFT JOIN regional_operations_officers roo ON roo.region_id = reg.region_id
       LEFT JOIN users u_roo ON u_roo.user_id = roo.roo_id
       ORDER BY reg.region_id`
    );
    return result.rows.map(row => ({
      ...row,
      rto_name: row.rto_first_name || row.rto_last_name ? `${row.rto_first_name || ''} ${row.rto_last_name || ''}`.trim() : null,
      rto_phone: row.rto_phone || null,
      roo_name: row.roo_first_name || row.roo_last_name ? `${row.roo_first_name || ''} ${row.roo_last_name || ''}`.trim() : null,
      roo_phone: row.roo_phone || null
    }));
  }

  static async getRegionById(region_id) {
    const result = await db.query('SELECT * FROM regions WHERE region_id = $1', [region_id]);
    return result.rows[0];
  }

  static async createRegion(region_name) {
    const result = await db.query(
      'INSERT INTO regions (region_name) VALUES ($1) RETURNING *',
      [region_name]
    );
    return result.rows[0];
  }

  // Depot operations
  static async getAllDepots() {
    const result = await db.query(
      `SELECT d.*, r.region_name 
       FROM depots d 
       JOIN regions r ON d.region_id = r.region_id 
       ORDER BY d.depot_id`
    );
    return result.rows;
  }

  static async getDepotById(depot_id) {
    const result = await db.query(
      `SELECT d.*, r.region_name 
       FROM depots d 
       JOIN regions r ON d.region_id = r.region_id 
       WHERE d.depot_id = $1`,
      [depot_id]
    );
    return result.rows[0];
  }

  static async getDepotsByRegion(region_id) {
    const result = await db.query(
      `SELECT d.*, r.region_name 
       FROM depots d 
       JOIN regions r ON d.region_id = r.region_id 
       WHERE d.region_id = $1 
       ORDER BY d.depot_id`,
      [region_id]
    );
    return result.rows;
  }

  static async createDepot({ depot_name, region_id, address, contact_phone, latitude, longitude }) {
    const result = await db.query(
      `INSERT INTO depots (depot_name, region_id, address, contact_phone, latitude, longitude) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [depot_name, region_id, address, contact_phone, latitude, longitude]
    );
    return result.rows[0];
  }

  static async updateDepot(depot_id, updates) {
    const allowedFields = ['depot_name', 'region_id', 'address', 'contact_phone', 'latitude', 'longitude'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(depot_id);

    const result = await db.query(
      `UPDATE depots SET ${updateFields.join(', ')} 
       WHERE depot_id = $${paramCount} 
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async deleteDepot(depot_id) {
    const result = await db.query(
      'DELETE FROM depots WHERE depot_id = $1 RETURNING *',
      [depot_id]
    );
    return result.rows[0];
  }

  // Get bus status counts for a depot
  static async getBusStatusCounts(depot_id) {
    const result = await db.query(
      `SELECT 
         COUNT(CASE WHEN status = 'Active' THEN 1 END)::integer as active,
         COUNT(CASE WHEN status = 'In Service' THEN 1 END)::integer as in_service,
         COUNT(CASE WHEN status = 'Out of Service' THEN 1 END)::integer as out_of_service,
         COUNT(CASE WHEN status = 'Maintenance' THEN 1 END)::integer as under_maintenance
       FROM buses 
       WHERE depot_id = $1 AND is_active = true AND is_deleted = false`,
      [depot_id]
    );
    return result.rows[0];
  }

  // Get last completed inspection date for a depot
  static async getLastInspectionDate(depot_id) {
    const result = await db.query(
      `SELECT MAX(date) as last_inspection_date
       FROM inspections 
       WHERE depot_id = $1 AND status = 'Completed'`,
      [depot_id]
    );
    return result.rows[0];
  }

  // Get detailed bus list for a depot
  static async getBusDetailsByDepot(depot_id) {
    const result = await db.query(
      `SELECT 
         b.bus_id,
         b.registration_number,
         b.class,
         b.manufacturer,
         b.model,
         b.year,
         b.mileage,
         b.status,
         b.is_active
       FROM buses b
       WHERE b.depot_id = $1
         AND b.is_deleted = FALSE
       ORDER BY b.registration_number ASC`,
      [depot_id]
    );
    return result.rows;
  }

  // Get depots by region for a regional technical officer
  static async getDepotsByRegionForUser(user_id) {
    const result = await db.query(
      `SELECT d.depot_id, d.depot_name, d.region_id, r.region_name
       FROM depots d
       JOIN regions r ON d.region_id = r.region_id
       JOIN regional_technical_officers rto ON rto.region_id = d.region_id
       WHERE rto.rto_id = $1
       ORDER BY d.depot_name`,
      [user_id]
    );
    return result.rows;
  }
}

module.exports = RegionDepot;