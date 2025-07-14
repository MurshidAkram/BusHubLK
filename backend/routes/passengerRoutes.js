const express = require('express');
const router = express.Router();
const {
  addEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
} = require('../controllers/passengerController');

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