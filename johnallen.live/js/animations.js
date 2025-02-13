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

// Parallax Scrolling Effect
document.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.hero-content');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Typing Animation for Hero Section
class TypeWriter {
    constructor(txtElement, words, wait = 3000) {
        this.txtElement = txtElement;
        this.words = words;
        this.txt = '';
        this.wordIndex = 0;
        this.wait = parseInt(wait, 10);
        this.type();
        this.isDeleting = false;
    }
    
    type() {
        const current = this.wordIndex % this.words.length;
        const fullTxt = this.words[current];
        
        if(this.isDeleting) {
            this.txt = fullTxt.substring(0, this.txt.length - 1);
        } else {
            this.txt = fullTxt.substring(0, this.txt.length + 1);
        }
        
        this.txtElement.innerHTML = `<span class="txt">${this.txt}</span>`;
        
        let typeSpeed = 100;
        
        if(this.isDeleting) {
            typeSpeed /= 2;
        }
        
        if(!this.isDeleting && this.txt === fullTxt) {
            typeSpeed = this.wait;
            this.isDeleting = true;
        } else if(this.isDeleting && this.txt === '') {
            this.isDeleting = false;
            this.wordIndex++;
            typeSpeed = 500;
        }
        
        setTimeout(() => this.type(), typeSpeed);
    }
}

// Initialize TypeWriter
document.addEventListener('DOMContentLoaded', () => {
    const txtElement = document.querySelector('.typewriter');
    const words = ['Software Engineer', 'Tech Innovator', 'Problem Solver'];
    new TypeWriter(txtElement, words);
});

// Smooth Reveal Animation
const revealElements = document.querySelectorAll('.fade-in');

function reveal() {
    revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('visible');
        }
    });
}

window.addEventListener('scroll', reveal);

// Project Card Hover Effect
const projectCards = document.querySelectorAll('.project-card');

projectCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// Skill Tags Pop Animation
function animateSkillTags() {
    const tags = document.querySelectorAll('.skill-tags span');
    tags.forEach((tag, index) => {
        setTimeout(() => {
            tag.classList.add('visible');
        }, index * 100);
    });
}

// Timeline Animation
function animateTimeline() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('visible');
        }, index * 300);
    });
}

// Initialize animations when sections become visible
const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.target.classList.contains('skill-tags')) {
                animateSkillTags();
            }
            if (entry.target.classList.contains('experience-timeline')) {
                animateTimeline();
            }
            observer.unobserve(entry.target);
        }
    });
};

const observer = new IntersectionObserver(observerCallback, {
    threshold: 0.2
});

document.querySelectorAll('.skill-tags, .experience-timeline').forEach(section => {
    observer.observe(section);
});

// Scroll Progress Indicator
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    progressBar.style.width = `${scrolled}%`;
});

// Custom Cursor
const cursor = document.createElement('div');
cursor.className = 'custom-cursor';
document.body.appendChild(cursor);

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

document.addEventListener('click', () => {
    cursor.classList.add('expand');
    setTimeout(() => {
        cursor.classList.remove('expand');
    }, 500);
});
