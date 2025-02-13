class AIOpportunities {
    constructor() {
        this.opportunities = [
            {
                id: 'develop',
                title: 'Develop AI Solutions',
                icon: 'fa-code',
                opportunities: [
                    {
                        title: 'Software Development',
                        description: 'Create AI-powered applications, tools, or platforms that solve specific problems or improve efficiency in various industries.',
                        examples: ['Custom AI Applications', 'Machine Learning Models', 'AI Integration Services']
                    },
                    {
                        title: 'Consulting Services',
                        description: 'Offer AI consulting to help businesses implement AI solutions, optimize their operations, and stay competitive.',
                        examples: ['Implementation Strategy', 'Process Optimization', 'AI Training']
                    }
                ]
            },
            {
                id: 'invest',
                title: 'Invest in AI Stocks',
                icon: 'fa-chart-line',
                opportunities: [
                    {
                        title: 'Tech Companies',
                        description: 'Invest in established tech companies heavily involved in AI research and development.',
                        examples: ['NVIDIA', 'Microsoft', 'Alphabet (Google)', 'Amazon']
                    },
                    {
                        title: 'AI Startups',
                        description: 'Look for promising AI startups with innovative technologies and strong growth potential.',
                        examples: ['Emerging AI Companies', 'AI Infrastructure Startups', 'Industry-Specific AI Solutions']
                    }
                ]
            },
            {
                id: 'ecommerce',
                title: 'AI in E-commerce',
                icon: 'fa-shopping-cart',
                opportunities: [
                    {
                        title: 'Personalized Recommendations',
                        description: 'Use AI to provide personalized product recommendations to customers.',
                        examples: ['Product Recommendation Engines', 'Customer Behavior Analysis', 'Dynamic Pricing']
                    },
                    {
                        title: 'Customer Support',
                        description: 'Implement AI chatbots to handle customer inquiries.',
                        examples: ['AI Chatbots', '24/7 Support Automation', 'Multi-language Support']
                    }
                ]
            },
            {
                id: 'healthcare',
                title: 'AI in Healthcare',
                icon: 'fa-heartbeat',
                opportunities: [
                    {
                        title: 'Medical Diagnostics',
                        description: 'Develop AI tools for diagnosing diseases and analyzing medical images.',
                        examples: ['Image Analysis', 'Disease Prediction', 'Patient Monitoring']
                    },
                    {
                        title: 'Healthcare Management',
                        description: 'Use AI to optimize hospital operations and manage patient records.',
                        examples: ['Resource Optimization', 'Patient Record Management', 'Treatment Planning']
                    }
                ]
            },
            {
                id: 'finance',
                title: 'AI in Finance',
                icon: 'fa-money-bill-wave',
                opportunities: [
                    {
                        title: 'Fraud Detection',
                        description: 'Implement AI algorithms to detect and prevent fraudulent transactions.',
                        examples: ['Real-time Fraud Detection', 'Risk Assessment', 'Compliance Monitoring']
                    },
                    {
                        title: 'Investment Strategies',
                        description: 'Use AI to analyze market trends and develop data-driven investment strategies.',
                        examples: ['Market Analysis', 'Portfolio Optimization', 'Trading Algorithms']
                    }
                ]
            }
        ];

        // Initialize state
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {
            animations: true,
            highContrast: false,
            fontSize: 'medium'
        };

        this.initializeUI();
        this.setupEventListeners();
        this.applyUserPreferences();
    }

    initializeUI() {
        const container = document.createElement('div');
        container.className = 'ai-opportunities-container';
        container.innerHTML = `
            <div class="opportunities-header">
                <h1>Make Money with AI</h1>
                <p>Explore various opportunities to generate revenue using artificial intelligence</p>
                <div class="user-preferences">
                    <button class="theme-toggle" aria-label="Toggle dark mode">
                        <i class="fas fa-moon"></i>
                    </button>
                    <button class="high-contrast-toggle" aria-label="Toggle high contrast">
                        <i class="fas fa-adjust"></i>
                    </button>
                    <div class="font-size-controls">
                        <button class="font-size-decrease" aria-label="Decrease font size">A-</button>
                        <button class="font-size-increase" aria-label="Increase font size">A+</button>
                    </div>
                </div>
            </div>
            <div class="opportunities-grid" role="list"></div>
            <div class="opportunity-details" role="dialog" aria-modal="true"></div>
            <div class="contextual-help">
                <button class="help-toggle" aria-label="Toggle help">
                    <i class="fas fa-question-circle"></i>
                </button>
                <div class="help-content">
                    <h3>Quick Tips</h3>
                    <ul>
                        <li>Click any card to see detailed information</li>
                        <li>Use the theme toggle for dark mode</li>
                        <li>Adjust text size for better readability</li>
                        <li>Enable high contrast for better visibility</li>
                    </ul>
                </div>
            </div>
        `;
        document.getElementById('app').appendChild(container);
        
        this.renderOpportunities();
    }

    renderOpportunities() {
        const grid = document.querySelector('.opportunities-grid');
        grid.innerHTML = this.opportunities.map(opp => `
            <div class="opportunity-card" 
                 data-id="${opp.id}"
                 role="listitem"
                 tabindex="0"
                 aria-label="${opp.title}">
                <div class="opportunity-icon">
                    <i class="fas ${opp.icon}" aria-hidden="true"></i>
                </div>
                <h3>${opp.title}</h3>
                <div class="opportunity-preview">
                    ${opp.opportunities.map(sub => `
                        <div class="sub-opportunity">
                            <h4>${sub.title}</h4>
                        </div>
                    `).join('')}
                </div>
                <button class="learn-more-btn" aria-label="Learn more about ${opp.title}">
                    Learn More
                </button>
            </div>
        `).join('');
    }

    showOpportunityDetails(id) {
        const opportunity = this.opportunities.find(opp => opp.id === id);
        const details = document.querySelector('.opportunity-details');
        
        details.innerHTML = `
            <div class="details-modal" role="document">
                <div class="details-content">
                    <button class="close-details" aria-label="Close details">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                    <div class="details-header">
                        <i class="fas ${opportunity.icon}" aria-hidden="true"></i>
                        <h2>${opportunity.title}</h2>
                    </div>
                    <div class="details-body">
                        ${opportunity.opportunities.map(sub => `
                            <div class="sub-opportunity-detail">
                                <h3>${sub.title}</h3>
                                <p>${sub.description}</p>
                                <div class="examples">
                                    <h4>Examples:</h4>
                                    <ul>
                                        ${sub.examples.map(ex => `<li>${ex}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="details-footer">
                        <button class="action-btn primary" aria-label="Get started with ${opportunity.title}">
                            Get Started
                        </button>
                        <button class="action-btn secondary" aria-label="Learn more about ${opportunity.title}">
                            Learn More
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        details.classList.add('active');
        details.style.display = 'flex';
        
        // Trap focus within modal
        this.trapFocus(details);
    }

    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        });

        firstFocusable.focus();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.learn-more-btn') || e.target.closest('.opportunity-card')) {
                const card = e.target.closest('.opportunity-card');
                this.showOpportunityDetails(card.dataset.id);
            }
            
            if (e.target.closest('.close-details')) {
                const details = document.querySelector('.opportunity-details');
                details.classList.remove('active');
                setTimeout(() => {
                    details.style.display = 'none';
                }, 300);
            }
            
            if (e.target.closest('.theme-toggle')) {
                this.toggleTheme();
            }

            if (e.target.closest('.high-contrast-toggle')) {
                this.toggleHighContrast();
            }

            if (e.target.closest('.font-size-increase')) {
                this.adjustFontSize('increase');
            }

            if (e.target.closest('.font-size-decrease')) {
                this.adjustFontSize('decrease');
            }

            if (e.target.closest('.help-toggle')) {
                this.toggleHelp();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const details = document.querySelector('.opportunity-details');
                if (details.classList.contains('active')) {
                    details.classList.remove('active');
                    setTimeout(() => {
                        details.style.display = 'none';
                    }, 300);
                }
            }
        });

        // Reduced motion preference
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
            this.updateReducedMotion();
        });
    }

    toggleTheme() {
        const theme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
    }

    toggleHighContrast() {
        this.userPreferences.highContrast = !this.userPreferences.highContrast;
        document.documentElement.setAttribute('data-theme', 
            this.userPreferences.highContrast ? 'high-contrast' : this.currentTheme
        );
        this.saveUserPreferences();
    }

    adjustFontSize(action) {
        const sizes = ['small', 'medium', 'large'];
        let currentIndex = sizes.indexOf(this.userPreferences.fontSize);
        
        if (action === 'increase' && currentIndex < sizes.length - 1) {
            currentIndex++;
        } else if (action === 'decrease' && currentIndex > 0) {
            currentIndex--;
        }
        
        this.userPreferences.fontSize = sizes[currentIndex];
        document.documentElement.style.fontSize = {
            small: '14px',
            medium: '16px',
            large: '18px'
        }[this.userPreferences.fontSize];
        
        this.saveUserPreferences();
    }

    toggleHelp() {
        const helpContent = document.querySelector('.help-content');
        helpContent.classList.toggle('active');
    }

    updateReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.documentElement.classList.toggle('reduced-motion', prefersReducedMotion);
    }

    applyUserPreferences() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', 
            this.userPreferences.highContrast ? 'high-contrast' : this.currentTheme
        );

        // Apply font size
        document.documentElement.style.fontSize = {
            small: '14px',
            medium: '16px',
            large: '18px'
        }[this.userPreferences.fontSize];

        // Check reduced motion preference
        this.updateReducedMotion();
    }

    saveUserPreferences() {
        localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aiOpportunities = new AIOpportunities();
});
