const db = require('../config/db');

class Inspection {
  // Create a new inspection
  static async createInspection(inspection_type, date, time, user_id, depot_id) {
    const result = await db.query(
      `INSERT INTO inspections (inspection_type, date, time, user_id, depot_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [inspection_type, date, time, user_id, depot_id]
    );
    return result.rows[0];
  }

  // Get all inspections for a user (regional technical officer)
  static async getInspectionsByUser(user_id) {
    const result = await db.query(
      `SELECT i.*, d.depot_name, r.region_name 
       FROM inspections i
       JOIN depots d ON i.depot_id = d.depot_id
       JOIN regions r ON d.region_id = r.region_id
       WHERE i.user_id = $1
       ORDER BY i.date DESC, i.time DESC`,
      [user_id]
    );
    return result.rows;
  }

  // Get upcoming inspections (status = 'Pending')
  static async getUpcomingInspections(user_id) {
    const result = await db.query(
      `SELECT i.*, d.depot_name, r.region_name 
       FROM inspections i
       JOIN depots d ON i.depot_id = d.depot_id
       JOIN regions r ON d.region_id = r.region_id
       WHERE i.user_id = $1 AND i.status = 'Pending'
       ORDER BY i.date ASC, i.time ASC`,
      [user_id]
    );
    return result.rows;
  }

  // Get past inspections (completed in the last month)
  static async getPastInspections(user_id) {
    const result = await db.query(
      `SELECT i.*, d.depot_name, r.region_name 
       FROM inspections i
       JOIN depots d ON i.depot_id = d.depot_id
       JOIN regions r ON d.region_id = r.region_id
       WHERE i.user_id = $1 
       AND i.status = 'Completed' 
       AND i.date >= CURRENT_DATE - INTERVAL '1 month'
       ORDER BY i.date DESC, i.time DESC`,
      [user_id]
    );
    return result.rows;
  }

  // Update inspection status
  static async updateInspectionStatus(inspection_id, status, user_id) {
    const result = await db.query(
      `UPDATE inspections 
       SET status = $1 
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, inspection_id, user_id]
    );
    return result.rows[0];
  }

  // Update inspection
  static async updateInspection(inspection_id, inspection_type, date, time, depot_id, user_id) {
    const result = await db.query(
      `UPDATE inspections 
       SET inspection_type = $1, date = $2, time = $3, depot_id = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [inspection_type, date, time, depot_id, inspection_id, user_id]
    );
    return result.rows[0];
  }

  // Delete inspection
  static async deleteInspection(inspection_id, user_id) {
    const result = await db.query(
      `DELETE FROM inspections 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [inspection_id, user_id]
    );
    return result.rows[0];
  }

  // Get inspection by ID
  static async getInspectionById(inspection_id, user_id) {
    const result = await db.query(
      `SELECT i.*, d.depot_name, r.region_name 
       FROM inspections i
       JOIN depots d ON i.depot_id = d.depot_id
       JOIN regions r ON d.region_id = r.region_id
       WHERE i.id = $1 AND i.user_id = $2`,
      [inspection_id, user_id]
    );
    return result.rows[0];
  }

  // Get regional technical officer's region
  static async getRegionalTechOfficerRegion(user_id) {
    const result = await db.query(
      `SELECT region_id FROM regional_technical_officers WHERE rto_id = $1`,
      [user_id]
    );
    return result.rows[0];
  }

  // Get depots by region for a regional technical officer
  static async getDepotsByRegionForUser(user_id) {
    const result = await db.query(
      `SELECT d.depot_id, d.depot_name, d.region_id, r.region_name
       FROM depots d
       JOIN regions r ON d.region_id = r.region_id
       JOIN regional_technical_officers rto ON rto.region_id = d.region_id
       WHERE rto.rto_id = $1
       ORDER BY d.depot_name`,
      [user_id]
    );
    return result.rows;
  }

  // Get inspections assigned to a specific depot for depot engineers
  static async getInspectionsByDepot(depot_id) {
    const result = await db.query(
      `SELECT i.*, d.depot_name, r.region_name,
              u.first_name || ' ' || u.last_name AS assigned_by
       FROM inspections i
       JOIN depots d ON i.depot_id = d.depot_id
       JOIN regions r ON d.region_id = r.region_id
       JOIN users u ON i.user_id = u.user_id
       WHERE i.depot_id = $1
       ORDER BY i.date DESC, i.time DESC`,
      [depot_id]
    );
    return result.rows;
  }
}

module.exports = Inspection;
