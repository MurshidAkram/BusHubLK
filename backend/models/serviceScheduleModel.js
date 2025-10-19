const db = require('../config/db');

class ServiceSchedule {
    // Create a new service schedule
    static async create({ service_type, bus_id, scheduled_date, depot_id }) {
        const result = await db.query(
            `INSERT INTO service_schedules 
       (service_type, bus_id, scheduled_date, depot_id, status)
       VALUES ($1, $2, $3, $4, 'Pending')
       RETURNING *`,
            [service_type, bus_id, scheduled_date, depot_id]
        );
        return result.rows[0];
    }

    // Get service schedule by ID (includes deleted records for admin purposes)
    static async findById(id) {
        const result = await db.query(
            `SELECT ss.id, ss.service_type, ss.bus_id, ss.depot_id, ss.status,
                    TO_CHAR(ss.scheduled_date, 'YYYY-MM-DD') as scheduled_date,
                    TO_CHAR(ss.completed_date, 'YYYY-MM-DD') as completed_date,
                    TO_CHAR(ss.cancelled_date, 'YYYY-MM-DD') as cancelled_date,
                    ss.created_at, ss.updated_at,
                    b.registration_number, b.manufacturer, b.model,
                    d.depot_name,
                    COALESCE(ss.is_deleted, false) as is_deleted
       FROM service_schedules ss
       LEFT JOIN buses b ON ss.bus_id = b.bus_id
       LEFT JOIN depots d ON ss.depot_id = d.depot_id
       WHERE ss.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Get all service schedules for a depot (excluding deleted)
    static async getByDepot(depot_id, include_deleted = false) {
        let query = `
      SELECT ss.id, ss.service_type, ss.bus_id, ss.depot_id, ss.status,
             TO_CHAR(ss.scheduled_date, 'YYYY-MM-DD') as scheduled_date,
             TO_CHAR(ss.completed_date, 'YYYY-MM-DD') as completed_date,
             TO_CHAR(ss.cancelled_date, 'YYYY-MM-DD') as cancelled_date,
             ss.created_at, ss.updated_at,
             b.registration_number, b.manufacturer, b.model,
             d.depot_name,
             COALESCE(ss.is_deleted, false) as is_deleted
      FROM service_schedules ss
      LEFT JOIN buses b ON ss.bus_id = b.bus_id
      LEFT JOIN depots d ON ss.depot_id = d.depot_id
      WHERE ss.depot_id = $1`;

        if (!include_deleted) {
            query += ` AND (ss.is_deleted = false OR ss.is_deleted IS NULL)`;
        }

        query += ` ORDER BY ss.scheduled_date ASC, ss.created_at DESC`;

        const result = await db.query(query, [depot_id]);
        return result.rows;
    }

    // Get all service schedules for a specific bus (excluding deleted)
    static async getByBusId(bus_id, include_deleted = false) {
        let query = `
      SELECT ss.id, ss.service_type, ss.bus_id, ss.depot_id, ss.status,
             TO_CHAR(ss.scheduled_date, 'YYYY-MM-DD') as scheduled_date,
             TO_CHAR(ss.completed_date, 'YYYY-MM-DD') as completed_date,
             TO_CHAR(ss.cancelled_date, 'YYYY-MM-DD') as cancelled_date,
             ss.created_at, ss.updated_at,
             b.registration_number, b.manufacturer, b.model,
             d.depot_name,
             COALESCE(ss.is_deleted, false) as is_deleted
      FROM service_schedules ss
      LEFT JOIN buses b ON ss.bus_id = b.bus_id
      LEFT JOIN depots d ON ss.depot_id = d.depot_id
      WHERE ss.bus_id = $1`;

        if (!include_deleted) {
            query += ` AND (ss.is_deleted = false OR ss.is_deleted IS NULL)`;
        }

        query += ` ORDER BY ss.scheduled_date DESC, ss.created_at DESC`;

        const result = await db.query(query, [bus_id]);
        return result.rows;
    }

    // Get all service schedules (admin view)
    static async getAll() {
        const result = await db.query(
            `SELECT ss.id, ss.service_type, ss.bus_id, ss.depot_id, ss.status,
                    TO_CHAR(ss.scheduled_date, 'YYYY-MM-DD') as scheduled_date,
                    TO_CHAR(ss.completed_date, 'YYYY-MM-DD') as completed_date,
                    TO_CHAR(ss.cancelled_date, 'YYYY-MM-DD') as cancelled_date,
                    ss.created_at, ss.updated_at,
                    b.registration_number, b.manufacturer, b.model,
                    d.depot_name
       FROM service_schedules ss
       LEFT JOIN buses b ON ss.bus_id = b.bus_id
       LEFT JOIN depots d ON ss.depot_id = d.depot_id
       ORDER BY ss.scheduled_date ASC, ss.created_at DESC`
        );
        return result.rows;
    }

    // Get service schedules for a specific date and depot
    static async getByDateAndDepot(depot_id, date) {
        const result = await db.query(
            `SELECT ss.id, ss.service_type, ss.bus_id, ss.depot_id, ss.status,
                    TO_CHAR(ss.scheduled_date, 'YYYY-MM-DD') as scheduled_date,
                    TO_CHAR(ss.completed_date, 'YYYY-MM-DD') as completed_date,
                    TO_CHAR(ss.cancelled_date, 'YYYY-MM-DD') as cancelled_date,
                    ss.created_at, ss.updated_at,
                    b.registration_number, b.manufacturer, b.model,
                    d.depot_name
       FROM service_schedules ss
       LEFT JOIN buses b ON ss.bus_id = b.bus_id
       LEFT JOIN depots d ON ss.depot_id = d.depot_id
       WHERE ss.depot_id = $1 AND ss.scheduled_date = $2 
             AND (ss.is_deleted = false OR ss.is_deleted IS NULL)
       ORDER BY ss.created_at DESC`,
            [depot_id, date]
        );
        return result.rows;
    }

    static async findActiveByBusAndDate(bus_id, date) {
        const result = await db.query(
            `SELECT ss.id, ss.service_type, ss.bus_id, ss.depot_id, ss.status,
                    TO_CHAR(ss.scheduled_date, 'YYYY-MM-DD') as scheduled_date,
                    TO_CHAR(ss.completed_date, 'YYYY-MM-DD') as completed_date,
                    TO_CHAR(ss.cancelled_date, 'YYYY-MM-DD') as cancelled_date,
                    ss.created_at, ss.updated_at,
                    COALESCE(ss.is_deleted, false) as is_deleted
       FROM service_schedules ss
       WHERE ss.bus_id = $1
         AND ss.scheduled_date = $2
         AND (ss.is_deleted = false OR ss.is_deleted IS NULL)
       ORDER BY ss.created_at DESC
       LIMIT 1`,
            [bus_id, date]
        );
        return result.rows[0];
    }

    static async getByBusAndDate(bus_id, date) {
        const result = await db.query(
            `SELECT ss.id, ss.service_type, ss.bus_id, ss.depot_id, ss.status,
                    TO_CHAR(ss.scheduled_date, 'YYYY-MM-DD') as scheduled_date,
                    TO_CHAR(ss.completed_date, 'YYYY-MM-DD') as completed_date,
                    TO_CHAR(ss.cancelled_date, 'YYYY-MM-DD') as cancelled_date,
                    ss.created_at, ss.updated_at,
                    COALESCE(ss.is_deleted, false) as is_deleted
       FROM service_schedules ss
       WHERE ss.bus_id = $1
         AND ss.scheduled_date = $2
         AND (ss.is_deleted = false OR ss.is_deleted IS NULL)
       ORDER BY ss.created_at DESC`,
            [bus_id, date]
        );
        return result.rows;
    }

    static async getActiveAutoFollowUps(bus_id) {
        const result = await db.query(
            `SELECT ss.id, ss.service_type, ss.bus_id, ss.depot_id, ss.status,
                    TO_CHAR(ss.scheduled_date, 'YYYY-MM-DD') as scheduled_date,
                    ss.created_at, ss.updated_at
       FROM service_schedules ss
       WHERE ss.bus_id = $1
         AND (ss.is_deleted = false OR ss.is_deleted IS NULL)
         AND ss.status <> 'Completed'
         AND LOWER(ss.service_type) LIKE 'auto follow-up:%'
       ORDER BY ss.created_at DESC`,
            [bus_id]
        );
        return result.rows;
    }

    static async countOutstandingAutoFollowUps(bus_id) {
        const result = await db.query(
            `SELECT COUNT(*)::int AS count
       FROM service_schedules ss
       WHERE ss.bus_id = $1
         AND (ss.is_deleted = false OR ss.is_deleted IS NULL)
         AND ss.status <> 'Completed'
         AND LOWER(ss.service_type) LIKE 'auto follow-up:%'`,
            [bus_id]
        );
        return result.rows[0]?.count || 0;
    }

    static async countOutstandingManualSchedules(bus_id) {
        const result = await db.query(
            `SELECT COUNT(*)::int AS count
       FROM service_schedules ss
       WHERE ss.bus_id = $1
         AND (ss.is_deleted = false OR ss.is_deleted IS NULL)
         AND ss.status <> 'Completed'
         AND (ss.service_type IS NULL OR LOWER(ss.service_type) NOT LIKE 'auto follow-up:%')`,
            [bus_id]
        );
        return result.rows[0]?.count || 0;
    }

    // Update service schedule
    static async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        // Build dynamic update query
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(updates[key]);
                paramCount++;
            }
        });

        // Always update updated_at
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const query = `
      UPDATE service_schedules 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *`;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // Start work on a service (change status to In Progress)
    static async startWork(id) {
        console.log(`🔧 ServiceSchedule.startWork called for ID: ${id}`);

        const result = await db.query(
            `UPDATE service_schedules 
       SET status = 'In Progress', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status IN ('Pending', 'Due Today', 'Overdue', 'Critical Overdue')
       RETURNING *`,
            [id]
        );

        console.log(`📊 Update query affected ${result.rowCount} rows`);
        if (result.rows[0]) {
            console.log(`✅ Status updated to: ${result.rows[0].status}`);
        } else {
            console.log(`❌ No rows updated - schedule may not exist or status not eligible for start work`);
        }

        return result.rows[0];
    }

    // Complete a service
    static async complete(id) {
        const result = await db.query(
            `UPDATE service_schedules 
       SET status = 'Completed', completed_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'In Progress'
       RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    // Cancel a service (soft delete using is_deleted column) - allows Pending, Due Today, Overdue, Critical Overdue
    static async cancel(id) {
        console.log(`🗑️  ServiceSchedule.cancel called for ID: ${id}`);

        const result = await db.query(
            `UPDATE service_schedules 
       SET is_deleted = true, cancelled_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status IN ('Pending', 'Due Today', 'Overdue', 'Critical Overdue')
             AND (is_deleted = false OR is_deleted IS NULL)
       RETURNING *`,
            [id]
        );

        console.log(`📊 Cancel query affected ${result.rowCount} rows`);
        if (result.rows[0]) {
            console.log(`✅ Service soft deleted successfully. is_deleted: ${result.rows[0].is_deleted}`);
        } else {
            console.log(`❌ No rows updated - service may not exist or status not eligible for cancellation`);
        }

        return result.rows[0];
    }

    // Restore a soft deleted service (undelete using is_deleted column)
    static async restore(id) {
        console.log(`♻️  ServiceSchedule.restore called for ID: ${id}`);

        const result = await db.query(
            `UPDATE service_schedules 
       SET is_deleted = false, cancelled_date = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND is_deleted = true
       RETURNING *`,
            [id]
        );

        console.log(`📊 Restore query affected ${result.rowCount} rows`);
        if (result.rows[0]) {
            console.log(`✅ Service restored successfully. is_deleted: ${result.rows[0].is_deleted}`);
        } else {
            console.log(`❌ No rows updated - service may not exist or not deleted`);
        }

        return result.rows[0];
    }

    // Get depot statistics
    static async getDepotStats(depot_id) {
        const result = await db.query(
            `SELECT 
         COUNT(*) FILTER (WHERE is_deleted = false OR is_deleted IS NULL) as total_services,
         COUNT(*) FILTER (WHERE status = 'Pending' AND (is_deleted = false OR is_deleted IS NULL)) as pending_count,
         COUNT(*) FILTER (WHERE status = 'Due Today' AND (is_deleted = false OR is_deleted IS NULL)) as due_today_count,
         COUNT(*) FILTER (WHERE status = 'In Progress' AND (is_deleted = false OR is_deleted IS NULL)) as in_progress_count,
         COUNT(*) FILTER (WHERE status = 'Completed' AND (is_deleted = false OR is_deleted IS NULL)) as completed_count,
         COUNT(*) FILTER (WHERE status = 'Overdue' AND (is_deleted = false OR is_deleted IS NULL)) as overdue_count,
         COUNT(*) FILTER (WHERE status = 'Critical Overdue' AND (is_deleted = false OR is_deleted IS NULL)) as critical_overdue_count,
         COUNT(*) FILTER (WHERE is_deleted = true) as cancelled_count
       FROM service_schedules 
       WHERE depot_id = $1`,
            [depot_id]
        );
        return result.rows[0];
    }

    // Calculate smart status based on date (for frontend logic)
    static calculateStatus(scheduled_date, current_status, is_deleted = false) {
        // If soft deleted, return 'Cancelled'
        if (is_deleted === true) {
            return 'Cancelled';
        }

        // Don't change if manually set to In Progress or Completed
        if (current_status === 'In Progress' || current_status === 'Completed') {
            return current_status;
        }

        const scheduleDate = new Date(scheduled_date);
        const today = new Date();
        scheduleDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today.getTime() - scheduleDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Pending';
        if (diffDays === 0) return 'Due Today';
        if (diffDays <= 3) return 'Overdue';
        if (diffDays <= 7) return 'Critical Overdue';
        return 'Critical Overdue'; // Keep as Critical Overdue for very old items
    }

    // Update statuses automatically based on dates (excluding soft deleted)
    static async updateAutomaticStatuses(depot_id = null) {
        let query = `
            UPDATE service_schedules 
            SET status = CASE 
                WHEN scheduled_date = CURRENT_DATE AND status = 'Pending' THEN 'Due Today'
                WHEN scheduled_date < CURRENT_DATE AND status IN ('Pending', 'Due Today') AND 
                     (CURRENT_DATE - scheduled_date) <= 3 THEN 'Overdue'
                WHEN scheduled_date < CURRENT_DATE AND status IN ('Pending', 'Due Today', 'Overdue') AND 
                     (CURRENT_DATE - scheduled_date) > 3 THEN 'Critical Overdue'
                ELSE status
            END,
            updated_at = CURRENT_TIMESTAMP
            WHERE status NOT IN ('In Progress', 'Completed') 
                  AND (is_deleted = false OR is_deleted IS NULL)`;

        const params = [];
        if (depot_id) {
            query += ` AND depot_id = $1`;
            params.push(depot_id);
        }

        query += ` RETURNING id, status, scheduled_date`;

        const result = await db.query(query, params);
        return result.rows;
    }

    // Get schedules that need status updates (excluding soft deleted)
    static async getSchedulesNeedingStatusUpdate(depot_id = null) {
        let query = `
            SELECT id, scheduled_date, status, service_type, bus_id
            FROM service_schedules 
            WHERE status NOT IN ('In Progress', 'Completed') 
                  AND (is_deleted = false OR is_deleted IS NULL)
            AND (
                (scheduled_date = CURRENT_DATE AND status = 'Pending') OR
                (scheduled_date < CURRENT_DATE AND status IN ('Pending', 'Due Today', 'Overdue'))
            )`;

        const params = [];
        if (depot_id) {
            query += ` AND depot_id = $1`;
            params.push(depot_id);
        }

        query += ` ORDER BY scheduled_date ASC`;

        const result = await db.query(query, params);
        return result.rows;
    }

    // Delete service schedule (hard delete - admin only)
    static async delete(id) {
        const result = await db.query(
            `DELETE FROM service_schedules WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }
}

module.exports = ServiceSchedule;
