const pool = require('../config/db');

class BusTracking {
  static async create(busData) {
    try {
      const {
        registrationNumber,
        depotId,
        status,
        purchaseDate,
        isActive,
        routeNumber,
        latitude,
        longitude,
        currentStop,
        nextStop,
        estimatedArrival,
        busType,
        heading,
        speed,
        driverName,
        occupancyLevel,
        confidence
      } = busData;

      // Validate depot_id exists
      const depotCheck = await pool.query('SELECT depot_id FROM depots WHERE depot_id = $1', [depotId]);
      if (!depotCheck.rows.length) {
        throw new Error('Invalid depot_id');
      }

      // Insert into buses table
      const busResult = await pool.query(
        `INSERT INTO buses (
          registration_number, depot_id, status, purchase_date, is_active,
          route_number, latitude, longitude, current_stop, next_stop, estimated_arrival,
          bus_type, heading, speed, driver_name, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          registrationNumber,
          depotId,
          status || 'active',
          purchaseDate || null,
          isActive !== undefined ? isActive : true,
          routeNumber || null,
          latitude,
          longitude,
          currentStop || null,
          nextStop || null,
          estimatedArrival || null,
          busType || 'Normal',
          heading || 0,
          speed || 0,
          driverName || null
        ]
      );

      // Insert into bus_occupancy table
      const occupancyResult = await pool.query(
        `INSERT INTO bus_occupancy (
          bus_id, occupancy_level, latitude, longitude, updated_at, confidence
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
        RETURNING *`,
        [
          busResult.rows[0].bus_id,
          occupancyLevel || 'Unknown',
          latitude,
          longitude,
          confidence || 0.0
        ]
      );

      return {
        ...busResult.rows[0],
        occupancy_level: occupancyResult.rows[0].occupancy_level,
        confidence: occupancyResult.rows[0].confidence
      };
    } catch (error) {
      console.error('Error creating bus record:', error);
      throw error;
    }
  }

  static async findByBusId(busId) {
    try {
      const result = await pool.query(
        `SELECT b.*, bo.occupancy_level, bo.confidence, d.depot_name, d.address, d.contact_phone
         FROM buses b
         LEFT JOIN bus_occupancy bo ON b.bus_id = bo.bus_id
         LEFT JOIN depots d ON b.depot_id = d.depot_id
         WHERE b.bus_id = $1 AND b.is_active = true
         ORDER BY bo.updated_at DESC
         LIMIT 1`,
        [busId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding bus by ID:', error);
      throw error;
    }
  }

  static async findByRouteNumber(routeNumber, userLat, userLon, radiusKm = 5) {
    try {
      const result = await pool.query(
        `SELECT b.*, bo.occupancy_level, bo.confidence, d.depot_name, d.address, d.contact_phone,
                (
                  6371 * acos(
                    cos(radians($2)) * cos(radians(b.latitude)) *
                    cos(radians(b.longitude) - radians($3)) +
                    sin(radians($2)) * sin(radians(b.latitude))
                  )
                ) AS distance
         FROM buses b
         LEFT JOIN bus_occupancy bo ON b.bus_id = bo.bus_id
         LEFT JOIN depots d ON b.depot_id = d.depot_id
         WHERE b.route_number = $1
           AND b.is_active = true
           AND b.status = 'active'
           AND (
             6371 * acos(
               cos(radians($2)) * cos(radians(b.latitude)) *
               cos(radians(b.longitude) - radians($3)) +
               sin(radians($2)) * sin(radians(b.latitude))
             )
           ) <= $4
         ORDER BY bo.updated_at DESC`,
        [routeNumber, userLat, userLon, radiusKm]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding buses by route number:', error);
      throw error;
    }
  }

  static async updatePosition(busId, positionData) {
    try {
      const {
        latitude,
        longitude,
        routeNumber,
        occupancyLevel,
        confidence,
        speed,
        heading
      } = positionData;

      // Find nearest stops
      const stopResult = await pool.query(
        `SELECT stop_name, stop_order, latitude, longitude
         FROM route_stops
         WHERE route_number = $1
         ORDER BY (
           POW(latitude - $2, 2) + POW(longitude - $3, 2)
         ) ASC
         LIMIT 2`,
        [routeNumber, latitude, longitude]
      );

      let currentStop = null;
      let nextStop = null;
      let estimatedArrival = null;

      if (stopResult.rows.length > 0) {
        currentStop = stopResult.rows[0].stop_name;
        if (stopResult.rows.length > 1 && stopResult.rows[1].stop_order > stopResult.rows[0].stop_order) {
          nextStop = stopResult.rows[1].stop_name;
          estimatedArrival = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        }
      }

      // Update buses table
      const busResult = await pool.query(
        `UPDATE buses
         SET latitude = $2,
             longitude = $3,
             current_stop = $4,
             next_stop = $5,
             estimated_arrival = $6,
             speed = $7,
             heading = $8,
             updated_at = CURRENT_TIMESTAMP
         WHERE bus_id = $1
         RETURNING *`,
        [
          busId,
          latitude,
          longitude,
          currentStop,
          nextStop,
          estimatedArrival,
          speed || 0,
          heading || 0
        ]
      );

      if (!busResult.rows[0]) {
        return null;
      }

      // Update bus_occupancy table
      const occupancyResult = await pool.query(
        `INSERT INTO bus_occupancy (bus_id, occupancy_level, latitude, longitude, updated_at, confidence)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
         ON CONFLICT (bus_id)
         DO UPDATE SET
           occupancy_level = EXCLUDED.occupancy_level,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           updated_at = CURRENT_TIMESTAMP,
           confidence = EXCLUDED.confidence
         RETURNING *`,
        [
          busId,
          occupancyLevel || 'Unknown',
          latitude,
          longitude,
          confidence || 0.0
        ]
      );

      const depotResult = await pool.query(
        `SELECT depot_name, address, contact_phone
         FROM depots
         WHERE depot_id = $1`,
        [busResult.rows[0].depot_id]
      );

      return {
        ...busResult.rows[0],
        occupancy_level: occupancyResult.rows[0].occupancy_level,
        confidence: occupancyResult.rows[0].confidence,
        depot_name: depotResult.rows[0]?.depot_name,
        depot_address: depotResult.rows[0]?.address,
        depot_contact_phone: depotResult.rows[0]?.contact_phone
      };
    } catch (error) {
      console.error('Error updating bus position:', error);
      throw error;
    }
  }

  static async getAllTrackings(userLat, userLon, radiusKm = 5) {
    try {
      const result = await pool.query(
        `SELECT b.*, bo.occupancy_level, bo.confidence, d.depot_name, d.address, d.contact_phone,
                (
                  6371 * acos(
                    cos(radians($1)) * cos(radians(b.latitude)) *
                    cos(radians(b.longitude) - radians($2)) +
                    sin(radians($1)) * sin(radians(b.latitude))
                  )
                ) AS distance
         FROM buses b
         LEFT JOIN bus_occupancy bo ON b.bus_id = bo.bus_id
         LEFT JOIN depots d ON b.depot_id = d.depot_id
         WHERE b.is_active = true
           AND b.status = 'active'
           AND (
             6371 * acos(
               cos(radians($1)) * cos(radians(b.latitude)) *
               cos(radians(b.longitude) - radians($2)) +
               sin(radians($1)) * sin(radians(b.latitude))
             )
           ) <= $3
         ORDER BY bo.updated_at DESC`,
        [userLat, userLon, radiusKm]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all bus records:', error);
      throw error;
    }
  }

  static async getAllRoutes() {
    try {
      const result = await pool.query(
        `SELECT r.route_number, r.route_name, r.start_location, r.end_location,
                COALESCE(COUNT(b.bus_id), 0) as active_buses,
                (SELECT COUNT(*) FROM buses b2 WHERE b2.route_number = r.route_number) as total_buses
         FROM routes r
         LEFT JOIN buses b ON r.route_number = b.route_number AND b.is_active = true AND b.status = 'active'
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