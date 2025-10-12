const CrewModel = require('../models/CrewModel');

// GET /api/crew?depot_id=1&region_id=2
const getCrew = async (req, res) => {
  const { depot_id, region_id } = req.query;
  if (!depot_id || !region_id) {
    return res.status(400).json({ error: 'depot_id and region_id required' });
  }
  try {
    const crew = await CrewModel.getCrewByDepotRegion(depot_id, region_id);
    res.json(crew);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/crew/status
const updateCrewStatus = async (req, res) => {
  const { person_id, role, status } = req.body;
  if (!person_id || !role || !status) {
    return res.status(400).json({ error: 'person_id, role, and status required' });
  }
  if (!['On Duty', 'On Break'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const updated = await CrewModel.upsertCrewStatus({ person_id, role, status });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getCrew, updateCrewStatus };