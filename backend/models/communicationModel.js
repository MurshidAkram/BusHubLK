const db = require('../config/db');

class Communication {
  // Get or create a direct channel between two users
  static async getOrCreateDirectChannel(user1Id, user2Id) {
    try {
      const result = await db.query(
        'SELECT get_or_create_direct_channel($1, $2) as channel_id',
        [user1Id, user2Id]
      );
      return result.rows[0].channel_id;
    } catch (error) {
      console.error('Error getting/creating channel:', error);
      throw error;
    }
  }

// Fixed getUserChannels method for communicationModel.js

static async getUserChannels(userId) {
  try {
    const query = `
      SELECT 
        c.channel_id,
        c.channel_type,
        c.channel_name,
        c.created_at as channel_created_at,
        c.created_by,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.channel_id = c.channel_id
          AND m.sender_id != $1
          AND NOT EXISTS (
            SELECT 1 FROM message_read_status mrs
            WHERE mrs.message_id = m.message_id
            AND mrs.user_id = $1
          )
        )::INTEGER as unread_count,
        (
          CASE 
            WHEN c.channel_type = 'announcement' THEN
              -- For announcements, show the creator info
              (SELECT json_agg(
                json_build_object(
                  'user_id', u.user_id,
                  'username', u.username,
                  'first_name', u.first_name,
                  'last_name', u.last_name,
                  'role', r.role_name
                )
              )
              FROM users u
              JOIN roles r ON u.role_id = r.role_id
              WHERE u.user_id = c.created_by)
            ELSE
              -- For direct messages, show other participants
              (SELECT json_agg(
                json_build_object(
                  'user_id', u.user_id,
                  'username', u.username,
                  'first_name', u.first_name,
                  'last_name', u.last_name,
                  'role', r.role_name
                )
              )
              FROM channel_participants cp
              JOIN users u ON cp.user_id = u.user_id
              JOIN roles r ON u.role_id = r.role_id
              WHERE cp.channel_id = c.channel_id
              AND cp.user_id != $1)
          END
        ) as participants,
        (
          SELECT json_build_object(
            'message_text', m.message_text,
            'sender_name', u.first_name || ' ' || u.last_name,
            'created_at', m.created_at
          )
          FROM messages m
          JOIN users u ON m.sender_id = u.user_id
          WHERE m.channel_id = c.channel_id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message
      FROM communication_channels c
      JOIN channel_participants cp ON c.channel_id = cp.channel_id
      WHERE cp.user_id = $1
      ORDER BY (
        SELECT COALESCE(MAX(m.created_at), c.created_at)
        FROM messages m
        WHERE m.channel_id = c.channel_id
      ) DESC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting user channels:', error);
    throw error;
  }
}
  // Get messages for a channel
  static async getChannelMessages(channelId, userId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          m.message_id,
          m.message_text,
          m.sender_id,
          u.first_name || ' ' || u.last_name as sender_name,
          u.username as sender_username,
          r.role_name as sender_role,
          m.created_at,
          EXISTS (
            SELECT 1 FROM message_read_status mrs
            WHERE mrs.message_id = m.message_id
            AND mrs.user_id = $2
          ) as is_read_by_user
        FROM messages m
        JOIN users u ON m.sender_id = u.user_id
        JOIN roles r ON u.role_id = r.role_id
        WHERE m.channel_id = $1
        ORDER BY m.created_at DESC
        LIMIT $3 OFFSET $4
      `;
      
      const result = await db.query(query, [channelId, userId, limit, offset]);
      return result.rows.reverse(); // Return in ascending order
    } catch (error) {
      console.error('Error getting channel messages:', error);
      throw error;
    }
  }

  // Send a message
  static async sendMessage(channelId, senderId, messageText) {
    try {
      // First verify the sender is a participant
      const participantCheck = await db.query(
        `SELECT can_send FROM channel_participants 
         WHERE channel_id = $1 AND user_id = $2`,
        [channelId, senderId]
      );

      if (participantCheck.rows.length === 0) {
        throw new Error('User is not a participant in this channel');
      }

      if (!participantCheck.rows[0].can_send) {
        throw new Error('User does not have permission to send messages in this channel');
      }

      // Insert the message
      const result = await db.query(
        `INSERT INTO messages (channel_id, sender_id, message_text)
         VALUES ($1, $2, $3)
         RETURNING 
           message_id,
           message_text,
           sender_id,
           created_at`,
        [channelId, senderId, messageText]
      );

      // Get sender details
      const senderQuery = await db.query(
        `SELECT u.first_name || ' ' || u.last_name as sender_name,
                u.username as sender_username,
                r.role_name as sender_role
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.user_id = $1`,
        [senderId]
      );

      return {
        ...result.rows[0],
        ...senderQuery.rows[0]
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark message as read
  static async markMessageAsRead(messageId, userId) {
    try {
      await db.query(
        `INSERT INTO message_read_status (message_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (message_id, user_id) DO NOTHING`,
        [messageId, userId]
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Mark all messages in a channel as read
  static async markChannelAsRead(channelId, userId) {
    try {
      await db.query(
        `INSERT INTO message_read_status (message_id, user_id)
         SELECT m.message_id, $2
         FROM messages m
         WHERE m.channel_id = $1
         AND m.sender_id != $2
         AND NOT EXISTS (
           SELECT 1 FROM message_read_status mrs
           WHERE mrs.message_id = m.message_id
           AND mrs.user_id = $2
         )
         ON CONFLICT (message_id, user_id) DO NOTHING`,
        [channelId, userId]
      );
    } catch (error) {
      console.error('Error marking channel as read:', error);
      throw error;
    }
  }

  // Get available contacts for a user based on their role and hierarchy
// Get available contacts for a user based on their role and hierarchy
// Get available contacts for a user based on their role and hierarchy
// Complete getAvailableContacts method for communicationModel.js

static async getAvailableContacts(userId, filters = {}) {
  try {
    // Get user's role and depot/region info
    const userInfo = await db.query(
      `SELECT u.user_id, u.role_id, r.role_name,
              COALESCE(dm.depot_id, dom.depot_id, de.depot_id, rto.region_id, roo.region_id) as depot_id,
              COALESCE(dm.region_id, dom.region_id, de.region_id, rto.region_id, roo.region_id) as region_id
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN depot_managers dm ON u.user_id = dm.depot_manager_id
       LEFT JOIN depot_operation_managers dom ON u.user_id = dom.depot_op_manager_id
       LEFT JOIN depot_engineers de ON u.user_id = de.depot_engineer_id
       LEFT JOIN regional_technical_officers rto ON u.user_id = rto.rto_id
       LEFT JOIN regional_operations_officers roo ON u.user_id = roo.roo_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (userInfo.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userInfo.rows[0];
    const { role_name, depot_id, region_id } = user;

    console.log('User info:', { userId, role_name, depot_id, region_id, filters });

    let query = '';
    let params = [];

    // ==================== DEPOT LEVEL ====================
    
    // Depot Engineer can chat with: Depot Manager, Depot Operations Manager, Regional Technical Officer
    if (role_name === 'depot_engineer') {
      query = `
        SELECT 
          u.user_id, 
          u.username,
          u.first_name || ' ' || u.last_name as name,
          r.role_name as role
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id != $1
        AND u.is_active = true
        AND (
          (r.role_name = 'depot_manager' AND EXISTS (
            SELECT 1 FROM depot_managers dm WHERE dm.depot_manager_id = u.user_id AND dm.depot_id = $2
          ))
          OR (r.role_name = 'depot_operations' AND EXISTS (
            SELECT 1 FROM depot_operation_managers dom WHERE dom.depot_op_manager_id = u.user_id AND dom.depot_id = $2
          ))
          OR (r.role_name = 'regional_tech' AND EXISTS (
            SELECT 1 FROM regional_technical_officers rto WHERE rto.rto_id = u.user_id AND rto.region_id = $3
          ))
        )
        ORDER BY r.role_name, u.first_name
      `;
      params = [userId, depot_id, region_id];
    }
    
    // Depot Operations Manager can chat with: Depot Manager, Depot Engineer, Regional Operations Officer
    else if (role_name === 'depot_operations') {
      query = `
        SELECT 
          u.user_id, 
          u.username,
          u.first_name || ' ' || u.last_name as name,
          r.role_name as role
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id != $1
        AND u.is_active = true
        AND (
          (r.role_name = 'depot_manager' AND EXISTS (
            SELECT 1 FROM depot_managers dm WHERE dm.depot_manager_id = u.user_id AND dm.depot_id = $2
          ))
          OR (r.role_name = 'depot_engineer' AND EXISTS (
            SELECT 1 FROM depot_engineers de WHERE de.depot_engineer_id = u.user_id AND de.depot_id = $2
          ))
          OR (r.role_name = 'regional_operations' AND EXISTS (
            SELECT 1 FROM regional_operations_officers roo WHERE roo.roo_id = u.user_id AND roo.region_id = $3
          ))
        )
        ORDER BY r.role_name, u.first_name
      `;
      params = [userId, depot_id, region_id];
    }
    
    // Depot Manager can chat with: Depot Operations Manager, Depot Engineer
    else if (role_name === 'depot_manager') {
      query = `
        SELECT 
          u.user_id, 
          u.username,
          u.first_name || ' ' || u.last_name as name,
          r.role_name as role
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id != $1
        AND u.is_active = true
        AND (
          (r.role_name = 'depot_operations' AND EXISTS (
            SELECT 1 FROM depot_operation_managers dom WHERE dom.depot_op_manager_id = u.user_id AND dom.depot_id = $2
          ))
          OR (r.role_name = 'depot_engineer' AND EXISTS (
            SELECT 1 FROM depot_engineers de WHERE de.depot_engineer_id = u.user_id AND de.depot_id = $2
          ))
        )
        ORDER BY r.role_name, u.first_name
      `;
      params = [userId, depot_id];
    }
    
    // ==================== REGIONAL LEVEL ====================
    
    // Regional Technical Officer can chat with: Depot Engineers, Depot Managers in region, DGM Technical
    else if (role_name === 'regional_tech') {
      query = `
        SELECT 
          u.user_id, 
          u.username,
          u.first_name || ' ' || u.last_name as name,
          r.role_name as role,
          COALESCE(de.depot_id, dm.depot_id) as depot_id
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        LEFT JOIN depot_engineers de ON u.user_id = de.depot_engineer_id AND de.region_id = $2
        LEFT JOIN depot_managers dm ON u.user_id = dm.depot_manager_id AND dm.region_id = $2
        WHERE u.user_id != $1
        AND u.is_active = true
        AND (
          (r.role_name = 'depot_engineer' AND de.depot_engineer_id IS NOT NULL)
          OR (r.role_name = 'depot_manager' AND dm.depot_manager_id IS NOT NULL)
          OR (r.role_name = 'dgm_technical')
        )
        ORDER BY 
          CASE r.role_name
            WHEN 'dgm_technical' THEN 1
            WHEN 'depot_manager' THEN 2
            WHEN 'depot_engineer' THEN 3
          END,
          u.first_name
      `;
      params = [userId, region_id];
    }
    
    // Regional Operations Officer can chat with: Depot Operations Managers, Depot Managers in region, DGM Operations
    else if (role_name === 'regional_operations') {
      query = `
        SELECT 
          u.user_id, 
          u.username,
          u.first_name || ' ' || u.last_name as name,
          r.role_name as role,
          COALESCE(dom.depot_id, dm.depot_id) as depot_id
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        LEFT JOIN depot_operation_managers dom ON u.user_id = dom.depot_op_manager_id AND dom.region_id = $2
        LEFT JOIN depot_managers dm ON u.user_id = dm.depot_manager_id AND dm.region_id = $2
        WHERE u.user_id != $1
        AND u.is_active = true
        AND (
          (r.role_name = 'depot_operations' AND dom.depot_op_manager_id IS NOT NULL)
          OR (r.role_name = 'depot_manager' AND dm.depot_manager_id IS NOT NULL)
          OR (r.role_name = 'dgm_operations')
        )
        ORDER BY 
          CASE r.role_name
            WHEN 'dgm_operations' THEN 1
            WHEN 'depot_manager' THEN 2
            WHEN 'depot_operations' THEN 3
          END,
          u.first_name
      `;
      params = [userId, region_id];
    }
    
    // ==================== DGM LEVEL ====================
    
    // DGM Technical can chat with: Regional Technical Officers (filtered by region), CEO
    else if (role_name === 'dgm_technical') {
      const regionFilter = filters.regionId ? 'AND rto.region_id = $2' : '';
      query = `
        SELECT 
          u.user_id, 
          u.username,
          u.first_name || ' ' || u.last_name as name,
          r.role_name as role,
          rto.region_id,
          reg.region_name
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        LEFT JOIN regional_technical_officers rto ON u.user_id = rto.rto_id
        LEFT JOIN regions reg ON rto.region_id = reg.region_id
        WHERE u.user_id != $1
        AND u.is_active = true
        AND (
          (r.role_name = 'regional_tech' ${regionFilter})
          OR r.role_name = 'ceo'
        )
        ORDER BY 
          CASE r.role_name
            WHEN 'ceo' THEN 1
            WHEN 'regional_tech' THEN 2
          END,
          reg.region_name,
          u.first_name
      `;
      params = filters.regionId ? [userId, filters.regionId] : [userId];
    }
    
    // DGM Operations can chat with: Regional Operations Officers (filtered by region), CEO
    else if (role_name === 'dgm_operations') {
      const regionFilter = filters.regionId ? 'AND roo.region_id = $2' : '';
      query = `
        SELECT 
          u.user_id, 
          u.username,
          u.first_name || ' ' || u.last_name as name,
          r.role_name as role,
          roo.region_id,
          reg.region_name
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        LEFT JOIN regional_operations_officers roo ON u.user_id = roo.roo_id
        LEFT JOIN regions reg ON roo.region_id = reg.region_id
        WHERE u.user_id != $1
        AND u.is_active = true
        AND (
          (r.role_name = 'regional_operations' ${regionFilter})
          OR r.role_name = 'ceo'
        )
        ORDER BY 
          CASE r.role_name
            WHEN 'ceo' THEN 1
            WHEN 'regional_operations' THEN 2
          END,
          reg.region_name,
          u.first_name
      `;
      params = filters.regionId ? [userId, filters.regionId] : [userId];
    }
    
    // ==================== ADMIN LEVEL ====================
    
    // Admin can chat with anyone
    else if (role_name === 'admin') {
      query = `
        SELECT 
          u.user_id, 
          u.username,
          u.first_name || ' ' || u.last_name as name,
          r.role_name as role
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id != $1
        AND u.is_active = true
        ORDER BY r.role_name, u.first_name
      `;
      params = [userId];
    }
    
    // If no role matched or query not set, return empty array
    if (!query) {
      console.log('No matching role found for contacts query');
      return [];
    }

    const contacts = await db.query(query, params);
    console.log(`Found ${contacts.rows.length} contacts for user ${userId}`);
    return contacts.rows;
    
  } catch (error) {
    console.error('Error getting available contacts:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}
 // Get channel info
// Fixed getChannelInfo method for communicationModel.js

static async getChannelInfo(channelId, userId) {
  try {
    const query = `
      SELECT 
        c.channel_id,
        c.channel_type,
        c.channel_name,
        c.created_by,
        (
          CASE 
            WHEN c.channel_type = 'announcement' THEN
              -- For announcements, show the creator
              (SELECT json_agg(
                json_build_object(
                  'user_id', u.user_id,
                  'username', u.username,
                  'first_name', u.first_name,
                  'last_name', u.last_name,
                  'name', u.first_name || ' ' || u.last_name,
                  'role', r.role_name,
                  'can_send', CASE WHEN u.user_id = c.created_by THEN true ELSE false END
                )
              )
              FROM users u
              JOIN roles r ON u.role_id = r.role_id
              WHERE u.user_id = c.created_by)
            ELSE
              -- For direct messages, show all participants
              (SELECT json_agg(
                json_build_object(
                  'user_id', u.user_id,
                  'username', u.username,
                  'first_name', u.first_name,
                  'last_name', u.last_name,
                  'name', u.first_name || ' ' || u.last_name,
                  'role', r.role_name,
                  'can_send', cp.can_send
                )
              )
              FROM channel_participants cp
              JOIN users u ON cp.user_id = u.user_id
              JOIN roles r ON u.role_id = r.role_id
              WHERE cp.channel_id = c.channel_id)
          END
        ) as participants
      FROM communication_channels c
      WHERE c.channel_id = $1
      AND EXISTS (
        SELECT 1 FROM channel_participants
        WHERE channel_id = $1 AND user_id = $2
      )
    `;
    
    const result = await db.query(query, [channelId, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const channelInfo = result.rows[0];
    
    // For direct messages, filter out current user from participants for display
    if (channelInfo.channel_type === 'direct') {
      channelInfo.participants = channelInfo.participants.filter(p => p.user_id !== userId);
    }
    // For announcements, keep the creator info visible to show who sent it
    
    return channelInfo;
  } catch (error) {
    console.error('Error getting channel info:', error);
    throw error;
  }
}

// Get all regions for DGM/CEO to select from
static async getRegions() {
  try {
    const query = `
      SELECT region_id, region_name
      FROM regions
      ORDER BY region_name
    `;
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting regions:', error);
    throw error;
  }
}

// Get all depots (optionally filtered by region)
static async getDepots(regionId = null) {
  try {
    const query = regionId 
      ? `SELECT depot_id, depot_name, region_id
         FROM depots
         WHERE region_id = $1
         ORDER BY depot_name`
      : `SELECT depot_id, depot_name, region_id
         FROM depots
         ORDER BY depot_name`;
    
    const params = regionId ? [regionId] : [];
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error getting depots:', error);
    throw error;
  }
}

// Get contacts for DGM (filtered by region)
static async getDGMContacts(userId, roleType, regionId = null) {
  try {
    let query = '';
    let params = [userId];
    
    if (roleType === 'technical') {
      // DGM Technical can chat with Regional Technical Officers and CEO
      query = `
        SELECT 
          u.user_id, 
          u.username,
          u.first_name || ' ' || u.last_name as name,
          r.role_name as role,
          rto.region_id
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        LEFT JOIN regional_technical_officers rto ON u.user_id = rto.rto_id
        WHERE u.user_id != $1
        AND u.is_active = true
        AND (
          (r.role_name = 'regional_tech' ${regionId ? 'AND rto.region_id = $2' : ''})
          OR r.role_name = 'ceo'
        )
        ORDER BY 
          CASE r.role_name
            WHEN 'ceo' THEN 1
            WHEN 'regional_tech' THEN 2
          END,
          u.first_name
      `;
      if (regionId) params.push(regionId);
      
    } else if (roleType === 'operations') {
      // DGM Operations can chat with Regional Operations Officers and CEO
      query = `
        SELECT 
          u.user_id, 
          u.username,
          u.first_name || ' ' || u.last_name as name,
          r.role_name as role,
          roo.region_id
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        LEFT JOIN regional_operations_officers roo ON u.user_id = roo.roo_id
        WHERE u.user_id != $1
        AND u.is_active = true
        AND (
          (r.role_name = 'regional_operations' ${regionId ? 'AND roo.region_id = $2' : ''})
          OR r.role_name = 'ceo'
        )
        ORDER BY 
          CASE r.role_name
            WHEN 'ceo' THEN 1
            WHEN 'regional_operations' THEN 2
          END,
          u.first_name
      `;
      if (regionId) params.push(regionId);
    }
    
    const contacts = await db.query(query, params);
    return contacts.rows;
    
  } catch (error) {
    console.error('Error getting DGM contacts:', error);
    throw error;
  }
}

// Create announcement channel for region or depot
// Fixed createAnnouncementChannel method for communicationModel.js

static async createAnnouncementChannel(creatorId, targetType, targetId, channelName) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Create announcement channel
    const channelResult = await client.query(
      `INSERT INTO communication_channels (channel_type, channel_name, created_by)
       VALUES ('announcement', $1, $2)
       RETURNING channel_id`,
      [channelName, creatorId]
    );
    
    const channelId = channelResult.rows[0].channel_id;
    
    // Add creator as participant (can send)
    await client.query(
      `INSERT INTO channel_participants (channel_id, user_id, can_send)
       VALUES ($1, $2, true)`,
      [channelId, creatorId]
    );
    
    // Add recipients based on target type (cannot send)
    let recipientsQuery = '';
    let recipientsParams = [channelId];
    
    if (targetType === 'region') {
      // Add all active users in the region - FIXED: removed DISTINCT keyword
      recipientsQuery = `
        INSERT INTO channel_participants (channel_id, user_id, can_send)
        SELECT $1, u.user_id, false
        FROM users u
        LEFT JOIN depot_managers dm ON u.user_id = dm.depot_manager_id
        LEFT JOIN depot_operation_managers dom ON u.user_id = dom.depot_op_manager_id
        LEFT JOIN depot_engineers de ON u.user_id = de.depot_engineer_id
        LEFT JOIN regional_technical_officers rto ON u.user_id = rto.rto_id
        LEFT JOIN regional_operations_officers roo ON u.user_id = roo.roo_id
        WHERE u.is_active = true
        AND u.user_id != $2
        AND (
          dm.region_id = $3 OR
          dom.region_id = $3 OR
          de.region_id = $3 OR
          rto.region_id = $3 OR
          roo.region_id = $3
        )
        GROUP BY u.user_id
      `;
      recipientsParams.push(creatorId, targetId);
      
    } else if (targetType === 'depot') {
      // Add all active users in the depot - FIXED: removed DISTINCT keyword
      recipientsQuery = `
        INSERT INTO channel_participants (channel_id, user_id, can_send)
        SELECT $1, u.user_id, false
        FROM users u
        LEFT JOIN depot_managers dm ON u.user_id = dm.depot_manager_id
        LEFT JOIN depot_operation_managers dom ON u.user_id = dom.depot_op_manager_id
        LEFT JOIN depot_engineers de ON u.user_id = de.depot_engineer_id
        WHERE u.is_active = true
        AND u.user_id != $2
        AND (
          dm.depot_id = $3 OR
          dom.depot_id = $3 OR
          de.depot_id = $3
        )
        GROUP BY u.user_id
      `;
      recipientsParams.push(creatorId, targetId);
    }
    
    await client.query(recipientsQuery, recipientsParams);
    
    await client.query('COMMIT');
    
    return channelId;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating announcement channel:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  } finally {
    client.release();
  }
}
}

module.exports = Communication;