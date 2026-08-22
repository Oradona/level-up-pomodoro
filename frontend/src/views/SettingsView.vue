<template>
  <section class="grid two-col">
    <div class="panel stack-lg">
      <div>
        <p class="eyebrow">Tune the rhythm</p>
        <h2>Session Settings</h2>
        <p class="muted">Choose a cadence that fits your work while keeping the Pomodoro structure intact.</p>
      </div>

      <label class="field-group">
        <span>Focus duration: {{ settingsStore.focusMinutes }} min</span>
        <input type="range" min="15" max="60" :value="settingsStore.focusMinutes" @input="updateFocus($event.target.value)" />
      </label>

      <label class="field-group">
        <span>Break duration: {{ settingsStore.breakMinutes }} min</span>
        <input type="range" min="1" max="15" :value="settingsStore.breakMinutes" @input="updateBreak($event.target.value)" />
      </label>

      <div class="card-subtle">
        <p><strong>Long break:</strong> {{ settingsStore.longBreakMinutes }} minutes after every {{ settingsStore.cyclesUntilLongBreak }} completed pomodoros.</p>
      </div>
    </div>

    <div class="panel stack-lg">
      <div>
        <p class="eyebrow">Ambient audio</p>
        <h2>White Noise Preferences</h2>
        <p class="muted">Noise only plays during active focus sessions and pauses automatically during breaks.</p>
      </div>

      <label class="toggle-row">
        <span>Enable white noise</span>
        <input type="checkbox" :checked="settingsStore.whiteNoiseEnabled" @change="settingsStore.setWhiteNoiseEnabled($event.target.checked)" />
      </label>

      <label class="field-group">
        <span>Sound type</span>
        <select :value="settingsStore.whiteNoiseType" @change="settingsStore.setWhiteNoiseType($event.target.value)">
          <option value="rain">Rain</option>
          <option value="waves">Waves</option>
          <option value="cafe">Cafe</option>
          <option value="forest">Forest</option>
        </select>
      </label>
    </div>
  </section>
</template>

<script setup>
import { useSettingsStore } from '../stores/settings';
import { useTimerStore } from '../stores/timer';

const settingsStore = useSettingsStore();
const timerStore = useTimerStore();

const updateFocus = (value) => {
  settingsStore.setFocusMinutes(value);
  timerStore.applySettings();
};

const updateBreak = (value) => {
  settingsStore.setBreakMinutes(value);
  timerStore.applySettings();
};
</script>
