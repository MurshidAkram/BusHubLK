const db = require('../config/db');

class WorkforceModel {
  // Get summary statistics
  static async getSummaryStats() {
    const result = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users 
         WHERE is_active = TRUE 
         AND role_id != (SELECT role_id FROM roles WHERE role_name = 'passenger')
        )::INTEGER AS total_employees,
        
        (SELECT COUNT(*) FROM depot_managers)::INTEGER AS depot_managers,
        
        (SELECT COUNT(*) FROM depot_operation_managers)::INTEGER AS operational_managers,
        
        (SELECT COUNT(*) FROM depot_engineers)::INTEGER AS depot_engineers,
        
        (SELECT COUNT(*) FROM drivers)::INTEGER AS drivers,
        
        (SELECT COUNT(*) FROM conductors)::INTEGER AS conductors,
        
        ((SELECT COUNT(*) FROM drivers) + (SELECT COUNT(*) FROM conductors))::INTEGER AS drivers_conductors,
        
        (SELECT COUNT(*) FROM regional_technical_officers)::INTEGER AS regional_technical,
        
        (SELECT COUNT(*) FROM regional_operations_officers)::INTEGER AS regional_operations
    `);
    return result.rows[0];
  }

  // Get headcount by region with role breakdown
  static async getHeadcountByRegion() {
    const result = await db.query(`
      SELECT 
        r.region_name AS region,
        COUNT(DISTINCT dm.depot_manager_id)::INTEGER AS managers,
        COUNT(DISTINCT de.depot_engineer_id)::INTEGER AS engineers,
        COUNT(DISTINCT dom.depot_op_manager_id)::INTEGER AS op_managers,
        COUNT(DISTINCT dr.driver_id)::INTEGER AS drivers,
        COUNT(DISTINCT c.conductor_id)::INTEGER AS conductors,
        (
          COUNT(DISTINCT dm.depot_manager_id) + 
          COUNT(DISTINCT de.depot_engineer_id) + 
          COUNT(DISTINCT dom.depot_op_manager_id) + 
          COUNT(DISTINCT dr.driver_id) + 
          COUNT(DISTINCT c.conductor_id)
        )::INTEGER AS total_count
      FROM regions r
      LEFT JOIN depot_managers dm ON dm.region_id = r.region_id
      LEFT JOIN depot_engineers de ON de.region_id = r.region_id
      LEFT JOIN depot_operation_managers dom ON dom.region_id = r.region_id
      LEFT JOIN drivers dr ON dr.region_id = r.region_id
      LEFT JOIN conductors c ON c.region_id = r.region_id
      GROUP BY r.region_name
      ORDER BY total_count DESC, r.region_name
    `);
    return result.rows;
  }

  // Get headcount by depot with role breakdown
  static async getHeadcountByDepot() {
    const result = await db.query(`
      SELECT 
        d.depot_name AS depot,
        r.region_name AS region,
        COUNT(DISTINCT dm.depot_manager_id)::INTEGER AS managers,
        COUNT(DISTINCT de.depot_engineer_id)::INTEGER AS engineers,
        COUNT(DISTINCT dom.depot_op_manager_id)::INTEGER AS op_managers,
        COUNT(DISTINCT dr.driver_id)::INTEGER AS drivers,
        COUNT(DISTINCT c.conductor_id)::INTEGER AS conductors,
        (
          COUNT(DISTINCT dm.depot_manager_id) + 
          COUNT(DISTINCT de.depot_engineer_id) + 
          COUNT(DISTINCT dom.depot_op_manager_id) + 
          COUNT(DISTINCT dr.driver_id) + 
          COUNT(DISTINCT c.conductor_id)
        )::INTEGER AS total_count
      FROM depots d
      JOIN regions r ON d.region_id = r.region_id
      LEFT JOIN depot_managers dm ON dm.depot_id = d.depot_id
      LEFT JOIN depot_engineers de ON de.depot_id = d.depot_id
      LEFT JOIN depot_operation_managers dom ON dom.depot_id = d.depot_id
      LEFT JOIN drivers dr ON dr.depot_id = d.depot_id
      LEFT JOIN conductors c ON c.depot_id = d.depot_id
      GROUP BY d.depot_name, r.region_name
      ORDER BY total_count DESC
      LIMIT 20
    `);
    return result.rows;
  }

  // Get new employees by month (last 12 months)
  static async getNewEmployeesByMonth() {
    const result = await db.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon YYYY') AS month,
        TO_CHAR(created_at, 'YYYY-MM') AS month_key,
        COUNT(*)::INTEGER AS count
      FROM users
      WHERE is_active = TRUE 
        AND role_id != (SELECT role_id FROM roles WHERE role_name = 'passenger')
        AND created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month_key
    `);
    return result.rows;
  }

  // Get role distribution
  static async getRoleDistribution() {
    const result = await db.query(`
      SELECT 
        r.role_name,
        COUNT(u.user_id)::INTEGER AS count
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.role_id AND u.is_active = TRUE
      WHERE r.role_name != 'passenger'
      GROUP BY r.role_name
      ORDER BY count DESC
    `);
    return result.rows;
  }

  // Get top depots by employee count
  static async getTopDepotsByHeadcount(limit = 10) {
    const result = await db.query(`
      SELECT 
        d.depot_name,
        r.region_name,
        (
          COUNT(DISTINCT dm.depot_manager_id) + 
          COUNT(DISTINCT de.depot_engineer_id) + 
          COUNT(DISTINCT dom.depot_op_manager_id) + 
          COUNT(DISTINCT dr.driver_id) + 
          COUNT(DISTINCT c.conductor_id)
        )::INTEGER AS employee_count
      FROM depots d
      JOIN regions r ON d.region_id = r.region_id
      LEFT JOIN depot_managers dm ON dm.depot_id = d.depot_id
      LEFT JOIN depot_engineers de ON de.depot_id = d.depot_id
      LEFT JOIN depot_operation_managers dom ON dom.depot_id = d.depot_id
      LEFT JOIN drivers dr ON dr.depot_id = d.depot_id
      LEFT JOIN conductors c ON c.depot_id = d.depot_id
      GROUP BY d.depot_name, r.region_name
      HAVING COUNT(DISTINCT dm.depot_manager_id) + 
             COUNT(DISTINCT de.depot_engineer_id) + 
             COUNT(DISTINCT dom.depot_op_manager_id) + 
             COUNT(DISTINCT dr.driver_id) + 
             COUNT(DISTINCT c.conductor_id) > 0
      ORDER BY employee_count DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  }
}

module.exports = WorkforceModel;