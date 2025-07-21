const db = require('../config/db');

class DepotEngineer {
  static async findByUserId(user_id) {
    const result = await db.query(
      `SELECT de.*, d.depot_name, r.region_name 
       FROM depot_engineers de
       JOIN depots d ON de.depot_id = d.depot_id
       JOIN regions r ON de.region_id = r.region_id
       WHERE de.depot_engineer_id = $1`,
      [user_id]
    );
    return result.rows[0];
  }

  static async create({ depot_engineer_id, depot_id, region_id, appointment_date }) {
    const result = await db.query(
      `INSERT INTO depot_engineers 
       (depot_engineer_id, depot_id, region_id, appointment_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [depot_engineer_id, depot_id, region_id, appointment_date || new Date()]
    );
    return result.rows[0];
  }

  static async getBusesByDepot(depot_id) {
    const result = await db.query(
      `SELECT b.*, d.depot_name, r.region_name
       FROM buses b
       LEFT JOIN depots d ON b.depot_id = d.depot_id
       LEFT JOIN regions r ON d.region_id = r.region_id
       WHERE b.depot_id = $1 AND b.is_deleted = FALSE
       ORDER BY b.bus_id`,
      [depot_id]
    );
    return result.rows;
  }
}

module.exports = DepotEngineer;