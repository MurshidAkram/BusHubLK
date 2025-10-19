const sendgrid = require('@sendgrid/mail');
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const db = require('../config/db');
const Passenger = require('../models/passengerModel');
const notifySmsService = require('../services/notifySmsService');
const smsLogService = require('../services/smsLogService');
const emergencySmsLogService = require('../services/emergencySmsLogService');

// Helper function to format phone numbers for Notify.lk (94 + 9 digits)
const formatPhoneNumberForNotify = (phoneNumber) => {
    if (!phoneNumber) return null;
  const cleanedNumber = phoneNumber.replace(/[^0-9+]/g, '');

  if (cleanedNumber.startsWith('+')) {
    return notifySmsService.normalizeToDialString(cleanedNumber);
  }

  if (cleanedNumber.startsWith('0')) {
    return notifySmsService.normalizeToDialString(`94${cleanedNumber.substring(1)}`);
  }

  return notifySmsService.normalizeToDialString(cleanedNumber);
};


// === Emergency Contact Controllers ===
const addEmergencyContact = async (req, res) => {
  try {
    const { id } = req.params; // This is passengerId
    const { name, phone, relationship, email, isPrimary } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required.' });
    }

    // For now, storing as provided, formatting happens during SMS sending
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
  let nearestDepotContactPhone = null;
  let depotName = 'N/A';
  let passengerPhone = '';

  // Get passenger phone number if passengerId is provided
  console.log('🔍 PassengerId from request:', req.body.passengerId);
  if (req.body.passengerId) {
    try {
      const passengerResult = await db.query(
        'SELECT phone FROM passengers WHERE id = $1',
        [req.body.passengerId]
      );
      console.log('📱 Passenger query result:', passengerResult.rows);
      if (passengerResult.rows.length > 0 && passengerResult.rows[0].phone) {
        passengerPhone = passengerResult.rows[0].phone;
        console.log('✅ Passenger phone found:', passengerPhone);
      } else {
        console.log('⚠️ No passenger phone found in database');
      }
    } catch (phoneErr) {
      console.warn('❌ Could not fetch passenger phone:', phoneErr.message);
    }
  } else {
    console.log('⚠️ No passengerId provided in request body');
  }

  const notificationSummary = {
    smsSentToContacts: 0,
    emailsSentToContacts: 0,
    smsSentToDepot: false,
    depotName: 'N/A',
    overallSuccess: true,
    detailedMessage: [],
  };

  if (latitude !== null && longitude !== null) {
      const googleMapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      locationInfo = `Location: ${googleMapsLink}`;
      try {
          const nearestDepot = await Passenger.getNearestDepotLocation(latitude, longitude);
          if (nearestDepot) {
              depotName = nearestDepot.depot_name;
              nearestDepotContactPhone = nearestDepot.contact_phone;
              locationInfo += ` | Nearest Depot: ${depotName}`;
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
  const passengerContact = passengerPhone ? ` Contact: ${passengerPhone}.` : '';
  console.log('📞 Passenger contact string:', passengerContact);
  const smsBodyForContacts = `Emergency Alert: ${emergencyType}. ${locationInfo}${passengerContact} This is an automated message. Please contact the passenger immediately.`;
  console.log('📨 Final SMS message:', smsBodyForContacts);
  const emailSubject = `Emergency Alert: ${emergencyType}`;

  const normalizedContactNumbers = new Map();

  contacts.forEach(contact => {
    const passengerContactInfo = passengerPhone ? `\nPassenger Contact: ${passengerPhone}` : '';
    const emailText = `Hello ${contact.name},\n\nAn automated emergency alert has been triggered for a passenger. The emergency type is: ${emergencyType}.\n${locationInfo}${passengerContactInfo}\n\nPlease attempt to contact them immediately.`;
    const emailHtml = `<strong>Hello ${contact.name},</strong><br><br>An automated emergency alert has been triggered for a passenger. The emergency type is: <strong>${emergencyType}</strong>.<br>${locationInfo.replace(/\n/g, '<br>')}${passengerContactInfo ? `<br><strong>Passenger Contact:</strong> ${passengerPhone}` : ''}<br><br>Please attempt to contact them immediately.`;

    if (contact.phone) {
      const formatted = formatPhoneNumberForNotify(contact.phone);
      if (formatted) {
        if (!normalizedContactNumbers.has(formatted)) {
          normalizedContactNumbers.set(formatted, []);
        }
        normalizedContactNumbers.get(formatted).push(contact);
      } else {
        notificationSummary.overallSuccess = false;
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
        sendgrid.send(emailMessage)
          .then(() => { notificationSummary.emailsSentToContacts++; })
          .catch(err => {
            console.error(`Email to ${contact.email} failed: ${err.message}`);
            notificationSummary.overallSuccess = false;
            notificationSummary.detailedMessage.push(`Failed to send email to ${contact.name}: ${err.message || 'Unknown SendGrid error'}`);
          })
      );
    }
  });

  if (normalizedContactNumbers.size > 0) {
    if (!notifySmsService.hasNotifyCredentials) {
      notificationSummary.overallSuccess = false;
      notificationSummary.detailedMessage.push('Notify.lk credentials are not configured; unable to send SMS to contacts.');
    } else {
      const phoneNumbers = Array.from(normalizedContactNumbers.keys());
      let smsLogPayload = {
        provider: 'notify.lk',
        channelId: null,
        senderId: req.body.passengerId || null,
        message: smsBodyForContacts,
        requestedCount: phoneNumbers.length,
        deliveredCount: 0,
        status: 'pending',
        recipients: phoneNumbers,
        details: { emergencyType, location: locationInfo }
      };

      try {
        const smsResult = await notifySmsService.sendSmsToRecipients({
          message: smsBodyForContacts,
          phoneNumbers: phoneNumbers
        });

        notificationSummary.smsSentToContacts = smsResult.delivered;
        smsLogPayload.deliveredCount = smsResult.delivered;
        smsLogPayload.requestedCount = smsResult.requested;

        const failedBatches = smsResult.batches.filter(batch => !batch.success);
        if (failedBatches.length > 0) {
          notificationSummary.overallSuccess = false;
          smsLogPayload.status = failedBatches.length === smsResult.batches.length ? 'failed' : 'partial';
          smsLogPayload.details = { 
            ...smsLogPayload.details, 
            failedBatches: failedBatches.map(b => ({ error: b.error, numbers: b.numbers }))
          };
          
          failedBatches.forEach(batch => {
            const impactedContacts = (batch.numbers || [])
              .flatMap(number => normalizedContactNumbers.get(number) || [])
              .map(contact => contact.name);
            const label = impactedContacts.length > 0 ? impactedContacts.join(', ') : (batch.numbers || []).join(', ');
            notificationSummary.detailedMessage.push(`Failed to send SMS to ${label}: ${JSON.stringify(batch.error)}`);
          });
        } else {
          smsLogPayload.status = 'sent';
        }

        // Log to general SMS logs
        await smsLogService.logSms(smsLogPayload);
        
        // Log each SMS individually to emergency SMS logs
        const emergencySmsLogs = [];
        smsResult.batches.forEach(batch => {
          batch.numbers.forEach(phoneNumber => {
            const contactsForNumber = normalizedContactNumbers.get(phoneNumber) || [];
            const contact = contactsForNumber[0]; // Get first contact for this number
            
            emergencySmsLogs.push({
              passengerId: req.body.passengerId || null,
              emergencyType: emergencyType,
              passengerLatitude: latitude,
              passengerLongitude: longitude,
              nearestDepotName: depotName,
              message: smsBodyForContacts,
              recipientPhone: phoneNumber,
              recipientName: contact ? contact.name : null,
              recipientRelationship: contact ? contact.relationship : null,
              deliveryStatus: batch.success ? 'sent' : 'failed',
              deliveryError: batch.success ? null : JSON.stringify(batch.error),
              notifyResponse: batch.response || batch.error
            });
          });
        });
        
        // Log all emergency SMS
        await emergencySmsLogService.logMultipleEmergencySms(emergencySmsLogs);
        console.log(`✅ Logged ${emergencySmsLogs.length} emergency SMS to database`);
        
      } catch (error) {
        console.error('Notify.lk contact SMS dispatch failed:', error);
        notificationSummary.overallSuccess = false;
        notificationSummary.detailedMessage.push(error.message || 'Notify.lk SMS dispatch failed for contacts.');
        
        // Log failed SMS attempt to general log
        smsLogPayload.status = 'failed';
        smsLogPayload.details = { 
          ...smsLogPayload.details, 
          error: error.message 
        };
        await smsLogService.logSms(smsLogPayload);
        
        // Log failed attempts to emergency SMS logs
        const failedSmsLogs = phoneNumbers.map(phoneNumber => {
          const contactsForNumber = normalizedContactNumbers.get(phoneNumber) || [];
          const contact = contactsForNumber[0];
          
          return {
            passengerId: req.body.passengerId || null,
            emergencyType: emergencyType,
            passengerLatitude: latitude,
            passengerLongitude: longitude,
            nearestDepotName: depotName,
            message: smsBodyForContacts,
            recipientPhone: phoneNumber,
            recipientName: contact ? contact.name : null,
            recipientRelationship: contact ? contact.relationship : null,
            deliveryStatus: 'failed',
            deliveryError: error.message,
            notifyResponse: null
          };
        });
        
        await emergencySmsLogService.logMultipleEmergencySms(failedSmsLogs);
      }
    }
  }

  const emailAndOtherPromisesResult = await Promise.allSettled(notificationPromises);
  emailAndOtherPromisesResult.forEach(result => {
    if (result.status === 'rejected') {
      notificationSummary.overallSuccess = false;
    }
  });

  // Depot SMS removed - only sending SMS/Email to emergency contacts
  // Depot phone is only used for manual calling from the app
  
  res.status(200).json({ message: 'Notification processing completed.', summary: notificationSummary });
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

// === Clear All Alerts Controller ===
const clearAllAlerts = async (req, res) => {
  const { id } = req.params; // passengerId

  try {
    const clearedCount = await Passenger.clearAllAlerts(id);
    res.status(200).json({ 
      success: true, 
      message: `${clearedCount} alert(s) cleared successfully.`,
      clearedCount 
    });
  } catch (error) {
    console.error('Error clearing alerts (controller):', error);
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
  clearAllAlerts,
  getNearestDepot, // Export the new function
};
