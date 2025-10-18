const db = require('../config/db');

const BusRoute = {
  /**
   * Search active bus route assignments by route number or bus registration.
   * Returns a lightweight payload suitable for auto-complete lists.
   * @param {string} query
   * @returns {Promise<Array>}
   */
  search: async (query) => {
    const likeValue = `%${query}%`;
    console.log('[BusRoute.search] Executing search for query:', query);
    const result = await db.query(
      `SELECT
         br.bus_route_id,
         br.bus_id,
         br.route_id,
         br.registration_number,
         br.route_number,
         COALESCE(r.route_name, '') AS route_name,
         COALESCE(b.registration_number, br.registration_number) AS bus_registration,
         COALESCE(b.model, '') AS bus_model
  FROM bus_route br
       LEFT JOIN routes r ON r.route_id = br.route_id
       LEFT JOIN buses b ON b.bus_id = br.bus_id
       WHERE br.is_active = TRUE
         AND (
           CAST(br.route_number AS TEXT) ILIKE $1 OR
           COALESCE(br.registration_number, '') ILIKE $1 OR
           COALESCE(r.route_name, '') ILIKE $1 OR
           COALESCE(b.registration_number, '') ILIKE $1
         )
       ORDER BY br.route_number ASC, br.registration_number ASC
       LIMIT 20`,
      [likeValue]
    );
    console.log('[BusRoute.search] Rows found:', result.rows.length);
    return result.rows;
  },

  /**
   * Search only for routes (by route number or route name).
   * Returns unique routes without bus details.
   * @param {string} query
   * @returns {Promise<Array>}
   */
  searchRoutes: async (query) => {
    const likeValue = `%${query}%`;
    console.log('[BusRoute.searchRoutes] Searching routes for query:', query);
    const result = await db.query(
      `SELECT DISTINCT
         r.route_id,
         r.route_number,
         r.route_name,
         r.start_location,
         r.end_location
       FROM routes r
       WHERE r.is_active = TRUE
         AND (
           CAST(r.route_number AS TEXT) ILIKE $1 OR
           COALESCE(r.route_name, '') ILIKE $1
         )
       ORDER BY r.route_number ASC
       LIMIT 20`,
      [likeValue]
    );
    console.log('[BusRoute.searchRoutes] Routes found:', result.rows.length);
    return result.rows;
  },

  /**
   * Search only for buses (by registration number).
   * Returns bus details with their assigned routes.
   * @param {string} query
   * @returns {Promise<Array>}
   */
  searchBuses: async (query) => {
    const likeValue = `%${query}%`;
    console.log('[BusRoute.searchBuses] Searching buses for query:', query);
    const result = await db.query(
      `SELECT DISTINCT
         b.bus_id,
         b.registration_number,
         b.model,
         b.status,
         br.route_number,
         r.route_name
       FROM buses b
       LEFT JOIN bus_route br ON br.bus_id = b.bus_id AND br.is_active = TRUE
       LEFT JOIN routes r ON r.route_id = br.route_id
       WHERE b.status IN ('Active', 'In Service')
         AND COALESCE(b.registration_number, '') ILIKE $1
       ORDER BY b.registration_number ASC
       LIMIT 20`,
      [likeValue]
    );
    console.log('[BusRoute.searchBuses] Buses found:', result.rows.length);
    return result.rows;
  }
};

module.exports = BusRoute;
