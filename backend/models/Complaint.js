// File: /models/Complaint.js

const db = require('../config/db');

class Complaint {
  // Create a new complaint
  static create(complaintData, callback) {
    
    // --- MODIFIED PART ---
    // Destructure the properties using snake_case to match the incoming complaintData object.
    const {
      user_id,
      complaint_type,
      route_number,
      bus_number,
      incident_date,
      incident_time,
      location,
      priority,
      description,
      image_url,
      contact_info
    } = complaintData;

    // The SQL query already uses snake_case, so it remains the same.
    const query = `
      INSERT INTO complaints (
        user_id, complaint_type, route_number, bus_number, 
        incident_date, incident_time, location, priority, 
        description, image_url, contact_info, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Pending', NOW())
      RETURNING id
    `;

    // The values now come from our new snake_case variables.
    const values = [
      user_id,
      complaint_type,
      route_number,
      bus_number || null,
      incident_date,
      incident_time,
      location,
      priority,
      description,
      image_url || null,
      contact_info
    ];
    // --- END MODIFIED PART ---

    db.query(query, values, (err, result) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, result.rows[0].id);
    });
  }

  // Get all complaints for a specific user
  static getByUserId(userId, callback) {
    const query = 'SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC';
    db.query(query, [userId], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results.rows);
    });
  }

  // --- Other functions remain the same ---

  // Get all complaints (admin only)
  static getAll(callback) {
    const query = 'SELECT * FROM complaints ORDER BY created_at DESC';
    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results.rows);
    });
  }

  // Get complaint by ID
  static getById(id, callback) {
    const query = 'SELECT * FROM complaints WHERE id = $1';
    db.query(query, [id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results.rows[0]);
    });
  }

  // Update complaint status
  static updateStatus(id, status, callback) {
    const query = 'UPDATE complaints SET status = $1, updated_at = NOW() WHERE id = $2';
    db.query(query, [status, id], (err, result) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, result);
    });
  }

  // Delete complaint
  static delete(id, callback) {
    const query = 'DELETE FROM complaints WHERE id = $1';
    db.query(query, [id], (err, result) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, result);
    });
  }
}

module.exports = Complaint;