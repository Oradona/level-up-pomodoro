<template>
  <section class="stack-lg">
    <div class="panel section-header wide">
      <div>
        <p class="eyebrow">Analytics</p>
        <h2>Statistics Dashboard</h2>
        <p class="muted">Track consistency, focus volume, and when your best work tends to happen.</p>
      </div>
      <button class="button ghost" @click="statsStore.refreshStats">Refresh</button>
    </div>

    <StatsDashboard :stats="statsStore.stats" />
  </section>
</template>

<script setup>
import { onMounted } from 'vue';
import StatsDashboard from '../components/StatsDashboard.vue';
import { useStatsStore } from '../stores/stats';

const statsStore = useStatsStore();

onMounted(() => {
  statsStore.refreshStats();
});
</script>
