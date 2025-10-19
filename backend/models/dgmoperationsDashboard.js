const db = require('../config/db');

const toNumber = (v) => (v === null || v === undefined ? 0 : Number(v));

module.exports = {
  async getFleetStats() {
    // counts by status across all depots
    const q = `
      SELECT
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status ILIKE '%maintenance%' THEN 1 ELSE 0 END) AS maintenance,
        SUM(CASE WHEN status ILIKE '%out of service%' OR status ILIKE '%out_of_service%' THEN 1 ELSE 0 END) AS out_of_service,
        COUNT(*) AS total
      FROM buses
      WHERE is_deleted = false
    `;
    const r = await db.query(q);
    const row = r.rows[0] || {};
    return {
      active: toNumber(row.active),
      maintenance: toNumber(row.maintenance),
      out_of_service: toNumber(row.out_of_service),
      total: toNumber(row.total)
    };
  },

  async getCrewCounts() {
    // More robust approach: totals from drivers/conductors tables, statuses from crew_status joined by person_id
    const driversTotalRes = await db.query('SELECT COUNT(*) AS cnt FROM drivers');
    const conductorsTotalRes = await db.query('SELECT COUNT(*) AS cnt FROM conductors');

    const driversOnDutyRes = await db.query(`
      SELECT COUNT(DISTINCT cs.person_id) AS cnt
      FROM crew_status cs
      JOIN drivers d ON cs.person_id = d.driver_id
      WHERE LOWER(cs.role) = 'driver' AND LOWER(cs.status) LIKE '%on%'
    `);
    const driversOnBreakRes = await db.query(`
      SELECT COUNT(DISTINCT cs.person_id) AS cnt
      FROM crew_status cs
      JOIN drivers d ON cs.person_id = d.driver_id
      WHERE LOWER(cs.role) = 'driver' AND LOWER(cs.status) LIKE '%break%'
    `);

    const conductorsOnDutyRes = await db.query(`
      SELECT COUNT(DISTINCT cs.person_id) AS cnt
      FROM crew_status cs
      JOIN conductors c ON cs.person_id = c.conductor_id
      WHERE LOWER(cs.role) = 'conductor' AND LOWER(cs.status) LIKE '%on%'
    `);
    const conductorsOnBreakRes = await db.query(`
      SELECT COUNT(DISTINCT cs.person_id) AS cnt
      FROM crew_status cs
      JOIN conductors c ON cs.person_id = c.conductor_id
      WHERE LOWER(cs.role) = 'conductor' AND LOWER(cs.status) LIKE '%break%'
    `);

    const driversTotal = Number(driversTotalRes.rows[0]?.cnt || 0);
    const conductorsTotal = Number(conductorsTotalRes.rows[0]?.cnt || 0);
    const driversOnDuty = Number(driversOnDutyRes.rows[0]?.cnt || 0);
    const driversOnBreak = Number(driversOnBreakRes.rows[0]?.cnt || 0);
    const conductorsOnDuty = Number(conductorsOnDutyRes.rows[0]?.cnt || 0);
    const conductorsOnBreak = Number(conductorsOnBreakRes.rows[0]?.cnt || 0);

    return {
      drivers_total: driversTotal,
      drivers_on_duty: driversOnDuty,
      drivers_on_break: driversOnBreak,
      conductors_total: conductorsTotal,
      conductors_on_duty: conductorsOnDuty,
      conductors_on_break: conductorsOnBreak
    };
  },

  async getDepotsPerformance(limit = 10, offset = 0, regionId = null) {
    // returns depots with counts of buses and crew (drivers+conductors)
    const params = [];
    let where = '';
    if (regionId) {
      params.push(regionId);
      where = `WHERE d.region_id = $${params.length}`;
    }
    params.push(limit);
    params.push(offset);
    const q = `
      SELECT
        d.depot_id,
        d.depot_name,
        d.region_id,
        r.region_name,
        COALESCE(b.total_buses, 0) AS buses,
        COALESCE(b.active_buses, 0) AS active_buses,
        COALESCE(b.maintenance_buses, 0) AS maintenance_buses,
        COALESCE(b.out_of_service_buses, 0) AS out_of_service_buses,
        COALESCE(c.total_crews, 0) AS crews,
        COALESCE(c.drivers_on_duty, 0) AS drivers_on_duty,
        COALESCE(c.drivers_on_break, 0) AS drivers_on_break,
        COALESCE(c.conductors_on_duty, 0) AS conductors_on_duty,
        COALESCE(c.conductors_on_break, 0) AS conductors_on_break
      FROM depots d
      LEFT JOIN regions r ON d.region_id = r.region_id
      LEFT JOIN (
        SELECT
          depot_id,
          COUNT(*) AS total_buses,
          SUM(CASE WHEN LOWER(status) = 'active' OR LOWER(status) LIKE '%active%' THEN 1 ELSE 0 END) AS active_buses,
          SUM(CASE WHEN LOWER(status) LIKE '%maintenance%' THEN 1 ELSE 0 END) AS maintenance_buses,
          SUM(CASE WHEN LOWER(status) LIKE '%out of service%' OR LOWER(status) LIKE '%out_of_service%' OR LOWER(status) LIKE '%outofservice%' THEN 1 ELSE 0 END) AS out_of_service_buses
        FROM buses
        WHERE is_deleted = false
        GROUP BY depot_id
      ) b ON b.depot_id = d.depot_id
      LEFT JOIN (
        -- crew counts: join drivers and conductors with crew_status to get per-depot on-duty/on-break
        SELECT
          p.depot_id,
          COUNT(*) AS total_crews,
          SUM(CASE WHEN LOWER(cs.role) = 'driver' AND LOWER(cs.status) LIKE '%on%' THEN 1 ELSE 0 END) AS drivers_on_duty,
          SUM(CASE WHEN LOWER(cs.role) = 'driver' AND LOWER(cs.status) LIKE '%break%' THEN 1 ELSE 0 END) AS drivers_on_break,
          SUM(CASE WHEN LOWER(cs.role) = 'conductor' AND LOWER(cs.status) LIKE '%on%' THEN 1 ELSE 0 END) AS conductors_on_duty,
          SUM(CASE WHEN LOWER(cs.role) = 'conductor' AND LOWER(cs.status) LIKE '%break%' THEN 1 ELSE 0 END) AS conductors_on_break
        FROM (
          SELECT driver_id AS person_id, depot_id, 'driver' AS expected_role FROM drivers
          UNION ALL
          SELECT conductor_id AS person_id, depot_id, 'conductor' AS expected_role FROM conductors
        ) p
        LEFT JOIN crew_status cs ON cs.person_id = p.person_id AND LOWER(cs.role) = p.expected_role
        GROUP BY p.depot_id
      ) c ON c.depot_id = d.depot_id
      ${where}
      ORDER BY d.depot_name
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const r = await db.query(q, params);
    return r.rows || [];
  },

  async getTotalDepots(regionId = null) {
    if (regionId) {
      const r = await db.query('SELECT COUNT(*) AS cnt FROM depots WHERE region_id = $1', [regionId]);
      return Number(r.rows[0]?.cnt || 0);
    }
    const r = await db.query('SELECT COUNT(*) AS cnt FROM depots');
    return Number(r.rows[0]?.cnt || 0);
  },

  async getRecentIncidents(limit = 10) {
    const q = `
      SELECT er.id, er.incident_type, er.description, er.status, er.created_at,
             er.driver_id, er.bus_id, d.depot_id, d.depot_name, r.region_id, r.region_name
      FROM emergency_reports er
      LEFT JOIN drivers drv ON er.driver_id = drv.driver_id
      LEFT JOIN depots d ON drv.depot_id = d.depot_id
      LEFT JOIN regions r ON d.region_id = r.region_id
      ORDER BY er.created_at DESC
      LIMIT $1
    `;
    const r = await db.query(q, [limit]);
    return r.rows || [];
  },

  async getRegions() {
    const r = await db.query('SELECT region_id, region_name FROM regions ORDER BY region_name');
    return r.rows || [];
  }
};