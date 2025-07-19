const db = require('../config/db');

class DailyAssignment {
  static async getAllByDepot(depot_id) {
    const result = await db.query(
      `SELECT da.assignment_id, da.depot_id, da.bus_id, da.route_id, da.driver_id, da.conductor_id,
              b.registration_number AS bus_name,
              r.route_number || ': ' || r.route_name AS route_name,
              d.depot_name,
              udriver.name AS driver_name,
              uconductor.name AS conductor_name,
              da.created_at, da.updated_at
       FROM dailyassignment da
       JOIN buses b ON da.bus_id = b.bus_id
       JOIN routes r ON da.route_id = r.route_id
       JOIN depots d ON da.depot_id = d.depot_id
       JOIN users udriver ON da.driver_id = udriver.user_id
       JOIN users uconductor ON da.conductor_id = uconductor.user_id
       WHERE da.depot_id = $1
       ORDER BY da.assignment_id DESC`,
      [depot_id]
    );
    return result.rows;
  }

  static async create({ depot_id, bus_id, route_id, driver_id, conductor_id }) {
    const result = await db.query(
      `INSERT INTO dailyassignment (depot_id, bus_id, route_id, driver_id, conductor_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [depot_id, bus_id, route_id, driver_id, conductor_id]
    );
    return result.rows[0];
  }

  static async update(assignment_id, updates) {
    const allowedFields = ['bus_id', 'route_id', 'driver_id', 'conductor_id'];
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }
    if (setClauses.length === 0) throw new Error('No valid fields to update');

    values.push(assignment_id);
    const result = await db.query(
      `UPDATE dailyassignment SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE assignment_id = $${idx}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(assignment_id) {
    const result = await db.query(
      `DELETE FROM dailyassignment WHERE assignment_id = $1 RETURNING assignment_id`,
      [assignment_id]
    );
    return result.rows[0];
  }

  static async findById(assignment_id) {
    const result = await db.query(
      `SELECT * FROM dailyassignment WHERE assignment_id = $1`,
      [assignment_id]
    );
    return result.rows[0];
  }
}

module.exports = DailyAssignment;
