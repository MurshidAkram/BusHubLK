const Emergency = require('../models/depotEmergencyModel');

// getAllReports remains the same
const getAllReports = async (req, res) => {
    try {
        const filters = {
            type: req.query.type,
            search: req.query.search,
            regionId: req.query.regionId,
            depotId: req.query.depotId,
        };
        const reports = await Emergency.findAll(filters);
        res.status(200).json({ success: true, data: reports });
    } catch (error) {
        console.error("Error in getAllReports controller:", error);
        res.status(500).json({ success: false, message: 'Server Error - Check Terminal Logs', error: error.message });
    }
};

// getReportDetails remains the same
const getReportDetails = async (req, res) => {
    try {
        const { reportId } = req.params;
        const reportWithMessages = await Emergency.findById(reportId);
        if (!reportWithMessages) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }
        res.status(200).json({ success: true, data: reportWithMessages });
    } catch (error) {
        console.error(`Error in getReportDetails for reportId ${req.params.reportId}:`, error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// --- NEW FUNCTION ---
const getReportMessages = async (req, res) => {
    try {
        const { reportId } = req.params;
        const messages = await Emergency.getMessagesByReportId(reportId);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error(`Error in getReportMessages for reportId ${req.params.reportId}:`, error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// addDepotMessage remains the same
const addDepotMessage = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { text } = req.body;
        const sender = 'depot';
        if (!text) {
            return res.status(400).json({ success: false, message: 'Message text is required' });
        }
        const newMessage = await Emergency.addMessage(reportId, sender, text);
        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
/**
 * @desc Get all messages from the internal manager chat for a specific report
 * @route GET /api/depot/emergency/:reportId/manager-chat
 * @access Private
 */
const getManagerChatMessages = async (req, res) => {
    try {
        const { reportId } = req.params;
        // Uses the getManagerChat function from your model
        const messages = await Emergency.getManagerChat(reportId);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error(`Error in getManagerChatMessages for reportId ${req.params.reportId}:`, error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc Add a message from the depot operator to the manager chat
 * @route POST /api/depot/emergency/:reportId/manager-chat
 * @access Private
 */
const addManagerMessage = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { text } = req.body;
        // The sender is 'depot', as the depot operator is initiating the message to the manager.
        const sender = 'depot';
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Message text is required' });
        }
        // Uses the addManagerMessage function from your model
        const newMessage = await Emergency.addManagerMessage(reportId, sender, text);
        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// updateReportStatus remains the same
const updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }
        const updatedReport = await Emergency.updateStatus(reportId, status);
        if (!updatedReport) {
            return res.status(404).json({ success: false, message: 'Report not found or status not modified' });
        }
        res.status(200).json({ success: true, data: updatedReport });
    } catch (error) {
        console.error(`Error in updateReportStatus for reportId ${req.params.reportId}:`, error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// getDashboardStats remains the same
const getDashboardStats = async (req, res) => {
    try {
        const stats = await Emergency.getStatistics({
            regionId: req.query.regionId,
            depotId: req.query.depotId,
        });
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getAllReports,
    getReportDetails,
    getReportMessages, // Export the new function
    addDepotMessage,
    updateReportStatus,
    getDashboardStats,
    getManagerChatMessages,
    addManagerMessage,
};