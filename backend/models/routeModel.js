const db = require('../config/db');

class Route {
  static async getAll() {
    const result = await db.query(
      `SELECT * FROM routes ORDER BY route_id`
    );
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query(
      `SELECT * FROM routes WHERE route_id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(data) {
    const {
      route_number,
      route_name,
      start_location,
      end_location,
      distance_km,
      estimated_duration_minutes,
      is_active = true
    } = data;
    const result = await db.query(
      `INSERT INTO routes 
        (route_number, route_name, start_location, end_location, distance_km, estimated_duration_minutes, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [route_number, route_name, start_location, end_location, distance_km, estimated_duration_minutes, is_active]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const {
      route_number,
      route_name,
      start_location,
      end_location,
      distance_km,
      estimated_duration_minutes,
      is_active
    } = data;
    const result = await db.query(
      `UPDATE routes SET
        route_number = $1,
        route_name = $2,
        start_location = $3,
        end_location = $4,
        distance_km = $5,
        estimated_duration_minutes = $6,
        is_active = $7,
        updated_at = NOW()
       WHERE route_id = $8
       RETURNING *`,
      [route_number, route_name, start_location, end_location, distance_km, estimated_duration_minutes, is_active, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      `DELETE FROM routes WHERE route_id = $1 RETURNING route_id`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Route;