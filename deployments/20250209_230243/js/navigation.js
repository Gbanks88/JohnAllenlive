document.addEventListener('DOMContentLoaded', function() {
    // Navigation HTML template
    const navHTML = `
        <nav class="horizontal-nav">
            <div class="nav-group">
                <div class="logo-section">
                    <span class="nav-title">AI Opportunities Explorer</span>
                    <div class="glow-line"></div>
                </div>
                <div class="nav-items">
                    <a href="/" class="nav-item">
                        <i class="fas fa-search"></i>
                        <span>Search</span>
                    </a>
                    <a href="/learn-ai.html" class="nav-item">
                        <i class="fas fa-graduation-cap"></i>
                        <span>Learn AI</span>
                    </a>
                    <a href="/ai-tools.html" class="nav-item">
                        <i class="fas fa-tools"></i>
                        <span>AI Tools</span>
                    </a>
                    <a href="/about.html" class="nav-item">
                        <i class="fas fa-info-circle"></i>
                        <span>About CG4F</span>
                    </a>
                    <a href="/apparel.html" class="nav-item">
                        <i class="fas fa-tshirt"></i>
                        <span>Apparel</span>
                    </a>
                    <a href="/patent.html" class="nav-item">
                        <i class="fas fa-file-contract"></i>
                        <span>Patent</span>
                    </a>
                    <button class="nav-item signup-btn">
                        <i class="fas fa-user-plus"></i>
                        <span>Sign Up</span>
                    </button>
                </div>
            </div>
        </nav>
    `;

    // Insert navigation into header
    document.querySelector('.main-header').innerHTML = navHTML;

    // Set active nav item based on current page
    const currentPage = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        if (item.getAttribute('href') === currentPage) {
            item.classList.add('active');
        }
    });

    // Add signup button click handler
    const signupBtn = document.querySelector('.signup-btn');
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            const authModal = document.getElementById('authModal');
            if (authModal) {
                authModal.style.display = 'block';
            }
        });
    }
});
