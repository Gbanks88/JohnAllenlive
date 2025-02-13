// Transition messages and animations for each page
const pageTransitions = {
    'index.html': {
        title: 'Welcome Back',
        message: 'Connecting you to global innovation...',
        animation: 'planet-pulse',
        icon: 'fa-globe'
    },
    'about.html': {
        title: 'About Our Mission',
        message: 'Discovering the future of global innovation...',
        animation: 'planet-pulse',
        icon: 'fa-info-circle'
    },
    'fair-innovation.html': {
        title: 'Fair Innovation Hub',
        message: 'Building bridges to fair technological advancement...',
        animation: 'light-speed',
        icon: 'fa-lightbulb'
    },
    'ai-tools.html': {
        title: 'AI Tools Platform',
        message: 'Initializing advanced AI systems...',
        animation: 'neural-network',
        icon: 'fa-robot'
    },
    'learn-ai.html': {
        title: 'AI Learning Center',
        message: 'Preparing your personalized AI learning journey...',
        animation: 'knowledge-transfer',
        icon: 'fa-graduation-cap'
    },
    'make-money.html': {
        title: 'Revenue Opportunities',
        message: 'Calculating your potential earnings...',
        animation: 'coin-spin',
        icon: 'fa-dollar-sign'
    },
    'patent.html': {
        title: 'Patent Platform',
        message: 'Securing your intellectual property...',
        animation: 'shield-form',
        icon: 'fa-certificate'
    },
    'apparel.html': {
        title: 'CG4F Apparel',
        message: 'Curating your innovative fashion collection...',
        animation: 'fabric-wave',
        icon: 'fa-tshirt',
        customMessages: [
            'Weaving innovation into fashion...',
            'Designing the future of apparel...',
            'Creating sustainable fashion solutions...'
        ]
    },
    'subscriptions.html': {
        title: 'Subscription Plans',
        message: 'Calculating optimal solutions for you...',
        animation: 'price-scale',
        icon: 'fa-tags'
    },
    'analytics.html': {
        title: 'Analytics Dashboard',
        message: 'Processing your data insights...',
        animation: 'neural-network',
        icon: 'fa-chart-line'
    }
};

// Get base URL for the site
const getBaseUrl = () => {
    const currentUrl = window.location.href;
    return currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
};

// Initialize transition
function initTransition() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetPage = urlParams.get('to') || 'index.html';
    const transition = pageTransitions[targetPage] || pageTransitions['index.html'];
    const baseUrl = getBaseUrl();

    // Set icon and initial animation
    const iconElement = document.getElementById('transition-icon');
    iconElement.className = `fas ${transition.icon} ${transition.animation}`;

    // Set title
    const titleElement = document.getElementById('transition-title');
    titleElement.textContent = transition.title;

    // Handle custom messages for apparel page
    if (targetPage === 'apparel.html' && transition.customMessages) {
        const messageElement = document.getElementById('transition-message');
        let messageIndex = 0;

        // Cycle through custom messages
        setInterval(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                messageElement.textContent = transition.customMessages[messageIndex];
                messageElement.style.opacity = '1';
                messageIndex = (messageIndex + 1) % transition.customMessages.length;
            }, 500);
        }, 3000);
    } else {
        // Set standard message
        const messageElement = document.getElementById('transition-message');
        messageElement.textContent = transition.message;
    }

    // Redirect after animation
    setTimeout(() => {
        window.location.href = baseUrl + targetPage;
    }, 3000);
}

// Add event listener for page load
document.addEventListener('DOMContentLoaded', initTransition);
