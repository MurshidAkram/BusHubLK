const db = require('../config/db'); // Adjust the path as necessary

class RegionDepot {
  // Region operations
  static async getAllRegions() {
    const result = await db.query('SELECT * FROM regions ORDER BY region_id');
    return result.rows;
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
}

module.exports = RegionDepot;