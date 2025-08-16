const Emergency = require('../models/depotEmergencyModel');

/**
 * @desc Get all reports relevant to the manager (Reviewing, Action Taken, Resolved)
 * @route GET /api/depot-manager/
 */
const getManagerReports = async (req, res) => {
    try {
        // --- THIS IS THE FIX ---
        // Changed from findEscalated() to the new findAllForManager()
        const reports = await Emergency.findAllForManager();
        res.status(200).json({ success: true, data: reports });
    } catch (error) {
        console.error("Error in getManagerReports controller:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc Get statistics for the manager dashboard cards
 * @route GET /api/depot-manager/statistics
 */
const getStats = async (req, res) => {
    try {
        // Uses the new getManagerStatistics function from the model
        const stats = await Emergency.getManagerStatistics();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error("Error in getStats controller:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc Add a reply from the manager to the manager chat
 * @route POST /api/depot-manager/emergency/:reportId/reply
 */
const addManagerReply = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { text } = req.body;
        const sender_type = 'depot_manager'; // Use the correct sender type
        
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Message text is required' });
        }

        const newMessage = await Emergency.addManagerMessage(reportId, sender_type, text);
        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc Update the status of a report
 * @route PATCH /api/depot-manager/emergency/:reportId/status
 */
const updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }
        const updatedReport = await Emergency.updateStatus(reportId, status);
        if (!updatedReport) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }
        res.status(200).json({ success: true, data: updatedReport });
    } catch (error) {
        console.error(`Error in updateReportStatus for reportId ${req.params.reportId}:`, error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};


module.exports = {
    getManagerReports,
    getStats,
    addManagerReply,
    updateReportStatus,
};