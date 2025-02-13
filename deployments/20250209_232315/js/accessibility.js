class AccessibilityManager {
    constructor() {
        this.shortcuts = new Map();
        this.focusTrap = null;
        this.settings = {
            highContrast: false,
            largeText: false,
            screenReader: false,
            reducedMotion: false,
            keyboardMode: false
        };
        
        this.initializeKeyboardNavigation();
        this.initializeAccessibilityFeatures();
    }

    initializeKeyboardNavigation() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.addEventListener('mousedown', () => this.setKeyboardMode(false));
        document.addEventListener('keyup', () => this.setKeyboardMode(true));
    }

    initializeAccessibilityFeatures() {
        // Add skip links
        this.addSkipLink('main', 'Skip to main content');
        this.addSkipLink('nav', 'Skip to navigation');
        
        // Initialize focus trap for modals
        this.initializeFocusTrap();
        
        // Add ARIA landmarks
        this.addAriaLandmarks();
        
        // Initialize announcer for live regions
        this.initializeAnnouncer();
    }

    addSkipLink(targetId, text) {
        const skipLink = document.createElement('a');
        skipLink.href = `#${targetId}`;
        skipLink.className = 'skip-link';
        skipLink.textContent = text;
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    initializeFocusTrap() {
        this.focusTrap = {
            element: null,
            firstFocusable: null,
            lastFocusable: null
        };
    }

    setFocusTrap(element) {
        this.focusTrap.element = element;
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        this.focusTrap.firstFocusable = focusableElements[0];
        this.focusTrap.lastFocusable = focusableElements[focusableElements.length - 1];
    }

    handleFocusTrap(e) {
        if (!this.focusTrap.element) return;

        const isTabPressed = e.key === 'Tab';
        if (!isTabPressed) return;

        if (e.shiftKey) {
            if (document.activeElement === this.focusTrap.firstFocusable) {
                e.preventDefault();
                this.focusTrap.lastFocusable.focus();
            }
        } else {
            if (document.activeElement === this.focusTrap.lastFocusable) {
                e.preventDefault();
                this.focusTrap.firstFocusable.focus();
            }
        }
    }

    addAriaLandmarks() {
        const landmarks = {
            header: 'banner',
            nav: 'navigation',
            main: 'main',
            footer: 'contentinfo',
            search: 'search'
        };

        Object.entries(landmarks).forEach(([selector, role]) => {
            const element = document.querySelector(selector);
            if (element) element.setAttribute('role', role);
        });
    }

    initializeAnnouncer() {
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        document.body.appendChild(announcer);
        this.announcer = announcer;
    }

    announce(message, priority = 'polite') {
        this.announcer.setAttribute('aria-live', priority);
        this.announcer.textContent = message;
        setTimeout(() => {
            this.announcer.textContent = '';
        }, 1000);
    }

    registerShortcut(key, description, callback) {
        this.shortcuts.set(key, { description, callback });
    }

    handleKeyPress(e) {
        // Handle focus trap
        this.handleFocusTrap(e);

        // Handle registered shortcuts
        const shortcut = this.shortcuts.get(e.key);
        if (shortcut && e.ctrlKey) {
            e.preventDefault();
            shortcut.callback();
        }

        // Handle navigation keys
        switch(e.key) {
            case 'ArrowRight':
                this.navigateCards('next');
                break;
            case 'ArrowLeft':
                this.navigateCards('prev');
                break;
            case 'Enter':
                this.activateFocusedElement();
                break;
            case 'Escape':
                this.handleEscape();
                break;
        }
    }

    navigateCards(direction) {
        const cards = Array.from(document.querySelectorAll('.opportunity-card'));
        const currentIndex = cards.findIndex(card => card === document.activeElement);
        let nextIndex;

        if (direction === 'next') {
            nextIndex = currentIndex + 1 >= cards.length ? 0 : currentIndex + 1;
        } else {
            nextIndex = currentIndex - 1 < 0 ? cards.length - 1 : currentIndex - 1;
        }

        cards[nextIndex].focus();
    }

    activateFocusedElement() {
        const element = document.activeElement;
        if (element.classList.contains('opportunity-card')) {
            element.querySelector('.learn-more-btn').click();
        }
    }

    handleEscape() {
        const modal = document.querySelector('.modal.active');
        if (modal) {
            modal.querySelector('.close-btn').click();
        }
    }

    setKeyboardMode(enabled) {
        this.settings.keyboardMode = enabled;
        document.body.classList.toggle('keyboard-mode', enabled);
    }

    toggleHighContrast() {
        this.settings.highContrast = !this.settings.highContrast;
        document.body.classList.toggle('high-contrast', this.settings.highContrast);
        this.announce('High contrast mode ' + (this.settings.highContrast ? 'enabled' : 'disabled'));
    }

    toggleLargeText() {
        this.settings.largeText = !this.settings.largeText;
        document.body.classList.toggle('large-text', this.settings.largeText);
        this.announce('Large text mode ' + (this.settings.largeText ? 'enabled' : 'disabled'));
    }

    toggleReducedMotion() {
        this.settings.reducedMotion = !this.settings.reducedMotion;
        document.body.classList.toggle('reduced-motion', this.settings.reducedMotion);
        this.announce('Reduced motion mode ' + (this.settings.reducedMotion ? 'enabled' : 'disabled'));
    }

    enableScreenReader() {
        this.settings.screenReader = true;
        document.body.classList.add('screen-reader-mode');
        this.announce('Screen reader optimizations enabled');
    }

    getShortcutsList() {
        return Array.from(this.shortcuts.entries()).map(([key, { description }]) => ({
            key,
            description
        }));
    }
}
