'use client';

import { useCallback, useEffect, useState } from 'react';
import Friends from '@/components/Friends';
import LevelUpModal from '@/components/LevelUpModal';
import SettingsPanel from '@/components/Settings';
import Stats from '@/components/Stats';
import Timer from '@/components/Timer';
import WhiteNoise from '@/components/WhiteNoise';
import XPBar from '@/components/XPBar';
import { useFriends } from '@/hooks/useFriends';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useStats } from '@/hooks/useStats';
import { useXP } from '@/hooks/useXP';
import { requestLevelUpMessage } from '@/lib/aiMessages';
import { playChime } from '@/lib/audioEngine';
import { loadNoise, resetAll, saveNoise } from '@/lib/storage';
import { DEFAULT_NOISE, NoiseSettings, XP_PER_POMODORO } from '@/lib/types';

type Tab = 'timer' | 'stats' | 'settings' | 'friends';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'timer', label: '타이머', icon: '⏱️' },
  { id: 'stats', label: '통계', icon: '📊' },
  { id: 'settings', label: '설정', icon: '⚙️' },
  { id: 'friends', label: '친구', icon: '👥' },
];

interface LevelUpState {
  open: boolean;
  level: number;
  message: string;
  loading: boolean;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>('timer');
  const [mounted, setMounted] = useState(false);
  const [noise, setNoise] = useState<NoiseSettings>(DEFAULT_NOISE);
  const [levelUp, setLevelUp] = useState<LevelUpState>({
    open: false,
    level: 1,
    message: '',
    loading: false,
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const xp = useXP();
  const stats = useStats();
  const friends = useFriends();

  useEffect(() => {
    setNoise(loadNoise());
    setMounted(true);
  }, []);

  const updateNoise = useCallback((patch: Partial<NoiseSettings>) => {
    setNoise((prev) => {
      const next = { ...prev, ...patch };
      saveNoise(next);
      return next;
    });
  }, []);

  const addRecord = stats.addRecord;
  const addXP = xp.addXP;

  const handleFocusComplete = useCallback(
    (durationMinutes: number) => {
      playChime();
      addRecord(durationMinutes);
      const newLevel = addXP(XP_PER_POMODORO);
      if (newLevel !== null) {
        setLevelUp({ open: true, level: newLevel, message: '', loading: true });
        void requestLevelUpMessage(newLevel).then((message) => {
          setLevelUp((prev) => (prev.level === newLevel ? { ...prev, message, loading: false } : prev));
        });
      }
    },
    [addRecord, addXP]
  );

  const handleBreakComplete = useCallback(() => {
    playChime();
  }, []);

  const pomodoro = usePomodoro({
    onFocusComplete: handleFocusComplete,
    onBreakComplete: handleBreakComplete,
  });

  const handleResetData = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const confirmReset = useCallback(() => {
    setShowResetConfirm(false);
    resetAll();
    window.location.reload();
  }, []);

  const sessionLabel =
    pomodoro.sessionType === 'focus'
      ? '집중 중'
      : pomodoro.sessionType === 'shortBreak'
        ? '짧은 휴식 중'
        : '긴 휴식 중';

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-50 sm:text-3xl">
            Level Up <span className="text-rose-400">Pomodoro</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">집중할수록 레벨이 오릅니다.</p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-1.5 text-xs text-slate-300">
          {sessionLabel} · 오늘 {stats.stats.todayPomodoros}개
        </span>
      </header>

      <nav className="mb-6 grid grid-cols-4 gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-1.5">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id ? 'page' : undefined}
            className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
              tab === item.id
                ? 'bg-slate-100 text-slate-900 shadow'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span className="mr-1">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="space-y-4">
        <XPBar
          level={xp.level}
          totalXP={xp.totalXP}
          xpIntoLevel={xp.xpIntoLevel}
          xpForNextLevel={xp.xpForNextLevel}
          progressPercent={xp.progressPercent}
        />

        {tab === 'timer' ? (
          <>
            <Timer
              sessionType={pomodoro.sessionType}
              timeLeft={pomodoro.timeLeft}
              totalTime={pomodoro.totalTime}
              isRunning={pomodoro.isRunning}
              pomodoroCount={pomodoro.pomodoroCount}
              cycleProgress={pomodoro.cycleProgress}
              pomodorosUntilLongBreak={pomodoro.settings.pomodorosUntilLongBreak}
              onToggle={pomodoro.toggle}
              onReset={pomodoro.reset}
              onSkip={pomodoro.skip}
              onSelectSession={pomodoro.setSession}
            />
            {mounted ? (
              <WhiteNoise noise={noise} onChange={updateNoise} sessionType={pomodoro.sessionType} />
            ) : null}
          </>
        ) : null}

        {tab === 'stats' ? <Stats stats={stats.stats} level={xp.level} totalXP={xp.totalXP} /> : null}

        {tab === 'settings' ? (
          <SettingsPanel
            settings={pomodoro.settings}
            onChange={pomodoro.updateSettings}
            onResetData={handleResetData}
          />
        ) : null}

        {tab === 'friends' ? (
          <Friends
            {...friends}
            myStats={{
              level: xp.level,
              weeklyPomodoros: stats.stats.weekPomodoros,
              totalXP: xp.totalXP,
              bestStreak: stats.stats.bestStreak,
            }}
          />
        ) : null}
      </div>

      <footer className="mt-10 text-center text-xs text-slate-600">
        뽀모도로 1개 = {XP_PER_POMODORO} XP · 100 XP마다 레벨 업
      </footer>

      <LevelUpModal
        open={levelUp.open}
        level={levelUp.level}
        message={levelUp.message}
        loading={levelUp.loading}
        onClose={() => setLevelUp((prev) => ({ ...prev, open: false }))}
      />

      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="reset-title"
          aria-describedby="reset-desc"
        >
          <div className="w-full max-w-sm rounded-2xl bg-gray-800 p-6 shadow-2xl">
            <h2 id="reset-title" className="mb-2 text-lg font-bold text-white">
              데이터 초기화
            </h2>
            <p id="reset-desc" className="mb-6 text-gray-300">
              모든 데이터를 삭제할까요? 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="rounded-lg px-4 py-2 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmReset}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500 transition-colors"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
