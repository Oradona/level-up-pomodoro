'use client';

import { SessionType } from '@/lib/types';

const SESSION_META: Record<
  SessionType,
  { label: string; accent: string; ring: string; badge: string }
> = {
  focus: {
    label: '집중 시간',
    accent: 'text-rose-300',
    ring: 'stroke-rose-400',
    badge: 'bg-rose-500/15 text-rose-200 border-rose-500/30',
  },
  shortBreak: {
    label: '짧은 휴식',
    accent: 'text-emerald-300',
    ring: 'stroke-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
  },
  longBreak: {
    label: '긴 휴식',
    accent: 'text-sky-300',
    ring: 'stroke-sky-400',
    badge: 'bg-sky-500/15 text-sky-200 border-sky-500/30',
  },
};

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`;
}

interface TimerProps {
  sessionType: SessionType;
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  pomodoroCount: number;
  cycleProgress: number;
  pomodorosUntilLongBreak: number;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSelectSession: (type: SessionType) => void;
}

export default function Timer({
  sessionType,
  timeLeft,
  totalTime,
  isRunning,
  pomodoroCount,
  cycleProgress,
  pomodorosUntilLongBreak,
  onToggle,
  onReset,
  onSkip,
  onSelectSession,
}: TimerProps) {
  const meta = SESSION_META[sessionType];
  const progress = totalTime > 0 ? 1 - timeLeft / totalTime : 0;
  const radius = 130;
  const circumference = 2 * Math.PI * radius;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur sm:p-8">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(Object.keys(SESSION_META) as SessionType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelectSession(type)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              sessionType === type
                ? SESSION_META[type].badge
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            {SESSION_META[type].label}
          </button>
        ))}
      </div>

      <div className="relative mx-auto mt-8 flex h-[300px] w-[300px] max-w-full items-center justify-center">
        <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full -rotate-90">
          <circle
            cx="150"
            cy="150"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="14"
            fill="none"
          />
          <circle
            cx="150"
            cy="150"
            r={radius}
            className={`${meta.ring} transition-[stroke-dashoffset] duration-500 ease-linear`}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, progress)))}
          />
        </svg>
        <div className="relative flex flex-col items-center">
          <span className={`text-sm font-semibold uppercase tracking-widest ${meta.accent}`}>
            {meta.label}
          </span>
          <span
            className="mt-2 font-mono text-6xl font-bold tabular-nums text-slate-50 sm:text-7xl"
            aria-live="polite"
          >
            {formatTime(timeLeft)}
          </span>
          <span className="mt-3 text-xs text-slate-400">
            사이클 {cycleProgress}/{pomodorosUntilLongBreak} · 누적 {pomodoroCount}개
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-[130px] rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:brightness-110 active:scale-[0.98]"
        >
          {isRunning ? '일시정지' : '시작'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-slate-700 bg-slate-800/70 px-5 py-3 text-base font-medium text-slate-200 transition hover:bg-slate-700"
        >
          리셋
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-xl border border-slate-700 bg-slate-800/70 px-5 py-3 text-base font-medium text-slate-200 transition hover:bg-slate-700"
        >
          건너뛰기
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {Array.from({ length: pomodorosUntilLongBreak }).map((_, index) => (
          <span
            key={index}
            className={`h-2.5 w-8 rounded-full transition ${
              index < cycleProgress ? 'bg-rose-400' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
