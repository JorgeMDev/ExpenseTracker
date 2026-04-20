const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const categoryService = require('../services/categoryService');
const taxService = require('../services/taxService');

const expenseController = {
  async getAll(req, res, next) {
    try {
      const filters = {
        type: req.query.type,
        category_id: req.query.category_id,
        is_deductible: req.query.is_deductible === 'true' ? true : req.query.is_deductible === 'false' ? false : undefined,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        search: req.query.search,
        sort: req.query.sort,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0,
      };
      const [expenses, total] = await Promise.all([
        Expense.findAll(req.user.id, filters),
        Expense.count(req.user.id, filters),
      ]);
      res.json({ expenses, total, limit: parseInt(filters.limit), offset: parseInt(filters.offset) });
    } catch (err) {
      next(err);
    }
  },

  async getOne(req, res, next) {
    try {
      const expense = await Expense.findById(req.params.id, req.user.id);
      if (!expense) return res.status(404).json({ error: 'EXP_001', message: 'Expense not found' });
      res.json({ expense });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'EXP_002', message: errors.array()[0].msg });
    }
    try {
      const enriched = await taxService.analyze(req.body);
      const expense = await Expense.create(req.user.id, enriched);
      res.status(201).json({ expense });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const enriched = await taxService.analyze({ ...req.body });
      const expense = await Expense.update(req.params.id, req.user.id, enriched);
      if (!expense) return res.status(404).json({ error: 'EXP_001', message: 'Expense not found' });
      res.json({ expense });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const deleted = await Expense.delete(req.params.id, req.user.id);
      if (!deleted) return res.status(404).json({ error: 'EXP_001', message: 'Expense not found' });
      res.json({ message: 'Expense deleted' });
    } catch (err) {
      next(err);
    }
  },

  async getSummary(req, res, next) {
    try {
      const { date_from, date_to } = req.query;
      const from = date_from || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const to = date_to || new Date().toISOString().split('T')[0];
      const summary = await Expense.getSummary(req.user.id, from, to);
      res.json({ summary });
    } catch (err) {
      next(err);
    }
  },

  async analyze(req, res, next) {
    try {
      const suggestion = await taxService.analyze(req.body);
      res.json({ suggestion });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = expenseController;
