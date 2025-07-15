// At the top of your controller, add the clients for Twilio and SendGrid
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const sendgrid = require('@sendgrid/mail');
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const Passenger = require('../models/passengerModel');

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
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getEmergencyContacts = async (req, res) => {
  try {
    const { id } = req.params; // This is passengerId
    const contacts = await Passenger.getEmergencyContacts(id);
    res.status(200).json(contacts);
  } catch (error) {
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
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// --- NEW FUNCTION TO SEND NOTIFICATIONS ---
const notifyEmergencyContacts = async (req, res) => {
  const { emergencyType, contacts } = req.body;

  if (!emergencyType || !contacts || !Array.isArray(contacts)) {
    return res.status(400).json({ message: 'Invalid request: Missing emergencyType or contacts.' });
  }

  console.log(`Notification request received for: ${emergencyType}.`);

  // Create a flat array of all notification promises
  const notificationPromises = contacts.flatMap(contact => {
    const promises = [];

    // Add SMS promise if a phone number exists
    if (contact.phone) {
      promises.push(
        twilio.messages.create({
          body: `Emergency Alert: ${emergencyType}. This is an automated message. Please contact the passenger immediately.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact.phone
        }).catch(err => console.error(`SMS to ${contact.phone} failed: ${err.message}`))
      );
    }

    // Add Email promise if an email exists
    if (contact.email) {
      const emailMessage = {
        to: contact.email,
        from: process.env.SENDER_EMAIL,
        subject: `Emergency Alert: ${emergencyType}`,
        text: `Hello ${contact.name},\n\nAn automated emergency alert has been triggered for a passenger. The emergency type is: ${emergencyType}.\n\nPlease attempt to contact them immediately.`,
        html: `<strong>Hello ${contact.name},</strong><br><br>An automated emergency alert has been triggered for a passenger. The emergency type is: <strong>${emergencyType}</strong>.<br><br>Please attempt to contact them immediately.`,
      };
      promises.push(
        sendgrid.send(emailMessage).catch(err => console.error(`Email to ${contact.email} failed: ${err.message}`))
      );
    }
    return promises;
  });

  try {
    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);
    res.status(200).json({ message: 'Notifications initiated successfully.' });
  } catch (error) {
    console.error('A critical error occurred during notification processing:', error);
    res.status(500).json({ message: 'An error occurred while processing notifications.' });
  }
};

// === NEW ALERT CONTROLLERS ===
const createAlert = async (req, res) => {
  const { id } = req.params; // passengerId from the URL
  const { emergencyType, status } = req.body;

  if (!emergencyType || !status) {
    return res.status(400).json({ message: 'emergencyType and status are required fields.' });
  }

  try {
    const newAlert = await Passenger.createAlertForPassenger(id, emergencyType, status);
    res.status(201).json(newAlert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getAlertsByPassenger = async (req, res) => {
  const { id } = req.params; // passengerId

  try {
    const alerts = await Passenger.getAlertsForPassenger(id);
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// --- UPDATE YOUR EXPORTS ---
module.exports = {
  addEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
  notifyEmergencyContacts, // Add the new function here
  createAlert, // Add new function
  getAlertsByPassenger, // Add new function
};