const DepotEngineerNotificationModel = require('../models/depotEngineerNotificationModel');
const User = require('../models/userModel');

const resolveDepotContext = async (user) => {
    const details = await User.getRoleSpecificDetails(user.userId, user.role);
    if (!details || !details.depot_id || !details.region_id) {
        const error = new Error('Depot engineer depot or region not found');
        error.statusCode = 403;
        throw error;
    }

    return {
        depotId: details.depot_id,
        regionId: details.region_id
    };
};

const handleControllerError = (res, error, fallbackMessage) => {
    console.error('Depot engineer notification error:', error);
    const status = error.statusCode || 500;
    const message = error.message || fallbackMessage;
    res.status(status).json({ success: false, message });
};

const getNotifications = async (req, res) => {
    try {
        const { depotId, regionId } = await resolveDepotContext(req.user);

        const limit = Number(req.query.limit) > 0 ? Math.min(Number(req.query.limit), 200) : 100;
        const offset = Number(req.query.offset) >= 0 ? Number(req.query.offset) : 0;

        const includeRead = req.query.includeRead === 'true';

        const notifications = await DepotEngineerNotificationModel.getNotifications({
            userId: req.user.userId,
            depotId,
            regionId,
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
        handleControllerError(res, error, 'Failed to fetch depot engineer notifications');
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const { depotId, regionId } = await resolveDepotContext(req.user);

        const unreadCount = await DepotEngineerNotificationModel.getUnreadCount({
            userId: req.user.userId,
            depotId,
            regionId
        });

        res.status(200).json({ success: true, unreadCount });
    } catch (error) {
        handleControllerError(res, error, 'Failed to fetch unread count');
    }
};

const markAsRead = async (req, res) => {
    try {
        const { sourceType, sourceId } = req.body;

        if (!sourceType || !sourceId) {
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

        const { depotId, regionId } = await resolveDepotContext(req.user);

        const record = await DepotEngineerNotificationModel.markAsRead({
            userId: req.user.userId,
            sourceType,
            sourceId: numericSourceId,
            depotId,
            regionId
        });

        res.status(200).json({ success: true, record });
    } catch (error) {
        handleControllerError(res, error, 'Failed to mark notification as read');
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const { depotId, regionId } = await resolveDepotContext(req.user);

        const updated = await DepotEngineerNotificationModel.markAllAsRead({
            userId: req.user.userId,
            depotId,
            regionId
        });

        res.status(200).json({
            success: true,
            updatedCount: updated.length,
            updated
        });
    } catch (error) {
        handleControllerError(res, error, 'Failed to mark notifications as read');
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
