<template>
  <div class="panel-secondary stack-sm">
    <div class="section-header">
      <div>
        <p class="eyebrow">White noise</p>
        <h3>{{ settingsStore.whiteNoiseType }}</h3>
      </div>
      <label class="toggle-pill">
        <input type="checkbox" :checked="settingsStore.whiteNoiseEnabled" @change="settingsStore.setWhiteNoiseEnabled($event.target.checked)" />
        <span>{{ settingsStore.whiteNoiseEnabled ? 'On' : 'Off' }}</span>
      </label>
    </div>

    <div class="noise-options">
      <button
        v-for="option in options"
        :key="option"
        class="chip"
        :class="{ active: settingsStore.whiteNoiseType === option }"
        @click="settingsStore.setWhiteNoiseType(option)"
      >
        {{ option }}
      </button>
    </div>

    <p class="muted small-text">
      Ambient sound activates only during active focus sessions and stops automatically on breaks.
    </p>
  </div>
</template>

<script setup>
import { onBeforeUnmount, watch } from 'vue';
import { useSettingsStore } from '../stores/settings';
import { useTimerStore } from '../stores/timer';

const settingsStore = useSettingsStore();
const timerStore = useTimerStore();
const options = ['rain', 'waves', 'cafe', 'forest'];

let audioContext;
let noiseNode;
let filterNode;
let gainNode;
let lfo;
let lfoGain;

const createPinkNoise = (audioCtx, profile) => {
  const bufferSize = 4096;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);

  node.onaudioprocess = (event) => {
    const output = event.outputBuffer.getChannelData(0);
    for (let index = 0; index < bufferSize; index += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
      output[index] = pink * profile.amplitude;
    }
  };

  return node;
};

const profiles = {
  rain: { filterType: 'lowpass', frequency: 1200, gain: 0.18, amplitude: 0.9 },
  waves: { filterType: 'lowpass', frequency: 700, gain: 0.16, amplitude: 0.8 },
  cafe: { filterType: 'bandpass', frequency: 900, gain: 0.12, amplitude: 0.65 },
  forest: { filterType: 'highpass', frequency: 350, gain: 0.14, amplitude: 0.75 }
};

const stopNoise = () => {
  try {
    lfo?.stop();
  } catch (error) {
    // no-op
  }

  [noiseNode, filterNode, gainNode, lfo, lfoGain].forEach((node) => {
    try {
      node?.disconnect();
    } catch (error) {
      // no-op
    }
  });
  noiseNode = null;
  filterNode = null;
  gainNode = null;
  lfo = null;
  lfoGain = null;
};

const startNoise = async () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (!audioContext) audioContext = new AudioCtx();
  await audioContext.resume();

  stopNoise();
  const profile = profiles[settingsStore.whiteNoiseType] || profiles.rain;
  noiseNode = createPinkNoise(audioContext, profile);
  filterNode = audioContext.createBiquadFilter();
  gainNode = audioContext.createGain();

  filterNode.type = profile.filterType;
  filterNode.frequency.value = profile.frequency;
  gainNode.gain.value = profile.gain;

  noiseNode.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (settingsStore.whiteNoiseType === 'waves' || settingsStore.whiteNoiseType === 'forest') {
    lfo = audioContext.createOscillator();
    lfoGain = audioContext.createGain();
    lfo.frequency.value = settingsStore.whiteNoiseType === 'waves' ? 0.08 : 0.18;
    lfoGain.gain.value = settingsStore.whiteNoiseType === 'waves' ? 0.03 : 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    lfo.start();
  }
};

watch(
  () => [settingsStore.whiteNoiseEnabled, settingsStore.whiteNoiseType, timerStore.isRunning, timerStore.mode],
  async ([enabled, type, running, mode]) => {
    if (enabled && running && mode === 'focus') {
      await startNoise(type);
    } else {
      stopNoise();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  stopNoise();
  audioContext?.close();
});
</script>
