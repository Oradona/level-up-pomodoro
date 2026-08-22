'use client';

interface XPBarProps {
  level: number;
  totalXP: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
}

export default function XPBar({
  level,
  totalXP,
  xpIntoLevel,
  xpForNextLevel,
  progressPercent,
}: XPBarProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-lg font-black text-slate-900 shadow-lg">
            {level}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">현재 레벨</p>
            <p className="text-lg font-bold text-slate-100">Lv. {level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-slate-400">총 XP</p>
          <p className="text-lg font-bold text-amber-300">{totalXP.toLocaleString()} XP</p>
        </div>
      </div>

      <div className="mt-4">
        <div
          className="h-4 w-full overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="레벨 진행도"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-[width] duration-700"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>
            {xpIntoLevel} / {xpForNextLevel} XP
          </span>
          <span>{progressPercent}% · 다음 레벨까지 {xpForNextLevel - xpIntoLevel} XP</span>
        </div>
      </div>
    </section>
  );
}
