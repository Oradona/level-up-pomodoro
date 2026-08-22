const express = require('express');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');
const { db, calculateUserStats, getFriendSummary } = require('../db/database');

const router = express.Router();
const friendsRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false
});

function getFriendOverview(userId) {
  const currentUser = db.prepare('SELECT level, xp FROM users WHERE id = ?').get(userId);
  const currentUserStats = calculateUserStats(userId);
  const currentUserContext = {
    level: currentUser.level,
    totalXp: (currentUser.level - 1) * 100 + currentUser.xp,
    weeklyPomodoros: currentUserStats.week.totalPomodoros
  };

  const friendRows = db.prepare(`
    SELECT
      f.id AS friendshipId,
      CASE
        WHEN f.requester_id = ? THEN f.addressee_id
        ELSE f.requester_id
      END AS friendId
    FROM friendships f
    WHERE (f.requester_id = ? OR f.addressee_id = ?)
      AND f.status = 'accepted'
    ORDER BY f.created_at DESC
  `).all(userId, userId, userId);

  const pendingReceived = db.prepare(`
    SELECT f.id, u.username, u.email, f.created_at
    FROM friendships f
    JOIN users u ON u.id = f.requester_id
    WHERE f.addressee_id = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `).all(userId).map((request) => ({
    id: request.id,
    nickname: request.username,
    email: request.email,
    createdAt: request.created_at
  }));

  const pendingSent = db.prepare(`
    SELECT f.id, u.username, u.email, f.created_at
    FROM friendships f
    JOIN users u ON u.id = f.addressee_id
    WHERE f.requester_id = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `).all(userId).map((request) => ({
    id: request.id,
    nickname: request.username,
    email: request.email,
    createdAt: request.created_at
  }));

  return {
    friends: friendRows.map((row) => ({
      friendshipId: row.friendshipId,
      ...getFriendSummary(row.friendId, currentUserContext)
    })),
    pendingReceived,
    pendingSent
  };
}

function sendFriendRequest(req, res) {
  try {
    const identifier = String(req.body.identifier || '').trim().toLowerCase();
    const requestedUserId = Number(req.body.userId || 0);
    const currentUserId = req.user.id;

    const target = requestedUserId
      ? db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(requestedUserId)
      : db.prepare('SELECT id, username, email FROM users WHERE lower(username) = ? OR lower(email) = ?').get(identifier, identifier);

    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (target.id === currentUserId) {
      return res.status(400).json({ error: 'You cannot add yourself.' });
    }

    const existing = db.prepare(`
      SELECT * FROM friendships
      WHERE (requester_id = ? AND addressee_id = ?)
         OR (requester_id = ? AND addressee_id = ?)
    `).get(currentUserId, target.id, target.id, currentUserId);

    if (existing && existing.status === 'accepted') {
      return res.status(409).json({ error: 'You are already friends.' });
    }

    if (existing && existing.status === 'pending') {
      return res.status(409).json({ error: 'A friend request already exists.' });
    }

    if (existing && existing.status === 'rejected') {
      db.prepare(`
        UPDATE friendships
        SET requester_id = ?, addressee_id = ?, status = 'pending', created_at = CURRENT_TIMESTAMP, responded_at = NULL
        WHERE id = ?
      `).run(currentUserId, target.id, existing.id);
    } else {
      db.prepare(`
        INSERT INTO friendships (requester_id, addressee_id, status)
        VALUES (?, ?, 'pending')
      `).run(currentUserId, target.id);
    }

    return res.status(201).json({
      message: `Friend request sent to ${target.username}.`,
      ...getFriendOverview(currentUserId)
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to send friend request.', details: error.message });
  }
}

router.use(friendsRateLimit, authMiddleware);

router.get('/', (req, res) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase();
    if (search) {
      const relatedIds = new Set(
        db.prepare(`
          SELECT CASE
            WHEN requester_id = ? THEN addressee_id
            ELSE requester_id
          END AS related_user_id
          FROM friendships
          WHERE requester_id = ? OR addressee_id = ?
        `).all(req.user.id, req.user.id, req.user.id).map((row) => row.related_user_id)
      );

      const results = db.prepare(`
        SELECT id, username, email, level, xp, total_pomodoros, total_focus_time
        FROM users
        WHERE id != ?
          AND (lower(username) LIKE ? OR lower(email) LIKE ?)
        ORDER BY username ASC
        LIMIT 10
      `).all(req.user.id, `%${search}%`, `%${search}%`);

      const filtered = results.filter((candidate) => !relatedIds.has(candidate.id)).map((candidate) => ({
        id: candidate.id,
        username: candidate.username,
        email: candidate.email,
        level: candidate.level,
        totalXp: (candidate.level - 1) * 100 + candidate.xp,
        totalPomodoros: candidate.total_pomodoros,
        totalFocusTime: candidate.total_focus_time
      }));

      return res.json({ results: filtered });
    }

    return res.json(getFriendOverview(req.user.id));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch friends.', details: error.message });
  }
});

router.post('/', sendFriendRequest);
router.post('/request', sendFriendRequest);

router.put('/:id/respond', (req, res) => {
  try {
    const friendshipId = Number(req.params.id);
    const action = String(req.body.action || req.body.status || '').toLowerCase();
    const nextStatus = action === 'accept' || action === 'accepted' ? 'accepted' : 'rejected';

    const friendship = db.prepare(`
      SELECT * FROM friendships
      WHERE id = ? AND addressee_id = ? AND status = 'pending'
    `).get(friendshipId, req.user.id);

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found.' });
    }

    db.prepare(`
      UPDATE friendships
      SET status = ?, responded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextStatus, friendshipId);

    return res.json({
      message: `Request ${nextStatus}.`,
      ...getFriendOverview(req.user.id)
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to update request.', details: error.message });
  }
});

module.exports = router;
