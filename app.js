const apiKey = "d2e837634e374027bbdac4f0cc94cc30";
const newsContainer = document.querySelector('.news-container');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');

async function fetchNews(category) {
    const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.articles) {
            displayNews(data.articles);
        }
    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

// Call fetchNews when page loads
fetchNews('general');

async function searchNews() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;

    newsContainer.innerHTML = '<div class="loading">Searching news...</div>';

    try {
        const url = `https://newsapi.org/v2/everything?q=${searchTerm}&apiKey=${apiKey}&pageSize=20&language=en`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'ok' && data.articles) {
            displayNews(data.articles);
        } else {
            throw new Error('No results found');
        }
    } catch (error) {
        console.error('Error:', error);
        newsContainer.innerHTML = `
            <div class="error">
                <p>No results found for "${searchTerm}". Try different keywords.</p>
            </div>`;
    }
}

function displayNews(articles) {
    if (!articles || articles.length === 0) {
        newsContainer.innerHTML = '<div class="error">No news found.</div>';
        return;
    }

    const newsHTML = articles.map(article => `
        <div class="news-card">
            <img 
                src="${article.urlToImage || 'https://via.placeholder.com/400x200?text=No+Image'}" 
                alt="${article.title}"
                class="news-image"
                onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'"
            >
            <button class="favorite-btn ${isFavorite(article) ? 'active' : ''}" 
                    onclick="toggleFavorite(${JSON.stringify(article).replace(/"/g, '&quot;')})">
                <i class="fas fa-heart"></i>
            </button>
            <div class="news-content">
                <h3 class="news-title">${article.title}</h3>
                <p class="news-description">${article.description || 'No description available'}</p>
                <div class="news-meta">
                    <span>${article.source.name}</span>
                    <span>${new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>
                <a href="${article.url}" target="_blank" class="read-more">Read More</a>
            </div>
        </div>
    `).join('');

    newsContainer.innerHTML = newsHTML;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initial news load
    fetchNews('general');

    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            searchNews();
        });
    }

    // Enter key in search input
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchNews();
            }
        });
    }

    // Category navigation (keep your existing category click handlers)
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            if (category) {
                fetchNews(category);
            }
        });
    });
});

// Get favorites from localStorage
function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

// Check if an article is in favorites
function isFavorite(article) {
    const favorites = getFavorites();
    return favorites.some(fav => fav.title === article.title);
}

// Toggle favorite status
function toggleFavorite(article) {
    const favorites = getFavorites();
    const index = favorites.findIndex(fav => fav.title === article.title);
    
    if (index === -1) {
        // Add to favorites
        favorites.push(article);
        showToast('Added to favorites!');
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        showToast('Removed from favorites!');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Update the favorite button state
    const btn = event.target.closest('.favorite-btn');
    if (btn) {
        btn.classList.toggle('active');
    }
}

// Show favorites
function showFavorites() {
    const favorites = getFavorites();
    displayNews(favorites);
    document.querySelector('.category-title h2').textContent = 'Favorite News';
}

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2000);
    }, 100);
}

// Toggle menu function
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    const menuIcon = document.querySelector('.menu-icon');
    
    navLinks.classList.toggle('active');
    menuIcon.classList.toggle('active');
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const navLinks = document.querySelector('.nav-links');
    const menuIcon = document.querySelector('.menu-icon');
    
    if (!navLinks.contains(e.target) && !menuIcon.contains(e.target)) {
        navLinks.classList.remove('active');
        menuIcon.classList.remove('active');
    }
});

// Close menu when window is resized to desktop size
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        const navLinks = document.querySelector('.nav-links');
        const menuIcon = document.querySelector('.menu-icon');
        
        navLinks.classList.remove('active');
        menuIcon.classList.remove('active');
    }
});
