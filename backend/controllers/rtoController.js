const Emergency = require('../models/depotEmergencyModel');

/**
 * @desc Get all reports escalated to RTO
 * @route GET /api/rto/
 */
const getRTOReports = async (req, res) => {
    try {
        const reports = await Emergency.findAllForRTO();
        res.status(200).json({ success: true, data: reports });
    } catch (error) {
        console.error("Error in getRTOReports controller:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc Add a reply from RTO to the manager chat
 * @route POST /api/rto/emergency/:reportId/reply
 */
const addRTOReply = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { text } = req.body;
        const sender_type = 'rto';
        
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
 * @desc Update the status of a report (resolve or escalate further)
 * @route PATCH /api/rto/emergency/:reportId/status
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

/**
 * @desc Get chat messages for RTO-Manager communication
 * @route GET /api/rto/emergency/:reportId/chat
 */
const getRTOChatMessages = async (req, res) => {
    try {
        const { reportId } = req.params;
        const messages = await Emergency.getRTOManagerChat(reportId);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error(`Error in getRTOChatMessages for reportId ${req.params.reportId}:`, error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getRTOReports,
    addRTOReply,
    updateReportStatus,
    getRTOChatMessages,
};
