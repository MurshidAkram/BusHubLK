const cron = require('node-cron');
const ServiceSchedule = require('../models/serviceScheduleModel');

// Function to update all automatic statuses
const updateServiceStatuses = async () => {
    try {
        console.log('🔄 Running automatic service status updates...');
        const updatedSchedules = await ServiceSchedule.updateAutomaticStatuses();

        if (updatedSchedules.length > 0) {
            console.log(`✅ Updated ${updatedSchedules.length} service schedule statuses:`,
                updatedSchedules.map(s => `ID: ${s.id}, Status: ${s.status}, Date: ${s.scheduled_date}`));
        } else {
            console.log('ℹ️  No service schedules needed status updates');
        }
    } catch (error) {
        console.error('❌ Error updating service statuses:', error);
    }
};

// Setup cron jobs
const setupCronJobs = () => {
    // Run every day at 6:00 AM to update statuses
    cron.schedule('0 6 * * *', updateServiceStatuses, {
        timezone: "Asia/Colombo"
    });

    // Run every hour during working hours (8 AM to 6 PM) for more frequent updates
    cron.schedule('0 8-18 * * *', updateServiceStatuses, {
        timezone: "Asia/Colombo"
    });

    console.log('🕐 Service status cron jobs scheduled:');
    console.log('   - Daily at 6:00 AM');
    console.log('   - Hourly from 8:00 AM to 6:00 PM');
};

// Manual trigger function for testing
const triggerStatusUpdate = () => {
    updateServiceStatuses();
};

module.exports = {
    setupCronJobs,
    triggerStatusUpdate,
    updateServiceStatuses
};
