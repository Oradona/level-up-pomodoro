const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'levelup.sqlite');
const db = new Database(dbPath);
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-secret';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production.');
  }
  console.warn('JWT_SECRET is not set. Using a development-only fallback secret.');
}

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    total_pomodoros INTEGER NOT NULL DEFAULT 0,
    total_focus_time INTEGER NOT NULL DEFAULT 0,
    settings_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    xp_gained INTEGER NOT NULL DEFAULT 25,
    level_gained INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    addressee_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TEXT,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_start_time ON pomodoro_sessions(start_time);
  CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
  CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
`);

function toDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function isSameDay(value, compareDate = new Date()) {
  return toDateKey(value) === toDateKey(compareDate);
}

function calculateBestStreak(sessions) {
  const uniqueDates = [...new Set(sessions.map((session) => toDateKey(session.start_time)))].sort();
  if (uniqueDates.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previous = new Date(uniqueDates[index - 1]);
    const currentDate = new Date(uniqueDates[index]);
    const difference = Math.round((currentDate - previous) / 86400000);

    if (difference === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

function calculateDailyBreakdown(sessions) {
  const today = new Date();
  const days = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - offset);
    const key = toDateKey(date);
    const daySessions = sessions.filter((session) => toDateKey(session.start_time) === key);

    days.push({
      date: key,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      pomodoros: daySessions.length,
      minutes: daySessions.reduce((sum, session) => sum + Number(session.duration_minutes || 0), 0)
    });
  }

  return days;
}

function calculateHourlyProductivity(sessions) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    sessions: 0,
    minutes: 0
  }));

  sessions.forEach((session) => {
    const hour = new Date(session.start_time).getHours();
    buckets[hour].sessions += 1;
    buckets[hour].minutes += Number(session.duration_minutes || 0);
  });

  return buckets;
}

function calculateUserStats(userId) {
  const sessions = db
    .prepare('SELECT * FROM pomodoro_sessions WHERE user_id = ? ORDER BY start_time ASC')
    .all(userId);

  const todaySessions = sessions.filter((session) => isSameDay(session.start_time));
  const weekCutoff = new Date();
  weekCutoff.setHours(0, 0, 0, 0);
  weekCutoff.setDate(weekCutoff.getDate() - 6);

  const weekSessions = sessions.filter((session) => new Date(session.start_time) >= weekCutoff);
  const totalFocusTime = sessions.reduce((sum, session) => sum + Number(session.duration_minutes || 0), 0);
  const dailyBreakdown = calculateDailyBreakdown(sessions);

  return {
    today: {
      completedPomodoros: todaySessions.length,
      totalFocusTime: todaySessions.reduce((sum, session) => sum + Number(session.duration_minutes || 0), 0)
    },
    week: {
      totalPomodoros: weekSessions.length,
      avgDaily: Number((weekSessions.length / 7).toFixed(1)),
      totalFocusTime: weekSessions.reduce((sum, session) => sum + Number(session.duration_minutes || 0), 0),
      dailyBreakdown
    },
    bestStreak: calculateBestStreak(sessions),
    totalFocusTime,
    hourlyProductivity: calculateHourlyProductivity(sessions),
    recentSessions: sessions.slice(-10).reverse()
  };
}

function serializeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    level: user.level,
    xp: user.xp,
    totalPomodoros: user.total_pomodoros,
    totalFocusTime: user.total_focus_time,
    settings: JSON.parse(user.settings_json || '{}'),
    createdAt: user.created_at
  };
}

function getFriendSummary(userId, currentUserContext) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const stats = calculateUserStats(userId);

  return {
    id: user.id,
    nickname: user.username,
    level: user.level,
    weeklyPomodoros: stats.week.totalPomodoros,
    totalXp: (user.level - 1) * 100 + user.xp,
    bestStreak: stats.bestStreak,
    totalFocusTime: user.total_focus_time,
    comparison: {
      weeklyGap: stats.week.totalPomodoros - currentUserContext.weeklyPomodoros,
      xpGap: ((user.level - 1) * 100 + user.xp) - currentUserContext.totalXp,
      levelGap: user.level - currentUserContext.level
    }
  };
}

module.exports = {
  db,
  JWT_SECRET,
  calculateUserStats,
  getFriendSummary,
  serializeUser
};
