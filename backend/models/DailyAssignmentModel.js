const db = require('../config/db');

class DailyAssignment {
  static async getAllByDepot(depot_id) {
    const result = await db.query(
      `SELECT da.assignment_id, da.depot_id, da.bus_id, da.route_id, da.driver_id, da.conductor_id,
              b.registration_number AS bus_name,
              r.route_number || ': ' || r.route_name AS route_name,
              d.depot_name,
              CONCAT(udriver.first_name, ' ', udriver.last_name) AS driver_name,
              CASE 
                WHEN uconductor.user_id IS NOT NULL 
                THEN CONCAT(uconductor.first_name, ' ', uconductor.last_name)
                ELSE NULL
              END AS conductor_name,
              da.created_at, da.updated_at
       FROM dailyassignment da
       JOIN buses b ON da.bus_id = b.bus_id
       JOIN routes r ON da.route_id = r.route_id
       JOIN depots d ON da.depot_id = d.depot_id
       JOIN users udriver ON da.driver_id = udriver.user_id
       LEFT JOIN users uconductor ON da.conductor_id = uconductor.user_id
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

  // Create a template slot for a route
  static async createTemplateSlot({ depot_id, route_id, shift_start_time, shift_end_time }) {
    try {
      const result = await db.query(
        `INSERT INTO dailyassignment 
          (depot_id, bus_id, route_id, driver_id, conductor_id, shift_start_time, shift_end_time, status, is_active, assignment_date)
         VALUES ($1, 30, $2, 56, 57, $3, $4, 'template', TRUE, '1970-01-01')
         RETURNING *`,
        [depot_id, route_id, shift_start_time, shift_end_time]
      );
      return result.rows[0];
    } catch (err) {
      console.error('DailyAssignment.createTemplateSlot error:', err);
      throw err;
    }
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

  static async getByDriverId(driver_id) {
    const result = await db.query(
      `SELECT da.assignment_id, da.depot_id, da.bus_id, da.route_id, da.driver_id, da.conductor_id,
              da.assignment_date, da.shift_start_time, da.shift_end_time, da.status,
              b.registration_number,
              b.class AS bus_class,
              b.manufacturer,
              b.model,
              b.status AS bus_status,
              r.route_number,
              r.route_name,
              r.start_location,
              r.end_location,
              d.depot_name,
              CONCAT(udriver.first_name, ' ', udriver.last_name) AS driver_name,
              CASE 
                WHEN uconductor.user_id IS NOT NULL 
                THEN CONCAT(uconductor.first_name, ' ', uconductor.last_name)
                ELSE NULL
              END AS conductor_name,
              da.created_at, da.updated_at
       FROM dailyassignment da
       JOIN buses b ON da.bus_id = b.bus_id
       JOIN routes r ON da.route_id = r.route_id
       JOIN depots d ON da.depot_id = d.depot_id
       JOIN users udriver ON da.driver_id = udriver.user_id
       LEFT JOIN users uconductor ON da.conductor_id = uconductor.user_id
       WHERE da.driver_id = $1 
         AND da.is_active = true 
         AND da.assignment_date >= CURRENT_DATE - INTERVAL '1 day'
         AND da.assignment_date <= CURRENT_DATE + INTERVAL '7 days'
       ORDER BY 
         CASE 
           WHEN da.assignment_date = CURRENT_DATE THEN 1
           WHEN da.assignment_date > CURRENT_DATE THEN 2
           ELSE 3
         END,
         da.assignment_date ASC, 
         da.shift_start_time ASC
       LIMIT 1`,
      [driver_id]
    );
    return result.rows[0]; // Return most relevant assignment (today first, then future, then recent past)
  }

  // Get upcoming assignments for a driver
  static async getUpcomingByDriverId(driver_id, days = 7) {
    const result = await db.query(
      `SELECT da.assignment_id, da.depot_id, da.bus_id, da.route_id, da.driver_id, da.conductor_id,
              da.assignment_date, da.shift_start_time, da.shift_end_time, da.status,
              b.registration_number AS bus_registration,
              b.class AS bus_class,
              b.manufacturer AS bus_manufacturer,
              b.model AS bus_model,
              r.route_number,
              r.route_name,
              r.start_location,
              r.end_location,
              d.depot_name,
              CONCAT(udriver.first_name, ' ', udriver.last_name) AS driver_name,
              CASE 
                WHEN uconductor.user_id IS NOT NULL 
                THEN CONCAT(uconductor.first_name, ' ', uconductor.last_name)
                ELSE NULL
              END AS conductor_name,
              da.created_at, da.updated_at
       FROM dailyassignment da
       JOIN buses b ON da.bus_id = b.bus_id
       JOIN routes r ON da.route_id = r.route_id
       JOIN depots d ON da.depot_id = d.depot_id
       JOIN users udriver ON da.driver_id = udriver.user_id
       LEFT JOIN users uconductor ON da.conductor_id = uconductor.user_id
       WHERE da.driver_id = $1 
         AND da.is_active = true 
         AND da.assignment_date >= CURRENT_DATE 
         AND da.assignment_date <= CURRENT_DATE + $2::integer
       ORDER BY da.assignment_date ASC, da.shift_start_time ASC`,
      [driver_id, days]
    );
    return result.rows;
  }

  static async getAllByRoute(route_id) {
    const result = await db.query(
      `SELECT da.assignment_id, da.depot_id, da.bus_id, da.route_id, da.driver_id, da.conductor_id,
              b.registration_number AS bus_registration,
              r.route_number || ': ' || r.route_name AS route_name,
              d.depot_name,
              CONCAT(udriver.first_name, ' ', udriver.last_name) AS driver_name,
              CASE 
                WHEN uconductor.user_id IS NOT NULL 
                THEN CONCAT(uconductor.first_name, ' ', uconductor.last_name)
                ELSE NULL
              END AS conductor_name,
              da.assignment_date, da.shift_start_time, da.shift_end_time, da.status,
              da.created_at, da.updated_at
       FROM dailyassignment da
       JOIN buses b ON da.bus_id = b.bus_id
       JOIN routes r ON da.route_id = r.route_id
       JOIN depots d ON da.depot_id = d.depot_id
       JOIN users udriver ON da.driver_id = udriver.user_id
       LEFT JOIN users uconductor ON da.conductor_id = uconductor.user_id
       WHERE da.route_id = $1
       ORDER BY da.assignment_id DESC`,
      [route_id]
    );
    return result.rows;
  }

  // Fetch template slots for a route (status = 'template', assignment_date = '1970-01-01')
  static async getTemplatesByRoute(route_id) {
    const result = await db.query(
      `SELECT * FROM dailyassignment
     WHERE route_id = $1 AND status = 'template' AND is_active = TRUE AND assignment_date = '1970-01-01'
     ORDER BY shift_start_time ASC`,
      [route_id]
    );
    return result.rows;
  }

  // Assign a slot (update template to assigned)
  static async assignSlot(assignment_id, { bus_id, driver_id, conductor_id }) {
    const result = await db.query(
      `UPDATE dailyassignment
       SET bus_id = $1, driver_id = $2, conductor_id = $3,
           status = 'Scheduled', updated_at = CURRENT_TIMESTAMP
       WHERE assignment_id = $4 AND is_active = TRUE
       RETURNING *`,
      [bus_id, driver_id, conductor_id, assignment_id]
    );
    return result.rows[0];
  }

  // Soft-delete a slot (set is_active = FALSE, status = 'unassigned')
  static async softDeleteSlot(assignment_id) {
    const result = await db.query(
      `UPDATE dailyassignment
       SET is_active = FALSE, status = 'unassigned', updated_at = CURRENT_TIMESTAMP
       WHERE assignment_id = $1
       RETURNING *`,
      [assignment_id]
    );
    return result.rows[0];
  }

  static async updateTemplateSlot(assignment_id, shift_start_time, shift_end_time) {
    const result = await db.query(
      `UPDATE dailyassignment
       SET shift_start_time = $1, shift_end_time = $2, updated_at = CURRENT_TIMESTAMP
       WHERE assignment_id = $3 AND status = 'template' AND is_active = TRUE
       RETURNING *`,
      [shift_start_time, shift_end_time, assignment_id]
    );
    return result.rows[0];
  }

  // When assigning a slot for a real day, copy the template and fill in real IDs and date
  static async assignSlotFromTemplate(template_assignment_id, { depot_id, bus_id, driver_id, conductor_id, assignment_date }) {
    // Fetch the template slot
    const templateRes = await db.query(
      `SELECT * FROM dailyassignment WHERE assignment_id = $1 AND status = 'template' AND is_active = TRUE`,
      [template_assignment_id]
    );
    if (!templateRes.rows.length) {
      throw new Error('Route not found');
    }
    const template = templateRes.rows[0];
    if (!template.route_id) {
      throw new Error('Route not found');
    }

    // 2. Insert a new assignment row with all required fields
    const insertRes = await db.query(
      `INSERT INTO dailyassignment
      (depot_id, bus_id, route_id, driver_id, conductor_id, assignment_date, shift_start_time, shift_end_time, status, is_active)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
     RETURNING *`,
      [
        depot_id,
        bus_id,
        template.route_id, // copy from template
        driver_id,
        conductor_id,
        assignment_date,
        template.shift_start_time,
        template.shift_end_time,
        'Scheduled' // or 'assigned'
      ]
    );
    return insertRes.rows[0];
  }

  // NEW: Get available drivers for a depot and date (not assigned on that date)
  static async getAvailableDrivers(depot_id, assignment_date) {
    const result = await db.query(
      `SELECT u.user_id AS id, u.first_name, u.last_name
       FROM users u
       JOIN drivers d ON u.user_id = d.driver_id
       WHERE d.depot_id = $1
         AND u.is_active = TRUE
         AND u.user_id NOT IN (
           SELECT driver_id FROM dailyassignment
           WHERE assignment_date = $2 AND is_active = TRUE
         )`,
      [depot_id, assignment_date]
    );
    return result.rows;
  }

  // NEW: Get available conductors for a depot and date (not assigned on that date)
  static async getAvailableConductors(depot_id, assignment_date) {
    const result = await db.query(
      `SELECT u.user_id AS id, u.first_name, u.last_name
       FROM users u
       JOIN conductors c ON u.user_id = c.conductor_id
       WHERE c.depot_id = $1
         AND u.is_active = TRUE
         AND u.user_id NOT IN (
           SELECT conductor_id FROM dailyassignment
           WHERE assignment_date = $2 AND is_active = TRUE
         )`,
      [depot_id, assignment_date]
    );
    return result.rows;
  }
}

module.exports = DailyAssignment;
