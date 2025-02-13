class AboutEffects {
    constructor() {
        this.initializeParallax();
        this.initializeTimeline();
        this.initializeTeamCards();
        this.initializeContactForm();
        this.initializeParticles();
        this.initializeTypingEffect();
        this.initializeScrollReveal();
    }

    initializeParallax() {
        const parallaxElements = document.querySelectorAll('.parallax');
        window.addEventListener('scroll', () => {
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                const rect = element.getBoundingClientRect();
                const scrolled = window.pageYOffset;
                
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const yPos = -(scrolled * speed);
                    element.style.transform = `translate3d(0, ${yPos}px, 0)`;
                }
            });
        });
    }

    initializeTimeline() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, { threshold: 0.5 });

        timelineItems.forEach(item => {
            observer.observe(item);
            item.addEventListener('mouseenter', () => {
                this.createTimelineParticles(item);
            });
        });
    }

    createTimelineParticles(element) {
        const particles = 10;
        const colors = ['#00f7ff', '#ff71ce', '#01cdfe', '#05ffa1'];

        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            particle.className = 'timeline-particle';
            particle.style.setProperty('--particle-color', colors[Math.floor(Math.random() * colors.length)]);
            particle.style.setProperty('--particle-size', `${Math.random() * 5 + 2}px`);
            particle.style.setProperty('--particle-travel', `${Math.random() * 100 - 50}px`);
            particle.style.setProperty('--particle-duration', `${Math.random() * 1 + 0.5}s`);

            element.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }
    }

    initializeTeamCards() {
        const teamMembers = document.querySelectorAll('.team-member');
        
        teamMembers.forEach(member => {
            member.addEventListener('mouseenter', () => {
                this.createEnergyField(member);
            });

            member.addEventListener('mousemove', (e) => {
                this.updateHolographicEffect(member, e);
            });

            member.addEventListener('mouseleave', () => {
                this.removeEnergyField(member);
                this.resetHolographicEffect(member);
            });
        });
    }

    createEnergyField(element) {
        const field = document.createElement('div');
        field.className = 'energy-field';
        element.appendChild(field);
    }

    removeEnergyField(element) {
        const field = element.querySelector('.energy-field');
        if (field) field.remove();
    }

    updateHolographicEffect(element, event) {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const angleX = (y - centerY) / 10;
        const angleY = (x - centerX) / 10;
        
        element.style.transform = `
            perspective(1000px)
            rotateX(${-angleX}deg)
            rotateY(${angleY}deg)
            scale3d(1.05, 1.05, 1.05)
        `;
    }

    resetHolographicEffect(element) {
        element.style.transform = '';
    }

    initializeContactForm() {
        const form = document.querySelector('.contact-form');
        const inputs = form.querySelectorAll('.contact-input');

        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                this.createInputParticles(input);
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm(form);
        });
    }

    createInputParticles(input) {
        const rect = input.getBoundingClientRect();
        const particles = 5;

        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            particle.className = 'input-particle';
            particle.style.left = `${Math.random() * rect.width}px`;
            particle.style.top = `${rect.height / 2}px`;
            
            input.parentElement.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }
    }

    async submitForm(form) {
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        submitButton.disabled = true;
        submitButton.innerHTML = '<div class="space-loader"></div>';

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 2000));

        submitButton.innerHTML = '<i class="fas fa-check"></i> Sent!';
        this.createSuccessParticles(submitButton);

        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            form.reset();
        }, 3000);
    }

    createSuccessParticles(element) {
        const rect = element.getBoundingClientRect();
        const particles = 20;

        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            particle.className = 'success-particle';
            
            const angle = (i / particles) * Math.PI * 2;
            const velocity = 2 + Math.random() * 2;
            
            particle.style.left = `${rect.width / 2}px`;
            particle.style.top = `${rect.height / 2}px`;
            particle.style.setProperty('--angle', angle + 'rad');
            particle.style.setProperty('--velocity', velocity);
            
            element.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }
    }

    initializeParticles() {
        const container = document.createElement('div');
        container.className = 'particle-container';
        document.body.appendChild(container);

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            this.resetParticle(particle);
            container.appendChild(particle);
        }

        setInterval(() => {
            document.querySelectorAll('.floating-particle').forEach(particle => {
                if (particle.getBoundingClientRect().top < 0) {
                    this.resetParticle(particle);
                }
            });
        }, 100);
    }

    resetParticle(particle) {
        particle.style.setProperty('--fall-duration', `${5 + Math.random() * 10}s`);
        particle.style.setProperty('--fall-delay', `${-Math.random() * 10}s`);
        particle.style.setProperty('--fall-distance', `${Math.random() * 100}vh`);
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = '110vh';
    }

    initializeTypingEffect() {
        const elements = document.querySelectorAll('[data-type]');
        
        elements.forEach(element => {
            const text = element.textContent;
            element.textContent = '';
            
            let index = 0;
            const type = () => {
                if (index < text.length) {
                    element.textContent += text.charAt(index);
                    index++;
                    setTimeout(type, 50 + Math.random() * 50);
                }
            };
            
            this.observeElement(element, type);
        });
    }

    observeElement(element, callback) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback();
                    observer.unobserve(element);
                }
            });
        });
        
        observer.observe(element);
    }

    initializeScrollReveal() {
        const elements = document.querySelectorAll('.reveal');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(element => observer.observe(element));
    }
}

// Initialize effects when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aboutEffects = new AboutEffects();
});
