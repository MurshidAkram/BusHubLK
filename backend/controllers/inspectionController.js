const Inspection = require('../models/inspectionModel');
const { validationResult } = require('express-validator');

// Create a new inspection
const createInspection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { inspection_type, date, time, depot_id } = req.body;
    const user_id = req.user.userId;

    // Verify that the user is a regional technical officer and has access to this depot
    const userDepots = await Inspection.getDepotsByRegionForUser(user_id);
    const hasAccess = userDepots.some(depot => depot.depot_id === parseInt(depot_id));
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied. You can only schedule inspections for depots in your region.' });
    }

    const inspection = await Inspection.createInspection(inspection_type, date, time, user_id, depot_id);
    
    res.status(201).json({
      message: 'Inspection scheduled successfully',
      inspection
    });
  } catch (err) {
    console.error('Create inspection error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all inspections for the logged-in user
const getInspections = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const inspections = await Inspection.getInspectionsByUser(user_id);
    
    res.json({
      message: 'Inspections retrieved successfully',
      inspections
    });
  } catch (err) {
    console.error('Get inspections error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get upcoming inspections
const getUpcomingInspections = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const inspections = await Inspection.getUpcomingInspections(user_id);
    
    res.json({
      message: 'Upcoming inspections retrieved successfully',
      inspections
    });
  } catch (err) {
    console.error('Get upcoming inspections error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get past inspections (last month)
const getPastInspections = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const inspections = await Inspection.getPastInspections(user_id);
    
    res.json({
      message: 'Past inspections retrieved successfully',
      inspections
    });
  } catch (err) {
    console.error('Get past inspections error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mark inspection as completed
const markAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.userId;

    const inspection = await Inspection.updateInspectionStatus(id, 'Completed', user_id);
    
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found or access denied' });
    }

    res.json({
      message: 'Inspection marked as completed',
      inspection
    });
  } catch (err) {
    console.error('Mark as completed error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update inspection
const updateInspection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { inspection_type, date, time, depot_id } = req.body;
    const user_id = req.user.userId;

    // Verify that the user has access to this depot
    const userDepots = await Inspection.getDepotsByRegionForUser(user_id);
    const hasAccess = userDepots.some(depot => depot.depot_id === parseInt(depot_id));
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied. You can only schedule inspections for depots in your region.' });
    }

    const inspection = await Inspection.updateInspection(id, inspection_type, date, time, depot_id, user_id);
    
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found or access denied' });
    }

    res.json({
      message: 'Inspection updated successfully',
      inspection
    });
  } catch (err) {
    console.error('Update inspection error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete inspection
const deleteInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.userId;

    const inspection = await Inspection.deleteInspection(id, user_id);
    
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found or access denied' });
    }

    res.json({
      message: 'Inspection deleted successfully',
      inspection
    });
  } catch (err) {
    console.error('Delete inspection error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get depots for the regional technical officer
const getUserDepots = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const depots = await Inspection.getDepotsByRegionForUser(user_id);
    
    res.json({
      message: 'Depots retrieved successfully',
      depots
    });
  } catch (err) {
    console.error('Get user depots error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get inspection by ID
const getInspectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.userId;

    const inspection = await Inspection.getInspectionById(id, user_id);
    
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found or access denied' });
    }

    res.json({
      message: 'Inspection retrieved successfully',
      inspection
    });
  } catch (err) {
    console.error('Get inspection by ID error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createInspection,
  getInspections,
  getUpcomingInspections,
  getPastInspections,
  markAsCompleted,
  updateInspection,
  deleteInspection,
  getUserDepots,
  getInspectionById
};
