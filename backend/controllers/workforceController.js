// backend/controllers/workforceController.js
const WorkforceModel = require('../models/workforceModel');

const getWorkforceSummary = async (req, res) => {
  try {
    const summary = await WorkforceModel.getSummaryStats();
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error('Workforce summary error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getHeadcountByRegion = async (req, res) => {
  try {
    const data = await WorkforceModel.getHeadcountByRegion();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Headcount by region error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getHeadcountByDepot = async (req, res) => {
  try {
    const data = await WorkforceModel.getHeadcountByDepot();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Headcount by depot error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getNewEmployeesByMonth = async (req, res) => {
  try {
    const data = await WorkforceModel.getNewEmployeesByMonth();
    res.json({ success: true, data });
  } catch (err) {
    console.error('New employees by month error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ADD THIS NEW FUNCTION
const getRoleDistribution = async (req, res) => {
  try {
    console.log('📊 Fetching role distribution...');
    const data = await WorkforceModel.getRoleDistribution();
    console.log('✅ Role distribution fetched:', data.length, 'roles');
    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ Role distribution error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getWorkforceSummary,
  getHeadcountByRegion,
  getHeadcountByDepot,
  getNewEmployeesByMonth,
  getRoleDistribution  // ADD THIS
};