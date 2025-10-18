
const Emergency = require('../models/emergencyModel');
const DailyAssignment = require('../models/DailyAssignmentModel');
const pool = require('../config/db'); 

const createEmergencyReport = async (req, res) => {
  const { incidentType, description, location, driver_id, bus_id, assignment_id, panic_mode } = req.body;

  if (!driver_id) {
    return res.status(400).json({ message: 'Driver ID is required to create a report.' });
  }
  if (!incidentType || !location || !location.latitude || !location.longitude) {
    return res.status(400).json({ message: 'Incident type and location are required.' });
  }

  let assignmentId = null;
  let busId = null;

  try {
    const assignments = await DailyAssignment.getByDriverId(driver_id);
    if (Array.isArray(assignments) && assignments.length > 0) {
      const todayStr = new Date().toISOString().slice(0, 10);

      const normalizeDate = (value) => {
        if (!value) return null;
        try {
          return new Date(value).toISOString().slice(0, 10);
        } catch (err) {
          return null;
        }
      };

      const todaysAssignment = assignments.find((assignment) => normalizeDate(assignment.assignment_date) === todayStr);
      const relevantAssignment = todaysAssignment || assignments[0];

      if (relevantAssignment) {
        assignmentId = relevantAssignment.assignment_id ?? null;
        busId = relevantAssignment.bus_id ?? null;
      }
    }
  } catch (assignmentErr) {
    console.warn('Unable to resolve driver assignment for emergency report:', assignmentErr);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Use the looked-up assignment and bus IDs if available, otherwise fall back to request body
    const finalBusId = busId || bus_id || null;
    const finalAssignmentId = assignmentId || assignment_id || null;

    const reportData = {
      driver_id,
      bus_id: finalBusId,
      assignment_id: finalAssignmentId,
      incidentType,
      description,
      latitude: location.latitude,
      longitude: location.longitude,
      panic_mode: panic_mode || false,
    };
    
    console.log('📝 Creating emergency report with data:', JSON.stringify(reportData, null, 2));
    const newReport = await Emergency.createReport(reportData, client);
    console.log('✅ Emergency report created with ID:', newReport.id);

    const initialMessageText = `Report Details:\n- Type: ${newReport.incident_type}\n- Description: ${newReport.description || 'None provided'}`;
    await Emergency.addMessage(newReport.id, 'driver', initialMessageText, client);
    console.log('✅ Initial message added to report:', newReport.id);


    // Fetch driver, bus, and route details BEFORE committing (for SMS notification)
    let driverName = 'Unknown';
    let busNumber = 'Unknown';
    let routeNumber = 'Unknown';

    if (panic_mode && incidentType === 'Panic Alert') {
      try {
        console.log('🚨 Panic mode detected - fetching details for SMS notification...');
        
        // Get driver details (JOIN with users table to get names)
        const driverQuery = await client.query(
          `SELECT u.first_name, u.last_name 
           FROM drivers d 
           JOIN users u ON d.driver_id = u.user_id 
           WHERE d.driver_id = $1`,
          [driver_id]
        );
        if (driverQuery.rows.length > 0) {
          const driver = driverQuery.rows[0];
          driverName = `${driver.first_name} ${driver.last_name}`.trim();
          console.log(`✓ Driver: ${driverName}`);
        }

        // Get bus details if available
        if (busId) {
          const busQuery = await client.query(
            'SELECT registration_number FROM buses WHERE bus_id = $1',
            [busId]
          );
          if (busQuery.rows.length > 0) {
            busNumber = busQuery.rows[0].registration_number;
            console.log(`✓ Bus: ${busNumber}`);
          }
        }

        // Get route details if available
        if (assignmentId) {
          const routeQuery = await client.query(
            'SELECT r.route_number FROM dailyassignment da JOIN routes r ON da.route_id = r.route_id WHERE da.assignment_id = $1',
            [assignmentId]
          );
          if (routeQuery.rows.length > 0) {
            routeNumber = routeQuery.rows[0].route_number;
            console.log(`✓ Route: ${routeNumber}`);
          }
        }
      } catch (detailsError) {
        console.warn('⚠️ Could not fetch all details for panic SMS:', detailsError.message);
      }
    }

    console.log('💾 Committing transaction for emergency report:', newReport.id);
    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully for report:', newReport.id);

    // Send SMS notification for panic alerts
    if (panic_mode && incidentType === 'Panic Alert') {
      try {
        console.log('📱 Preparing SMS notification...');
        const notifySmsService = require('../services/notifySmsService');

        // Create Google Maps link
        const googleMapsLink = location ?
          `https://www.google.com/maps?q=${location.latitude},${location.longitude}` :
          'Location not available';

        // Extract coordinates from description if available
        let coords = 'Not available';
        let accuracy = 'Unknown';
        if (description) {
          const coordMatch = description.match(/Location: ([\d.]+), ([\d.]+)/);
          const accuracyMatch = description.match(/Accuracy: ±(\d+)m/);
          if (coordMatch) {
            coords = `${coordMatch[1]}, ${coordMatch[2]}`;
          }
          if (accuracyMatch) {
            accuracy = `${accuracyMatch[1]}m`;
          }
        }

        const smsMessage = `*** PANIC ALERT - Driver Emergency ***

Driver: ${driverName}
Bus: ${busNumber}
Route: ${routeNumber}

Coordinates: ${coords}
Accuracy: ${accuracy}

Map Link: ${googleMapsLink}

Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}

*** IMMEDIATE RESPONSE REQUIRED ***`;

        // Send to Police Headquarters using notify.lk
        const policeNumber = '0779365318'; // Police HQ contact number
        console.log(`📱 Sending SMS to Police HQ: ${policeNumber}`);
        
        const smsResult = await notifySmsService.sendSms({
          message: smsMessage,
          phoneNumbers: [policeNumber]
        });

        console.log('✅ Panic alert SMS sent successfully to Colombo Police HQ:', JSON.stringify(smsResult));

      } catch (smsError) {
        console.error('❌ Failed to send panic alert SMS to Police HQ:', {
          error: smsError.message,
          stack: smsError.stack,
          details: smsError.response?.data || 'No additional details'
        });
        // Don't fail the emergency report creation if SMS fails
      }
    } else if (panic_mode) {
      console.log(`⚠️ Panic mode is true but incidentType is "${incidentType}" (expected "Panic Alert") - SMS not sent`);
    }

    // ✅ IMPORTANT: Release client BEFORE sending response to ensure transaction is committed
    client.release();
    console.log('� Database client released - transaction committed');

    console.log('�📤 Sending response to client with report ID:', newReport.id);
    res.status(201).json(newReport);
    console.log('✅ Response sent successfully for report:', newReport.id);

  } catch (error) {
    console.error('❌ Error in emergency report creation - rolling back transaction:', error);
    try {
      await client.query('ROLLBACK');
      console.log('🔄 Transaction rolled back');
    } catch (rollbackError) {
      console.error('❌ Error during rollback:', rollbackError);
    }
    client.release();
    console.log('🔌 Database client released after error');
    res.status(500).json({ message: 'Server Error', error: error.message });
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
    
    console.log(`[HISTORY] Request received for driver_id: ${driverId}`);

    const query = {
      text: 'SELECT * FROM emergency_reports WHERE driver_id = $1 ORDER BY created_at DESC',
      values: [driverId],
    };

    const { rows } = await pool.query(query);

    console.log(`[HISTORY] Found ${rows.length} reports in the database.`);

    res.status(200).json(rows);
  } catch (error) {
    console.error('[HISTORY] Error fetching reports:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Fetches the contact phone number for the depot associated with a given driver.
 */
const getDepotContact = async (req, res) => {
  try {
    const { driverId } = req.params;
    console.log(`[CONTACT] Looking up phone number for driver_id: ${driverId}`);

    if (!driverId) {
      return res.status(400).json({ message: 'Driver ID is required' });
    }

    const driverIdNum = parseInt(driverId, 10);
    if (isNaN(driverIdNum)) {
      return res.status(400).json({ message: 'Invalid driver ID format' });
    }

    const result = await Emergency.findDepotEngineerByDriverId(driverIdNum);
    console.log('[DEBUG] Phone lookup result:', result);

    if (!result || result.length === 0 || !result[0].phone) {
      console.log('[CONTACT] No phone number found');
      return res.status(404).json({ 
        message: 'Contact number not found',
      });
    }

    console.log('[CONTACT] Found phone number:', result[0].phone);
    res.status(200).json({ phone: result[0].phone });

  } catch (error) {
    console.error('[CONTACT] Error:', error);
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message
    });
  }
};


module.exports = {
  createEmergencyReport,
  getReportWithMessages,
  addMessageToReport,
  getReportsByDriver,
  getDepotContact, // 👈 Export the new function
};
