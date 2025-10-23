// backend/controllers/safetyController.js
const SafetyModel = require('../models/safetyModel');

// Get summary statistics
const getSafetySummary = async (req, res) => {
  try {
    const data = await SafetyModel.getSafetySummary();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching safety summary:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch safety summary' 
    });
  }
};

// Get incident trend
const getIncidentTrend = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const data = await SafetyModel.getIncidentTrend(months);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching incident trend:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch incident trend' 
    });
  }
};

// Get incidents by region
const getIncidentsByRegion = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const data = await SafetyModel.getIncidentsByRegion(months);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching incidents by region:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch incidents by region' 
    });
  }
};

// Get incidents by depot (top performing/worst)
const getIncidentsByDepot = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await SafetyModel.getIncidentsByDepot(limit);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching incidents by depot:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch incidents by depot' 
    });
  }
};

// Get recent incidents
const getRecentIncidents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 15;
    const data = await SafetyModel.getRecentIncidents(limit);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching recent incidents:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch recent incidents' 
    });
  }
};

// Get incident severity breakdown
const getIncidentSeverity = async (req, res) => {
  try {
    const data = await SafetyModel.getIncidentSeverity();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching incident severity:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch incident severity' 
    });
  }
};

// Combined overview endpoint (single API call for all data)
const getIncidentsOverview = async (req, res) => {
  try {
    const data = await SafetyModel.getIncidentsOverview();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching incidents overview:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch incidents overview' 
    });
  }
};

// Get detailed incident by ID
const getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Incident ID is required' 
      });
    }
    
    const data = await SafetyModel.getIncidentById(id);
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Incident not found' 
      });
    }
    
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching incident details:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch incident details' 
    });
  }
};

// Update incident status (for resolving/investigating)
const updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!id || !status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Incident ID and status are required' 
      });
    }

    const validStatuses = ['pending', 'under_investigation', 'resolved', 'closed'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    const data = await SafetyModel.updateIncidentStatus(id, status, notes);
    res.json({ success: true, data, message: 'Incident status updated successfully' });
  } catch (err) {
    console.error('Error updating incident status:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to update incident status' 
    });
  }
};

// Get incident statistics for a specific time period
const getIncidentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await SafetyModel.getIncidentStats(startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching incident statistics:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch incident statistics' 
    });
  }
};

module.exports = {
  getSafetySummary,
  getIncidentTrend,
  getIncidentsByRegion,
  getIncidentsByDepot,
  getRecentIncidents,
  getIncidentSeverity,
  getIncidentsOverview,
  getIncidentById,
  updateIncidentStatus,
  getIncidentStats
};