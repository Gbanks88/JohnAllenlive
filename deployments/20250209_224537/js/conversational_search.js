class ConversationalSearch {
    constructor() {
        this.conversationId = null;
        this.messageHistory = [];
        this.isProcessing = false;
        this.initializeUI();
        this.setupEventListeners();
    }

    initializeUI() {
        // Create search interface elements
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <div class="search-header">
                <div class="search-logo">
                    <img src="/images/logo.png" alt="CG4F Logo" />
                    <span class="logo-text">CG4F</span>
                </div>
                <div class="search-mode-toggle">
                    <button class="mode-btn active" data-mode="chat">
                        <i class="fas fa-comments"></i> Chat
                    </button>
                    <button class="mode-btn" data-mode="search">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
            </div>
            <div class="chat-container">
                <div class="chat-messages"></div>
                <div class="chat-input-container">
                    <textarea 
                        class="chat-input" 
                        placeholder="Ask me anything..."
                        rows="1"
                    ></textarea>
                    <div class="input-actions">
                        <button class="voice-btn">
                            <i class="fas fa-microphone"></i>
                        </button>
                        <button class="send-btn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="search-sidebar">
                <div class="sidebar-section">
                    <h3>Suggested Queries</h3>
                    <div class="suggested-queries"></div>
                </div>
                <div class="sidebar-section">
                    <h3>Related Topics</h3>
                    <div class="related-topics"></div>
                </div>
                <div class="sidebar-section">
                    <h3>Sources</h3>
                    <div class="search-sources"></div>
                </div>
            </div>
        `;
        document.body.appendChild(searchContainer);

        // Initialize components
        this.chatMessages = document.querySelector('.chat-messages');
        this.chatInput = document.querySelector('.chat-input');
        this.sendButton = document.querySelector('.send-btn');
        this.voiceButton = document.querySelector('.voice-btn');
        this.suggestedQueries = document.querySelector('.suggested-queries');
        this.relatedTopics = document.querySelector('.related-topics');
        this.searchSources = document.querySelector('.search-sources');
    }

    setupEventListeners() {
        // Send message on button click or Enter key
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.chatInput.addEventListener('input', () => {
            this.chatInput.style.height = 'auto';
            this.chatInput.style.height = this.chatInput.scrollHeight + 'px';
        });

        // Voice input
        this.voiceButton.addEventListener('click', () => this.toggleVoiceInput());

        // Mode toggle
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleSearchMode(btn));
        });
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isProcessing) return;

        this.isProcessing = true;
        this.addMessage('user', message);
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';

        try {
            const response = await this.performSearch(message);
            this.addMessage('assistant', response.answer);
            this.updateSidebar(response);
        } catch (error) {
            console.error('Search error:', error);
            this.addMessage('error', 'Sorry, something went wrong. Please try again.');
        }

        this.isProcessing = false;
    }

    async performSearch(query) {
        const response = await fetch('/api/conversational-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                query,
                conversation_id: this.conversationId,
                context: {
                    previous_messages: this.messageHistory
                }
            })
        });

        if (!response.ok) {
            throw new Error('Search request failed');
        }

        const data = await response.json();
        if (!this.conversationId) {
            this.conversationId = data.conversation_id;
        }

        return data;
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        if (type === 'assistant') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <img src="/images/assistant-avatar.png" alt="AI Assistant" />
                </div>
                <div class="message-content">
                    ${this.formatMessage(content)}
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${this.formatMessage(content)}
                </div>
            `;
        }

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        // Add to message history
        this.messageHistory.push({
            role: type,
            content: content
        });
    }

    formatMessage(content) {
        // Convert URLs to links
        content = content.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank">$1</a>'
        );

        // Convert code blocks
        content = content.replace(
            /`([^`]+)`/g,
            '<code>$1</code>'
        );

        return content;
    }

    updateSidebar(response) {
        // Update suggested queries
        this.suggestedQueries.innerHTML = response.suggested_queries
            .map(query => `
                <div class="suggestion" onclick="search('${query}')">
                    <i class="fas fa-search"></i>
                    <span>${query}</span>
                </div>
            `)
            .join('');

        // Update related topics
        this.relatedTopics.innerHTML = response.related_topics
            .map(topic => `
                <div class="topic">
                    <i class="fas fa-hashtag"></i>
                    <span>${topic}</span>
                </div>
            `)
            .join('');

        // Update sources
        this.searchSources.innerHTML = response.sources
            .map(source => `
                <div class="source">
                    <a href="${source.url}" target="_blank">
                        <h4>${source.title}</h4>
                        <p>${source.snippet}...</p>
                    </a>
                </div>
            `)
            .join('');
    }

    toggleSearchMode(button) {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        const mode = button.dataset.mode;
        document.body.setAttribute('data-search-mode', mode);
    }

    toggleVoiceInput() {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser');
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            this.voiceButton.classList.add('recording');
            this.chatInput.placeholder = 'Listening...';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.chatInput.value = transcript;
        };

        recognition.onend = () => {
            this.voiceButton.classList.remove('recording');
            this.chatInput.placeholder = 'Ask me anything...';
        };

        recognition.start();
    }
}

// Initialize search interface
document.addEventListener('DOMContentLoaded', () => {
    window.searchInterface = new ConversationalSearch();
});
