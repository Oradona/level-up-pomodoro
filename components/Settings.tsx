'use client';

import { SETTINGS_LIMITS, TimerSettings } from '@/lib/types';

interface SettingsProps {
  settings: TimerSettings;
  onChange: (patch: Partial<TimerSettings>) => void;
  onResetData: () => void;
}

interface SliderRowProps {
  id: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function SliderRow({ id, label, description, value, min, max, onChange }: SliderRowProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-200">
          {label}
        </label>
        <span className="rounded-lg bg-slate-800 px-3 py-1 font-mono text-sm text-amber-300">
          {value}분
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-rose-400"
      />
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>{min}분</span>
        <span>{max}분</span>
      </div>
    </div>
  );
}

export default function Settings({ settings, onChange, onResetData }: SettingsProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-100">타이머 설정</h2>
        <p className="mt-1 text-xs text-slate-400">
          변경 사항은 자동으로 저장되며 다음 세션부터 적용됩니다.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SliderRow
            id="focus-minutes"
            label="집중 시간"
            description="한 번의 뽀모도로 길이"
            value={settings.focusMinutes}
            min={SETTINGS_LIMITS.focusMinutes.min}
            max={SETTINGS_LIMITS.focusMinutes.max}
            onChange={(focusMinutes) => onChange({ focusMinutes })}
          />
          <SliderRow
            id="short-break-minutes"
            label="짧은 휴식"
            description="집중 세션 사이의 휴식"
            value={settings.shortBreakMinutes}
            min={SETTINGS_LIMITS.shortBreakMinutes.min}
            max={SETTINGS_LIMITS.shortBreakMinutes.max}
            onChange={(shortBreakMinutes) => onChange({ shortBreakMinutes })}
          />
          <SliderRow
            id="long-break-minutes"
            label="긴 휴식"
            description="사이클을 마친 뒤의 긴 휴식"
            value={settings.longBreakMinutes}
            min={SETTINGS_LIMITS.longBreakMinutes.min}
            max={SETTINGS_LIMITS.longBreakMinutes.max}
            onChange={(longBreakMinutes) => onChange({ longBreakMinutes })}
          />
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <label htmlFor="cycle-length" className="text-sm font-medium text-slate-200">
                긴 휴식까지의 뽀모도로
              </label>
              <span className="rounded-lg bg-slate-800 px-3 py-1 font-mono text-sm text-amber-300">
                {settings.pomodorosUntilLongBreak}개
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">기본값은 4개입니다.</p>
            <input
              id="cycle-length"
              type="range"
              min={2}
              max={8}
              value={settings.pomodorosUntilLongBreak}
              onChange={(event) =>
                onChange({ pomodorosUntilLongBreak: Number(event.target.value) })
              }
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-rose-400"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>2개</span>
              <span>8개</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div>
            <p className="text-sm font-medium text-slate-200">다음 세션 자동 시작</p>
            <p className="mt-1 text-xs text-slate-500">
              세션이 끝나면 곧바로 다음 타이머를 시작합니다.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.autoStartNext}
            aria-label="다음 세션 자동 시작"
            onClick={() => onChange({ autoStartNext: !settings.autoStartNext })}
            className={`relative h-8 w-14 shrink-0 rounded-full transition ${
              settings.autoStartNext ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                settings.autoStartNext ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-rose-900/50 bg-rose-950/20 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-rose-200">데이터 초기화</h2>
        <p className="mt-1 text-xs text-rose-200/70">
          레벨, XP, 통계, 친구 목록이 모두 삭제됩니다. 되돌릴 수 없습니다.
        </p>
        <button
          type="button"
          onClick={onResetData}
          className="mt-4 rounded-xl border border-rose-500/50 bg-rose-500/15 px-5 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/25"
        >
          모든 데이터 삭제
        </button>
      </div>
    </section>
  );
}
