const db = require('../config/db');

class Bus {
  static async create({ registration_number, depot_id, class: busClass, manufacturer, model, year, mileage, status, purchase_date}) {
    const result = await db.query(
      `INSERT INTO buses 
       (registration_number, depot_id, class, manufacturer, model, year, mileage, status, purchase_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [registration_number, depot_id, busClass, manufacturer, model, year, mileage, status, purchase_date]
    );
    return result.rows[0];
  }

  static async findById(bus_id) {
    const result = await db.query(
      `SELECT b.*, d.depot_name, r.region_name, r.region_id
       FROM buses b
       LEFT JOIN depots d ON b.depot_id = d.depot_id
       LEFT JOIN regions r ON d.region_id = r.region_id
       WHERE b.bus_id = $1 AND b.is_deleted = FALSE`,
      [bus_id]
    );
    return result.rows[0];
  }

  static async findByRegistration(registration_number) {
    const result = await db.query(
      `SELECT b.*, d.depot_name, r.region_name, r.region_id
       FROM buses b
       LEFT JOIN depots d ON b.depot_id = d.depot_id
       LEFT JOIN regions r ON d.region_id = r.region_id
       WHERE b.registration_number = $1 AND b.is_deleted = FALSE`,
      [registration_number]
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await db.query(
      `SELECT b.*, d.depot_name, r.region_name, r.region_id
       FROM buses b
       LEFT JOIN depots d ON b.depot_id = d.depot_id
       LEFT JOIN regions r ON d.region_id = r.region_id
       WHERE b.is_deleted = FALSE
       ORDER BY b.bus_id`
    );
    return result.rows;
  }

  static async getByDepot(depot_id) {
    const result = await db.query(
      `SELECT b.*, d.depot_name, r.region_name, r.region_id
       FROM buses b
       LEFT JOIN depots d ON b.depot_id = d.depot_id
       LEFT JOIN regions r ON d.region_id = r.region_id
       WHERE b.depot_id = $1 AND b.is_deleted = FALSE
       ORDER BY b.bus_id`,
      [depot_id]
    );
    return result.rows;
  }

  static async getByRegion(region_id) {
    const result = await db.query(
      `SELECT b.*, d.depot_name, r.region_name, r.region_id
       FROM buses b
       LEFT JOIN depots d ON b.depot_id = d.depot_id
       LEFT JOIN regions r ON d.region_id = r.region_id
       WHERE d.region_id = $1 AND b.is_deleted = FALSE
       ORDER BY b.bus_id`,
      [region_id]
    );
    return result.rows;
  }

  static async getByStatus(status) {
    const result = await db.query(
      `SELECT b.*, d.depot_name, r.region_name, r.region_id
       FROM buses b
       LEFT JOIN depots d ON b.depot_id = d.depot_id
       LEFT JOIN regions r ON d.region_id = r.region_id
       WHERE b.status = $1 AND b.is_deleted = FALSE
       ORDER BY b.bus_id`,
      [status]
    );
    return result.rows;
  }

  static async getByClass(busClass) {
    const result = await db.query(
      `SELECT b.*, d.depot_name, r.region_name, r.region_id
       FROM buses b
       LEFT JOIN depots d ON b.depot_id = d.depot_id
       LEFT JOIN regions r ON d.region_id = r.region_id
       WHERE b.class = $1 AND b.is_deleted = FALSE
       ORDER BY b.bus_id`,
      [busClass]
    );
    return result.rows;
  }

  static async update(bus_id, updates) {
    const allowedFields = ['registration_number', 'depot_id', 'class', 'manufacturer', 'model', 'year', 'mileage', 'status', 'purchase_date', 'is_active'];
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
    values.push(bus_id);

    const result = await db.query(
      `UPDATE buses SET ${updateFields.join(', ')} 
       WHERE bus_id = $${paramCount} AND is_deleted = FALSE
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(bus_id) {
    const result = await db.query(
      `UPDATE buses 
       SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP 
       WHERE bus_id = $1 
       RETURNING bus_id`,
      [bus_id]
    );
    return result.rows[0];
  }

  static async search(query) {
    const result = await db.query(
      `SELECT b.*, d.depot_name, r.region_name, r.region_id
       FROM buses b
       LEFT JOIN depots d ON b.depot_id = d.depot_id
       LEFT JOIN regions r ON d.region_id = r.region_id
       WHERE (b.registration_number ILIKE $1 OR 
             b.manufacturer ILIKE $1 OR 
             b.model ILIKE $1) AND 
             b.is_deleted = FALSE
       ORDER BY b.bus_id`,
      [`%${query}%`]
    );
    return result.rows;
  }
}

module.exports = Bus;