const pool = require('../config/db');

const Passenger = {
  // Add a new emergency contact
  addEmergencyContact: async (passengerId, contactName, contactPhone, relationship, email, isPrimary) => {
    const query = {
      text: `INSERT INTO emergency_contacts 
               (passenger_id, name, phone, relationship, email, is_primary) 
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      values: [passengerId, contactName, contactPhone, relationship, email, isPrimary],
    };
    const { rows } = await pool.query(query);
    return rows[0];
  },

  // Get all emergency contacts for a passenger
  getEmergencyContacts: async (passengerId) => {
    const query = {
      text: `SELECT 
               id, 
               name AS emergency_contact_name, 
               phone AS emergency_contact_phone, 
               relationship, 
               email, 
               is_primary 
             FROM emergency_contacts 
             WHERE passenger_id = $1`,
      values: [passengerId],
    };
    const { rows } = await pool.query(query);
    return rows;
  },
  
  // Update an emergency contact, ensuring it belongs to the passenger
  updateEmergencyContact: async (passengerId, contactId, updates) => {
    const { name, phone, relationship, email, isPrimary } = updates;
    const query = {
      text: `UPDATE emergency_contacts
               SET name=$1, phone=$2, relationship=$3, email=$4, is_primary=$5
               WHERE id=$6 AND passenger_id=$7 RETURNING *`, // Checks both IDs
      values: [name, phone, relationship, email, isPrimary, contactId, passengerId],
    };
    const { rows } = await pool.query(query);
    return rows[0];
  },

  // Delete an emergency contact, ensuring it belongs to the passenger
  deleteEmergencyContact: async (passengerId, contactId) => {
    const query = {
      text: `DELETE FROM emergency_contacts WHERE id=$1 AND passenger_id=$2 RETURNING *`, // Checks both IDs
      values: [contactId, passengerId],
    };
    const { rows } = await pool.query(query);
    return rows[0];
  },
};

module.exports = Passenger;