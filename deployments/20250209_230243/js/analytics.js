// Analytics and Revenue Tracking System
class RevenueAnalytics {
    constructor() {
        this.visitData = [];
        this.revenueMetrics = {
            totalVisits: 0,
            uniqueUsers: new Set(),
            searchQueries: 0,
            conversionRate: 0,
            estimatedRevenue: 0
        };
        
        // Constants for revenue calculation
        this.REVENUE_PER_SEARCH = 0.01;  // Estimated revenue per search
        this.CONVERSION_RATE = 0.02;     // Estimated conversion rate (2%)
        
        this.init();
    }
    
    init() {
        // Track page visits
        this.trackPageView();
        
        // Track search queries
        document.querySelector('.search-input')?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.trackSearch(e.target.value);
            }
        });
        
        // Calculate moving averages every hour
        setInterval(() => this.calculateMovingAverages(), 3600000);
    }
    
    trackPageView() {
        const visit = {
            timestamp: new Date(),
            userId: this.getUserId(),
            page: window.location.pathname
        };
        
        this.visitData.push(visit);
        this.revenueMetrics.totalVisits++;
        this.revenueMetrics.uniqueUsers.add(visit.userId);
        
        // Store in localStorage
        this.persistData();
    }
    
    trackSearch(query) {
        this.revenueMetrics.searchQueries++;
        this.calculateRevenue();
    }
    
    calculateMovingAverages() {
        const now = new Date();
        const hourAgo = new Date(now - 3600000);
        const dayAgo = new Date(now - 86400000);
        const weekAgo = new Date(now - 604800000);
        
        const hourlyVisits = this.visitData.filter(v => v.timestamp > hourAgo).length;
        const dailyVisits = this.visitData.filter(v => v.timestamp > dayAgo).length;
        const weeklyVisits = this.visitData.filter(v => v.timestamp > weekAgo).length;
        
        const metrics = {
            timestamp: now,
            hourlyAverage: hourlyVisits,
            dailyAverage: dailyVisits / 24,
            weeklyAverage: weeklyVisits / 7 / 24,
            estimatedRevenue: this.revenueMetrics.estimatedRevenue,
            conversionRate: this.revenueMetrics.conversionRate
        };
        
        // Log metrics
        console.log('Analytics Update:', metrics);
        
        // Send to backend if available
        this.sendToBackend(metrics);
    }
    
    calculateRevenue() {
        const searches = this.revenueMetrics.searchQueries;
        const conversions = Math.floor(searches * this.CONVERSION_RATE);
        this.revenueMetrics.conversionRate = conversions / searches;
        this.revenueMetrics.estimatedRevenue = searches * this.REVENUE_PER_SEARCH;
    }
    
    getUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }
    
    persistData() {
        localStorage.setItem('analyticsData', JSON.stringify({
            visitData: this.visitData.slice(-1000), // Keep last 1000 visits
            revenueMetrics: this.revenueMetrics
        }));
    }
    
    async sendToBackend(metrics) {
        try {
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metrics)
            });
            
            if (!response.ok) {
                throw new Error('Failed to send analytics');
            }
        } catch (error) {
            console.error('Analytics Error:', error);
        }
    }
}

// Initialize analytics
const analytics = new RevenueAnalytics();

// Google Analytics Configuration
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX'); // Replace with your GA4 measurement ID

// Error Tracking
window.addEventListener('error', function(event) {
    // Send to Error Reporting
    const errorDetails = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
    };

    fetch('https://clouderrorreporting.googleapis.com/v1beta1/projects/test1-157723/events:report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            serviceContext: {
                service: 'cg4f-site',
                version: '1.0.0'
            },
            message: JSON.stringify(errorDetails)
        })
    }).catch(console.error);

    // Also track in Analytics
    gtag('event', 'error', {
        'event_category': 'Error',
        'event_label': event.message,
        'value': 1
    });
});

// Performance Monitoring
const performanceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        gtag('event', 'web_vitals', {
            'event_category': 'Web Vitals',
            'event_label': entry.name,
            'value': Math.round(entry.value),
            'non_interaction': true
        });
    }
});

performanceObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

// Custom Event Tracking
function trackEvent(category, action, label = null, value = null) {
    gtag('event', action, {
        'event_category': category,
        'event_label': label,
        'value': value
    });
}

// Page Load Time Tracking
window.addEventListener('load', () => {
    const pageLoadTime = performance.now();
    trackEvent('Performance', 'Page Load Time', window.location.pathname, Math.round(pageLoadTime));
});
