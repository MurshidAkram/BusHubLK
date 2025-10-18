const DGMOperationsNotificationModel = require('../models/dgmOperationsNotificationModel');

const handleControllerError = (res, error, fallbackMessage) => {
    console.error('DGM Operations notification error:', error);
    const status = error.statusCode || 500;
    const message = error.message || fallbackMessage;
    res.status(status).json({ success: false, message });
};

const getNotifications = async (req, res) => {
    try {
        const limit = Number(req.query.limit) > 0 ? Math.min(Number(req.query.limit), 200) : 100;
        const offset = Number(req.query.offset) >= 0 ? Number(req.query.offset) : 0;
        const includeRead = req.query.includeRead === 'true';

        const notifications = await DGMOperationsNotificationModel.getNotifications({
            userId: req.user.userId,
            includeRead,
            limit,
            offset
        });

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        handleControllerError(res, error, 'Failed to fetch DGM Operations notifications');
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await DGMOperationsNotificationModel.getUnreadCount({
            userId: req.user.userId
        });

        res.status(200).json({ success: true, unreadCount });
    } catch (error) {
        handleControllerError(res, error, 'Failed to fetch DGM Operations unread count');
    }
};

const markAsRead = async (req, res) => {
    try {
        const { sourceType, sourceId } = req.body;

        if (!sourceType || sourceId === undefined) {
            return res.status(400).json({
                success: false,
                message: 'sourceType and sourceId are required'
            });
        }

        const numericSourceId = Number(sourceId);
        if (!Number.isFinite(numericSourceId)) {
            return res.status(400).json({
                success: false,
                message: 'sourceId must be a number'
            });
        }

        const record = await DGMOperationsNotificationModel.markAsRead({
            userId: req.user.userId,
            sourceType,
            sourceId: numericSourceId
        });

        res.status(200).json({ success: true, record });
    } catch (error) {
        handleControllerError(res, error, 'Failed to mark DGM Operations notification as read');
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const updated = await DGMOperationsNotificationModel.markAllAsRead({
            userId: req.user.userId
        });

        res.status(200).json({
            success: true,
            updatedCount: updated.length,
            updated
        });
    } catch (error) {
        handleControllerError(res, error, 'Failed to mark DGM Operations notifications as read');
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
