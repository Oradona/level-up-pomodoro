import { defineStore } from 'pinia';

const STORAGE_KEY = 'levelup-settings';
const defaultSettings = {
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  cyclesUntilLongBreak: 4,
  whiteNoiseEnabled: false,
  whiteNoiseType: 'rain'
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || min));

export const useSettingsStore = defineStore('settings', {
  state: () => ({ ...defaultSettings }),
  getters: {
    focusSeconds: (state) => state.focusMinutes * 60,
    breakSeconds: (state) => state.breakMinutes * 60,
    longBreakSeconds: (state) => state.longBreakMinutes * 60
  },
  actions: {
    loadSettings() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      try {
        const parsed = JSON.parse(saved);
        this.focusMinutes = clamp(parsed.focusMinutes ?? this.focusMinutes, 15, 60);
        this.breakMinutes = clamp(parsed.breakMinutes ?? this.breakMinutes, 1, 15);
        this.longBreakMinutes = clamp(parsed.longBreakMinutes ?? this.longBreakMinutes, 5, 30);
        this.cyclesUntilLongBreak = clamp(parsed.cyclesUntilLongBreak ?? this.cyclesUntilLongBreak, 2, 8);
        this.whiteNoiseEnabled = Boolean(parsed.whiteNoiseEnabled);
        this.whiteNoiseType = parsed.whiteNoiseType || 'rain';
      } catch (error) {
        console.warn('Unable to load settings', error);
      }
    },
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          focusMinutes: this.focusMinutes,
          breakMinutes: this.breakMinutes,
          longBreakMinutes: this.longBreakMinutes,
          cyclesUntilLongBreak: this.cyclesUntilLongBreak,
          whiteNoiseEnabled: this.whiteNoiseEnabled,
          whiteNoiseType: this.whiteNoiseType
        })
      );
    },
    setFocusMinutes(value) {
      this.focusMinutes = clamp(value, 15, 60);
      this.persist();
    },
    setBreakMinutes(value) {
      this.breakMinutes = clamp(value, 1, 15);
      this.persist();
    },
    setWhiteNoiseEnabled(value) {
      this.whiteNoiseEnabled = Boolean(value);
      this.persist();
    },
    setWhiteNoiseType(value) {
      this.whiteNoiseType = value;
      this.persist();
    }
  }
});
