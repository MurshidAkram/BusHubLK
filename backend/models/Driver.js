const db = require('../config/db'); // This matches your database config

class Driver {
  static async findByUserId(userId) {
    try {
      // Query to find driver by user_id (since driver_id in drivers table = user_id in users table)
      const result = await db.query(
        `SELECT d.*, u.first_name, u.last_name, u.email, u.phone, u.role_id
         FROM drivers d
         JOIN users u ON d.driver_id = u.user_id
         WHERE d.driver_id = $1`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding driver by user ID:', error);
      throw error;
    }
  }

  static async findById(driverId) {
    try {
      const result = await db.query(
        `SELECT d.*, u.first_name, u.last_name, u.email, u.phone, u.role_id
         FROM drivers d
         JOIN users u ON d.driver_id = u.user_id
         WHERE d.driver_id = $1`,
        [driverId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding driver by ID:', error);
      throw error;
    }
  }

  static async findByDepot(depotId) {
    try {
      const result = await db.query(
        `SELECT d.*, u.first_name, u.last_name, u.email, u.phone
         FROM drivers d
         JOIN users u ON d.driver_id = u.user_id
         WHERE d.depot_id = $1`,
        [depotId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding drivers by depot:', error);
      throw error;
    }
  }

  static async getAllDrivers() {
    try {
      const result = await db.query(
        `SELECT d.*, u.first_name, u.last_name, u.email, u.phone, u.is_active
         FROM drivers d
         JOIN users u ON d.driver_id = u.user_id
         ORDER BY u.first_name, u.last_name`
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all drivers:', error);
      throw error;
    }
  }
}

module.exports = Driver;
