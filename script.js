const API_KEY = 'AIz';
let nextPageToken = '';

function searchVideos() {
    const query = document.getElementById('search-bar').value;
    if (!query) return;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${API_KEY}&type=video&maxResults=20`;

    fetchVideos(url);
}

function fetchVideos(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const videoContainer = document.getElementById('video-container');
            if (!nextPageToken) {
                videoContainer.innerHTML = '';
            }
            nextPageToken = data.nextPageToken;
            data.items.forEach(item => {
                const videoId = item.id.videoId;
                const videoTitle = item.snippet.title;
                const videoThumbnail = item.snippet.thumbnails.medium.url;

                const videoElement = document.createElement('div');
                videoElement.classList.add('video');
                videoElement.innerHTML = `
                    <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">
                        <img src="${videoThumbnail}" alt="${videoTitle}">
                        <h4>${videoTitle}</h4>
                    </a>
                `;
                videoContainer.appendChild(videoElement);
            });

            if (nextPageToken) {
                const loadMoreButton = document.getElementById('load-more');
                loadMoreButton.style.display = 'block';
            }
        })
        .catch(error => console.error('Error fetching videos:', error));
}

function loadMoreVideos() {
    const query = document.getElementById('search-bar').value;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${API_KEY}&type=video&maxResults=20&pageToken=${nextPageToken}`;
    fetchVideos(url);
}
