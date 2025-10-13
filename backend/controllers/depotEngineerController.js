const Bus = require('../models/busModel');
const User = require('../models/userModel');
const RegionDepot = require('../models/regionDepotModel');
const ServiceSchedule = require('../models/serviceScheduleModel');
const BusConditionReport = require('../models/BusConditionReport');
const BusDailyChecklist = require('../models/busDailyChecklistModel');

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

// Get service history for a specific bus limited to completed schedules
const getServiceHistoryForBus = async (req, res) => {
    try {
        const { bus_id } = req.params;

        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(403).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const bus = await Bus.findById(bus_id);

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        if (bus.depot_id !== depotEngineerDetails.depot_id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access service history for this bus'
            });
        }

        const schedules = await ServiceSchedule.getByBusId(bus_id);
        const completedSchedules = Array.isArray(schedules)
            ? schedules.filter((schedule) => (schedule.status || '').toLowerCase() === 'completed')
            : [];

        res.json({
            success: true,
            message: 'Service history retrieved successfully',
            schedules: completedSchedules,
            count: completedSchedules.length,
            bus: {
                bus_id: bus.bus_id,
                registration_number: bus.registration_number,
                depot_id: bus.depot_id
            }
        });
    } catch (err) {
        console.error('Get service history error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

const getConditionReports = async (req, res) => {
    try {
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const reports = await BusConditionReport.findByDepot(depotEngineerDetails.depot_id);

        res.json({
            success: true,
            message: 'Bus condition reports retrieved successfully',
            reports,
            depot_id: depotEngineerDetails.depot_id
        });
    } catch (err) {
        console.error('Get condition reports for depot engineer error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

const getConditionReportStats = async (req, res) => {
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
            message: 'Bus condition report statistics retrieved successfully',
            stats,
            depot_id: depotEngineerDetails.depot_id
        });
    } catch (err) {
        console.error('Get condition report stats error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

const reviewConditionReport = async (req, res) => {
    try {
        const { report_id } = req.params;

        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const report = await BusConditionReport.findById(report_id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        const bus = await Bus.findById(report.bus_id);

        if (!bus || bus.depot_id !== depotEngineerDetails.depot_id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to review this report'
            });
        }

        const updatedReport = await BusConditionReport.reviewReport(report_id, {
            reviewedBy: req.user.userId,
            reviewStatus: 'reviewed'
        });

        res.json({
            success: true,
            message: 'Report marked as reviewed',
            report: updatedReport
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

const CHECKLIST_PART_KEYS = [
    'engine',
    'brakes',
    'tires',
    'windows',
    'doors',
    'lights',
    'turn_signals',
    'fire_extinguisher'
];

const isChecklistPartPassed = (value) => {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value === 1;
    }
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }
    return false;
};

const getDailyChecklistsWithIssues = async (req, res) => {
    try {
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const checklists = await BusDailyChecklist.getByDepotId(depotEngineerDetails.depot_id);

        const latestChecklistByBus = new Map();
        for (const checklist of checklists) {
            const existing = latestChecklistByBus.get(checklist.bus_id);
            const checklistTime = checklist.check_date ? new Date(checklist.check_date).getTime() : 0;
            const existingTime = existing?.check_date ? new Date(existing.check_date).getTime() : 0;

            if (!existing || checklistTime >= existingTime) {
                latestChecklistByBus.set(checklist.bus_id, checklist);
            }
        }

        const issues = [];
        for (const checklist of latestChecklistByBus.values()) {
            const missedParts = CHECKLIST_PART_KEYS.filter((key) => !isChecklistPartPassed(checklist[key]));
            if (missedParts.length > 0) {
                issues.push({
                    ...checklist,
                    missed_parts: missedParts
                });
            }
        }

        issues.sort((a, b) => {
            const busA = a.registration_number || String(a.bus_id);
            const busB = b.registration_number || String(b.bus_id);
            return busA.localeCompare(busB);
        });

        return res.json({
            success: true,
            message: 'Daily checklist issues retrieved successfully',
            checklists: issues,
            count: issues.length
        });
    } catch (err) {
        console.error('Get daily checklist issues error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

module.exports = {
    getBusesForDepotEngineer,
    updateBusStatus,
    getServiceHistoryForBus,
    getConditionReports,
    getConditionReportStats,
    reviewConditionReport,
    getDailyChecklistsWithIssues
};