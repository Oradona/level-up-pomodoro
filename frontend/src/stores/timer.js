import { defineStore } from 'pinia';
import { useSettingsStore } from './settings';

export const useTimerStore = defineStore('timer', {
  state: () => ({
    mode: 'focus',
    secondsRemaining: 1500,
    remainingAtStart: 1500,
    isRunning: false,
    pomodoroCount: 0,
    currentSessionStart: null,
    startedAt: null,
    intervalHandle: null,
    lastCompletedSession: null
  }),
  getters: {
    formattedTime: (state) => {
      const minutes = String(Math.floor(state.secondsRemaining / 60)).padStart(2, '0');
      const seconds = String(state.secondsRemaining % 60).padStart(2, '0');
      return `${minutes}:${seconds}`;
    },
    modeLabel: (state) => {
      if (state.mode === 'longBreak') return 'Long Break';
      return state.mode === 'focus' ? 'Focus Mode' : 'Short Break';
    }
  },
  actions: {
    initialize() {
      this.applySettings();
    },
    getDurationForMode(mode = this.mode) {
      const settingsStore = useSettingsStore();
      if (mode === 'focus') return settingsStore.focusMinutes * 60;
      if (mode === 'longBreak') return settingsStore.longBreakMinutes * 60;
      return settingsStore.breakMinutes * 60;
    },
    applySettings() {
      if (!this.isRunning) {
        const nextDuration = this.getDurationForMode(this.mode);
        this.remainingAtStart = nextDuration;
        this.secondsRemaining = nextDuration;
      }
    },
    start() {
      if (this.isRunning) return;
      if (this.mode === 'focus' && !this.currentSessionStart) {
        this.currentSessionStart = new Date().toISOString();
      }
      this.isRunning = true;
      this.startedAt = Date.now();
      this.remainingAtStart = this.secondsRemaining;
      this.intervalHandle = window.setInterval(() => {
        this.tick();
      }, 250);
    },
    tick() {
      const elapsed = Math.floor((Date.now() - this.startedAt) / 1000);
      const nextValue = Math.max(this.remainingAtStart - elapsed, 0);
      this.secondsRemaining = nextValue;

      if (nextValue === 0) {
        this.completeCurrentMode();
      }
    },
    pause() {
      if (!this.isRunning) return;
      window.clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      this.isRunning = false;
      this.startedAt = null;
    },
    reset() {
      this.pause();
      this.currentSessionStart = null;
      const duration = this.getDurationForMode(this.mode);
      this.remainingAtStart = duration;
      this.secondsRemaining = duration;
    },
    completeCurrentMode() {
      this.pause();
      const completedMode = this.mode;
      if (completedMode === 'focus') {
        const durationMinutes = Math.round(this.getDurationForMode('focus') / 60);
        const endTime = new Date().toISOString();
        this.pomodoroCount += 1;
        this.lastCompletedSession = {
          id: Date.now(),
          mode: 'focus',
          startTime: this.currentSessionStart || new Date(Date.now() - durationMinutes * 60000).toISOString(),
          endTime,
          durationMinutes,
          xpGained: 25
        };
        this.currentSessionStart = null;
        const settingsStore = useSettingsStore();
        this.mode = this.pomodoroCount % settingsStore.cyclesUntilLongBreak === 0 ? 'longBreak' : 'break';
      } else {
        this.mode = 'focus';
      }

      const duration = this.getDurationForMode(this.mode);
      this.remainingAtStart = duration;
      this.secondsRemaining = duration;
    },
    clearCompletedSession() {
      this.lastCompletedSession = null;
    }
  }
});
