const pool = require('../config/db');
const BusLiveTracking = require('./BusLiveTracking');

class BusTracking {
  static async findByBusId(busId) {
    try {
      const result = await BusLiveTracking.getCurrentPosition(busId);
      if (!result) {
        return [];
      }
      return [{
        bus_id: result.bus_id,
        registration_number: result.registration_number,
        route_number: result.route_number,
        tracking_status: result.tracking_status,
        latitude: result.latitude,
        longitude: result.longitude,
        updated_at: result.last_update,
        passenger_count: result.passenger_count,
        occupancy_level: result.occupancy_level,
        confidence: result.confidence,
      }];
    } catch (error) {
      console.error('Error finding bus by ID:', error);
      throw error;
    }
  }

  static async getAllTrackings(userLat, userLon, radiusKm = 5) {
    try {
      const result = await BusLiveTracking.getNearbyBuses(userLat, userLon, radiusKm);
      return result.map(row => ({
        bus_id: row.bus_id,
        registration_number: row.registration_number,
        route_number: row.route_number,
        tracking_status: row.tracking_status,
        latitude: row.latitude,
        longitude: row.longitude,
        updated_at: row.last_update,
        passenger_count: row.passenger_count,
        occupancy_level: row.occupancy_level,
        confidence: row.confidence,
        distance: row.distance_km,
      }));
    } catch (error) {
      console.error('Error getting all bus records:', error);
      throw error;
    }
  }

  static async getAllRoutes() {
    try {
      const result = await pool.query(
        `SELECT r.route_number, r.route_name, r.start_location, r.end_location,
                COALESCE(COUNT(blt.bus_id), 0) as active_buses,
                (SELECT COUNT(*) FROM buses b2 WHERE b2.route_number = r.route_number) as total_buses
         FROM routes r
         LEFT JOIN bus_live_tracking blt ON r.route_id = blt.route_id AND blt.is_live = true AND blt.tracking_status = 'active'
         WHERE r.is_active = true
         GROUP BY r.route_number, r.route_name, r.start_location, r.end_location
         ORDER BY r.route_number`
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  }
}

module.exports = BusTracking;