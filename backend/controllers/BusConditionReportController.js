const BusConditionReport = require('../models/BusConditionReport');

const createBusConditionReport = async (req, res) => {
  try {
    const { busId, driverId, conditionStatus, description, reportTime } = req.body;

    if (!busId || !driverId || !conditionStatus) {
      return res.status(400).json({ message: 'busId, driverId, and conditionStatus are required.' });
    }

    const newReport = await BusConditionReport.create({
      busId,
      driverId,
      conditionStatus,
      description,
      reportTime: reportTime || new Date().toISOString(),
    });

    res.status(201).json(newReport);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getAllBusConditionReports = async (req, res) => {
  try {
    const reports = await BusConditionReport.getAllReports();
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getBusConditionReportsByBusId = async (req, res) => {
  try {
    const { busId } = req.params;
    const reports = await BusConditionReport.findByBusId(busId);

    if (!reports.length) {
      return res.status(404).json({ message: 'No condition reports found for this bus.' });
    }

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getBusConditionReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await BusConditionReport.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Condition report not found.' });
    }

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createBusConditionReport,
  getAllBusConditionReports,
  getBusConditionReportsByBusId,
  getBusConditionReportById,
};
