// File: /controllers/complaintController.js

const Complaint = require('../models/Complaint');

// Create a new complaint
exports.createComplaint = (req, res) => {
  const userId = req.user ? req.user.userId : null;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  // --- MODIFIED PART ---
  // We now create the complaintData object with keys that match the database columns (snake_case).
  // This makes the mapping to the database model direct and clear.
  const complaintData = {
    user_id: userId,
    complaint_type: req.body.complaintType, // from 'complaintType'
    route_number: req.body.routeNumber,     // from 'routeNumber'
    bus_number: req.body.busNumber,
    incident_date: req.body.date,           // from 'date'
    incident_time: req.body.time,           // from 'time'
    location: req.body.location,
    priority: req.body.priority,
    description: req.body.description,
    image_url: req.file ? `/uploads/${req.file.filename}` : null, // from 'image'
    contact_info: req.body.contactInfo      // from 'contactInfo'
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

  Complaint.getByUserId(userId, (err, complaints) => {
    if (err) {
      console.error('Error fetching complaints:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch complaints',
        error: err.message 
      });
    }
    
    res.status(200).json({
      success: true,
      complaints: complaints
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
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully.'
    });
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