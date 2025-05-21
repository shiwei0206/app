from flask import Flask, jsonify
from pymongo import MongoClient
from datetime import datetime, timedelta, date
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# MongoDB连接配置
client = MongoClient('mongodb://localhost:27017')
db = client['activity_db']
collection = db['daily_stats']

def process_and_store_data():
    """处理CSV数据并存储到MongoDB"""
    try:
        df = pd.read_csv('yolo_output.csv')

        # 处理时间数据并计算活动时长
        df['begin_datetime'] = pd.to_datetime(df['data'] + ' ' + df['begentime'])
        df['end_datetime'] = pd.to_datetime(df['data'] + ' ' + df['overtime'])
        df['duration'] = (df['end_datetime'] - df['begin_datetime']).dt.total_seconds() / 3600

        # 按天和活动统计总时长
        df['date'] = pd.to_datetime(df['data']).dt.date
        daily_stats = df.groupby(['date', 'activity'])['duration'].sum().unstack(fill_value=0)

        # 保存到MongoDB
        for date, row in daily_stats.iterrows():
            # 将分钟数转换为整数
            activities_data = {
                'readingCount': int(row.get('reading', 0) * 60),
                'waterCount': int(row.get('water', 0)),  # 假设water是次数而不是时长
                'exerciseMinutes': int(row.get('exercise', 0) * 60),
                'gameMinutes': int(row.get('game', 0) * 60),
                'sleepMinutes': int(row.get('sleep', 0) * 60)
            }
            
            collection.update_one(
                {'date': str(date)},
                {'$set': {'activities': activities_data}},
                upsert=True
            )
        return True
    except Exception as e:
        print(f"Error processing data: {e}")
        return False

@app.route('/daily-stats', methods=['GET'])
def get_daily_stats():
    """获取当日统计数据"""
    try:
        today = str(date.today())
        data = collection.find_one({'date': today})
        
        if not data:
            return jsonify({
                'id': 'today',
                'date': today,
                'readingCount': 0,
                'waterCount': 0,
                'exerciseMinutes': 0,
                'gameMinutes': 0,
                'sleepMinutes': 0
            })
        
        activities = data.get('activities', {})
        return jsonify({
            'id': 'today',
            'date': today,
            'readingCount': activities.get('readingCount', 0),
            'waterCount': activities.get('waterCount', 0),
            'exerciseMinutes': activities.get('exerciseMinutes', 0),
            'gameMinutes': activities.get('gameMinutes', 0),
            'sleepMinutes': activities.get('sleepMinutes', 0)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/historical/<activity_type>', methods=['GET'])
def get_historical_data(activity_type):
    """获取历史数据"""
    try:
        valid_types = ['readingCount', 'waterCount', 'exerciseMinutes', 'gameMinutes', 'sleepMinutes']
        if activity_type not in valid_types:
            return jsonify({'error': 'Invalid activity type'}), 400
        
        # 获取最近30天的数据
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        query = {
            'date': {
                '$gte': str(start_date),
                '$lte': str(end_date)
            }
        }
        
        historical_data = []
        for record in collection.find(query).sort('date', 1):
            activities = record.get('activities', {})
            historical_data.append({
                'date': record['date'],
                'value': activities.get(activity_type, 0)
            })
        
        return jsonify(historical_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # 在启动时处理并存储数据
    process_and_store_data()
    app.run(port=1285, debug=True)