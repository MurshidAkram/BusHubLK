const db = require('../config/db');

class DailyAssignment {
  static async create({ date, bus_id, route_id, driver_id, conductor_id, depot_id, created_by, notes = null }) {
    const result = await db.query(
      `INSERT INTO daily_assignments 
       (date, bus_id, route_id, driver_id, conductor_id, depot_id, created_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [date, bus_id, route_id, driver_id, conductor_id, depot_id, created_by, notes]
    );
    return result.rows[0];
  }

  

  static async getByDepotAndDate(depot_id, date) {
    const result = await db.query(
      `SELECT da.*, 
              b.registration_number as bus_number,
              r.route_number, r.route_name,
              d.first_name as driver_first_name, d.last_name as driver_last_name,
              c.first_name as conductor_first_name, c.last_name as conductor_last_name
       FROM daily_assignments da
       JOIN buses b ON da.bus_id = b.bus_id
       JOIN routes r ON da.route_id = r.route_id
       JOIN users d ON da.driver_id = d.user_id
       JOIN users c ON da.conductor_id = c.user_id
       WHERE da.depot_id = $1 AND da.date = $2
       ORDER BY da.assignment_id`,
      [depot_id, date]
    );
    return result.rows;
  }

  static async updateStatus(assignment_id, status) {
    const result = await db.query(
      `UPDATE daily_assignments 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE assignment_id = $2
       RETURNING *`,
      [status, assignment_id]
    );
    return result.rows[0];
  }

  static async delete(assignment_id) {
    const result = await db.query(
      'DELETE FROM daily_assignments WHERE assignment_id = $1 RETURNING *',
      [assignment_id]
    );
    return result.rows[0];
  }

  static async getAvailableBuses(depot_id, date) {
    const result = await db.query(
      `SELECT b.* 
       FROM buses b
       WHERE b.depot_id = $1 
       AND b.status = 'Active'
       AND b.bus_id NOT IN (
         SELECT bus_id 
         FROM daily_assignments 
         WHERE date = $2 AND status != 'Cancelled'
       )`,
      [depot_id, date]
    );
    return result.rows;
  }

  static async getAvailableDrivers(depot_id, date) {
    const result = await db.query(
      `SELECT u.* 
       FROM users u
       JOIN drivers d ON u.user_id = d.driver_id
       WHERE d.depot_id = $1 
       AND u.is_active = TRUE
       AND u.user_id NOT IN (
         SELECT driver_id 
         FROM daily_assignments 
         WHERE date = $2 AND status != 'Cancelled'
       )`,
      [depot_id, date]
    );
    return result.rows;
  }

  static async getAvailableConductors(depot_id, date) {
    const result = await db.query(
      `SELECT u.* 
       FROM users u
       JOIN conductors c ON u.user_id = c.conductor_id
       WHERE c.depot_id = $1 
       AND u.is_active = TRUE
       AND u.user_id NOT IN (
         SELECT conductor_id 
         FROM daily_assignments 
         WHERE date = $2 AND status != 'Cancelled'
       )`,
      [depot_id, date]
    );
    return result.rows;
  }
}

module.exports = DailyAssignment;