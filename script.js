const API_KEY = 'AIz';
let nextPageToken = '';
let currentQuery = '';
let isLoading = false;

// DOM Elements
const searchBar = document.getElementById('search-bar');
const videoContainer = document.getElementById('video-container');
const loadMoreBtn = document.getElementById('load-more');
const loadingContainer = document.getElementById('loading-container');
const resultsSection = document.getElementById('results-section');
const resultsCount = document.getElementById('results-count');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Add event listeners
    searchBar.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchVideos();
        }
    });

    // Add input animation
    searchBar.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });

    searchBar.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });

    // Smooth scroll for results
    window.addEventListener('scroll', handleScroll);
}

function handleScroll() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'none';
    }
}

function searchVideos() {
    const query = searchBar.value.trim();
    if (!query || isLoading) return;

    currentQuery = query;
    nextPageToken = '';
    
    showLoading();
    clearResults();
    
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${API_KEY}&type=video&maxResults=20`;
    
    fetchVideos(url);
}

function quickSearch(query) {
    searchBar.value = query;
    searchVideos();
}

function fetchVideos(url) {
    isLoading = true;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            hideLoading();
            displayVideos(data);
            updateResultsCount(data.pageInfo?.totalResults || 0);
            showResultsSection();
        })
        .catch(error => {
            console.error('Error fetching videos:', error);
            hideLoading();
            showError('Failed to fetch videos. Please check your API key and try again.');
        })
        .finally(() => {
            isLoading = false;
        });
}

function displayVideos(data) {
    if (!nextPageToken) {
        videoContainer.innerHTML = '';
    }
    
    nextPageToken = data.nextPageToken || '';
    
    if (data.items && data.items.length > 0) {
        data.items.forEach((item, index) => {
            const videoElement = createVideoElement(item, index);
            videoContainer.appendChild(videoElement);
        });
        
        // Show/hide load more button
        if (nextPageToken) {
            loadMoreBtn.classList.add('visible');
        } else {
            loadMoreBtn.classList.remove('visible');
        }
    } else {
        showNoResults();
    }
}

function createVideoElement(item, index) {
    const videoId = item.id.videoId;
    const videoTitle = item.snippet.title;
    const videoThumbnail = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url;
    const channelTitle = item.snippet.channelTitle;
    const publishedAt = formatDate(item.snippet.publishedAt);
    
    const videoElement = document.createElement('div');
    videoElement.classList.add('video');
    videoElement.style.animationDelay = `${index * 0.1}s`;
    
    videoElement.innerHTML = `
        <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">
            <div class="video-thumbnail">
                <img src="${videoThumbnail}" alt="${escapeHtml(videoTitle)}" loading="lazy">
                <div class="video-overlay">
                    <i class="fas fa-play-circle play-icon"></i>
                </div>
            </div>
            <div class="video-info">
                <h4 class="video-title">${escapeHtml(videoTitle)}</h4>
                <div class="video-meta">
                    <span class="video-channel">${escapeHtml(channelTitle)}</span>
                    <span class="video-date">${publishedAt}</span>
                </div>
            </div>
        </a>
    `;
    
    return videoElement;
}

function loadMoreVideos() {
    if (!nextPageToken || !currentQuery || isLoading) return;
    
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(currentQuery)}&key=${API_KEY}&type=video&maxResults=20&pageToken=${nextPageToken}`;
    
    // Show loading state on button
    const btnText = loadMoreBtn.querySelector('.btn-text');
    const btnIcon = loadMoreBtn.querySelector('.btn-icon');
    const originalText = btnText.textContent;
    
    btnText.textContent = 'Loading...';
    btnIcon.className = 'fas fa-spinner fa-spin btn-icon';
    loadMoreBtn.disabled = true;
    
    fetchVideos(url);
    
    // Reset button state
    setTimeout(() => {
        btnText.textContent = originalText;
        btnIcon.className = 'fas fa-chevron-down btn-icon';
        loadMoreBtn.disabled = false;
    }, 1000);
}

function showLoading() {
    loadingContainer.classList.add('visible');
}

function hideLoading() {
    loadingContainer.classList.remove('visible');
}

function showResultsSection() {
    resultsSection.classList.add('visible');
    
    // Smooth scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 300);
}

function clearResults() {
    videoContainer.innerHTML = '';
    loadMoreBtn.classList.remove('visible');
    resultsSection.classList.remove('visible');
}

function updateResultsCount(count) {
    if (count > 0) {
        resultsCount.textContent = `${count.toLocaleString()} results found`;
        resultsCount.style.display = 'block';
    } else {
        resultsCount.style.display = 'none';
    }
}

function showNoResults() {
    videoContainer.innerHTML = `
        <div class="no-results">
            <div class="no-results-icon">
                <i class="fas fa-search"></i>
            </div>
            <h3>No videos found</h3>
            <p>Try searching with different keywords or check your spelling.</p>
        </div>
    `;
    
    // Add styles for no results
    const style = document.createElement('style');
    style.textContent = `
        .no-results {
            grid-column: 1 / -1;
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-secondary);
        }
        .no-results-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.5;
        }
        .no-results h3 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }
    `;
    document.head.appendChild(style);
}

function showError(message) {
    videoContainer.innerHTML = `
        <div class="error-message">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button onclick="searchVideos()" class="retry-btn">
                <i class="fas fa-redo"></i>
                Try Again
            </button>
        </div>
    `;
    
    // Add styles for error message
    const style = document.createElement('style');
    style.textContent = `
        .error-message {
            grid-column: 1 / -1;
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-secondary);
        }
        .error-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            color: var(--error-color);
        }
        .error-message h3 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }
        .retry-btn {
            margin-top: 1rem;
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
        }
        .retry-btn:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        const years = Math.floor(diffDays / 365);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === '/' && e.target !== searchBar) {
        e.preventDefault();
        searchBar.focus();
    }
    
    if (e.key === 'Escape' && e.target === searchBar) {
        searchBar.blur();
    }
});

// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
        }
    });
}, observerOptions);

// Observe video elements as they're added
const videoObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.classList.contains('video')) {
                observer.observe(node);
            }
        });
    });
});

videoObserver.observe(videoContainer, { childList: true });