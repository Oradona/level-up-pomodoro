'use client';

import { useEffect, useRef } from 'react';
import { getAudioEngine } from '@/lib/audioEngine';
import { NoiseSettings, NoiseType, SessionType } from '@/lib/types';

const NOISE_OPTIONS: { type: NoiseType; label: string; emoji: string; hint: string }[] = [
  { type: 'rain', label: '빗소리', emoji: '🌧️', hint: '고음역 화이트노이즈 + 저역 울림' },
  { type: 'ocean', label: '파도소리', emoji: '🌊', hint: '천천히 밀려오는 필터 웨이브' },
  { type: 'cafe', label: '카페', emoji: '☕', hint: '중음역 브라운 노이즈' },
  { type: 'forest', label: '숲속', emoji: '🌲', hint: '그린 노이즈 + 나뭇잎 소리' },
];

interface WhiteNoiseProps {
  noise: NoiseSettings;
  onChange: (patch: Partial<NoiseSettings>) => void;
  sessionType: SessionType;
}

export default function WhiteNoise({ noise, onChange, sessionType }: WhiteNoiseProps) {
  const engineRef = useRef(typeof window === 'undefined' ? null : getAudioEngine());
  const shouldPlay = noise.enabled && sessionType === 'focus';

  useEffect(() => {
    const engine = engineRef.current ?? getAudioEngine();
    engineRef.current = engine;
    if (shouldPlay) {
      void engine.play(noise.type, noise.volume);
    } else if (engine.isPlaying) {
      engine.stop();
    }
  }, [shouldPlay, noise.type, noise.volume]);

  useEffect(() => {
    const engine = engineRef.current;
    return () => {
      engine?.stop();
    };
  }, []);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">백색소음</h2>
          <p className="mt-1 text-xs text-slate-400">
            집중 세션에서만 재생되고 휴식에는 자동으로 멈춥니다.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={noise.enabled}
          aria-label="백색소음 켜기/끄기"
          onClick={() => onChange({ enabled: !noise.enabled })}
          className={`relative h-8 w-14 shrink-0 rounded-full transition ${
            noise.enabled ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
              noise.enabled ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {NOISE_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            title={option.hint}
            onClick={() => onChange({ type: option.type, enabled: true })}
            className={`rounded-xl border px-3 py-3 text-sm transition ${
              noise.type === option.type
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="block text-xl">{option.emoji}</span>
            <span className="mt-1 block font-medium">{option.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <label htmlFor="noise-volume" className="flex justify-between text-xs text-slate-400">
          <span>볼륨</span>
          <span>{Math.round(noise.volume * 100)}%</span>
        </label>
        <input
          id="noise-volume"
          type="range"
          min={0}
          max={100}
          value={Math.round(noise.volume * 100)}
          onChange={(event) => onChange({ volume: Number(event.target.value) / 100 })}
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-emerald-400"
        />
      </div>

      <p className="mt-4 rounded-xl bg-slate-800/50 px-3 py-2 text-xs text-slate-400">
        {shouldPlay
          ? '재생 중 — Web Audio API로 실시간 합성된 소리입니다.'
          : sessionType === 'focus'
            ? '토글을 켜면 재생됩니다.'
            : '휴식 중에는 재생되지 않습니다.'}
      </p>
    </section>
  );
}
