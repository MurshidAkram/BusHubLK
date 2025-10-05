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
        
        // Step 3: Search for bus stops based on route type
        const busStops = [];
        const foundNames = new Set();
        
        // Determine route type and search strategy
        const isShortRoute = distance < 15; // Under 15km = short route
        const isMediumRoute = distance >= 15 && distance < 50; // 15-50km = medium route
        const isLongRoute = distance >= 50; // 50km+ = long intercity route
        
        if (isShortRoute) {
            console.log('🚌 Short route detected - searching for local bus stops');
            
            // For short routes, search more densely and include regular bus stops
            const searchPoints = Math.max(3, Math.floor(distance / 2)); // 1 search per 2km
            
            for (let i = 0; i < searchPoints; i++) {
                const progress = i / (searchPoints - 1);
                const coordIndex = Math.floor(progress * (routePath.length - 1));
                const coord = routePath[coordIndex];
                const distanceFromStart = progress * distance;
                
                console.log(`🔍 Searching at ${distanceFromStart.toFixed(1)}km...`);
                
                try {
                    // Search for any bus stops with lower criteria for short routes
                    const busStopsResponse = await axios.get(
                        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coord.lat},${coord.lng}&radius=1000&type=bus_station&key=${apiKey}`
                    );
                    
                    // Also search for transit stations
                    const transitResponse = await axios.get(
                        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coord.lat},${coord.lng}&radius=1000&type=transit_station&key=${apiKey}`
                    );
                    
                    // Process results with relaxed criteria for short routes
                    const allPlaces = [
                        ...(busStopsResponse.data.results || []),
                        ...(transitResponse.data.results || [])
                    ];
                    
                    for (const place of allPlaces.slice(0, 3)) {
                        if (place.rating && place.rating >= 3.0 && 
                            place.name.length > 3 && 
                            !foundNames.has(place.name)) {
                            
                            foundNames.add(place.name);
                            busStops.push({
                                name: place.name,
                                location: place.geometry.location,
                                type: 'local_bus_stop',
                                vicinity: place.vicinity || '',
                                rating: place.rating,
                                distanceFromStart: distanceFromStart,
                                place_id: place.place_id
                            });
                        }
                    }
                    
                    // Rate limiting
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                } catch (searchError) {
                    console.log(`⚠️ Search error at ${distanceFromStart.toFixed(1)}km: ${searchError.message}`);
                }
            }
            
        } else if (isMediumRoute || isLongRoute) {
            console.log(`🚌 ${isLongRoute ? 'Long intercity' : 'Medium'} route detected - searching for major terminals`);
            
            // Filter out common city stop names for longer routes
            const cityStopFilters = [
                'borella', 'kollupitiya', 'bambalapitiya', 'wellawatte', 'dehiwala',
                'mount lavinia', 'moratuwa', 'panadura', 'kalutara', 'beruwala',
                'liberty', 'fort', 'pettah local', 'maradana', 'dematagoda'
            ];
            
            // Calculate search points
            const searchPoints = Math.min(12, Math.max(4, Math.floor(distance / 10))); // 1 search per 10km
            
            for (let i = 1; i < searchPoints - 1; i++) { // Skip first and last points to avoid origin/destination local stops
                const progress = i / (searchPoints - 1);
                const coordIndex = Math.floor(progress * (routePath.length - 1));
                const coord = routePath[coordIndex];
                const distanceFromStart = progress * distance;
                
                console.log(`🔍 Searching at ${distanceFromStart.toFixed(1)}km...`);
                
                try {
                    // Search only for major bus terminals with stricter criteria
                    const placesResponse = await axios.get(
                        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coord.lat},${coord.lng}&radius=3000&type=bus_station&key=${apiKey}`
                    );
                    
                    // Process only high-quality, major terminals
                    for (const place of (placesResponse.data.results || [])) {
                        // Strict quality filters for intercity terminals
                        if (place.rating && place.rating >= 4.0 && 
                            place.user_ratings_total >= 50 && 
                            place.name.length > 5) {
                            
                            const lowerName = place.name.toLowerCase();
                            
                            // Filter out city-specific stops
                            const isCityStop = cityStopFilters.some(filter => lowerName.includes(filter));
                            
                            // Only include if it's a major terminal or includes 'stand', 'terminal', 'depot'
                            const isMajorTerminal = lowerName.includes('stand') || 
                                                  lowerName.includes('terminal') || 
                                                  lowerName.includes('depot') ||
                                                  lowerName.includes('interchange');
                            
                            if (!isCityStop && isMajorTerminal && !foundNames.has(place.name)) {
                                foundNames.add(place.name);
                                busStops.push({
                                    name: place.name,
                                    location: place.geometry.location,
                                    type: 'major_terminal',
                                    vicinity: place.vicinity || '',
                                    rating: place.rating,
                                    distanceFromStart: distanceFromStart,
                                    place_id: place.place_id
                                });
                            }
                        }
                    }
                    
                    // If no major terminals found, look for significant towns only
                    if (placesResponse.data.results.length === 0) {
                        const geocodeResponse = await axios.get(
                            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.lat},${coord.lng}&result_type=locality&key=${apiKey}`
                        );
                        
                        if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
                            const location = geocodeResponse.data.results[0];
                            const components = location.address_components;
                            
                            const townComponent = components.find(comp => comp.types.includes('locality'));
                            
                            if (townComponent && townComponent.long_name.length > 3 && 
                                !foundNames.has(townComponent.long_name) &&
                                !cityStopFilters.some(filter => townComponent.long_name.toLowerCase().includes(filter))) {
                                
                                foundNames.add(townComponent.long_name);
                                busStops.push({
                                    name: `${townComponent.long_name}`,
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
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (searchError) {
                    console.log(`⚠️ Search error at ${distanceFromStart.toFixed(1)}km: ${searchError.message}`);
                }
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
        console.log(`🚏 Major intercity stops detected: ${routeInfo.numberOfStops}`);
        
        // Improved fare calculation for Sri Lankan routes
        const distance = parseFloat(routeInfo.distance);
        const stops = routeInfo.numberOfStops;
        let fareSection;
        
        if (distance < 10) {
            // Short local routes (under 10km) - aim for 50-70 LKR range
            // For 7.5km route targeting 60 LKR, need section 4-5
            fareSection = Math.max(3, Math.ceil(distance * 0.3) + Math.ceil(stops * 0.4));
        } else if (distance < 30) {
            // Medium routes (10-30km)
            fareSection = Math.max(5, Math.ceil(stops * 1.2) + Math.ceil(distance * 0.2));
        } else if (distance < 60) {
            // Long routes (30-60km)
            fareSection = Math.max(8, Math.ceil(stops * 1.5) + Math.ceil(distance * 0.15));
        } else if (distance < 100) {
            // Very long routes (60-100km)
            fareSection = Math.max(20, Math.ceil(stops * 2.0) + Math.ceil(distance * 0.1));
        } else {
            // Intercity routes like Colombo-Kandy (100km+)
            // For 116km route, aim for section 55-65 to get ~400 LKR
            fareSection = Math.max(30, Math.ceil(distance * 0.5 + stops * 1.5));
        }
        
        console.log(`📊 Using section ${fareSection} for ${distance}km route (${stops} stops detected)`);
        
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
