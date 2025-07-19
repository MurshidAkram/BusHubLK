const db = require('../config/db');
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
// Submit a lost or found item report
const submitReport = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      passenger_id,
      report_type,
      item_category,
      item_description,
      route_number,
      region_id,
      incident_date,
      incident_time,
      contact_email,
      contact_phone,
      reward_offered = 0
    } = req.body;

    console.log('Received report data:', req.body); // Debug log

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
    // Optional: validate email format
    if (contact_email && !/^\S+@\S+\.\S+$/.test(contact_email)) errors.push('contact_email is invalid');

    if (errors.length > 0) {
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
    }


    // Generate a unique report_reference
    const report_reference = uuidv4();

    // Insert the report with report_reference
    const insertQuery = `
      INSERT INTO lost_found_reports (
        passenger_id, report_type, item_category, item_description,
        route_number, region_id, incident_date, incident_time,
        contact_email, contact_phone, reward_offered, item_photo_url, report_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING report_id, report_reference
    `;

    const values = [
      Number(passenger_id),
      report_type,
      item_category,
      item_description,
      route_number || null,
      region_id !== undefined && region_id !== null && region_id !== '' ? Number(region_id) : null,
      incident_date,
      incident_time,
      contact_email || null,
      contact_phone,
      reward_offered !== undefined && reward_offered !== null && reward_offered !== '' ? Number(reward_offered) : 0,
      item_photo_url,
      report_reference
    ];

    console.log('Executing query with values:', values); // Debug log

    const result = await client.query(insertQuery, values);
    const newReport = result.rows[0];

    // Try to find potential matches (optional - may not exist yet)
    try {
      const matchQuery = `SELECT * FROM find_potential_matches($1)`;
      const matches = await client.query(matchQuery, [newReport.report_id]);

      // Create match records for high-scoring matches if matches table exists
      for (const match of matches.rows) {
        if (match.match_score >= 50) {
          const matchInsertQuery = `
            INSERT INTO lost_found_matches (
              ${report_type === 'lost' ? 'lost_report_id, found_report_id' : 'found_report_id, lost_report_id'},
              match_score
            ) VALUES ($1, $2, $3)
          `;
          await client.query(matchInsertQuery, [
            newReport.report_id,
            match.potential_match_id,
            match.match_score
          ]);
        }
      }
    } catch (matchError) {
      console.log('Match finding skipped (function may not exist):', matchError.message);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        report_id: newReport.report_id,
        report_reference: newReport.report_reference
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    });
  } finally {
    client.release();
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

    console.log('Get reports query params:', req.query); // Debug log

    const offset = (page - 1) * limit;
    let whereConditions = ['r.status = $1'];
    let queryParams = [status];
    let paramCount = 1;

    // Build dynamic WHERE clause
    if (report_type) {
      paramCount++;
      whereConditions.push(`r.report_type = $${paramCount}`);
      queryParams.push(report_type);
    }

    if (item_category && item_category !== 'all') {
      paramCount++;
      whereConditions.push(`r.item_category = $${paramCount}`);
      queryParams.push(item_category);
    }

    if (route_number) {
      paramCount++;
      whereConditions.push(`r.route_number = $${paramCount}`);
      queryParams.push(route_number);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`r.item_description ILIKE $${paramCount}`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        r.*,
        p.first_name,
        p.last_name,
        rt.route_name,
        reg.region_name,
        CASE 
          WHEN r.created_at > NOW() - INTERVAL '1 hour' THEN 'Just now'
          WHEN r.created_at > NOW() - INTERVAL '1 day' THEN EXTRACT(HOUR FROM NOW() - r.created_at) || ' hours ago'
          ELSE EXTRACT(DAY FROM NOW() - r.created_at) || ' days ago'
        END as time_ago
      FROM lost_found_reports r
      LEFT JOIN passengers pas ON r.passenger_id = pas.passenger_id
      LEFT JOIN users p ON pas.passenger_id = p.user_id
      LEFT JOIN routes rt ON r.route_number = rt.route_number
      LEFT JOIN regions reg ON r.region_id = reg.region_id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    console.log('Executing query:', query); // Debug log
    console.log('With params:', queryParams); // Debug log

    const result = await db.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM lost_found_reports r
      WHERE ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams.slice(0, -2));

    console.log('Found reports:', result.rows.length); // Debug log

    res.json({
      success: true,
      data: {
        reports: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(countResult.rows[0].total / limit),
          total_items: parseInt(countResult.rows[0].total),
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

    let whereClause = 'r.passenger_id = $1';
    let queryParams = [passenger_id];

    if (status) {
      whereClause += ' AND r.status = $2';
      queryParams.push(status);
    }

    const query = `
      SELECT 
        r.*,
        rt.route_name,
        d.depot_name,
        COUNT(m.match_id) as match_count
      FROM lost_found_reports r
      LEFT JOIN routes rt ON r.route_number = rt.route_number
      LEFT JOIN depots d ON r.depot_id = d.depot_id
      LEFT JOIN lost_found_matches m ON (
        (r.report_type = 'lost' AND m.lost_report_id = r.report_id) OR
        (r.report_type = 'found' AND m.found_report_id = r.report_id)
      )
      WHERE ${whereClause}
      GROUP BY r.report_id, rt.route_name, d.depot_name
      ORDER BY r.created_at DESC
    `;

    const result = await db.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows
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

    const query = `
      SELECT 
        m.*,
        r.report_type,
        r.item_category,
        r.item_description,
        r.incident_date,
        r.route_number,
        r.contact_phone,
        r.item_photo_url,
        p.first_name,
        p.last_name
      FROM lost_found_matches m
      JOIN lost_found_reports r ON (
        CASE 
          WHEN m.lost_report_id = $1 THEN r.report_id = m.found_report_id
          ELSE r.report_id = m.lost_report_id
        END
      )
      LEFT JOIN passengers pas ON r.passenger_id = pas.passenger_id
      LEFT JOIN users p ON pas.passenger_id = p.user_id
      WHERE (m.lost_report_id = $1 OR m.found_report_id = $1)
      AND m.match_status IN ('pending', 'confirmed')
      ORDER BY m.match_score DESC
    `;

    const result = await db.query(query, [report_id]);

    res.json({
      success: true,
      data: result.rows
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
      SELECT region_name
      FROM regions 
      ORDER BY region_name
    `;

    const result = await db.query(query);

    // Return as array of { region_name }
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
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE report_type = 'lost') as total_lost,
        COUNT(*) FILTER (WHERE report_type = 'found') as total_found,
        COUNT(*) FILTER (WHERE status = 'resolved') as total_resolved,
        COUNT(*) FILTER (WHERE status = 'active') as total_active,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as this_week,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as this_month
      FROM lost_found_reports
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows[0]
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

module.exports = {
  uploadMiddleware: upload.single('item_photo'),
  submitReport,
  getReports,
  getUserReports,
  getMatches,
  updateMatchStatus,
  getRoutes,
  getRegions,
  getBusesForRoute,
  getStatistics
};
