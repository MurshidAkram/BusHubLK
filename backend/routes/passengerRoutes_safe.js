const express = require('express');
const router = express.Router();

// Try to load the controller and handle missing exports gracefully
let passengerController;
try {
    passengerController = require('../controllers/passengerController');
    console.log('✅ passengerController loaded successfully');
    console.log('Available exports:', Object.keys(passengerController));
} catch (error) {
    console.error('❌ Failed to load passengerController:', error.message);
    throw error;
}

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
} = passengerController;

// Optional: Only add setPrimaryContact if it exists
const setPrimaryContact = passengerController.setPrimaryContact;

// --- Passenger Contact Routes ---
router.get('/:id/contacts', getEmergencyContacts);
router.post('/:id/contacts', addEmergencyContact);
router.put('/:id/contacts/:contactId', updateEmergencyContact);

// Only add this route if setPrimaryContact exists
if (setPrimaryContact) {
    router.put('/:id/contacts/:contactId/set-primary', setPrimaryContact);
    console.log('✅ setPrimaryContact route registered');
} else {
    console.warn('⚠️  setPrimaryContact not available - route not registered');
}

router.delete('/:id/contacts/:contactId', deleteEmergencyContact);

// --- Emergency Alert Routes ---
router.post('/notify-contacts', notifyEmergencyContacts); // Endpoint for sending notifications
router.post('/:id/alerts', createAlert); // Endpoint for creating an alert record
router.get('/:id/alerts', getAlertsByPassenger); // Endpoint for fetching alert history
router.delete('/:id/alerts', clearAllAlerts); // Endpoint for clearing all alerts (soft delete)
router.get('/:id/nearest-depot', getNearestDepot);

console.log('✅ All passengerRoutes registered successfully');

module.exports = router;
