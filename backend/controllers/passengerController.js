const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const sendgrid = require('@sendgrid/mail');
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const Passenger = require('../models/passengerModel');

// === Emergency Contact Controllers ===
const addEmergencyContact = async (req, res) => {
  try {
    const { id } = req.params; // This is passengerId
    const { name, phone, relationship, email, isPrimary } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required.' });
    }

    const newContact = await Passenger.addEmergencyContact(id, name, phone, relationship, email, isPrimary);
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Error in addEmergencyContact (controller):', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getEmergencyContacts = async (req, res) => {
  try {
    const { id } = req.params; // This is passengerId
    const contacts = await Passenger.getEmergencyContacts(id);
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error in getEmergencyContacts (controller):', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const updateEmergencyContact = async (req, res) => {
  try {
    const { id, contactId } = req.params;
    const updates = req.body;
    const updated = await Passenger.updateEmergencyContact(id, contactId, updates);

    if (!updated) {
      return res.status(404).json({ message: 'Contact not found or does not belong to this passenger.' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error in updateEmergencyContact (controller):', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const deleteEmergencyContact = async (req, res) => {
  try {
    const { id, contactId } = req.params;
    const deleted = await Passenger.deleteEmergencyContact(id, contactId);

    if (!deleted) {
      return res.status(404).json({ message: 'Contact not found or does not belong to this passenger.' });
    }
    res.json({ success: true, message: 'Contact deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteEmergencyContact (controller):', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// === Notification Controller ===
const notifyEmergencyContacts = async (req, res) => {
  const { emergencyType, contacts, latitude, longitude } = req.body;

  if (!emergencyType || !contacts || !Array.isArray(contacts)) {
    return res.status(400).json({ message: 'Invalid request: Missing emergencyType or contacts.' });
  }

  let locationInfo = '';
  let depotName = 'N/A';

  if (latitude !== null && longitude !== null) {
      locationInfo = `Passenger Location: Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}.`;
      try {
          const nearestDepot = await Passenger.getNearestDepotLocation(latitude, longitude);
          if (nearestDepot) {
              depotName = nearestDepot.depot_name;
              locationInfo += ` Nearest Depot: ${depotName}.`;
          }
      } catch (depotErr) {
          console.warn('Could not resolve depot for notification:', depotErr.message);
      }
  }

  console.log(`Notification request received for: ${emergencyType}. ${locationInfo}`);

  const notificationPromises = contacts.flatMap(contact => {
    const promises = [];

    const smsBody = `Emergency Alert: ${emergencyType}. ${locationInfo} This is an automated message. Please contact the passenger immediately.`;
    const emailSubject = `Emergency Alert: ${emergencyType}`;
    const emailText = `Hello ${contact.name},\n\nAn automated emergency alert has been triggered for a passenger. The emergency type is: ${emergencyType}.\n${locationInfo}\n\nPlease attempt to contact them immediately.`;
    const emailHtml = `<strong>Hello ${contact.name},</strong><br><br>An automated emergency alert has been triggered for a passenger. The emergency type is: <strong>${emergencyType}</strong>.<br>${locationInfo.replace(/\n/g, '<br>')}<br><br>Please attempt to contact them immediately.`;

    if (contact.phone) {
      promises.push(
        twilio.messages.create({
          body: smsBody,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact.phone
        }).catch(err => console.error(`SMS to ${contact.phone} failed: ${err.message}`))
      );
    }

    if (contact.email) {
      const emailMessage = {
        to: contact.email,
        from: process.env.SENDER_EMAIL,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      };
      promises.push(
        sendgrid.send(emailMessage).catch(err => console.error(`Email to ${contact.email} failed: ${err.message}`))
      );
    }
    return promises;
  });

  try {
    await Promise.all(notificationPromises);
    res.status(200).json({ message: 'Notifications initiated successfully.' });
  }
  catch (error) {
    console.error('A critical error occurred during notification processing:', error);
    res.status(500).json({ message: 'An error occurred while processing notifications.' });
  }
};

// === Alert Controllers ===
const createAlert = async (req, res) => {
  const { id } = req.params; // passengerId from the URL
  const { emergencyType, passenger_latitude, passenger_longitude } = req.body;

  if (!emergencyType) {
    return res.status(400).json({ message: 'emergencyType is required.' });
  }

  let depotId = null;
  let depotName = null;

  if (passenger_latitude !== null && passenger_longitude !== null) {
      try {
          const nearestDepot = await Passenger.getNearestDepotLocation(passenger_latitude, passenger_longitude);
          if (nearestDepot) {
              depotId = nearestDepot.depot_id;
              depotName = nearestDepot.depot_name;
          }
      } catch (depotError) {
          console.error('Error resolving nearest depot (controller):', depotError);
      }
  }

  try {
    const newAlert = await Passenger.createAlertForPassenger(id, emergencyType, passenger_latitude, passenger_longitude, depotId);
    res.status(201).json({ ...newAlert, depot_name: depotName });
  } catch (error) {
    console.error('Error creating alert (controller):', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getAlertsByPassenger = async (req, res) => {
  const { id } = req.params; // passengerId

  try {
    const alerts = await Passenger.getAlertsForPassenger(id);
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching alerts (controller):', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Export only the relevant functions
module.exports = {
  addEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
  notifyEmergencyContacts,
  createAlert,
  getAlertsByPassenger,
};