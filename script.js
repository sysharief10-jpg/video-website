const uploadForm = document.getElementById('uploadForm');
const videoInput = document.getElementById('videoInput');
const videoTitle = document.getElementById('videoTitle');
const videoDesc = document.getElementById('videoDesc');
const uploadStatus = document.getElementById('uploadStatus');
const videoGallery = document.getElementById('videoGallery');
const searchBar = document.getElementById('searchBar');
const darkModeToggle = document.getElementById('darkModeToggle');

const BACKEND_URL = 'http://localhost:3000';
let allVideos = []; 

// --- ACTIVE THEME MANAGEMENT ON PAGE READY ---
// Syncs saved dark/light settings instantly when clicking between the pages
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
if(darkModeToggle) {
    darkModeToggle.innerText = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// PAGE ROUTER ROUTING CHECKS
if (videoGallery) {
    loadVideos();
}
if (uploadForm) {
    setupUploadForm();
}

// --- WATCH HOME GALLERY LOGIC ---
async function loadVideos() {
    try {
        const response = await fetch(`${BACKEND_URL}/videos`);
        allVideos = await response.json();
        renderVideos(allVideos);
    } catch (error) {
        videoGallery.innerHTML = '<p>Could not connect to backend server.</p>';
    }
}

function renderVideos(videoList) {
    videoGallery.innerHTML = '';

    if(videoList.length === 0) {
        videoGallery.innerHTML = '<p>No matching videos found!</p>';
        return;
    }

    videoList.forEach(video => {
        const videoUrl = `${BACKEND_URL}/uploads/${video.filename}`;
        const viewsCount = video.views || 0;
        const likesCount = video.likes || 0;

        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <div class="video-container" onmouseenter="startPreview(this)" onmouseleave="stopPreview(this)">
                <video src="${videoUrl}" controls muted loop onplay="registerView('${video.filename}')"></video>
            </div>
            <h3>${video.title}</h3>
            <p class="desc">${video.description}</p>
            
            <div class="video-stats">
                <span>👁️ ${viewsCount} views</span>
                <button class="like-btn" onclick="likeVideo('${video.filename}')">👍 Like (${likesCount})</button>
            </div>

            <div class="card-buttons">
                <a href="${videoUrl}" download="${video.filename}" class="download-btn">⬇️ Download</a>
                <button class="delete-btn" onclick="deleteVideo('${video.filename}')">🗑️ Delete</button>
            </div>
        `;
        videoGallery.appendChild(card);
    });
}

// VIDEO PREVIEW TRIGGERS
function startPreview(containerElement) {
    const video = containerElement.querySelector('video');
    if (video) {
        video.muted = true;
        video.play().catch(() => {});
    }
}

function stopPreview(containerElement) {
    const video = containerElement.querySelector('video');
    if (video) {
        video.pause();
        video.currentTime = 0;
    }
}

if (searchBar) {
    searchBar.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase();
        const filtered = allVideos.filter(video => 
            video.title.toLowerCase().includes(searchText) || 
            video.description.toLowerCase().includes(searchText)
        );
        renderVideos(filtered);
    });
}

async function registerView(filename) {
    try {
        await fetch(`${BACKEND_URL}/videos/${filename}/view`, { method: 'POST' });
    } catch (error) {
        console.error('Error tracking view:', error);
    }
}

async function likeVideo(filename) {
    try {
        const response = await fetch(`${BACKEND_URL}/videos/${filename}/like`, { method: 'POST' });
        if (response.ok) {
            loadVideos(); 
        }
    } catch (error) {
        alert('Server connection dropped.');
    }
}

async function deleteVideo(filename) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
        const response = await fetch(`${BACKEND_URL}/videos/${filename}`, { method: 'DELETE' });
        if (response.ok) {
            loadVideos(); 
        }
    } catch (error) {
        alert('Could not delete target.');
    }
}

// --- FORM ACTION LOGIC ---
function setupUploadForm() {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = videoInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', videoTitle.value);
        formData.append('description', videoDesc.value);

        uploadStatus.innerText = 'Uploading... Please wait.';
        uploadStatus.style.color = 'orange';

        try {
            const response = await fetch(`${BACKEND_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                uploadStatus.innerText = 'Upload successful! Redirecting to gallery...';
                uploadStatus.style.color = 'green';
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                uploadStatus.innerText = 'Upload failed.';
                uploadStatus.style.color = 'red';
            }
        } catch (error) {
            uploadStatus.innerText = 'Server error during upload.';
            uploadStatus.style.color = 'red';
        }
    });
}

// --- GLOBAL ACCESSIBLE THEME SWITCH TOGGLE ---
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            darkModeToggle.innerText = '☀️ Light Mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            darkModeToggle.innerText = '🌙 Dark Mode';
        }
    });
}
