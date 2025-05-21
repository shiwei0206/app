<script setup lang="ts">
import { defineProps } from 'vue';
import type { StatCard } from '../types';

defineProps<{
  stat: StatCard;
}>();
</script>

<template>
  <div 
    class="stat-card p-6 rounded-2xl cursor-pointer transform transition-all hover:scale-105"
    :class="stat.color"
    @click="$emit('click')"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-bold text-white">{{ stat.title }}</h3>
      <span class="text-white/80">{{ stat.icon }}</span>
    </div>
    <div class="mt-4">
      <p class="text-4xl font-bold text-white">{{ stat.value }}</p>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: linear-gradient(135deg, var(--start-color), var(--end-color));
}

.bg-reading {
  --start-color: #FF6B6B;
  --end-color: #FF8E8E;
}

.bg-water {
  --start-color: #4ECDC4;
  --end-color: #45B7AF;
}

.bg-exercise {
  --start-color: #A78BFA;
  --end-color: #8B5CF6;
}
.bg-game{
  --start-color: #ec5757;
  --end-color: #f5d6d6;
}
.bg-sleep{
  --start-color: #3d9b67;
  --end-color: #073519;
}
.bg-housework{
  --start-color: #db1515;
  --end-color: #2b0404;
}
.bg-longtime_sit{
  --start-color: #100cec;
  --end-color: #130c79;
}
</style>