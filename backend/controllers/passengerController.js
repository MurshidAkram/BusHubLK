// controllers/passengerController.js
const Passenger = require('../models/passengerModel');

const addEmergencyContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, relationship, email, isPrimary } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required.' });
    }

    const newContact = await Passenger.addEmergencyContact(
      id, name, phone, relationship, email, isPrimary
    );
    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getEmergencyContacts = async (req, res) => {
  try {
    const { id } = req.params;
    const contacts = await Passenger.getEmergencyContacts(id);
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
const updateEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const updates = req.body;
    const updated = await Passenger.updateEmergencyContact(contactId, updates);
    if (!updated) return res.status(404).json({ message: 'Contact not found.' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const deleteEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const deleted = await Passenger.deleteEmergencyContact(contactId);
    if (!deleted) return res.status(404).json({ message: 'Contact not found.' });
    res.json({ success: true });
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