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
    try {
      // Direct count from role-specific tables
      const result = await db.query(`
        SELECT 
          role_name,
          count
        FROM (
          SELECT 'Depot Manager' as role_name, COUNT(*)::INTEGER as count FROM depot_managers
          UNION ALL
          SELECT 'Depot Engineer' as role_name, COUNT(*)::INTEGER as count FROM depot_engineers
          UNION ALL
          SELECT 'Depot Operations' as role_name, COUNT(*)::INTEGER as count FROM depot_operation_managers
          UNION ALL
          SELECT 'Driver' as role_name, COUNT(*)::INTEGER as count FROM drivers
          UNION ALL
          SELECT 'Conductor' as role_name, COUNT(*)::INTEGER as count FROM conductors
          UNION ALL
          SELECT 'Regional Technical' as role_name, COUNT(*)::INTEGER as count FROM regional_technical_officers
          UNION ALL
          SELECT 'Regional Operations' as role_name, COUNT(*)::INTEGER as count FROM regional_operations_officers
          UNION ALL
          SELECT 'DGM Technical' as role_name, COUNT(*)::INTEGER as count FROM dgm_technical
          UNION ALL
          SELECT 'DGM Operations' as role_name, COUNT(*)::INTEGER as count FROM dgm_operations
          UNION ALL
          SELECT 'CEO' as role_name, COUNT(*)::INTEGER as count FROM ceo
          UNION ALL
          SELECT 'Admin' as role_name, COUNT(*)::INTEGER as count FROM admins
        ) role_counts
        WHERE count > 0
        ORDER BY count DESC
      `);
      
      console.log('✅ Role distribution query returned:', result.rows.length, 'roles');
      console.log('Data:', JSON.stringify(result.rows));
      
      return result.rows;
    } catch (error) {
      console.error('❌ getRoleDistribution error:', error.message);
      
      // Fallback method: Try using users table with roles
      try {
        console.log('⚠️ Trying fallback method...');
        const fallbackResult = await db.query(`
          SELECT 
            r.role_name,
            COUNT(u.user_id)::INTEGER AS count
          FROM roles r
          LEFT JOIN users u ON u.role_id = r.role_id AND u.is_active = TRUE
          WHERE r.role_name != 'passenger'
          GROUP BY r.role_name
          HAVING COUNT(u.user_id) > 0
          ORDER BY count DESC
        `);
        
        console.log('✅ Fallback returned:', fallbackResult.rows.length, 'roles');
        return fallbackResult.rows;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError.message);
        return [];
      }
    }
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