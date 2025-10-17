const pool = require('../config/db');

const Emergency = {
  /**
   * Creates a new emergency report in the database.
   * @param {object} reportData - Contains passenger_id, incidentType, description, latitude, longitude.
   * @returns {Promise<object>} The newly created report.
   */
createReport: async (reportData, client = pool) => { // <-- Add client parameter

  const {
    driver_id,
    incidentType,
    description,
    latitude,
    longitude,
    bus_id = null,
    assignment_id = null,
  } = reportData;

  const query = {
    text: `INSERT INTO emergency_reports(driver_id, bus_id, assignment_id, incident_type, description, latitude, longitude)
           VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    values: [driver_id, bus_id, assignment_id, incidentType, description, latitude, longitude],
  };
  const { rows } = await client.query(query); // <-- Use client instead of pool
  return rows[0];
},

  /**
   * Finds a single report by its ID.
   * @param {number} reportId - The ID of the report.
   * @returns {Promise<object>} The report object.
   */
  findReportById: async (reportId, client = pool) => {
    const query = {
      text: 'SELECT * FROM emergency_reports WHERE id = $1',
      values: [reportId],
    };
    const { rows } = await client.query(query);
    return rows[0];
  },

  /**
   * Adds a new chat message to a specific report.
   * @param {number} report_id - The ID of the report.
   * @param {string} sender_type - 'user' or 'depot'.
   * @param {string} text - The message content.
   * @returns {Promise<object>} The newly created message.
   */
  addMessage: async (report_id, sender_type, text, client = pool) => {
    const query = {
      text: `INSERT INTO emergency_messages(report_id, sender_type, text)
             VALUES($1, $2, $3) RETURNING *`,
      values: [report_id, sender_type, text],
    };
    const { rows } = await client.query(query);
    return rows[0];
  },

  /**
   * Retrieves all messages for a given report, ordered by creation time.
   * @param {number} reportId - The ID of the report.
   * @returns {Promise<Array<object>>} An array of message objects.
   */
  getMessagesByReportId: async (reportId) => {
    const query = {
      text: 'SELECT * FROM emergency_messages WHERE report_id = $1 ORDER BY created_at ASC',
      values: [reportId],
    };
    const { rows } = await pool.query(query);
    return rows;
  },

  /**
   * Updates the status of an emergency report.
   * @param {number} reportId - The ID of the report.
   * @param {string} status - The new status.
   * @returns {Promise<object>} The updated report.
   */
  updateReportStatus: async (reportId, status, client = pool) => {
    const query = {
      text: 'UPDATE emergency_reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      values: [status, reportId],
    };
    const { rows } = await client.query(query);
    return rows[0];
  },

  /**
   * Finds the phone number of a Depot based on a driver's ID.
   * @param {number} driverId - The ID of the driver.
   * @returns {Promise<Array<object>>} A promise that resolves to the depot contact phone.
   */
  findDepotEngineerByDriverId: async (driverId) => {
    // First get the depot_id for the driver
    const driverQuery = {
      text: `SELECT depot_id FROM drivers WHERE driver_id = $1`,
      values: [driverId]
    };

    try {
      // Get driver's depot
      const driverResult = await pool.query(driverQuery);
      console.log('[DEBUG] Driver query result:', driverResult.rows);
      
      if (driverResult.rows.length === 0) {
        console.log('[DEBUG] No depot found for driver:', driverId);
        return [];
      }

      const depotId = driverResult.rows[0].depot_id;
      if (!depotId) {
        console.log('[DEBUG] Driver has no depot assigned:', driverId);
        return [];
      }

      // Fetch depot contact phone directly from depots table
      const depotQuery = {
        text: `
          SELECT contact_phone as phone
          FROM depots
          WHERE depot_id = $1
            AND contact_phone IS NOT NULL
        `,
        values: [depotId]
      };

      const depotResult = await pool.query(depotQuery);
      console.log('[DEBUG] Depot contact query result:', depotResult.rows);
      return depotResult.rows;
      
    } catch (error) {
      console.error('[ERROR] Query error:', error);
      throw error;
    }
  },
};

module.exports = Emergency;