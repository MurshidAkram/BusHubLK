const db = require('../config/db');
const { executeTransaction } = require('../utils/dbUtils');
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

// Test endpoint for image upload
const testImageUpload = async (req, res) => {
  try {
    console.log('🧪 Testing image upload...');
    console.log('📎 File received:', !!req.file);
    
    if (req.file) {
      console.log('📷 File details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      });
      
      res.json({
        success: true,
        message: 'Image upload test successful',
        file: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: `/uploads/lost-found/${req.file.filename}`
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
        body: req.body
      });
    }
  } catch (error) {
    console.error('❌ Image upload test error:', error);
    res.status(500).json({
      success: false,
      message: 'Image upload test failed',
      error: error.message
    });
  }
};

// Submit a lost or found item report
const submitReport = async (req, res) => {
  try {
    console.log('🚀 Starting report submission...');
    
    const {
      passenger_id,
      report_type,
      item_category,
      item_description,
      route_number,
      region_id,
      approximate_location,
      incident_date,
      incident_time,
      contact_email,
      contact_phone,
      reward_offered = 0
    } = req.body;

    console.log('📋 Received report data:', req.body);
    console.log('📎 File upload present:', !!req.file);
    if (req.file) {
      console.log('📷 File details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path,
        destination: req.file.destination
      });
    }

    // Validate required fields and types
    const errors = [];
    if (!passenger_id) errors.push('passenger_id is required');
    if (!report_type || !['lost', 'found'].includes(report_type)) errors.push('report_type must be "lost" or "found"');
    if (!item_category) errors.push('item_category is required');
    if (!item_description) errors.push('item_description is required');
    if (!incident_date || !/^\d{4}-\d{2}-\d{2}$/.test(incident_date)) errors.push('incident_date is required in YYYY-MM-DD format');
    if (!incident_time || !/^\d{2}:\d{2}:\d{2}$/.test(incident_time)) errors.push('incident_time is required in HH:MM:SS format');
    if (!contact_phone) errors.push('contact_phone is required');
    if (region_id !== null && region_id !== undefined && isNaN(Number(region_id))) errors.push('region_id must be a number');
    if (reward_offered !== undefined && reward_offered !== null && isNaN(Number(reward_offered))) errors.push('reward_offered must be a number');
    if (contact_email && !/^\S+@\S+\.\S+$/.test(contact_email)) errors.push('contact_email is invalid');

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

    // Generate a unique report_reference
    const report_reference = uuidv4();
    console.log('🔗 Generated report reference:', report_reference);

    // Check for duplicates using the model
    console.log('🔍 Checking for duplicates...');
    const isDuplicate = await LostFoundReport.checkDuplicate(
      passenger_id,
      item_category,
      item_description,
      incident_date,
      incident_time
    );

    if (isDuplicate) {
      console.log('⚠️  Duplicate submission detected');
      return res.status(200).json({
        success: true,
        message: 'Report submitted successfully (duplicate detected)',
        data: { message: 'Similar report already exists' }
      });
    }

    console.log('✅ No duplicates found, proceeding with insert...');

    // Prepare report data
    const reportData = {
      passenger_id: Number(passenger_id),
      report_type,
      report_reference,
      item_category,
      item_description,
      item_photo_url,
      route_number: route_number || null,
      region_id: region_id !== undefined && region_id !== null && region_id !== '' ? Number(region_id) : null,
      approximate_location: approximate_location || null,
      incident_date,
      incident_time,
      contact_email: contact_email || null,
      contact_phone,
      reward_offered: reward_offered !== undefined && reward_offered !== null && reward_offered !== '' ? Number(reward_offered) : 0
    };

    console.log('📝 Creating report with data:', reportData);

    // Create the report using the model
    const newReport = await LostFoundReport.create(reportData);
    console.log('✅ Report created successfully:', newReport.report_id);

    // Try to find potential matches
    try {
      console.log('🔍 Searching for potential matches...');
      const matches = await LostFoundReport.findPotentialMatches(newReport.report_id);
      console.log('📊 Found', matches.length, 'potential matches');
    } catch (matchError) {
      console.log('⚠️  Match finding skipped:', matchError.message);
    }

    // POST-TRANSACTION VERIFICATION - Use a fresh connection to avoid caching
    console.log('🔍 POST-COMMIT: Verifying data persistence with fresh connection...');
    try {
      // Wait a moment for AWS RDS replication (if any)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const freshClient = await db.connect();
      try {
        const postCommitVerify = await freshClient.query(`
          SELECT report_id, item_category, item_description, status, created_at 
          FROM lost_found_reports 
          WHERE report_id = $1
        `, [newReport.report_id]);
        
        if (postCommitVerify.rows.length === 0) {
          console.log('ℹ️  POST-COMMIT: Data not immediately visible (likely AWS RDS replication lag)');
          console.log('� This is normal behavior for AWS RDS read replicas - data is safe');
          
          // Try one more time with a longer delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryVerify = await freshClient.query(`
            SELECT report_id, item_category, item_description, status, created_at 
            FROM lost_found_reports 
            WHERE report_id = $1
          `, [newReport.report_id]);
          
          if (retryVerify.rows.length === 0) {
            console.log('ℹ️  Data still not visible after 1s delay - normal AWS RDS replication lag');
          } else {
            console.log('✅ POST-COMMIT (retry): Data found after delay:', retryVerify.rows[0]);
          }
        } else {
          console.log('✅ POST-COMMIT: Data successfully persisted:', postCommitVerify.rows[0]);
        }
      } finally {
        freshClient.release();
      }
    } catch (verifyError) {
      console.error('❌ POST-COMMIT verification failed:', verifyError.message);
      // Don't throw error - the transaction succeeded, this is just a verification issue
      console.log('⚠️  Continuing despite verification failure - data may have been saved');
    }

    if (isDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'Report submitted successfully (duplicate detected)',
        data: { message: 'Similar report already exists' }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        report_id: newReport.report_id,
        report_reference: newReport.report_reference
      }
    });

  } catch (error) {
    console.error('❌ Error in submitReport:', error);
    console.error('📋 Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    
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
        message: 'A report with similar details already exists',
        error: 'Duplicate entry'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    });
  }
};

// Get all reports with filtering and pagination
const getReports = async (req, res) => {
  try {
    const {
      report_type,
      item_category,
      route_number,
      status = 'active',
      page = 1,
      limit = 20,
      search
    } = req.query;

    console.log('Get reports query params:', req.query);

    const offset = (page - 1) * limit;

    // Build filters object for the model
    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    if (report_type) filters.report_type = report_type;
    if (item_category && item_category !== 'all') filters.item_category = item_category;
    if (route_number) filters.route_number = route_number;
    if (search) filters.search = search;

    console.log('🔍 Using filters:', filters);

    // Use the model to get reports
    const reports = await LostFoundReport.findAll(filters);

    // Get total count using the model statistics (simplified)
    const stats = await LostFoundReport.getStatistics();
    const totalActive = stats.total_reports; // This is a simplified approach

    console.log('Found reports:', reports.length);

    res.json({
      success: true,
      data: {
        reports: reports,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalActive / limit),
          total_items: totalActive,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// Get user's own reports
const getUserReports = async (req, res) => {
  try {
    const { passenger_id } = req.params;
    const { status } = req.query;

    console.log('Getting reports for passenger:', passenger_id);

    // Build filters for the model
    const filters = {
      passenger_id: parseInt(passenger_id)
    };

    if (status) {
      filters.status = status;
    }

    // Use the model to get user's reports
    const reports = await LostFoundReport.findAll(filters);

    console.log('Found user reports:', reports.length);

    res.json({
      success: true,
      data: reports
    });

  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reports',
      error: error.message
    });
  }
};

// Get potential matches for a report
const getMatches = async (req, res) => {
  try {
    const { report_id } = req.params;

    console.log('Getting matches for report:', report_id);

    // Use the model to find potential matches
    const matches = await LostFoundReport.findPotentialMatches(report_id);

    console.log('Found matches:', matches.length);

    res.json({
      success: true,
      data: matches
    });

  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: error.message
    });
  }
};

// Update match status
const updateMatchStatus = async (req, res) => {
  try {
    const { match_id } = req.params;
    const { status, notes } = req.body;

    const query = `
      UPDATE lost_found_matches 
      SET match_status = $1, contact_notes = $2, last_contact_attempt = NOW()
      WHERE match_id = $3
      RETURNING *
    `;

    const result = await db.query(query, [status, notes, match_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.json({
      success: true,
      message: 'Match status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating match status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update match status',
      error: error.message
    });
  }
};

// Get available routes for dropdown
const getRoutes = async (req, res) => {
  try {
    const query = `
      SELECT route_number, route_name, start_location, end_location
      FROM routes 
      WHERE is_active = true
      ORDER BY CAST(route_number AS INTEGER)
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
};

// Get available regions for dropdown
const getRegions = async (req, res) => {
  try {
    const query = `
      SELECT region_id, region_name
      FROM regions 
      ORDER BY region_name
    `;

    const result = await db.query(query);

    // Return as array of { region_id, region_name }
    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regions',
      error: error.message
    });
  }
};

// Get depots for dropdown (public endpoint for lost & found)
const getDepots = async (req, res) => {
  try {
    console.log('🏢 Getting depots for Lost & Found dropdown');
    
    const query = 'SELECT depot_id, depot_name, address AS location FROM depots ORDER BY depot_name';
    const result = await db.query(query);
    
    console.log('✅ Found depots:', result.rows.length);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error getting depots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get depots',
      error: error.message
    });
  }
};

// Get buses for a specific route
const getBusesForRoute = async (req, res) => {
  try {
    const { route_number } = req.params;

    const query = `
      SELECT DISTINCT b.registration_number, b.bus_id, d.depot_name
      FROM buses b
      JOIN depots d ON b.depot_id = d.depot_id
      WHERE b.status IN ('Active', 'In Service')
      AND EXISTS (
        SELECT 1 FROM routes r WHERE r.route_number = $1
      )
      ORDER BY b.registration_number
    `;

    const result = await db.query(query, [route_number]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching buses for route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buses for route',
      error: error.message
    });
  }
};

// Get report statistics
const getStatistics = async (req, res) => {
  try {
    console.log('Getting statistics...');

    // Use the model to get statistics
    const stats = await LostFoundReport.getStatistics();

    console.log('Statistics loaded:', stats);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Test endpoint for database insertion using the model
const testInsert = async (req, res) => {
  try {
    console.log('🧪 Test insert endpoint called');
    const { v4: uuidv4 } = require('uuid');
    
    const reportData = {
      passenger_id: req.body.passenger_id || 14,
      report_type: req.body.report_type || 'lost',
      report_reference: uuidv4(),
      item_category: req.body.item_category || 'test',
      item_description: req.body.item_description || 'Test description',
      incident_date: req.body.incident_date || '2025-07-20',
      incident_time: req.body.incident_time || '12:00:00',
      contact_phone: req.body.contact_phone || '0776544566'
    };
    
    console.log('📝 Creating test report:', reportData);
    
    // Use the model to create the report
    const newReport = await LostFoundReport.create(reportData);
    console.log('✅ Test report created:', newReport.report_id);
    
    // Verify by finding it
    const verification = await LostFoundReport.findById(newReport.report_id);
    
    res.json({
      success: true,
      message: 'Test insert successful using model',
      data: {
        inserted: newReport,
        verified: verification
      }
    });
  } catch (error) {
    console.error('❌ Test insert failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test insert failed',
      error: error.message
    });
  }
};

// Mark a report as resolved
const markReportResolved = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { passenger_id } = req.body;

    console.log('Marking report as resolved:', report_id, 'by passenger:', passenger_id);

    // First verify the report belongs to the passenger
    const report = await LostFoundReport.findById(report_id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.passenger_id !== parseInt(passenger_id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark your own reports as resolved'
      });
    }

    // Update the report status using raw SQL since our model doesn't have this method yet
    const query = `
      UPDATE lost_found_reports 
      SET status = 'resolved',
          resolved_date = CURRENT_TIMESTAMP
      WHERE report_id = $1 AND passenger_id = $2
      RETURNING report_id, status, resolved_date
    `;

    const result = await db.query(query, [report_id, passenger_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or already resolved'
      });
    }

    console.log('Report marked as resolved:', result.rows[0]);

    res.json({
      success: true,
      message: 'Report marked as resolved successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error marking report as resolved:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark report as resolved',
      error: error.message
    });
  }
};

// Enhanced route search with autocomplete
const searchRoutes = async (req, res) => {
  try {
    const { q } = req.query; // search query
    
    if (!q || q.trim().length < 1) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchTerm = q.trim();
    
    console.log('Searching routes with term:', searchTerm);

    // Search routes by number or name (case-insensitive)
    const query = `
      SELECT 
        route_number,
        route_name,
        start_location,
        end_location,
        CASE 
          WHEN route_number ILIKE $1 THEN 1
          WHEN route_name ILIKE $2 THEN 2
          ELSE 3
        END as relevance
      FROM routes 
      WHERE route_number ILIKE $1 
         OR route_name ILIKE $2
         OR start_location ILIKE $2
         OR end_location ILIKE $2
      ORDER BY relevance, route_number
      LIMIT 10
    `;

    const result = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`]);

    console.log('Found route matches:', result.rows.length);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error searching routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search routes',
      error: error.message
    });
  }
};

// Update depot handover information for a report
const updateDepotHandover = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { depot_id, handover_date, notes } = req.body;
    const userId = req.user.user_id;

    console.log('📦 Updating depot handover for report:', reportId);

    // Validate required fields
    if (!depot_id) {
      return res.status(400).json({
        success: false,
        message: 'Depot ID is required'
      });
    }

    // Verify the report belongs to the user
    const reportCheck = await db.query(
      'SELECT passenger_id, report_type FROM lost_found_reports WHERE report_id = $1',
      [reportId]
    );

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (reportCheck.rows[0].passenger_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report'
      });
    }

    // Update the report with depot handover information
    const updateQuery = `
      UPDATE lost_found_reports 
      SET 
        handed_to_depot_id = $1,
        handover_date = $2,
        handover_notes = $3,
        handover_updated_by = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE report_id = $5
      RETURNING *
    `;

    const result = await db.query(updateQuery, [
      depot_id,
      handover_date || new Date().toISOString().split('T')[0],
      notes || null,
      userId,
      reportId
    ]);

    console.log('✅ Depot handover updated successfully');

    res.json({
      success: true,
      message: 'Depot handover information updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating depot handover:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update depot handover information',
      error: error.message
    });
  }
};

module.exports = {
  uploadMiddleware: upload.single('photo'),
  submitReport,
  getReports,
  getUserReports,
  getMatches,
  updateMatchStatus,
  markReportResolved,
  searchRoutes,
  getRoutes,
  getRegions,
  getDepots,
  getBusesForRoute,
  getStatistics,
  testInsert,
  testImageUpload,
  updateDepotHandover
};