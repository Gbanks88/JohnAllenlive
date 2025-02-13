from fastapi import Request, HTTPException
from datetime import datetime, timedelta
import tensorflow as tf
import numpy as np
import sqlite3
import json
import re
from typing import Dict, List, Tuple
import asyncio
import hashlib
import logging

class SecurityMonitor:
    def __init__(self):
        self.init_db()
        self.threat_patterns = self.load_threat_patterns()
        self.request_history = {}
        self.anomaly_detector = self.init_anomaly_detector()
        self.THREAT_THRESHOLD = 0.85
        
    def init_db(self):
        conn = sqlite3.connect('security.db')
        c = conn.cursor()
        
        # Threat detection table
        c.execute('''
            CREATE TABLE IF NOT EXISTS security_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                event_type TEXT,
                severity TEXT,
                source_ip TEXT,
                request_path TEXT,
                threat_score FLOAT,
                payload TEXT,
                action_taken TEXT,
                ml_confidence FLOAT
            )
        ''')
        
        # Pattern learning table
        c.execute('''
            CREATE TABLE IF NOT EXISTS behavior_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern_type TEXT,
                pattern_hash TEXT UNIQUE,
                occurrence_count INTEGER,
                last_seen DATETIME,
                confidence_score FLOAT,
                is_threat BOOLEAN
            )
        ''')
        
        conn.commit()
        conn.close()

    def load_threat_patterns(self) -> Dict:
        return {
            'sql_injection': [
                r"(?i)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER).*",
                r"(?i)(\b(and|or)\b\s+\w+\s*=\s*\w+)",
                r"(?i)(/\*|\*/|;|--|\||\|\|)"
            ],
            'xss': [
                r"(?i)(<script>|<\/script>|javascript:|onerror=|onload=)",
                r"(?i)(alert\(|eval\(|document\.cookie)",
                r"(?i)(<img[^>]+src[^>]+>)"
            ],
            'path_traversal': [
                r"(?i)(\.\.\/|\.\.\\|~\/|\.\.|\/etc\/passwd)",
                r"(?i)(\/var\/www|\/proc\/self)",
                r"(?i)(c:\\windows|%2e%2e)"
            ],
            'command_injection': [
                r"(?i)(\b(cmd|powershell|bash|sh|wget|curl)\b)",
                r"(?i)(\||\|\||&|&&|\$\(|\`)",
                r"(?i)(\/bin\/|\/usr\/bin)"
            ],
            'api_abuse': [
                r"(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b)",
                r"(User-Agent:\s*\b(curl|wget|python-requests)\b)",
                r"(Content-Type:\s*application\/x-www-form-urlencoded)"
            ]
        }

    def init_anomaly_detector(self) -> tf.keras.Model:
        """Initialize the anomaly detection model"""
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_shape=(20,)),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(8, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(optimizer='adam',
                     loss='binary_crossentropy',
                     metrics=['accuracy'])
        
        return model

    async def analyze_request(self, request: Request) -> Dict:
        """Analyze incoming request for security threats"""
        request_data = {
            'ip': request.client.host,
            'path': request.url.path,
            'method': request.method,
            'headers': dict(request.headers),
            'timestamp': datetime.now().isoformat()
        }
        
        # Get request body if present
        try:
            body = await request.json()
            request_data['body'] = body
        except:
            request_data['body'] = {}

        threat_analysis = await self.detect_threats(request_data)
        await self.update_behavior_patterns(request_data, threat_analysis)
        
        return threat_analysis

    async def detect_threats(self, request_data: Dict) -> Dict:
        """Detect potential security threats in the request"""
        threats = []
        confidence_scores = []
        
        # Pattern-based detection
        for threat_type, patterns in self.threat_patterns.items():
            for pattern in patterns:
                if self._check_pattern(pattern, request_data):
                    threats.append(threat_type)
                    confidence_scores.append(0.9)  # High confidence for pattern match

        # Anomaly detection
        anomaly_score = await self._detect_anomaly(request_data)
        if anomaly_score > self.THREAT_THRESHOLD:
            threats.append('anomalous_behavior')
            confidence_scores.append(anomaly_score)

        # Rate limiting check
        if await self._check_rate_limit(request_data['ip']):
            threats.append('rate_limit_exceeded')
            confidence_scores.append(1.0)

        # Record security event
        if threats:
            await self._record_security_event(
                request_data,
                threats,
                max(confidence_scores) if confidence_scores else 0.0
            )

        return {
            'threats_detected': threats,
            'confidence_score': max(confidence_scores) if confidence_scores else 0.0,
            'timestamp': datetime.now().isoformat(),
            'request_id': self._generate_request_id(request_data)
        }

    def _check_pattern(self, pattern: str, request_data: Dict) -> bool:
        """Check if a threat pattern exists in request data"""
        data_string = json.dumps(request_data).lower()
        return bool(re.search(pattern, data_string))

    async def _detect_anomaly(self, request_data: Dict) -> float:
        """Detect anomalous behavior using ML model"""
        feature_vector = self._extract_features(request_data)
        prediction = self.anomaly_detector.predict(np.array([feature_vector]))
        return float(prediction[0][0])

    def _extract_features(self, request_data: Dict) -> List[float]:
        """Extract numerical features from request data for ML model"""
        features = []
        
        # Request timing features
        hour = datetime.now().hour
        features.append(hour / 24.0)  # Normalize hour
        
        # Request size features
        body_size = len(json.dumps(request_data.get('body', {})))
        features.append(min(body_size / 10000.0, 1.0))  # Normalize size
        
        # Header features
        headers = request_data.get('headers', {})
        features.append(len(headers) / 50.0)  # Normalize header count
        
        # Path complexity
        path = request_data.get('path', '')
        features.append(len(path.split('/')) / 10.0)
        
        # Pad remaining features
        while len(features) < 20:
            features.append(0.0)
            
        return features

    async def _check_rate_limit(self, ip: str) -> bool:
        """Check if IP has exceeded rate limit"""
        now = datetime.now()
        window_start = now - timedelta(minutes=1)
        
        if ip not in self.request_history:
            self.request_history[ip] = []
            
        # Clean old requests
        self.request_history[ip] = [
            ts for ts in self.request_history[ip]
            if ts > window_start
        ]
        
        # Add current request
        self.request_history[ip].append(now)
        
        # Check limit (100 requests per minute)
        return len(self.request_history[ip]) > 100

    async def _record_security_event(self, request_data: Dict, threats: List[str], confidence: float):
        """Record security event to database"""
        conn = sqlite3.connect('security.db')
        c = conn.cursor()
        
        c.execute('''
            INSERT INTO security_events (
                timestamp, event_type, severity, source_ip,
                request_path, threat_score, payload, action_taken, ml_confidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            ','.join(threats),
            'HIGH' if confidence > 0.9 else 'MEDIUM' if confidence > 0.7 else 'LOW',
            request_data['ip'],
            request_data['path'],
            confidence,
            json.dumps(request_data),
            'BLOCK' if confidence > self.THREAT_THRESHOLD else 'MONITOR',
            confidence
        ))
        
        conn.commit()
        conn.close()

    async def update_behavior_patterns(self, request_data: Dict, threat_analysis: Dict):
        """Update learned behavior patterns"""
        pattern_hash = self._generate_request_id(request_data)
        
        conn = sqlite3.connect('security.db')
        c = conn.cursor()
        
        c.execute('''
            INSERT INTO behavior_patterns (
                pattern_type, pattern_hash, occurrence_count,
                last_seen, confidence_score, is_threat
            ) VALUES (?, ?, 1, ?, ?, ?)
            ON CONFLICT(pattern_hash) DO UPDATE SET
                occurrence_count = occurrence_count + 1,
                last_seen = excluded.last_seen,
                confidence_score = excluded.confidence_score,
                is_threat = excluded.is_threat
        ''', (
            'request_pattern',
            pattern_hash,
            datetime.now().isoformat(),
            threat_analysis['confidence_score'],
            bool(threat_analysis['threats_detected'])
        ))
        
        conn.commit()
        conn.close()

    def _generate_request_id(self, request_data: Dict) -> str:
        """Generate unique hash for request pattern"""
        pattern_string = f"{request_data['method']}:{request_data['path']}:{sorted(request_data['headers'].keys())}"
        return hashlib.sha256(pattern_string.encode()).hexdigest()

    async def get_security_insights(self) -> Dict:
        """Get security insights and statistics"""
        conn = sqlite3.connect('security.db')
        c = conn.cursor()
        
        # Get threat statistics
        c.execute('''
            SELECT 
                COUNT(*) as total_events,
                AVG(threat_score) as avg_threat_score,
                COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high_severity,
                COUNT(CASE WHEN action_taken = 'BLOCK' THEN 1 END) as blocked_requests
            FROM security_events
            WHERE timestamp > datetime('now', '-24 hours')
        ''')
        
        stats = c.fetchone()
        
        # Get top threats
        c.execute('''
            SELECT event_type, COUNT(*) as count
            FROM security_events
            WHERE timestamp > datetime('now', '-24 hours')
            GROUP BY event_type
            ORDER BY count DESC
            LIMIT 5
        ''')
        
        top_threats = [{
            'type': row[0],
            'count': row[1]
        } for row in c.fetchall()]
        
        conn.close()
        
        return {
            'statistics': {
                'total_events': stats[0],
                'average_threat_score': stats[1],
                'high_severity_count': stats[2],
                'blocked_requests': stats[3]
            },
            'top_threats': top_threats,
            'timestamp': datetime.now().isoformat()
        }

# Initialize security monitor
security_monitor = SecurityMonitor()
