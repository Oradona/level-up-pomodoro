<template>
  <div class="xp-shell panel-secondary stack-sm">
    <div class="section-header">
      <div>
        <p class="eyebrow">Progress</p>
        <h3>Level {{ level }}</h3>
      </div>
      <span class="badge">{{ xp }}/100 XP</span>
    </div>
    <div class="xp-track">
      <div class="xp-fill" :style="{ width: `${xpPercent}%` }"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  level: { type: Number, required: true },
  xp: { type: Number, required: true },
  xpPercent: { type: Number, required: true }
});
</script>
