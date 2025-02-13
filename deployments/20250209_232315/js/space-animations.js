// Create shooting stars
function createShootingStars() {
    const container = document.getElementById('shootingStarsContainer');
    const numberOfStars = 5;
    
    function createStar() {
        const star = document.createElement('div');
        star.className = 'shooting-star';
        star.style.top = `${Math.random() * 50}%`;
        star.style.left = `${Math.random() * 50}%`;
        star.style.animationDelay = `${Math.random() * 8}s`;
        return star;
    }

    function populateStars() {
        container.innerHTML = '';
        for (let i = 0; i < numberOfStars; i++) {
            container.appendChild(createStar());
        }
    }

    // Initial population
    populateStars();

    // Periodically refresh shooting stars
    setInterval(populateStars, 8000);
}

// Initialize solar system rotation speeds
function initSolarSystem() {
    const orbits = document.querySelectorAll('.orbit');
    orbits.forEach((orbit, index) => {
        const speed = 30 + (index * 15); // Each orbit is progressively slower
        orbit.style.animation = `orbit-rotation ${speed}s linear infinite`;
    });
}

// Initialize all space animations
function initSpaceAnimations() {
    createShootingStars();
    initSolarSystem();
}

// Start animations when document is ready
document.addEventListener('DOMContentLoaded', initSpaceAnimations);
