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

// Get average occupancy levels for multiple buses (for BusTrackingScreen)
const getAverageOccupancyLevels = async (req, res) => {
  try {
    const { busIds, timeWindowMinutes = 30 } = req.query;
    
    if (!busIds) {
      return res.status(400).json({ message: 'busIds parameter is required' });
    }
    
    // Parse busIds - can be comma-separated string or array
    let busIdArray;
    if (typeof busIds === 'string') {
      busIdArray = busIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    } else if (Array.isArray(busIds)) {
      busIdArray = busIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    } else {
      return res.status(400).json({ message: 'Invalid busIds format' });
    }
    
    if (busIdArray.length === 0) {
      return res.status(400).json({ message: 'No valid bus IDs provided' });
    }
    
    console.log(`📊 Calculating average occupancy for buses: ${busIdArray.join(', ')} within last ${timeWindowMinutes} minutes`);
    
    // Calculate average occupancy for each bus based on recent passenger reports
    const result = await pool.query(`
      WITH recent_reports AS (
        SELECT 
          bo.bus_id,
          b.registration_number,
          bo.occupancy_level,
          bo.updated_at,
          bo.confidence,
          CASE bo.occupancy_level
            WHEN 'not_crowded' THEN 1
            WHEN 'not_too_crowded' THEN 2
            WHEN 'crowded' THEN 3
            WHEN 'very_crowded' THEN 4
            ELSE 2 -- Default to 'not_too_crowded'
          END as occupancy_score,
          ROW_NUMBER() OVER (PARTITION BY bo.bus_id ORDER BY bo.updated_at DESC) as rn
        FROM bus_occupancy bo
        JOIN buses b ON bo.bus_id = b.bus_id
        WHERE bo.bus_id = ANY($1)
          AND bo.updated_at >= NOW() - INTERVAL '${timeWindowMinutes} minutes'
      ),
      weighted_averages AS (
        SELECT 
          bus_id,
          registration_number,
          COUNT(*) as report_count,
          ROUND(AVG(occupancy_score * confidence / 100.0)) as avg_weighted_score,
          ROUND(AVG(confidence)) as avg_confidence,
          MAX(updated_at) as last_report_time,
          CASE 
            WHEN ROUND(AVG(occupancy_score * confidence / 100.0)) <= 1 THEN 'not_crowded'
            WHEN ROUND(AVG(occupancy_score * confidence / 100.0)) <= 2 THEN 'not_too_crowded'
            WHEN ROUND(AVG(occupancy_score * confidence / 100.0)) <= 3 THEN 'crowded'
            ELSE 'very_crowded'
          END as calculated_occupancy_level
        FROM recent_reports
        GROUP BY bus_id, registration_number
      ),
      bus_route_info AS (
        SELECT DISTINCT ON (blt.bus_id)
          blt.bus_id,
          r.route_number,
          r.route_name
        FROM bus_live_tracking blt
        JOIN routes r ON blt.route_id = r.route_id
        WHERE blt.bus_id = ANY($1)
          AND blt.is_live = TRUE
        ORDER BY blt.bus_id, blt.recorded_at DESC
      )
      SELECT 
        wa.bus_id,
        wa.registration_number,
        wa.report_count,
        wa.calculated_occupancy_level,
        wa.avg_confidence,
        wa.last_report_time,
        EXTRACT(EPOCH FROM (NOW() - wa.last_report_time)) / 60 as minutes_since_last_report,
        bri.route_number,
        bri.route_name
      FROM weighted_averages wa
      LEFT JOIN bus_route_info bri ON wa.bus_id = bri.bus_id
      ORDER BY wa.bus_id
    `, [busIdArray]);
    
    // Create response object with all requested buses, including those with no reports
    const occupancyData = {};
    
    // Initialize all requested buses with default values
    busIdArray.forEach(busId => {
      occupancyData[busId] = {
        bus_id: busId,
        registration_number: null,
        calculated_occupancy_level: 'unknown',
        report_count: 0,
        avg_confidence: 0,
        last_report_time: null,
        minutes_since_last_report: null,
        data_freshness: 'no_data',
        route_number: null,
        route_name: null
      };
    });
    
    // Update with actual data from database
    result.rows.forEach(row => {
      const freshnessLevel = row.minutes_since_last_report <= 5 ? 'very_fresh' :
                           row.minutes_since_last_report <= 15 ? 'fresh' :
                           row.minutes_since_last_report <= 30 ? 'moderate' : 'stale';
      
      occupancyData[row.bus_id] = {
        bus_id: row.bus_id,
        registration_number: row.registration_number,
        calculated_occupancy_level: row.calculated_occupancy_level,
        report_count: parseInt(row.report_count),
        avg_confidence: Math.round(row.avg_confidence),
        last_report_time: row.last_report_time,
        minutes_since_last_report: Math.round(row.minutes_since_last_report),
        data_freshness: freshnessLevel,
        route_number: row.route_number,
        route_name: row.route_name
      };
    });
    
    console.log(`✅ Calculated occupancy for ${Object.keys(occupancyData).length} buses`);
    
    res.status(200).json({
      success: true,
      data: occupancyData,
      metadata: {
        time_window_minutes: parseInt(timeWindowMinutes),
        buses_requested: busIdArray.length,
        buses_with_data: result.rows.length,
        calculation_time: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in getAverageOccupancyLevels:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createBusOccupancy,
  getAllBusOccupancies,
  getBusOccupancy,
  updateBusOccupancy,
  deleteBusOccupancy,
  getAverageOccupancyLevels,
};