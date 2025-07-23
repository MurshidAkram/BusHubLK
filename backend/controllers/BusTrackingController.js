const BusTracking = require('../models/BusTracking');
const BusLiveTracking = require('../models/BusLiveTracking');

const getAllBusTrackings = async (req, res) => {
  try {
    const { latitude, longitude, radius_km = 5 } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }
    const trackings = await BusTracking.getAllTrackings(parseFloat(latitude), parseFloat(longitude), parseFloat(radius_km));
    if (!trackings.length) {
      return res.status(200).json([]);
    }
    res.status(200).json(trackings);
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
    res.status(200).json(trackings);
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

// Add this new controller function
const getBusesByRouteNumber = async (req, res) => {
  try {
    const { routeNumber } = req.params;
    const buses = await BusTracking.getBusesByRouteNumber(routeNumber);
    res.status(200).json(buses);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getAllBusTrackings,
  getBusTracking,
  getAllRoutes,
  getBusesByRouteNumber,
};
