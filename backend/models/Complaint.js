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
        description, image_url, contact_info, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Pending', NOW(), NOW())
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
  static getByUserId(userId, options, callback) {
    let limit = null;
    let offset = 0;
    let cb = callback;

    if (typeof options === 'function') {
      cb = options;
    } else if (options && typeof options === 'object') {
      if (Number.isFinite(options.limit)) {
        limit = Math.max(1, Math.floor(options.limit));
      }
      if (Number.isFinite(options.offset)) {
        offset = Math.max(0, Math.floor(options.offset));
      }
    }

    if (!cb) {
      cb = () => {};
    }

    // join users to return reporter email/phone alongside complaint row
    let query = `
      SELECT c.*, COALESCE(c.updated_at, c.created_at) AS last_updated_at,
             u.email AS reporter_email,
             u.phone AS reporter_phone
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.user_id
      WHERE c.user_id = $1
      ORDER BY COALESCE(c.updated_at, c.created_at) DESC
    `;
    const params = [userId];

    if (limit !== null) {
      query += ' LIMIT $2 OFFSET $3';
      params.push(limit, offset);
    }

    db.query(query, params, (err, results) => {
      if (err) {
        return cb(err, null);
      }
      cb(null, results.rows);
    });
  }

  // --- Other functions remain the same ---

  // Get all complaints (admin only)
  static getAll(callback) {
    // include reporter email/phone by joining users
    const query = `
      SELECT c.*, COALESCE(c.updated_at, c.created_at) AS last_updated_at,
             u.email AS reporter_email,
             u.phone AS reporter_phone
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.user_id
      ORDER BY COALESCE(c.updated_at, c.created_at) DESC
    `;
    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results.rows);
    });
  }

  // Get complaint by ID
  static getById(id, callback) {
    const query = `
      SELECT c.*, COALESCE(c.updated_at, c.created_at) AS last_updated_at,
             u.email AS reporter_email,
             u.phone AS reporter_phone
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.user_id
      WHERE c.id = $1
      LIMIT 1
    `;
    db.query(query, [id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results.rows[0]);
    });
  }

  // Update complaint status
  static updateStatus(id, status, callback) {
    const query = `
      UPDATE complaints
      SET status = $1,
      updated_at = NOW()
      WHERE id = $2
    RETURNING *, COALESCE(updated_at, created_at) AS last_updated_at
    `;
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