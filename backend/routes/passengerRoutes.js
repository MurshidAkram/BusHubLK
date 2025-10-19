const express = require('express');
const router = express.Router();
const {
    addEmergencyContact,
    getEmergencyContacts,
    updateEmergencyContact,
    deleteEmergencyContact,
    notifyEmergencyContacts,
    createAlert,
    getAlertsByPassenger,
    clearAllAlerts,
    getNearestDepot,
} = require('../controllers/passengerController');

// --- Passenger Contact Routes ---
router.get('/:id/contacts', getEmergencyContacts);
router.post('/:id/contacts', addEmergencyContact);
router.put('/:id/contacts/:contactId', updateEmergencyContact);
router.delete('/:id/contacts/:contactId', deleteEmergencyContact);

// --- Emergency Alert Routes ---
router.post('/notify-contacts', notifyEmergencyContacts); // Endpoint for sending notifications
router.post('/:id/alerts', createAlert); // Endpoint for creating an alert record
router.get('/:id/alerts', getAlertsByPassenger); // Endpoint for fetching alert history
router.delete('/:id/alerts', clearAllAlerts); // Endpoint for clearing all alerts (soft delete)
router.get('/:id/nearest-depot', getNearestDepot);


module.exports = router;