'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { levelFromXP, loadXP, saveXP } from '@/lib/storage';
import { XPState, XP_PER_LEVEL } from '@/lib/types';

export interface UseXP {
  totalXP: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  hydrated: boolean;
  /** Adds XP and returns the new level if a level-up happened, otherwise null. */
  addXP: (amount: number) => number | null;
  resetXP: () => void;
}

export function useXP(): UseXP {
  const [state, setState] = useState<XPState>({ totalXP: 0, level: 1 });
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef<XPState>(state);

  useEffect(() => {
    const loaded = loadXP();
    stateRef.current = loaded;
    setState(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveXP(state);
  }, [state, hydrated]);

  const addXP = useCallback((amount: number): number | null => {
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const prev = stateRef.current;
    const totalXP = prev.totalXP + Math.round(amount);
    const level = levelFromXP(totalXP);
    const next: XPState = { totalXP, level };
    stateRef.current = next;
    setState(next);
    return level > prev.level ? level : null;
  }, []);

  const resetXP = useCallback(() => {
    const next: XPState = { totalXP: 0, level: 1 };
    stateRef.current = next;
    setState(next);
  }, []);

  const xpIntoLevel = state.totalXP % XP_PER_LEVEL;

  return {
    totalXP: state.totalXP,
    level: state.level,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    progressPercent: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
    hydrated,
    addXP,
    resetXP,
  };
}
