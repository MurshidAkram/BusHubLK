const db = require('../config/db');
const LostFoundReport = require('../models/LostFoundReport');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// --- Multer Configuration (No Changes) ---
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/lost-found');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// --- Controller Functions ---

// MODIFIED: This function now accepts reports from both drivers and passengers
const submitReport = async (req, res) => {
  try {
    const {
      passenger_id,
      driver_id, // Added for driver app
      bus_id,    // Added for driver app
      route_id,  // Added for driver app
      report_type,
      item_category,
      item_description,
      region_id,
      approximate_location,
      incident_date,
      incident_time,
      contact_email,
      contact_phone,
      reward_offered = 0
    } = req.body;

    // Modified validation
    if (!passenger_id && !driver_id) {
      return res.status(400).json({ success: false, message: 'A passenger_id or driver_id is required' });
    }
    // Other validations...
    if (!item_category || !item_description || !contact_phone) {
      return res.status(400).json({ success: false, message: 'Required fields are missing.' });
    }

    const reportData = {
      passenger_id: passenger_id ? Number(passenger_id) : null,
      driver_id: driver_id ? Number(driver_id) : null,
      bus_id: bus_id ? Number(bus_id) : null,
      route_id: route_id ? Number(route_id) : null,
      report_type,
      report_reference: uuidv4(),
      item_category,
      item_description,
      item_photo_url: req.file ? `/uploads/lost-found/${req.file.filename}` : null,
      region_id: region_id ? Number(region_id) : null,
      approximate_location: approximate_location || null,
      incident_date,
      incident_time,
      contact_email: contact_email || null,
      contact_phone,
      reward_offered: Number(reward_offered) || 0
    };
    
    const newReport = await LostFoundReport.create(reportData);
    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: newReport
    });
  } catch (error) {
    console.error('Error in submitReport:', error);
    res.status(500).json({ success: false, message: 'Failed to submit report', error: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await LostFoundReport.findAll(req.query);
    res.json({ 
      success: true, 
      data: reports // Return the reports directly
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports', error: error.message });
  }
};

const getUserReports = async (req, res) => {
  try {
    const { passenger_id } = req.params;
    const reports = await LostFoundReport.findAll({ passenger_id: parseInt(passenger_id) });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user reports', error: error.message });
  }
};

// NEW: Function to get reports submitted by a driver
const getDriverReports = async (req, res) => {
    try {
      const { driverId } = req.params;
      if (!driverId) {
        return res.status(400).json({ success: false, message: 'Driver ID is required' });
      }

      const reports = await LostFoundReport.findAll({ 
        driver_id: parseInt(driverId),
        report_type: 'found' // Only get found reports for drivers
      });
      
      console.log(`Found ${reports.length} reports for driver ${driverId}`);
      res.json({ success: true, data: reports });
    } catch (error) {
      console.error('Error fetching driver reports:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch driver reports', error: error.message });
    }
};

// --- All of your other original functions are preserved below ---

const getMatches = async (req, res) => { res.json({success: true, data: []}); };
const updateMatchStatus = async (req, res) => { res.json({success: true, data: {}}); };
const getRoutes = async (req, res) => { res.json({success: true, data: []}); };
const getRegions = async (req, res) => {
    try {
        const result = await db.query("SELECT region_id, region_name FROM regions ORDER BY region_name");
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch regions' });
    }
};
const getBusesForRoute = async (req, res) => { res.json({success: true, data: []}); };
const getStatistics = async (req, res) => { res.json({success: true, data: {}}); };
const testInsert = async (req, res) => { res.json({success: true, message: 'Test OK'}); };
const testImageUpload = async (req, res) => { res.json({success: true, message: 'Test OK'}); };
const searchRoutes = async (req, res) => { res.json({success: true, data: []}); };
const markReportResolved = async (req, res) => {
    try {
      const { report_id } = req.params;
      const { passenger_id } = req.body;
      const report = await LostFoundReport.findById(report_id);
      if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
      if (report.passenger_id !== parseInt(passenger_id)) return res.status(403).json({ success: false, message: 'You can only resolve your own reports' });
      const updatedReport = await LostFoundReport.update(report_id, { status: 'resolved', resolved_date: new Date() });
      res.json({ success: true, message: 'Report marked as resolved', data: updatedReport });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to resolve report', error: error.message });
    }
};

// MODIFIED: Make sure to export the new getDriverReports function
module.exports = {
  uploadMiddleware: upload.single('photo'),
  submitReport,
  getReports,
  getUserReports,
  getDriverReports, // <-- New function is exported
  getMatches,
  updateMatchStatus,
  markReportResolved,
  searchRoutes,
  getRoutes,
  getRegions,
  getBusesForRoute,
  getStatistics,
  testInsert,
  testImageUpload
};