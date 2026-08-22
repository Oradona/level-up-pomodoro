const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { db, JWT_SECRET, serializeUser } = require('../db/database');

const router = express.Router();
const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', authRateLimit, async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!username || !email || password.length < 6) {
      return res.status(400).json({ error: 'Username, email, and a password of at least 6 characters are required.' });
    }

    const existing = db
      .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, email);

    if (existing) {
      return res.status(409).json({ error: 'A user with that username or email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = db
      .prepare(`
        INSERT INTO users (username, email, password_hash)
        VALUES (?, ?, ?)
      `)
      .run(username, email, passwordHash);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = signToken(user);

    return res.status(201).json({ token, user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to register user.', details: error.message });
  }
});

router.post('/login', authRateLimit, async (req, res) => {
  try {
    const identifier = String(req.body.identifier || req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required.' });
    }

    const user = db
      .prepare('SELECT * FROM users WHERE lower(email) = ? OR lower(username) = ?')
      .get(identifier, identifier);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = signToken(user);
    return res.json({ token, user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to log in.', details: error.message });
  }
});

module.exports = router;
