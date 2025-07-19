const pool = require('../config/db');

const Passenger = {
  // === Emergency Contact Functions ===
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
  
  updateEmergencyContact: async (passengerId, contactId, updates) => {
    const { name, phone, relationship, email, isPrimary } = updates;
    const query = {
      text: `UPDATE emergency_contacts
                SET name=$1, phone=$2, relationship=$3, email=$4, is_primary=$5
                WHERE id=$6 AND passenger_id=$7 RETURNING *`,
      values: [name, phone, relationship, email, isPrimary, contactId, passengerId],
    };
    const { rows } = await pool.query(query);
    return rows[0];
  },

  deleteEmergencyContact: async (passengerId, contactId) => {
    const query = {
      text: `DELETE FROM emergency_contacts WHERE id=$1 AND passenger_id=$2 RETURNING *`,
      values: [contactId, passengerId],
    };
    const { rows } = await pool.query(query);
    return rows[0];
  },

  // === Alert Functions ===
  createAlertForPassenger: async (passengerId, emergencyType, passengerLatitude, passengerLongitude, depotId) => {
    const query = {
      text: `INSERT INTO alerts(passenger_id, emergency_type, passenger_latitude, passenger_longitude, depot_id, created_at) 
             VALUES($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *`,
      values: [passengerId, emergencyType, passengerLatitude, passengerLongitude, depotId],
    };
    try {
        const { rows } = await pool.query(query);
        return rows[0];
    } catch (err) {
        console.error('Error in Passenger.createAlertForPassenger (model):', err.message);
        throw err;
    }
  },

  // MODIFIED: getAlertsForPassenger - removed passenger_latitude and passenger_longitude from SELECT
  getAlertsForPassenger: async (passengerId) => {
    const query = {
      text: `
        SELECT
            a.id,
            a.emergency_type,
            a.created_at,
            -- Removed passenger_latitude and passenger_longitude from selection
            d.depot_name -- Select depot_name from the joined depots table
        FROM alerts a
        LEFT JOIN depots d ON a.depot_id = d.depot_id -- Join with main depots table
        WHERE a.passenger_id = $1
        ORDER BY a.created_at DESC
      `,
      values: [passengerId],
    };
    try {
        const { rows } = await pool.query(query);
        return rows;
    } catch (err) {
        console.error('Error in Passenger.getAlertsForPassenger (model):', err.message);
        throw err;
    }
  },

  // === Depot Location Functions ===
  getNearestDepotLocation: async (latitude, longitude) => {
    const query = {
      text: `
        SELECT
            dl.depot_id,
            dl.latitude,
            dl.longitude,
            d.depot_name, -- Get depot_name from the main depots table
            (
                6371 * acos(
                    cos(radians($1)) * cos(radians(dl.latitude)) *
                    cos(radians(dl.longitude) - radians($2)) +
                    sin(radians($1)) * sin(radians(dl.latitude))
                )
            ) AS distance_km
        FROM depot_locations dl
        JOIN depots d ON dl.depot_id = d.depot_id -- Join to get depot_name
        ORDER BY distance_km ASC
        LIMIT 1;
      `,
      values: [latitude, longitude],
    };
    try {
        const { rows } = await pool.query(query);
        return rows[0];
    } catch (err) {
        console.error('Error in Passenger.getNearestDepotLocation (model):', err.message);
        throw err;
    }
  },
  
  // === Bus Location Functions (For future expansion or other apps, not for passenger alerts) ===
  getBusCurrentLocation: async (busId) => { // This is here but unused by current passenger alert flow
    const query = {
      text: `SELECT bus_id, latitude, longitude, last_updated FROM bus_locations WHERE bus_id = $1`,
      values: [busId],
    };
    try {
        const { rows } = await pool.query(query);
        return rows[0];
    } catch (err) {
        console.error('Error in Passenger.getBusCurrentLocation (model):', err.message);
        throw err;
    }
  },

  updateBusLocation: async (busId, latitude, longitude) => { // This is here but unused by current passenger alert flow
    const query = {
      text: `
        INSERT INTO bus_locations(bus_id, latitude, longitude, last_updated)
        VALUES($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (bus_id) DO UPDATE SET
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          last_updated = CURRENT_TIMESTAMP
        RETURNING *;
      `,
      values: [busId, latitude, longitude],
    };
    try {
        const { rows } = await pool.query(query);
        return rows[0];
    } catch (err) {
        console.error('Error in Passenger.updateBusLocation (model):', err.message);
        throw err;
    }
  },

};

module.exports = Passenger;