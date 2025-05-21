export interface DailyStats {
  _id: string;      // 添加MongoDB的_id字段
  date: string;     // 日期
     // 活动数据（嵌套对象，与后端一致）
  readingMinutes: number;
  waterCount:  number;
  exerciseMinutes: number;
  play_with_computer:  number;
  sleepMinutes: number;
  houseworkMinutes: number;
  longsitMinutes: number;
}

export interface HistoricalData {
  date: string;     // 日期
  value: number;
}

export interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  type: 'readingMinutes' | 'waterCount' | 'exerciseMinutes' |  'play_with_computer' | 'sleepMinutes' | 'houseworkMinutes' |  'longsitMinutes';
}