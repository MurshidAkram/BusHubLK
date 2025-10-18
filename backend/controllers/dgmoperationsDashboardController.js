const DGMModel = require('../models/dgmoperationsDashboard');
const db = require('../config/db');

exports.getRegionsOverview = async (req, res) => {
  try {
    const regionsRes = await db.query(`
      SELECT
        r.region_id,
        r.region_name,
        COUNT(DISTINCT d.depot_id) AS depot_count,
        COUNT(DISTINCT CASE WHEN rt.is_active = TRUE THEN rt.route_id END) AS route_count
      FROM regions r
      LEFT JOIN depots d ON d.region_id = r.region_id
      LEFT JOIN routes rt ON rt.depot_id = d.depot_id
      GROUP BY r.region_id, r.region_name
      ORDER BY r.region_name
    `);

    const regions = regionsRes.rows.map(row => ({
      region_id: row.region_id,
      region_name: row.region_name,
      depot_count: Number(row.depot_count || 0),
      route_count: Number(row.route_count || 0)
    }));

    return res.json({ success: true, regions });
  } catch (error) {
    console.error('getRegionsOverview error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch regions overview' });
  }
};

exports.getRegionDepots = async (req, res) => {
  const regionId = Number(req.params.region_id);
  if (!regionId) {
    return res.status(400).json({ success: false, error: 'Valid region_id is required' });
  }

  try {
    const regionCheck = await db.query('SELECT region_id FROM regions WHERE region_id = $1 LIMIT 1', [regionId]);
    if (!regionCheck.rows.length) {
      return res.status(404).json({ success: false, error: 'Region not found' });
    }

    const depotsRes = await db.query(`
      SELECT
        d.depot_id,
        d.depot_name,
        d.region_id,
        COUNT(r.route_id) AS route_count
      FROM depots d
      LEFT JOIN routes r ON r.depot_id = d.depot_id AND r.is_active = TRUE
      WHERE d.region_id = $1
      GROUP BY d.depot_id, d.depot_name, d.region_id
      ORDER BY d.depot_name
    `, [regionId]);

    const depots = depotsRes.rows.map(row => ({
      depot_id: row.depot_id,
      depot_name: row.depot_name,
      region_id: row.region_id,
      route_count: Number(row.route_count || 0)
    }));

    return res.json({ success: true, region_id: regionId, depots });
  } catch (error) {
    console.error('getRegionDepots error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch depots for region' });
  }
};

exports.getDepotRoutes = async (req, res) => {
  const depotId = Number(req.params.depot_id);
  if (!depotId) {
    return res.status(400).json({ success: false, error: 'Valid depot_id is required' });
  }

  try {
    const depotCheck = await db.query('SELECT depot_id, region_id FROM depots WHERE depot_id = $1 LIMIT 1', [depotId]);
    if (!depotCheck.rows.length) {
      return res.status(404).json({ success: false, error: 'Depot not found' });
    }

    const routesRes = await db.query(`
      SELECT route_id, route_number, route_name, depot_id
      FROM routes
      WHERE depot_id = $1 AND is_active = TRUE
      ORDER BY route_number
    `, [depotId]);

    return res.json({
      success: true,
      depot_id: depotId,
      region_id: depotCheck.rows[0].region_id,
      routes: routesRes.rows
    });
  } catch (error) {
    console.error('getDepotRoutes error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch routes for depot' });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const depotsLimit = parseInt(req.query.depotsLimit, 10) || 10;
    const depotsOffset = parseInt(req.query.depotsOffset, 10) || 0;
    const regionId = req.query.regionId ? Number(req.query.regionId) : null;
    const incidentsLimit = parseInt(req.query.incidentsLimit, 10) || 10;

    const [fleetStats, crewCounts, depotsPerformance, incidents, depotsCount, regions] = await Promise.all([
      DGMModel.getFleetStats(),
      DGMModel.getCrewCounts(),
      DGMModel.getDepotsPerformance(depotsLimit, depotsOffset, regionId),
      DGMModel.getRecentIncidents(incidentsLimit),
      DGMModel.getTotalDepots(regionId),
      DGMModel.getRegions()
    ]);

    res.json({
      success: true,
      data: {
        fleetStats,
        crewCounts,
        depotsPerformance,
        incidents,
        depotsCount,
        regions
      }
    });
  } catch (err) {
    console.error('DGM overview error:', err);
    res.status(500).json({ success: false, error: 'Failed to load DGM overview' });
  }
};