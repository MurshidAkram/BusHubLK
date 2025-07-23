const db = require('../config/db');

class BusConditionReport {
  static async create(reportData) {
    try {
      const { busId, driverId, conditionStatus, description, reportTime } = reportData;

      const result = await db.query(
        `INSERT INTO bus_condition_reports (bus_id, driver_id, condition_status, description, report_time)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [busId, driverId, conditionStatus, description, reportTime || new Date()]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating bus condition report:', error);
      throw error;
    }
  }

  static async findByBusId(busId) {
    try {
      const result = await db.query(
        `SELECT bcr.*, 
                b.registration_number, 
                b.class as bus_class,
                b.manufacturer,
                b.model,
                u.first_name as driver_first_name,
                u.last_name as driver_last_name,
                u.email as driver_email
         FROM bus_condition_reports bcr
         LEFT JOIN buses b ON bcr.bus_id = b.bus_id
         LEFT JOIN drivers d ON bcr.driver_id = d.driver_id
         LEFT JOIN users u ON d.driver_id = u.user_id
         WHERE bcr.bus_id = $1
         ORDER BY bcr.report_time DESC`,
        [busId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding bus condition reports by bus ID:', error);
      throw error;
    }
  }

  static async findById(reportId) {
    try {
      const result = await db.query(
        `SELECT bcr.*, 
                b.registration_number, 
                b.class as bus_class,
                b.manufacturer,
                b.model,
                u.first_name as driver_first_name,
                u.last_name as driver_last_name,
                u.email as driver_email
         FROM bus_condition_reports bcr
         LEFT JOIN buses b ON bcr.bus_id = b.bus_id
         LEFT JOIN drivers d ON bcr.driver_id = d.driver_id
         LEFT JOIN users u ON d.driver_id = u.user_id
         WHERE bcr.report_id = $1`,
        [reportId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding bus condition report by ID:', error);
      throw error;
    }
  }

  static async getAllReports() {
    try {
      const result = await db.query(
        `SELECT bcr.*, 
                b.registration_number, 
                b.class as bus_class,
                b.manufacturer,
                b.model,
                u.first_name as driver_first_name,
                u.last_name as driver_last_name,
                u.email as driver_email
         FROM bus_condition_reports bcr
         LEFT JOIN buses b ON bcr.bus_id = b.bus_id
         LEFT JOIN drivers d ON bcr.driver_id = d.driver_id
         LEFT JOIN users u ON d.driver_id = u.user_id
         ORDER BY bcr.report_time DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all bus condition reports:', error);
      throw error;
    }
  }

  static async findByDriverId(driverId) {
    try {
      const result = await db.query(
        `SELECT bcr.*, 
                b.registration_number, 
                b.class as bus_class,
                b.manufacturer,
                b.model
         FROM bus_condition_reports bcr
         LEFT JOIN buses b ON bcr.bus_id = b.bus_id
         WHERE bcr.driver_id = $1
         ORDER BY bcr.report_time DESC`,
        [driverId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding bus condition reports by driver ID:', error);
      throw error;
    }
  }

  static async updateReport(reportId, updateData) {
    try {
      const { conditionStatus, description } = updateData;
      
      const result = await db.query(
        `UPDATE bus_condition_reports 
         SET condition_status = $1, 
             description = $2, 
             updated_at = CURRENT_TIMESTAMP
         WHERE report_id = $3
         RETURNING *`,
        [conditionStatus, description, reportId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating bus condition report:', error);
      throw error;
    }
  }

  static async deleteReport(reportId) {
    try {
      const result = await db.query(
        `DELETE FROM bus_condition_reports 
         WHERE report_id = $1
         RETURNING *`,
        [reportId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting bus condition report:', error);
      throw error;
    }
  }
}

module.exports = BusConditionReport;
