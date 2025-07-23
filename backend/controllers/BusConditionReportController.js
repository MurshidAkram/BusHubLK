const BusConditionReport = require('../models/BusConditionReport');

const createBusConditionReport = async (req, res) => {
  try {
    const { busId, driverId, conditionStatus, description, reportTime } = req.body;

    if (!busId || !driverId || !conditionStatus) {
      return res.status(400).json({ 
        success: false,
        message: 'busId, driverId, and conditionStatus are required.' 
      });
    }

    const newReport = await BusConditionReport.create({
      busId,
      driverId,
      conditionStatus,
      description,
      reportTime: reportTime || new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Bus condition report created successfully',
      data: newReport
    });
  } catch (error) {
    console.error('Error creating bus condition report:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

const getAllBusConditionReports = async (req, res) => {
  try {
    const reports = await BusConditionReport.getAllReports();
    res.status(200).json({
      success: true,
      message: 'Bus condition reports retrieved successfully',
      data: reports
    });
  } catch (error) {
    console.error('Error getting all bus condition reports:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

const getBusConditionReportsByBusId = async (req, res) => {
  try {
    const { busId } = req.params;
    const reports = await BusConditionReport.findByBusId(busId);

    if (!reports.length) {
      return res.status(404).json({ 
        success: false,
        message: 'No condition reports found for this bus.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bus condition reports retrieved successfully',
      data: reports
    });
  } catch (error) {
    console.error('Error getting bus condition reports by bus ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

const getBusConditionReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await BusConditionReport.findById(reportId);

    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: 'Condition report not found.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bus condition report retrieved successfully',
      data: report
    });
  } catch (error) {
    console.error('Error getting bus condition report by ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

const getBusConditionReportsByDriverId = async (req, res) => {
  try {
    const { driverId } = req.params;
    const reports = await BusConditionReport.findByDriverId(driverId);

    if (!reports.length) {
      return res.status(404).json({ 
        success: false,
        message: 'No condition reports found for this driver.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Driver condition reports retrieved successfully',
      data: reports
    });
  } catch (error) {
    console.error('Error getting bus condition reports by driver ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

const updateBusConditionReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { conditionStatus, description } = req.body;

    if (!conditionStatus && !description) {
      return res.status(400).json({ 
        success: false,
        message: 'At least one field (conditionStatus or description) is required for update.' 
      });
    }

    const updatedReport = await BusConditionReport.updateReport(reportId, {
      conditionStatus,
      description
    });

    if (!updatedReport) {
      return res.status(404).json({ 
        success: false,
        message: 'Condition report not found.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bus condition report updated successfully',
      data: updatedReport
    });
  } catch (error) {
    console.error('Error updating bus condition report:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

const deleteBusConditionReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const deletedReport = await BusConditionReport.deleteReport(reportId);

    if (!deletedReport) {
      return res.status(404).json({ 
        success: false,
        message: 'Condition report not found.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bus condition report deleted successfully',
      data: deletedReport
    });
  } catch (error) {
    console.error('Error deleting bus condition report:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

module.exports = {
  createBusConditionReport,
  getAllBusConditionReports,
  getBusConditionReportsByBusId,
  getBusConditionReportById,
  getBusConditionReportsByDriverId,
  updateBusConditionReport,
  deleteBusConditionReport,
};
