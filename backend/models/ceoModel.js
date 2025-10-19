const db = require('../config/db');

class CeoModel {
  static async getRegions() {
    const result = await db.query('SELECT * FROM regions ORDER BY region_name');
    return result.rows;
  }

  static async getDepots() {
    const result = await db.query(
      `SELECT 
         d.depot_id,
         d.depot_name,
         r.region_name,
         COUNT(b.bus_id)::INTEGER as bus_count,
         COUNT(CASE WHEN b.status = 'Active' THEN 1 END)::INTEGER as active_buses,
         COUNT(CASE WHEN b.status = 'Maintenance' THEN 1 END)::INTEGER as maintenance_buses,
         COUNT(CASE WHEN b.status = 'Out of Service' THEN 1 END)::INTEGER as out_of_service_buses,
         d.address,
         dl.latitude,
         dl.longitude
       FROM depots d
       JOIN regions r ON d.region_id = r.region_id
       LEFT JOIN buses b ON d.depot_id = b.depot_id AND b.is_active = TRUE AND b.is_deleted = FALSE
       LEFT JOIN depot_locations dl ON d.depot_id = dl.depot_id
       GROUP BY d.depot_id, d.depot_name, r.region_name, d.address, dl.latitude, dl.longitude
       ORDER BY d.depot_name`
    );
    return result.rows;
  }

  static async getDepotsByRegion(region_id) {
    const result = await db.query(
      `SELECT 
         d.depot_id,
         d.depot_name,
         r.region_name,
         COUNT(b.bus_id)::INTEGER as bus_count,
         COUNT(CASE WHEN b.status = 'Active' THEN 1 END)::INTEGER as active_buses,
         COUNT(CASE WHEN b.status = 'Maintenance' THEN 1 END)::INTEGER as maintenance_buses,
         COUNT(CASE WHEN b.status = 'Out of Service' THEN 1 END)::INTEGER as out_of_service_buses,
         d.address,
         dl.latitude,
         dl.longitude
       FROM depots d
       JOIN regions r ON d.region_id = r.region_id
       LEFT JOIN buses b ON d.depot_id = b.depot_id AND b.is_active = TRUE AND b.is_deleted = FALSE
       LEFT JOIN depot_locations dl ON d.depot_id = dl.depot_id
       WHERE d.region_id = $1
       GROUP BY d.depot_id, d.depot_name, r.region_name, d.address, dl.latitude, dl.longitude
       ORDER BY d.depot_name`,
      [region_id]
    );
    return result.rows;
  }

  // Get routes for a specific depot
  static async getDepotRoutes(depot_id) {
    const result = await db.query(
      `SELECT 
         r.route_id,
         r.route_number,
         r.route_name,
         r.start_location as origin,
         r.end_location as destination,
         5 as number_of_buses,
         75 as load_percentage,
         1500 as daily_ridership
       FROM routes r
       WHERE r.depot_id = $1 AND r.is_active = TRUE
       ORDER BY r.route_number`,
      [depot_id]
    );
    return result.rows;
  }

  // Get buses for a specific depot
  static async getDepotBuses(depot_id) {
    const result = await db.query(
      `SELECT 
         b.bus_id,
         b.registration_number,
         b.manufacturer || ' ' || COALESCE(b.model, '') as model,
         b.year as manufacturing_year,
         b.status,
         b.mileage,
         COALESCE(b.purchase_date, CURRENT_DATE) as last_service_date
       FROM buses b
       WHERE b.depot_id = $1 
         AND b.is_active = TRUE 
         AND b.is_deleted = FALSE
       ORDER BY b.registration_number`,
      [depot_id]
    );
    return result.rows;
  }
}

module.exports = CeoModel;