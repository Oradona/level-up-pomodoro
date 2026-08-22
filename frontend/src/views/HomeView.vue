<template>
  <section class="grid two-col hero-grid">
    <div class="panel stack-lg">
      <div class="hero-copy">
        <p class="eyebrow">Focused progress, tangible growth</p>
        <h2>Turn deep work into visible momentum.</h2>
        <p class="muted">
          Complete focused intervals, earn XP, and build a streak that reflects deliberate effort.
        </p>
      </div>

      <XpBar :level="userStore.profile.level" :xp="userStore.profile.xp" :xp-percent="userStore.xpPercent" />
      <PomodoroTimer />
      <WhiteNoise />
    </div>

    <div class="stack-lg">
      <div class="panel stack-md">
        <div class="section-header">
          <div>
            <p class="eyebrow">Today</p>
            <h3>Session snapshot</h3>
          </div>
          <span class="badge">{{ timerStore.modeLabel }}</span>
        </div>
        <div class="stat-grid compact">
          <article class="stat-card compact-card">
            <span>Pomodoros</span>
            <strong>{{ statsStore.stats.today.completedPomodoros }}</strong>
          </article>
          <article class="stat-card compact-card">
            <span>Focus Minutes</span>
            <strong>{{ statsStore.stats.today.totalFocusTime }}</strong>
          </article>
          <article class="stat-card compact-card">
            <span>Best Streak</span>
            <strong>{{ statsStore.stats.bestStreak }} days</strong>
          </article>
          <article class="stat-card compact-card">
            <span>Total Focus</span>
            <strong>{{ statsStore.stats.totalFocusTime }} min</strong>
          </article>
        </div>
      </div>

      <div class="panel stack-md">
        <div class="section-header">
          <div>
            <p class="eyebrow">Mode</p>
            <h3>{{ userStore.isAuthenticated ? 'Synced account' : 'Guest mode enabled' }}</h3>
          </div>
        </div>
        <p class="muted">
          {{ userStore.isAuthenticated
            ? 'Your completed sessions, XP, and friends sync with the backend database.'
            : 'Your timer settings and progress are saved locally. Sign in whenever you want cross-device persistence.' }}
        </p>
        <router-link class="button" to="/login">{{ userStore.isAuthenticated ? 'Manage account' : 'Sign in or register' }}</router-link>
      </div>
    </div>
  </section>

  <LevelUpModal
    :visible="userStore.levelUpModal.visible"
    :level="userStore.levelUpModal.level"
    :message="userStore.levelUpModal.message"
    @close="userStore.hideLevelUp"
  />
</template>

<script setup>
import { onMounted, watch } from 'vue';
import PomodoroTimer from '../components/PomodoroTimer.vue';
import XpBar from '../components/XpBar.vue';
import WhiteNoise from '../components/WhiteNoise.vue';
import LevelUpModal from '../components/LevelUpModal.vue';
import { useTimerStore } from '../stores/timer';
import { useStatsStore } from '../stores/stats';
import { useUserStore } from '../stores/user';

const timerStore = useTimerStore();
const statsStore = useStatsStore();
const userStore = useUserStore();

watch(
  () => timerStore.lastCompletedSession?.id,
  async (value) => {
    if (!value || timerStore.lastCompletedSession?.mode !== 'focus') return;
    await statsStore.recordCompletedSession(timerStore.lastCompletedSession);
    timerStore.clearCompletedSession();
  }
);

onMounted(() => {
  statsStore.refreshStats();
});
</script>
