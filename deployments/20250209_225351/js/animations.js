class AnimationManager {
    constructor() {
        this.animationsEnabled = true;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.observers = new Map();
        this.initializeObservers();
    }

    initializeObservers() {
        // Scroll animations
        this.observers.set('scroll', new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateElement(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        ));

        // Lazy loading
        this.observers.set('lazy', new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyContent(entry.target);
                    }
                });
            },
            { rootMargin: '50px' }
        ));
    }

    animateElement(element) {
        if (!this.animationsEnabled || this.reducedMotion) return;

        const animation = element.dataset.animation || 'fadeIn';
        const duration = element.dataset.duration || '0.5s';
        const delay = element.dataset.delay || '0s';
        const easing = element.dataset.easing || 'ease-out';

        element.style.animation = `${animation} ${duration} ${easing} ${delay} forwards`;
    }

    loadLazyContent(element) {
        if (element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-src');
        }
    }

    addScrollAnimation(element, options = {}) {
        element.dataset.animation = options.animation || 'fadeIn';
        element.dataset.duration = options.duration || '0.5s';
        element.dataset.delay = options.delay || '0s';
        element.dataset.easing = options.easing || 'ease-out';
        this.observers.get('scroll').observe(element);
    }

    addParallax(element, speed = 0.5) {
        if (this.reducedMotion) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const position = scrolled * speed;
            element.style.transform = `translateY(${position}px)`;
        });
    }

    addHoverEffect(element, effect = 'scale') {
        if (this.reducedMotion) return;

        const effects = {
            scale: { transform: 'scale(1.05)' },
            lift: { transform: 'translateY(-5px)' },
            glow: { boxShadow: '0 0 20px rgba(0,0,0,0.2)' }
        };

        element.addEventListener('mouseenter', () => {
            Object.assign(element.style, effects[effect]);
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = '';
            element.style.boxShadow = '';
        });
    }

    addLoadingState(element, type = 'spinner') {
        const loadingStates = {
            spinner: '<div class="loading-spinner"></div>',
            pulse: '<div class="loading-pulse"></div>',
            dots: '<div class="loading-dots"><div></div><div></div><div></div></div>'
        };

        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-container';
        loadingElement.innerHTML = loadingStates[type];
        element.appendChild(loadingElement);

        return {
            start: () => loadingElement.style.display = 'flex',
            stop: () => loadingElement.style.display = 'none'
        };
    }

    addProgressBar(element, options = {}) {
        const progress = document.createElement('div');
        progress.className = 'progress-bar';
        if (options.color) progress.style.backgroundColor = options.color;
        element.appendChild(progress);

        return {
            update: (percentage) => {
                progress.style.width = `${percentage}%`;
            }
        };
    }

    addGestureControl(element, handlers = {}) {
        let touchStartX = 0;
        let touchStartY = 0;

        element.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        element.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 50 && handlers.swipeRight) handlers.swipeRight();
                if (deltaX < -50 && handlers.swipeLeft) handlers.swipeLeft();
            } else {
                if (deltaY > 50 && handlers.swipeDown) handlers.swipeDown();
                if (deltaY < -50 && handlers.swipeUp) handlers.swipeUp();
            }
        });
    }

    setReducedMotion(enabled) {
        this.reducedMotion = enabled;
        document.body.style.setProperty('--reduced-motion', enabled ? 'reduce' : 'no-preference');
    }

    enableAnimations() {
        this.animationsEnabled = true;
    }

    disableAnimations() {
        this.animationsEnabled = false;
    }
}
