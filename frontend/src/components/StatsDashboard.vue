<template>
  <section class="stack-lg">
    <div class="stat-grid">
      <article class="stat-card">
        <span>Today</span>
        <strong>{{ stats.today.completedPomodoros }}</strong>
        <small>pomodoros completed</small>
      </article>
      <article class="stat-card">
        <span>Weekly average</span>
        <strong>{{ stats.week.avgDaily }}</strong>
        <small>pomodoros per day</small>
      </article>
      <article class="stat-card">
        <span>Best streak</span>
        <strong>{{ stats.bestStreak }}</strong>
        <small>consecutive days</small>
      </article>
      <article class="stat-card">
        <span>Total focus</span>
        <strong>{{ stats.totalFocusTime }}</strong>
        <small>minutes accumulated</small>
      </article>
    </div>

    <div class="grid two-col charts-grid">
      <div class="panel chart-panel">
        <div class="section-header">
          <h3>Last 7 Days</h3>
          <span class="badge">{{ stats.week.totalPomodoros }} this week</span>
        </div>
        <Line :data="weeklyChartData" :options="chartOptions" />
      </div>

      <div class="panel chart-panel">
        <div class="section-header">
          <h3>Today vs Goal</h3>
          <span class="badge">Goal 8</span>
        </div>
        <Doughnut :data="goalChartData" :options="chartOptions" />
      </div>
    </div>

    <div class="panel chart-panel">
      <div class="section-header">
        <h3>Hourly Productivity</h3>
        <span class="badge">By focus minutes</span>
      </div>
      <Bar :data="hourlyChartData" :options="barOptions" />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { Bar, Doughnut, Line } from 'vue-chartjs';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
  stats: {
    type: Object,
    required: true
  }
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#d4d8ff'
      }
    }
  },
  scales: {
    x: {
      ticks: { color: '#b6bdf5' },
      grid: { color: 'rgba(143, 148, 196, 0.14)' }
    },
    y: {
      ticks: { color: '#b6bdf5' },
      grid: { color: 'rgba(143, 148, 196, 0.14)' }
    }
  }
};

const barOptions = {
  ...chartOptions,
  scales: {
    x: {
      ticks: {
        color: '#b6bdf5',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12
      },
      grid: { color: 'rgba(143, 148, 196, 0.14)' }
    },
    y: {
      ticks: { color: '#b6bdf5' },
      grid: { color: 'rgba(143, 148, 196, 0.14)' }
    }
  }
};

const weeklyChartData = computed(() => ({
  labels: props.stats.week.dailyBreakdown.map((entry) => entry.label),
  datasets: [
    {
      label: 'Pomodoros',
      data: props.stats.week.dailyBreakdown.map((entry) => entry.pomodoros),
      borderColor: '#8cf58f',
      backgroundColor: 'rgba(140, 245, 143, 0.18)',
      tension: 0.35,
      fill: true
    },
    {
      label: 'Focus minutes',
      data: props.stats.week.dailyBreakdown.map((entry) => entry.minutes),
      borderColor: '#8c6cff',
      backgroundColor: 'rgba(140, 108, 255, 0.12)',
      tension: 0.35,
      fill: true
    }
  ]
}));

const goalChartData = computed(() => ({
  labels: ['Completed', 'Remaining'],
  datasets: [
    {
      data: [props.stats.today.completedPomodoros, Math.max(0, 8 - props.stats.today.completedPomodoros)],
      backgroundColor: ['#8cf58f', '#2f345f'],
      borderWidth: 0
    }
  ]
}));

const hourlyChartData = computed(() => ({
  labels: props.stats.hourlyProductivity.map((entry) => entry.label),
  datasets: [
    {
      label: 'Focus minutes',
      data: props.stats.hourlyProductivity.map((entry) => entry.minutes),
      backgroundColor: '#8c6cff',
      borderRadius: 10
    }
  ]
}));
</script>
