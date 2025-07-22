const BusLiveTracking = require('../models/BusLiveTracking');

// Update bus position (called by driver app)
const updateBusPosition = async (req, res) => {
  try {
    const {
      bus_id,
      route_id,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
      passenger_count,
      occupancy_level,
      assignment_id,
      battery_level,
      signal_strength
    } = req.body;

    // Get driver_id from JWT token
    const driver_id = req.user.userId;

    // Validate required fields
    if (!bus_id || !route_id || !latitude || !longitude) {
      console.log('❌ Missing required fields:', { bus_id, route_id, latitude, longitude });
      return res.status(400).json({ 
        error: 'Bus ID, route ID, latitude, and longitude are required',
        received: { bus_id: !!bus_id, route_id: !!route_id, latitude: !!latitude, longitude: !!longitude }
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'Invalid latitude range' });
    }
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid longitude range' });
    }

    const positionData = {
      bus_id: parseInt(bus_id),
      route_id: parseInt(route_id),
      driver_id,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: speed ? parseFloat(speed) : null,
      heading: heading ? parseInt(heading) : null,
      accuracy: accuracy ? parseFloat(accuracy) : null,
      passenger_count: passenger_count ? parseInt(passenger_count) : 0,
      occupancy_level: occupancy_level || 'unknown',
      assignment_id: assignment_id ? parseInt(assignment_id) : null,
      battery_level: battery_level ? parseInt(battery_level) : null,
      signal_strength: signal_strength ? parseInt(signal_strength) : null
    };

    const result = await BusLiveTracking.updatePosition(positionData);
    
    res.status(200).json({
      success: true,
      tracking_id: result.update_bus_position,
      message: 'Position updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update bus position error:', error);
    res.status(500).json({ 
      error: 'Failed to update bus position',
      details: error.message 
    });
  }
};

// Get current position of a specific bus
const getBusCurrentPosition = async (req, res) => {
  try {
    const { bus_id } = req.params;
    
    if (!bus_id) {
      return res.status(400).json({ error: 'Bus ID is required' });
    }

    const position = await BusLiveTracking.getCurrentPosition(parseInt(bus_id));
    
    if (!position) {
      return res.status(404).json({ 
        error: 'No current position found for this bus' 
      });
    }

    res.json({
      success: true,
      data: position
    });
  } catch (error) {
    console.error('Get bus position error:', error);
    res.status(500).json({ 
      error: 'Failed to get bus position',
      details: error.message 
    });
  }
};

// Get all buses on a specific route (for passenger app)
const getBusesOnRoute = async (req, res) => {
  try {
    const { route_number } = req.params;
    
    if (!route_number) {
      return res.status(400).json({ error: 'Route number is required' });
    }

    const routeData = await BusLiveTracking.getBusesByRouteNumber(route_number);
    
    if (!routeData) {
      return res.status(404).json({ 
        error: 'No active buses found on this route' 
      });
    }

    res.json({
      success: true,
      data: routeData
    });
  } catch (error) {
    console.error('Get buses on route error:', error);
    res.status(500).json({ 
      error: 'Failed to get buses on route',
      details: error.message 
    });
  }
};

// Get all currently active buses
const getAllActiveBuses = async (req, res) => {
  try {
    const buses = await BusLiveTracking.getAllActiveBuses();
    
    res.json({
      success: true,
      count: buses.length,
      data: buses
    });
  } catch (error) {
    console.error('Get all active buses error:', error);
    res.status(500).json({ 
      error: 'Failed to get active buses',
      details: error.message 
    });
  }
};

// Get nearby buses
const getNearbyBuses = async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = radius ? parseFloat(radius) : 5;

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const buses = await BusLiveTracking.getNearbyBuses(lat, lng, radiusKm);
    
    res.json({
      success: true,
      search_params: {
        latitude: lat,
        longitude: lng,
        radius_km: radiusKm
      },
      count: buses.length,
      data: buses
    });
  } catch (error) {
    console.error('Get nearby buses error:', error);
    res.status(500).json({ 
      error: 'Failed to get nearby buses',
      details: error.message 
    });
  }
};

// Get tracking history for a bus
const getBusTrackingHistory = async (req, res) => {
  try {
    const { bus_id } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!bus_id) {
      return res.status(400).json({ error: 'Bus ID is required' });
    }

    // Default to today if dates not provided
    const startDate = start_date || new Date().toISOString().split('T')[0] + ' 00:00:00';
    const endDate = end_date || new Date().toISOString().split('T')[0] + ' 23:59:59';

    const history = await BusLiveTracking.getTrackingHistory(
      parseInt(bus_id),
      startDate,
      endDate
    );
    
    res.json({
      success: true,
      bus_id: parseInt(bus_id),
      period: { start_date: startDate, end_date: endDate },
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Get tracking history error:', error);
    res.status(500).json({ 
      error: 'Failed to get tracking history',
      details: error.message 
    });
  }
};

// Update tracking status
const updateTrackingStatus = async (req, res) => {
  try {
    const { bus_id } = req.params;
    const { status } = req.body;
    
    if (!bus_id || !status) {
      return res.status(400).json({ 
        error: 'Bus ID and status are required' 
      });
    }

    const validStatuses = ['active', 'inactive', 'offline', 'break'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const result = await BusLiveTracking.updateTrackingStatus(
      parseInt(bus_id), 
      status
    );
    
    if (!result) {
      return res.status(404).json({ 
        error: 'No active tracking found for this bus' 
      });
    }

    res.json({
      success: true,
      message: 'Tracking status updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Update tracking status error:', error);
    res.status(500).json({ 
      error: 'Failed to update tracking status',
      details: error.message 
    });
  }
};

// Get driver's current tracking status
const getDriverTrackingStatus = async (req, res) => {
  try {
    const driver_id = req.user.userId; // From JWT token
    
    const status = await BusLiveTracking.getDriverTrackingStatus(driver_id);
    
    if (!status) {
      return res.status(404).json({ 
        error: 'No active tracking found for this driver' 
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get driver tracking status error:', error);
    res.status(500).json({ 
      error: 'Failed to get driver tracking status',
      details: error.message 
    });
  }
};

// Get tracking statistics (admin only)
const getTrackingStats = async (req, res) => {
  try {
    const stats = await BusLiveTracking.getTrackingStats();
    
    res.json({
      success: true,
      data: stats,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get tracking stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get tracking statistics',
      details: error.message 
    });
  }
};

// Test data insertion function (development only)
const insertTestData = async (req, res) => {
  try {
    console.log('🧪 Inserting test live tracking data...');
    
    // Test tracking data for multiple buses
    const testBuses = [
      {
        bus_id: 17,
        route_id: 1,
        driver_id: 6,
        latitude: 6.9271,
        longitude: 79.8612,
        speed: 25.5,
        heading: 180,
        accuracy: 5.0,
        passenger_count: 15,
        occupancy_level: 'medium'
      },
      {
        bus_id: 23,
        route_id: 1,
        driver_id: 7,
        latitude: 6.9280,
        longitude: 79.8620,
        speed: 30.0,
        heading: 90,
        accuracy: 4.5,
        passenger_count: 8,
        occupancy_level: 'low'
      },
      {
        bus_id: 31,
        route_id: 1,
        driver_id: 8,
        latitude: 6.9300,
        longitude: 79.8650,
        speed: 22.0,
        heading: 45,
        accuracy: 6.0,
        passenger_count: 25,
        occupancy_level: 'high'
      }
    ];

    const insertedData = [];
    
    for (const busData of testBuses) {
      try {
        const result = await BusLiveTracking.updatePosition(busData);
        insertedData.push({
          ...busData,
          tracking_id: result.update_bus_position
        });
        console.log(`✅ Inserted data for Bus ${busData.bus_id}: tracking_id ${result.update_bus_position}`);
      } catch (error) {
        console.error(`❌ Failed to insert data for Bus ${busData.bus_id}:`, error);
      }
    }

    res.json({
      success: true,
      message: `${insertedData.length} test tracking records inserted`,
      data: insertedData
    });
  } catch (error) {
    console.error('Insert test data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to insert test data',
      details: error.message
    });
  }
};

module.exports = {
  updateBusPosition,
  getBusCurrentPosition,
  getBusesOnRoute,
  getAllActiveBuses,
  getNearbyBuses,
  getBusTrackingHistory,
  updateTrackingStatus,
  getDriverTrackingStatus,
  getTrackingStats,
  insertTestData
};
