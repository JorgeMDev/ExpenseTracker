const Expense = require('../models/Expense');
const taxService = require('../services/taxService');

const reportController = {
  async summary(req, res, next) {
    try {
      const { date_from, date_to } = req.query;
      const from = date_from || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const to = date_to || new Date().toISOString().split('T')[0];

      const [summary, byCategory, monthlyTrend, topMerchants] = await Promise.all([
        Expense.getSummary(req.user.id, from, to),
        Expense.getByCategory(req.user.id, from, to),
        Expense.getMonthlyTrend(req.user.id, 12),
        Expense.getTopMerchants(req.user.id, from, to, 5),
      ]);

      res.json({ summary, byCategory, monthlyTrend, topMerchants, period: { from, to } });
    } catch (err) {
      next(err);
    }
  },

  async taxReport(req, res, next) {
    try {
      const year = req.query.year || new Date().getFullYear();
      const from = `${year}-01-01`;
      const to = `${year}-12-31`;

      const [summary, byCategory] = await Promise.all([
        Expense.getSummary(req.user.id, from, to),
        Expense.getByCategory(req.user.id, from, to),
      ]);

      const deductibleCategories = byCategory.filter(c => c.category_type === 'business' || c.category_type === 'mixed');
      const rules = taxService.getRules();

      res.json({
        year: parseInt(year),
        period: { from, to },
        totalExpenses: parseFloat(summary.total_amount),
        totalDeductible: parseFloat(summary.total_deductible),
        deductibleExpenses: parseInt(summary.deductible_count),
        estimatedTaxSavings: parseFloat((summary.total_deductible * 0.25).toFixed(2)),
        byCategory: deductibleCategories,
        applicableRules: rules,
      });
    } catch (err) {
      next(err);
    }
  },

  async dailySpend(req, res, next) {
    try {
      const { date_from, date_to } = req.query;
      const from = date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const to = date_to || new Date().toISOString().split('T')[0];
      const data = await Expense.getDailySpend(req.user.id, from, to);
      res.json({ data, period: { from, to } });
    } catch (err) {
      next(err);
    }
  },

  async deductionSuggestions(req, res, next) {
    try {
      const expenses = await Expense.findAll(req.user.id, {
        is_deductible: false,
        date_from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        limit: 200,
      });
      const suggestions = taxService.getSuggestions(expenses);
      res.json({ suggestions, count: suggestions.length });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reportController;
