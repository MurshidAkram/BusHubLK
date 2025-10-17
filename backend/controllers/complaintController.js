// File: /controllers/complaintController.js

const Complaint = require('../models/Complaint');
const BusRoute = require('../models/busRouteModel');
const User = require('../models/userModel');
const passengerNotificationService = require('../services/passengerNotificationService');

// Create a new complaint
exports.createComplaint = (req, res) => {
  const userId = req.user ? req.user.userId : null;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  // --- MODIFIED PART ---
  // We now create the complaintData object with keys that match the database columns (snake_case).
  // This makes the mapping to the database model direct and clear.
  const normalizedLocation = typeof req.body.location === 'string' && req.body.location.trim()
    ? req.body.location.trim()
    : 'Not provided';

  const normalizedContactInfo = typeof req.body.contactInfo === 'string' && req.body.contactInfo.trim()
    ? req.body.contactInfo.trim()
    : 'Not provided';

  const complaintData = {
    user_id: userId,
    complaint_type: req.body.complaintType, // from 'complaintType'
    route_number: req.body.routeNumber,     // from 'routeNumber'
    bus_number: req.body.busNumber,
    incident_date: req.body.date,           // from 'date'
    incident_time: req.body.time,           // from 'time'
    location: normalizedLocation,
    priority: req.body.priority,
    description: req.body.description,
    image_url: req.file ? `/uploads/${req.file.filename}` : null, // from 'image'
    contact_info: normalizedContactInfo      // from 'contactInfo'
  };
  // --- END MODIFIED PART ---

  Complaint.create(complaintData, (err, complaintId) => {
    if (err) {
      console.error('Error creating complaint:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to submit complaint',
        error: err.message 
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaintId: complaintId
    });
  });
};

// Get all complaints for the authenticated user
exports.getUserComplaints = (req, res) => {
  const userId = req.user ? req.user.userId : null;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  const limitParam = parseInt(req.query.limit, 10);
  const offsetParam = parseInt(req.query.offset, 10);
  const safeLimit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : null;
  const safeOffset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

  Complaint.getByUserId(userId, { limit: safeLimit, offset: safeOffset }, (err, complaints) => {
    if (err) {
      console.error('Error fetching complaints:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch complaints',
        error: err.message 
      });
    }

    const safeComplaints = Array.isArray(complaints) ? complaints : [];

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.status(200).json({
      success: true,
      count: safeComplaints.length,
      complaints: safeComplaints,
      limit: safeLimit,
      offset: safeOffset
    });
  });
};

// --- Other functions remain the same ---

// Get all complaints (admin only)
exports.getAllComplaints = (req, res) => {
  Complaint.getAll((err, complaints) => {
    if (err) {
      console.error('Error fetching all complaints:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch complaints.',
        error: err.message 
      });
    }
    
    res.status(200).json({
      success: true,
      complaints: complaints
    });
  });
};

// Get complaint by ID
exports.getComplaintById = (req, res) => {
  const { id } = req.params;
  
  Complaint.getById(id, (err, complaint) => {
    if (err) {
      console.error('Error fetching complaint by ID:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch complaint.',
        error: err.message 
      });
    }
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }
    
    res.status(200).json({
      success: true,
      complaint: complaint
    });
  });
};

// Update complaint status
exports.updateComplaintStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  Complaint.updateStatus(id, status, (err, result) => {
    if (err) {
      console.error('Error updating complaint status:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update complaint status.',
        error: err.message 
      });
    }
    
    if (!result || result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }
    
    const updatedComplaint = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully.',
      complaint: updatedComplaint
    });

    (async () => {
      try {
        await passengerNotificationService.createNotification({
          passenger_id: updatedComplaint.user_id,
          title: 'Complaint status updated',
          body: `Your complaint #${updatedComplaint.id} status is now "${status}"`,
          category: 'complaint',
          related_entity_type: 'complaint',
          related_entity_id: updatedComplaint.id,
          metadata: {
            complaintId: updatedComplaint.id,
            newStatus: status,
            routeNumber: updatedComplaint.route_number || null
          }
        });

        console.log('📢 Passenger notification created for complaint status change');
      } catch (notifyErr) {
        console.error('Failed to create passenger notification for complaint:', notifyErr);
      }
    })();
  });
};

// Delete complaint
exports.deleteComplaint = (req, res) => {
  const { id } = req.params;
  
  Complaint.delete(id, (err, result) => {
    if (err) {
      console.error('Error deleting complaint:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete complaint.',
        error: err.message 
      });
    }
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully.'
    });
  });
};

/**
 * @desc Search bus/route assignments for complaint auto-complete fields
 * @route GET /api/complaints/bus-routes?query=
 */
exports.searchBusRoutes = async (req, res) => {
  try {
    const { query = '', type = 'all' } = req.query;
    if (!query.trim()) {
      return res.status(200).json({ success: true, data: [] });
    }

    let matches;
    if (type === 'route') {
      // Search only routes
      matches = await BusRoute.searchRoutes(query.trim());
    } else if (type === 'bus') {
      // Search only buses
      matches = await BusRoute.searchBuses(query.trim());
    } else {
      // Default: search both (backward compatibility)
      matches = await BusRoute.search(query.trim());
    }

    res.status(200).json({ success: true, data: matches });
  } catch (error) {
    console.error('Error searching bus routes:', error);
    res.status(500).json({ success: false, message: 'Failed to search bus routes', error: error.message });
  }
};

/**
 * @desc Get the authenticated passenger contact info (email/phone)
 * @route GET /api/complaints/my-contact
 */
exports.getMyContactInfo = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        email: user.email || null,
        phone: user.phone || null,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
      },
    });
  } catch (error) {
    console.error('Error fetching complaint contact info:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contact info', error: error.message });
  }
};