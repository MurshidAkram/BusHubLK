const db = require('../config/db');

class CrewModel {
  // Get all crew (drivers + conductors) for a depot & region, with status
  static async getCrewByDepotRegion(depot_id, region_id) {
    // Drivers
    const drivers = await db.query(
      `SELECT d.driver_id AS person_id, 'Driver' AS role,
              u.first_name || ' ' || u.last_name AS name,
              u.phone AS contact,
              cs.status
       FROM drivers d
       JOIN users u ON d.driver_id = u.user_id
       LEFT JOIN crew_status cs ON cs.person_id = d.driver_id AND cs.role = 'Driver'
       WHERE d.depot_id = $1 AND d.region_id = $2`,
      [depot_id, region_id]
    );
    // Conductors
    const conductors = await db.query(
      `SELECT c.conductor_id AS person_id, 'Conductor' AS role,
              u.first_name || ' ' || u.last_name AS name,
              u.phone AS contact,
              cs.status
       FROM conductors c
       JOIN users u ON c.conductor_id = u.user_id
       LEFT JOIN crew_status cs ON cs.person_id = c.conductor_id AND cs.role = 'Conductor'
       WHERE c.depot_id = $1 AND c.region_id = $2`,
      [depot_id, region_id]
    );
    // Default status to 'Off Duty' if null
    const normalize = row => ({
      ...row,
      status: row.status || 'Off Duty'
    });
    return [...drivers.rows.map(normalize), ...conductors.rows.map(normalize)];
  }

  // Upsert status for a person
  static async upsertCrewStatus({ person_id, role, status }) {
    await db.query(
      `INSERT INTO crew_status (person_id, role, status, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (person_id, role)
       DO UPDATE SET status = $3, updated_at = NOW()`,
      [person_id, role, status]
    );
    return { person_id, role, status };
  }
}

module.exports = CrewModel;