const db = require('../config/db');

class Route {
  static async getAll() {
    const result = await db.query(
      `SELECT r.*, d.depot_name
       FROM routes r
       LEFT JOIN depots d ON r.depot_id = d.depot_id
       WHERE r.is_active = TRUE
       ORDER BY r.route_id`
    );
    return result.rows;
  }

  static async create({ route_number, route_name, depot_id, start_location, end_location, distance_km, estimated_duration_minutes }) {
    const result = await db.query(
      `INSERT INTO routes 
        (route_number, route_name, depot_id, start_location, end_location, distance_km, estimated_duration_minutes, is_active, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,NOW(),NOW())
        RETURNING *`,
      [route_number, route_name, depot_id, start_location, end_location, distance_km, estimated_duration_minutes]
    );
    return result.rows[0];
  }

  static async update(route_id, updates) {
    const allowedFields = ['route_number', 'route_name', 'depot_id', 'start_location', 'end_location', 'distance_km', 'estimated_duration_minutes', 'is_active'];
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
    updateFields.push(`updated_at = NOW()`);
    values.push(route_id);

    const result = await db.query(
      `UPDATE routes SET ${updateFields.join(', ')}
       WHERE route_id = $${paramCount}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async deactivate(route_id) {
    const result = await db.query(
      `UPDATE routes SET is_active = FALSE, updated_at = NOW() WHERE route_id = $1 RETURNING *`,
      [route_id]
    );
    return result.rows[0];
  }
}

module.exports = Route;