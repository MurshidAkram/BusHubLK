// controllers/BusOccupancyController.js
const BusOccupancy = require('../models/BusOccupancyUpdate');
const pool = require('../config/db');

// Helper function to check if bus exists
async function checkBusExists(busId) {
  try {
    const result = await pool.query('SELECT * FROM buses WHERE bus_id = $1', [busId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if bus exists:', error);
    return false;
  }
}

// Helper function to get a default passenger ID
async function getDefaultPassengerId() {
  try {
    // Try to get the first passenger from the database
    const result = await pool.query('SELECT passenger_id FROM passengers LIMIT 1');
    if (result.rows.length > 0) {
      return result.rows[0].passenger_id;
    }
    
    // If no passengers exist, return null (this will cause an error later)
    console.error('No passengers found in database');
    return null;
  } catch (error) {
    console.error('Error getting default passenger ID:', error);
    throw error;
  }
}

// Helper function to create a demo bus if needed
async function createDemoBusIfNeeded(busId) {
  try {
    const busExists = await checkBusExists(busId);
    if (!busExists) {
      console.log(`Creating demo bus with ID ${busId}`);
      await pool.query(
        `INSERT INTO buses (bus_id, registration_number, depot_id, class, manufacturer, model, year, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [busId, `DEMO-${busId}`, 1, 'A', 'Demo Manufacturer', 'Demo Model', 2023, 'Active']
      );
      console.log(`Demo bus with ID ${busId} created successfully`);
    }
  } catch (error) {
    console.error(`Error creating demo bus with ID ${busId}:`, error);
    throw error;
  }
}

const createBusOccupancy = async (req, res) => {
  try {
    console.log('Received occupancy update request:', {
      params: req.params,
      body: req.body,
      headers: req.headers
    });
    
    // Get busId from route parameter or body
    const busIdFromRoute = req.params.busId;
    const { busId: busIdFromBody, occupancyLevel, latitude, longitude, updatedAt, confidence, passengerId } = req.body;
    
    // Use route parameter if available, otherwise use body
    const busId = busIdFromRoute || busIdFromBody;
    
    // Convert busId to integer
    const busIdInt = parseInt(busId, 10);
    
    if (isNaN(busIdInt) || !occupancyLevel) {
      return res.status(400).json({ 
        message: 'Valid Bus ID and occupancy level are required.',
        received: { busId, busIdInt, occupancyLevel }
      });
    }

    const isDemoMode = req.headers['x-demo-mode'] === 'true';
    
    // For demo mode, create the bus if it doesn't exist
    if (isDemoMode) {
      await createDemoBusIfNeeded(busIdInt);
    } else {
      // Check if the bus exists
      const busExists = await checkBusExists(busIdInt);
      if (!busExists) {
        return res.status(404).json({ 
          message: `Bus with ID ${busIdInt} not found in database.`,
          suggestion: 'Enable demo mode to auto-create buses'
        });
      }
    }

    // Get passenger ID (from request or use default)
    let actualPassengerId = passengerId;
    if (!actualPassengerId) {
      actualPassengerId = await getDefaultPassengerId();
      if (!actualPassengerId) {
        return res.status(400).json({ 
          message: 'Passenger ID is required and no default passenger was found',
          suggestion: 'Create a passenger record first or provide a passenger_id'
        });
      }
    }

    console.log(`Creating occupancy record with bus_id=${busIdInt}, passenger_id=${actualPassengerId}`);
    
    const newOccupancy = await BusOccupancy.create({
      busId: busIdInt,
      passengerId: actualPassengerId,
      occupancyLevel,
      latitude,
      longitude,
      updatedAt: updatedAt || new Date().toISOString(),
      confidence
    });

    res.status(201).json(newOccupancy);
  } catch (error) {
    console.error('Error in createBusOccupancy:', error);
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getAllBusOccupancies = async (req, res) => {
  try {
    const occupancies = await BusOccupancy.getAllOccupancies();
    if (!occupancies.length) {
      return res.status(200).json([]); // Return empty array if no records
    }
    res.status(200).json(occupancies);
  } catch (error) {
    console.error('Error in getAllBusOccupancies:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getBusOccupancy = async (req, res) => {
  try {
    const { busId } = req.params;
    const busIdInt = parseInt(busId, 10);
    
    if (isNaN(busIdInt)) {
      return res.status(400).json({ message: 'Invalid bus ID format' });
    }
    
    const occupancies = await BusOccupancy.findByBusId(busIdInt);
    
    if (!occupancies.length) {
      return res.status(404).json({ message: 'No occupancy records found for this bus.' });
    }

    res.status(200).json(occupancies);
  } catch (error) {
    console.error('Error in getBusOccupancy:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const updateBusOccupancy = async (req, res) => {
  try {
    const { busId, occupancyId } = req.params;
    const busIdInt = parseInt(busId, 10);
    const occupancyIdInt = parseInt(occupancyId, 10);
    
    if (isNaN(busIdInt) || isNaN(occupancyIdInt)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    const updates = req.body;

    if (!updates.occupancyLevel) {
      return res.status(400).json({ message: 'Occupancy level is required for update.' });
    }

    const updatedOccupancy = await BusOccupancy.findOneAndUpdate(
      occupancyIdInt, busIdInt,
      { ...updates, updatedAt: new Date().toISOString() }
    );

    if (!updatedOccupancy) {
      return res.status(404).json({ message: 'Occupancy record not found or does not belong to this bus.' });
    }

    res.status(200).json(updatedOccupancy);
  } catch (error) {
    console.error('Error in updateBusOccupancy:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const deleteBusOccupancy = async (req, res) => {
  try {
    const { busId, occupancyId } = req.params;
    const busIdInt = parseInt(busId, 10);
    const occupancyIdInt = parseInt(occupancyId, 10);
    
    if (isNaN(busIdInt) || isNaN(occupancyIdInt)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const deletedOccupancy = await BusOccupancy.findOneAndDelete(occupancyIdInt, busIdInt);

    if (!deletedOccupancy) {
      return res.status(404).json({ message: 'Occupancy record not found or does not belong to this bus.' });
    }

    res.status(200).json({ success: true, message: 'Occupancy record deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteBusOccupancy:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createBusOccupancy,
  getAllBusOccupancies,
  getBusOccupancy,
  updateBusOccupancy,
  deleteBusOccupancy,
};