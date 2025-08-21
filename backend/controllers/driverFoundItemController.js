const db = require('../config/db');
const LostFoundReport = require('../models/LostFoundReport');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/lost-found');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const { v4: uuidv4 } = require('uuid');

// Upload middleware
const uploadMiddleware = upload.single('photo');

// Submit a found item report from driver
const submitFoundItem = async (req, res) => {
  try {
    console.log('🚀 Driver found item submission...');
    
    const {
      driver_id,
      item_category,
      item_description,
      location_found,
      route_number,
      bus_number,
      incident_date,
      incident_time,
      driver_name,
      driver_phone,
      driver_email
    } = req.body;

    console.log('📋 Received found item data:', req.body);
    console.log('📎 File upload present:', !!req.file);

    // Validate required fields
    const errors = [];
    if (!driver_id) errors.push('driver_id is required');
    if (!item_category) errors.push('item_category is required');
    if (!item_description) errors.push('item_description is required');
    if (!location_found) errors.push('location_found is required');
    if (!route_number) errors.push('route_number is required');
    if (!bus_number) errors.push('bus_number is required');
    if (!incident_date || !/^\d{4}-\d{2}-\d{2}$/.test(incident_date)) errors.push('incident_date is required in YYYY-MM-DD format');
    if (!incident_time || !/^\d{2}:\d{2}:\d{2}$/.test(incident_time)) errors.push('incident_time is required in HH:MM:SS format');
    if (!driver_name) errors.push('driver_name is required');
    if (!driver_phone) errors.push('driver_phone is required');
    if (driver_email && !/^\S+@\S+\.\S+$/.test(driver_email)) errors.push('driver_email is invalid');

    if (errors.length > 0) {
      console.log('❌ Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
        received: req.body
      });
    }

    // Handle file upload
    let item_photo_url = null;
    if (req.file) {
      item_photo_url = `/uploads/lost-found/${req.file.filename}`;
      console.log('📷 Photo uploaded:', item_photo_url);
    }

    // Generate a unique reference
    const report_reference = uuidv4();
    console.log('🔗 Generated reference:', report_reference);

    // Create approximate location combining bus info and location
    const approximate_location = `${location_found} - Bus ${bus_number}`;
    
    // Enhance the description to include driver identification
    const enhanced_description = `${item_description} [Driver Report by ${driver_name}]`;

    // Prepare report data for the existing lost_found_reports table
    const reportData = {
      passenger_id: null, // No passenger for driver reports
      driver_id: parseInt(driver_id), // Use the actual driver_id column
      report_type: 'found',
      report_reference,
      item_category,
      item_description: enhanced_description,
      item_photo_url,
      route_number,
      region_id: null, // No region for driver reports
      approximate_location,
      incident_date,
      incident_time,
      contact_email: driver_email || null,
      contact_phone: driver_phone, // Use normal phone number
      reward_offered: 0
    };

    // Add driver info to the description
    reportData.item_description = `${item_description}\n\n[Driver Report - Driver: ${driver_name}, Bus: ${bus_number}, Location: ${location_found}]`;

    console.log('📝 Creating report with data:', reportData);

    // Create the report using the existing model
    const newReport = await LostFoundReport.create(reportData);
    console.log('✅ Found item report created successfully:', newReport.report_id);

    res.status(201).json({
      success: true,
      message: 'Found item report submitted successfully',
      data: {
        report_id: newReport.report_id,
        report_reference: newReport.report_reference
      }
    });

  } catch (error) {
    console.error('❌ Error in submitFoundItem:', error);
    
    // Specific error handling
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again later.',
        error: 'Service temporarily unavailable'
      });
    }

    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'A similar found item report already exists',
        error: 'Duplicate entry'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit found item report',
      error: error.message
    });
  }
};

// Get all found items reported by drivers
const getFoundItems = async (req, res) => {
  try {
    const { status, item_category, search, driver_id } = req.query;
    
    const filters = { report_type: 'found' };
    if (status) filters.status = status;
    if (item_category) filters.item_category = item_category;
    if (search) filters.search = search;

    console.log('🔍 Getting driver found items with filters:', filters);

    const foundItems = await LostFoundReport.findAll(filters);

    // Filter to only show driver-submitted reports using the driver_id column
    let driverReports = foundItems.filter(item => 
      item.driver_id !== null && item.driver_id !== undefined
    );

    // If specific driver_id is requested, filter by that driver
    if (driver_id) {
      driverReports = driverReports.filter(item => 
        item.driver_id === parseInt(driver_id)
      );
    }

    // Add time_ago field for each report
    const reportsWithTimeAgo = driverReports.map(report => ({
      ...report,
      time_ago: calculateTimeAgo(report.created_at),
      // Map fields for frontend compatibility
      location_found: report.approximate_location,
      bus_number: extractBusNumberFromDescription(report.item_description),
      driver_name: extractDriverNameFromDescription(report.item_description),
      driver_phone: report.contact_phone, // No prefix to remove anymore
      driver_email: report.contact_email
    }));

    res.json({
      success: true,
      data: reportsWithTimeAgo,
      count: reportsWithTimeAgo.length
    });

  } catch (error) {
    console.error('❌ Error getting found items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve found items',
      error: error.message
    });
  }
};

// Helper function to calculate time ago
function calculateTimeAgo(timestamp) {
  const now = new Date();
  const createdAt = new Date(timestamp);
  const diffMs = now - createdAt;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

// Helper function to extract bus number from description
function extractBusNumberFromDescription(description) {
  const match = description.match(/Bus (\w+)/);
  return match ? match[1] : '';
}

// Helper function to extract driver name from description
function extractDriverNameFromDescription(description) {
  const match = description.match(/\[Driver Report by (.+?)\]/);
  return match ? match[1] : 'Unknown Driver';
}

// Get found item by ID
const getFoundItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const foundItem = await LostFoundReport.findById(id);
    
    if (!foundItem) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found'
      });
    }

    res.json({
      success: true,
      data: foundItem
    });

  } catch (error) {
    console.error('❌ Error getting found item by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve found item',
      error: error.message
    });
  }
};

// Update found item status (claimed/unclaimed)
const updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "active" or "resolved"'
      });
    }

    // Use the existing model's method to update status
    const query = `
      UPDATE lost_found_reports 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE report_id = $2 
      RETURNING *
    `;

    const result = await db.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating item status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item status',
      error: error.message
    });
  }
};

module.exports = {
  uploadMiddleware,
  submitFoundItem,
  getFoundItems,
  getFoundItemById,
  updateItemStatus
};
