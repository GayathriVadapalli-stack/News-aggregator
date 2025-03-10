const newsContainer = document.querySelector('.news-container');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
//API KEY
const apiKey = 'd2e837634e374027bbdac4f0cc94cc30';

async function fetchNews(category = 'general') {
    try {
        newsContainer.innerHTML = '<div class="loading">Loading news...</div>';
        const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'ok' && data.articles) {
            displayNews(data.articles);
        } else {
            throw new Error(data.message || 'Failed to fetch news');
        }
    } catch (error) {
        newsContainer.innerHTML = `
            <div class="error">
                <p>Failed to load news. Please try again later.</p>
                <button onclick="fetchNews('${category}')">Try Again</button>
            </div>`;
    }
}
//Search news
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
        const cleanArticle = {
            title: article.title || '',
            description: article.description || 'No description available',
            urlToImage: article.urlToImage || '',
            url: article.url || '#',
            source: article.source || { name: 'Unknown' },
            publishedAt: article.publishedAt || new Date().toISOString()
        };
        
        const articleData = JSON.stringify(cleanArticle)
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        
        const isFavorite = isInFavorites(cleanArticle);
        
        return `
            <div class="news-card">
                <img 
                    src="${cleanArticle.urlToImage}" 
                    alt="${cleanArticle.title}"
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
                    <h3 class="news-title">${cleanArticle.title}</h3>
                    <p class="news-description">${cleanArticle.description}</p>
                    <div class="news-meta">
                        <span>${cleanArticle.source.name}</span>
                        <span>${new Date(cleanArticle.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <a href="${cleanArticle.url}" target="_blank" class="read-more">Read More</a>
                </div>
            </div>
        `;
    }).join('');

    newsContainer.innerHTML = newsHTML;
    
    document.querySelectorAll('.favorite-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleFavoriteClick(this);
        });
    });
}

function handleFavoriteClick(button) {
    try {
        let articleData = button.getAttribute('data-article');
        articleData = articleData.replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        const article = JSON.parse(articleData);
        
        const favorites = getFavorites();
        const index = favorites.findIndex(fav => fav.title === article.title);
        
        if (index === -1) {
            favorites.push(article);
            button.classList.add('active');
            showToast('Added to favorites! ❤️');
        } else {
            favorites.splice(index, 1);
            button.classList.remove('active');
            showToast('Removed from favorites');
            
            if (document.querySelector('.nav-links a[data-category="favorites"].active')) {
                displayFavorites();
                return;
            }
        }
        
        saveFavorites(favorites);
        updateFavoritesCount();
    } catch (error) {
        console.error('Error handling favorite:', error);
    }
}

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('favorites')) || [];
    } catch {
        return [];
    }
}

function saveFavorites(favorites) {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function isInFavorites(article) {
    const favorites = getFavorites();
    return favorites.some(fav => fav.title === article.title);
}

function displayFavorites() {
    const favorites = getFavorites();
    if (favorites.length === 0) {
        newsContainer.innerHTML = '<div class="error">No favorite articles yet! Click the heart icon on news cards to add favorites.</div>';
    } else {
        displayNews(favorites);
    }
    updateFavoritesCount();
}

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

function updateFavoritesCount() {
    const favorites = getFavorites();
    const favCount = document.querySelector('.favorites-count');
    if (favCount) {
        favCount.textContent = favorites.length;
        favCount.style.display = favorites.length > 0 ? 'inline-flex' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchNews('general');
});

if (searchBtn) {
    searchBtn.addEventListener('click', searchNews);
}

if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchNews();
        }
    });
}

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
