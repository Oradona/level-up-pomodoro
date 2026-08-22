import { NoiseType } from './types';

type AudioContextConstructor = typeof AudioContext;

function getAudioContextCtor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function createWhiteNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createBrownNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

/**
 * Procedural white-noise engine. All sounds are synthesised at runtime with the
 * Web Audio API, so no audio assets are required.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private nodes: AudioScheduledSourceNode[] = [];
  private volume = 0.4;
  private currentType: NoiseType | null = null;

  get isPlaying(): boolean {
    return this.currentType !== null;
  }

  get playingType(): NoiseType | null {
    return this.currentType;
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    this.ctx = new Ctor();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);
    return this.ctx;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.ctx && this.masterGain && this.currentType) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.6, this.ctx.currentTime, 0.1);
    }
  }

  async play(type: NoiseType, volume?: number): Promise<void> {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (typeof volume === 'number') this.volume = Math.min(1, Math.max(0, volume));

    if (this.currentType === type) {
      if (ctx.state === 'suspended') await ctx.resume();
      this.masterGain.gain.setTargetAtTime(this.volume * 0.6, ctx.currentTime, 0.1);
      return;
    }

    this.stopSources();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        /* resume may fail before a user gesture */
      }
    }

    switch (type) {
      case 'rain':
        this.buildRain(ctx, this.masterGain);
        break;
      case 'ocean':
        this.buildOcean(ctx, this.masterGain);
        break;
      case 'cafe':
        this.buildCafe(ctx, this.masterGain);
        break;
      case 'forest':
        this.buildForest(ctx, this.masterGain);
        break;
      default:
        return;
    }

    this.currentType = type;
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.masterGain.gain.setTargetAtTime(this.volume * 0.6, ctx.currentTime, 0.4);
  }

  stop(): void {
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
    }
    window.setTimeout(() => this.stopSources(), 400);
    this.currentType = null;
  }

  dispose(): void {
    this.stopSources();
    this.currentType = null;
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
      this.masterGain = null;
    }
  }

  private stopSources(): void {
    this.nodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
      try {
        node.disconnect();
      } catch {
        /* already disconnected */
      }
    });
    this.nodes = [];
  }

  private startSource(source: AudioScheduledSourceNode): void {
    source.start();
    this.nodes.push(source);
  }

  /** Rain: bright hissing high-frequency noise layered over a low rumble. */
  private buildRain(ctx: AudioContext, out: GainNode): void {
    const noise = ctx.createBufferSource();
    noise.buffer = createWhiteNoiseBuffer(ctx);
    noise.loop = true;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 1200;

    const shelf = ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 6000;
    shelf.gain.value = -6;

    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.5;

    noise.connect(highpass).connect(shelf).connect(hissGain).connect(out);

    const rumble = ctx.createBufferSource();
    rumble.buffer = createBrownNoiseBuffer(ctx);
    rumble.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 220;

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.45;

    rumble.connect(lowpass).connect(rumbleGain).connect(out);

    this.startSource(noise);
    this.startSource(rumble);
  }

  /** Ocean: low-passed noise whose amplitude swells with a slow LFO. */
  private buildOcean(ctx: AudioContext, out: GainNode): void {
    const noise = ctx.createBufferSource();
    noise.buffer = createWhiteNoiseBuffer(ctx);
    noise.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 700;
    lowpass.Q.value = 0.7;

    const waveGain = ctx.createGain();
    waveGain.gain.value = 0.35;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.11;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;
    lfo.connect(lfoGain).connect(waveGain.gain);

    const filterLfo = ctx.createOscillator();
    filterLfo.type = 'sine';
    filterLfo.frequency.value = 0.08;
    const filterLfoGain = ctx.createGain();
    filterLfoGain.gain.value = 350;
    filterLfo.connect(filterLfoGain).connect(lowpass.frequency);

    noise.connect(lowpass).connect(waveGain).connect(out);

    this.startSource(noise);
    this.startSource(lfo);
    this.startSource(filterLfo);
  }

  /** Cafe: warm mid-frequency brownian murmur. */
  private buildCafe(ctx: AudioContext, out: GainNode): void {
    const noise = ctx.createBufferSource();
    noise.buffer = createBrownNoiseBuffer(ctx);
    noise.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 620;
    bandpass.Q.value = 0.6;

    const chatterGain = ctx.createGain();
    chatterGain.gain.value = 0.9;

    const chatterLfo = ctx.createOscillator();
    chatterLfo.type = 'triangle';
    chatterLfo.frequency.value = 0.7;
    const chatterLfoGain = ctx.createGain();
    chatterLfoGain.gain.value = 0.25;
    chatterLfo.connect(chatterLfoGain).connect(chatterGain.gain);

    noise.connect(bandpass).connect(chatterGain).connect(out);

    // Subtle clatter layer for cups/cutlery texture.
    const clatter = ctx.createBufferSource();
    clatter.buffer = createWhiteNoiseBuffer(ctx);
    clatter.loop = true;
    const clatterFilter = ctx.createBiquadFilter();
    clatterFilter.type = 'bandpass';
    clatterFilter.frequency.value = 3200;
    clatterFilter.Q.value = 4;
    const clatterGain = ctx.createGain();
    clatterGain.gain.value = 0.06;
    clatter.connect(clatterFilter).connect(clatterGain).connect(out);

    this.startSource(noise);
    this.startSource(chatterLfo);
    this.startSource(clatter);
  }

  /** Forest: green noise (band-limited around 500Hz) plus airy leaf rustle. */
  private buildForest(ctx: AudioContext, out: GainNode): void {
    const noise = ctx.createBufferSource();
    noise.buffer = createWhiteNoiseBuffer(ctx);
    noise.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 500;
    bandpass.Q.value = 0.5;

    const greenGain = ctx.createGain();
    greenGain.gain.value = 0.8;

    noise.connect(bandpass).connect(greenGain).connect(out);

    const rustle = ctx.createBufferSource();
    rustle.buffer = createWhiteNoiseBuffer(ctx);
    rustle.loop = true;
    const rustleFilter = ctx.createBiquadFilter();
    rustleFilter.type = 'highpass';
    rustleFilter.frequency.value = 2600;
    const rustleGain = ctx.createGain();
    rustleGain.gain.value = 0.12;

    const breezeLfo = ctx.createOscillator();
    breezeLfo.type = 'sine';
    breezeLfo.frequency.value = 0.2;
    const breezeGain = ctx.createGain();
    breezeGain.gain.value = 0.08;
    breezeLfo.connect(breezeGain).connect(rustleGain.gain);

    rustle.connect(rustleFilter).connect(rustleGain).connect(out);

    this.startSource(noise);
    this.startSource(rustle);
    this.startSource(breezeLfo);
  }
}

let engine: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}

/** Short chime played when a session ends. */
export function playChime(): void {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return;
  try {
    const ctx = new Ctor();
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + index * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.65);
    });
    window.setTimeout(() => void ctx.close().catch(() => undefined), 1500);
  } catch {
    /* audio not available */
  }
}
