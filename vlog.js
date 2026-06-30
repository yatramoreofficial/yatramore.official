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

function enterCinemaMode(element, isShort) {
    if (window.innerWidth < 768) return; // Only trigger on tablets and desktop
    
    // Prevent the animation from running again if it's already in Theater Mode!
    if (activePlayerElement === element) return;
    
    document.body.classList.add('cinema-active');
    
    if (!isShort) {
        // FLIP: FIRST
        const first = element.getBoundingClientRect();
        
        // Add placeholder so grid doesn't collapse
        const placeholder = document.createElement('div');
        placeholder.style.width = '100%';
        placeholder.style.paddingBottom = '56.25%'; // 16:9 ratio
        element.parentNode.insertBefore(placeholder, element);
        element._placeholder = placeholder;
        
        // FLIP: LAST
        element.classList.add('lightbox-mode');
        
        element.style.transform = 'none';
        element.style.transition = 'none';
        element.style.transformOrigin = 'top left';
        
        const last = element.getBoundingClientRect();
        
        // FLIP: INVERT
        const invertX = first.left - last.left;
        const invertY = first.top - last.top;
        const invertScale = first.width / last.width;
        
        // Apply inverted transform immediately (start at grid slot)
        element.style.transform = `translate(calc(-50% + ${invertX}px), calc(-50% + ${invertY}px)) scale(${invertScale})`;
        
        // Force Reflow
        element.offsetHeight;
        
        // FLIP: PLAY
        element.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease';
        element.style.transform = 'translate(-50%, -50%) scale(1)';
        
    } else {
        element.classList.add('cinema-active-player');
    }
    
    activePlayerElement = element;
}

function exitCinemaMode() {
    document.body.classList.remove('cinema-active');
    if (activePlayerElement) {
        if (activePlayerElement._placeholder) {
            // Revert FLIP smoothly
            const first = activePlayerElement.getBoundingClientRect();
            
            // Revert to grid state to get target rect
            activePlayerElement.classList.remove('lightbox-mode');
            activePlayerElement.style.transform = 'none';
            activePlayerElement.style.transition = 'none';
            
            const last = activePlayerElement._placeholder.getBoundingClientRect();
            
            const invertX = first.left - last.left;
            const invertY = first.top - last.top;
            const invertScale = first.width / last.width;
            
            // Start state (currently large and centered)
            activePlayerElement.style.transformOrigin = 'top left';
            activePlayerElement.style.transform = `translate(${invertX}px, ${invertY}px) scale(${invertScale})`;
            
            // Force reflow
            activePlayerElement.offsetHeight;
            
            // End state (back to grid)
            activePlayerElement.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
            activePlayerElement.style.transform = 'translate(0, 0) scale(1)';
            
            // Cleanup
            const placeholder = activePlayerElement._placeholder;
            const el = activePlayerElement;
            el._placeholder = null;
            setTimeout(() => {
                placeholder.remove();
                el.style.transition = '';
                el.style.transform = '';
                
                // Fully reset to pristine facade
                el.classList.remove('is-playing');
                el.innerHTML = `<button class="lite-youtube-playbtn" aria-label="Play Video"></button>`;
            }, 500);
            
        } else {
            activePlayerElement.classList.remove('cinema-active-player');
            // Fully reset Short to pristine facade immediately
            activePlayerElement.classList.remove('is-paused-hidden');
            activePlayerElement.classList.remove('is-playing');
            activePlayerElement.innerHTML = `<button class="lite-youtube-playbtn" aria-label="Play Video"></button>`;
        }
        
        activePlayerElement = null;
    }
}

function loadYouTubeAPI() {
    // If API is already fully loaded globally, resolve immediately
    if (typeof YT !== 'undefined' && YT && YT.Player) {
        return Promise.resolve();
    }
    
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
    if (ytApiLoaded) return Promise.resolve();
    return ytApiPromise;
}

document.addEventListener("DOMContentLoaded", () => {
    const liteYtElements = document.querySelectorAll(".lite-youtube");
    
    // Global storage for YouTube players to allow keyboard navigation
    window.ytPlayers = window.ytPlayers || {};
    
    liteYtElements.forEach((element, index) => {
        // Unique ID for the YouTube API target
        const playerId = `yt-player-${index}`;
        element.setAttribute('data-player-id', playerId);
        
        element.addEventListener("click", async function() {
            // Immediately scroll Reels into the perfect center of the screen
            // so they are completely visible and never cut off by the navbar!
            if (this.hasAttribute("data-short")) {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            if (this.classList.contains("is-playing")) {
                this.classList.remove('is-paused-hidden');
                const pid = this.getAttribute('data-player-id');
                if (window.ytPlayers && window.ytPlayers[pid]) {
                    const player = window.ytPlayers[pid];
                    // Toggle play/pause since iframe cannot be clicked directly
                    if (player.getPlayerState && player.getPlayerState() === 1) {
                        player.pauseVideo();
                    } else {
                        player.playVideo();
                    }
                }
                return;
            }
            
            const videoId = this.getAttribute("data-videoid");
            const isShort = this.hasAttribute("data-short");
            
            // MOBILE FIX: Bypass the YouTube API entirely on mobile.
            if (window.innerWidth < 768) {
                let iframeUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
                if (isShort) {
                    iframeUrl += "&loop=1&playlist=" + videoId + "&controls=0";
                }
                
                this.innerHTML = `<iframe frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen="1" src="${iframeUrl}" title="YouTube video player"></iframe>`;
                this.classList.add("is-playing");
                return;
            }
            
            // DESKTOP/TABLET: Use Cinema Mode API
            this.innerHTML = `<div id="${playerId}"></div>`;
            this.classList.add("is-playing");
            
            // Player Settings
            let playerVars = {
                'autoplay': 1,
                'rel': 0,
                'modestbranding': 1
            };
            
            if (isShort) {
                playerVars.loop = 1;
                playerVars.playlist = videoId;
                playerVars.controls = 0; // Remove YouTube controls for Reels
            }
            
            const initPlayer = () => {
                window.ytPlayers[playerId] = new YT.Player(playerId, {
                    videoId: videoId,
                    playerVars: playerVars,
                    events: {
                        'onStateChange': (event) => {
                            // Playing = 1
                            if (event.data === 1) {
                                activePlayer = event.target;
                                enterCinemaMode(this, isShort);
                            } 
                            // Ended = 0
                            else if (event.data === 0) {
                                exitCinemaMode();
                            }
                        }
                    }
                });
            };
            
            // If the API is already loaded, run synchronously to preserve the keyboard/click "user gesture" for autoplay!
            if (typeof YT !== 'undefined' && YT && YT.Player) {
                initPlayer();
            } else {
                loadYouTubeAPI().then(() => {
                    initPlayer();
                });
            }
        });
    });
});

// Add Keyboard Navigation for Shorts/Reels and Escape Key for all videos
document.addEventListener('keydown', (e) => {
    // Only proceed if Cinema Mode is active
    if (!document.body.classList.contains('cinema-active')) return;
    
    // ESCAPE KEY: Pause the video and exit cinema mode for both Vlogs and Reels
    if (e.key === 'Escape') {
        if (activePlayer && typeof activePlayer.pauseVideo === 'function') {
            activePlayer.pauseVideo();
        }
        exitCinemaMode();
        return;
    }
    
    // For arrow navigation, we need an active player and it must be a Short
    if (!activePlayerElement || !activePlayerElement.hasAttribute('data-short')) return;
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent default page scrolling
        
        // Find all Shorts on the page
        const shorts = Array.from(document.querySelectorAll('.lite-youtube[data-short]'));
        const currentIndex = shorts.indexOf(activePlayerElement);
        
        if (currentIndex === -1) return;
        
        let targetIndex;
        
        if (e.key === 'ArrowRight') {
            targetIndex = currentIndex + 1;
        } else if (e.key === 'ArrowLeft') {
            targetIndex = currentIndex - 1;
        } else {
            // Calculate how many columns are in the grid dynamically
            const firstTop = shorts[0].getBoundingClientRect().top;
            let columns = shorts.length; // Default to 1 row
            for (let i = 1; i < shorts.length; i++) {
                // If this element's Y position is lower than the first one (with 5px tolerance), a new row has started!
                if (shorts[i].getBoundingClientRect().top > firstTop + 5) {
                    columns = i;
                    break;
                }
            }
            
            if (e.key === 'ArrowDown') {
                targetIndex = currentIndex + columns; // Jump down exactly one row
            } else if (e.key === 'ArrowUp') {
                targetIndex = currentIndex - columns; // Jump up exactly one row
            }
        }
        
        // Stop if we hit the beginning or end of the gallery
        if (targetIndex < 0 || targetIndex >= shorts.length) return;
        
        const nextElement = shorts[targetIndex];
        
        // Pause current video safely
        if (activePlayer && typeof activePlayer.pauseVideo === 'function') {
            activePlayer.pauseVideo();
        }
        
        // Hide the iframe completely so NO YouTube tools or buttons show up on the background thumbnail!
        activePlayerElement.classList.remove('cinema-active-player');
        activePlayerElement.classList.add('is-paused-hidden');
        
        // Move to the next element
        activePlayerElement = nextElement;
        nextElement.classList.add('cinema-active-player');
        nextElement.classList.remove('is-paused-hidden');
        
        // Gently scroll the new Reel into the perfect center of the screen
        nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Play the new video
        if (nextElement.classList.contains('is-playing')) {
            // Already loaded, just play it
            const pid = nextElement.getAttribute('data-player-id');
            if (window.ytPlayers && window.ytPlayers[pid]) {
                activePlayer = window.ytPlayers[pid];
                activePlayer.playVideo();
            }
        } else {
            // Not loaded yet, trigger facade
            nextElement.click();
        }
    }
});
