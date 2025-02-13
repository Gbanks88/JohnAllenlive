// Dashboard Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadRecentActivity();
    setupQuickActions();
    loadInsights();
    setupNotifications();
});

// Initialize Dashboard
function initializeDashboard() {
    // Set up event listeners for dashboard widgets
    document.querySelectorAll('.widget').forEach(widget => {
        widget.addEventListener('click', function(e) {
            if (e.target.classList.contains('refresh-widget')) {
                refreshWidget(this.id);
            }
        });
    });
}

// Load Recent Activity
function loadRecentActivity() {
    const activityFeed = document.querySelector('.activity-feed');
    if (!activityFeed) return;

    // Sample activity data - replace with actual API calls
    const activities = [
        { type: 'trading', message: 'New stock analysis available', time: '2 mins ago' },
        { type: 'adexchange', message: 'Ad campaign performance updated', time: '15 mins ago' },
        { type: 'learning', message: 'Completed Python Advanced Course', time: '1 hour ago' },
        { type: 'housekeeping', message: 'Service scheduled for tomorrow', time: '2 hours ago' }
    ];

    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-content">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
                <span>${activity.message}</span>
                <small>${activity.time}</small>
            </div>
        `;
        activityFeed.appendChild(activityItem);
    });
}

// Set up Quick Actions
function setupQuickActions() {
    const actionsList = document.querySelector('.actions-list');
    if (!actionsList) return;

    const actions = [
        { name: 'New Trade', icon: 'chart-line', service: 'trading' },
        { name: 'Create Ad Campaign', icon: 'ad', service: 'adexchange' },
        { name: 'Schedule Cleaning', icon: 'home', service: 'housekeeping' },
        { name: 'Start Learning', icon: 'graduation-cap', service: 'learning' }
    ];

    actions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'action-button';
        button.innerHTML = `
            <i class="fas fa-${action.icon}"></i>
            <span>${action.name}</span>
        `;
        button.addEventListener('click', () => handleQuickAction(action.service));
        actionsList.appendChild(button);
    });
}

// Load Insights
function loadInsights() {
    const insightsContent = document.querySelector('.insights-content');
    if (!insightsContent) return;

    // Sample insights data - replace with actual API calls
    const insights = [
        { title: 'Trading Performance', value: '+15%', trend: 'up' },
        { title: 'Ad Revenue', value: '$12,450', trend: 'up' },
        { title: 'Learning Progress', value: '75%', trend: 'neutral' }
    ];

    insights.forEach(insight => {
        const insightCard = document.createElement('div');
        insightCard.className = 'insight-card';
        insightCard.innerHTML = `
            <h4>${insight.title}</h4>
            <div class="insight-value">
                <span>${insight.value}</span>
                <i class="fas fa-arrow-${insight.trend}"></i>
            </div>
        `;
        insightsContent.appendChild(insightCard);
    });
}

// Set up Notifications
function setupNotifications() {
    const notificationCount = document.querySelector('.notification-count');
    if (!notificationCount) return;

    // Sample notification count - replace with actual data
    let count = 3;
    notificationCount.textContent = count;

    // Toggle notifications panel
    document.querySelector('.notifications-toggle').addEventListener('click', () => {
        // Implementation for notifications panel
        console.log('Toggle notifications panel');
    });
}

// Helper Functions
function getActivityIcon(type) {
    const icons = {
        trading: 'chart-line',
        adexchange: 'ad',
        learning: 'graduation-cap',
        housekeeping: 'home'
    };
    return icons[type] || 'bell';
}

function handleQuickAction(service) {
    // Handle quick action clicks - replace with actual functionality
    const actions = {
        trading: () => window.location.href = 'stock-trading.html',
        adexchange: () => window.location.href = 'stream-ad-exchange.html',
        housekeeping: () => window.location.href = 'housekeeping.html',
        learning: () => window.location.href = 'learning-platform.html'
    };

    if (actions[service]) {
        actions[service]();
    }
}

function refreshWidget(widgetId) {
    // Refresh widget content - replace with actual API calls
    console.log(`Refreshing widget: ${widgetId}`);
    // Implement refresh logic for each widget type
}

// Theme Toggle
document.getElementById('themeToggle').addEventListener('click', function() {
    document.body.setAttribute('data-theme', 
        document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    );
});
