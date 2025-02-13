from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import sqlite3
import json

ml_analytics_bp = Blueprint('ml_analytics', __name__)

def init_db():
    conn = sqlite3.connect('ml_analytics.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS ml_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME,
            model_name TEXT,
            query_type TEXT,
            tokens_used INTEGER,
            processing_time REAL,
            success_rate REAL,
            cost REAL,
            user_feedback INTEGER
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS revenue_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME,
            total_cost REAL,
            revenue_generated REAL,
            profit_margin REAL,
            active_users INTEGER,
            subscription_tier TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@ml_analytics_bp.route('/api/ml/track', methods=['POST'])
def track_ml_usage():
    data = request.json
    
    conn = sqlite3.connect('ml_analytics.db')
    c = conn.cursor()
    
    # Track ML model usage
    c.execute('''
        INSERT INTO ml_usage (
            timestamp, model_name, query_type, tokens_used,
            processing_time, success_rate, cost, user_feedback
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        datetime.now().isoformat(),
        data.get('model_name', 'default'),
        data.get('query_type', 'general'),
        data.get('tokens_used', 0),
        data.get('processing_time', 0),
        data.get('success_rate', 1.0),
        data.get('cost', 0.0),
        data.get('user_feedback', 0)
    ))
    
    # Calculate and update revenue metrics
    cost = data.get('cost', 0.0)
    revenue = cost * 1.3  # 30% markup
    
    c.execute('''
        INSERT INTO revenue_metrics (
            timestamp, total_cost, revenue_generated,
            profit_margin, active_users, subscription_tier
        ) VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        datetime.now().isoformat(),
        cost,
        revenue,
        0.3,  # 30% profit margin
        data.get('active_users', 1),
        data.get('subscription_tier', 'free')
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success'})

@ml_analytics_bp.route('/api/ml/metrics', methods=['GET'])
def get_ml_metrics():
    conn = sqlite3.connect('ml_analytics.db')
    c = conn.cursor()
    
    # Get time ranges
    now = datetime.now()
    day_ago = now - timedelta(days=1)
    
    # Get ML usage metrics
    c.execute('''
        SELECT 
            COUNT(*) as total_queries,
            AVG(tokens_used) as avg_tokens,
            AVG(processing_time) as avg_processing_time,
            AVG(success_rate) as avg_success_rate,
            SUM(cost) as total_cost
        FROM ml_usage
        WHERE timestamp > ?
    ''', (day_ago.isoformat(),))
    
    ml_stats = c.fetchone()
    
    # Get revenue metrics
    c.execute('''
        SELECT 
            SUM(revenue_generated) as total_revenue,
            AVG(profit_margin) as avg_margin,
            COUNT(DISTINCT active_users) as unique_users
        FROM revenue_metrics
        WHERE timestamp > ?
    ''', (day_ago.isoformat(),))
    
    revenue_stats = c.fetchone()
    
    conn.close()
    
    return jsonify({
        'ml_metrics': {
            'total_queries': ml_stats[0],
            'avg_tokens_per_query': ml_stats[1],
            'avg_processing_time': ml_stats[2],
            'success_rate': ml_stats[3],
            'total_cost': ml_stats[4]
        },
        'revenue_metrics': {
            'total_revenue': revenue_stats[0],
            'profit_margin': revenue_stats[1],
            'unique_users': revenue_stats[2]
        }
    })

@ml_analytics_bp.route('/api/ml/optimize', methods=['GET'])
def get_optimization_suggestions():
    conn = sqlite3.connect('ml_analytics.db')
    c = conn.cursor()
    
    # Analyze usage patterns
    c.execute('''
        SELECT 
            model_name,
            AVG(tokens_used) as avg_tokens,
            AVG(cost) as avg_cost,
            AVG(success_rate) as success_rate
        FROM ml_usage
        GROUP BY model_name
        ORDER BY avg_cost DESC
    ''')
    
    model_stats = c.fetchall()
    
    # Generate optimization suggestions
    suggestions = []
    for model in model_stats:
        if model[1] > 1000:  # High token usage
            suggestions.append({
                'model': model[0],
                'issue': 'High token usage',
                'suggestion': 'Consider implementing token optimization techniques'
            })
        if model[2] > 0.1:  # High cost
            suggestions.append({
                'model': model[0],
                'issue': 'High cost per query',
                'suggestion': 'Evaluate cheaper alternative models'
            })
        if model[3] < 0.9:  # Low success rate
            suggestions.append({
                'model': model[0],
                'issue': 'Low success rate',
                'suggestion': 'Review error patterns and improve prompt engineering'
            })
    
    conn.close()
    
    return jsonify({
        'optimization_suggestions': suggestions
    })
