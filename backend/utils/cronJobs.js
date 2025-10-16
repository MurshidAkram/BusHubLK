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
    // Run every hour from 7:00 AM through 10:00 PM to keep statuses fresh during the day
    cron.schedule('0 7-22 * * *', updateServiceStatuses, {
        timezone: "Asia/Colombo"
    });

    console.log('🕐 Service status cron jobs scheduled:');
    console.log('   - Hourly from 7:00 AM to 10:00 PM');
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
