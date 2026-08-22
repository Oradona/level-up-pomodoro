<template>
  <div class="timer-shell stack-lg">
    <div class="timer-header">
      <div>
        <p class="eyebrow">{{ timerStore.modeLabel }}</p>
        <h3>{{ timerStore.formattedTime }}</h3>
      </div>
      <div class="session-counter">
        <span>Completed</span>
        <strong>{{ timerStore.pomodoroCount }}</strong>
      </div>
    </div>

    <div class="timer-ring">
      <div class="timer-core">
        <span>{{ timerStore.formattedTime }}</span>
      </div>
    </div>

    <div class="button-row center">
      <button class="button" @click="timerStore.isRunning ? timerStore.pause() : timerStore.start()">
        {{ timerStore.isRunning ? 'Pause' : 'Start' }}
      </button>
      <button class="button ghost" @click="timerStore.reset">Reset</button>
    </div>
  </div>
</template>

<script setup>
import { useTimerStore } from '../stores/timer';

const timerStore = useTimerStore();
</script>
