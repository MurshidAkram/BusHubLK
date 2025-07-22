const db = require('../config/db');

class BusLiveTracking {
  // Update bus position (main function called by mobile app)
  static async updatePosition(positionData) {
    const {
      bus_id,
      route_id,
      driver_id,
      latitude,
      longitude,
      speed = null,
      heading = null,
      accuracy = null,
      passenger_count = 0,
      occupancy_level = 'unknown',
      assignment_id = null,
      battery_level = null,
      signal_strength = null
    } = positionData;

    const result = await db.query(
      `SELECT update_bus_position($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        bus_id,
        route_id,
        driver_id,
        latitude,
        longitude,
        speed,
        heading,
        accuracy,
        passenger_count,
        occupancy_level,
        assignment_id
      ]
    );
    
    return result.rows[0];
  }

  // Get current position of a specific bus
  static async getCurrentPosition(bus_id) {
    const result = await db.query(
      `SELECT * FROM bus_current_positions WHERE bus_id = $1`,
      [bus_id]
    );
    return result.rows[0];
  }

  // Get all buses on a specific route (for passengers)
  static async getBusesOnRoute(route_id) {
    const result = await db.query(
      `SELECT * FROM route_live_buses WHERE route_id = $1`,
      [route_id]
    );
    return result.rows[0];
  }

  // Get all buses on a route by route number
  static async getBusesByRouteNumber(route_number) {
    const result = await db.query(
      `SELECT * FROM route_live_buses WHERE route_number = $1`,
      [route_number]
    );
    return result.rows[0];
  }

  // Get all currently active buses
  static async getAllActiveBuses() {
    const result = await db.query(
      `SELECT * FROM bus_current_positions ORDER BY route_number, registration_number`
    );
    return result.rows;
  }

  // Get nearby buses within specified radius (in km)
  static async getNearbyBuses(latitude, longitude, radius_km = 5) {
    // Use the raw table instead of the view to avoid GROUP BY issues
    const result = await db.query(
      `SELECT DISTINCT ON (blt.bus_id)
        blt.tracking_id,
        blt.bus_id,
        b.registration_number,
        b.class as bus_class,
        blt.route_id,
        r.route_number,
        r.route_name,
        blt.driver_id,
        CONCAT(u.first_name, ' ', u.last_name) as driver_name,
        blt.latitude,
        blt.longitude,
        blt.speed,
        blt.heading,
        blt.recorded_at as last_update,
        blt.tracking_status,
        blt.passenger_count,
        blt.occupancy_level,
        (6371 * acos(cos(radians($1)) * cos(radians(blt.latitude)) * 
        cos(radians(blt.longitude) - radians($2)) + 
        sin(radians($1)) * sin(radians(blt.latitude)))) AS distance_km
       FROM bus_live_tracking blt
       JOIN buses b ON blt.bus_id = b.bus_id
       JOIN routes r ON blt.route_id = r.route_id
       JOIN users u ON blt.driver_id = u.user_id
       WHERE blt.is_live = TRUE
         AND blt.tracking_status = 'active'
         AND blt.latitude IS NOT NULL 
         AND blt.longitude IS NOT NULL
         AND (6371 * acos(cos(radians($1)) * cos(radians(blt.latitude)) * 
        cos(radians(blt.longitude) - radians($2)) + 
        sin(radians($1)) * sin(radians(blt.latitude)))) <= $3
       ORDER BY blt.bus_id, blt.recorded_at DESC`,
      [latitude, longitude, radius_km]
    );
    return result.rows;
  }

  // Get tracking history for a bus within date range
  static async getTrackingHistory(bus_id, start_date, end_date) {
    const result = await db.query(
      `SELECT * FROM bus_tracking_history 
       WHERE bus_id = $1 
         AND recorded_at >= $2 
         AND recorded_at <= $3
       ORDER BY recorded_at ASC`,
      [bus_id, start_date, end_date]
    );
    return result.rows;
  }

  // Update tracking status (active, inactive, break, etc.)
  static async updateTrackingStatus(bus_id, status) {
    const result = await db.query(
      `UPDATE bus_live_tracking 
       SET tracking_status = $2, updated_at = NOW()
       WHERE bus_id = $1 AND is_live = TRUE
       RETURNING *`,
      [bus_id, status]
    );
    return result.rows[0];
  }

  // Get driver's current tracking status
  static async getDriverTrackingStatus(driver_id) {
    const result = await db.query(
      `SELECT blt.*, b.registration_number, r.route_number
       FROM bus_live_tracking blt
       JOIN buses b ON blt.bus_id = b.bus_id
       JOIN routes r ON blt.route_id = r.route_id
       WHERE blt.driver_id = $1 AND blt.is_live = TRUE
       ORDER BY blt.recorded_at DESC
       LIMIT 1`,
      [driver_id]
    );
    return result.rows[0];
  }

  // Archive old data (cleanup function)
  static async archiveOldData() {
    const result = await db.query(`SELECT archive_old_tracking_data()`);
    return result.rows[0];
  }

  // Get real-time statistics
  static async getTrackingStats() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_active_buses,
        COUNT(DISTINCT route_id) as active_routes,
        COUNT(DISTINCT driver_id) as active_drivers,
        AVG(speed) as average_speed,
        MIN(recorded_at) as oldest_update,
        MAX(recorded_at) as latest_update
      FROM bus_live_tracking 
      WHERE is_live = TRUE AND tracking_status = 'active'
    `);
    return result.rows[0];
  }
}

module.exports = BusLiveTracking;
