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
 * @desc Add a reply from the manager to the manager chat (with depot engineer)
 * @route POST /api/depot-manager/emergency/:reportId/reply
 */
const addManagerReply = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { text } = req.body;
        const sender_type = 'depot_manager';
        
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
 * @desc Add a reply from the manager to the RTO chat
 * @route POST /api/depot-manager/emergency/:reportId/rto-reply
 */
const addManagerRTOReply = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { text } = req.body;
        const sender_type = 'depot_manager';
        
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Message text is required' });
        }

        const newMessage = await Emergency.addRTOManagerMessage(reportId, sender_type, text);
        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc Get RTO-Manager chat messages
 * @route GET /api/depot-manager/emergency/:reportId/rto-chat
 */
const getRTOManagerChat = async (req, res) => {
    try {
        const { reportId } = req.params;
        const messages = await Emergency.getRTOManagerChat(reportId);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error(`Error in getRTOManagerChat for reportId ${req.params.reportId}:`, error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc Update the status of a report
 * @route PATCH /api/depot-manager/emergency/:reportId/status
 */
const updateReportStatus = async (req, res) => {
    try {
        console.log(`📝 updateReportStatus called for reportId: ${req.params.reportId}`);
        console.log(`📝 Request body:`, req.body);
        
        const { reportId } = req.params;
        const { status } = req.body;
        
        if (!status) {
            console.log('❌ Status is missing from request body');
            return res.status(400).json({ success: false, message: 'Status is required' });
        }
        
        console.log(`📝 Updating report ${reportId} to status: ${status}`);
        const updatedReport = await Emergency.updateStatus(reportId, status);
        
        if (!updatedReport) {
            console.log(`❌ Report ${reportId} not found`);
            return res.status(404).json({ success: false, message: 'Report not found' });
        }
        
        console.log(`✅ Report ${reportId} updated successfully:`, updatedReport);
        res.status(200).json({ success: true, data: updatedReport });
    } catch (error) {
        console.error(`❌ Error in updateReportStatus for reportId ${req.params.reportId}:`, error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};


module.exports = {
    getManagerReports,
    getStats,
    addManagerReply,
    addManagerRTOReply,
    getRTOManagerChat,
    updateReportStatus,
};