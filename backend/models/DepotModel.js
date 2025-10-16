const db = require('../config/db');

class Depot {
  static async findById(depot_id) {
    const result = await db.query(
      `SELECT depot_id, depot_name, address, contact_phone, region_id, created_at, updated_at
       FROM depots WHERE depot_id = $1`,
      [depot_id]
    );
    return result.rows[0];
  }

  static async update(depot_id, { depot_name, address, contact_phone }) {
    const result = await db.query(
      `UPDATE depots
       SET depot_name = $1, address = $2, contact_phone = $3, updated_at = CURRENT_TIMESTAMP
       WHERE depot_id = $4
       RETURNING depot_id, depot_name, address, contact_phone, region_id, created_at, updated_at`,
      [depot_name, address, contact_phone, depot_id]
    );
    return result.rows[0];
  }

  static async getBusCount(depot_id) {
    const result = await db.query(
      `SELECT COUNT(*) AS bus_count FROM buses WHERE depot_id = $1 AND is_active = TRUE AND is_deleted = FALSE`,
      [depot_id]
    );
    return parseInt(result.rows[0].bus_count, 10);
  }
}

module.exports = Depot;