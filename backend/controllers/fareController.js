const db = require('../config/db');

const calculateFare = async (req, res) => {
    try {
        const { origin, destination } = req.body;

        // First, get route details from Google Maps API
        const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/directions/json?origin=place_id:${origin}&destination=place_id:${destination}&mode=transit&transit_mode=bus&key=${googleMapsApiKey}`
        );

        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
            return res.status(404).json({ message: 'No route found' });
        }

        // Get the number of stops from the route
        const route = data.routes[0];
        let numberOfStops = 0;

        if (route.legs && route.legs[0] && route.legs[0].steps) {
            route.legs[0].steps.forEach(step => {
                if (step.transit_details && step.transit_details.num_stops) {
                    numberOfStops += step.transit_details.num_stops;
                }
            });
        }

        // Query the database for the appropriate fare
        const query = 'SELECT fare FROM fares WHERE section <= ? ORDER BY section DESC LIMIT 1';
        const [fareResult] = await db.query(query, [numberOfStops]);

        if (!fareResult || fareResult.length === 0) {
            return res.status(404).json({ message: 'Fare not found for this route' });
        }

        return res.json({
            fare: fareResult[0].fare,
            numberOfStops,
            distance: route.legs[0].distance.value / 1000, // Convert to kilometers
            duration: route.legs[0].duration.text
        });

    } catch (error) {
        console.error('Error calculating fare:', error);
        return res.status(500).json({ message: 'Error calculating fare' });
    }
};

module.exports = {
    calculateFare
};
