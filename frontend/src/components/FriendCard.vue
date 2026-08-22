<template>
  <article class="friend-card">
    <div class="friend-header">
      <div>
        <h4>{{ friend.nickname }}</h4>
        <p>Level {{ friend.level }}</p>
      </div>
      <span class="badge">{{ friend.weeklyPomodoros }} / week</span>
    </div>

    <div class="friend-stats">
      <div>
        <span>Total XP</span>
        <strong>{{ friend.totalXp }}</strong>
      </div>
      <div>
        <span>Best streak</span>
        <strong>{{ friend.bestStreak }} days</strong>
      </div>
      <div>
        <span>Focus time</span>
        <strong>{{ friend.totalFocusTime }} min</strong>
      </div>
    </div>

    <div class="comparison-row">
      <span :class="gapClass(friend.comparison.levelGap)">Level gap: {{ formatGap(friend.comparison.levelGap) }}</span>
      <span :class="gapClass(friend.comparison.xpGap)">XP gap: {{ formatGap(friend.comparison.xpGap) }}</span>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({
  friend: {
    type: Object,
    required: true
  }
});

const formatGap = (value) => (value > 0 ? `+${value}` : `${value}`);
const gapClass = (value) => ({ positive: value > 0, negative: value < 0, neutral: value === 0 });
</script>
