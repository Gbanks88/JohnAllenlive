// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Live countdown timer for special offer
function updateCountdown() {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    const timeLeft = endDate - now;
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    document.getElementById('countdown').innerHTML = 
        `${hours}h ${minutes}m ${seconds}s`;
}

// Form validation
function validateForm(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    if (!name || !email || !message) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Simulate form submission
    showNotification('Message sent successfully!', 'success');
    document.getElementById('contactForm').reset();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Notification system
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Dark mode functionality
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true' || (savedDarkMode === null && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    darkModeToggle.addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', this.checked);
    });
}

// Live chat functionality
function initLiveChat() {
    const chatWidget = document.querySelector('.chat-widget');
    const chatToggle = document.querySelector('.chat-toggle');
    const chatClose = document.querySelector('.chat-close');
    const chatInput = document.querySelector('.chat-input');
    const chatMessages = document.querySelector('.chat-messages');
    
    let isMinimized = true;
    
    const toggleChat = () => {
        chatWidget.classList.toggle('chat-minimized');
        isMinimized = !isMinimized;
        if (!isMinimized) {
            chatInput.focus();
        }
    };
    
    chatToggle.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', () => {
        chatWidget.classList.add('chat-hidden');
    });
    
    const addMessage = (message, isUser = false) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim()) {
            const message = chatInput.value.trim();
            addMessage(message, true);
            chatInput.value = '';
            
            // Simulate bot response
            setTimeout(() => {
                addMessage('Thank you for your message. Our team will get back to you shortly.');
            }, 1000);
        }
    });
    
    // Add initial bot message
    setTimeout(() => {
        addMessage('Hello! How can I help you today?');
    }, 1000);
}

// Price ticker animation
function initPriceTicker() {
    const ticker = document.querySelector('.price-ticker');
    if (!ticker) return;
    
    const currencies = [
        { symbol: 'BTC', price: 45000 },
        { symbol: 'ETH', price: 2800 },
        { symbol: 'DOW', price: 35000 },
        { symbol: 'NASDAQ', price: 15000 }
    ];
    
    setInterval(() => {
        currencies.forEach(currency => {
            // Simulate price changes
            currency.price *= (1 + (Math.random() - 0.5) * 0.002);
            const change = Math.random() > 0.5 ? '↑' : '↓';
            const color = change === '↑' ? '#2ecc71' : '#e74c3c';
            
            const item = ticker.querySelector(`[data-symbol="${currency.symbol}"]`);
            if (item) {
                item.innerHTML = `${currency.symbol}: $${currency.price.toFixed(2)} <span style="color: ${color}">${change}</span>`;
            }
        });
    }, 2000);
}

// Trading chart animation
function initChart() {
    const ctx = document.getElementById('tradingChart');
    if (!ctx) return;

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(168, 230, 207, 0.4)');
    gradient.addColorStop(1, 'rgba(168, 230, 207, 0)');

    const points = [];
    let value = 50;
    for (let i = 0; i < 100; i++) {
        value += Math.random() * 4 - 2;
        value = Math.max(0, Math.min(100, value));
        points.push(value);
    }

    const data = {
        labels: Array(100).fill(''),
        datasets: [{
            label: 'Trading Activity',
            data: points,
            borderColor: '#0B4D3C',
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    };

    new Chart(ctx, config);
}

// Search functionality
const searchBox = document.querySelector('.search-box');
const suggestionsContainer = document.querySelector('.suggestions');
const searchResults = document.querySelector('.search-results');
const searchStats = document.querySelector('.search-stats');
const pagination = document.querySelector('.pagination');

let currentPage = 1;
let totalPages = 1;

async function performSearch(query, page = 1) {
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}`);
        const data = await response.json();
        
        // Update results
        searchResults.innerHTML = data.results.map(result => `
            <div class="result-item">
                <a href="${result.url}" class="result-title">${result.title}</a>
                <div class="result-url">${result.url}</div>
                <div class="result-snippet">${result.snippet}</div>
            </div>
        `).join('');
        
        // Update stats
        searchStats.textContent = `About ${data.total_results} results (${data.query_time_ms.toFixed(2)} milliseconds)`;
        
        // Update pagination
        currentPage = data.page;
        totalPages = data.total_pages;
        updatePagination();
        
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="error">An error occurred while searching. Please try again.</div>';
    }
}

async function getSuggestions(query) {
    try {
        const response = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.suggestions.length > 0) {
            suggestionsContainer.innerHTML = data.suggestions.map(suggestion => `
                <div class="suggestion-item">${suggestion}</div>
            `).join('');
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    } catch (error) {
        console.error('Suggestion error:', error);
        suggestionsContainer.style.display = 'none';
    }
}

function updatePagination() {
    const maxButtons = 5;
    let buttons = [];
    
    // Previous button
    if (currentPage > 1) {
        buttons.push(`<button onclick="performSearch(searchBox.value, ${currentPage - 1})">Previous</button>`);
    }
    
    // Page buttons
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        buttons.push(`
            <button 
                ${i === currentPage ? 'disabled' : ''} 
                onclick="performSearch(searchBox.value, ${i})"
                style="${i === currentPage ? 'background: #f8f9fa;' : ''}"
            >${i}</button>
        `);
    }
    
    // Next button
    if (currentPage < totalPages) {
        buttons.push(`<button onclick="performSearch(searchBox.value, ${currentPage + 1})">Next</button>`);
    }
    
    pagination.innerHTML = buttons.join('');
}

// Event listeners
let searchTimeout;
searchBox.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length > 0) {
        searchTimeout = setTimeout(() => {
            getSuggestions(query);
        }, 300);
    } else {
        suggestionsContainer.style.display = 'none';
    }
});

searchBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query.length > 0) {
            suggestionsContainer.style.display = 'none';
            performSearch(query);
        }
    }
});

suggestionsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('suggestion-item')) {
        searchBox.value = e.target.textContent;
        suggestionsContainer.style.display = 'none';
        performSearch(searchBox.value);
    }
});

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box-container')) {
        suggestionsContainer.style.display = 'none';
    }
});

// Initialize all features
window.addEventListener('load', () => {
    initDarkMode();
    initLiveChat();
    initPriceTicker();
    initChart();
    
    if (document.getElementById('countdown')) {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
    
    if (document.getElementById('contactForm')) {
        document.getElementById('contactForm').addEventListener('submit', validateForm);
    }
});

// Initialize Web Speech API
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;
recognition.lang = 'en-US';

// DOM Elements
const searchTypeButtons = document.querySelectorAll('.search-type-btn');
const voiceSearchBtn = document.getElementById('voiceSearch');
const imageSearchBtn = document.getElementById('imageSearch');
const filterToggleBtn = document.getElementById('filterToggle');
const filtersPanel = document.querySelector('.filters-panel');
const darkModeBtn = document.getElementById('darkMode');
const communityToggleBtn = document.getElementById('communityToggle');
const arModeBtn = document.getElementById('arMode');
const communityPanel = document.querySelector('.community-panel');

// State management
let currentSearchType = 'web';
let isListening = false;
let userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {
    darkMode: false,
    searchHistory: [],
    achievements: [],
    dailyProgress: 0
};

// Initialize features
function initializeApp() {
    loadUserPreferences();
    setupEventListeners();
    initializeAR();
    startDailyChallenge();
}

// User Preferences
function loadUserPreferences() {
    if (userPreferences.darkMode) {
        document.body.classList.add('dark-mode');
        darkModeBtn.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }
}

function saveUserPreferences() {
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
}

// Event Listeners
function setupEventListeners() {
    // Search type buttons
    searchTypeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            searchTypeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSearchType = btn.dataset.type;
            updateSearchPlaceholder();
        });
    });

    // Voice search
    voiceSearchBtn.addEventListener('click', toggleVoiceSearch);
    recognition.onresult = handleVoiceSearchResult;
    recognition.onend = () => {
        isListening = false;
        voiceSearchBtn.querySelector('i').style.color = '';
    };

    // Image search
    imageSearchBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = handleImageSearch;
        input.click();
    });

    // Filters
    filterToggleBtn.addEventListener('click', () => {
        filtersPanel.style.display = filtersPanel.style.display === 'none' ? 'block' : 'none';
    });

    // Dark mode
    darkModeBtn.addEventListener('click', toggleDarkMode);

    // Community panel
    communityToggleBtn.addEventListener('click', toggleCommunityPanel);

    // AR mode
    arModeBtn.addEventListener('click', toggleAR);

    // Search input
    let searchTimeout;
    searchBox.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length > 0) {
            searchTimeout = setTimeout(() => {
                getSuggestions(query);
            }, 300);
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });

    searchBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query.length > 0) {
                suggestionsContainer.style.display = 'none';
                performSearch(query);
                updateDailyProgress();
            }
        }
    });
}

// Search Functions
async function performSearch(query, page = 1) {
    try {
        const searchParams = new URLSearchParams({
            q: query,
            page: page,
            type: currentSearchType,
            ...getActiveFilters()
        });

        const response = await fetch(`/api/search?${searchParams}`);
        const data = await response.json();
        
        displayResults(data);
        updateSearchStats(data);
        updatePagination(data);
        
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="error">An error occurred while searching. Please try again.</div>';
    }
}

function displayResults(data) {
    searchResults.innerHTML = data.results.map(result => `
        <div class="result-item" data-type="${result.type}">
            ${getResultContent(result)}
            <div class="result-meta">
                <span><i class="fas fa-clock"></i> ${formatDate(result.timestamp)}</span>
                <span><i class="fas fa-eye"></i> ${result.views || 0} views</span>
                ${result.rating ? `<span><i class="fas fa-star"></i> ${result.rating}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function getResultContent(result) {
    switch (result.type) {
        case 'image':
            return `
                <img src="${result.url}" alt="${result.title}" class="result-image">
                <div class="result-title">${result.title}</div>
            `;
        case 'video':
            return `
                <div class="video-preview" style="background-image: url(${result.thumbnail})">
                    <i class="fas fa-play"></i>
                </div>
                <div class="result-title">${result.title}</div>
            `;
        default:
            return `
                <a href="${result.url}" class="result-title">${result.title}</a>
                <div class="result-url">${result.url}</div>
                <div class="result-snippet">${result.snippet}</div>
            `;
    }
}

// Voice Search
function toggleVoiceSearch() {
    if (!isListening) {
        recognition.start();
        isListening = true;
        voiceSearchBtn.querySelector('i').style.color = 'var(--accent-color)';
    } else {
        recognition.stop();
        isListening = false;
        voiceSearchBtn.querySelector('i').style.color = '';
    }
}

function handleVoiceSearchResult(event) {
    const transcript = event.results[0][0].transcript;
    searchBox.value = transcript;
    performSearch(transcript);
}

// Image Search
async function handleImageSearch(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/image-search', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        displayResults(data);
    } catch (error) {
        console.error('Image search error:', error);
    }
}

// AR Features
function initializeAR() {
    if (!window.XRSession) {
        arModeBtn.style.display = 'none';
        return;
    }
    // Initialize AR features when supported
}

function toggleAR() {
    // Implement AR toggle functionality
}

// Community Features
function toggleCommunityPanel() {
    communityPanel.classList.toggle('active');
}

function startDailyChallenge() {
    const today = new Date().toDateString();
    const lastChallenge = localStorage.getItem('lastChallenge');
    
    if (lastChallenge !== today) {
        userPreferences.dailyProgress = 0;
        localStorage.setItem('lastChallenge', today);
        saveUserPreferences();
    }
    
    updateDailyProgress();
}

function updateDailyProgress() {
    userPreferences.dailyProgress++;
    if (userPreferences.dailyProgress === 5) {
        awardAchievement('Daily Champion');
    }
    saveUserPreferences();
    updateProgressUI();
}

function awardAchievement(achievement) {
    if (!userPreferences.achievements.includes(achievement)) {
        userPreferences.achievements.push(achievement);
        saveUserPreferences();
        showNotification(`Achievement Unlocked: ${achievement}!`);
    }
}

// UI Updates
function updateSearchPlaceholder() {
    const placeholders = {
        web: 'Search anything...',
        image: 'Search for images...',
        video: 'Search for videos...'
    };
    searchBox.placeholder = placeholders[currentSearchType] || placeholders.web;
}

function updateProgressUI() {
    const progressElement = document.querySelector('.progress');
    if (progressElement) {
        progressElement.textContent = `${userPreferences.dailyProgress}/5 completed`;
    }
}

function showNotification(message) {
    // Implement notification system
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function getActiveFilters() {
    const filters = {};
    // Collect active filters from the filters panel
    return filters;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', initializeApp);
