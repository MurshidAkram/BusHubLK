const DGMModel = require('../models/dgmoperationsDashboard');

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