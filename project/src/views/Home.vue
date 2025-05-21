<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import StatCard from '../components/Cardcolor.vue';
import { getDailyStats } from '../api';
import type { StatCard as StatCardType, DailyStats } from '../types';

const router = useRouter();
const dailyStats = ref<DailyStats | null>(null);

// 新增：喝水提示状态
const showWaterWarning = computed(() => {
  return (dailyStats.value?.waterCount || 0) < 5;
});
const showPlay_with_computerWarning = computed(() => {
  return (dailyStats.value?.play_with_computer || 0) > 60;
});
const showHouseworkWarning = computed(() => {
  return (dailyStats.value?.houseworkMinutes || 0) < 10;
});
const  showLongtime_sitWarning = computed(() => {
  return (dailyStats.value?.longsitMinutes || 0)  > 30 ;
});
const stats = computed(() => [
  {
    title: '阅读时长:(分钟)',
    value: parseFloat((dailyStats.value?.readingMinutes || 0).toFixed(3)),
    icon: '📚📚📚',
    color: 'bg-reading',
    type: 'readingMinutes'
  },
  {
    title: '喝水次数:(次)',
    value: dailyStats.value?.waterCount || 0,
    icon: '💧💧💧',
    color: 'bg-water',
    type: 'waterCount'
  },
  {
    title: '运动时长:(分钟)',
    value: parseFloat((dailyStats.value?.exerciseMinutes || 0).toFixed(3)),
    icon: '🏃🏃🏃',
    color: 'bg-exercise',
    type: 'exerciseMinutes'
  },
  {
    title: '玩电脑时长:(分钟)',
    value: parseFloat((dailyStats.value?.play_with_computer || 0).toFixed(3)),
    icon: '🎮🎮🎮',
    color: 'bg-game',
    type: 'play_with_computer'
  },
  {
    title: '家务时长:(分钟)',
    value: parseFloat((dailyStats.value?.houseworkMinutes || 0).toFixed(3)),
    icon: '🧹🧹🧹',
    color: 'bg-housework',
    type: 'houseworkMinutes'
  },
  {
    title: '最长久坐时间:(分钟)',
    value: parseFloat((dailyStats.value?.longsitMinutes || 0).toFixed(3)),
    icon: ' 💀💀💀',
    color: 'bg-longtime_sit',
    type: 'longtime-sitMinutes'
  }
] as StatCardType[]);

onMounted(async () => {
  const result = await getDailyStats();
  dailyStats.value = result.data;
});

const handleCardClick = (type: string) => {
  router.push({ name: 'historical', params: { type } });
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-gray-800">健康数据统计</h1>
      
      <!-- 新增：喝水提醒 -->
      <div 
        v-if="showWaterWarning" 
        class="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700"
      >
        <p class="font-bold">温馨提示</p>
        <p>今日喝水次数少于5次，建议多喝水保持身体健康！</p>
      </div>
      <div class="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700" v-if="showPlay_with_computerWarning">
        <p class="font-bold">温馨提示</p>
        <p>今日玩电脑时长超过60分钟，建议减少玩电脑时间保持身体健康！</p>
      </div>
      <div class="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700" v-if="showHouseworkWarning">
        <p class="font-bold">温馨提示</p>
        <p>今日家务时长小于10分钟，建议多做家务保持身体健康！</p>
      </div>
      <div class="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700" v-if="showLongtime_sitWarning">
        <p class="font-bold">温馨提示</p>
        <p>今日最长久坐时间超过30分钟，建议减少久坐时间保持身体健康！</p>
      </div>
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          v-for="stat in stats"
          :key="stat.type"
          :stat="stat"
          @click="handleCardClick(stat.type)"
        />
      </div>
    </div>
  </div>
</template>