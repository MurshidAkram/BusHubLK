const pool = require('../config/db');

const Emergency = {
    // No changes to findAll, findById, getMessagesByReportId, addMessage
    findAll: async (filters = {}) => {
        let query = `
                    SELECT
                        er.id, er.driver_id, er.bus_id, er.assignment_id, er.incident_type,
                        er.description, er.latitude, er.longitude, er.status, er.created_at,
                        u.first_name || ' ' || u.last_name AS driver_name,
                        u.phone AS driver_phone,
                        b.registration_number AS vehicle_registration,
                        d.depot_id,
                        d.depot_name,
                        r.region_id,
                        r.region_name
                    FROM emergency_reports er
                    LEFT JOIN users u ON er.driver_id = u.user_id
                    LEFT JOIN buses b ON er.bus_id = b.bus_id
                    LEFT JOIN depots d ON b.depot_id = d.depot_id
                    LEFT JOIN regions r ON d.region_id = r.region_id
                `;
        const whereClauses = [];
        const queryParams = [];
        if (filters.type && filters.type !== 'All Types') {
            queryParams.push(filters.type);
            whereClauses.push(`er.incident_type = $${queryParams.length}`);
        }
        if (filters.search) {
            queryParams.push(`%${filters.search}%`);
            const searchIndex = queryParams.length;
            whereClauses.push(`(er.id::text ILIKE $${searchIndex} OR u.first_name ILIKE $${searchIndex} OR u.last_name ILIKE $${searchIndex} OR b.registration_number ILIKE $${searchIndex})`);
        }
        if (filters.regionId && filters.regionId !== 'all') {
            queryParams.push(parseInt(filters.regionId, 10));
            whereClauses.push(`d.region_id = $${queryParams.length}`);
        }
        if (filters.depotId && filters.depotId !== 'all') {
            queryParams.push(parseInt(filters.depotId, 10));
            whereClauses.push(`d.depot_id = $${queryParams.length}`);
        }
        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }
        query += ' ORDER BY er.created_at DESC';
        const { rows } = await pool.query(query, queryParams);
        return rows;
    },

    findById: async (reportId) => {
        const reportQuery = `
            SELECT
                er.*, u.first_name || ' ' || u.last_name AS driver_name,
                u.phone AS driver_phone,
                b.registration_number AS vehicle_registration
            FROM emergency_reports er
            LEFT JOIN users u ON er.driver_id = u.user_id
            LEFT JOIN buses b ON er.bus_id = b.bus_id
            WHERE er.id = $1
        `;
        const messagesQuery = 'SELECT * FROM emergency_messages WHERE report_id = $1 ORDER BY created_at ASC';
        const reportResult = await pool.query(reportQuery, [reportId]);
        const messagesResult = await pool.query(messagesQuery, [reportId]);
        if (reportResult.rows.length === 0) {
            return null;
        }
        const report = reportResult.rows[0];
        report.messages = messagesResult.rows;
        return report;
    },

    getMessagesByReportId: async (reportId) => {
        const { rows } = await pool.query('SELECT * FROM emergency_messages WHERE report_id = $1 ORDER BY created_at ASC', [reportId]);
        return rows;
    },

    addMessage: async (report_id, sender_type, text) => {
        const query = {
            text: 'INSERT INTO emergency_messages(report_id, sender_type, text, created_at) VALUES($1, $2, $3, NOW()) RETURNING *',
            values: [report_id, sender_type, text],
        };
        const { rows } = await pool.query(query);
        return rows[0];
    },

    // Manager chat functions (depot engineer <-> depot manager)
    addManagerMessage: async (report_id, sender_type, text) => {
        const query = {
            text: 'INSERT INTO manager_chats(report_id, sender_type, text, created_at) VALUES($1, $2, $3, NOW()) RETURNING *',
            values: [report_id, sender_type, text],
        };
        const { rows } = await pool.query(query);
        return rows[0];
    },

    getManagerChat: async (reportId) => {
        const query = {
            text: `SELECT * FROM manager_chats WHERE report_id = $1 ORDER BY created_at ASC`,
            values: [reportId],
        };
        const { rows } = await pool.query(query);
        return rows;
    },

    // RTO-Manager chat functions (depot manager <-> RTO)
    addRTOManagerMessage: async (report_id, sender_type, text) => {
        const query = {
            text: 'INSERT INTO rto_manager_chats(report_id, sender_type, text, created_at) VALUES($1, $2, $3, $4) RETURNING *',
            values: [report_id, sender_type, text, new Date()],
        };
        const { rows } = await pool.query(query);
        return rows[0];
    },

    getRTOManagerChat: async (reportId) => {
        const query = {
            text: `SELECT * FROM rto_manager_chats WHERE report_id = $1 ORDER BY created_at ASC`,
            values: [reportId],
        };
        const { rows } = await pool.query(query);
        return rows;
    },

    // No changes to updateStatus or getStatistics for depot operator
    updateStatus: async (reportId, status) => {
        const query = {
            text: 'UPDATE emergency_reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            values: [status, reportId],
        };
        const { rows } = await pool.query(query);
        return rows[0];
    },

    getStatistics: async (filters = {}) => {
        let query = `
                    SELECT
                        COUNT(*) AS total,
                        COUNT(*) FILTER (WHERE LOWER(er.status) = 'new' OR LOWER(er.status) = 'in progress') AS in_progress,
                        COUNT(*) FILTER (WHERE LOWER(er.status) = 'resolved') AS resolved,
                        COUNT(*) FILTER (WHERE LOWER(er.status) = 'pending') AS pending,
                        COUNT(*) FILTER (WHERE LOWER(er.status) = 'escalated to depot manager') AS escalated
                    FROM emergency_reports er
                    LEFT JOIN buses b ON er.bus_id = b.bus_id
                    LEFT JOIN depots d ON b.depot_id = d.depot_id
                    LEFT JOIN regions r ON d.region_id = r.region_id
                `;

        const whereClauses = [];
        const queryParams = [];

        if (filters.regionId && filters.regionId !== 'all') {
            queryParams.push(parseInt(filters.regionId, 10));
            whereClauses.push(`d.region_id = $${queryParams.length}`);
        }

        if (filters.depotId && filters.depotId !== 'all') {
            queryParams.push(parseInt(filters.depotId, 10));
            whereClauses.push(`d.depot_id = $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        const { rows } = await pool.query(query, queryParams);
        const stats = rows[0];
        for (const key in stats) {
            stats[key] = parseInt(stats[key], 10);
        }
        return stats;
    },

    // --- MODIFIED: Renamed findEscalated and updated the query --- //
    /**
     * Finds all reports for the manager dashboard, including those being reviewed,
     * those with action taken, and those that have been resolved by the manager.
     */
    findAllForManager: async () => {
        // This function remains unchanged from our last fix
        const query = `
          SELECT 
            er.id, er.driver_id, er.bus_id, er.incident_type, er.description,
            er.latitude, er.longitude, er.status, er.created_at,
            u.first_name || ' ' || u.last_name AS driver_name,
            u.phone AS driver_phone,
            b.registration_number AS vehicle_registration
          FROM emergency_reports er
          LEFT JOIN users u ON er.driver_id = u.user_id
          LEFT JOIN buses b ON er.bus_id = b.bus_id
          WHERE er.status IN ('Escalated to Depot Manager', 'Action Taken', 'Resolved', 'Escalated to RTO')
          ORDER BY er.created_at DESC
        `;
        const { rows } = await pool.query(query);
        return rows;
    },

    /**
     * Finds all reports escalated to RTO for the RTO dashboard
     */
    findAllForRTO: async (regionId = null) => {
        const conditions = [];
        const params = [];

        if (regionId) {
            params.push(regionId);
            conditions.push(`d.region_id = $${params.length}`);
        }

        const regionFilter = conditions.length ? ` AND ${conditions.join(' AND ')}` : '';

        const query = `
                    SELECT 
                        er.id,
                        er.driver_id,
                        er.bus_id,
                        er.incident_type,
                        er.description,
                        er.latitude,
                        er.longitude,
                        er.status,
                        er.created_at,
                        u.first_name || ' ' || u.last_name AS driver_name,
                        u.phone AS driver_phone,
                        b.registration_number AS vehicle_registration,
                        d.depot_id,
                        d.depot_name,
                        r.region_id,
                        r.region_name
                    FROM emergency_reports er
                    LEFT JOIN users u ON er.driver_id = u.user_id
                    LEFT JOIN buses b ON er.bus_id = b.bus_id
                    LEFT JOIN depots d ON b.depot_id = d.depot_id
                    LEFT JOIN regions r ON d.region_id = r.region_id
                    WHERE (
                            er.status = 'Escalated to RTO'
                            OR (
                                er.status IN ('In Progress', 'Resolved') AND (
                                    EXISTS (SELECT 1 FROM manager_chats mc WHERE mc.report_id = er.id)
                                    OR
                                    EXISTS (SELECT 1 FROM rto_manager_chats rmc WHERE rmc.report_id = er.id)
                                )
                            )
                        )
                        ${regionFilter}
                    ORDER BY er.created_at DESC
                `;
        const { rows } = await pool.query(query, params);
        return rows;
    },
    // --- NEW: A dedicated statistics function for the Manager Dashboard --- //
    getManagerStatistics: async () => {
        // ... this function remains unchanged ...
        const query = `
          SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'Escalated to Depot Manager') AS reviewing,
            COUNT(*) FILTER (WHERE status = 'Action Taken') AS "actionTaken",
            COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved
          FROM emergency_reports
          WHERE status IN ('Escalated to Depot Manager', 'Action Taken', 'Resolved');
        `;
        const { rows } = await pool.query(query);
        const stats = rows[0];
        for (const key in stats) {
            stats[key] = parseInt(stats[key], 10);
        }
        return stats;
    },
};

module.exports = Emergency;