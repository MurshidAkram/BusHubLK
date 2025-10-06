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

// Function to find major bus stops along Sri Lankan routes
const findMainBusStops = async (originCoords, destCoords, apiKey) => {
    try {
        console.log('🚌 Finding main bus stops for Sri Lankan route...');
        
        // Step 1: Get the driving route
        const directionsResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&mode=driving&key=${apiKey}`
        );

        if (!directionsResponse.data.routes || directionsResponse.data.routes.length === 0) {
            throw new Error('No route found');
        }

        const route = directionsResponse.data.routes[0];
        const leg = route.legs[0];
        const distance = leg.distance.value / 1000; // km
        const duration = leg.duration.text;
        
        console.log(`📍 Route: ${distance.toFixed(1)}km, ${duration}`);

        // Step 2: Decode the route path
        const routePath = decodePolyline(route.overview_polyline.points);
        
        // Step 3: Search for major bus terminals and towns along the route
        const busStops = [];
        const foundNames = new Set();
        
        // Calculate search points - more points for longer routes
        const searchPoints = Math.min(20, Math.max(6, Math.floor(distance / 5))); // 1 search per 5km
        
        for (let i = 0; i < searchPoints; i++) {
            const progress = i / (searchPoints - 1);
            const coordIndex = Math.floor(progress * (routePath.length - 1));
            const coord = routePath[coordIndex];
            const distanceFromStart = progress * distance;
            
            console.log(`🔍 Searching at ${distanceFromStart.toFixed(1)}km...`);
            
            try {
                // Search for bus stations and major transport hubs
                const placesResponse = await axios.get(
                    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coord.lat},${coord.lng}&radius=8000&type=bus_station&key=${apiKey}`
                );
                
                // Also search with keywords for Sri Lankan bus infrastructure
                const keywordResponse = await axios.get(
                    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coord.lat},${coord.lng}&radius=5000&keyword=bus+stand+terminal&key=${apiKey}`
                );
                
                // Combine results
                const allPlaces = [
                    ...(placesResponse.data.results || []),
                    ...(keywordResponse.data.results || [])
                ];
                
                // Process high-quality stops
                for (const place of allPlaces) {
                    if (place.rating && place.rating >= 3.5 && place.user_ratings_total >= 10) {
                        const cleanName = place.name.replace(/Bus Stop|Bus Stand|Bus Station/gi, '').trim();
                        
                        if (cleanName.length > 2 && !foundNames.has(cleanName)) {
                            foundNames.add(cleanName);
                            busStops.push({
                                name: place.name,
                                cleanName: cleanName,
                                location: place.geometry.location,
                                type: 'bus_terminal',
                                vicinity: place.vicinity || '',
                                rating: place.rating,
                                distanceFromStart: distanceFromStart,
                                place_id: place.place_id
                            });
                        }
                    }
                }
                
                // If no bus stations found, look for major towns/junctions
                if (allPlaces.length === 0) {
                    const geocodeResponse = await axios.get(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.lat},${coord.lng}&result_type=locality|administrative_area_level_2&key=${apiKey}`
                    );
                    
                    if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
                        const location = geocodeResponse.data.results[0];
                        const components = location.address_components;
                        
                        const townComponent = components.find(comp => 
                            comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
                        );
                        
                        if (townComponent && !foundNames.has(townComponent.long_name) && townComponent.long_name.length > 2) {
                            foundNames.add(townComponent.long_name);
                            busStops.push({
                                name: `${townComponent.long_name} Town`,
                                cleanName: townComponent.long_name,
                                location: location.geometry.location,
                                type: 'major_town',
                                vicinity: location.formatted_address,
                                distanceFromStart: distanceFromStart,
                                isTown: true
                            });
                        }
                    }
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));
                
            } catch (searchError) {
                console.log(`⚠️ Search error at ${distanceFromStart.toFixed(1)}km: ${searchError.message}`);
            }
        }
        
        // Sort stops by distance from start
        const sortedStops = busStops.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
        
        console.log(`✅ Found ${sortedStops.length} main stops:`);
        sortedStops.forEach((stop, i) => {
            console.log(`   ${i + 1}. ${stop.name} (${stop.distanceFromStart.toFixed(1)}km)`);
        });
        
        return {
            distance: distance.toFixed(1),
            duration: duration,
            numberOfStops: sortedStops.length,
            busStops: sortedStops,
            method: sortedStops.length > 6 ? 'comprehensive_search' : 'basic_search'
        };
        
    } catch (error) {
        console.error('❌ Error finding bus stops:', error);
        throw error;
    }
};

// Decode Google polyline
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

        poly.push({ lat: lat / 1E5, lng: lng / 1E5 });
    }
    return poly;
};

// Main fare calculation function
const calculateFare = async (req, res) => {
    req.startTime = Date.now();
    
    try {
        const { origin, destination } = req.body;
        
        if (!origin || !destination) {
            return res.status(400).json({ 
                success: false, 
                message: 'Origin and destination are required' 
            });
        }

        console.log(`\n🚌 === FARE CALCULATION REQUEST ===`);
        console.log(`📍 From: ${origin}`);
        console.log(`📍 To: ${destination}`);

        const googleMapsApiKey = "AIzaSyDdK_SJ8L56-s33UpzL6Gn5UYDav9ZMGdg";
        
        // Get coordinates for origin and destination
        const originCoords = await getLatLng(origin, googleMapsApiKey);
        const destCoords = await getLatLng(destination, googleMapsApiKey);
        
        if (!originCoords || !destCoords) {
            return res.status(400).json({ 
                success: false, 
                message: 'Could not find coordinates for origin or destination' 
            });
        }

        // Find main bus stops along the route
        const routeInfo = await findMainBusStops(originCoords, destCoords, googleMapsApiKey);
        
        console.log(`\n💰 FARE CALCULATION:`);
        console.log(`📏 Distance: ${routeInfo.distance}km`);
        console.log(`🚏 Main stops detected: ${routeInfo.numberOfStops}`);
        
        // Calculate fare based on number of stops
        // Sri Lankan bus fare logic: Use the number of stops as sections directly
        let fareSection = routeInfo.numberOfStops;
        
        // For very short routes, ensure minimum fare
        if (parseFloat(routeInfo.distance) < 3) {
            fareSection = Math.max(1, fareSection);
        }
        // For medium routes, use stops directly
        else if (parseFloat(routeInfo.distance) < 15) {
            fareSection = Math.max(2, fareSection);
        }
        // For long routes, use stops with slight adjustment
        else {
            fareSection = Math.max(3, Math.ceil(fareSection * 1.1)); // 10% increase for long routes
        }
        
        console.log(`📊 Using section ${fareSection} for fare calculation`);
        
        // Query database for fare
        const fareQuery = 'SELECT fare FROM bus_fares WHERE section = $1';
        const fareResult = await db.query(fareQuery, [fareSection]);
        
        let finalFare = 0;
        
        if (fareResult.rows.length > 0) {
            finalFare = parseFloat(fareResult.rows[0].fare);
            console.log(`💵 Found exact fare: LKR ${finalFare} (section ${fareSection})`);
        } else {
            // Find closest section
            const closestQuery = 'SELECT section, fare FROM bus_fares WHERE section <= $1 ORDER BY section DESC LIMIT 1';
            const closestResult = await db.query(closestQuery, [fareSection]);
            
            if (closestResult.rows.length > 0) {
                const baseFare = parseFloat(closestResult.rows[0].fare);
                const baseSection = closestResult.rows[0].section;
                
                // Extrapolate based on section difference
                const extraSections = fareSection - baseSection;
                const farePerSection = baseFare / baseSection;
                finalFare = baseFare + (extraSections * farePerSection);
                
                console.log(`💵 Extrapolated fare: LKR ${finalFare.toFixed(2)} (from section ${baseSection})`);
            } else {
                // Fallback estimation
                finalFare = fareSection * 12; // Average LKR 12 per section
                console.log(`💵 Estimated fare: LKR ${finalFare} (${fareSection} × LKR 12)`);
            }
        }
        
        // Round to nearest 5 rupees
        finalFare = Math.round(finalFare / 5) * 5;
        
        console.log(`✅ FINAL FARE: LKR ${finalFare}`);
        console.log(`🕒 Calculation time: ${((Date.now() - req.startTime) / 1000).toFixed(1)}s\n`);
        
        // Format stops for response
        const formattedStops = routeInfo.busStops.map((stop, index) => ({
            order: index + 1,
            name: stop.name,
            type: stop.type,
            vicinity: stop.vicinity || null,
            distanceKm: parseFloat(stop.distanceFromStart.toFixed(1)),
            place_id: stop.place_id || null
        }));

        res.json({
            success: true,
            fare: finalFare,
            currency: 'LKR',
            route: {
                origin: origin,
                destination: destination,
                distance: `${routeInfo.distance} km`,
                duration: routeInfo.duration
            },
            calculation: {
                stopsDetected: routeInfo.numberOfStops,
                baseFare: finalFare,
                finalFare: finalFare,
                method: routeInfo.method
            },
            busStops: formattedStops,
            meta: {
                timestamp: new Date().toISOString(),
                processingTime: `${((Date.now() - req.startTime) / 1000).toFixed(1)}s`
            }
        });

    } catch (error) {
        console.error('❌ Error calculating fare:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error calculating fare',
            error: error.message 
        });
    }
};

module.exports = {
    calculateFare
};
