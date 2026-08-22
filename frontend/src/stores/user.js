import { defineStore } from 'pinia';
import axios from 'axios';

const TOKEN_KEY = 'levelup-token';
const AUTH_USER_KEY = 'levelup-auth-user';
const GUEST_USER_KEY = 'levelup-guest-user';

const defaultGuestProfile = () => ({
  id: null,
  username: 'Guest',
  email: '',
  level: 1,
  xp: 0,
  totalPomodoros: 0,
  totalFocusTime: 0,
  settings: {}
});

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    profile: defaultGuestProfile(),
    levelUpModal: {
      visible: false,
      level: 1,
      message: ''
    }
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    xpPercent: (state) => Math.min(100, Math.round((state.profile.xp / 100) * 100)),
    totalXp: (state) => (state.profile.level - 1) * 100 + state.profile.xp
  },
  actions: {
    bootstrap() {
      this.token = localStorage.getItem(TOKEN_KEY) || '';
      const key = this.token ? AUTH_USER_KEY : GUEST_USER_KEY;
      const fallback = defaultGuestProfile();

      try {
        this.profile = JSON.parse(localStorage.getItem(key) || 'null') || fallback;
      } catch (error) {
        this.profile = fallback;
      }

      if (!this.token && !localStorage.getItem(GUEST_USER_KEY)) {
        localStorage.setItem(GUEST_USER_KEY, JSON.stringify(this.profile));
      }
    },
    persistProfile() {
      const key = this.token ? AUTH_USER_KEY : GUEST_USER_KEY;
      localStorage.setItem(key, JSON.stringify(this.profile));
    },
    syncProfile(user) {
      this.profile = {
        ...this.profile,
        ...user
      };
      this.persistProfile();
    },
    setAuthenticated(data) {
      this.token = data.token;
      this.profile = data.user;
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    },
    async register(payload) {
      const { data } = await axios.post('/api/auth/register', payload);
      this.setAuthenticated(data);
      return data;
    },
    async login(payload) {
      const { data } = await axios.post('/api/auth/login', payload);
      this.setAuthenticated(data);
      return data;
    },
    logout() {
      this.token = '';
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);

      const guest = JSON.parse(localStorage.getItem(GUEST_USER_KEY) || 'null') || defaultGuestProfile();
      this.profile = guest;
      this.levelUpModal = { visible: false, level: guest.level, message: '' };
    },
    applyGuestPomodoro(durationMinutes) {
      const earnedXp = 25;
      const combinedXp = this.profile.xp + earnedXp;
      const levelGained = Math.floor(combinedXp / 100);
      const xp = combinedXp % 100;
      const level = this.profile.level + levelGained;

      this.profile = {
        ...this.profile,
        level,
        xp,
        totalPomodoros: this.profile.totalPomodoros + 1,
        totalFocusTime: this.profile.totalFocusTime + Number(durationMinutes || 0)
      };
      this.persistProfile();

      return {
        levelGained,
        earnedXp,
        level
      };
    },
    async fetchMotivation(level) {
      try {
        const { data } = await axios.post('/api/ai/motivate', { level });
        return data.message;
      } catch (error) {
        return 'Your next level exists because you kept showing up. Continue with discipline.';
      }
    },
    showLevelUp(level, message) {
      this.levelUpModal = {
        visible: true,
        level,
        message
      };
    },
    hideLevelUp() {
      this.levelUpModal.visible = false;
    }
  }
});
