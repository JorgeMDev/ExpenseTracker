const db = require('../config/db');

const User = {
  async create({ email, passwordHash, name }) {
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, currency, created_at`,
      [email, passwordHash, name]
    );
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await db.query(
      'SELECT id, email, name, avatar_url, currency, tax_year_start, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async updateRefreshToken(id, token) {
    await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [token, id]);
  },

  async update(id, fields) {
    const allowed = ['name', 'avatar_url', 'currency', 'tax_year_start'];
    const updates = [];
    const values = [];
    let i = 1;
    for (const [key, val] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = $${i++}`);
        values.push(val);
      }
    }
    if (!updates.length) return null;
    values.push(id);
    const { rows } = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, email, name, avatar_url, currency`,
      values
    );
    return rows[0];
  },
};

module.exports = User;
