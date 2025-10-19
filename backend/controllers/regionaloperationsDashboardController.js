const db = require('../config/db');

function formatTimeIso(dt) {
  if (!dt) return null;
  return new Date(dt).toISOString();
}

console.log('regionaloperationsDashboardController loaded');

const getOfficerRegionId = async (userId) => {
  const result = await db.query(
    'SELECT region_id FROM regional_operations_officers WHERE roo_id = $1 LIMIT 1',
    [userId]
  );
  return result.rows?.[0]?.region_id || null;
};

exports.getOfficerDepots = async (req, res) => {
  try {
    const userId = req.user.userId;
    const regionId = await getOfficerRegionId(userId);

    if (!regionId) {
      return res.status(404).json({ success: false, error: 'Region not assigned to this officer' });
    }

    const depotsRes = await db.query(
      `SELECT d.depot_id,
              d.depot_name,
              d.region_id,
              COUNT(r.route_id) AS route_count
         FROM depots d
         LEFT JOIN routes r ON r.depot_id = d.depot_id AND r.is_active = TRUE
        WHERE d.region_id = $1
        GROUP BY d.depot_id, d.depot_name, d.region_id
        ORDER BY d.depot_name`,
      [regionId]
    );

    const depots = depotsRes.rows.map(row => ({
      depot_id: row.depot_id,
      depot_name: row.depot_name,
      region_id: row.region_id,
      route_count: Number(row.route_count || 0)
    }));

    return res.json({ success: true, region_id: regionId, depots });
  } catch (error) {
    console.error('getOfficerDepots error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch depots for officer' });
  }
};

exports.getDepotRoutesForOfficer = async (req, res) => {
  try {
    const depotId = Number(req.params.depot_id);
    if (!depotId) {
      return res.status(400).json({ success: false, error: 'Valid depot_id is required' });
    }

    const userId = req.user.userId;
    const regionId = await getOfficerRegionId(userId);
    if (!regionId) {
      return res.status(404).json({ success: false, error: 'Region not assigned to this officer' });
    }

    const depotCheck = await db.query(
      'SELECT depot_id FROM depots WHERE depot_id = $1 AND region_id = $2 LIMIT 1',
      [depotId, regionId]
    );

    if (!depotCheck.rows.length) {
      return res.status(403).json({ success: false, error: 'Depot not accessible for this officer' });
    }

    const routesRes = await db.query(
      `SELECT route_id, route_number, route_name, depot_id
         FROM routes
        WHERE depot_id = $1 AND is_active = TRUE
        ORDER BY route_number`,
      [depotId]
    );

    return res.json({
      success: true,
      depot_id: depotId,
      region_id: regionId,
      routes: routesRes.rows
    });
  } catch (error) {
    console.error('getDepotRoutesForOfficer error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch routes for depot' });
  }
};

exports.getRegionOverview = async (req, res) => {
  console.log('getRegionOverview called region:', req.params.region_id);
  const regionId = Number(req.params.region_id);
  if (!regionId) return res.status(400).json({ success: false, error: 'region_id required' });

  try {
    // Fleet stats (buses -> depots.region_id)
    const fleetQ = `
      SELECT
        SUM(CASE WHEN b.status = 'Active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN b.status = 'In Service' THEN 1 ELSE 0 END) AS in_service,
        SUM(CASE WHEN b.status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance,
        SUM(CASE WHEN b.status = 'Out of Service' THEN 1 ELSE 0 END) AS out_of_service,
        COUNT(b.bus_id) AS total
      FROM buses b
      JOIN depots d ON b.depot_id = d.depot_id
      WHERE d.region_id = $1
    `;
    const fleetRes = await db.query(fleetQ, [regionId]);
    const fleetStats = fleetRes.rows[0] || { active: 0, in_service: 0, maintenance: 0, out_of_service: 0, total: 0 };

    // Crew counts: drivers (join drivers) and conductors (join conductors)
    const driversQ = `
      SELECT
        SUM(CASE WHEN cs.status ILIKE '%on duty%' OR cs.status ILIKE 'onduty' OR cs.status ILIKE 'on_duty' THEN 1 ELSE 0 END) AS on_duty,
        SUM(CASE WHEN cs.status ILIKE '%break%' OR cs.status ILIKE '%on break%' THEN 1 ELSE 0 END) AS on_break
      FROM crew_status cs
      JOIN drivers dr ON cs.person_id = dr.driver_id
      WHERE dr.region_id = $1
    `;
    const driversRes = await db.query(driversQ, [regionId]);
    const driversCounts = driversRes.rows[0] || { on_duty: 0, on_break: 0 };

    const conductorsQ = `
      SELECT
        SUM(CASE WHEN cs.status ILIKE '%on duty%' OR cs.status ILIKE 'onduty' OR cs.status ILIKE 'on_duty' THEN 1 ELSE 0 END) AS on_duty,
        SUM(CASE WHEN cs.status ILIKE '%break%' OR cs.status ILIKE '%on break%' THEN 1 ELSE 0 END) AS on_break
      FROM crew_status cs
      JOIN conductors c ON cs.person_id = c.conductor_id
      WHERE c.region_id = $1
    `;
    const conductorsRes = await db.query(conductorsQ, [regionId]);
    const conductorsCounts = conductorsRes.rows[0] || { on_duty: 0, on_break: 0 };

    const crewCounts = {
      drivers_on_duty: Number(driversCounts.on_duty || 0),
      drivers_on_break: Number(driversCounts.on_break || 0),
      conductors_on_duty: Number(conductorsCounts.on_duty || 0),
      conductors_on_break: Number(conductorsCounts.on_break || 0)
    };

    // Recent incidents / emergency reports.
    // Map to depot via driver -> depot or bus -> depot
    const incidentsQ = `
      SELECT er.id,
             COALESCE(d1.depot_name, d2.depot_name, 'Unknown') AS depot_name,
             er.incident_type AS type,
             er.status AS severity,
             er.created_at
      FROM emergency_reports er
      LEFT JOIN drivers dr ON er.driver_id = dr.driver_id
      LEFT JOIN depots d1 ON dr.depot_id = d1.depot_id
      LEFT JOIN buses b ON er.bus_id = b.bus_id
      LEFT JOIN depots d2 ON b.depot_id = d2.depot_id
      WHERE (d1.region_id = $1 OR d2.region_id = $1)
      ORDER BY er.created_at DESC
      LIMIT 6
    `;
    const incidentsRows = (await db.query(incidentsQ, [regionId])).rows;
    const incidents = incidentsRows.map(r => ({
      id: r.id,
      depot: r.depot_name || 'Unknown',
      type: r.type || 'Incident',
      severity: r.severity || 'Unknown',
      time: formatTimeIso(r.created_at)
    }));

    // Depot performance: count buses and crews on duty per depot
    const depotsQ = `
      SELECT d.depot_id,
             d.depot_name AS depot,
             COALESCE(bc.buses, 0) AS buses,
             COALESCE(dr_counts.on_duty,0) + COALESCE(cond_counts.on_duty,0) AS crews_on_duty
      FROM depots d
      LEFT JOIN (
        SELECT depot_id, COUNT(*) AS buses
        FROM buses
        GROUP BY depot_id
      ) bc ON bc.depot_id = d.depot_id
      LEFT JOIN (
        SELECT dr.depot_id, COUNT(*) AS on_duty
        FROM crew_status cs
        JOIN drivers dr ON cs.person_id = dr.driver_id
        WHERE (cs.status ILIKE '%on duty%' OR cs.status ILIKE 'onduty' OR cs.status ILIKE 'on_duty')
        GROUP BY dr.depot_id
      ) dr_counts ON dr_counts.depot_id = d.depot_id
      LEFT JOIN (
        SELECT c.depot_id, COUNT(*) AS on_duty
        FROM crew_status cs
        JOIN conductors c ON cs.person_id = c.conductor_id
        WHERE (cs.status ILIKE '%on duty%' OR cs.status ILIKE 'onduty' OR cs.status ILIKE 'on_duty')
        GROUP BY c.depot_id
      ) cond_counts ON cond_counts.depot_id = d.depot_id
      WHERE d.region_id = $1
      ORDER BY d.depot_name
    `;
    const depotsRows = (await db.query(depotsQ, [regionId])).rows;
    const depotsPerformance = depotsRows.map(r => ({
      depot_id: r.depot_id,
      depot: r.depot,
      buses: Number(r.buses || 0),
      crews: Number(r.crews_on_duty || 0),
      status: 'good'
    }));

    // Count total depots in the region
    const countQ = `SELECT COUNT(*)::int AS total FROM depots WHERE region_id = $1`;
    const countRes = (await db.query(countQ, [regionId])).rows[0];
    const depotsCount = Number(countRes?.total || 0);

    return res.json({
      success: true,
      data: {
        fleetStats,
        crewCounts,
        incidents,
        depotsPerformance,
        depotsCount
      }
    });
  } catch (err) {
    console.error('regional operations dashboard error', err && err.stack ? err.stack : err);
    return res.status(500).json({ success: false, error: 'Failed to fetch regional overview' });
  }
};