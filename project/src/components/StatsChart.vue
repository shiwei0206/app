<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import type { HistoricalData } from '../types';
import { getHistoricalData } from '../api';

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent]);

const props = defineProps<{
  type: string;
  title: string;
  color?: string; // 可选的颜色配置
}>();

const chartData = ref<HistoricalData[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const updateKey = ref(0);

// 按日期排序函数
const sortByDate = (data: HistoricalData[]) => {
  return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// 获取数据
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await getHistoricalData(props.type);
    chartData.value = sortByDate(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Failed to fetch historical data:', err);
    error.value = '数据加载失败，请稍后重试';
    chartData.value = [];
  } finally {
    loading.value = false;
    updateKey.value++;
  }
};

onMounted(fetchData);

// 图表配置
const chartOption = computed(() => {
  const baseConfig = {
    title: {
      text: props.title,
      left: 'center',
      textStyle: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const date = params[0].axisValue;
        const value = params[0].data;
        return `${date}<br/>${props.title}: ${value}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      axisLabel: {
        rotate: 45, // 日期标签旋转45度防止重叠
        formatter: (value: string) => {
          // 格式化日期显示，例如 "05-12"
          const date = new Date(value);
          return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        }
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [{
      name: props.title,
      type: 'bar', // 改为柱状图更直观
      barWidth: '60%',
      itemStyle: {
        color: props.color || '#5470C6' // 可使用传入的颜色或默认蓝色
      },
      data: []
    }]
  };

  if (!chartData.value.length) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    xAxis: {
      ...baseConfig.xAxis,
      data: chartData.value.map(item => item.date)
    },
    series: [{
      ...baseConfig.series[0],
      data: chartData.value.map(item => item.value)
    }]
  };
});
</script>

<template>
  <div class="chart-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
      <span>数据加载中...</span>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-message">
      {{ error }}
      <button @click="fetchData" class="retry-button">重试</button>
    </div>
    
    <!-- 正常显示图表 -->
    <div v-else class="w-full h-[400px]">
      <v-chart 
        :option="chartOption" 
        :key="updateKey" 
        autoresize 
        class="chart" 
      />
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 400px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ff4d4f;
}

.retry-button {
  margin-top: 10px;
  padding: 5px 15px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chart {
  transition: all 0.3s ease;
}
</style>