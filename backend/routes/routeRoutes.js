const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Your database connection
const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Get route information with fare calculation
router.get('/search', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'From and to locations are required' });
    }

    // Get coordinates for both locations using Google Places API
    const fromCoords = await getCoordinatesFromPlaceName(from);
    const toCoords = await getCoordinatesFromPlaceName(to);
    
    if (!fromCoords || !toCoords) {
      return res.status(400).json({ error: 'Could not find coordinates for locations' });
    }

    // Get route details from Google Directions API
    const routeData = await getGoogleDirections(fromCoords, toCoords);
    
    if (!routeData) {
      return res.status(404).json({ error: 'No route found between locations' });
    }

    // Find available bus routes that serve these locations
    const availableBusRoutes = await findAvailableBusRoutes(from, to);
    
    // Calculate fare based on distance/stops
    const fare = await calculateFare(routeData.distance);
    
    const response = {
      routes: [{
        distance: routeData.distance,
        estimated_duration: routeData.duration,
        polyline: routeData.polyline,
        fare: fare,
        segment_distance: routeData.distance
      }],
      available_bus_routes: availableBusRoutes,
      from_coordinates: fromCoords,
      to_coordinates: toCoords
    };

    res.json(response);
  } catch (error) {
    console.error('Error in route search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to get coordinates from place name
async function getCoordinatesFromPlaceName(placeName) {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: {
        address: placeName,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
}

// Helper function to get Google Directions
async function getGoogleDirections(fromCoords, toCoords) {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
      params: {
        origin: `${fromCoords.lat},${fromCoords.lng}`,
        destination: `${toCoords.lat},${toCoords.lng}`,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      return {
        distance: parseFloat(leg.distance.text.replace(' km', '')),
        duration: leg.duration.text,
        polyline: route.overview_polyline.points
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting directions:', error);
    return null;
  }
}

// Helper function to find available bus routes
async function findAvailableBusRoutes(from, to) {
  try {
    const query = `
      SELECT 
        br.bus_route_id,
        br.bus_id,
        br.route_id,
        b.registration_number,
        b.bus_type,
        b.operator,
        r.route_number,
        r.route_name,
        r.start_location,
        r.end_location,
        r.distance
      FROM bus_routes br
      JOIN buses b ON br.bus_id = b.bus_id
      JOIN routes r ON br.route_id = r.route_id
            WHERE (
        LOWER(r.start_location) LIKE LOWER(?) OR 
        LOWER(r.end_location) LIKE LOWER(?) OR
        LOWER(r.route_name) LIKE LOWER(?) OR
        LOWER(r.start_location) LIKE LOWER(?) OR 
        LOWER(r.end_location) LIKE LOWER(?) OR
        LOWER(r.route_name) LIKE LOWER(?)
      )
      ORDER BY r.route_number
    `;
    
    const fromPattern = `%${from.split(',')[0].trim()}%`;
    const toPattern = `%${to.split(',')[0].trim()}%`;
    
    const [rows] = await db.execute(query, [
      fromPattern, fromPattern, fromPattern,
      toPattern, toPattern, toPattern
    ]);
    
    return rows;
  } catch (error) {
    console.error('Error finding bus routes:', error);
    return [];
  }
}

// Helper function to calculate fare based on distance
async function calculateFare(distanceKm) {
  try {
    // Calculate number of sections (every 3.2km is one section)
    const sections = Math.ceil(distanceKm / 3.2);
    
    const query = `SELECT fare FROM fares WHERE section = ? LIMIT 1`;
    const [rows] = await db.execute(query, [sections]);
    
    if (rows.length > 0) {
      return rows[0].fare;
    }
    
    // If exact section not found, find the closest higher section
    const fallbackQuery = `SELECT fare FROM fares WHERE section >= ? ORDER BY section ASC LIMIT 1`;
    const [fallbackRows] = await db.execute(fallbackQuery, [sections]);
    
    if (fallbackRows.length > 0) {
      return fallbackRows[0].fare;
    }
    
    // Default fare calculation if no data found
    return Math.ceil(sections * 15); // 15 rupees per section as fallback
  } catch (error) {
    console.error('Error calculating fare:', error);
    return null;
  }
}

// Get place details (for compatibility with existing frontend)
router.get('/place-details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
      params: {
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.result) {
      res.json(response.data.result);
    } else {
      res.status(404).json({ error: 'Place not found' });
    }
  } catch (error) {
    console.error('Error getting place details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
