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

// Helper function to extract major city/town names from Google Maps address (conservative approach)
const extractMajorCityFromGoogleAddress = (addressComponents, formattedAddress) => {
    if (!addressComponents && !formattedAddress) return null;
    
    // Only consider major administrative levels - be very conservative
    const majorCityTypes = [
        'locality',                    // Primary city/town only
        'administrative_area_level_2'  // District level only (major areas)
    ];
    
    // Extract from address components - only major cities
    if (addressComponents) {
        for (const component of addressComponents) {
            if (majorCityTypes.some(type => component.types.includes(type)) && 
                component.long_name && 
                component.long_name.trim().length > 3 && // Minimum 4 characters
                !component.long_name.toLowerCase().includes('sri lanka') &&
                !component.long_name.toLowerCase().includes('province') &&
                !component.long_name.toLowerCase().includes('district') &&
                !component.long_name.toLowerCase().includes('division')) {
                return component.long_name.trim();
            }
        }
    }
    
    // Very conservative fallback from formatted address - only first major part
    if (formattedAddress) {
        const addressParts = formattedAddress.split(',').map(part => part.trim());
        
        // Only return the first part if it looks like a major city (longer name, not just a road)
        if (addressParts.length > 0) {
            const firstPart = addressParts[0];
            if (firstPart && 
                firstPart.length > 3 && // Minimum 4 characters for major cities
                !firstPart.toLowerCase().includes('road') &&
                !firstPart.toLowerCase().includes('street') &&
                !firstPart.toLowerCase().includes('lane') &&
                !firstPart.toLowerCase().includes('avenue') &&
                !/^\d+/.test(firstPart) && // Not starting with numbers (addresses)
                !firstPart.toLowerCase().includes('sri lanka') &&
                !firstPart.toLowerCase().includes('province')) {
                return firstPart;
            }
        }
    }
    
    return null;
};

// Helper function to find cities along the route (realistic approach matching Google Maps)
const getBusStopsAlongRoute = async (originCoords, destCoords, apiKey) => {
    try {
        // Get driving route 
        const drivingResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&mode=driving&key=${apiKey}`
        );

        let distance = 0;
        let duration = '';
        const majorCities = new Set();

        if (drivingResponse.data.routes && drivingResponse.data.routes.length > 0) {
            const route = drivingResponse.data.routes[0];
            distance = route.legs[0].distance.value / 1000; // Convert to km
            duration = route.legs[0].duration.text;
            
            console.log(`🗺️ Analyzing route: ${distance}km from ${route.legs[0].start_address} to ${route.legs[0].end_address}`);
            
            // Extract major cities from start and end
            const startCity = extractMajorCityFromGoogleAddress(null, route.legs[0].start_address);
            const endCity = extractMajorCityFromGoogleAddress(null, route.legs[0].end_address);
            
            if (startCity) {
                majorCities.add(startCity);
                console.log(`🏙️ Start: ${startCity}`);
            }
            if (endCity) {
                majorCities.add(endCity);
                console.log(`🏙️ End: ${endCity}`);
            }
            
            // Realistic sampling based on actual route distance
            const routePolyline = route.overview_polyline.points;
            const routeCoords = decodePolyline(routePolyline);
            
            // More realistic sampling - scale with distance properly
            let maxSamples, samplingInterval;
            
            if (distance <= 20) {
                // Short routes (like Ratmalana to Kollupitiya): Sample every 3-4km
                maxSamples = Math.ceil(distance / 3.5); // ~4-6 samples for 15km
                samplingInterval = 4;
            } else if (distance <= 50) {
                // Medium routes: Sample every 4-5km
                maxSamples = Math.ceil(distance / 4.5); // ~8-11 samples for 40km
                samplingInterval = 5;
            } else if (distance <= 100) {
                // Long routes: Sample every 5-6km
                maxSamples = Math.ceil(distance / 5.5); // ~14-18 samples for 80km
                samplingInterval = 6;
            } else {
                // Very long routes (like Colombo to Kandy): Sample every 6-7km
                maxSamples = Math.ceil(distance / 6.5); // ~17-20 samples for 115km
                samplingInterval = 7;
            }
            
            const sampleInterval = Math.max(1, Math.floor(routeCoords.length / maxSamples));
            
            console.log(`🔍 Realistic sampling: ${maxSamples} waypoints (every ~${samplingInterval}km) for ${distance}km route`);
            
            let samplesProcessed = 0;
            
            // Sample waypoints along the route
            for (let i = sampleInterval; i < routeCoords.length - sampleInterval && samplesProcessed < maxSamples - 2; i += sampleInterval) {
                const coord = routeCoords[i];
                
                try {
                    // Look for localities and administrative areas
                    const geocodeResponse = await axios.get(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.lat},${coord.lng}&key=${apiKey}&result_type=locality|administrative_area_level_2`
                    );
                    
                    if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
                        // Take the first (most relevant) result
                        const result = geocodeResponse.data.results[0];
                        const majorCity = extractMajorCityFromGoogleAddress(result.address_components, result.formatted_address);
                        
                        if (majorCity && majorCity !== startCity && majorCity !== endCity) {
                            const wasNew = !majorCities.has(majorCity);
                            majorCities.add(majorCity);
                            if (wasNew) {
                                console.log(`🏙️ Waypoint ${samplesProcessed+1}: ${majorCity} (~${Math.round((i/routeCoords.length) * distance)}km)`);
                            }
                        }
                    }
                    
                    samplesProcessed++;
                    
                    // Moderate delay to respect API limits
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                } catch (error) {
                    console.log(`⚠️ Geocoding error at waypoint ${samplesProcessed+1}`);
                    samplesProcessed++;
                }
            }
            
            const cityArray = Array.from(majorCities).filter(city => city && city.length > 3).sort();
            
            console.log(`✅ FINAL RESULT: Found ${cityArray.length} major cities along ${distance}km route`);
            console.log(`🏙️ Major cities: ${cityArray.join(' → ')}`);
            
            // Return actual detected cities count, minimum 2 for valid routes
            const finalCityCount = Math.max(2, cityArray.length);
            
            return {
                distance: distance,
                duration: duration,
                cities: cityArray,
                numberOfCities: finalCityCount
            };
        }

        // Fallback: Realistic distance-based estimation
        console.log('📏 Using realistic distance-based estimation...');
        
        let estimatedCities;
        if (distance <= 15) {
            estimatedCities = Math.max(3, Math.ceil(distance / 3)); // 3-5 cities for short routes
        } else if (distance <= 30) {
            estimatedCities = Math.max(5, Math.ceil(distance / 4)); // 5-8 cities for medium-short routes
        } else if (distance <= 60) {
            estimatedCities = Math.max(8, Math.ceil(distance / 5)); // 8-12 cities for medium routes
        } else if (distance <= 100) {
            estimatedCities = Math.max(12, Math.ceil(distance / 6)); // 12-17 cities for long routes
        } else {
            estimatedCities = Math.max(15, Math.ceil(distance / 7)); // 15-20+ cities for very long routes
        }
        
        console.log(`📏 Realistic estimate: ${estimatedCities} cities for ${distance}km route`);
        
        return {
            distance: distance,
            duration: duration,
            cities: [],
            numberOfCities: estimatedCities
        };

    } catch (error) {
        console.error('Error finding cities along route:', error);
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
        if (!googleMapsApiKey) {
            return res.status(500).json({ message: 'Google Maps API key not configured' });
        }

        // Get coordinates for origin and destination
        const originCoords = await getLatLng(origin, googleMapsApiKey);
        const destCoords = await getLatLng(destination, googleMapsApiKey);

        if (!originCoords || !destCoords) {
            return res.status(400).json({ message: 'Invalid origin or destination' });
        }

        // Get cities along the route (conservative approach)
        const routeInfo = await getBusStopsAlongRoute(originCoords, destCoords, googleMapsApiKey);
        
        // Calculate fare based on number of major cities detected
        let numberOfSections = Math.max(1, routeInfo.numberOfCities);
        
        console.log(`💰 Fare calculation: ${routeInfo.numberOfCities} major cities detected, ${numberOfSections} billable sections`);
        console.log(`🏙️ Major cities along route: ${routeInfo.cities.length > 0 ? routeInfo.cities.join(', ') : 'estimated based on distance'}`);
        
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
            numberOfCities: routeInfo.numberOfCities,
            numberOfSections: numberOfSections,
            distance: routeInfo.distance,
            duration: routeInfo.duration,
            cities: routeInfo.cities.slice(0, 10).map(city => ({ // Show up to 10 cities
                name: city.charAt(0).toUpperCase() + city.slice(1), // Capitalize first letter
                type: 'city'
            })),
            route: {
                origin: { coordinates: originCoords },
                destination: { coordinates: destCoords }
            },
            calculation: {
                method: routeInfo.numberOfCities > 0 ? 'major_cities_detected' : 'distance_estimated',
                routeDistance: routeInfo.distance,
                citiesMethod: routeInfo.cities.length > 0 ? 'google_geocoded' : 'conservative_estimated'
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
