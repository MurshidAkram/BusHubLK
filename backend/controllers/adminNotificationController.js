const AdminNotificationModel = require('../models/adminNotificationModel');

const parseLimit = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return 100;
    }
    return Math.min(numeric, 200);
};

const parseOffset = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
        return 0;
    }
    return numeric;
};

const handleError = (res, error, fallback) => {
    console.error('Admin notification error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
        success: false,
        message: error.message || fallback
    });
};

const getNotifications = async (req, res) => {
    try {
        const limit = parseLimit(req.query.limit);
        const offset = parseOffset(req.query.offset);
        const includeRead = req.query.includeRead === 'true';

        const notifications = await AdminNotificationModel.getNotifications({
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
        handleError(res, error, 'Failed to fetch admin notifications');
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await AdminNotificationModel.getUnreadCount({
            userId: req.user.userId
        });

        res.status(200).json({ success: true, unreadCount });
    } catch (error) {
        handleError(res, error, 'Failed to fetch admin unread count');
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

        const record = await AdminNotificationModel.markAsRead({
            userId: req.user.userId,
            sourceType,
            sourceId: numericSourceId
        });

        res.status(200).json({ success: true, record });
    } catch (error) {
        handleError(res, error, 'Failed to mark admin notification as read');
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const updated = await AdminNotificationModel.markAllAsRead({
            userId: req.user.userId
        });

        res.status(200).json({
            success: true,
            updatedCount: updated.length,
            updated
        });
    } catch (error) {
        handleError(res, error, 'Failed to mark admin notifications as read');
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
