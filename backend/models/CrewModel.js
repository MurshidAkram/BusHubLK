const db = require('../config/db');

class CrewModel {
  // Get all crew (drivers + conductors) for a depot & region, with status
  static async getCrewByDepotRegion(depot_id, region_id) {
    // Today's date
    const today = new Date();
    const localDateString = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    // Drivers
    const drivers = await db.query(
      `SELECT d.driver_id AS person_id, 'Driver' AS role,
              u.first_name || ' ' || u.last_name AS name,
              u.phone AS contact,
              d.depot_id,           -- <-- ADD THIS LINE
              cs.status,
              EXISTS (
                SELECT 1 FROM dailyassignment da
                WHERE da.driver_id = d.driver_id
                  AND da.assignment_date = $3
                  AND da.is_active = TRUE
              ) AS assigned_today
       FROM drivers d
       JOIN users u ON d.driver_id = u.user_id
       LEFT JOIN crew_status cs ON cs.person_id = d.driver_id AND cs.role = 'Driver'
       WHERE d.depot_id = $1 AND d.region_id = $2`,
      [depot_id, region_id, localDateString]
    );
    // Conductors
    const conductors = await db.query(
      `SELECT c.conductor_id AS person_id, 'Conductor' AS role,
              u.first_name || ' ' || u.last_name AS name,
              u.phone AS contact,
              c.depot_id,           -- <-- ADD THIS LINE
              cs.status,
              EXISTS (
                SELECT 1 FROM dailyassignment da
                WHERE da.conductor_id = c.conductor_id
                  AND da.assignment_date = $3
                  AND da.is_active = TRUE
              ) AS assigned_today
       FROM conductors c
       JOIN users u ON c.conductor_id = u.user_id
       LEFT JOIN crew_status cs ON cs.person_id = c.conductor_id AND cs.role = 'Conductor'
       WHERE c.depot_id = $1 AND c.region_id = $2`,
      [depot_id, region_id, localDateString]
    );
    const normalize = row => ({
      ...row,
      status: row.status || 'On Duty',
      assigned_today: row.assigned_today
    });
    return [...drivers.rows.map(normalize), ...conductors.rows.map(normalize)];
  }

  // Upsert status for a person
  static async upsertCrewStatus({ person_id, role, status }) {
    // Only allow "On Duty" or "On Break"
    if (!['On Duty', 'On Break'].includes(status)) {
      throw new Error('Invalid status');
    }
    await db.query(
      `INSERT INTO crew_status (person_id, role, status, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (person_id, role)
       DO UPDATE SET status = $3, updated_at = NOW()`,
      [person_id, role, status]
    );
    return { person_id, role, status };
  }

  static async getAllCrew() {
    // Query all drivers and conductors, regardless of region/depot
    const today = new Date();
    const localDateString = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    const drivers = await db.query(
      `SELECT d.driver_id AS person_id, 'Driver' AS role,
              u.first_name || ' ' || u.last_name AS name,
              u.phone AS contact,
              d.depot_id,
              d.region_id,
              cs.status,
              EXISTS (
                SELECT 1 FROM dailyassignment da
                WHERE da.driver_id = d.driver_id
                  AND da.assignment_date = $1
                  AND da.is_active = TRUE
              ) AS assigned_today
       FROM drivers d
       JOIN users u ON d.driver_id = u.user_id
       LEFT JOIN crew_status cs ON cs.person_id = d.driver_id AND cs.role = 'Driver'`,
      [localDateString]
    );
    const conductors = await db.query(
      `SELECT c.conductor_id AS person_id, 'Conductor' AS role,
              u.first_name || ' ' || u.last_name AS name,
              u.phone AS contact,
              c.depot_id,
              c.region_id,
              cs.status,
              EXISTS (
                SELECT 1 FROM dailyassignment da
                WHERE da.conductor_id = c.conductor_id
                  AND da.assignment_date = $1
                  AND da.is_active = TRUE
              ) AS assigned_today
       FROM conductors c
       JOIN users u ON c.conductor_id = u.user_id
       LEFT JOIN crew_status cs ON cs.person_id = c.conductor_id AND cs.role = 'Conductor'`,
      [localDateString]
    );
    const normalize = row => ({
      ...row,
      status: row.status || 'On Duty',
      assigned_today: row.assigned_today
    });
    return [...drivers.rows.map(normalize), ...conductors.rows.map(normalize)];
  }

  // Get crew filtered by region or depot only
  static async getCrewFiltered({ depot_id, region_id }) {
    const today = new Date();
    const localDateString = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    let drivers, conductors;
    if (region_id && !depot_id) {
      drivers = await db.query(
        `SELECT d.driver_id AS person_id, 'Driver' AS role,
                u.first_name || ' ' || u.last_name AS name,
                u.phone AS contact,
                d.depot_id,
                d.region_id,
                cs.status,
                EXISTS (
                  SELECT 1 FROM dailyassignment da
                  WHERE da.driver_id = d.driver_id
                    AND da.assignment_date = $2
                    AND da.is_active = TRUE
                ) AS assigned_today
         FROM drivers d
         JOIN users u ON d.driver_id = u.user_id
         LEFT JOIN crew_status cs ON cs.person_id = d.driver_id AND cs.role = 'Driver'
         WHERE d.region_id = $1`,
        [region_id, localDateString]
      );
      conductors = await db.query(
        `SELECT c.conductor_id AS person_id, 'Conductor' AS role,
                u.first_name || ' ' || u.last_name AS name,
                u.phone AS contact,
                c.depot_id,
                c.region_id,
                cs.status,
                EXISTS (
                  SELECT 1 FROM dailyassignment da
                  WHERE da.conductor_id = c.conductor_id
                    AND da.assignment_date = $2
                    AND da.is_active = TRUE
                ) AS assigned_today
         FROM conductors c
         JOIN users u ON c.conductor_id = u.user_id
         LEFT JOIN crew_status cs ON cs.person_id = c.conductor_id AND cs.role = 'Conductor'
         WHERE c.region_id = $1`,
        [region_id, localDateString]
      );
    } else if (depot_id && !region_id) {
      drivers = await db.query(
        `SELECT d.driver_id AS person_id, 'Driver' AS role,
                u.first_name || ' ' || u.last_name AS name,
                u.phone AS contact,
                d.depot_id, -- <-- make sure this is included!
                d.region_id,
                cs.status,
                EXISTS (
                  SELECT 1 FROM dailyassignment da
                  WHERE da.driver_id = d.driver_id
                    AND da.assignment_date = $2
                    AND da.is_active = TRUE
                ) AS assigned_today
         FROM drivers d
         JOIN users u ON d.driver_id = u.user_id
         LEFT JOIN crew_status cs ON cs.person_id = d.driver_id AND cs.role = 'Driver'
         WHERE d.depot_id = $1`,
        [depot_id, localDateString]
      );
      conductors = await db.query(
        `SELECT c.conductor_id AS person_id, 'Conductor' AS role,
                u.first_name || ' ' || u.last_name AS name,
                u.phone AS contact,
                c.depot_id,
                c.region_id,
                cs.status,
                EXISTS (
                  SELECT 1 FROM dailyassignment da
                  WHERE da.conductor_id = c.conductor_id
                    AND da.assignment_date = $2
                    AND da.is_active = TRUE
                ) AS assigned_today
         FROM conductors c
         JOIN users u ON c.conductor_id = u.user_id
         LEFT JOIN crew_status cs ON cs.person_id = c.conductor_id AND cs.role = 'Conductor'
         WHERE c.depot_id = $1`,
        [depot_id, localDateString]
      );
    } else {
      // fallback: return all crew
      return await CrewModel.getAllCrew();
    }
    const normalize = row => ({
      ...row,
      status: row.status || 'On Duty',
      assigned_today: row.assigned_today
    });
    return [...drivers.rows.map(normalize), ...conductors.rows.map(normalize)];
  }
}

module.exports = CrewModel;