const Route = require('../models/routeModel');
const db = require('../config/db');

const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.getAll();
    res.json({ routes });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get route stops autocomplete suggestions
const getRouteStopsAutocomplete = async (req, res) => {
  try {
    const { input } = req.query;
    
    if (!input || input.length < 1) {
      return res.json({ suggestions: [] });
    }

    // Search for stops that start with the input (case-insensitive)
    const result = await db.query(
      `SELECT DISTINCT stop_name as name, stop_name as description 
       FROM route_stops 
       WHERE LOWER(stop_name) LIKE LOWER($1) 
       ORDER BY stop_name 
       LIMIT 3`,
      [`${input}%`]
    );

    const suggestions = result.rows.map(row => ({
      name: row.name,
      description: row.description,
      place_id: row.name.toLowerCase().replace(/\s+/g, '_') // Create a unique identifier
    }));

    res.json({ 
      status: 'OK',
      suggestions: suggestions 
    });
  } catch (err) {
    console.error('Error fetching route stops:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Find bus routes between two stops
const findRoutesBetweenStops = async (req, res) => {
  try {
    const { from, to } = req.body;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'From and To locations are required' });
    }

    console.log(`🔍 Searching routes from "${from}" to "${to}"`);

    // First check if the stops exist in our database
    const fromStopCheck = await db.query(
      `SELECT DISTINCT stop_name FROM route_stops WHERE LOWER(TRIM(stop_name)) = LOWER(TRIM($1))`,
      [from]
    );
    
    const toStopCheck = await db.query(
      `SELECT DISTINCT stop_name FROM route_stops WHERE LOWER(TRIM(stop_name)) = LOWER(TRIM($1))`,
      [to]
    );

    console.log(`📍 From stop "${from}" exists: ${fromStopCheck.rows.length > 0}`);
    console.log(`📍 To stop "${to}" exists: ${toStopCheck.rows.length > 0}`);

    if (fromStopCheck.rows.length === 0) {
      return res.json({ 
        success: false,
        error: `From location "${from}" not found in route database`,
        routes: [],
        count: 0 
      });
    }

    if (toStopCheck.rows.length === 0) {
      return res.json({ 
        success: false,
        error: `To location "${to}" not found in route database`,
        routes: [],
        count: 0 
      });
    }

    // Find routes that contain both stops - INCLUDING REVERSE DIRECTION (return trips)
    // Search in both directions:
    // 1. Forward: from_order < to_order (normal direction)
    // 2. Reverse: from_order > to_order (return trip direction)
    // Each route (identified by route_number) may have different stop counts and fares
    // Example: Route 138 (22 stops) and Route 120 (15 stops) both go Pettah→Kirulapone
    const result = await db.query(
      `SELECT DISTINCT ON (r.route_number, 
                           CASE WHEN from_stop.stop_order < to_stop.stop_order THEN 'forward' ELSE 'reverse' END)
              r.route_id, r.route_number, r.route_name, 
              r.start_location, r.end_location, r.distance_km,
              from_stop.stop_order as from_order,
              to_stop.stop_order as to_order,
              CASE 
                WHEN from_stop.stop_order < to_stop.stop_order THEN 'forward'
                ELSE 'reverse'
              END as direction
       FROM routes r
       INNER JOIN route_stops from_stop ON r.route_number = from_stop.route_number 
       INNER JOIN route_stops to_stop ON r.route_number = to_stop.route_number
       WHERE LOWER(TRIM(from_stop.stop_name)) = LOWER(TRIM($1))
         AND LOWER(TRIM(to_stop.stop_name)) = LOWER(TRIM($2))
         AND from_stop.stop_order != to_stop.stop_order
       ORDER BY r.route_number, 
                CASE WHEN from_stop.stop_order < to_stop.stop_order THEN 'forward' ELSE 'reverse' END,
                r.route_id`,
      [from, to]
    );

    console.log(`📊 Found ${result.rows.length} unique route(s) (including return trips)`);
    
    // Log route details for debugging
    result.rows.forEach(route => {
      const stopsCount = Math.abs(route.to_order - route.from_order) + 1;
      console.log(`   - Route ${route.route_number} (${route.direction}): ${stopsCount} stops from "${from}" to "${to}"`);
    });

    // Calculate fare for each route based on number of stops
    // Handle both forward and reverse directions
    // IMPORTANT: Each route number (138, 120, etc.) is processed independently
    // Different routes may cover the same stops but with different paths/stop counts
    const routes = await Promise.all(result.rows.map(async (route) => {
      // Calculate stops count based on direction
      // For both forward and reverse, the fare is based on the absolute distance between stops
      const stopsCount = Math.abs(route.to_order - route.from_order) + 1;
      const isReverse = route.direction === 'reverse';
      
      console.log(`🚌 Calculating fare for Route ${route.route_number} (${route.direction}): ${from} → ${to}, ${stopsCount} stops`);
      
      // Fetch all stops between from and to for this route
      let stops = [];
      try {
        const minOrder = Math.min(route.from_order, route.to_order);
        const maxOrder = Math.max(route.from_order, route.to_order);
        
        const stopsQuery = `
          SELECT stop_name as name, stop_order
          FROM route_stops
          WHERE route_number = $1
            AND stop_order >= $2
            AND stop_order <= $3
          ORDER BY stop_order ASC
        `;
        
        const stopsResult = await db.query(stopsQuery, [route.route_number, minOrder, maxOrder]);
        stops = stopsResult.rows;
        
        console.log(`   📍 Found ${stops.length} stops for route ${route.route_number}`);
      } catch (stopsError) {
        console.error(`   ❌ Error fetching stops for route ${route.route_number}:`, stopsError);
      }
      
      // Get fare from bus_fares table based on number of stops
      let fare = null;
      try {
        const fareQuery = 'SELECT fare FROM bus_fares WHERE section = $1';
        const fareResult = await db.query(fareQuery, [stopsCount]);
        
        if (fareResult.rows.length > 0) {
          fare = parseFloat(fareResult.rows[0].fare);
        } else {
          // Find closest section if exact match not found
          const closestQuery = 'SELECT section, fare FROM bus_fares WHERE section <= $1 ORDER BY section DESC LIMIT 1';
          const closestResult = await db.query(closestQuery, [stopsCount]);
          
          if (closestResult.rows.length > 0) {
            const baseFare = parseFloat(closestResult.rows[0].fare);
            const baseSection = closestResult.rows[0].section;
            
            // Extrapolate based on section difference  
            const extraSections = stopsCount - baseSection;
            const farePerSection = 10; // Default increment per additional section
            fare = baseFare + (extraSections * farePerSection);
          } else {
            // Fallback: basic calculation if no data found
            fare = stopsCount * 15; // Rs. 15 per stop as fallback
          }
        }
      } catch (fareError) {
        console.error('Error calculating fare:', fareError);
        fare = stopsCount * 15; // Fallback calculation
      }

      return {
        route_id: route.route_id,
        route_number: route.route_number,
        route_name: route.route_name,
        start_location: route.start_location,
        end_location: route.end_location,
        total_distance_km: route.distance_km,
        direction: route.direction, // 'forward' or 'reverse'
        stops: stops, // Include the stops between from and to
        journey: {
          from_stop: from,
          to_stop: to,
          from_order: route.from_order,
          to_order: route.to_order,
          stops_count: stopsCount,
          fare: fare,
          is_return_trip: isReverse
        }
      };
    }));

    res.json({ 
      success: true,
      routes: routes,
      count: routes.length 
    });
  } catch (err) {
    console.error('Error finding routes between stops:', err);
    console.error('SQL Error details:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const getDepots = async (req, res) => {
  try {
    const result = await db.query(`SELECT depot_id, depot_name FROM depots WHERE is_active = TRUE ORDER BY depot_name`);
    res.json({ depots: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createRoute = async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json({ route });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateRoute = async (req, res) => {
  try {
    const route = await Route.update(req.params.id, req.body);
    res.json({ route });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deactivateRoute = async (req, res) => {
  try {
    const route = await Route.deactivate(req.params.id);
    res.json({ route });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllRoutes,
  getRouteStopsAutocomplete,
  findRoutesBetweenStops,
  getDepots,
  createRoute,
  updateRoute,
  deactivateRoute
};