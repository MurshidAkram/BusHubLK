const BusTracking = require('../models/BusTracking');

const createBusTracking = async (req, res) => {
  try {
    const {
      busId,
      registrationNumber,
      depotId,
      status,
      purchaseDate,
      isActive,
      routeNumber,
      latitude,
      longitude,
      occupancyLevel,
      confidence
    } = req.body;

    if (!busId || !registrationNumber || !latitude || !longitude) {
      return res.status(400).json({ message: 'Bus ID, registration number, latitude, and longitude are required.' });
    }

    const newTracking = await BusTracking.create({
      busId,
      registrationNumber,
      depotId,
      status: status || 'Active',
      purchaseDate,
      isActive: isActive !== undefined ? isActive : true,
      routeNumber,
      latitude,
      longitude,
      occupancyLevel: occupancyLevel || 'Unknown',
      confidence: confidence || 0.0
    });

    // Map occupancy_level to passenger_count and capacity
    const occupancyMap = {
      'Low': { passengerCount: 20, capacity: 60 },
      'Medium': { passengerCount: 40, capacity: 60 },
      'High': { passengerCount: 55, capacity: 60 },
      'Unknown': { passengerCount: 0, capacity: 60 }
    };
    const { passengerCount, capacity } = occupancyMap[newTracking.occupancy_level] || occupancyMap['Unknown'];

    res.status(201).json({
      ...newTracking,
      passenger_count: passengerCount,
      capacity
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getAllBusTrackings = async (req, res) => {
  try {
    const trackings = await BusTracking.getAllTrackings();
    if (!trackings.length) {
      return res.status(200).json([]);
    }

    // Map occupancy_level to passenger_count and capacity
    const occupancyMap = {
      'Low': { passengerCount: 20, capacity: 60 },
      'Medium': { passengerCount: 40, capacity: 60 },
      'High': { passengerCount: 55, capacity: 60 },
      'Unknown': { passengerCount: 0, capacity: 60 }
    };

    const formattedTrackings = trackings.map(tracking => {
      const { passengerCount, capacity } = occupancyMap[tracking.occupancy_level] || occupancyMap['Unknown'];
      return {
        ...tracking,
        passenger_count: passengerCount,
        capacity
      };
    });

    res.status(200).json(formattedTrackings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getBusTracking = async (req, res) => {
  try {
    const { busId } = req.params;
    const trackings = await BusTracking.findByBusId(busId);
    
    if (!trackings.length) {
      return res.status(404).json({ message: 'No bus records found for this bus ID.' });
    }

    // Map occupancy_level to passenger_count and capacity
    const occupancyMap = {
      'Low': { passengerCount: 20, capacity: 60 },
      'Medium': { passengerCount: 40, capacity: 60 },
      'High': { passengerCount: 55, capacity: 60 },
      'Unknown': { passengerCount: 0, capacity: 60 }
    };

    const formattedTrackings = trackings.map(tracking => {
      const { passengerCount, capacity } = occupancyMap[tracking.occupancy_level] || occupancyMap['Unknown'];
      return {
        ...tracking,
        passenger_count: passengerCount,
        capacity
      };
    });

    res.status(200).json(formattedTrackings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const updateBusTracking = async (req, res) => {
  try {
    const { busId } = req.params;
    const updates = req.body;

    if (!updates.latitude || !updates.longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required for update.' });
    }

    const updatedTracking = await BusTracking.findOneAndUpdate(busId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    if (!updatedTracking) {
      return res.status(404).json({ message: 'Bus record not found.' });
    }

    // Map occupancy_level to passenger_count and capacity
    const occupancyMap = {
      'Low': { passengerCount: 20, capacity: 60 },
      'Medium': { passengerCount: 40, capacity: 60 },
      'High': { passengerCount: 55, capacity: 60 },
      'Unknown': { passengerCount: 0, capacity: 60 }
    };
    const { passengerCount, capacity } = occupancyMap[updatedTracking.occupancy_level] || occupancyMap['Unknown'];

    res.status(200).json({
      ...updatedTracking,
      passenger_count: passengerCount,
      capacity
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const deleteBusTracking = async (req, res) => {
  try {
    const { busId } = req.params;

    const deletedTracking = await BusTracking.findOneAndDelete(busId);

    if (!deletedTracking) {
      return res.status(404).json({ message: 'Bus record not found.' });
    }

    res.status(200).json({ success: true, message: 'Bus record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getAllRoutes = async (req, res) => {
  try {
    const routes = await BusTracking.getAllRoutes();
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createBusTracking,
  getAllBusTrackings,
  getBusTracking,
  updateBusTracking,
  deleteBusTracking,
  getAllRoutes,
};