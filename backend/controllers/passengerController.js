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
    const { id, contactId } = req.params; // Get both passenger ID and contact ID
    const updates = req.body;
    const updated = await Passenger.updateEmergencyContact(id, contactId, updates); // Pass both IDs

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
    const { id, contactId } = req.params; // Get both passenger ID and contact ID
    const deleted = await Passenger.deleteEmergencyContact(id, contactId); // Pass both IDs

    if (!deleted) {
      return res.status(404).json({ message: 'Contact not found or does not belong to this passenger.' });
    }
    res.json({ success: true, message: 'Contact deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  addEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
};