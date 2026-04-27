const db = require('../config/db');

const Expense = {
  async create(userId, data) {
    const {
      date, amount, currency = 'USD', description, merchant_name,
      category_id, type, is_deductible, deductible_percentage,
      deductible_amount, deduction_rule, notes, receipt_url, tags,
      source = 'manual', transaction_id, plaid_account_id,
    } = data;

    const { rows } = await db.query(
      `INSERT INTO expenses
        (user_id, transaction_id, date, amount, currency, description, merchant_name,
         category_id, type, is_deductible, deductible_percentage, deductible_amount,
         deduction_rule, notes, receipt_url, tags, source, plaid_account_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [userId, transaction_id, date, amount, currency, description, merchant_name,
       category_id, type, is_deductible || false, deductible_percentage || 0,
       deductible_amount || 0, deduction_rule, notes, receipt_url,
       tags || [], source, plaid_account_id]
    );
    return rows[0];
  },

  async findAll(userId, filters = {}) {
    const conditions = ['e.user_id = $1'];
    const values = [userId];
    let i = 2;

    if (filters.type) { conditions.push(`e.type = $${i++}`); values.push(filters.type); }
    if (filters.category_id) { conditions.push(`e.category_id = $${i++}`); values.push(filters.category_id); }
    if (filters.is_deductible !== undefined) { conditions.push(`e.is_deductible = $${i++}`); values.push(filters.is_deductible); }
    if (filters.date_from) { conditions.push(`e.date >= $${i++}`); values.push(filters.date_from); }
    if (filters.date_to) { conditions.push(`e.date <= $${i++}`); values.push(filters.date_to); }
    if (filters.search) { conditions.push(`(e.description ILIKE $${i} OR e.merchant_name ILIKE $${i})`); values.push(`%${filters.search}%`); i++; }

    const orderBy = filters.sort === 'amount' ? 'e.amount DESC' : 'e.date DESC';
    const limit = filters.limit ? `LIMIT ${parseInt(filters.limit)}` : 'LIMIT 100';
    const offset = filters.offset ? `OFFSET ${parseInt(filters.offset)}` : '';

    const { rows } = await db.query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderBy}
       ${limit} ${offset}`,
      values
    );
    return rows;
  },

  async count(userId, filters = {}) {
    const conditions = ['user_id = $1'];
    const values = [userId];
    let i = 2;
    if (filters.type) { conditions.push(`type = $${i++}`); values.push(filters.type); }
    if (filters.date_from) { conditions.push(`date >= $${i++}`); values.push(filters.date_from); }
    if (filters.date_to) { conditions.push(`date <= $${i++}`); values.push(filters.date_to); }

    const { rows } = await db.query(
      `SELECT COUNT(*) FROM expenses WHERE ${conditions.join(' AND ')}`,
      values
    );
    return parseInt(rows[0].count);
  },

  async findById(id, userId) {
    const { rows } = await db.query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = $1 AND e.user_id = $2`,
      [id, userId]
    );
    return rows[0] || null;
  },

  async update(id, userId, data) {
    const allowed = [
      'date','amount','currency','description','merchant_name','category_id',
      'type','is_deductible','deductible_percentage','deductible_amount',
      'deduction_rule','notes','receipt_url','tags',
    ];
    const updates = [];
    const values = [];
    let i = 1;
    for (const [key, val] of Object.entries(data)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = $${i++}`);
        values.push(val);
      }
    }
    if (!updates.length) return null;
    values.push(id, userId);
    const { rows } = await db.query(
      `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
      values
    );
    return rows[0] || null;
  },

  async delete(id, userId) {
    const { rowCount } = await db.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  },

  async getSummary(userId, dateFrom, dateTo) {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE NOT is_income) as total_count,
         COALESCE(SUM(amount) FILTER (WHERE NOT is_income), 0) as total_amount,
         COALESCE(SUM(amount) FILTER (WHERE is_income), 0) as total_income,
         COALESCE(SUM(CASE WHEN type = 'business' AND NOT is_income THEN amount ELSE 0 END), 0) as business_amount,
         COALESCE(SUM(CASE WHEN type = 'personal' AND NOT is_income THEN amount ELSE 0 END), 0) as personal_amount,
         COALESCE(SUM(CASE WHEN is_deductible AND NOT is_income THEN deductible_amount ELSE 0 END), 0) as total_deductible,
         COUNT(*) FILTER (WHERE is_deductible AND NOT is_income) as deductible_count
       FROM expenses
       WHERE user_id = $1 AND date >= $2 AND date <= $3`,
      [userId, dateFrom, dateTo]
    );
    return rows[0];
  },

  async getByCategory(userId, dateFrom, dateTo) {
    const { rows } = await db.query(
      `SELECT
         c.id, c.name, c.icon, c.color, c.type as category_type,
         COUNT(e.id) as count,
         COALESCE(SUM(e.amount), 0) as total
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = $1 AND e.date >= $2 AND e.date <= $3
       GROUP BY c.id, c.name, c.icon, c.color, c.type
       ORDER BY total DESC`,
      [userId, dateFrom, dateTo]
    );
    return rows;
  },

  async getMonthlyTrend(userId, months = 12) {
    const { rows } = await db.query(
      `SELECT
         TO_CHAR(date_trunc('month', date), 'YYYY-MM') as month,
         COALESCE(SUM(amount) FILTER (WHERE NOT is_income), 0) as total,
         COALESCE(SUM(amount) FILTER (WHERE is_income), 0) as income,
         COALESCE(SUM(CASE WHEN type = 'business' AND NOT is_income THEN amount ELSE 0 END), 0) as business,
         COALESCE(SUM(CASE WHEN type = 'personal' AND NOT is_income THEN amount ELSE 0 END), 0) as personal,
         COALESCE(SUM(CASE WHEN is_deductible AND NOT is_income THEN deductible_amount ELSE 0 END), 0) as deductible
       FROM expenses
       WHERE user_id = $1 AND date >= NOW() - INTERVAL '${months} months'
       GROUP BY date_trunc('month', date)
       ORDER BY date_trunc('month', date) ASC`,
      [userId]
    );
    return rows;
  },

  async getDailySpend(userId, dateFrom, dateTo) {
    const { rows } = await db.query(
      `SELECT
         date::TEXT,
         COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       GROUP BY date ORDER BY date ASC`,
      [userId, dateFrom, dateTo]
    );
    return rows;
  },

  async getTopMerchants(userId, dateFrom, dateTo, limit = 5) {
    const { rows } = await db.query(
      `SELECT
         COALESCE(merchant_name, description) as merchant,
         COUNT(*) as count,
         SUM(amount) as total
       FROM expenses
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       GROUP BY COALESCE(merchant_name, description)
       ORDER BY total DESC LIMIT $4`,
      [userId, dateFrom, dateTo, limit]
    );
    return rows;
  },
};

module.exports = Expense;
