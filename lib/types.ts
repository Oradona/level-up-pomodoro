export type SessionType = 'focus' | 'shortBreak' | 'longBreak';

export type NoiseType = 'rain' | 'ocean' | 'cafe' | 'forest';

export interface TimerSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  pomodorosUntilLongBreak: number;
  autoStartNext: boolean;
}

export interface XPState {
  totalXP: number;
  level: number;
}

export interface PomodoroRecord {
  /** ISO timestamp of when the pomodoro was completed */
  timestamp: string;
  /** focus duration in minutes */
  duration: number;
}

export type FriendStatus = 'accepted' | 'pending' | 'received';

export interface Friend {
  id: string;
  username: string;
  email: string;
  level: number;
  weeklyPomodoros: number;
  totalXP: number;
  bestStreak: number;
  status: FriendStatus;
}

export interface NoiseSettings {
  enabled: boolean;
  type: NoiseType;
  volume: number;
}

export const XP_PER_POMODORO = 25;
export const XP_PER_LEVEL = 100;

export const DEFAULT_SETTINGS: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  pomodorosUntilLongBreak: 4,
  autoStartNext: false,
};

export const DEFAULT_NOISE: NoiseSettings = {
  enabled: false,
  type: 'rain',
  volume: 0.4,
};

export const SETTINGS_LIMITS = {
  focusMinutes: { min: 15, max: 60 },
  shortBreakMinutes: { min: 1, max: 15 },
  longBreakMinutes: { min: 10, max: 30 },
};
