import axios from 'axios';
import type { DailyStats, HistoricalData } from '../types';

// 配置 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:1285', // 后端接口地址
  timeout: 5000, // 添加请求超时设置
});

/**
 * 获取每日统计数据
 * @returns 包含数据、加载状态和错误信息的对象
 */
export const getDailyStats = async (): Promise<{
  data: DailyStats | null;
  isLoading: boolean;
  error: string | null;
}> => {
  try {
    console.log('开始获取每日统计数据...');
    const response = await api.get('/daily-stats');
    
    // 验证响应数据格式
    if (!response.data || 
        typeof response.data.readingMinutes !== 'number' || 
        typeof response.data.waterCount !== 'number') {
      throw new Error('从服务器接收的数据格式无效');
    }

    console.log('每日统计数据获取成功:', response.data);
    return {
      data: response.data,
      isLoading: false,
      error: null,
    };
  } catch (error) {
    let errorMessage = '获取每日统计数据失败';
    
    if (axios.isAxiosError(error)) {
      // 处理Axios特有的错误
      if (error.response) {
        // 请求已发出，服务器返回错误状态码
        errorMessage = `服务器错误: ${error.response.status} - ${error.response.data?.message || '无额外信息'}`;
      } else if (error.request) {
        // 请求已发出但没有收到响应
        errorMessage = '未收到服务器响应';
      } else {
        // 请求设置出错
        errorMessage = `请求设置错误: ${error.message}`;
      }
    } else if (error instanceof Error) {
      // 其他类型的错误
      errorMessage = error.message;
    }

    console.error('获取每日统计数据时出错:', error);
    return {
      data: null,
      isLoading: false,
      error: errorMessage,
    };
  }
};

/**
 * 获取历史数据
 * @param type 数据类型 (reading/water/excise/game/sleep)
 * @returns 包含数据、加载状态和错误信息的对象
 */
export const getHistoricalData = async (type: string): Promise<{
  data: HistoricalData[] | null;
  isLoading: boolean;
  error: string | null;
}> => {
  try {
    console.log(`开始获取${type}历史数据...`);
    const response = await api.get(`/historical/${type}`);
    
    // 确保响应数据是数组格式
    if (!Array.isArray(response.data)) {
      throw new Error('预期接收数组但收到不同类型的数据');
    }
    
    // 验证每个数据项的格式
    const isValidData = response.data.every((item: any) => 
      typeof item === 'object' && 
      item !== null &&
      'date' in item && 
      'value' in item &&
      typeof item.value === 'number'
    );
    
    if (!isValidData) {
      throw new Error('接收的历史数据格式无效: 缺少date或value字段，或value不是数字');
    }

    console.log(`${type}历史数据获取成功，共${response.data.length}条记录`);
    return {
      data: response.data as HistoricalData[],
      isLoading: false,
      error: null,
    };
  } catch (error) {
    let errorMessage = `获取${type}历史数据失败`;
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = `服务器错误: ${error.response.status} - ${
          error.response.data?.error || 
          error.response.data?.message || 
          '无额外信息'
        }`;
      } else if (error.request) {
        errorMessage = '未收到服务器响应';
      } else {
        errorMessage = `请求设置错误: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(`获取${type}历史数据时出错:`, error);
    return {
      data: null,
      isLoading: false,
      error: errorMessage,
    };
  }
};