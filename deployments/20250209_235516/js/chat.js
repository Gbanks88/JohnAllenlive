// Modern chat functionality
document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const chatInput = document.getElementById('chat-input');
    const chatContent = document.querySelector('.chat-content');
    let isExpanded = false;

    // Toggle chat expansion
    chatContainer.addEventListener('click', (e) => {
        if (e.target.closest('.chat-input')) return;
        
        isExpanded = !isExpanded;
        chatContainer.classList.toggle('expanded');
        
        if (isExpanded) {
            chatInput.focus();
        }
    });

    // Handle chat input
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim()) {
            sendMessage(chatInput.value.trim());
            chatInput.value = '';
        }
    });

    // Send message to backend
    async function sendMessage(message) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            // Handle response from backend
            console.log('Response:', data);
            
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    // Close chat when clicking outside
    document.addEventListener('click', (e) => {
        if (!chatContainer.contains(e.target) && isExpanded) {
            isExpanded = false;
            chatContainer.classList.remove('expanded');
        }
    });

    // Prevent chat from closing when clicking inside
    chatContainer.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});
