const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../config/db');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM categories WHERE user_id = $1 OR is_default = true ORDER BY is_default DESC, name ASC`,
      [req.user.id]
    );
    res.json({ categories: rows });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;
    const { rows } = await db.query(
      `INSERT INTO categories (user_id, name, type, icon, color) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, name, type, icon || 'tag', color || '#6B7280']
    );
    res.status(201).json({ category: rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'CAT_001', message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
