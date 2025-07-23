const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const sendgrid = require('@sendgrid/mail');
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const Passenger = require('../models/passengerModel');

// Helper function to format phone numbers to E.164
const formatPhoneNumberToE164 = (phoneNumber) => {
    if (!phoneNumber) return null;
    let cleanedNumber = phoneNumber.replace(/[^0-9+]/g, ''); // Remove non-numeric characters except '+'
    
    // If it already starts with '+', assume it's E.164
    if (cleanedNumber.startsWith('+')) {
        return cleanedNumber;
    }
    
    // For Sri Lankan numbers, if it starts with '0', replace with '+94'
    if (cleanedNumber.startsWith('0')) {
        return '+94' + cleanedNumber.substring(1);
    }
    
    // If it's a number without '0' prefix and no '+', assume it's a 9-digit local number and prepend '+94'
    // This is a heuristic, adjust based on your expected input formats
    if (cleanedNumber.length === 9) { // Example: 771234567 -> +94771234567
        return '+94' + cleanedNumber;
    }

    // Fallback if none of the above match, might still be invalid for Twilio
    return cleanedNumber;
};


// === Emergency Contact Controllers ===
const addEmergencyContact = async (req, res) => {
  try {
    const { id } = req.params; // This is passengerId
    const { name, phone, relationship, email, isPrimary } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required.' });
    }

    // Optionally, format the phone number to E.164 here before storing it
    // const formattedPhone = formatPhoneNumberToE164(phone);
    // if (!formattedPhone) {
    //     return res.status(400).json({ message: 'Invalid phone number format.' });
    // }
    // const newContact = await Passenger.addEmergencyContact(id, name, formattedPhone, relationship, email, isPrimary);
    
    // For now, storing as is, and formatting during SMS sending
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

    // Optionally, format the phone number to E.164 here before updating it
    // if (updates.phone) {
    //     const formattedPhone = formatPhoneNumberToE164(updates.phone);
    //     if (!formattedPhone) {
    //         return res.status(400).json({ message: 'Invalid phone number format.' });
    //     }
    //     updates.phone = formattedPhone;
    // }

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
  let nearestDepotContactPhone = null;
  let depotName = 'N/A';

  const notificationSummary = {
    smsSentToContacts: 0,
    emailsSentToContacts: 0,
    smsSentToDepot: false,
    depotName: 'N/A',
    overallSuccess: true,
    detailedMessage: [],
  };

  if (latitude !== null && longitude !== null) {
      locationInfo = `Passenger Location: Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}.`;
      try {
          const nearestDepot = await Passenger.getNearestDepotLocation(latitude, longitude);
          if (nearestDepot) {
              depotName = nearestDepot.depot_name;
              nearestDepotContactPhone = nearestDepot.contact_phone;
              locationInfo += ` Nearest Depot: ${depotName}.`;
              notificationSummary.depotName = depotName;
          }
      } catch (depotErr) {
          console.warn('Could not resolve depot for notification:', depotErr.message);
          notificationSummary.detailedMessage.push(`Warning: Could not identify nearest depot (${depotErr.message}).`);
      }
  }

  console.log(`Notification request received for: ${emergencyType}. ${locationInfo}`);

  const notificationPromises = [];

  // 1. Send SMS/Email to Passenger's Emergency Contacts
  contacts.forEach(contact => {
    const smsBody = `Emergency Alert: ${emergencyType}. ${locationInfo} This is an automated message. Please contact the passenger immediately.`;
    const emailSubject = `Emergency Alert: ${emergencyType}`;
    const emailText = `Hello ${contact.name},\n\nAn automated emergency alert has been triggered for a passenger. The emergency type is: ${emergencyType}.\n${locationInfo}\n\nPlease attempt to contact them immediately.`;
    const emailHtml = `<strong>Hello ${contact.name},</strong><br><br>An automated emergency alert has been triggered for a passenger. The emergency type is: <strong>${emergencyType}</strong>.<br>${locationInfo.replace(/\n/g, '<br>')}<br><br>Please attempt to contact them immediately.`;

    if (contact.phone) {
      const formattedPhone = formatPhoneNumberToE164(contact.phone);
      if (formattedPhone) {
        notificationPromises.push(
          twilio.messages.create({
            body: smsBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone
          }).then(() => { notificationSummary.smsSentToContacts++; })
          .catch(err => {
              console.error(`SMS to ${contact.phone} failed:`, err.message, 'Code:', err.code, 'More Info:', err.moreInfo);
              notificationSummary.overallSuccess = false;
              notificationSummary.detailedMessage.push(`Failed to send SMS to ${contact.name}: ${err.message || 'Unknown Twilio error'}`);
          })
        );
      } else {
          notificationSummary.detailedMessage.push(`Skipped SMS to ${contact.name}: Invalid phone number format.`);
      }
    }

    if (contact.email) {
      const emailMessage = {
        to: contact.email,
        from: process.env.SENDER_EMAIL,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      };
      notificationPromises.push(
        sendgrid.send(emailMessage).then(() => { notificationSummary.emailsSentToContacts++; })
        .catch(err => { console.error(`Email to ${contact.email} failed: ${err.message}`); notificationSummary.overallSuccess = false; notificationSummary.detailedMessage.push(`Failed to send email to ${contact.name}: ${err.message || 'Unknown SendGrid error'}`); })
      );
    }
  });

  // 2. Send SMS to Nearest Depot (if phone number is available)
  if (nearestDepotContactPhone) {
    const formattedDepotPhone = formatPhoneNumberToE164(nearestDepotContactPhone);
    if (formattedDepotPhone) {
        const depotSmsBody = `URGENT! Emergency Alert Type: ${emergencyType}. Passenger Location: Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}. Nearest Depot: ${depotName}. Please dispatch assistance.`;
        notificationPromises.push(
            twilio.messages.create({
                body: depotSmsBody,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: formattedDepotPhone
            }).then(() => { notificationSummary.smsSentToDepot = true; notificationSummary.detailedMessage.push(`SMS sent to nearest depot (${depotName}).`); })
            .catch(err => {
                console.error(`SMS to nearest depot (${depotName}, ${nearestDepotContactPhone}) failed:`, err.message, 'Code:', err.code, 'More Info:', err.moreInfo);
                notificationSummary.overallSuccess = false;
                notificationSummary.detailedMessage.push(`Failed to send SMS to nearest depot (${depotName}): ${err.message || 'Unknown Twilio error'}`);
            })
        );
    } else {
        console.warn('Nearest depot phone number could not be formatted to E.164, skipping SMS to depot.');
        notificationSummary.detailedMessage.push('Nearest depot phone number invalid, SMS to depot skipped.');
    }
  } else {
    console.warn('Nearest depot phone number not available, skipping SMS to depot.');
    notificationSummary.detailedMessage.push('Nearest depot phone number not available, SMS to depot skipped.');
  }

  try {
    await Promise.allSettled(notificationPromises);
    res.status(200).json({ message: 'Notifications initiated.', summary: notificationSummary });
  }
  catch (error) {
    console.error('A critical error occurred during notification processing:', error);
    notificationSummary.overallSuccess = false;
    notificationSummary.detailedMessage.push('Critical server error during notifications.');
    res.status(500).json({ message: 'An error occurred while processing notifications.', summary: notificationSummary });
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

// === New Controller for Nearest Depot (for frontend) ===
const getNearestDepot = async (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    try {
        const nearestDepot = await Passenger.getNearestDepotLocation(parseFloat(latitude), parseFloat(longitude));
        if (nearestDepot) {
            res.status(200).json(nearestDepot);
        } else {
            res.status(404).json({ message: 'No depots found or location services not available.' });
        }
    } catch (error) {
        console.error('Error fetching nearest depot:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


module.exports = {
  addEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
  notifyEmergencyContacts,
  createAlert,
  getAlertsByPassenger,
  getNearestDepot, // Export the new function
};