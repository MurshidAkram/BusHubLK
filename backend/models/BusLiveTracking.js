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

  // Get current position of a specific bus (only latest live position)
  static async getCurrentPosition(bus_id) {
    const result = await db.query(
      `SELECT 
        blt.bus_id,
        b.registration_number,
        r.route_number,
        r.route_name,
        blt.latitude,
        blt.longitude,
        blt.speed,
        blt.heading,
        blt.recorded_at as last_update,
        blt.tracking_status,
        blt.passenger_count,
        blt.occupancy_level,
        EXTRACT(EPOCH FROM (NOW() - blt.recorded_at)) / 60 as minutes_since_update
      FROM bus_live_tracking blt
      JOIN buses b ON blt.bus_id = b.bus_id
      JOIN routes r ON blt.route_id = r.route_id
      WHERE blt.bus_id = $1 
        AND blt.is_live = TRUE 
        AND blt.tracking_status IN ('active', 'break')
        AND blt.recorded_at >= NOW() - INTERVAL '30 minutes'
      ORDER BY blt.recorded_at DESC
      LIMIT 1`,
      [bus_id]
    );
    return result.rows[0];
  }

  // Get all buses on a specific route (LIVE positions only)
  static async getBusesOnRoute(route_id) {
    const result = await db.query(
      `WITH latest_positions AS (
        SELECT DISTINCT ON (blt.bus_id)
          blt.bus_id,
          blt.route_id,
          blt.latitude,
          blt.longitude,
          blt.speed,
          blt.heading,
          blt.recorded_at,
          blt.tracking_status,
          blt.passenger_count,
          blt.occupancy_level,
          blt.updated_at
        FROM bus_live_tracking blt
        WHERE blt.is_live = TRUE
          AND blt.route_id = $1
          AND blt.tracking_status IN ('active', 'break')
          AND blt.latitude IS NOT NULL 
          AND blt.longitude IS NOT NULL
          AND blt.recorded_at >= NOW() - INTERVAL '30 minutes'
        ORDER BY blt.bus_id, blt.recorded_at DESC
      )
      SELECT 
        lp.bus_id,
        b.registration_number,
        r.route_number,
        r.route_name,
        lp.latitude,
        lp.longitude,
        lp.speed,
        lp.heading,
        lp.recorded_at as last_update,
        lp.updated_at,
        lp.tracking_status,
        lp.passenger_count,
        lp.occupancy_level
      FROM latest_positions lp
      JOIN buses b ON lp.bus_id = b.bus_id
      JOIN routes r ON lp.route_id = r.route_id
      ORDER BY b.registration_number`,
      [route_id]
    );
    return result.rows;
  }

  // Get all buses on a route by route number (LIVE positions only)
  static async getBusesByRouteNumber(route_number) {
    const result = await db.query(
      `WITH latest_positions AS (
        SELECT DISTINCT ON (blt.bus_id)
          blt.bus_id,
          blt.route_id,
          blt.latitude,
          blt.longitude,
          blt.speed,
          blt.heading,
          blt.recorded_at,
          blt.tracking_status,
          blt.passenger_count,
          blt.occupancy_level,
          blt.updated_at
        FROM bus_live_tracking blt
        JOIN routes r ON blt.route_id = r.route_id
        WHERE blt.is_live = TRUE
          AND r.route_number = $1
          AND blt.tracking_status IN ('active', 'break')
          AND blt.latitude IS NOT NULL 
          AND blt.longitude IS NOT NULL
          AND blt.recorded_at >= NOW() - INTERVAL '30 minutes'
        ORDER BY blt.bus_id, blt.recorded_at DESC
      )
      SELECT 
        lp.bus_id,
        b.registration_number,
        r.route_number,
        r.route_name,
        lp.latitude,
        lp.longitude,
        lp.speed,
        lp.heading,
        lp.recorded_at as last_update,
        lp.updated_at,
        lp.tracking_status,
        lp.passenger_count,
        lp.occupancy_level
      FROM latest_positions lp
      JOIN buses b ON lp.bus_id = b.bus_id
      JOIN routes r ON lp.route_id = r.route_id
      ORDER BY b.registration_number`,
      [route_number]
    );
    return result.rows;
  }

  // Get all currently active buses (LIVE positions only)
  static async getAllActiveBuses() {
    const result = await db.query(
      `WITH latest_positions AS (
        SELECT DISTINCT ON (blt.bus_id)
          blt.bus_id,
          blt.route_id,
          blt.latitude,
          blt.longitude,
          blt.speed,
          blt.heading,
          blt.recorded_at,
          blt.tracking_status,
          blt.passenger_count,
          blt.occupancy_level,
          blt.updated_at
        FROM bus_live_tracking blt
        WHERE blt.is_live = TRUE
          AND blt.tracking_status IN ('active', 'break')
          AND blt.latitude IS NOT NULL 
          AND blt.longitude IS NOT NULL
          AND blt.recorded_at >= NOW() - INTERVAL '30 minutes'
        ORDER BY blt.bus_id, blt.recorded_at DESC
      )
      SELECT 
        lp.bus_id,
        b.registration_number,
        r.route_number,
        r.route_name,
        lp.latitude,
        lp.longitude,
        lp.speed,
        lp.heading,
        lp.recorded_at as last_update,
        lp.updated_at,
        lp.tracking_status,
        lp.passenger_count,
        lp.occupancy_level,
        EXTRACT(EPOCH FROM (NOW() - lp.recorded_at)) / 60 as minutes_since_update
      FROM latest_positions lp
      JOIN buses b ON lp.bus_id = b.bus_id
      JOIN routes r ON lp.route_id = r.route_id
      ORDER BY r.route_number, b.registration_number`
    );
    return result.rows;
  }

  // Get nearby buses within specified radius (OPTIMIZED FOR LIVE TRACKING)
  static async getNearbyBuses(latitude, longitude, radius_km = 5) {
    const result = await db.query(
      `WITH latest_positions AS (
        SELECT DISTINCT ON (blt.bus_id)
          blt.bus_id,
          blt.route_id,
          blt.latitude,
          blt.longitude,
          blt.speed,
          blt.heading,
          blt.recorded_at,
          blt.tracking_status,
          blt.passenger_count,
          blt.occupancy_level,
          blt.updated_at,
          ROW_NUMBER() OVER (PARTITION BY blt.bus_id ORDER BY blt.recorded_at DESC) as rn
        FROM bus_live_tracking blt
        WHERE blt.is_live = TRUE
          AND blt.tracking_status IN ('active', 'break')
          AND blt.latitude IS NOT NULL 
          AND blt.longitude IS NOT NULL
          AND blt.recorded_at >= NOW() - INTERVAL '30 minutes'
        ORDER BY blt.bus_id, blt.recorded_at DESC
      )
      SELECT 
        lp.bus_id,
        b.registration_number,
        r.route_number,
        r.route_name,
        lp.latitude,
        lp.longitude,
        lp.speed,
        lp.heading,
        lp.recorded_at as last_update,
        lp.updated_at,
        lp.tracking_status,
        lp.passenger_count,
        lp.occupancy_level,
        0 as confidence,
        (6371 * acos(
          cos(radians($1)) * cos(radians(lp.latitude)) * 
          cos(radians(lp.longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(lp.latitude))
        )) AS distance
      FROM latest_positions lp
      JOIN buses b ON lp.bus_id = b.bus_id
      JOIN routes r ON lp.route_id = r.route_id
      WHERE lp.rn = 1
        AND (6371 * acos(
          cos(radians($1)) * cos(radians(lp.latitude)) * 
          cos(radians(lp.longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(lp.latitude))
        )) <= $3
      ORDER BY distance ASC`,
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
