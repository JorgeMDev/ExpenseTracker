const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const signToken = (payload, secret, expiresIn) =>
  jwt.sign(payload, secret, { expiresIn });

const authController = {
  async register(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'AUTH_003', message: errors.array()[0].msg });
    }
    try {
      const { email, password, name } = req.body;
      const existing = await User.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'AUTH_004', message: 'Email already registered' });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ email, passwordHash, name });

      const accessToken = signToken({ id: user.id, email: user.email }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
      const refreshToken = signToken({ id: user.id }, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN);
      await User.updateRefreshToken(user.id, refreshToken);

      res.status(201).json({ user, accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'AUTH_003', message: errors.array()[0].msg });
    }
    try {
      const { email, password } = req.body;
      const user = await User.findByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'AUTH_005', message: 'Invalid credentials' });
      }

      const accessToken = signToken({ id: user.id, email: user.email }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
      const refreshToken = signToken({ id: user.id }, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN);
      await User.updateRefreshToken(user.id, refreshToken);

      const { password_hash, refresh_token, ...safeUser } = user;
      res.json({ user: safeUser, accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req, res, next) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'AUTH_006', message: 'Refresh token required' });
    }
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ error: 'AUTH_007', message: 'User not found' });

      const accessToken = signToken({ id: user.id, email: user.email }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
      res.json({ accessToken });
    } catch {
      res.status(401).json({ error: 'AUTH_002', message: 'Invalid refresh token' });
    }
  },

  async me(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'AUTH_007', message: 'User not found' });
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      await User.updateRefreshToken(req.user.id, null);
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const user = await User.update(req.user.id, req.body);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
