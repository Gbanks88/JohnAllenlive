from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import sqlite3
import json

analytics_bp = Blueprint('analytics', __name__)

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('analytics.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS analytics_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME,
            total_visits INTEGER,
            unique_users INTEGER,
            search_queries INTEGER,
            conversion_rate REAL,
            estimated_revenue REAL,
            hourly_average REAL,
            daily_average REAL,
            weekly_average REAL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@analytics_bp.route('/api/analytics', methods=['POST'])
def store_analytics():
    data = request.json
    
    conn = sqlite3.connect('analytics.db')
    c = conn.cursor()
    
    c.execute('''
        INSERT INTO analytics_data (
            timestamp, total_visits, unique_users, 
            search_queries, conversion_rate, estimated_revenue,
            hourly_average, daily_average, weekly_average
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        datetime.now().isoformat(),
        data.get('totalVisits', 0),
        data.get('uniqueUsers', 0),
        data.get('searchQueries', 0),
        data.get('conversionRate', 0),
        data.get('estimatedRevenue', 0),
        data.get('hourlyAverage', 0),
        data.get('dailyAverage', 0),
        data.get('weeklyAverage', 0)
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success'})

@analytics_bp.route('/api/analytics/summary', methods=['GET'])
def get_analytics_summary():
    conn = sqlite3.connect('analytics.db')
    c = conn.cursor()
    
    # Get time ranges
    now = datetime.now()
    hour_ago = now - timedelta(hours=1)
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(weeks=1)
    month_ago = now - timedelta(days=30)
    
    # Get summary metrics
    c.execute('''
        SELECT 
            AVG(hourly_average) as avg_hourly,
            AVG(daily_average) as avg_daily,
            AVG(weekly_average) as avg_weekly,
            MAX(estimated_revenue) as total_revenue,
            AVG(conversion_rate) as avg_conversion
        FROM analytics_data
        WHERE timestamp > ?
    ''', (month_ago.isoformat(),))
    
    monthly_stats = c.fetchone()
    
    # Get trend data
    c.execute('''
        SELECT timestamp, estimated_revenue, search_queries
        FROM analytics_data
        WHERE timestamp > ?
        ORDER BY timestamp ASC
    ''', (week_ago.isoformat(),))
    
    trend_data = c.fetchall()
    
    # Format trend data
    trends = [{
        'timestamp': row[0],
        'revenue': row[1],
        'searches': row[2]
    } for row in trend_data]
    
    conn.close()
    
    return jsonify({
        'summary': {
            'avgHourlyVisits': monthly_stats[0],
            'avgDailyVisits': monthly_stats[1],
            'avgWeeklyVisits': monthly_stats[2],
            'totalRevenue': monthly_stats[3],
            'avgConversionRate': monthly_stats[4]
        },
        'trends': trends
    })

@analytics_bp.route('/api/analytics/export', methods=['GET'])
def export_analytics():
    start_date = request.args.get('start', 
        (datetime.now() - timedelta(days=30)).isoformat())
    end_date = request.args.get('end', datetime.now().isoformat())
    
    conn = sqlite3.connect('analytics.db')
    c = conn.cursor()
    
    c.execute('''
        SELECT *
        FROM analytics_data
        WHERE timestamp BETWEEN ? AND ?
        ORDER BY timestamp DESC
    ''', (start_date, end_date))
    
    columns = [description[0] for description in c.description]
    data = c.fetchall()
    
    export_data = []
    for row in data:
        export_data.append(dict(zip(columns, row)))
    
    conn.close()
    
    return jsonify(export_data)
