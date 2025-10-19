const db = require('../config/db');

class WorkforceModel {
  static async getSummaryStats() {
    const result = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = TRUE AND role_id != (SELECT role_id FROM roles WHERE role_name='passenger')) AS total_employees,
        (SELECT COUNT(*) FROM depot_managers) AS depot_managers,
        (SELECT COUNT(*) FROM depot_operation_managers) AS operational_managers,
        (SELECT COUNT(*) FROM depot_engineers) AS depot_engineers,
        ((SELECT COUNT(*) FROM drivers) + (SELECT COUNT(*) FROM conductors)) AS drivers_conductors
    `);
    return result.rows[0];
  }

  static async getHeadcountByRegion() {
    const result = await db.query(`
      SELECT 
        r.region_name AS region,
        COUNT(u.user_id)::INTEGER AS count
      FROM regions r
      LEFT JOIN depot_managers dm ON dm.region_id = r.region_id
      LEFT JOIN depot_engineers de ON de.region_id = r.region_id
      LEFT JOIN depot_operation_managers dom ON dom.region_id = r.region_id
      LEFT JOIN drivers dr ON dr.region_id = r.region_id
      LEFT JOIN conductors c ON c.region_id = r.region_id
      LEFT JOIN users u ON u.user_id IN (
        dm.depot_manager_id, de.depot_engineer_id, dom.depot_op_manager_id, dr.driver_id, c.conductor_id
      )
      GROUP BY r.region_name
      ORDER BY r.region_name
    `);
    return result.rows;
  }

  static async getHeadcountByDepot() {
    const result = await db.query(`
      SELECT 
        d.depot_name AS depot,
        COUNT(u.user_id)::INTEGER AS count
      FROM depots d
      LEFT JOIN depot_managers dm ON dm.depot_id = d.depot_id
      LEFT JOIN depot_engineers de ON de.depot_id = d.depot_id
      LEFT JOIN depot_operation_managers dom ON dom.depot_id = d.depot_id
      LEFT JOIN drivers dr ON dr.depot_id = d.depot_id
      LEFT JOIN conductors c ON c.depot_id = d.depot_id
      LEFT JOIN users u ON u.user_id IN (
        dm.depot_manager_id, de.depot_engineer_id, dom.depot_op_manager_id, dr.driver_id, c.conductor_id
      )
      GROUP BY d.depot_name
      ORDER BY d.depot_name
    `);
    return result.rows;
  }

  static async getNewEmployeesByMonth() {
    const result = await db.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') AS month,
        COUNT(*)::INTEGER AS count
      FROM users
      WHERE is_active = TRUE 
        AND role_id != (SELECT role_id FROM roles WHERE role_name='passenger')
      GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
      ORDER BY EXTRACT(MONTH FROM created_at)
    `);
    return result.rows;
  }
}

module.exports = WorkforceModel;
