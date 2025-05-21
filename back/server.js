const express = require('express');
const app = express();
const PORT = 1285;

// 在后端server.js中添加CORS配置
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173', // 你的前端地址
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 连接MongoDB

const mongoose = require('mongoose');

// // 默认连接（主数据库）
// const mainDb = mongoose.createConnection('mongodb://localhost:27017/activity_db', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

// 第二个数据库连接
const secondDb = mongoose.createConnection('mongodb://localhost:27017/activity_tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const DailyStatsSchema = new mongoose.Schema({
  date: { 
    type: String, 
    required: true, 
    unique: true,
    match: /^\d{4}-\d{2}-\d{2}$/ // 确保日期格式为"YYYY-MM-DD"
  },
  readingMinutes: Number,
  waterCount:  Number,
  exerciseMinutes: Number,
  play_with_computer:  Number,
  sleepMinutes: Number,
  houseworkMinutes: Number,
  longsitMinutes: Number
});

const HistoricalSchema = new mongoose.Schema({
  readingMinutes: {
    type: [
      {
        date: {
          type: String,
          required: true
        },
        value: {
          type: Number,
          required: true
        }
      }
    ],
    required: true,
  },
  waterCount: {
    type: [
      {
        date: {
          type: String,
          required: true
        },
        value: {
          type: Number,
          required: true
        }
      }
    ],
    required: true,
  },
  exerciseMinutes: {  // 注意：数据中没有提供excise字段的数据
    type: [
      {
        date: {
          type: String,
          required: true
        },
        value: {
          type: Number,
          required: true
        }
      }
    ],
    required: true,
  },
  play_with_computer: {
    type: [
      {
        date: {
          type: String,
          required: true
        },
        value: {
          type: Number,
          required: true
        }
      }
    ],
    required: true,
  },
  sleepMinutes: {
    type: [
      {
        date: {
          type: String,
          required: true
        },
        value: {
          type: Number,
          required: true
        }
      }
    ],
    required: true,
  },
  houseworkMinutes: {
    type: [
      {
        date: {
          type: String,
          required: true
        },
        value: {
          type: Number,
          required: true
        }
      }
    ],
    required: true,
  },
  longsitMinutes: {
    type: [
      {
        date: {
          type: String,
          required: true
        },
        value: {
          type: Number,
          required: true
        }
      }
    ],
    required: true,
}
});

// mainDb.on('connected', () => {
//   console.log('Connected to activity_db');
// });

secondDb.on('connected', () => {
  console.log('Connected to activity_tracker');
});

// 定义模型
const DailyStats = secondDb.model('DailyStats', DailyStatsSchema, 'daily_stats');
const Historical = secondDb.model('Historical', HistoricalSchema, 'historical_data');



// 获取当日数据（带缓存处理）
app.get('/daily-stats', async (req, res) => {
  const today = new Date().toLocaleDateString('en-CA');
  try {
    let data = await DailyStats.findOne({ date: today }).lean();
    
    if (!data) {
      data = { date: today, readingMinutes: number,waterCount: number, exerciseMinutes: number, play_with_computer: number, sleepMinutes: number,houseworkMinutes: number,longsitMinutes: number };
      await DailyStats.create(data); // 自动创建空记录
    }
    
    res.json(data);
  } catch (err) {
    console.error('[/daily-stats] Error:', err);
    res.status(500).json({ 
      error: 'Database error',
      details: err.message 
    });
  }
});

app.get('/historical/:activityType', async (req, res) => {
  try {
    const { activityType } = req.params;
    
    // 验证请求的活动类型是否有效
    const validActivities = ['readingMinutes', 'waterCount', 'exerciseMinutes', 'play_with_computer', 'sleepMinutes', 'houseworkMinutes', 'longsitMinutes'];
    if (!validActivities.includes(activityType)) {
      return res.status(400).json({ error: 'Invalid activity type' });
    }
    
    // 查询数据库，获取最新文档中的指定活动类型数据
    const data = await Historical.findOne(
      {}, 
      { 
        [activityType]: 1, // 直接选择顶层字段
        _id: 0 
      }
    ).sort({ _id: -1 }); // 获取最新的文档
    
    if (!data || !data[activityType]) {
      return res.json([]); // 如果没有数据，返回空数组
    }
    
    // 直接返回该活动类型的数组
    const result = data[activityType].map(item => ({
      date: item.date,
      value: item.value
    }));
    
    res.json(result);
  } catch (error) {
    console.error('获取历史数据失败:', error);
    res.status(500).json({ 
      error: '获取历史数据失败',
      details: error.message 
    });
  }
});


// 测试数据库查询
app.get('/debug/all-stats', async (req, res) => {
  try {
    const allData = await DailyStats.find({});
    console.log('All data:', allData); // 服务端日志
    res.json(allData);
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).send(err.message);
  }
});

// 确保有这个基础路由
app.get('/', (req, res) => {
  res.send('YOLO Activity Tracker API is working');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});