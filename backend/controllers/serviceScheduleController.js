const ServiceSchedule = require('../models/serviceScheduleModel');
const Bus = require('../models/busModel');
const User = require('../models/userModel');
const { validationResult } = require('express-validator');

// Helper function to get depot_id for depot engineers
const getDepotId = async (user) => {
    if (user.role === 'depot_engineer') {
        const depotEngineerDetails = await User.getRoleSpecificDetails(user.userId, user.role);
        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return null;
        }
        return depotEngineerDetails.depot_id;
    }
    return null;
};

// Get all service schedules for a depot
const getDepotServiceSchedules = async (req, res) => {
    try {
        const user = req.user;
        const include_cancelled = req.query.include_cancelled === 'true';

        // Get depot_id from user (depot engineer) or from query params (admin)
        let depot_id;
        if (user.role === 'depot_engineer') {
            const depotEngineerDetails = await User.getRoleSpecificDetails(user.userId, user.role);

            if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
                console.log('Depot engineer details or depot_id not found:', depotEngineerDetails);
                return res.status(404).json({
                    success: false,
                    message: 'Depot engineer details or depot ID not found for this user'
                });
            }

            depot_id = depotEngineerDetails.depot_id;
        } else if (req.query.depot_id) {
            depot_id = req.query.depot_id;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Depot ID is required'
            });
        }

        // Update automatic statuses before fetching
        await ServiceSchedule.updateAutomaticStatuses(depot_id);

        const schedules = await ServiceSchedule.getByDepot(depot_id, include_cancelled);

        // Calculate smart status for each schedule (redundant check for frontend)
        const schedulesWithStatus = schedules.map(schedule => ({
            ...schedule,
            calculated_status: ServiceSchedule.calculateStatus(schedule.scheduled_date, schedule.status)
        })); res.json({
            success: true,
            message: 'Service schedules retrieved successfully',
            schedules: schedulesWithStatus,
            depot_id
        });
    } catch (err) {
        console.error('Get depot service schedules error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get service schedules for a specific date
const getSchedulesByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const user = req.user;

        let depot_id;
        if (user.role === 'depot_engineer') {
            const depotEngineerDetails = await User.getRoleSpecificDetails(user.userId, user.role);

            if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
                console.log('Depot engineer details or depot_id not found for date schedules:', depotEngineerDetails);
                return res.status(404).json({
                    success: false,
                    message: 'Depot engineer details or depot ID not found for this user'
                });
            }

            depot_id = depotEngineerDetails.depot_id;
        } else if (req.query.depot_id) {
            depot_id = req.query.depot_id;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Depot ID is required'
            });
        }

        const schedules = await ServiceSchedule.getByDateAndDepot(depot_id, date);

        res.json({
            success: true,
            message: 'Service schedules retrieved successfully',
            schedules,
            date,
            depot_id
        });
    } catch (err) {
        console.error('Get schedules by date error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get depot statistics
const getDepotStats = async (req, res) => {
    try {
        const user = req.user;

        let depot_id;
        if (user.role === 'depot_engineer') {
            const depotEngineerDetails = await User.getRoleSpecificDetails(user.userId, user.role);

            if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
                console.log('Depot engineer details or depot_id not found for stats:', depotEngineerDetails);
                return res.status(404).json({
                    success: false,
                    message: 'Depot engineer details or depot ID not found for this user'
                });
            }

            depot_id = depotEngineerDetails.depot_id;
        } else if (req.query.depot_id) {
            depot_id = req.query.depot_id;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Depot ID is required'
            });
        }

        // Update automatic statuses before getting stats
        await ServiceSchedule.updateAutomaticStatuses(depot_id);

        const stats = await ServiceSchedule.getDepotStats(depot_id);

        res.json({
            success: true,
            message: 'Statistics retrieved successfully',
            stats,
            depot_id
        });
    } catch (err) {
        console.error('Get depot stats error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get available buses for a depot
const getDepotBuses = async (req, res) => {
    try {
        const user = req.user;

        let depot_id;
        if (user.role === 'depot_engineer') {
            const depotEngineerDetails = await User.getRoleSpecificDetails(user.userId, user.role);

            if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
                console.log('Depot engineer details or depot_id not found for buses:', depotEngineerDetails);
                return res.status(404).json({
                    success: false,
                    message: 'Depot engineer details or depot ID not found for this user'
                });
            }

            depot_id = depotEngineerDetails.depot_id;
        } else if (req.query.depot_id) {
            depot_id = req.query.depot_id;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Depot ID is required'
            });
        }

        const buses = await Bus.getByDepot(depot_id);

        // Debug logging
        console.log(`[SERVICE SCHEDULE] Fetching buses for depot_id: ${depot_id}`);
        console.log(`[SERVICE SCHEDULE] Total buses found: ${buses.length}`);
        console.log(`[SERVICE SCHEDULE] Bus details:`, buses.map(bus => ({
            bus_id: bus.bus_id,
            registration_number: bus.registration_number,
            status: bus.status,
            depot_id: bus.depot_id
        })));

        // Return all buses (no status filtering)
        res.json({
            success: true,
            message: 'Depot buses retrieved successfully',
            buses: buses,
            depot_id
        });
    } catch (err) {
        console.error('Get depot buses error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Create a new service schedule
const createServiceSchedule = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { service_type, bus_id, scheduled_date } = req.body;
        const user = req.user;

        let depot_id;
        if (user.role === 'depot_engineer') {
            depot_id = await getDepotId(user);
            if (!depot_id) {
                return res.status(404).json({
                    success: false,
                    message: 'Depot engineer details or depot ID not found for this user'
                });
            }
        } else if (req.body.depot_id) {
            depot_id = req.body.depot_id;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Depot ID is required'
            });
        }

        // Verify the bus belongs to the depot
        const bus = await Bus.findById(bus_id);
        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        if (bus.depot_id !== parseInt(depot_id)) {
            return res.status(403).json({
                success: false,
                message: 'Bus does not belong to your depot'
            });
        }

        // Check if date is not in the past
        const scheduleDate = new Date(scheduled_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        scheduleDate.setHours(0, 0, 0, 0);

        if (scheduleDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Scheduled date cannot be in the past'
            });
        }

        const schedule = await ServiceSchedule.create({
            service_type,
            bus_id,
            scheduled_date,
            depot_id
        });

        res.status(201).json({
            success: true,
            message: 'Service schedule created successfully',
            schedule
        });
    } catch (err) {
        console.error('Create service schedule error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Update a service schedule
const updateServiceSchedule = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const updates = req.body;
        const user = req.user;

        // Get the existing schedule
        const existingSchedule = await ServiceSchedule.findById(id);
        if (!existingSchedule) {
            return res.status(404).json({
                success: false,
                message: 'Service schedule not found'
            });
        }

        // Check depot access
        if (user.role === 'depot_engineer') {
            const userDepotId = await getDepotId(user);
            if (!userDepotId) {
                return res.status(404).json({
                    success: false,
                    message: 'Depot engineer details or depot ID not found for this user'
                });
            }

            if (existingSchedule.depot_id !== userDepotId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this service schedule'
                });
            }
        }

        // Don't allow updates to completed services
        if (existingSchedule.status === 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update completed service schedules'
            });
        }

        // If updating bus_id, verify it belongs to the depot
        if (updates.bus_id) {
            const bus = await Bus.findById(updates.bus_id);
            if (!bus || bus.depot_id !== existingSchedule.depot_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Bus does not belong to the depot'
                });
            }
        }

        const updatedSchedule = await ServiceSchedule.update(id, updates);

        // If scheduled_date was updated, recalculate status for non-manual statuses
        if (updates.scheduled_date && updatedSchedule &&
            !['In Progress', 'Completed', 'Cancelled'].includes(updatedSchedule.status)) {

            const newStatus = ServiceSchedule.calculateStatus(updatedSchedule.scheduled_date, updatedSchedule.status);
            if (newStatus !== updatedSchedule.status) {
                // Update status in database
                const finalSchedule = await ServiceSchedule.update(id, { status: newStatus });
                return res.json({
                    success: true,
                    message: 'Service schedule updated successfully',
                    schedule: finalSchedule
                });
            }
        }

        res.json({
            success: true,
            message: 'Service schedule updated successfully',
            schedule: updatedSchedule
        });
    } catch (err) {
        console.error('Update service schedule error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Start work on a service
const startWork = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Get the existing schedule
        const existingSchedule = await ServiceSchedule.findById(id);
        if (!existingSchedule) {
            return res.status(404).json({
                success: false,
                message: 'Service schedule not found'
            });
        }

        console.log(`🔧 Start work request for schedule ID: ${id}`);
        console.log(`📋 Current schedule status: ${existingSchedule.status}`);
        console.log(`📅 Scheduled date: ${existingSchedule.scheduled_date}`);

        // Check if status allows starting work
        const allowedStatuses = ['Pending', 'Due Today', 'Overdue', 'Critical Overdue'];
        if (!allowedStatuses.includes(existingSchedule.status)) {
            console.log(`❌ Cannot start work - invalid status: ${existingSchedule.status}`);
            return res.status(400).json({
                success: false,
                message: `Cannot start work on service with status: ${existingSchedule.status}. Allowed statuses: ${allowedStatuses.join(', ')}`
            });
        }

        // Check depot access
        if (user.role === 'depot_engineer') {
            const userDepotId = await getDepotId(user);
            if (!userDepotId) {
                return res.status(404).json({
                    success: false,
                    message: 'Depot engineer details or depot ID not found for this user'
                });
            }

            if (existingSchedule.depot_id !== userDepotId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this service schedule'
                });
            }
        }

        const updatedSchedule = await ServiceSchedule.startWork(id);

        if (!updatedSchedule) {
            console.log(`❌ startWork returned null for schedule ID: ${id}`);
            return res.status(400).json({
                success: false,
                message: 'Cannot start work on this service. Database update failed.'
            });
        }

        console.log(`✅ Work started successfully for schedule ID: ${id}, new status: ${updatedSchedule.status}`);

        res.json({
            success: true,
            message: 'Work started successfully',
            schedule: updatedSchedule
        });
    } catch (err) {
        console.error('Start work error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Complete a service
const completeService = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Get the existing schedule
        const existingSchedule = await ServiceSchedule.findById(id);
        if (!existingSchedule) {
            return res.status(404).json({
                success: false,
                message: 'Service schedule not found'
            });
        }

        // Check depot access
        if (user.role === 'depot_engineer') {
            const userDepotId = await getDepotId(user);
            if (!userDepotId) {
                return res.status(404).json({
                    success: false,
                    message: 'Depot engineer details or depot ID not found for this user'
                });
            }

            if (existingSchedule.depot_id !== userDepotId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this service schedule'
                });
            }
        }

        const updatedSchedule = await ServiceSchedule.complete(id);

        if (!updatedSchedule) {
            return res.status(400).json({
                success: false,
                message: 'Cannot complete this service. It must be in progress first.'
            });
        }

        res.json({
            success: true,
            message: 'Service completed successfully',
            schedule: updatedSchedule
        });
    } catch (err) {
        console.error('Complete service error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Cancel a service
const cancelService = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Get the existing schedule
        const existingSchedule = await ServiceSchedule.findById(id);
        if (!existingSchedule) {
            return res.status(404).json({
                success: false,
                message: 'Service schedule not found'
            });
        }

        console.log(`🗑️  Cancel service request for schedule ID: ${id}`);

        // Check if already soft deleted
        if (existingSchedule.is_deleted === true) {
            console.log(`❌ Cannot cancel - service already deleted`);
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel service that is already deleted.'
            });
        }

        // Calculate the current status based on date and conditions
        const currentStatus = ServiceSchedule.calculateStatus(
            existingSchedule.scheduled_date,
            existingSchedule.status,
            existingSchedule.is_deleted
        );

        console.log(`📋 Current schedule status: ${existingSchedule.status}`);
        console.log(`📊 Calculated status: ${currentStatus}`);
        console.log(`📅 Scheduled date: ${existingSchedule.scheduled_date}`);

        // Check if status allows cancellation (explicitly allow Due Today and Overdue)
        const allowedCancelStatuses = ['Pending', 'Due Today', 'Overdue', 'Critical Overdue'];
        if (!allowedCancelStatuses.includes(currentStatus)) {
            console.log(`❌ Cannot cancel - invalid calculated status: ${currentStatus} (DB status: ${existingSchedule.status})`);
            return res.status(400).json({
                success: false,
                message: `Cannot cancel service with status: ${currentStatus}. Only services with status ${allowedCancelStatuses.join(', ')} can be cancelled.`
            });
        }

        // Check depot access
        if (user.role === 'depot_engineer') {
            const userDepotId = await getDepotId(user);
            if (!userDepotId) {
                return res.status(404).json({
                    success: false,
                    message: 'Depot engineer details or depot ID not found for this user'
                });
            }

            if (existingSchedule.depot_id !== userDepotId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this service schedule'
                });
            }
        }

        const updatedSchedule = await ServiceSchedule.cancel(id);

        if (!updatedSchedule) {
            console.log(`❌ cancel method returned null for schedule ID: ${id}`);
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel this service. Database update failed.'
            });
        }

        console.log(`✅ Service soft deleted successfully for schedule ID: ${id}, is_deleted: ${updatedSchedule.is_deleted}`);

        res.json({
            success: true,
            message: 'Service cancelled successfully',
            schedule: updatedSchedule
        });
    } catch (err) {
        console.error('Cancel service error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Restore a cancelled service
const restoreService = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Get the existing schedule
        const existingSchedule = await ServiceSchedule.findById(id);
        if (!existingSchedule) {
            return res.status(404).json({
                success: false,
                message: 'Service schedule not found'
            });
        }

        console.log(`♻️  Restore service request for schedule ID: ${id}`);
        console.log(`📋 Current schedule is_deleted: ${existingSchedule.is_deleted}`);

        // Check if status allows restoration (only soft deleted services can be restored)
        if (existingSchedule.is_deleted !== true) {
            console.log(`❌ Cannot restore - service not deleted: ${existingSchedule.is_deleted}`);
            return res.status(400).json({
                success: false,
                message: `Cannot restore service that is not deleted. Current is_deleted status: ${existingSchedule.is_deleted}`
            });
        }

        // Check depot access
        if (user.role === 'depot_engineer') {
            const userDepotId = await getDepotId(user);
            if (!userDepotId) {
                return res.status(404).json({
                    success: false,
                    message: 'Depot engineer details or depot ID not found for this user'
                });
            }

            if (existingSchedule.depot_id !== userDepotId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this service schedule'
                });
            }
        }

        const updatedSchedule = await ServiceSchedule.restore(id);

        if (!updatedSchedule) {
            console.log(`❌ restore method returned null for schedule ID: ${id}`);
            return res.status(400).json({
                success: false,
                message: 'Cannot restore this service. Database update failed.'
            });
        }

        console.log(`✅ Service restored successfully for schedule ID: ${id}, is_deleted: ${updatedSchedule.is_deleted}`);

        res.json({
            success: true,
            message: 'Service restored successfully',
            schedule: updatedSchedule
        });
    } catch (err) {
        console.error('Restore service error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get service schedule by ID
const getServiceScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const schedule = await ServiceSchedule.findById(id);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Service schedule not found'
            });
        }

        // Check depot access
        if (user.role === 'depot_engineer') {
            const userDepotId = await getDepotId(user);
            if (!userDepotId) {
                return res.status(404).json({
                    success: false,
                    message: 'Depot engineer details or depot ID not found for this user'
                });
            }

            if (schedule.depot_id !== userDepotId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this service schedule'
                });
            }
        }

        res.json({
            success: true,
            message: 'Service schedule retrieved successfully',
            schedule
        });
    } catch (err) {
        console.error('Get service schedule by ID error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Utility function to update all automatic statuses (can be called by cron job)
const updateAllAutomaticStatuses = async (req, res) => {
    try {
        // This endpoint should be protected and only accessible by system/admin
        const updatedSchedules = await ServiceSchedule.updateAutomaticStatuses();

        res.json({
            success: true,
            message: 'Automatic status updates completed',
            updated_count: updatedSchedules.length,
            updated_schedules: updatedSchedules
        });
    } catch (err) {
        console.error('Update automatic statuses error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

module.exports = {
    getDepotServiceSchedules,
    getSchedulesByDate,
    getDepotStats,
    getDepotBuses,
    createServiceSchedule,
    updateServiceSchedule,
    startWork,
    completeService,
    cancelService,
    restoreService,
    getServiceScheduleById,
    updateAllAutomaticStatuses
};
