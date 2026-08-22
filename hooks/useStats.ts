'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadRecords, saveRecords } from '@/lib/storage';
import { PomodoroRecord } from '@/lib/types';

export interface DailyBucket {
  date: string; // YYYY-MM-DD
  label: string;
  pomodoros: number;
  minutes: number;
}

export interface HourlyBucket {
  hour: number;
  pomodoros: number;
  minutes: number;
}

export interface StatsSummary {
  todayPomodoros: number;
  todayMinutes: number;
  weekPomodoros: number;
  weekMinutes: number;
  weeklyDailyAverage: number;
  bestStreak: number;
  currentStreak: number;
  totalPomodoros: number;
  totalMinutes: number;
  totalHours: number;
  last7Days: DailyBucket[];
  hourly: HourlyBucket[];
  mostProductiveHour: number | null;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function calculateStreaks(records: PomodoroRecord[]): {
  best: number;
  current: number;
} {
  if (records.length === 0) return { best: 0, current: 0 };

  const days = Array.from(new Set(records.map((r) => toDateKey(new Date(r.timestamp))))).sort();

  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    const prev = new Date(`${days[i - 1]}T00:00:00`);
    const curr = new Date(`${days[i]}T00:00:00`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    run = diffDays === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  const today = toDateKey(new Date());
  const yesterday = toDateKey(new Date(Date.now() - 86_400_000));
  const lastDay = days[days.length - 1];

  let current = 0;
  if (lastDay === today || lastDay === yesterday) {
    current = 1;
    for (let i = days.length - 1; i > 0; i -= 1) {
      const prev = new Date(`${days[i - 1]}T00:00:00`);
      const curr = new Date(`${days[i]}T00:00:00`);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
      if (diffDays === 1) current += 1;
      else break;
    }
  }

  return { best, current };
}

export function summarize(records: PomodoroRecord[]): StatsSummary {
  const now = new Date();
  const todayKey = toDateKey(now);

  const last7Days: DailyBucket[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * 86_400_000);
    last7Days.push({
      date: toDateKey(date),
      label: DAY_LABELS[date.getDay()],
      pomodoros: 0,
      minutes: 0,
    });
  }
  const dayIndex = new Map(last7Days.map((bucket, index) => [bucket.date, index]));

  const hourly: HourlyBucket[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    pomodoros: 0,
    minutes: 0,
  }));

  let todayPomodoros = 0;
  let todayMinutes = 0;
  let totalMinutes = 0;

  records.forEach((record) => {
    const date = new Date(record.timestamp);
    const key = toDateKey(date);
    const duration = Number(record.duration) || 0;
    totalMinutes += duration;

    if (key === todayKey) {
      todayPomodoros += 1;
      todayMinutes += duration;
    }

    const idx = dayIndex.get(key);
    if (idx !== undefined) {
      last7Days[idx].pomodoros += 1;
      last7Days[idx].minutes += duration;
    }

    const bucket = hourly[date.getHours()];
    bucket.pomodoros += 1;
    bucket.minutes += duration;
  });

  const weekPomodoros = last7Days.reduce((sum, d) => sum + d.pomodoros, 0);
  const weekMinutes = last7Days.reduce((sum, d) => sum + d.minutes, 0);
  const { best, current } = calculateStreaks(records);

  const busiest = hourly.reduce<HourlyBucket | null>(
    (acc, bucket) => (bucket.pomodoros > (acc?.pomodoros ?? 0) ? bucket : acc),
    null
  );

  return {
    todayPomodoros,
    todayMinutes,
    weekPomodoros,
    weekMinutes,
    weeklyDailyAverage: Math.round((weekPomodoros / 7) * 10) / 10,
    bestStreak: best,
    currentStreak: current,
    totalPomodoros: records.length,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    last7Days,
    hourly,
    mostProductiveHour: busiest && busiest.pomodoros > 0 ? busiest.hour : null,
  };
}

export interface UseStats {
  records: PomodoroRecord[];
  stats: StatsSummary;
  hydrated: boolean;
  addRecord: (durationMinutes: number) => void;
  resetRecords: () => void;
}

export function useStats(): UseStats {
  const [records, setRecords] = useState<PomodoroRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const recordsRef = useRef<PomodoroRecord[]>([]);

  useEffect(() => {
    const loaded = loadRecords();
    recordsRef.current = loaded;
    setRecords(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveRecords(records);
  }, [records, hydrated]);

  const addRecord = useCallback((durationMinutes: number) => {
    const record: PomodoroRecord = {
      timestamp: new Date().toISOString(),
      duration: Math.max(0, Math.round(durationMinutes)),
    };
    const next = [...recordsRef.current, record];
    recordsRef.current = next;
    setRecords(next);
  }, []);

  const resetRecords = useCallback(() => {
    recordsRef.current = [];
    setRecords([]);
  }, []);

  const stats = useMemo(() => summarize(records), [records]);

  return { records, stats, hydrated, addRecord, resetRecords };
}
