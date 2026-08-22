import { defineStore } from 'pinia';
import axios from 'axios';
import { useUserStore } from './user';

const STORAGE_KEY = 'levelup-local-sessions';

const createEmptyStats = () => ({
  today: { completedPomodoros: 0, totalFocusTime: 0 },
  week: {
    totalPomodoros: 0,
    avgDaily: 0,
    totalFocusTime: 0,
    dailyBreakdown: []
  },
  bestStreak: 0,
  totalFocusTime: 0,
  hourlyProductivity: Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    sessions: 0,
    minutes: 0
  })),
  recentSessions: []
});

const toDateKey = (value) => new Date(value).toISOString().slice(0, 10);

function calculateBestStreak(sessions) {
  const uniqueDates = [...new Set(sessions.map((session) => toDateKey(session.startTime)))].sort();
  if (!uniqueDates.length) return 0;

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

function buildStats(sessions) {
  const allSessions = [...sessions].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const stats = createEmptyStats();
  const todayKey = toDateKey(new Date());
  const weekCutoff = new Date();
  weekCutoff.setHours(0, 0, 0, 0);
  weekCutoff.setDate(weekCutoff.getDate() - 6);

  stats.recentSessions = [...allSessions].reverse().slice(0, 10);
  stats.totalFocusTime = allSessions.reduce((sum, session) => sum + Number(session.durationMinutes || 0), 0);
  stats.bestStreak = calculateBestStreak(allSessions);

  const dailyBreakdown = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = toDateKey(date);
    const daySessions = allSessions.filter((session) => toDateKey(session.startTime) === key);
    dailyBreakdown.push({
      date: key,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      pomodoros: daySessions.length,
      minutes: daySessions.reduce((sum, session) => sum + Number(session.durationMinutes || 0), 0)
    });
  }

  stats.week.dailyBreakdown = dailyBreakdown;

  allSessions.forEach((session) => {
    const key = toDateKey(session.startTime);
    const hour = new Date(session.startTime).getHours();
    stats.hourlyProductivity[hour].sessions += 1;
    stats.hourlyProductivity[hour].minutes += Number(session.durationMinutes || 0);

    if (key === todayKey) {
      stats.today.completedPomodoros += 1;
      stats.today.totalFocusTime += Number(session.durationMinutes || 0);
    }

    if (new Date(session.startTime) >= weekCutoff) {
      stats.week.totalPomodoros += 1;
      stats.week.totalFocusTime += Number(session.durationMinutes || 0);
    }
  });

  stats.week.avgDaily = Number((stats.week.totalPomodoros / 7).toFixed(1));
  return stats;
}

export const useStatsStore = defineStore('stats', {
  state: () => ({
    localSessions: [],
    stats: createEmptyStats()
  }),
  actions: {
    initialize() {
      try {
        this.localSessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      } catch (error) {
        this.localSessions = [];
      }
      this.refreshStats();
    },
    persistLocalSessions() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.localSessions));
    },
    async refreshStats() {
      const userStore = useUserStore();
      if (userStore.isAuthenticated) {
        try {
          const { data } = await axios.get('/api/sessions/stats');
          this.stats = data.stats;
          userStore.syncProfile(data.user);
          return;
        } catch (error) {
          console.warn('Falling back to local statistics', error);
        }
      }
      this.stats = buildStats(this.localSessions);
    },
    async recordCompletedSession(session) {
      const userStore = useUserStore();
      if (userStore.isAuthenticated) {
        try {
          const { data } = await axios.post('/api/sessions', session);
          this.stats = data.stats;
          userStore.syncProfile(data.user);
          if (data.motivation?.message) {
            userStore.showLevelUp(data.user.level, data.motivation.message);
          }
        } catch (error) {
          console.error('Unable to sync completed session', error);
        }
        return;
      }

      this.localSessions.push({
        ...session,
        xpGained: session.xpGained || 25
      });
      this.persistLocalSessions();
      const reward = userStore.applyGuestPomodoro(session.durationMinutes);
      this.stats = buildStats(this.localSessions);

      if (reward.levelGained > 0) {
        const message = await userStore.fetchMotivation(reward.level);
        userStore.showLevelUp(reward.level, message);
      }
    }
  }
});
