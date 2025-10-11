const Inspection = require('../models/inspectionModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
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

    // Create notifications for both depot engineers and depot managers in the assigned depot
    try {
      // Get depot engineers for this depot
      const depotEngineers = await User.getDepotEngineersByDepot(depot_id);

      // Get depot managers for this depot  
      const depotManagers = await User.getDepotManagersByDepot(depot_id);

      // Combine both lists
      const recipients = [...depotEngineers, ...depotManagers];

      // Create notifications for each recipient
      for (const recipient of recipients) {
        await Notification.create({
          user_id: recipient.user_id,
          title: 'New Inspection Assigned',
          message: `A new ${inspection_type} inspection has been scheduled for ${new Date(date).toLocaleDateString()} at ${time}. Please ensure all necessary preparations are completed.`,
          type: 'inspection',
          inspection_id: inspection.id,
          assigned_by: `${req.user.first_name} ${req.user.last_name}` || 'Regional Technical Officer'
        });
      }

      console.log(`✅ Sent inspection notifications to ${recipients.length} recipients (${depotEngineers.length} engineers, ${depotManagers.length} managers) for inspection ${inspection.id}`);
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Don't fail the inspection creation if notification fails
    }

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

    // Send notifications to depot engineers and depot managers
    try {
      // Get depot engineers for this depot
      const depotEngineers = await User.getDepotEngineersByDepot(depot_id);

      // Get depot managers for this depot  
      const depotManagers = await User.getDepotManagersByDepot(depot_id);

      // Combine both lists
      const recipients = [...depotEngineers, ...depotManagers];

      // Create notifications for each recipient
      for (const recipient of recipients) {
        await Notification.create({
          user_id: recipient.user_id,
          title: 'Inspection Updated',
          message: `The ${inspection_type} inspection scheduled for ${new Date(date).toLocaleDateString()} has been updated by Regional Technical Officer.`,
          type: 'info',
          inspection_id: inspection.id,
          assigned_by: `${req.user.first_name} ${req.user.last_name}` || 'Regional Technical Officer'
        });
      }

      console.log(`✅ Sent update notifications to ${recipients.length} recipients for inspection ${id}`);
    } catch (notificationError) {
      console.error('Error creating update notifications:', notificationError);
      // Don't fail the inspection update if notification fails
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

    // Get inspection details before deleting for notification
    const inspectionDetails = await Inspection.getInspectionById(id, user_id);

    if (!inspectionDetails) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    const inspection = await Inspection.deleteInspection(id, user_id);

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found or access denied' });
    }

    // Send notifications to depot engineers and depot managers
    try {
      const depot_id = inspectionDetails.depot_id;

      // Get depot engineers for this depot
      const depotEngineers = await User.getDepotEngineersByDepot(depot_id);

      // Get depot managers for this depot  
      const depotManagers = await User.getDepotManagersByDepot(depot_id);

      // Combine both lists
      const recipients = [...depotEngineers, ...depotManagers];

      // Create notifications for each recipient
      for (const recipient of recipients) {
        await Notification.create({
          user_id: recipient.user_id,
          title: 'Inspection Cancelled',
          message: `The ${inspectionDetails.inspection_type} inspection scheduled for ${new Date(inspectionDetails.date).toLocaleDateString()} has been cancelled by Regional Technical Officer.`,
          type: 'warning',
          inspection_id: null, // No longer linked since inspection is deleted
          assigned_by: `${req.user.first_name} ${req.user.last_name}` || 'Regional Technical Officer'
        });
      }

      console.log(`✅ Sent cancellation notifications to ${recipients.length} recipients for deleted inspection ${id}`);
    } catch (notificationError) {
      console.error('Error creating cancellation notifications:', notificationError);
      // Don't fail the inspection deletion if notification fails
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

// Get inspection count by status for the logged-in regional technical officer
const getInspectionCountByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const user_id = req.user.userId;

    const count = await Inspection.getInspectionCountByStatus(user_id, status);

    res.json({
      success: true,
      status,
      count
    });
  } catch (err) {
    console.error('Get inspection count by status error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
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

// Get inspections assigned to depot engineer's depot
const getInspectionsForDepotEngineer = async (req, res) => {
  try {
    // Get depot engineer details to find their depot_id
    const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

    if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
      return res.status(404).json({
        success: false,
        message: 'Depot engineer details or depot ID not found for this user'
      });
    }

    const depot_id = depotEngineerDetails.depot_id;
    const inspections = await Inspection.getInspectionsByDepot(depot_id);

    res.json({
      success: true,
      message: 'Inspections retrieved successfully',
      inspections,
      depot_id
    });
  } catch (err) {
    console.error('Get inspections for depot engineer error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: err.message
    });
  }
};

// Get inspections for depot manager - same as depot engineer but for manager role
const getInspectionsForDepotManager = async (req, res) => {
  try {
    // Get depot manager details to find their depot_id
    const depotManagerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

    if (!depotManagerDetails || !depotManagerDetails.depot_id) {
      return res.status(404).json({
        success: false,
        message: 'Depot manager details or depot ID not found for this user'
      });
    }

    const depot_id = depotManagerDetails.depot_id;
    const inspections = await Inspection.getInspectionsByDepot(depot_id);

    res.json({
      success: true,
      message: 'Inspections retrieved successfully',
      inspections,
      depot_id
    });
  } catch (err) {
    console.error('Get inspections for depot manager error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: err.message
    });
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
  getInspectionById,
  getInspectionsForDepotEngineer,
  getInspectionsForDepotManager,
  getInspectionCountByStatus
};