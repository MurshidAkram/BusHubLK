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

// Helper function to find bus stops along the route (exactly like Google Maps)
const getBusStopsAlongRoute = async (originCoords, destCoords, apiKey) => {
    try {
        console.log('🚌 Starting Google Maps-style bus stops detection...');
        
        let distance = 0;
        let duration = '';
        let transitStops = [];
        let routeMethod = 'no_transit_data';

        // Step 1: Try Google's transit route first (this is what Google Maps does)
        console.log('📍 Step 1: Checking Google Transit routes...');
        try {
            const transitResponse = await axios.get(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&mode=transit&transit_mode=bus&departure_time=now&key=${apiKey}`
            );

            if (transitResponse.data.routes && transitResponse.data.routes.length > 0) {
                const route = transitResponse.data.routes[0];
                const leg = route.legs[0];
                distance = leg.distance.value / 1000;
                duration = leg.duration.text;
                
                console.log(`✅ Found Google Transit route: ${distance}km, ${duration}`);
                
                // Extract actual bus stops from transit steps (this is the key!)
                let stopCount = 0;
                for (const step of leg.steps) {
                    if (step.travel_mode === 'TRANSIT' && step.transit_details) {
                        const transit = step.transit_details;
                        
                        // Add departure stop
                        if (transit.departure_stop) {
                            transitStops.push({
                                name: transit.departure_stop.name,
                                location: transit.departure_stop.location,
                                type: 'transit_stop',
                                transit_line: transit.line ? transit.line.name : 'Bus',
                                vehicle_type: transit.line && transit.line.vehicle ? transit.line.vehicle.name : 'Bus'
                            });
                            stopCount++;
                        }
                        
                        // Add arrival stop
                        if (transit.arrival_stop) {
                            transitStops.push({
                                name: transit.arrival_stop.name,
                                location: transit.arrival_stop.location,
                                type: 'transit_stop', 
                                transit_line: transit.line ? transit.line.name : 'Bus',
                                vehicle_type: transit.line && transit.line.vehicle ? transit.line.vehicle.name : 'Bus'
                            });
                            stopCount++;
                        }
                    }
                }
                
                if (stopCount > 2) {
                    console.log(`🎯 Found ${stopCount} actual transit stops from Google Maps!`);
                    routeMethod = 'google_transit_stops';
                } else {
                    console.log('⚠️ Google Transit found but insufficient stop details');
                }
            } else {
                console.log('📍 No Google Transit routes available for this route');
            }
        } catch (transitError) {
            console.log('⚠️ Google Transit API call failed:', transitError.message);
        }

        // Step 2: If Google Transit didn't give us enough stops, find stops along driving route
        if (transitStops.length < 3) {
            console.log('� Step 2: Searching for bus stops along driving route...');
            
            const drivingResponse = await axios.get(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&mode=driving&key=${apiKey}`
            );

            if (drivingResponse.data.routes && drivingResponse.data.routes.length > 0) {
                const route = drivingResponse.data.routes[0];
                const leg = route.legs[0];
                
                if (!distance) {
                    distance = leg.distance.value / 1000;
                    duration = leg.duration.text;
                }
                
                console.log(`🗺️ Driving route: ${distance}km, analyzing for bus infrastructure...`);
                
                // Decode polyline to get route coordinates
                const routeCoords = decodePolyline(route.overview_polyline.points);
                
                // For long routes (like Colombo-Kandy), we need to search more frequently
                const searchInterval = distance > 50 ? Math.max(1, Math.floor(routeCoords.length / (distance * 0.8))) : 
                                     distance > 20 ? Math.max(1, Math.floor(routeCoords.length / (distance * 1.2))) :
                                     Math.max(1, Math.floor(routeCoords.length / (distance * 2)));
                
                console.log(`🔍 Searching every ${searchInterval} points along ${routeCoords.length} route coordinates`);
                
                const foundStops = new Set();
                const stopDetails = [];
                
                // Search along the route for bus stops and major stations
                for (let i = 0; i < routeCoords.length; i += searchInterval) {
                    const coord = routeCoords[i];
                    const progressKm = (i / routeCoords.length) * distance;
                    
                    try {
                        // Search for bus stations and transit stations
                        const busStopsResponse = await axios.get(
                            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coord.lat},${coord.lng}&radius=2000&type=bus_station&key=${apiKey}`
                        );
                        
                        // Also search for transit stations
                        const transitResponse = await axios.get(
                            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coord.lat},${coord.lng}&radius=2000&type=transit_station&key=${apiKey}`
                        );
                        
                        // Combine results
                        const allResults = [
                            ...(busStopsResponse.data.results || []),
                            ...(transitResponse.data.results || [])
                        ];
                        
                        // Process found stops
                        for (const place of allResults.slice(0, 3)) { // Top 3 per search
                            if (place.name && !foundStops.has(place.name) && place.name.length > 2) {
                                foundStops.add(place.name);
                                stopDetails.push({
                                    name: place.name,
                                    location: place.geometry.location,
                                    type: place.types.includes('bus_station') ? 'bus_station' : 'transit_station',
                                    vicinity: place.vicinity,
                                    distanceKm: Math.round(progressKm * 10) / 10,
                                    rating: place.rating,
                                    place_id: place.place_id
                                });
                            }
                        }
                        
                        // If no bus stops found at this point, look for significant localities
                        if (allResults.length === 0 && i % (searchInterval * 2) === 0) {
                            const geocodeResponse = await axios.get(
                                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.lat},${coord.lng}&key=${apiKey}&result_type=locality|sublocality_level_1|administrative_area_level_2`
                            );
                            
                            if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
                                const location = geocodeResponse.data.results[0];
                                const locationName = location.formatted_address.split(',')[0];
                                
                                if (locationName && !foundStops.has(locationName) && locationName.length > 3) {
                                    foundStops.add(locationName);
                                    stopDetails.push({
                                        name: locationName,
                                        location: location.geometry.location,
                                        type: 'locality',
                                        vicinity: location.formatted_address,
                                        distanceKm: Math.round(progressKm * 10) / 10
                                    });
                                }
                            }
                        }
                        
                        // Rate limiting
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (searchError) {
                        console.log(`⚠️ Search error at ${progressKm.toFixed(1)}km: ${searchError.message}`);
                    }
                }
                
                // Combine transit stops with found stops and remove duplicates
                const allStops = [...transitStops, ...stopDetails];
                const uniqueStops = allStops.filter((stop, index, self) => 
                    index === self.findIndex(s => s.name === stop.name)
                ).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
                
                transitStops = uniqueStops;
                routeMethod = transitStops.length > stopDetails.length ? 'combined_transit_and_search' : 'places_search';
                
                console.log(`🚏 Found ${transitStops.length} total stops using ${routeMethod}`);
            }
        }

        // Step 3: If still not enough stops, estimate based on distance
        if (transitStops.length < 3) {
            console.log('� Step 3: Creating distance-based stop estimates...');
            
            const estimatedStopCount = Math.max(3, Math.ceil(distance / 2)); // Every 2km
            for (let i = 1; i < estimatedStopCount - 1; i++) {
                transitStops.push({
                    name: `Stop ${i} (${Math.round(distance * i / estimatedStopCount)}km)`,
                    type: 'estimated_stop',
                    distanceKm: Math.round((distance * i / estimatedStopCount) * 10) / 10
                });
            }
            routeMethod = 'distance_estimation';
        }

        return {
            distance: distance || 50,
            duration: duration || '1 hour',
            busStops: transitStops,
            numberOfStops: transitStops.length,
            method: routeMethod,
            detectionQuality: transitStops.length > 20 ? 'high' : transitStops.length > 10 ? 'medium' : 'basic'
        };

    } catch (error) {
        console.error('Error in getBusStopsAlongRoute:', error);
        throw error;
    }
};

// Helper function to decode Google polyline (unchanged)
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
        req.startTime = Date.now(); // Add processing time tracking

        if (!origin || !destination) {
            return res.status(400).json({ message: 'Origin and destination are required' });
        }

        const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
        console.log('🔑 Debug - Google Maps API Key:', googleMapsApiKey ? 'CONFIGURED' : 'NOT CONFIGURED');
        if (!googleMapsApiKey) {
            return res.status(500).json({ message: 'Google Maps API key not configured' });
        }

        console.log(`\n🚌 Starting fare calculation: ${origin} → ${destination}`);

        // Get coordinates for origin and destination
        const originCoords = await getLatLng(origin, googleMapsApiKey);
        const destCoords = await getLatLng(destination, googleMapsApiKey);

        if (!originCoords || !destCoords) {
            return res.status(400).json({ message: 'Invalid origin or destination' });
        }

        console.log(`📍 Coordinates: ${originCoords.lat},${originCoords.lng} → ${destCoords.lat},${destCoords.lng}`);

        // Get bus stops along the route (Google Maps style)
        const routeInfo = await getBusStopsAlongRoute(originCoords, destCoords, googleMapsApiKey);
        
        console.log(`📊 Route Analysis:`);
        console.log(`   Distance: ${routeInfo.distance}km`);
        console.log(`   Duration: ${routeInfo.duration}`);
        console.log(`   Stops found: ${routeInfo.numberOfStops}`);
        console.log(`   Detection method: ${routeInfo.method}`);
        console.log(`   Quality: ${routeInfo.detectionQuality || 'unknown'}`);

        // Smart fare calculation based on route characteristics
        let numberOfSections;
        let calculationExplanation = '';
        
        if (routeInfo.distance < 5) {
            // Short city routes (under 5km) - minimal sections
            numberOfSections = Math.max(1, Math.ceil(routeInfo.numberOfStops / 6));
            calculationExplanation = 'Short city route - minimal fare sections';
        } else if (routeInfo.distance < 15) {
            // Medium city routes (5-15km) - moderate sections  
            // For 7.58km with 14 stops targeting 60 LKR, we need about 4-5 sections
            numberOfSections = Math.max(3, Math.ceil(routeInfo.numberOfStops / 3.5));
            calculationExplanation = 'Medium distance route - moderate fare sections';
        } else if (routeInfo.distance < 30) {
            // Longer city routes (15-30km) - more sections
            numberOfSections = Math.max(4, Math.ceil(routeInfo.numberOfStops / 3));
            calculationExplanation = 'Long distance city route';
        } else if (routeInfo.distance < 60) {
            // Intercity routes (30-60km) - substantial sections
            numberOfSections = Math.max(8, Math.ceil(routeInfo.numberOfStops / 2.5));
            calculationExplanation = 'Intercity route - substantial fare sections';
        } else {
            // Long intercity routes (60km+) like Colombo-Kandy
            // Use almost direct mapping for realistic fares
            if (routeInfo.method === 'google_transit_stops' || routeInfo.detectionQuality === 'high') {
                // High quality detection - use 85% of stops as sections
                numberOfSections = Math.max(15, Math.ceil(routeInfo.numberOfStops * 0.85));
                calculationExplanation = 'Long intercity route with high-quality stop detection';
            } else if (routeInfo.detectionQuality === 'medium') {
                // Medium quality - use 75% of stops
                numberOfSections = Math.max(12, Math.ceil(routeInfo.numberOfStops * 0.75));
                calculationExplanation = 'Long intercity route with medium-quality stop detection';
            } else {
                // Basic detection - use 65% of stops but ensure minimum
                numberOfSections = Math.max(10, Math.ceil(routeInfo.numberOfStops * 0.65));
                calculationExplanation = 'Long intercity route with basic stop detection';
            }
        }

        // Cap the sections to database limits
        numberOfSections = Math.min(numberOfSections, 350);

        console.log(`💰 Fare calculation: ${routeInfo.numberOfStops} stops detected using ${routeInfo.method}`);
        console.log(`📏 Route distance: ${routeInfo.distance}km, calculated ${numberOfSections} sections`);
        console.log(`🚏 Bus stops in order:`);
        
        // Display stops in order from start to destination
        const sortedStops = [...routeInfo.busStops].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        sortedStops.slice(0, 5).forEach((stop, index) => {
            console.log(`   ${index + 1}. ${stop.name}${stop.vicinity ? ` (${stop.vicinity})` : ''}`);
        });
        if (sortedStops.length > 5) {
            console.log(`   ... and ${sortedStops.length - 5} more stops`);
        }

        // Get fare from database
        const fareQuery = 'SELECT fare FROM bus_fares WHERE section = $1';
        const fareResult = await db.query(fareQuery, [numberOfSections]);
        
        let baseFare = 0;
        let actualSection = numberOfSections;
        
        if (fareResult.rows.length > 0) {
            baseFare = parseFloat(fareResult.rows[0].fare);
            console.log(`💵 Base fare from DB: LKR ${baseFare} (section ${numberOfSections})`);
        } else {
            // If exact section not found, find closest or estimate
            const closestQuery = 'SELECT section, fare FROM bus_fares WHERE section <= $1 ORDER BY section DESC LIMIT 1';
            const closestResult = await db.query(closestQuery, [numberOfSections]);
            
            if (closestResult.rows.length > 0) {
                const closestSection = closestResult.rows[0].section;
                const closestFare = parseFloat(closestResult.rows[0].fare);
                actualSection = closestSection;
                
                // Extrapolate fare based on section difference
                const sectionDiff = numberOfSections - closestSection;
                const farePerSection = closestFare / closestSection;
                baseFare = closestFare + (sectionDiff * farePerSection);
                
                console.log(`💵 Extrapolated fare: LKR ${baseFare} (from section ${closestSection}, LKR ${closestFare})`);
            } else {
                // Fallback estimation
                baseFare = numberOfSections * 8.50; // Average LKR per section
                console.log(`💵 Estimated fare: LKR ${baseFare} (${numberOfSections} sections × LKR 8.50)`);
            }
        }

        // Round to nearest 5 rupees (common in Sri Lankan bus fares)
        const finalFare = Math.round(baseFare / 5) * 5;
        
        console.log(`✅ Final fare: LKR ${finalFare}`);
        console.log(`🕒 Calculation completed in ~${((Date.now() - req.startTime) / 1000).toFixed(1)}s\n`);

        // Format bus stops for response - ensure proper ordering by distance
        const sortedStopsForResponse = [...routeInfo.busStops].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        const formattedStops = sortedStopsForResponse.map((stop, index) => ({
            order: index + 1,
            name: stop.name,
            type: stop.type || 'bus_stop',
            vicinity: stop.vicinity || null,
            distanceKm: stop.distanceKm || null,
            place_id: stop.place_id || null,
            transit_line: stop.transit_line || null,
            vehicle_type: stop.vehicle_type || null
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
                baseFare: baseFare,
                finalFare: finalFare,
                method: routeInfo.method,
                quality: routeInfo.detectionQuality || 'unknown',
                explanation: calculationExplanation
            },
            busStops: formattedStops,
            meta: {
                timestamp: new Date().toISOString(),
                processingTime: `${((Date.now() - req.startTime) / 1000).toFixed(1)}s`,
                apiVersion: '2.0'
            }
        });

    } catch (error) {
        console.error('Error calculating fare:', error);
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
