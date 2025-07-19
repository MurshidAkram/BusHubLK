const pool = require('../config/db');

class BusConditionReport {
  static async create(reportData) {
    try {
      const { busId, driverId, conditionStatus, description, reportTime } = reportData;

      const result = await pool.query(
        `INSERT INTO bus_condition_reports (bus_id, driver_id, condition_status, description, report_time)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [busId, driverId, conditionStatus, description, reportTime || new Date().toISOString()]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating bus condition report:', error);
      throw error;
    }
  }

  static async findByBusId(busId) {
    try {
      const result = await pool.query(
        `SELECT bcr.*, b.registration_number, d.driver_id
         FROM bus_condition_reports bcr
         JOIN buses b ON bcr.bus_id = b.bus_id
         JOIN drivers d ON bcr.driver_id = d.driver_id
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
      const result = await pool.query(
        `SELECT bcr.*, b.registration_number, d.driver_id
         FROM bus_condition_reports bcr
         JOIN buses b ON bcr.bus_id = b.bus_id
         JOIN drivers d ON bcr.driver_id = d.driver_id
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
      const result = await pool.query(
        `SELECT bcr.*, b.registration_number, d.driver_id
         FROM bus_condition_reports bcr
         JOIN buses b ON bcr.bus_id = b.bus_id
         JOIN drivers d ON bcr.driver_id = d.driver_id
         ORDER BY bcr.report_time DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all bus condition reports:', error);
      throw error;
    }
  }
}

module.exports = BusConditionReport;
