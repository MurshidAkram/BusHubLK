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

static async getUserChannels(userId) {
  try {
    const query = `
      SELECT 
        c.channel_id,
        c.channel_type,
        c.channel_name,
        c.created_at as channel_created_at,
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
          SELECT json_agg(
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
          AND cp.user_id != $1
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
// Get available contacts for a user based on their role and hierarchy
static async getAvailableContacts(userId) {
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

    console.log('User info:', { userId, role_name, depot_id, region_id });

    let query = '';
    let params = [];

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
    
    // Regional Technical Officer can chat with: Depot Engineers in region
    else if (role_name === 'regional_tech') {
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
        AND r.role_name = 'depot_engineer'
        AND EXISTS (
          SELECT 1 FROM depot_engineers de WHERE de.depot_engineer_id = u.user_id AND de.region_id = $2
        )
        ORDER BY u.first_name
      `;
      params = [userId, region_id];
    }
    
    // Regional Operations Officer can chat with: Depot Operations Managers in region
    else if (role_name === 'regional_operations') {
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
        AND r.role_name = 'depot_operations'
        AND EXISTS (
          SELECT 1 FROM depot_operation_managers dom WHERE dom.depot_op_manager_id = u.user_id AND dom.region_id = $2
        )
        ORDER BY u.first_name
      `;
      params = [userId, region_id];
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
static async getChannelInfo(channelId, userId) {
  try {
    const query = `
      SELECT 
        c.channel_id,
        c.channel_type,
        c.channel_name,
        json_agg(
          json_build_object(
            'user_id', u.user_id,
            'username', u.username,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'name', u.first_name || ' ' || u.last_name,
            'role', r.role_name,
            'can_send', cp.can_send
          )
        ) as participants
      FROM communication_channels c
      JOIN channel_participants cp ON c.channel_id = cp.channel_id
      JOIN users u ON cp.user_id = u.user_id
      JOIN roles r ON u.role_id = r.role_id
      WHERE c.channel_id = $1
      AND EXISTS (
        SELECT 1 FROM channel_participants
        WHERE channel_id = $1 AND user_id = $2
      )
      GROUP BY c.channel_id
    `;
    
    const result = await db.query(query, [channelId, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const channelInfo = result.rows[0];
    
    // Filter out current user from participants for display
    channelInfo.participants = channelInfo.participants.filter(p => p.user_id !== userId);
    
    return channelInfo;
  } catch (error) {
    console.error('Error getting channel info:', error);
    throw error;
  }
}
}

module.exports = Communication;