const db = require('./db');
const bcrypt = require('bcryptjs');

class User {
  static async create({ name, email, password, role_id }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password, role_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role_id, created_at`,
      [name, email, hashedPassword, role_id]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async getAll() {
    const result = await db.query(
      `SELECT users.*, roles.name AS role_name 
       FROM users JOIN roles ON users.role_id = roles.id 
       ORDER BY users.id`
    );
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query(
      `SELECT users.*, roles.name AS role_name 
       FROM users JOIN roles ON users.role_id = roles.id 
       WHERE users.id = $1`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = User;