// Modern search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const resultsGrid = document.getElementById('results-grid');
    let searchTimeout;

    // Handle search input with debounce
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    // Perform search
    async function performSearch(query) {
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            displayResults(data);
            
        } catch (error) {
            console.error('Error performing search:', error);
        }
    }

    // Display search results
    function displayResults(data) {
        resultsGrid.innerHTML = '';
        
        if (data.results && data.results.length > 0) {
            data.results.forEach(result => {
                const resultCard = document.createElement('div');
                resultCard.className = 'result-card';
                resultCard.innerHTML = `
                    <h3>${result.title}</h3>
                    <p>${result.description}</p>
                    ${result.url ? `<a href="${result.url}" target="_blank">Learn more</a>` : ''}
                `;
                resultsGrid.appendChild(resultCard);
            });
            
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.style.display = 'none';
        }
    }

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            resultsContainer.style.display = 'none';
        }
    });
});
