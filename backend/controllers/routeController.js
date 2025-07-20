const db = require('../config/db');
const axios = require('axios');

const getAvailableRoutes = async (req, res) => {
    try {
        const { from, to } = req.query;
        
        // First, find routes that match the from and to locations
        const routeQuery = `
            SELECT DISTINCT 
                r.route_id,
                r.route_number,
                r.route_name,
                r.start_location,
                r.end_location,
                r.distance,
                b.registration_number,
                b.type as bus_type,
                br.bus_route_id
            FROM routes r
            INNER JOIN bus_routes br ON r.route_id = br.route_id
            INNER JOIN buses b ON br.bus_id = b.id
            WHERE (
                (r.start_location LIKE ? OR r.end_location LIKE ?)
                AND
                (r.start_location LIKE ? OR r.end_location LIKE ?)
            )
            OR EXISTS (
                SELECT 1 FROM route_stops rs1
                INNER JOIN route_stops rs2 ON rs1.route_id = rs2.route_id
                WHERE rs1.route_id = r.route_id
                AND rs1.stop_name LIKE ?
                AND rs2.stop_name LIKE ?
                AND rs1.stop_order < rs2.stop_order
            )
        `;

        const searchFrom = `%${from}%`;
        const searchTo = `%${to}%`;
        
        const [routes] = await db.query(routeQuery, [
            searchFrom, searchFrom,
            searchTo, searchTo,
            searchFrom, searchTo
        ]);

        // For each route, get the stops between from and to
        for (let route of routes) {
            // Get all stops for this route
            const [stops] = await db.query(
                `SELECT stop_name, stop_order, distance_from_start 
                FROM route_stops 
                WHERE route_id = ? 
                ORDER BY stop_order`,
                [route.route_id]
            );

            // Find the start and end stops
            const startStopIndex = stops.findIndex(stop => 
                stop.stop_name.toLowerCase().includes(from.toLowerCase()));
            const endStopIndex = stops.findIndex(stop => 
                stop.stop_name.toLowerCase().includes(to.toLowerCase()));

            if (startStopIndex !== -1 && endStopIndex !== -1) {
                // Get intermediate stops
                route.intermediateStops = stops.slice(
                    startStopIndex + 1,
                    endStopIndex
                );

                // Calculate actual distance between these stops
                const actualDistance = 
                    stops[endStopIndex].distance_from_start - 
                    stops[startStopIndex].distance_from_start;
                route.segment_distance = Math.abs(actualDistance);

                // Get directions from Google Maps API for accurate time estimation
                const directionsResponse = await axios.get(
                    `https://maps.googleapis.com/maps/api/directions/json?origin=${
                        encodeURIComponent(stops[startStopIndex].stop_name)
                    }&destination=${
                        encodeURIComponent(stops[endStopIndex].stop_name)
                    }&mode=driving&key=${process.env.GOOGLE_MAPS_API_KEY}`
                );

                if (directionsResponse.data.routes && directionsResponse.data.routes[0]) {
                    const routeData = directionsResponse.data.routes[0].legs[0];
                    route.estimated_duration = routeData.duration.text;
                    route.google_maps_distance = routeData.distance.text;
                    route.polyline = directionsResponse.data.routes[0].overview_polyline.points;
                }

                // Calculate fare based on distance
                const [fareResult] = await db.query(
                    'SELECT fare FROM fares WHERE section <= ? ORDER BY section DESC LIMIT 1',
                    [Math.ceil(route.segment_distance)]
                );

                route.fare = fareResult[0]?.fare || 0;
            }
        }

        res.json({
            success: true,
            routes: routes
        });

    } catch (error) {
        console.error('Error in getAvailableRoutes:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching available routes'
        });
    }
};

module.exports = {
    getAvailableRoutes
};
