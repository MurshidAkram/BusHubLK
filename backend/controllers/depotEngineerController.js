const Bus = require('../models/busModel');
const User = require('../models/userModel');
const RegionDepot = require('../models/regionDepotModel');
const BusConditionReport = require('../models/BusConditionReport');

// Get buses for depot engineer (filtered by their depot)
const getBusesForDepotEngineer = async (req, res) => {
    try {
        // Use getRoleSpecificDetails instead of the non-existent getDepotEngineerDetails
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        // Get depot details to include region and depot names
        const depot = await RegionDepot.getDepotById(depotEngineerDetails.depot_id);

        if (!depot) {
            return res.status(404).json({
                success: false,
                message: 'Depot not found'
            });
        }

        const buses = await Bus.getByDepot(depotEngineerDetails.depot_id);

        res.json({
            success: true,
            message: 'Buses retrieved successfully',
            buses,
            depot: {
                depot_id: depot.depot_id,
                depot_name: depot.depot_name,
                region_id: depot.region_id,
                region_name: depot.region_name
            }
        });
    } catch (err) {
        console.error('Get buses for depot engineer error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Update bus status (only status can be updated by depot engineer)
const updateBusStatus = async (req, res) => {
    const { bus_id } = req.params;
    const { status } = req.body;

    try {
        // Use getRoleSpecificDetails here as well
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);
        const bus = await Bus.findById(bus_id);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(403).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        if (bus.depot_id !== depotEngineerDetails.depot_id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this bus'
            });
        }

        const updatedBus = await Bus.update(bus_id, { status });

        res.json({
            success: true,
            message: 'Bus status updated successfully',
            bus: updatedBus
        });
    } catch (err) {
        console.error('Update bus status error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get condition reports for depot engineer's depot
const getConditionReportsForDepot = async (req, res) => {
    try {
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const { status } = req.query; // Optional filter by review status
        const reports = await BusConditionReport.findByDepot(depotEngineerDetails.depot_id, status);

        res.json({
            success: true,
            message: 'Condition reports retrieved successfully',
            reports,
            depot_id: depotEngineerDetails.depot_id
        });
    } catch (err) {
        console.error('Get condition reports for depot error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Review a condition report
const reviewConditionReport = async (req, res) => {
    const { reportId } = req.params;

    try {
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(403).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        // Get the report to verify it belongs to this depot
        const report = await BusConditionReport.findById(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Condition report not found'
            });
        }

        // Get the bus to check depot ownership
        const bus = await Bus.findById(report.bus_id);
        if (!bus || bus.depot_id !== depotEngineerDetails.depot_id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to review this report'
            });
        }

        // Check if already reviewed
        if (report.review_status === 'reviewed') {
            return res.status(400).json({
                success: false,
                message: 'Report has already been reviewed'
            });
        }

        const reviewedReport = await BusConditionReport.reviewReport(reportId, {
            reviewedBy: req.user.userId,
            reviewStatus: 'reviewed'
        });

        res.json({
            success: true,
            message: 'Report reviewed successfully',
            report: reviewedReport
        });
    } catch (err) {
        console.error('Review condition report error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get pending reports for depot engineer
const getPendingReports = async (req, res) => {
    try {
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const reports = await BusConditionReport.getPendingReportsForDepot(depotEngineerDetails.depot_id);

        res.json({
            success: true,
            message: 'Pending reports retrieved successfully',
            reports,
            depot_id: depotEngineerDetails.depot_id
        });
    } catch (err) {
        console.error('Get pending reports error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get report statistics for depot
const getReportStatistics = async (req, res) => {
    try {
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const stats = await BusConditionReport.getReviewStatsForDepot(depotEngineerDetails.depot_id);

        res.json({
            success: true,
            message: 'Report statistics retrieved successfully',
            stats,
            depot_id: depotEngineerDetails.depot_id
        });
    } catch (err) {
        console.error('Get report statistics error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

module.exports = {
    getBusesForDepotEngineer,
    updateBusStatus,
    getConditionReportsForDepot,
    reviewConditionReport,
    getPendingReports,
    getReportStatistics
};