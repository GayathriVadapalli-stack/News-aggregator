const newsContainer = document.querySelector('.news-container');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Make sure we're using the correct API key from config.js
import { apiKey } from './config.js';

async function loadConfig() {
    const response = await fetch("config.json");
    const config = await response.json();
    return config;
  }
  
  async function fetchNews(category = 'general') {
    try {
        newsContainer.innerHTML = '<div class="loading">Loading news...</div>';
        
        // Log the URL and API key (remove in production)
        console.log('Fetching news for category:', category);
        
        const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`;
        const response = await fetch(url);
        
        // Log response status
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        if (data.status === 'ok' && data.articles) {
            displayNews(data.articles);
        } else {
            throw new Error(data.message || 'Failed to fetch news');
        }
    } catch (error) {
        console.error('Error details:', error);
        newsContainer.innerHTML = `
            <div class="error">
                <p>Failed to load news. Please try again later.</p>
                <button onclick="fetchNews('${category}')">Try Again</button>
            </div>`;
    }
}
  
  fetchNews();  

async function searchNews() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;

    try {
        newsContainer.innerHTML = '<div class="loading">Searching news...</div>';
        
        const url = `https://newsapi.org/v2/everything?q=${searchTerm}&apiKey=${apiKey}&pageSize=20`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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
                <p>No results found. Try different keywords.</p>
            </div>`;
    }
}

function displayNews(articles) {
    if (!articles || articles.length === 0) {
        newsContainer.innerHTML = '<div class="error">No news found.</div>';
        return;
    }

    // Filter out articles without valid images
    const validArticles = articles.filter(article => 
        article.urlToImage && 
        article.urlToImage !== 'null' && 
        article.urlToImage !== 'undefined' && 
        !article.urlToImage.includes('placeholder') &&
        article.urlToImage.startsWith('http')
    );

    if (validArticles.length === 0) {
        newsContainer.innerHTML = '<div class="error">No articles with images found.</div>';
        return;
    }

    const newsHTML = validArticles.map(article => {
        const articleData = JSON.stringify(article).replace(/"/g, '&quot;');
        const isFavorite = isInFavorites(article);
        
        return `
            <div class="news-card">
                <img 
                    src="${article.urlToImage}" 
                    alt="${article.title}"
                    class="news-image"
                    onerror="this.parentElement.remove()"
                >
                <button 
                    class="favorite-btn ${isFavorite ? 'active' : ''}"
                    data-article='${articleData}'
                >
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
        `;
    }).join('');

    newsContainer.innerHTML = newsHTML;
    
    // Add click event listeners to all favorite buttons
    document.querySelectorAll('.favorite-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            handleFavoriteClick(this);
        });
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, fetching news...'); // Debug log
    fetchNews('general');
    updateFavoritesCount();
    
    // Add event listener for favorites navigation
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');

            const category = link.getAttribute('data-category');
            if (category === 'favorites') {
                displayFavorites();
            } else {
                fetchNews(category);
            }
        });
    });

    // Add these functions to handle mobile menu
    setupMobileMenu();
});

// Search button click
if (searchBtn) {
    searchBtn.addEventListener('click', searchNews);
}

// Enter key press in search input
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchNews();
        }
    });
}

// Function to get favorites from localStorage
function getFavorites() {
    try {
        const favorites = localStorage.getItem('favorites');
        return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
        console.error('Error getting favorites:', error);
        return [];
    }
}

// Function to save favorites to localStorage
function saveFavorites(favorites) {
    try {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (error) {
        console.error('Error saving favorites:', error);
        showToast('Error saving favorites');
    }
}

// Function to check if an article is already in favorites
function isInFavorites(article) {
    try {
        const favorites = getFavorites();
        return favorites.some(fav => fav.title === article.title);
    } catch (error) {
        console.error('Error checking favorites:', error);
        return false;
    }
}

// Update the handleFavoriteClick function
function handleFavoriteClick(button) {
    try {
        // Get article data and clean it up
        let articleData = button.getAttribute('data-article');
        articleData = articleData.replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        const article = JSON.parse(articleData);
        
        const favorites = getFavorites();
        const index = favorites.findIndex(fav => fav.title === article.title);
        
        if (index === -1) {
            // Add to favorites
            favorites.push(article);
            button.classList.add('active');
            showToast('Added to favorites! ❤️');
        } else {
            // Remove from favorites
            favorites.splice(index, 1);
            button.classList.remove('active');
            showToast('Removed from favorites');
            
            // If we're on the favorites page, refresh the display
            const currentCategory = document.querySelector('.nav-links a.active')?.getAttribute('data-category');
            if (currentCategory === 'favorites') {
                displayFavorites();
                return;
            }
        }
        
        saveFavorites(favorites);
        updateFavoritesCount();
    } catch (error) {
        console.error('Error handling favorite click:', error);
        console.log('Problematic data:', button.getAttribute('data-article'));
        showToast('Error updating favorites');
    }
}

// update favorites count
function updateFavoritesCount() {
    const favorites = getFavorites();
    const favCount = document.querySelector('.favorites-count');
    
    if (favCount) {
        favCount.textContent = favorites.length;
        favCount.style.display = favorites.length > 0 ? 'inline-flex' : 'none';
    }
}

// Update the displayFavorites function
function displayFavorites() {
    const favorites = getFavorites();
    if (favorites.length === 0) {
        newsContainer.innerHTML = `
            <div class="error">
                <p>No favorite articles yet!</p>
            </div>`;
    } else {
        displayNews(favorites);
    }
    updateFavoritesCount();
}

// Function to show toast notifications
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

// Add this to your existing JavaScript
document.querySelector('.search-bar input').addEventListener('focus', function() {
    if (window.innerWidth <= 767) {
        this.closest('.search-bar').classList.add('keyboard-active');
    }
});

document.querySelector('.search-bar input').addEventListener('blur', function() {
    if (window.innerWidth <= 767) {
        this.closest('.search-bar').classList.remove('keyboard-active');
    }
});

// Add these functions to handle mobile menu
function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!menuToggle) return;

    // Toggle menu
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('active');
        menuToggle.innerHTML = navLinks.classList.contains('active') ? 
            '<i class="fas fa-times"></i>' : 
            '<i class="fas fa-bars"></i>';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });

    // Close menu on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 767) {
            navLinks.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
}
