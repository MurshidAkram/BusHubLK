const db = require('./db');

class Role {
  static async getAll() {
    const result = await db.query('SELECT * FROM roles ORDER BY id');
    return result.rows;
  }

  static async findByName(name) {
    const result = await db.query('SELECT * FROM roles WHERE name = $1', [name]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
    return result.rows[0];
  }
}

module.exports = Role;