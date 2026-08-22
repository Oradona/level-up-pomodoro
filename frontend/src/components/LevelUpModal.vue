<template>
  <transition name="fade-pop">
    <div v-if="visible" class="modal-backdrop" @click.self="$emit('close')">
      <div class="levelup-modal panel glow-card stack-md">
        <p class="eyebrow">Milestone reached</p>
        <h2>Level {{ level }}</h2>
        <p class="levelup-burst">+1 LEVEL</p>
        <p class="muted">{{ message }}</p>
        <button class="button" @click="$emit('close')">Continue</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  level: { type: Number, default: 1 },
  message: { type: String, default: '' }
});

defineEmits(['close']);
</script>
