const express = require('express');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');
const { db, calculateUserStats, serializeUser } = require('../db/database');
const { createMotivationMessage } = require('./ai');

const router = express.Router();
const sessionRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/', sessionRateLimit, authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const durationMinutes = Number(req.body.durationMinutes || 0);
    const xpGained = Number(req.body.xpGained || 25);
    const startTime = req.body.startTime || new Date(Date.now() - durationMinutes * 60000).toISOString();
    const endTime = req.body.endTime || new Date().toISOString();

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (durationMinutes <= 0) {
      return res.status(400).json({ error: 'durationMinutes must be greater than zero.' });
    }

    const combinedXp = user.xp + xpGained;
    const levelGained = Math.floor(combinedXp / 100);
    const nextXp = combinedXp % 100;
    const nextLevel = user.level + levelGained;

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO pomodoro_sessions (user_id, start_time, end_time, xp_gained, level_gained, duration_minutes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(user.id, startTime, endTime, xpGained, levelGained, durationMinutes);

      db.prepare(`
        UPDATE users
        SET xp = ?,
            level = ?,
            total_pomodoros = total_pomodoros + 1,
            total_focus_time = total_focus_time + ?
        WHERE id = ?
      `).run(nextXp, nextLevel, durationMinutes, user.id);
    });

    transaction();

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    const stats = calculateUserStats(user.id);

    return res.status(201).json({
      user: serializeUser(updatedUser),
      stats,
      motivation: levelGained > 0 ? createMotivationMessage(updatedUser.level) : null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to save session.', details: error.message });
  }
});

router.get('/stats', sessionRateLimit, authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      user: serializeUser(user),
      stats: calculateUserStats(user.id)
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch statistics.', details: error.message });
  }
});

module.exports = router;
