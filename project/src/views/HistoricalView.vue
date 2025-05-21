<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import StatsChart from '../components/StatsChart.vue';
import { getHistoricalData } from '../api/index';
import type { HistoricalData } from '../types/index';

const router = useRouter();
const props = defineProps<{
  type: 'readingMinutes' | 'waterCount' | 'exerciseMinutes' | 'play_with_computer' | 'sleepMinutes' | 'houseworkMinutes' |'longsitMinutes'; // 与后端保持一致
}>();


// 新增状态：建议相关
const showSuggestions = ref(false);
const suggestions = ref<string>('');
const suggestLoading = ref(false);
const suggestError = ref<string | null>(null);

// 更精确的类型定义
type ActivityType = 'readingMinutes' | 'waterCount' | 'exerciseMinutes' | 'play_with_computer' | 'sleepMinutes' | 'houseworkMinutes'|'longsitMinutes';

// 标题映射
const getTitle = (type: ActivityType): string => {
  const titles: Record<ActivityType, string> = {
    readingMinutes: '阅读时长(分钟)',
    waterCount: '喝水记录(次数)',
    exerciseMinutes: '锻炼时长(分钟)',
    play_with_computer: '游戏时长(分钟)',
    sleepMinutes: '睡眠时长(分钟)',
    houseworkMinutes: '家务时长(分钟)',
    longsitMinutes: '最长久坐时长(分钟)'
  };
  return titles[type] || '';
};

// 存储数据
const chartData = ref<HistoricalData[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

// 颜色映射
const getChartColor = (type: ActivityType): string => {
  const colors: Record<ActivityType, string> = {
    readingMinutes: '#5470C6',
    waterCount: '#91CC75',
    exerciseMinutes: '#EE6666',
    play_with_computer: '#FAC858',
    sleepMinutes: '#73C0DE',
    houseworkMinutes: '#FAC858',
    longsitMinutes:  '#73C0DE'
  };
  return colors[type];
};

// 获取数据并排序
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data, error: apiError } = await getHistoricalData(props.type);
    
    if (apiError) {
      throw new Error(apiError);
    }

    // 确保数据是数组并按日期排序
    chartData.value = Array.isArray(data) 
      ? [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      : [];
  } catch (err: any) {
    console.error('获取数据失败:', err);
    error.value = err.message || `获取${getTitle(props.type)}数据失败，请稍后重试`;
    chartData.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);

// 判断是否有有效数据（不只是空数组，还要检查是否有非零值）
const hasValidData = computed(() => {
  return chartData.value.some(item => item.value > 0);
});

// 刷新数据
const refreshData = () => {
  fetchData();
};


// 获取活动类型的中文描述
const getActivityDesc = computed(() => {
  const mapping: Record<typeof props.type, string> = {
    readingMinutes: '阅读',
    waterCount: '饮水',
    exerciseMinutes: '锻炼',
    play_with_computer: '游戏娱乐',
    sleepMinutes: '睡眠',
    houseworkMinutes: '家务',
    longsitMinutes: '最长久坐'
  };
  return mapping[props.type];
});

// 获取当前活动的单位
const getActivityUnit = computed(() => {
  return props.type === 'waterCount' ? '次数' : '分钟';
});

// 生成数据分析提示词
const generateAnalysisPrompt = () => {
  const activity = getActivityDesc.value;
  const unit = getActivityUnit.value;
  
  // 构造数据描述
  const dataDescription = chartData.value
    .map(d => `${d.date.replace('T', ' ')}:${d.value}${unit}`)
    .join('\n');

  return `你是一名专业健康顾问，请基于用户近期的${activity}数据进行专业分析：
  
【${activity}记录】
${dataDescription}

请根据以上数据：
1. 分析当前${activity}习惯的特点（至少2点）
2. 指出可能存在的健康隐患（1-2个）
3. 给出3条具体改进建议
4. 最后用一句话鼓励

要求：
- 使用口语化中文
- 分点说明，使用★符号作为条目标识
- 总字数控制在300字以内`;
};

// 获取DeepSeek建议
const fetchDeepSeekSuggestion = async () => {
  suggestLoading.value = true;
  suggestError.value = null;
  showSuggestions.value = true;

  try {
    // 构造API请求
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer sk-66884ec54bfb4101aa55e1888a711a4e`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: generateAnalysisPrompt()
        }],
        temperature: 0.6,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`请求失败：${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    suggestions.value = data.choices[0].message.content;
  } catch (err: any) {
    console.error('获取建议失败:', err);
    suggestError.value = err.message || '获取建议失败，请稍后重试';
    suggestions.value = '';
  } finally {
    suggestLoading.value = false;
  }
};

</script>

<template>
  <div class="min-h-screen bg-gray-100 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- 头部导航 -->
      <div class="flex items-center mb-8">
        <button 
          @click="router.push('/')"
          class="flex items-center text-gray-600 hover:text-gray-800 mr-4 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          返回
        </button>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800">
          {{ getTitle(type) }}历史记录
        </h1>
        <button 
          @click="refreshData"
          class="ml-auto flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="bg-white rounded-2xl p-6 shadow-lg">
        <!-- 加载状态 -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-16">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p class="text-gray-600">正在加载数据...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="text-center py-10">
          <div class="inline-flex items-center bg-red-100 px-4 py-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span class="text-red-600">{{ error }}</span>
          </div>
          <button 
            @click="fetchData"
            class="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
          >
            点击重试
          </button>
        </div>

        <!-- 有数据时显示图表 -->
        <template v-else>
          <div v-if="hasValidData">
            <StatsChart
              :type="type"
              :title="getTitle(type)"
              :data="chartData"
              :color="getChartColor(type)"
            />
          </div>
          <div v-else class="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-700 mb-2">暂无有效数据</h3>
            <p class="text-gray-500 mb-4">当前没有记录到有效的{{ getTitle(type) }}数据</p>
            <button
              @click="router.push('/')"
              class="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            >
              去添加记录
            </button>
          </div>
        </template>
      </div>



 <!-- 建议区域 -->
      <div class="mt-6 space-y-4">
        <button
          @click="fetchDeepSeekSuggestion"
          :disabled="suggestLoading || !hasValidData"
          class="w-full py-3 px-4 bg-green-300 hover:bg-green-400 text-black font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          {{ suggestLoading ? '生成建议中...' : `获取${getActivityDesc}建议` }}
        </button>

        <!-- 建议展示 -->
        <transition name="slide-fade">
          <div 
            v-if="showSuggestions"
            class="bg-white rounded-2xl p-6 shadow-lg border border-green-50"
          >
            <!-- 加载状态 -->
            <div v-if="suggestLoading" class="flex items-center justify-center p-4">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
              <span class="ml-3 text-gray-600">正在分析您的{{ getActivityDesc }}数据...</span>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="suggestError" class="bg-red-50 p-4 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <span class="text-red-600">{{ suggestError }}</span>
            </div>

            <!-- 成功状态 -->
            <div v-else-if="suggestions" class="space-y-4">
              <h3 class="text-xl font-semibold text-gray-800 border-b pb-2">
                <span class="text-green-600">📊</span> 
                您的{{ getActivityDesc }}健康分析报告
              </h3>
              <div 
                class="prose text-gray-700 max-w-none"
                v-html="suggestions
                  .replace(/\n/g, '<br/>')
                  .replace(/★/g, '★ ')
                  .replace(/(\d+条)/, '<strong>$1</strong>')"
              ></div>
            </div>

            <!-- 空状态 -->
            <div v-else class="text-center py-6 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              暂时无法生成建议，请确保您有有效数据记录
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>



/* 新增过渡动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* 添加一些过渡动画 */
button {
  transition: all 0.2s ease;
}

/* 加载动画 */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>