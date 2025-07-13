// In routes/passengerRoutes.js

const express = require('express');
const router = express.Router();
const {
    addEmergencyContact,
    getEmergencyContacts,
    updateEmergencyContact,
    deleteEmergencyContact,
    notifyEmergencyContacts, // 1. Import the new controller function
} = require('../controllers/passengerController');

// --- NEW: Route to trigger emergency notifications ---
// Route: POST /api/passengers/notify-contacts
router.post('/notify-contacts', notifyEmergencyContacts); // 2. Add the new route

// GET all contacts for a specific passenger
// Route: GET /api/passengers/:id/contacts
router.get('/:id/contacts', getEmergencyContacts);

// POST a new contact for a specific passenger
// Route: POST /api/passengers/:id/contacts
router.post('/:id/contacts', addEmergencyContact);

// PUT (update) a specific contact for a specific passenger
// Route: PUT /api/passengers/:id/contacts/:contactId
router.put('/:id/contacts/:contactId', updateEmergencyContact);

// DELETE a specific contact for a specific passenger
// Route: DELETE /api/passengers/:id/contacts/:contactId
router.delete('/:id/contacts/:contactId', deleteEmergencyContact);

module.exports = router;