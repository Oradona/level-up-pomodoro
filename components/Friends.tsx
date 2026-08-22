'use client';

import { useMemo, useState } from 'react';
import { UseFriends } from '@/hooks/useFriends';
import { Friend } from '@/lib/types';

interface FriendsProps extends UseFriends {
  myStats: {
    level: number;
    weeklyPomodoros: number;
    totalXP: number;
    bestStreak: number;
  };
}

function CompareBar({
  label,
  mine,
  theirs,
}: {
  label: string;
  mine: number;
  theirs: number;
}) {
  const max = Math.max(1, mine, theirs);
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>
          나 {mine} · 친구 {theirs}
        </span>
      </div>
      <div className="mt-1 space-y-1">
        <div className="h-2 w-full rounded-full bg-slate-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-500"
            style={{ width: `${(mine / max) * 100}%` }}
          />
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
            style={{ width: `${(theirs / max) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function FriendRow({
  friend,
  selected,
  onSelect,
  onRemove,
}: {
  friend: Friend;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <li
      className={`rounded-2xl border p-4 transition ${
        selected
          ? 'border-amber-500/50 bg-amber-500/10'
          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onSelect} className="flex flex-1 items-center gap-3 text-left">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-bold text-white">
            {friend.level}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-slate-100">{friend.username}</span>
            <span className="block truncate text-xs text-slate-500">{friend.email}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-400 transition hover:border-rose-600 hover:text-rose-300"
        >
          삭제
        </button>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-800/60 py-2">
          <dt className="text-[11px] text-slate-500">주간</dt>
          <dd className="text-sm font-semibold text-slate-200">{friend.weeklyPomodoros}개</dd>
        </div>
        <div className="rounded-xl bg-slate-800/60 py-2">
          <dt className="text-[11px] text-slate-500">총 XP</dt>
          <dd className="text-sm font-semibold text-slate-200">{friend.totalXP}</dd>
        </div>
        <div className="rounded-xl bg-slate-800/60 py-2">
          <dt className="text-[11px] text-slate-500">최고 연속</dt>
          <dd className="text-sm font-semibold text-slate-200">{friend.bestStreak}일</dd>
        </div>
      </dl>
    </li>
  );
}

export default function Friends({
  accepted,
  pending,
  received,
  addFriend,
  acceptRequest,
  rejectRequest,
  removeFriend,
  myStats,
}: FriendsProps) {
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => accepted.find((f) => f.id === selectedId) ?? null,
    [accepted, selectedId]
  );

  const ranking = useMemo(() => {
    const rows = [
      { id: 'me', username: '나', totalXP: myStats.totalXP, level: myStats.level, isMe: true },
      ...accepted.map((f) => ({
        id: f.id,
        username: f.username,
        totalXP: f.totalXP,
        level: f.level,
        isMe: false,
      })),
    ];
    return rows.sort((a, b) => b.totalXP - a.totalXP);
  }, [accepted, myStats.level, myStats.totalXP]);

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-100">친구 추가</h2>
        <p className="mt-1 text-xs text-slate-400">이메일 또는 사용자명으로 요청을 보냅니다.</p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            const result = addFriend(query);
            setFeedback(result);
            if (result.ok) setQuery('');
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="friend@example.com"
            aria-label="친구 이메일 또는 사용자명"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-amber-500"
          />
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:brightness-110"
          >
            요청 보내기
          </button>
        </form>
        {feedback ? (
          <p
            className={`mt-3 text-xs ${feedback.ok ? 'text-emerald-300' : 'text-rose-300'}`}
            role="status"
          >
            {feedback.message}
          </p>
        ) : null}
      </div>

      {received.length > 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-100">받은 요청 ({received.length})</h2>
          <ul className="mt-4 space-y-2">
            {received.map((friend) => (
              <li
                key={friend.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
              >
                <div>
                  <p className="font-semibold text-slate-100">
                    {friend.username} <span className="text-xs text-slate-500">Lv.{friend.level}</span>
                  </p>
                  <p className="text-xs text-slate-500">{friend.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => acceptRequest(friend.id)}
                    className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30"
                  >
                    수락
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectRequest(friend.id)}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                  >
                    거절
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pending.length > 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-100">보낸 요청 ({pending.length})</h2>
          <ul className="mt-4 space-y-2">
            {pending.map((friend) => (
              <li
                key={friend.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3"
              >
                <span className="text-sm text-slate-200">{friend.username}</span>
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] text-slate-400">
                    대기중
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFriend(friend.id)}
                    className="text-xs text-slate-500 transition hover:text-rose-300"
                  >
                    취소
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-100">친구 목록 ({accepted.length})</h2>
        <p className="mt-1 text-xs text-slate-400">친구를 선택하면 내 기록과 비교합니다.</p>
        {accepted.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-800/50 px-3 py-3 text-xs text-slate-400">
            아직 친구가 없습니다. 위에서 친구를 추가해보세요.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {accepted.map((friend) => (
              <FriendRow
                key={friend.id}
                friend={friend}
                selected={selectedId === friend.id}
                onSelect={() => setSelectedId(selectedId === friend.id ? null : friend.id)}
                onRemove={() => {
                  removeFriend(friend.id);
                  if (selectedId === friend.id) setSelectedId(null);
                }}
              />
            ))}
          </ul>
        )}
      </div>

      {selected ? (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-amber-200">
            {selected.username} 님과 비교
          </h2>
          <div className="mt-4 space-y-4">
            <CompareBar label="레벨" mine={myStats.level} theirs={selected.level} />
            <CompareBar
              label="이번 주 뽀모도로"
              mine={myStats.weeklyPomodoros}
              theirs={selected.weeklyPomodoros}
            />
            <CompareBar label="총 XP" mine={myStats.totalXP} theirs={selected.totalXP} />
            <CompareBar label="최고 연속일" mine={myStats.bestStreak} theirs={selected.bestStreak} />
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-100">XP 랭킹</h2>
        <ol className="mt-4 space-y-2">
          {ranking.map((row, index) => (
            <li
              key={row.id}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                row.isMe ? 'bg-amber-500/15 text-amber-100' : 'bg-slate-800/50 text-slate-200'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-center text-sm font-bold text-slate-400">{index + 1}</span>
                <span className="font-medium">{row.username}</span>
                <span className="text-xs text-slate-500">Lv.{row.level}</span>
              </span>
              <span className="text-sm font-semibold">{row.totalXP.toLocaleString()} XP</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
