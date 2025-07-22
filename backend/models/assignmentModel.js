const db = require('../config/db');

class Assignment {
  static async create({ depot_id, bus_id, route_id, driver_id, conductor_id, assignment_date, shift_start_time, shift_end_time, status }) {
    const result = await db.query(
      `INSERT INTO dailyassignment 
       (depot_id, bus_id, route_id, driver_id, conductor_id, assignment_date, shift_start_time, shift_end_time, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        depot_id,
        bus_id,
        route_id,
        driver_id,
        conductor_id,
        assignment_date,
        shift_start_time,
        shift_end_time,
        status
      ]
    );
    return result.rows[0];
  }

  static async getByDepot(depot_id) {
    const result = await db.query(
      `SELECT 
        a.assignment_id,
        a.bus_id,
        b.registration_number as bus_registration,
        a.route_id,
        r.route_number || ': ' || r.route_name as route_name,
        a.driver_id,
        d.first_name || ' ' || d.last_name as driver_name,
        a.conductor_id,
        c.first_name || ' ' || c.last_name as conductor_name,
        a.depot_id,
        a.assignment_date, -- ADD THIS
        a.shift_start_time, -- ADD THIS
        a.shift_end_time, -- ADD THIS
        a.status -- ADD THIS
       FROM dailyassignment a
       JOIN buses b ON a.bus_id = b.bus_id
       JOIN routes r ON a.route_id = r.route_id
       JOIN users d ON a.driver_id = d.user_id
       JOIN users c ON a.conductor_id = c.user_id
       WHERE a.depot_id = $1 AND a.is_active = TRUE
       ORDER BY a.assignment_date DESC, a.shift_start_time DESC`, // Better sorting
      [depot_id]
    );
    return result.rows;
  }
// ...
  static async update(assignment_id, { bus_id, route_id, driver_id, conductor_id }) {
    const result = await db.query(
      `UPDATE dailyassignment 
       SET 
         bus_id = $1,
         route_id = $2,
         driver_id = $3,
         conductor_id = $4,
         updated_at = NOW()
       WHERE assignment_id = $5
       RETURNING *`,
      [bus_id, route_id, driver_id, conductor_id, assignment_id]
    );
    return result.rows[0];
  }

  static async delete(assignment_id) {
    const result = await db.query(
      `UPDATE dailyassignment 
       SET is_active = FALSE, updated_at = NOW() 
       WHERE assignment_id = $1 
       RETURNING assignment_id`,
      [assignment_id]
    );
    return result.rows[0];
  }
}

module.exports = Assignment;