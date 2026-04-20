const db = require('../config/db');
const categoryService = require('../services/categoryService');
const taxService = require('../services/taxService');

module.exports = {
  async importCSV(req, res, next) {
    try {
      const { transactions } = req.body;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(422).json({ error: 'IMP_001', message: 'No transactions provided' });
      }
      if (transactions.length > 500) {
        return res.status(422).json({ error: 'IMP_002', message: 'Max 500 transactions per import' });
      }

      let imported = 0;
      let skipped = 0;

      for (const tx of transactions) {
        if (!tx.date || !tx.amount || !tx.description || !tx.transaction_id) {
          skipped++;
          continue;
        }

        // Scope fingerprint to user so two users importing the same file don't collide
        const transactionId = `${tx.transaction_id}_u${req.user.id}`;

        const suggestedCategoryName = categoryService.suggestCategory(
          tx.description,
          tx.merchant_name || ''
        );

        const { rows: catRows } = await db.query(
          'SELECT id FROM categories WHERE user_id = $1 AND name = $2 LIMIT 1',
          [req.user.id, suggestedCategoryName]
        );
        const category_id = catRows[0]?.id || null;

        const expenseData = {
          transaction_id: transactionId,
          date: tx.date,
          amount: parseFloat(tx.amount),
          currency: tx.currency || 'USD',
          description: tx.description,
          merchant_name: tx.merchant_name || null,
          type: tx.type || 'personal',
          source: 'csv',
          category_id,
        };

        const enriched = taxService.analyze(expenseData);

        const result = await db.query(
          `INSERT INTO expenses
            (user_id, transaction_id, date, amount, currency, description, merchant_name,
             category_id, type, is_deductible, deductible_percentage, deductible_amount,
             deduction_rule, source)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           ON CONFLICT (transaction_id) DO NOTHING
           RETURNING id`,
          [
            req.user.id, enriched.transaction_id, enriched.date, enriched.amount,
            enriched.currency, enriched.description, enriched.merchant_name,
            enriched.category_id, enriched.type, enriched.is_deductible || false,
            enriched.deductible_percentage || 0, enriched.deductible_amount || 0,
            enriched.deduction_rule, 'csv',
          ]
        );

        if (result.rowCount > 0) {
          imported++;
        } else {
          skipped++;
        }
      }

      res.json({ imported, skipped, total: transactions.length });
    } catch (err) {
      next(err);
    }
  },
};
