const pool = require('../config/db');

class BusOccupancy {
  static async create(occupancyData) {
    try {
      const { busId, occupancyLevel, latitude, longitude, confidence, passengerId } = occupancyData;
      
      // Validate required passenger_id field
      if (!passengerId) {
        throw new Error('passenger_id is required for bus occupancy records');
      }
      
      // Always use PostgreSQL's CURRENT_TIMESTAMP to avoid timezone issues
      // This ensures updated_at is always stored in database timezone (UTC) consistently
      const result = await pool.query(
        `INSERT INTO bus_occupancy (bus_id, passenger_id, occupancy_level, latitude, longitude, updated_at, confidence)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
         RETURNING *`,
        [busId, passengerId, occupancyLevel, latitude, longitude, confidence]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating bus occupancy record:', error);
      throw error;
    }
  }

  static async findByBusId(busId) {
    try {
      const result = await pool.query(
        `SELECT bo.*, b.registration_number
         FROM bus_occupancy bo
         JOIN buses b ON bo.bus_id = b.bus_id
         WHERE bo.bus_id = $1
         ORDER BY bo.updated_at DESC`,
        [busId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding bus occupancy by bus ID:', error);
      throw error;
    }
  }

  static async findById(occupancyId) {
    try {
      const result = await pool.query(
        `SELECT bo.*, b.registration_number
         FROM bus_occupancy bo
         JOIN buses b ON bo.bus_id = b.bus_id
         WHERE bo.occupancy_id = $1`,
        [occupancyId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding bus occupancy by ID:', error);
      throw error;
    }
  }

  static async findOneAndUpdate(occupancyId, busId, updateData) {
    try {
      const { occupancyLevel, latitude, longitude, confidence } = updateData;
      
      const result = await pool.query(
        `UPDATE bus_occupancy
         SET occupancy_level = COALESCE($3, occupancy_level),
             latitude = COALESCE($4, latitude),
             longitude = COALESCE($5, longitude),
             confidence = COALESCE($6, confidence),
             updated_at = CURRENT_TIMESTAMP
         WHERE occupancy_id = $1 AND bus_id = $2
         RETURNING *`,
        [occupancyId, busId, occupancyLevel, latitude, longitude, confidence]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating bus occupancy:', error);
      throw error;
    }
  }

  static async findOneAndDelete(occupancyId, busId) {
    try {
      const result = await pool.query(
        `DELETE FROM bus_occupancy
         WHERE occupancy_id = $1 AND bus_id = $2
         RETURNING *`,
        [occupancyId, busId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting bus occupancy:', error);
      throw error;
    }
  }

  static async getAllOccupancies() {
    try {
      const result = await pool.query(
        `WITH bus_route_info AS (
          SELECT DISTINCT ON (blt.bus_id)
            blt.bus_id,
            r.route_number,
            r.route_name
          FROM bus_live_tracking blt
          JOIN routes r ON blt.route_id = r.route_id
          WHERE blt.is_live = TRUE
          ORDER BY blt.bus_id, blt.recorded_at DESC
        )
        SELECT bo.*, b.registration_number, bri.route_number, bri.route_name
        FROM bus_occupancy bo
        JOIN buses b ON bo.bus_id = b.bus_id
        LEFT JOIN bus_route_info bri ON bo.bus_id = bri.bus_id
        ORDER BY bo.updated_at DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all bus occupancy records:', error);
      throw error;
    }
  }
}

module.exports = BusOccupancy;