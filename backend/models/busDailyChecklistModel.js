const db = require('../config/db');

const CHECKLIST_PARTS = [
    { key: 'engine', label: 'Engine' },
    { key: 'brakes', label: 'Brakes' },
    { key: 'tires', label: 'Tires' },
    { key: 'windows', label: 'Windows' },
    { key: 'doors', label: 'Doors' },
    { key: 'headlights', label: 'Head Lights' },
    { key: 'signallights', label: 'Signal Lights' }
];

const PART_KEY_SET = new Set(CHECKLIST_PARTS.map((part) => part.key));
const ALLOWED_SEVERITIES = new Set(['low', 'medium', 'high']);

const buildDefaultPartState = () => {
    const state = {};
    CHECKLIST_PARTS.forEach((part) => {
        state[part.key] = {
            hasIssue: false,
            notes: null,
            severity: null
        };
    });
    return state;
};

const normalisePartInput = (partsInput = []) => {
    const state = buildDefaultPartState();

    if (!Array.isArray(partsInput)) {
        return state;
    }

    partsInput.forEach((rawPart) => {
        if (!rawPart) {
            return;
        }

        let key = typeof rawPart.key === 'string' ? rawPart.key.trim().toLowerCase() : '';

        if (key === 'turn_signals' || key === 'turnsignals' || key === 'signal_lights') {
            key = 'signallights';
        }

        if (key === 'lights' || key === 'head_lights' || key === 'head-light' || key === 'head-lighting') {
            key = 'headlights';
        }

        if (!PART_KEY_SET.has(key)) {
            return;
        }

        const hasIssue = Boolean(rawPart.hasIssue);
        const notes = hasIssue && typeof rawPart.notes === 'string' && rawPart.notes.trim().length > 0
            ? rawPart.notes.trim()
            : null;

        let severity = null;
        if (hasIssue) {
            const severitySource = typeof rawPart.severity === 'string'
                ? rawPart.severity
                : typeof rawPart.level === 'string'
                    ? rawPart.level
                    : null;

            if (severitySource) {
                const normalisedSeverity = severitySource.trim().toLowerCase();
                if (ALLOWED_SEVERITIES.has(normalisedSeverity)) {
                    severity = normalisedSeverity;
                }
            }
        }

        state[key] = {
            hasIssue,
            notes,
            severity: hasIssue ? severity : null
        };
    });

    return state;
};

class BusDailyChecklist {
    static async #getPartsForChecklists(checklistIds) {
        if (!Array.isArray(checklistIds) || checklistIds.length === 0) {
            return new Map();
        }

        const query = `
            SELECT checklist_id, part_key, part_label, has_issue, notes, severity
            FROM busdailychecklist_parts
            WHERE checklist_id = ANY($1::int[])
            ORDER BY checklist_id, part_key
        `;

        const { rows } = await db.query(query, [checklistIds]);
        const partsByChecklist = new Map();

        rows.forEach((row) => {
            if (!partsByChecklist.has(row.checklist_id)) {
                partsByChecklist.set(row.checklist_id, []);
            }

            partsByChecklist.get(row.checklist_id).push({
                part_key: row.part_key,
                part_label: row.part_label,
                has_issue: row.has_issue,
                notes: row.notes,
                severity: row.severity
            });
        });

        return partsByChecklist;
    }

    static async create(checklistData) {
        return this.upsertForToday(checklistData);
    }

    static async update(bus_id, date, checklistData) {
        return this.upsertForToday({ bus_id, ...checklistData });
    }

    static async upsertForToday({ bus_id, checker_id, status_after_check, parts }) {
        const client = await db.connect();
        const partState = normalisePartInput(parts);

        const engine = partState.engine.hasIssue;
        const brakes = partState.brakes.hasIssue;
        const tires = partState.tires.hasIssue;
        const windows = partState.windows.hasIssue;
        const doors = partState.doors.hasIssue;
        const headlights = partState.headlights.hasIssue;
        const signallights = partState.signallights.hasIssue;

        const values = [
            bus_id,
            checker_id,
            engine,
            brakes,
            tires,
            windows,
            doors,
            headlights,
            signallights,
            status_after_check || null
        ];

        const insertChecklistQuery = `
            INSERT INTO busdailychecklists (
                bus_id,
                checker_id,
                engine,
                brakes,
                tires,
                windows,
                doors,
                headlights,
                signallights,
                status_after_check
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (bus_id, check_date)
            DO UPDATE SET
                checker_id = EXCLUDED.checker_id,
                engine = EXCLUDED.engine,
                brakes = EXCLUDED.brakes,
                tires = EXCLUDED.tires,
                windows = EXCLUDED.windows,
                doors = EXCLUDED.doors,
                headlights = EXCLUDED.headlights,
                signallights = EXCLUDED.signallights,
                status_after_check = EXCLUDED.status_after_check,
                updated_at = CURRENT_TIMESTAMP
            RETURNING checklist_id
        `;

        try {
            await client.query('BEGIN');

            const checklistResult = await client.query(insertChecklistQuery, values);
            const checklistId = checklistResult.rows[0].checklist_id;

            await client.query('DELETE FROM busdailychecklist_parts WHERE checklist_id = $1', [checklistId]);

            const partsValues = [];
            const placeholders = [];

            CHECKLIST_PARTS.forEach((part, index) => {
                const state = partState[part.key];
                partsValues.push(
                    checklistId,
                    part.key,
                    part.label,
                    state.hasIssue,
                    state.notes,
                    state.severity
                );
                const offset = index * 6;
                placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
            });

            if (partsValues.length > 0) {
                const insertPartsQuery = `
                    INSERT INTO busdailychecklist_parts (checklist_id, part_key, part_label, has_issue, notes, severity)
                    VALUES ${placeholders.join(', ')}
                `;
                await client.query(insertPartsQuery, partsValues);
            }

            await client.query('COMMIT');

            return {
                checklist_id: checklistId,
                parts: partState
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Get checklist by bus_id and date
    static async getByBusAndDate(bus_id, date) {
        const query = `
            SELECT * FROM busdailychecklists 
            WHERE bus_id = $1 AND check_date = $2
        `;
        const result = await db.query(query, [bus_id, date]);
        const checklist = result.rows[0];

        if (!checklist) {
            return null;
        }

        const parts = await BusDailyChecklist.#getPartsForChecklists([checklist.checklist_id]);
        checklist.parts = parts.get(checklist.checklist_id) || [];

        return checklist;
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

        const rows = result.rows;
        if (rows.length === 0) {
            return rows;
        }

        const checklistIds = rows.map((row) => row.checklist_id);
        const parts = await BusDailyChecklist.#getPartsForChecklists(checklistIds);

        rows.forEach((row) => {
            row.parts = parts.get(row.checklist_id) || [];
        });

        return rows;
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
        const rows = result.rows;

        if (rows.length === 0) {
            return rows;
        }

        const checklistIds = rows.map((row) => row.checklist_id);
        const parts = await BusDailyChecklist.#getPartsForChecklists(checklistIds);

        rows.forEach((row) => {
            row.parts = parts.get(row.checklist_id) || [];
        });

        return rows;
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

BusDailyChecklist.partDefinitions = CHECKLIST_PARTS;

module.exports = BusDailyChecklist;
