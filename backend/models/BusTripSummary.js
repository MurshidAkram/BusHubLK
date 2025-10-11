const db = require('../config/db');

class BusTripSummary {
  static async getAllByDepot(depot_id) {
    return db.query(`
      SELECT 
        bts.trip_id,
        bts.bus_id,
        b.registration_number,
        bts.route_id,
        r.route_number,
        r.route_name,
        bts.driver_id,
        u.first_name || ' ' || u.last_name AS driver_name,
        bts.scheduled_departure,
        bts.scheduled_arrival,
        bts.actual_departure,
        bts.actual_arrival,
        bts.total_distance_km,
        bts.status,
        bts.time_difference
      FROM bus_trip_summary bts
      JOIN buses b ON bts.bus_id = b.bus_id
      JOIN routes r ON bts.route_id = r.route_id
      JOIN drivers d ON bts.driver_id = d.driver_id
      JOIN users u ON d.driver_id = u.user_id
      WHERE b.depot_id = $1
      ORDER BY bts.actual_departure DESC
    `, [depot_id]).then(res => res.rows);
  }

  // Add more methods as needed (insert, update, etc.)
}

module.exports = BusTripSummary;