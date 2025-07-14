const db = require('../config/db');

class Passenger {
  static async findByUserId(userId) {
    try {
      // Query to find passenger by user_id (since passenger_id in passengers table = user_id in users table)
      const result = await db.query(
        `SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.role_id, u.username
         FROM passengers p
         JOIN users u ON p.passenger_id = u.user_id
         WHERE p.passenger_id = $1`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding passenger by user ID:', error);
      throw error;
    }
  }

  static async findById(passengerId) {
    try {
      const result = await db.query(
        `SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.role_id, u.username
         FROM passengers p
         JOIN users u ON p.passenger_id = u.user_id
         WHERE p.passenger_id = $1`,
        [passengerId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding passenger by ID:', error);
      throw error;
    }
  }

  static async create(userId, passengerData) {
    try {
      const { date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone } = passengerData;
      
      const result = await db.query(
        `INSERT INTO passengers (passenger_id, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating passenger:', error);
      throw error;
    }
  }

  static async updateProfile(userId, updateData) {
    try {
      const { date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone } = updateData;
      
      const result = await db.query(
        `UPDATE passengers 
         SET date_of_birth = COALESCE($2, date_of_birth),
             gender = COALESCE($3, gender),
             address = COALESCE($4, address),
             emergency_contact_name = COALESCE($5, emergency_contact_name),
             emergency_contact_phone = COALESCE($6, emergency_contact_phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE passenger_id = $1
         RETURNING *`,
        [userId, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating passenger profile:', error);
      throw error;
    }
  }

  static async getAllPassengers() {
    try {
      const result = await db.query(
        `SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.is_active, u.username
         FROM passengers p
         JOIN users u ON p.passenger_id = u.user_id
         ORDER BY u.first_name, u.last_name`
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all passengers:', error);
      throw error;
    }
  }
}

module.exports = Passenger;
