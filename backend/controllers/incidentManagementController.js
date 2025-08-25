const IncidentReportModel = require('../models/IncidentReportModel');

// Get all reports with filtering and pagination
const getAllReports = async (req, res) => {
  try {
    console.log('📊 Getting all reports with filters:', req.query);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const filters = {
      search: req.query.search || '',
      type: req.query.type || '',
      category: req.query.category || '',
      status: req.query.status || '',
      date: req.query.date || ''
    };

    console.log('🔍 Applied filters:', filters);

    // Get reports with filters
    const reports = await IncidentReportModel.getAllWithFilters(filters, limit, offset);
    
    // Get total count for pagination
    const totalCount = await IncidentReportModel.getCountWithFilters(filters);
    
    const totalPages = Math.ceil(totalCount / limit);

    console.log(`✅ Found ${reports.length} reports (${totalCount} total)`);

    res.json({
      success: true,
      data: reports,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalCount,
        items_per_page: limit
      }
    });
  } catch (error) {
    console.error('❌ Error in getAllReports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// Get a specific report by ID
const getReportById = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    console.log('📋 Getting report by ID:', reportId);

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const report = await IncidentReportModel.getById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    console.log('✅ Report found:', report.report_id);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('❌ Error in getReportById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
};

// Resolve a report
const resolveReport = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { resolved_by, resolution_notes } = req.body;

    console.log('✅ Resolving report:', reportId, 'by:', resolved_by);

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const success = await IncidentReportModel.resolveReport(
      reportId,
      resolved_by || 'System',
      resolution_notes || 'Resolved from depot dashboard'
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or already resolved'
      });
    }

    console.log('✅ Report resolved successfully');

    res.json({
      success: true,
      message: 'Report resolved successfully'
    });
  } catch (error) {
    console.error('❌ Error in resolveReport:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve report',
      error: error.message
    });
  }
};

// Update report status
const updateReportStatus = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { status } = req.body;

    console.log('🔄 Updating report status:', reportId, 'to:', status);

    if (!reportId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Report ID and status are required'
      });
    }

    if (!['Pending', 'Resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Pending" or "Resolved"'
      });
    }

    const success = await IncidentReportModel.updateStatus(reportId, status);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    console.log('✅ Report status updated successfully');

    res.json({
      success: true,
      message: 'Report status updated successfully'
    });
  } catch (error) {
    console.error('❌ Error in updateReportStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: error.message
    });
  }
};

// Get statistics
const getStatistics = async (req, res) => {
  try {
    console.log('📊 Getting statistics with filters:', req.query);
    
    const filters = {
      date: req.query.date || ''
    };

    const stats = await IncidentReportModel.getStatistics(filters);

    console.log('✅ Statistics retrieved:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error in getStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Get available years
const getAvailableYears = async (req, res) => {
  try {
    console.log('📅 Getting available years');
    
    const years = await IncidentReportModel.getAvailableYears();

    console.log('✅ Available years:', years);

    res.json({
      success: true,
      data: years
    });
  } catch (error) {
    console.error('❌ Error in getAvailableYears:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available years',
      error: error.message
    });
  }
};

// Get available item categories
const getItemCategories = async (req, res) => {
  try {
    console.log('📦 Getting available categories');
    
    const categories = await IncidentReportModel.getItemCategories();

    console.log('✅ Available categories:', categories);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error in getItemCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item categories',
      error: error.message
    });
  }
};

// Export to CSV
const exportToCSV = async (req, res) => {
  try {
    console.log('📄 Exporting to CSV with filters:', req.query);
    
    const filters = {
      search: req.query.search || '',
      type: req.query.type || '',
      category: req.query.category || '',
      status: req.query.status || '',
      year: req.query.year || '',
      month: req.query.month || ''
    };

    // Get all reports (no pagination for export)
    const reports = await IncidentReportModel.getAllWithFilters(filters);

    // Create CSV content
    const csvHeaders = [
      'Report ID',
      'Date',
      'Time',
      'Type',
      'Category',
      'Description',
      'Status',
      'Passenger Name',
      'Contact Phone',
      'Contact Email',
      'Route Number',
      'Bus Number',
      'Driver Name',
      'Location Found',
      'Resolution Date',
      'Resolution Notes'
    ].join(',');

    const csvRows = reports.map(report => [
      report.report_id,
      report.incident_date,
      report.incident_time,
      report.report_type,
      report.item_category,
      `"${(report.item_description || '').replace(/"/g, '""')}"`,
      report.status,
      `"${(report.passenger_name || '').replace(/"/g, '""')}"`,
      report.contact_phone,
      report.contact_email,
      report.route_number,
      report.bus_number || '',
      `"${(report.driver_name || '').replace(/"/g, '""')}"`,
      `"${(report.location_found || '').replace(/"/g, '""')}"`,
      report.resolution_date || '',
      `"${(report.resolution_notes || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    console.log(`✅ CSV export completed with ${reports.length} records`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="incident_reports_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('❌ Error in exportToCSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export CSV',
      error: error.message
    });
  }
};

module.exports = {
  getAllReports,
  getReportById,
  resolveReport,
  updateReportStatus,
  getStatistics,
  getAvailableYears,
  getItemCategories,
  exportToCSV
};
