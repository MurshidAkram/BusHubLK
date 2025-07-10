// routes/passengerRoutes.js

const express = require('express');
const router = express.Router();

// Import the controller function
const { 
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} = require('../controllers/passengerController');
console.log('✅ passengerRoutes.js file is being read by Node.js');
// Define the route for GET and POST requests
router.route('/:id/contacts')
  .get(getEmergencyContacts) // This handles the GET request
  .post(addEmergencyContact);

  router.route('/:id/contacts/:contactId')
  .put(updateEmergencyContact)
  .delete(deleteEmergencyContact);
module.exports = router;