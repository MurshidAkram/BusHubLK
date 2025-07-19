const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async create({ username, email, password, first_name, last_name, phone, role_id }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING user_id, username, email, first_name, last_name, phone, role_id, is_active, created_at`,
      [username, email, hashedPassword, first_name, last_name, phone, role_id]
    );
    return result.rows[0];
  }

static async findByEmail(email) {
  const result = await db.query(
    `SELECT u.*, r.role_name, r.role_description 
     FROM users u 
     JOIN roles r ON u.role_id = r.role_id 
     WHERE u.email = $1`,
    [email]
  );
  return result.rows[0];
}

  static async findByUsername(username) {
    const result = await db.query(
      `SELECT u.*, r.role_name, r.role_description 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE u.username = $1`,
      [username]
    );
    return result.rows[0];
  }

  static async findById(user_id) {
    const result = await db.query(
      `SELECT u.*, r.role_name, r.role_description 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_id = $1`,
      [user_id]
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await db.query(
      `SELECT u.*, r.role_name, r.role_description 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       ORDER BY u.user_id`
    );
    return result.rows;
  }

  static async getAllRoles() {
    const result = await db.query('SELECT * FROM roles ORDER BY role_id');
    return result.rows;
  }

  static async findRoleByName(role_name) {
    const result = await db.query('SELECT * FROM roles WHERE role_name = $1', [role_name]);
    return result.rows[0];
  }

  static async findRoleById(role_id) {
    const result = await db.query('SELECT * FROM roles WHERE role_id = $1', [role_id]);
    return result.rows[0];
  }

  static async updateLastLogin(user_id) {
    const result = await db.query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 
       RETURNING user_id, last_login`,
      [user_id]
    );
    return result.rows[0];
  }

  static async updateUser(user_id, updates) {
    const allowedFields = ['username', 'email', 'first_name', 'last_name', 'phone', 'role_id', 'is_active'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(user_id);

    const result = await db.query(
      `UPDATE users SET ${updateFields.join(', ')} 
       WHERE user_id = $${paramCount} 
       RETURNING user_id, username, email, first_name, last_name, phone, role_id, is_active, updated_at`,
      values
    );
    return result.rows[0];
  }

  static async deactivateUser(user_id) {
    const result = await db.query(
      `UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 
       RETURNING user_id, is_active`,
      [user_id]
    );
    return result.rows[0];
  }

  static async activateUser(user_id) {
    const result = await db.query(
      `UPDATE users SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 
       RETURNING user_id, is_active`,
      [user_id]
    );
    return result.rows[0];
  }

  static async deleteUser(user_id) {
    const result = await db.query(
      `DELETE FROM users WHERE user_id = $1 RETURNING user_id`,
      [user_id]
    );
    return result.rows[0];
  }

  static async changePassword(user_id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await db.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 
       RETURNING user_id`,
      [hashedPassword, user_id]
    );
    return result.rows[0];
  }

  static async updatePassword(userId, hashedPassword) {
    try {
      console.log('Updating password for user ID:', userId);
      
      const query = `
        UPDATE users 
        SET password_hash = $2, updated_at = NOW() 
        WHERE user_id = $1
        RETURNING user_id, email, updated_at
      `;
      
      const result = await db.query(query, [userId, hashedPassword]);
      console.log('Password update result:', result);
      
      if (result.rowCount === 0) {
        throw new Error('User not found or password not updated');
      }
      
      return {
        affectedRows: result.rowCount,
        updatedUser: result.rows[0]
      };
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }


  static async getUsersByRole(role_name) {
    const result = await db.query(
      `SELECT u.*, r.role_name, r.role_description 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE r.role_name = $1 
       ORDER BY u.user_id`,
      [role_name]
    );
    return result.rows;
  }

  static async getUsersByDepot(depot_id) {
    const result = await db.query(
      `SELECT u.*, r.role_name, r.role_description 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_id IN (
         SELECT depot_manager_id FROM depot_managers WHERE depot_id = $1
         UNION
         SELECT depot_op_manager_id FROM depot_operation_managers WHERE depot_id = $1
         UNION
         SELECT depot_engineer_id FROM depot_engineers WHERE depot_id = $1
         UNION
         SELECT driver_id FROM drivers WHERE depot_id = $1
         UNION
         SELECT conductor_id FROM conductors WHERE depot_id = $1
       )
       ORDER BY u.user_id`,
      [depot_id]
    );
    return result.rows;
  }

  static async getUsersByRegion(region_id) {
    const result = await db.query(
      `SELECT u.*, r.role_name, r.role_description 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_id IN (
         SELECT rto_id FROM regional_technical_officers WHERE region_id = $1
         UNION
         SELECT roo_id FROM regional_operations_officers WHERE region_id = $1
         UNION
         SELECT depot_manager_id FROM depot_managers WHERE region_id = $1
         UNION
         SELECT depot_op_manager_id FROM depot_operation_managers WHERE region_id = $1
         UNION
         SELECT depot_engineer_id FROM depot_engineers WHERE region_id = $1
         UNION
         SELECT driver_id FROM drivers WHERE region_id = $1
         UNION
         SELECT conductor_id FROM conductors WHERE region_id = $1
       )
       ORDER BY u.user_id`,
      [region_id]
    );
    return result.rows;
  }

  static async findByUsername(username) {
    try {
      const result = await db.query(
        `SELECT u.*, r.role_name 
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.username = $1`,
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  static async updateProfile(userId, updateData) {
    try {
      const { first_name, last_name, phone } = updateData;
      
      const result = await db.query(
        `UPDATE users 
         SET first_name = COALESCE($2, first_name),
             last_name = COALESCE($3, last_name),
             phone = COALESCE($4, phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING user_id, username, email, first_name, last_name, phone, role_id, is_active`,
        [userId, first_name, last_name, phone]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  static async updateLastLogin(userId) {
    try {
      await db.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  // Helper method to create role-specific entries
  static async createRoleSpecificEntry(user_id, role_name, additional_data = {}) {
    const roleTableMap = {
      'ceo': 'ceo',
      'dgm_technical': 'dgm_technical',
      'dgm_operations': 'dgm_operations',
      'regional_tech': 'regional_technical_officers',
      'regional_operations': 'regional_operations_officers',
      'depot_manager': 'depot_managers',
      'depot_operations': 'depot_operation_managers',
      'depot_engineer': 'depot_engineers',
      'driver': 'drivers',
      'conductor': 'conductors',
      'passenger': 'passengers',
      'admin': 'admins'
    };

    const tableName = roleTableMap[role_name];
    if (!tableName) {
      throw new Error(`Invalid role: ${role_name}`);
    }

    // Build the insert query based on the role
    let insertQuery;
    let values;

    switch (role_name) {
      case 'ceo':
      case 'dgm_technical':
        
      case 'dgm_operations':
        insertQuery = `INSERT INTO ${tableName} (${role_name}_id, appointment_date) VALUES ($1, $2)`;
        values = [user_id, additional_data.appointment_date || new Date()];
        break;
      
      case 'regional_tech':
        insertQuery = `INSERT INTO regional_technical_officers (rto_id, region_id, appointment_date) VALUES ($1, $2, $3)`;
        values = [user_id, additional_data.region_id, additional_data.appointment_date || new Date()];
        break;
      
      case 'regional_operations':
        insertQuery = `INSERT INTO regional_operations_officers (roo_id, region_id, appointment_date) VALUES ($1, $2, $3)`;
        values = [user_id, additional_data.region_id, additional_data.appointment_date || new Date()];
        break;
      
      case 'depot_manager':
        insertQuery = `INSERT INTO depot_managers (depot_manager_id, depot_id, region_id, appointment_date) VALUES ($1, $2, $3, $4)`;
        values = [user_id, additional_data.depot_id, additional_data.region_id, additional_data.appointment_date || new Date()];
        break;
      
      case 'depot_operations':
        insertQuery = `INSERT INTO depot_operation_managers (depot_op_manager_id, depot_id, region_id, appointment_date) VALUES ($1, $2, $3, $4)`;
        values = [user_id, additional_data.depot_id, additional_data.region_id, additional_data.appointment_date || new Date()];
        break;
      
      case 'depot_engineer':
        insertQuery = `INSERT INTO depot_engineers (depot_engineer_id, depot_id, region_id, appointment_date) VALUES ($1, $2, $3, $4)`;
        values = [user_id, additional_data.depot_id, additional_data.region_id, additional_data.appointment_date || new Date()];
        break;
      
      case 'driver':
        insertQuery = `INSERT INTO drivers (driver_id, depot_id, region_id) VALUES ($1, $2, $3)`;
        values = [user_id, additional_data.depot_id, additional_data.region_id];
        break;
      
      case 'conductor':
        insertQuery = `INSERT INTO conductors (conductor_id, depot_id, region_id) VALUES ($1, $2, $3)`;
        values = [user_id, additional_data.depot_id, additional_data.region_id];
        break;
      
      case 'passenger':
        insertQuery = `INSERT INTO passengers (passenger_id) VALUES ($1)`;
        values = [user_id];
        break;
      
      case 'admin':
        insertQuery = `INSERT INTO admins (admin_id) VALUES ($1)`;
        values = [user_id];
        break;
    }

    const result = await db.query(insertQuery, values);
    return result.rows[0];
  }

  // In userModel.js, add these methods:

// Delete role-specific entry
static async deleteRoleSpecificEntry(user_id, role_name) {
  const roleTableMap = {
    'ceo': 'ceo',
    'dgm_technical': 'dgm_technical',
    'dgm_operations': 'dgm_operations',
    'regional_tech': 'regional_technical_officers',
    'regional_operations': 'regional_operations_officers',
    'depot_manager': 'depot_managers',
    'depot_operations': 'depot_operation_managers',
    'depot_engineer': 'depot_engineers',
    'driver': 'drivers',
    'conductor': 'conductors',
    'passenger': 'passengers',
    'admin': 'admins'
  };

  const tableName = roleTableMap[role_name];
  if (!tableName) {
    throw new Error(`Invalid role: ${role_name}`);
  }

  const query = `DELETE FROM ${tableName} WHERE ${role_name}_id = $1`;
  await db.query(query, [user_id]);
}

// Update role-specific entry
static async updateRoleSpecificEntry(user_id, role_name, updateData) {
  const roleTableMap = {
    'ceo': 'ceo',
    'dgm_technical': 'dgm_technical',
    'dgm_operations': 'dgm_operations',
    'regional_tech': 'regional_technical_officers',
    'regional_operations': 'regional_operations_officers',
    'depot_manager': 'depot_managers',
    'depot_operations': 'depot_operation_managers',
    'depot_engineer': 'depot_engineers',
    'driver': 'drivers',
    'conductor': 'conductors'
  };

  const tableName = roleTableMap[role_name];
  if (!tableName) {
    throw new Error(`Invalid role: ${role_name}`);
  }

  const allowedFields = ['region_id', 'depot_id', 'appointment_date'];
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updateFields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }

  if (updateFields.length === 0) {
    return; // No valid fields to update
  }

  values.push(user_id);

  const query = `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE ${role_name}_id = $${paramCount}`;
  await db.query(query, values);
}
}

module.exports = User;