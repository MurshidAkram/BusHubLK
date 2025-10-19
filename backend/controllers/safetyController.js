// controllers/safetyController.js
const SafetyModel = require('../models/safetyModel');

const getSafetySummary = async (req, res) => {
  try {
    const data = await SafetyModel.getSafetySummary();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching safety summary:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getIncidentTrend = async (req, res) => {
  try {
    const data = await SafetyModel.getIncidentTrend();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching incident trend:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getIncidentsByRegion = async (req, res) => {
  try {
    const data = await SafetyModel.getIncidentsByRegion();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching incidents by region:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getRecentIncidents = async (req, res) => {
  try {
    const data = await SafetyModel.getRecentIncidents();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching recent incidents:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getSafetySummary,
  getIncidentTrend,
  getIncidentsByRegion,
  getRecentIncidents,
};
