const db = require('../config/db');
const axios = require('axios');

// Helper function to get lat/lng from place_id
const getLatLng = async (place_id, apiKey) => {
    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${apiKey}`
        );
        if (response.data.status === "OK") {
            return response.data.result.geometry.location;
        }
        return null;
    } catch (error) {
        console.error('Error getting coordinates:', error);
        return null;
    }
};

// Helper function to find bus stops along the route (matching Google Maps approach)
const getBusStopsAlongRoute = async (originCoords, destCoords, apiKey) => {
    try {
        // First try to get transit route (bus route) like Google Maps
        const transitResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&mode=transit&transit_mode=bus&key=${apiKey}`
        );

        let distance = 0;
        let duration = '';
        const busStops = [];

        // If transit data is available, extract basic route info
        if (transitResponse.data.routes && transitResponse.data.routes.length > 0) {
            const route = transitResponse.data.routes[0];
            const leg = route.legs[0];
            distance = leg.distance.value / 1000; // Convert to km
            duration = leg.duration.text;

            console.log(`🚌 Found transit route: ${distance}km, ${duration}`);

            // Add start and end points
            busStops.push({
                name: leg.start_address.split(',')[0],
                location: { lat: originCoords.lat, lng: originCoords.lng },
                types: ['departure_stop']
            });

            busStops.push({
                name: leg.end_address.split(',')[0],
                location: { lat: destCoords.lat, lng: destCoords.lng },
                types: ['arrival_stop']
            });
        }

        // Now use driving route to get detailed waypoints for finding stops
        console.log('🔍 Searching for detailed bus stops along the route...');
        const drivingResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&mode=driving&key=${apiKey}`
        );

        if (drivingResponse.data.routes && drivingResponse.data.routes.length > 0) {
            const route = drivingResponse.data.routes[0];
            if (!distance) {
                distance = route.legs[0].distance.value / 1000;
                duration = route.legs[0].duration.text;
            }
            
            // Get detailed polyline coordinates
            const routePolyline = route.overview_polyline.points;
            const routeCoords = decodePolyline(routePolyline);
            
            // For a route like Colombo to Kandy (100km), sample more densely to find stops
            // Sample every 1-2km to find bus stops, towns, and landmarks
            const sampleDistanceKm = distance > 50 ? 1.5 : 1.0; // Sample every 1.5km for long routes, 1km for shorter
            const totalPoints = routeCoords.length;
            const sampleInterval = Math.max(1, Math.floor(totalPoints / (distance / sampleDistanceKm)));
            
            console.log(`🗺️ Analyzing ${distance}km route with ${totalPoints} coordinate points`);
            console.log(`🔍 Sampling every ${sampleInterval} points (~${sampleDistanceKm}km) to find stops`);
            
            const foundStops = new Set(); // Use Set to avoid duplicates
            
            // Sample points along the route
            for (let i = 0; i < routeCoords.length; i += sampleInterval) {
                const coord = routeCoords[i];
                const progressKm = (i / routeCoords.length) * distance;
                
                try {
                    // Search for bus stations, transit stations, and localities
                    const placesResponse = await axios.get(
                        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coord.lat},${coord.lng}&radius=1500&type=bus_station|transit_station&key=${apiKey}`
                    );
                    
                    if (placesResponse.data.results && placesResponse.data.results.length > 0) {
                        for (const place of placesResponse.data.results.slice(0, 2)) { // Top 2 results per search
                            if (place.name && place.name.length > 2 && !foundStops.has(place.name)) {
                                foundStops.add(place.name);
                                busStops.push({
                                    name: place.name,
                                    location: place.geometry.location,
                                    types: place.types,
                                    vicinity: place.vicinity,
                                    distanceKm: Math.round(progressKm * 10) / 10
                                });
                            }
                        }
                    }
                    
                    // Also search for localities/towns if no bus stations found
                    if (placesResponse.data.results.length === 0) {
                        const localityResponse = await axios.get(
                            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.lat},${coord.lng}&key=${apiKey}&result_type=locality|sublocality|neighborhood`
                        );
                        
                        if (localityResponse.data.results && localityResponse.data.results.length > 0) {
                            const result = localityResponse.data.results[0];
                            const placeName = result.formatted_address.split(',')[0];
                            
                            if (placeName && placeName.length > 3 && !foundStops.has(placeName)) {
                                foundStops.add(placeName);
                                busStops.push({
                                    name: placeName,
                                    location: result.geometry.location,
                                    types: ['locality'],
                                    vicinity: result.formatted_address,
                                    distanceKm: Math.round(progressKm * 10) / 10
                                });
                            }
                        }
                    }
                    
                    // Small delay to respect API rate limits
                    await new Promise(resolve => setTimeout(resolve, 150));
                    
                } catch (error) {
                    console.log(`⚠️ Search error at ${progressKm}km`);
                }
            }
            
            // Remove duplicates and sort by distance
            const uniqueStops = busStops.filter((stop, index, self) => 
                index === self.findIndex(s => s.name === stop.name)
            ).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
            
            console.log(`🚏 Found ${uniqueStops.length} stops along ${distance}km route`);
            
            return {
                distance: distance,
                duration: duration,
                busStops: uniqueStops,
                numberOfStops: uniqueStops.length,
                method: 'detailed_stops_search'
            };
        }

        // Final fallback: Estimate based on distance
        console.log('📏 Using distance-based estimation...');
        const estimatedStops = Math.max(2, Math.ceil(distance / 1.5)); // Estimate 1 stop per 1.5km
        
        return {
            distance: distance || 50,
            duration: duration || '1 hour',
            busStops: busStops,
            numberOfStops: estimatedStops,
            method: 'distance_estimation'
        };

    } catch (error) {
        console.error('Error finding bus stops along route:', error);
        throw error;
    }
};

// Helper function to decode Google polyline
const decodePolyline = (encoded) => {
    const poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return poly;
};

const calculateFare = async (req, res) => {
    try {
        const { origin, destination } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({ message: 'Origin and destination are required' });
        }

        const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
        console.log('🔑 Debug - Google Maps API Key:', googleMapsApiKey ? 'CONFIGURED' : 'NOT CONFIGURED');
        if (!googleMapsApiKey) {
            return res.status(500).json({ message: 'Google Maps API key not configured' });
        }

        // Get coordinates for origin and destination
        const originCoords = await getLatLng(origin, googleMapsApiKey);
        const destCoords = await getLatLng(destination, googleMapsApiKey);

        if (!originCoords || !destCoords) {
            return res.status(400).json({ message: 'Invalid origin or destination' });
        }

        // Get bus stops along the route (like Google Maps)
        const routeInfo = await getBusStopsAlongRoute(originCoords, destCoords, googleMapsApiKey);
        
        // Calculate fare based on number of stops detected
        let numberOfSections = Math.max(1, Math.ceil(routeInfo.numberOfStops / 3)); // Group stops into fare sections
        
        console.log(`💰 Fare calculation: ${routeInfo.numberOfStops} stops detected using ${routeInfo.method}, ${numberOfSections} billable sections`);
        console.log(`🚏 Bus stops found: ${routeInfo.busStops.length > 0 ? routeInfo.busStops.slice(0, 5).map(stop => stop.name).join(', ') + (routeInfo.busStops.length > 5 ? '...' : '') : 'estimated based on distance'}`);
        
        // Query the database for the appropriate fare using PostgreSQL syntax
        const query = 'SELECT fare FROM bus_fares WHERE section <= $1 ORDER BY section DESC LIMIT 1';
        const fareResult = await db.query(query, [numberOfSections]);

        let calculatedFare;
        if (fareResult.rows && fareResult.rows.length > 0) {
            calculatedFare = parseFloat(fareResult.rows[0].fare);
        } else {
            // If no fare found in database, use a base calculation
            calculatedFare = 25; // Base fare in LKR
        }

        return res.json({
            fare: calculatedFare,
            numberOfStops: routeInfo.numberOfStops,
            numberOfSections: numberOfSections,
            distance: routeInfo.distance,
            duration: routeInfo.duration,
            stops: routeInfo.busStops.slice(0, 20).map((stop, index) => ({ // Show up to 20 stops like Google Maps
                name: stop.name,
                location: stop.location,
                types: stop.types || ['bus_stop'],
                vicinity: stop.vicinity || '',
                order: index + 1,
                distanceKm: stop.distanceKm || 0
            })),
            route: {
                origin: { coordinates: originCoords },
                destination: { coordinates: destCoords }
            },
            calculation: {
                method: routeInfo.method,
                routeDistance: routeInfo.distance,
                stopsDetected: routeInfo.busStops.length,
                fareMethod: 'stops_based_grouping'
            }
        });

    } catch (error) {
        console.error('Error calculating fare:', error);
        return res.status(500).json({ 
            message: 'Error calculating fare',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    calculateFare
};
