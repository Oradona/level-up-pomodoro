import {
  DEFAULT_NOISE,
  DEFAULT_SETTINGS,
  Friend,
  NoiseSettings,
  PomodoroRecord,
  SETTINGS_LIMITS,
  TimerSettings,
  XPState,
  XP_PER_LEVEL,
} from './types';

export const STORAGE_KEYS = {
  settings: 'lup:settings',
  xp: 'lup:xp',
  records: 'lup:records',
  friends: 'lup:friends',
  noise: 'lup:noise',
  pomodoroCount: 'lup:pomodoroCount',
} as const;

const isBrowser = () => typeof window !== 'undefined';

export function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode / quota) - ignore */
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function sanitizeSettings(input: Partial<TimerSettings> | null): TimerSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(input ?? {}) };
  return {
    focusMinutes: clamp(
      Math.round(Number(merged.focusMinutes) || DEFAULT_SETTINGS.focusMinutes),
      SETTINGS_LIMITS.focusMinutes.min,
      SETTINGS_LIMITS.focusMinutes.max
    ),
    shortBreakMinutes: clamp(
      Math.round(Number(merged.shortBreakMinutes) || DEFAULT_SETTINGS.shortBreakMinutes),
      SETTINGS_LIMITS.shortBreakMinutes.min,
      SETTINGS_LIMITS.shortBreakMinutes.max
    ),
    longBreakMinutes: clamp(
      Math.round(Number(merged.longBreakMinutes) || DEFAULT_SETTINGS.longBreakMinutes),
      SETTINGS_LIMITS.longBreakMinutes.min,
      SETTINGS_LIMITS.longBreakMinutes.max
    ),
    pomodorosUntilLongBreak: clamp(
      Math.round(Number(merged.pomodorosUntilLongBreak) || DEFAULT_SETTINGS.pomodorosUntilLongBreak),
      2,
      8
    ),
    autoStartNext: Boolean(merged.autoStartNext),
  };
}

export function loadSettings(): TimerSettings {
  return sanitizeSettings(readJSON<Partial<TimerSettings> | null>(STORAGE_KEYS.settings, null));
}

export function saveSettings(settings: TimerSettings): void {
  writeJSON(STORAGE_KEYS.settings, sanitizeSettings(settings));
}

export function levelFromXP(totalXP: number): number {
  return Math.floor(Math.max(0, totalXP) / XP_PER_LEVEL) + 1;
}

export function loadXP(): XPState {
  const state = readJSON<XPState>(STORAGE_KEYS.xp, { totalXP: 0, level: 1 });
  const totalXP = Math.max(0, Math.round(Number(state?.totalXP) || 0));
  return { totalXP, level: levelFromXP(totalXP) };
}

export function saveXP(state: XPState): void {
  writeJSON(STORAGE_KEYS.xp, state);
}

export function loadRecords(): PomodoroRecord[] {
  const records = readJSON<PomodoroRecord[]>(STORAGE_KEYS.records, []);
  if (!Array.isArray(records)) return [];
  return records.filter(
    (r) => r && typeof r.timestamp === 'string' && !Number.isNaN(Date.parse(r.timestamp))
  );
}

export function saveRecords(records: PomodoroRecord[]): void {
  writeJSON(STORAGE_KEYS.records, records);
}

export function loadNoise(): NoiseSettings {
  const noise = readJSON<NoiseSettings>(STORAGE_KEYS.noise, DEFAULT_NOISE);
  return {
    enabled: Boolean(noise?.enabled),
    type: (['rain', 'ocean', 'cafe', 'forest'] as const).includes(noise?.type)
      ? noise.type
      : DEFAULT_NOISE.type,
    volume: clamp(Number(noise?.volume ?? DEFAULT_NOISE.volume), 0, 1),
  };
}

export function saveNoise(noise: NoiseSettings): void {
  writeJSON(STORAGE_KEYS.noise, noise);
}

export const MOCK_FRIENDS: Friend[] = [
  {
    id: 'f-jimin',
    username: '지민',
    email: 'jimin@example.com',
    level: 12,
    weeklyPomodoros: 21,
    totalXP: 1180,
    bestStreak: 14,
    status: 'accepted',
  },
  {
    id: 'f-minsu',
    username: '민수',
    email: 'minsu@example.com',
    level: 7,
    weeklyPomodoros: 12,
    totalXP: 640,
    bestStreak: 6,
    status: 'accepted',
  },
  {
    id: 'f-hana',
    username: '하나',
    email: 'hana@example.com',
    level: 19,
    weeklyPomodoros: 33,
    totalXP: 1875,
    bestStreak: 27,
    status: 'accepted',
  },
  {
    id: 'f-daniel',
    username: 'daniel',
    email: 'daniel@example.com',
    level: 4,
    weeklyPomodoros: 5,
    totalXP: 320,
    bestStreak: 3,
    status: 'received',
  },
  {
    id: 'f-sora',
    username: '소라',
    email: 'sora@example.com',
    level: 9,
    weeklyPomodoros: 16,
    totalXP: 870,
    bestStreak: 11,
    status: 'pending',
  },
];

export function loadFriends(): Friend[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEYS.friends);
  if (!raw) {
    writeJSON(STORAGE_KEYS.friends, MOCK_FRIENDS);
    return MOCK_FRIENDS;
  }
  const parsed = readJSON<Friend[]>(STORAGE_KEYS.friends, MOCK_FRIENDS);
  return Array.isArray(parsed) ? parsed : MOCK_FRIENDS;
}

export function saveFriends(friends: Friend[]): void {
  writeJSON(STORAGE_KEYS.friends, friends);
}

export function loadPomodoroCount(): number {
  return Math.max(0, Math.round(Number(readJSON<number>(STORAGE_KEYS.pomodoroCount, 0)) || 0));
}

export function savePomodoroCount(count: number): void {
  writeJSON(STORAGE_KEYS.pomodoroCount, count);
}

export function resetAll(): void {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
}
