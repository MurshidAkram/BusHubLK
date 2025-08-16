const pool = require('../config/db');

class SpareParts {
    // Create new spare part
    static async create({ part_id, part_name, current_stock, unit, depot_id }) {
        const result = await pool.query(
            `INSERT INTO spare_parts_inventory 
       (part_id, part_name, current_stock, unit, depot_id, last_restocked)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
            [part_id, part_name, current_stock, unit, depot_id]
        );
        return result.rows[0];
    }

    // Find by part_id
    static async findByPartId(part_id, depot_id) {
        const result = await pool.query(
            `SELECT * FROM spare_parts_inventory 
       WHERE part_id = $1 AND depot_id = $2`,
            [part_id, depot_id]
        );
        return result.rows[0];
    }

    // Find all parts for depot
    static async findByDepot(depot_id) {
        const result = await pool.query(
            `SELECT 
        id,
        part_id,
        part_name,
        current_stock,
        unit,
        last_restocked,
        created_at,
        updated_at
       FROM spare_parts_inventory 
       WHERE depot_id = $1
       ORDER BY part_name ASC`,
            [depot_id]
        );
        return result.rows;
    }

    // Update stock
    static async updateStock(part_id, depot_id, current_stock) {
        const result = await pool.query(
            `UPDATE spare_parts_inventory 
       SET current_stock = $1, last_restocked = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE part_id = $2 AND depot_id = $3
       RETURNING *`,
            [current_stock, part_id, depot_id]
        );
        return result.rows[0];
    }

    // Reduce stock (when using parts)
    static async reduceStock(part_id, depot_id, quantity_used) {
        const result = await pool.query(
            `UPDATE spare_parts_inventory 
       SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP
       WHERE part_id = $2 AND depot_id = $3 AND current_stock >= $1
       RETURNING *`,
            [quantity_used, part_id, depot_id]
        );
        return result.rows[0];
    }

    // Get next part ID
    static async getNextPartId() {
        const result = await pool.query(
            `SELECT 
        CONCAT('P-', LPAD((COALESCE(MAX(CAST(SUBSTRING(part_id, 3) AS INTEGER)), 0) + 1)::TEXT, 2, '0')) as next_part_id
       FROM spare_parts_inventory`
        );
        return result.rows[0].next_part_id;
    }

    // Check if part exists
    static async exists(part_id) {
        const result = await pool.query(
            `SELECT COUNT(*) as count FROM spare_parts_inventory WHERE part_id = $1`,
            [part_id]
        );
        return parseInt(result.rows[0].count) > 0;
    }

    // Delete part (soft delete could be added later)
    static async delete(part_id, depot_id) {
        const result = await pool.query(
            `DELETE FROM spare_parts_inventory 
       WHERE part_id = $1 AND depot_id = $2
       RETURNING *`,
            [part_id, depot_id]
        );
        return result.rows[0];
    }
}

module.exports = SpareParts;
