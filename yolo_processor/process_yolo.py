import csv
from datetime import datetime
from pymongo import MongoClient
from typing import List, Dict
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv( "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["activity_tracker"]


def calculate_minutes(start_time: str, end_time: str) -> int:
    """Calculate duration in minutes between two time strings (HH:MM:SS)."""
    fmt = "%H:%M:%S"
    start = datetime.strptime(start_time, fmt)
    end = datetime.strptime(end_time, fmt)
    return int((end - start).total_seconds() / 60)


def process_csv_data(file_path: str) -> Dict[str, Dict]:
    """
    Process CSV data into structured format grouped by date.
    Returns: Dictionary with date as key and aggregated stats as value
    """
    daily_data = {}

    with open(file_path, mode='r') as file:
        csv_reader = csv.DictReader(file)

        for row in csv_reader:
            date = row['data']
            activity = row['activity']
            duration = calculate_minutes(row['begentime'], row['overtime'])

            if date not in daily_data:
                daily_data[date] = {
                    'date': date,
                    'readingMinutes': 0,
                    'waterCount': 0,
                    'exciseMinutes': 0,
                    'gameMinutes': 0,
                    'sleepMinutes': 0
                }

            # Update counts based on activity type
            if activity == 'readingMinutes':
                daily_data[date]['readingMinutes'] += duration
            elif activity == 'waterCount':
                daily_data[date]['waterCount'] += 1
            elif activity == 'exciseMinutes':
                daily_data[date]['exciseMinutes'] += duration
            elif activity == 'gameMinutes':
                daily_data[date]['gameMinutes'] += duration
            elif activity == 'sleepMinutes':
                daily_data[date]['sleepMinutes'] += duration

    return daily_data


def create_historical_data(daily_stats: List[Dict]) -> Dict[str, List[Dict]]:
    """Create historical data structure from daily stats."""
    historical = {
        'readingMinutes': [],
        'waterCount': [],
        'exciseMinutes': [],
        'gameMinutes': [],
        'sleepMinutes': []
    }

    for stat in daily_stats:
        date = stat['date']
        historical['readingMinutes'].append({'date': date, 'value': stat['readingMinutes']})
        historical['waterCount'].append({'date': date, 'value': stat['waterCount']})
        historical['exciseMinutes'].append({'date':date,'value': stat['exciseMinutes']})
        historical['gameMinutes'].append({'date': date, 'value': stat['gameMinutes']})
        historical['sleepMinutes'].append({'date': date, 'value': stat['sleepMinutes']})

    return historical


def save_to_mongodb(daily_stats: List[Dict], historical_data: Dict[str, List[Dict]]):
    """Save processed data to MongoDB collections."""
    # Clear existing collections
    db.daily_stats.delete_many({})
    db.historical_data.delete_many({})

    # Insert new data
    if daily_stats:
        db.daily_stats.insert_many(daily_stats)

    if historical_data:
        db.historical_data.insert_one(historical_data)


def main(csv_file_path: str):
    """Main processing function."""
    print("Processing CSV data...")

    # Process data
    daily_data = process_csv_data(csv_file_path)
    daily_stats = list(daily_data.values())
    historical_data = create_historical_data(daily_stats)

    # Save to MongoDB
    save_to_mongodb(daily_stats, historical_data)

    print(f"Successfully processed {len(daily_stats)} days of data")
    print("Data saved to MongoDB collections:")
    print("- daily_stats")
    print("- historical_data")


if __name__ == "__main__":
    # Path to your CSV file
    CSV_PATH = "yolo_output.csv"

    # Run processing
    main(CSV_PATH)