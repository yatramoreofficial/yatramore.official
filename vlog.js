// vlog.js

let ytApiLoaded = false;
let ytApiPromise = null;
let activePlayer = null;
let activePlayerElement = null;

// Add the cinema overlay to the body
const cinemaOverlay = document.createElement('div');
cinemaOverlay.className = 'cinema-overlay';
document.body.appendChild(cinemaOverlay);

// Allow clicking overlay to exit cinema mode (pauses the video)
cinemaOverlay.addEventListener('click', () => {
    if (activePlayer && typeof activePlayer.pauseVideo === 'function') {
        activePlayer.pauseVideo();
    }
    exitCinemaMode();
});

function enterCinemaMode(element) {
    if (window.innerWidth < 768) return; // Only trigger on tablets and desktop
    document.body.classList.add('cinema-active');
    element.classList.add('cinema-active-player');
    activePlayerElement = element;
}

function exitCinemaMode() {
    document.body.classList.remove('cinema-active');
    if (activePlayerElement) {
        activePlayerElement.classList.remove('cinema-active-player');
        activePlayerElement = null;
    }
}

function loadYouTubeAPI() {
    if (!ytApiPromise) {
        ytApiPromise = new Promise((resolve) => {
            window.onYouTubeIframeAPIReady = () => {
                ytApiLoaded = true;
                resolve();
            };
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        });
    }
    // If it's already loaded, resolve immediately
    if (ytApiLoaded) return Promise.resolve();
    return ytApiPromise;
}

document.addEventListener("DOMContentLoaded", () => {
    const liteYtElements = document.querySelectorAll(".lite-youtube");
    
    liteYtElements.forEach((element, index) => {
        // Unique ID for the YouTube API target
        const playerId = `yt-player-${index}`;
        
        element.addEventListener("click", async function() {
            if (this.classList.contains("is-playing")) return;
            
            const videoId = this.getAttribute("data-videoid");
            const isShort = this.hasAttribute("data-short");
            
            // Clear the thumbnail and button
            this.innerHTML = `<div id="${playerId}"></div>`;
            this.classList.add("is-playing");
            
            // Wait for YouTube API
            await loadYouTubeAPI();
            
            // Player Settings
            let playerVars = {
                'autoplay': 1,
                'rel': 0,
                'modestbranding': 1
            };
            
            if (isShort) {
                playerVars.loop = 1;
                playerVars.playlist = videoId;
            }
            
            // Initialize Player
            new YT.Player(playerId, {
                videoId: videoId,
                playerVars: playerVars,
                events: {
                    'onStateChange': (event) => {
                        // Playing = 1
                        if (event.data === 1) {
                            activePlayer = event.target;
                            enterCinemaMode(this);
                        } 
                        // Paused = 2, Ended = 0
                        else if (event.data === 2 || event.data === 0) {
                            exitCinemaMode();
                        }
                    }
                }
            });
        });
    });
});
