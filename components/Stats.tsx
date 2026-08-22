'use client';

import { StatsSummary } from '@/hooks/useStats';

interface StatsProps {
  stats: StatsSummary;
  level: number;
  totalXP: number;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours <= 0) return `${mins}분`;
  return `${hours}시간 ${mins}분`;
}

export default function Stats({ stats, level, totalXP }: StatsProps) {
  const maxDaily = Math.max(1, ...stats.last7Days.map((d) => d.pomodoros));
  const maxHourly = Math.max(1, ...stats.hourly.map((h) => h.pomodoros));
  const activeHours = stats.hourly.filter((h) => h.pomodoros > 0);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="오늘"
          value={`${stats.todayPomodoros}개`}
          sub={`집중 ${formatMinutes(stats.todayMinutes)}`}
          accent="text-rose-300"
        />
        <StatCard
          label="이번 주"
          value={`${stats.weekPomodoros}개`}
          sub={`하루 평균 ${stats.weeklyDailyAverage}개`}
          accent="text-amber-300"
        />
        <StatCard
          label="최고 연속"
          value={`${stats.bestStreak}일`}
          sub={`현재 연속 ${stats.currentStreak}일`}
          accent="text-emerald-300"
        />
        <StatCard
          label="총 누적"
          value={`${stats.totalHours}시간`}
          sub={`뽀모도로 ${stats.totalPomodoros}개 · Lv.${level} · ${totalXP} XP`}
          accent="text-sky-300"
        />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-100">최근 7일</h2>
          <span className="text-xs text-slate-400">총 {stats.weekPomodoros}개</span>
        </div>
        <div className="mt-6 flex h-44 items-end justify-between gap-2">
          {stats.last7Days.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-medium text-slate-300">{day.pomodoros}</span>
              <div className="flex h-28 w-full items-end rounded-lg bg-slate-800/60">
                <div
                  className="w-full rounded-lg bg-gradient-to-t from-rose-600 to-amber-400 transition-all duration-500"
                  style={{ height: `${(day.pomodoros / maxDaily) * 100}%` }}
                  title={`${day.date}: ${day.pomodoros}개`}
                />
              </div>
              <span className="text-xs text-slate-400">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-100">시간대별 생산성</h2>
          <span className="text-xs text-slate-400">
            {stats.mostProductiveHour === null
              ? '데이터가 아직 없습니다'
              : `가장 생산적인 시간: ${stats.mostProductiveHour}시`}
          </span>
        </div>
        <div className="mt-6 flex h-40 items-end gap-[3px]">
          {stats.hourly.map((bucket) => (
            <div key={bucket.hour} className="group flex h-full flex-1 flex-col justify-end">
              <div
                className={`w-full rounded-t transition-all duration-500 ${
                  bucket.hour === stats.mostProductiveHour
                    ? 'bg-gradient-to-t from-emerald-600 to-emerald-300'
                    : 'bg-gradient-to-t from-sky-700 to-sky-400'
                }`}
                style={{
                  height: `${bucket.pomodoros === 0 ? 2 : (bucket.pomodoros / maxHourly) * 100}%`,
                }}
                title={`${bucket.hour}시: ${bucket.pomodoros}개 (${bucket.minutes}분)`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-slate-500">
          <span>0시</span>
          <span>6시</span>
          <span>12시</span>
          <span>18시</span>
          <span>23시</span>
        </div>
        {activeHours.length > 0 ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {activeHours
              .slice()
              .sort((a, b) => b.pomodoros - a.pomodoros)
              .slice(0, 4)
              .map((bucket) => (
                <li
                  key={bucket.hour}
                  className="flex items-center justify-between rounded-xl bg-slate-800/50 px-3 py-2 text-xs text-slate-300"
                >
                  <span>{`${bucket.hour}시 ~ ${(bucket.hour + 1) % 24}시`}</span>
                  <span className="text-slate-400">
                    {bucket.pomodoros}개 · {formatMinutes(bucket.minutes)}
                  </span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl bg-slate-800/50 px-3 py-3 text-xs text-slate-400">
            첫 뽀모도로를 완료하면 시간대별 분석이 표시됩니다.
          </p>
        )}
      </div>
    </section>
  );
}
