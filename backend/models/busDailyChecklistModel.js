const db = require('../config/db');

class BusDailyChecklist {
    // Create a new daily checklist
    static async create(checklistData) {
        const {
            bus_id,
            checker_id,
            engine,
            brakes,
            tires,
            windows,
            doors,
            lights,
            turn_signals,
            fire_extinguisher,
            status_after_check
        } = checklistData;

        try {
            const query = `
                INSERT INTO busdailychecklists (
                    bus_id, checker_id, engine, brakes, tires, windows, doors, 
                    lights, turn_signals, fire_extinguisher, status_after_check
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const values = [
                bus_id, checker_id, engine, brakes, tires, windows, doors,
                lights, turn_signals, fire_extinguisher, status_after_check
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            // Handle duplicate checklist for same bus on same day
            if (error.code === '23505') { // PostgreSQL unique violation
                throw new Error('Daily checklist already exists for this bus today');
            }
            throw error;
        }
    }

    // Update existing checklist (if needed)
    static async update(bus_id, date, checklistData) {
        const {
            engine,
            brakes,
            tires,
            windows,
            doors,
            lights,
            turn_signals,
            fire_extinguisher,
            status_after_check
        } = checklistData;

        const query = `
            UPDATE busdailychecklists 
            SET engine = $3, brakes = $4, tires = $5, windows = $6, doors = $7,
                lights = $8, turn_signals = $9, fire_extinguisher = $10, 
                status_after_check = $11, updated_at = CURRENT_TIMESTAMP
            WHERE bus_id = $1 AND check_date = $2
            RETURNING *
        `;

        const values = [
            bus_id, date, engine, brakes, tires, windows, doors,
            lights, turn_signals, fire_extinguisher, status_after_check
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // Get checklist by bus_id and date
    static async getByBusAndDate(bus_id, date) {
        const query = `
            SELECT * FROM busdailychecklists 
            WHERE bus_id = $1 AND check_date = $2
        `;
        const result = await db.query(query, [bus_id, date]);
        return result.rows[0];
    }

    // Get all checklists for a specific bus
    static async getByBusId(bus_id) {
        const query = `
            SELECT bdc.*, u.first_name, u.last_name, b.registration_number
            FROM busdailychecklists bdc
            JOIN users u ON bdc.checker_id = u.user_id
            JOIN buses b ON bdc.bus_id = b.bus_id
            WHERE bdc.bus_id = $1
            ORDER BY bdc.check_date DESC
        `;
        const result = await db.query(query, [bus_id]);
        return result.rows;
    }

    // Get checklists for a depot (for depot manager/engineer overview)
    static async getByDepotId(depot_id, startDate = null, endDate = null) {
        let query = `
            SELECT bdc.*, u.first_name, u.last_name, b.registration_number, b.bus_id
            FROM busdailychecklists bdc
            JOIN users u ON bdc.checker_id = u.user_id
            JOIN buses b ON bdc.bus_id = b.bus_id
            WHERE b.depot_id = $1
        `;
        const values = [depot_id];

        if (startDate && endDate) {
            query += ` AND bdc.check_date BETWEEN $2 AND $3`;
            values.push(startDate, endDate);
        }

        query += ` ORDER BY bdc.check_date DESC, b.registration_number ASC`;

        const result = await db.query(query, values);
        return result.rows;
    }

    // Get today's incomplete checklists for a depot
    static async getTodayIncompleteByDepot(depot_id) {
        const query = `
            SELECT b.bus_id, b.registration_number, b.status
            FROM buses b
            LEFT JOIN busdailychecklists bdc ON b.bus_id = bdc.bus_id 
                AND bdc.check_date = CURRENT_DATE
            WHERE b.depot_id = $1 
                AND b.is_active = true 
                AND b.is_deleted = false
                AND bdc.checklist_id IS NULL
            ORDER BY b.registration_number ASC
        `;
        const result = await db.query(query, [depot_id]);
        return result.rows;
    }

    // Delete checklist (if needed)
    static async delete(checklist_id) {
        const query = `DELETE FROM busdailychecklists WHERE checklist_id = $1 RETURNING *`;
        const result = await db.query(query, [checklist_id]);
        return result.rows[0];
    }
}

module.exports = BusDailyChecklist;
