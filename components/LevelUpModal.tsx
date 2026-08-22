'use client';

import { useEffect, useRef } from 'react';

interface LevelUpModalProps {
  open: boolean;
  level: number;
  message: string;
  loading: boolean;
  onClose: () => void;
}

export default function LevelUpModal({
  open,
  level,
  message,
  loading,
  onClose,
}: LevelUpModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-8 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-600 text-3xl font-black text-slate-900 shadow-xl">
          {level}
        </div>
        <h2 id="levelup-title" className="mt-6 text-2xl font-bold text-amber-200">
          LEVEL UP!
        </h2>
        <p className="mt-1 text-sm text-slate-400">레벨 {level} 달성</p>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">AI 응원 메시지</p>
          {loading ? (
            <p className="mt-2 animate-pulse text-sm text-slate-500">메시지를 생성하는 중...</p>
          ) : (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-200">
              {message}
            </p>
          )}
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-semibold text-slate-900 transition hover:brightness-110"
        >
          계속 집중하기
        </button>
      </div>
    </div>
  );
}
