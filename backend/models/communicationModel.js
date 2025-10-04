const db = require('../config/db');

class Communication {
  /**
   * Fetches a list of users a specific user can communicate with based on their role.
   * @param {object} user - The logged-in user object (containing userId, role, depot_id, region_id).
   * @returns {Promise<Array>} A list of contactable users.
   */
  static async getContacts({ userId, role, depot_id, region_id }) {
    let query = '';
    const params = [];

    // Base query to select user details
    const baseQuery = `
      SELECT u.user_id, u.first_name, u.last_name, r.role_name, d.depot_name, rg.region_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN depot_managers dm ON u.user_id = dm.depot_manager_id
      LEFT JOIN depot_operation_managers dom ON u.user_id = dom.depot_op_manager_id
      LEFT JOIN depot_engineers de ON u.user_id = de.depot_engineer_id
      LEFT JOIN regional_technical_officers rto ON u.user_id = rto.rto_id
      LEFT JOIN regional_operations_officers roo ON u.user_id = roo.roo_id
      LEFT JOIN depots d ON dm.depot_id = d.depot_id OR dom.depot_id = d.depot_id OR de.depot_id = d.depot_id
      LEFT JOIN regions rg ON d.region_id = rg.region_id OR rto.region_id = rg.region_id OR roo.region_id = rg.region_id
      WHERE u.user_id != $1 AND u.is_active = TRUE
    `;
    params.push(userId);

    // Logic for Depot Engineer
    if (role === 'depot_engineer') {
      query = `
        AND (
          -- Depot Manager and Ops Manager in the same depot
          (r.role_name IN ('depot_manager', 'depot_operations') AND (dm.depot_id = $2 OR dom.depot_id = $2))
          OR
          -- Regional Technical Officer of the same region
          (r.role_name = 'regional_tech' AND rto.region_id = $3)
        )
      `;
      params.push(depot_id, region_id);
    }
    // Logic for Depot Operations Manager
    else if (role === 'depot_operations') {
        query = `
        AND (
          -- Depot Manager and Engineer in the same depot
          (r.role_name IN ('depot_manager', 'depot_engineer') AND (dm.depot_id = $2 OR de.depot_id = $2))
          OR
          -- Regional Operations Officer of the same region
          (r.role_name = 'regional_operations' AND roo.region_id = $3)
        )
      `;
      params.push(depot_id, region_id);
    }
    // Logic for Depot Manager
    else if (role === 'depot_manager') {
       query = `
        AND (
          -- Engineer and Ops Manager in the same depot
          (r.role_name IN ('depot_engineer', 'depot_operations') AND (de.depot_id = $2 OR dom.depot_id = $2))
          OR
          -- Regional officers of the same region
          (r.role_name IN ('regional_tech', 'regional_operations') AND (rto.region_id = $3 OR roo.region_id = $3))
        )
      `;
      params.push(depot_id, region_id);
    }
    // Add logic for other roles (regional, DGM, CEO) here later

    const finalQuery = baseQuery + query + ' ORDER BY u.first_name, u.last_name';
    const result = await db.query(finalQuery, params);
    return result.rows;
  }

  // --- Methods for Conversations and Messages ---
  
  // You would add more methods here to:
  // - getConversations(userId)
  // - getMessages(conversationId)
  // - createMessage(senderId, conversationId, content)
  // - findOrCreateConversation(userId1, userId2)
  // - getAnnouncements(user)
}

module.exports = Communication;