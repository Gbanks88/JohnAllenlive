// Advanced Space Effects
class SpaceEffects {
    constructor() {
        this.initializeCanvas();
        this.createParticles();
        this.animate();
        this.initializeHolographicEffects();
    }

    initializeCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.className = 'space-canvas';
        document.body.insertBefore(this.canvas, document.body.firstChild);
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Canvas styles
        Object.assign(this.canvas.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '-2',
            background: 'radial-gradient(circle at 50% 50%, #0A2472 0%, #091834 50%, #030B1B 100%)'
        });
    }

    resizeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    createParticles() {
        this.particles = [];
        const particleCount = Math.floor((this.width * this.height) / 10000);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                brightness: Math.random()
            });
        }
    }

    createNebula(x, y, radius) {
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        const hue = Math.random() * 60 - 30; // Blue to purple range
        
        gradient.addColorStop(0, `hsla(${180 + hue}, 100%, 60%, 0.1)`);
        gradient.addColorStop(0.4, `hsla(${200 + hue}, 100%, 40%, 0.05)`);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawParticles() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw nebulas
        for (let i = 0; i < 3; i++) {
            this.createNebula(
                this.width * (0.2 + Math.sin(Date.now() * 0.0001 + i) * 0.1),
                this.height * (0.3 + Math.cos(Date.now() * 0.0001 + i) * 0.1),
                Math.min(this.width, this.height) * 0.3
            );
        }
        
        // Draw stars
        this.particles.forEach(particle => {
            const alpha = 0.5 + Math.sin(Date.now() * 0.001 + particle.brightness * 10) * 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.width;
            if (particle.x > this.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.height;
            if (particle.y > this.height) particle.y = 0;
        });
    }

    initializeHolographicEffects() {
        // Create holographic grid lines
        const gridContainer = document.createElement('div');
        gridContainer.className = 'holographic-grid';
        document.body.appendChild(gridContainer);
        
        // Add perspective lines
        for (let i = 0; i < 20; i++) {
            const line = document.createElement('div');
            line.className = 'grid-line';
            line.style.cssText = `
                position: absolute;
                width: 100%;
                height: 1px;
                background: linear-gradient(90deg, 
                    transparent 0%, 
                    rgba(0, 248, 255, 0.2) 50%, 
                    transparent 100%);
                transform: translateY(${i * 50}px) perspective(1000px) rotateX(60deg);
                opacity: ${1 - (i / 20)};
            `;
            gridContainer.appendChild(line);
        }
    }

    animate() {
        this.drawParticles();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize space effects
document.addEventListener('DOMContentLoaded', () => {
    window.spaceEffects = new SpaceEffects();
});
