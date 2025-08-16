const Emergency = require('../models/emergencyModel');
const pool = require('../config/db'); 

const createEmergencyReport = async (req, res) => {
  const { incidentType, description, location, driver_id } = req.body;

  if (!driver_id) {
    return res.status(400).json({ message: 'Driver ID is required to create a report.' });
  }
  if (!incidentType || !location || !location.latitude || !location.longitude) {
    return res.status(400).json({ message: 'Incident type and location are required.' });
  }

  // Get a client from the connection pool to run the transaction
  const client = await pool.connect();

  try {
    // Start the transaction
    await client.query('BEGIN');

    // 1. Create the report itself
    const reportData = {
      driver_id,
      incidentType,
      description,
      latitude: location.latitude,
      longitude: location.longitude,
    };
    const newReport = await Emergency.createReport(reportData, client);

    // 2. Automatically create the first message with the report details
    const initialMessageText = `Report Details:\n- Type: ${newReport.incident_type}\n- Description: ${newReport.description || 'None provided'}`;
    await Emergency.addMessage(newReport.id, 'driver', initialMessageText, client);

    // 3. If everything is successful, commit the transaction
    await client.query('COMMIT');

    // 4. Send the created report back to the app
    res.status(201).json(newReport);

  } catch (error) {
    // If any step fails, roll back the entire transaction
    await client.query('ROLLBACK');
    console.error('Error creating emergency report with initial message:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  } finally {
    // Always release the client back to the pool
    client.release();
  }
};


const getReportWithMessages = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Emergency.findReportById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Emergency report not found.' });
    }

    const messages = await Emergency.getMessagesByReportId(reportId);

    const response = {
      ...report,
      messages,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching report with messages (controller):', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const addMessageToReport = async (req, res) => {
  const { reportId } = req.params;
  const { text, sender } = req.body;

  if (!text || !sender) {
    return res.status(400).json({ message: 'Message text and sender are required.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const report = await Emergency.findReportById(reportId, client);
    if (!report) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Emergency report not found.' });
    }

    const newMessage = await Emergency.addMessage(reportId, sender, text, client);
    let updatedReport = report;

    if (sender === 'depot' && report.status === 'New') {
      updatedReport = await Emergency.updateReportStatus(reportId, 'Acknowledged', client);
    }

    await client.query('COMMIT');
    res.status(201).json({ newMessage, updatedReport });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding message to report (controller):', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  } finally {
    client.release();
  }
};
const getReportsByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // --- ADD THIS LINE ---
    console.log(`[HISTORY] Request received for driver_id: ${driverId}`);

    const query = {
      text: 'SELECT * FROM emergency_reports WHERE driver_id = $1 ORDER BY created_at DESC',
      values: [driverId],
    };

    const { rows } = await pool.query(query);

    // --- AND ADD THIS LINE ---
    console.log(`[HISTORY] Found ${rows.length} reports in the database.`);

    res.status(200).json(rows);
  } catch (error) {
    console.error('[HISTORY] Error fetching reports:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
module.exports = {
  createEmergencyReport,
  getReportWithMessages,
  addMessageToReport,
  getReportsByDriver,
};