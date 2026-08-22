'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadPomodoroCount,
  loadSettings,
  sanitizeSettings,
  savePomodoroCount,
  saveSettings,
} from '@/lib/storage';
import { DEFAULT_SETTINGS, SessionType, TimerSettings } from '@/lib/types';

export interface UsePomodoroOptions {
  onFocusComplete?: (durationMinutes: number) => void;
  onBreakComplete?: (type: 'shortBreak' | 'longBreak') => void;
}

export interface UsePomodoro {
  settings: TimerSettings;
  updateSettings: (patch: Partial<TimerSettings>) => void;
  sessionType: SessionType;
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  pomodoroCount: number;
  cycleProgress: number;
  hydrated: boolean;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
  setSession: (type: SessionType) => void;
}

function durationFor(type: SessionType, settings: TimerSettings): number {
  switch (type) {
    case 'focus':
      return settings.focusMinutes * 60;
    case 'shortBreak':
      return settings.shortBreakMinutes * 60;
    case 'longBreak':
      return settings.longBreakMinutes * 60;
    default:
      return settings.focusMinutes * 60;
  }
}

export function usePomodoro(options: UsePomodoroOptions = {}): UsePomodoro {
  const { onFocusComplete, onBreakComplete } = options;

  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_SETTINGS.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const settingsRef = useRef(settings);
  const sessionRef = useRef(sessionType);
  const countRef = useRef(pomodoroCount);
  const endTimeRef = useRef<number | null>(null);
  const timeLeftRef = useRef(timeLeft);
  const isRunningRef = useRef(isRunning);
  const callbacksRef = useRef({ onFocusComplete, onBreakComplete });

  settingsRef.current = settings;
  sessionRef.current = sessionType;
  countRef.current = pomodoroCount;
  timeLeftRef.current = timeLeft;
  isRunningRef.current = isRunning;
  callbacksRef.current = { onFocusComplete, onBreakComplete };

  useEffect(() => {
    const loaded = loadSettings();
    const count = loadPomodoroCount();
    settingsRef.current = loaded;
    countRef.current = count;
    setSettings(loaded);
    setPomodoroCount(count);
    setTimeLeft(loaded.focusMinutes * 60);
    setHydrated(true);
  }, []);

  const goToSession = useCallback((type: SessionType, autoStart: boolean) => {
    const duration = durationFor(type, settingsRef.current);
    sessionRef.current = type;
    setSessionType(type);
    setTimeLeft(duration);
    if (autoStart) {
      endTimeRef.current = Date.now() + duration * 1000;
      setIsRunning(true);
    } else {
      endTimeRef.current = null;
      setIsRunning(false);
    }
  }, []);

  const completeSession = useCallback(() => {
    const current = sessionRef.current;
    const currentSettings = settingsRef.current;

    if (current === 'focus') {
      const nextCount = countRef.current + 1;
      countRef.current = nextCount;
      setPomodoroCount(nextCount);
      savePomodoroCount(nextCount);
      callbacksRef.current.onFocusComplete?.(currentSettings.focusMinutes);

      const isLongBreak = nextCount % currentSettings.pomodorosUntilLongBreak === 0;
      goToSession(isLongBreak ? 'longBreak' : 'shortBreak', currentSettings.autoStartNext);
    } else {
      callbacksRef.current.onBreakComplete?.(current);
      goToSession('focus', currentSettings.autoStartNext);
    }
  }, [goToSession]);

  useEffect(() => {
    if (!isRunning) return undefined;
    if (endTimeRef.current === null) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    }

    const interval = window.setInterval(() => {
      const end = endTimeRef.current;
      if (end === null) return;
      const remaining = Math.max(0, Math.round((end - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        endTimeRef.current = null;
        completeSession();
      }
    }, 250);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, completeSession]);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    const value =
      timeLeftRef.current > 0
        ? timeLeftRef.current
        : durationFor(sessionRef.current, settingsRef.current);
    endTimeRef.current = Date.now() + value * 1000;
    timeLeftRef.current = value;
    isRunningRef.current = true;
    setTimeLeft(value);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    const end = endTimeRef.current;
    if (end !== null) {
      setTimeLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
    }
    endTimeRef.current = null;
    setIsRunning(false);
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) pause();
    else start();
  }, [isRunning, pause, start]);

  const reset = useCallback(() => {
    endTimeRef.current = null;
    setIsRunning(false);
    setTimeLeft(durationFor(sessionRef.current, settingsRef.current));
  }, []);

  const skip = useCallback(() => {
    endTimeRef.current = null;
    setIsRunning(false);
    completeSession();
  }, [completeSession]);

  const setSession = useCallback(
    (type: SessionType) => {
      goToSession(type, false);
    },
    [goToSession]
  );

  const updateSettings = useCallback((patch: Partial<TimerSettings>) => {
    setSettings((prev) => {
      const next = sanitizeSettings({ ...prev, ...patch });
      settingsRef.current = next;
      saveSettings(next);
      return next;
    });
  }, []);

  // Keep an idle timer in sync with duration changes made in Settings.
  useEffect(() => {
    if (!hydrated || isRunningRef.current) return;
    setTimeLeft(durationFor(sessionRef.current, settings));
  }, [settings, hydrated]);

  const totalTime = durationFor(sessionType, settings);

  return {
    settings,
    updateSettings,
    sessionType,
    timeLeft,
    totalTime,
    isRunning,
    pomodoroCount,
    cycleProgress: settings.pomodorosUntilLongBreak
      ? pomodoroCount % settings.pomodorosUntilLongBreak
      : 0,
    hydrated,
    start,
    pause,
    toggle,
    reset,
    skip,
    setSession,
  };
}
