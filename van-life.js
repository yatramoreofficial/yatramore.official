/**
 * YA-VanLife - Global Discovery Engine (v8.0)
 * Integrated with YatrAmore Core.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. CONFIGURATION
    const vicenzaCoords = [45.5481, 11.5495];
    const RADAR_DURATION = 6000;
    const RADAR_SCALE = 18;
    const RADAR_BASE_RADIUS = 50;
    const DISCOVERY_RED = '#FF3B30';

    const travelDestinations = [
        {
            id: "van-base-1",
            active: false,
            title: "Pian delle Fugazze Base",
            coords: [45.7602, 11.1764],
            description: "Pasubio base camp - Snake discovery active.",
            image: "Images/logo.svg",
            instagram: "https://www.instagram.com/yatramore.official",
            tiktok: "https://www.tiktok.com/@yatramore",
            youtube: "https://www.youtube.com/@yatramore"
        },
        {
            id: "van-base-2",
            active: false,
            title: "Cortina Olympic Base",
            coords: [46.5441, 12.1337],
            description: "Cortina expedition - Syncing Dolomite curves.",
            image: "Images/logo.svg",
            instagram: "https://www.instagram.com/yatramore.official",
            tiktok: "https://www.tiktok.com/@yatramore",
            youtube: "https://www.youtube.com/@yatramore"
        },
        {
            id: "van-base-3",
            active: false,
            title: "Venice Lagoon Base",
            coords: [45.4674, 12.2798],
            description: "Stationed at San Giuliano, overlooking the Venice Lagoon. Discovery synced!",
            image: "Images/logo.svg",
            instagram: "https://www.instagram.com/yatramore.official",
            tiktok: "https://www.tiktok.com/@yatramore",
            youtube: "https://www.youtube.com/@yatramore"
        },
        {
            id: "van-base-4",
            active: true,
            title: "Sentiero dei Grandi Alberi",
            coords: [45.7000, 11.2300],
            altitude: 1150,
            description: "Hiking through the ancient giants of Recoaro Terme. Pure nature discovery.",
            image: "Images/logo.svg",
            instagram: "https://www.instagram.com/yatramore.official",
            tiktok: "https://www.tiktok.com/@yatramore",
            youtube: "https://www.youtube.com/@yatramore",
        }
    ];

    // 2. STATE & MAP INITIALIZATION
    const map = L.map('van-map', { center: vicenzaCoords, zoom: 9, scrollWheelZoom: false, zoomControl: false });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' }).addTo(map);

    // Custom Controls
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // 3. HOME BASE BUTTON
    const HomeButton = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function () {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-home glass');
            container.innerHTML = '<a href="#" title="Back to Home Base" role="button" aria-label="Back to Home Base"><i class="fas fa-home"></i></a>';
            container.onclick = function (e) {
                e.preventDefault();
                map.setView(vicenzaCoords, 9);
            };
            return container;
        }
    });
    map.addControl(new HomeButton());

    const discoveryPool = [];
    let radarStartTime = null;

    // 4. GLOBAL ENGINE PHYSICS
    function getRadarMaxDistance() {
        const centerPoint = map.latLngToContainerPoint(vicenzaCoords);
        const edgePoint = L.point(centerPoint.x + (RADAR_BASE_RADIUS * RADAR_SCALE), centerPoint.y);
        const edgeLatLng = map.containerPointToLatLng(edgePoint);
        return map.distance(vicenzaCoords, edgeLatLng);
    }

    function globalDiscoveryLoop() {
        if (!radarStartTime) return requestAnimationFrame(globalDiscoveryLoop);

        const elapsed = Date.now() - radarStartTime;
        const progress = (elapsed % RADAR_DURATION) / RADAR_DURATION;

        // 1. PHYSICAL GEOGRAPHY: Max logical distance for current zoom
        const maxDistMeters = getRadarMaxDistance();
        const currentRadiusMeters = progress * maxDistMeters;

        // 2. VISUAL PHYSICS: Screen-space check for pings
        const centerPoint = map.latLngToContainerPoint(vicenzaCoords);
        const currentPixelRadius = progress * 900;

        // 3. SATELLITE DATA LOCK SYNC
        const statLock = document.getElementById('stat-lock');
        const signalBars = document.querySelector('.signal-bars');
        if (statLock && signalBars) {
            if (progress < 0.95) {
                statLock.innerText = 'Syncing...';
                statLock.style.opacity = '0.7';
                signalBars.style.filter = 'hue-rotate(0deg) brightness(1.2)';
            } else {
                statLock.innerText = 'Optimal';
                statLock.style.opacity = '1';
                signalBars.style.filter = 'hue-rotate(90deg) brightness(1.5)'; // FLASH GREEN
            }
        }

        discoveryPool.forEach(item => {
            const destPoint = map.latLngToContainerPoint(item.coords);
            const distPx = centerPoint.distanceTo(destPoint);

            if (item.roadPoints && !item.roadFullyDiscovered) {
                // EFFICIENT REVEAL: Use meters to avoid per-frame projection math
                const revealed = item.roadPoints.filter(p => p.dist <= currentRadiusMeters).map(p => p.latlng);

                if (revealed.length > item.lastRevealedCount) {
                    item.polyline.setLatLngs(revealed);
                    item.lastRevealedCount = revealed.length;
                }
                if (distPx <= currentPixelRadius) {
                    item.polyline.setLatLngs(item.roadPoints.map(p => p.latlng));
                    item.roadFullyDiscovered = true;
                }
            }

            if (distPx <= currentPixelRadius && !item.pingTriggered) {
                const tag = document.getElementById('marker-tag-' + item.id);
                if (tag) {
                    tag.style.visibility = 'visible';
                    tag.classList.remove('ping-active');
                    void tag.offsetWidth;
                    tag.classList.add('ping-active');
                    updateMissionStats(item);
                }
                item.pingTriggered = true;
            }
            if (progress < 0.05) { item.pingTriggered = false; }
        });
        requestAnimationFrame(globalDiscoveryLoop);
    }

    // 4.2 MISSION ANALYTICS ENGINE
    let discoveredPoints = 0;
    let totalDistance = 0;
    let totalDrivingTime = 0;
    const uniqueDiscoveries = new Set(); // PERMANENT RECORD FOR SESSION

    function updateMissionStats(destination) {
        // ALWAYS TRIGGER SYNC EFFECT FOR EVERY RADAR WAVE (User Preference)
        const lockEl = document.getElementById('stat-lock');
        if (lockEl) {
            lockEl.innerText = "Syncing...";
            lockEl.style.color = "#f1c40f"; // Gold during sync
            setTimeout(() => {
                lockEl.innerText = "Optimal";
                lockEl.style.color = ""; // Reset
            }, 800); // FASTER SYNC RESPONSE
        }

        // 1. DATA VALIDATION: Only calculate if we have real road data
        if (!destination.roadDist || !destination.roadTime) {
            console.warn(`YA-VanLife: Skipping stats for ${destination.id} - Road data pending.`);
            return;
        }

        // ONLY INCREMENT CALCULATION IF NOT ALREADY DISCOVERED THIS SESSION
        if (uniqueDiscoveries.has(destination.id)) return;

        uniqueDiscoveries.add(destination.id);
        discoveredPoints++;

        // 2. HIGH-PRECISION CALCULATION (Keep decimals internally)
        const roundTripKm = (destination.roadDist / 1000) * 2;
        totalDistance += roundTripKm;

        const roundTripTime = (destination.roadTime || 0) * 2;
        totalDrivingTime += roundTripTime;

        console.log(`YA-VanLife: Discovery Stats Updated. Point: ${destination.title}, Road Dist: ${destination.roadDist}m, Road Time: ${destination.roadTime}s`);

        // Update UI with Premium Formatting
        const distanceEl = document.getElementById('stat-distance');
        const timeEl = document.getElementById('stat-time');
        const campingEl = document.getElementById('stat-camping');

        if (distanceEl) {
            // SHOW ONE DECIMAL PLACE WITH LOCALE FORMATTING
            distanceEl.innerText = `${totalDistance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
        }
        if (timeEl) timeEl.innerText = formatDuration(totalDrivingTime);
        if (campingEl) campingEl.innerText = discoveredPoints;
    }

    function formatDuration(seconds) {
        if (!seconds) return "0h 0m";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    }

    function registerDiscovery(data) {
        const destDist = map.distance(vicenzaCoords, data.coords);

        // 1. PUSH TACTICAL DATA IMMEDIATELY (Ensures stats work even without road routing)
        const discoveryItem = {
            id: data.id,
            coords: L.latLng(data.coords), // STORE COORDINATES FOR REAL-TIME PIXEL TRACKING
            destDist: destDist,
            roadPoints: null,
            polyline: null,
            lastRevealedCount: 0,
            roadFullyDiscovered: false,
            pingTriggered: false
        };
        discoveryPool.push(discoveryItem);

        // 2. ATTEMPT ROAD ROUTING (Optimistic layer)
        if (typeof L.Routing === 'undefined') return;

        const plan = L.Routing.plan([L.latLng(vicenzaCoords), L.latLng(data.coords)], { createMarker: () => null, addWaypoints: false });
        const control = L.Routing.control({
            plan: plan,
            show: false,
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1',
                profile: 'driving',
                routingOptions: {
                    exclude: ['toll'] // AVOID TOLL ROADS FOR AUTHENTIC VAN LIFE
                }
            }),
            fitSelectedRoutes: false,
            lineOptions: { styles: [{ color: 'transparent', opacity: 0 }] }
        }).addTo(map);

        control.on('routesfound', (e) => {
            const route = e.routes[0];
            const coords = route.coordinates;
            const summary = route.summary;
            const poly = L.polyline([], { color: DISCOVERY_RED, opacity: 1, weight: 4, className: 'discovered-road' }).addTo(map);

            // STORE REAL ROAD DATA
            discoveryItem.roadPoints = coords.map(c => ({ latlng: c, dist: map.distance(vicenzaCoords, c) }));
            discoveryItem.roadDist = summary.totalDistance;
            discoveryItem.roadTime = summary.totalTime;
            discoveryItem.polyline = poly;
        });
    }

    // 5. MAIN RENDER
    L.marker(vicenzaCoords, { icon: L.divIcon({ html: '<i class="fas fa-home" style="color: #f1c40f; font-size: 1.2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));"></i>', className: 'custom-map-icon', iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(map);
    L.marker(vicenzaCoords, { icon: L.divIcon({ className: 'radar-pulse-icon', html: '<div class="radar-pulse"></div>', iconSize: [100, 100], iconAnchor: [50, 50] }), interactive: false }).addTo(map);

    travelDestinations.filter(d => d.active !== false).forEach(dest => {
        L.marker(dest.coords, {
            icon: L.divIcon({
                html: `
                <div class="custom-van-marker journey-tag" id="marker-tag-${dest.id}" style="visibility: hidden;">
                    <i class="fas fa-campground tent-icon-top"></i>
                    <i class="fas fa-van-shuttle van-icon-main"></i>
                    <span class="ya-text-overlay">YA</span>
                </div>`,
                className: 'custom-map-icon marker-ping',
                iconSize: [26, 32],
                iconAnchor: [13, 16],
                popupAnchor: [0, -16]
            })
        }).addTo(map).bindPopup(`
            <div class="van-popup-card glass">
                <img src="${dest.image}" alt="${dest.title}" class="van-popup-img">
                <div class="van-popup-body">
                    <div class="van-popup-title">${dest.title}</div>
                    <p class="van-popup-text">${dest.description}</p>
                    <div class="van-popup-links">
                        <a href="${dest.instagram}" target="_blank" class="van-popup-btn instagram"><i class="fa-brands fa-instagram"></i></a>
                        <a href="${dest.tiktok}" target="_blank" class="van-popup-btn tiktok"><i class="fa-brands fa-tiktok"></i></a>
                        <a href="${dest.youtube}" target="_blank" class="van-popup-btn youtube"><i class="fa-brands fa-youtube"></i></a>
                        <a href="https://www.google.com/maps/search/?api=1&query=${dest.coords[0]},${dest.coords[1]}" target="_blank" class="van-popup-btn maps"><i class="fas fa-location-dot"></i></a>
                    </div>
                </div>
            </div>
        `);
        registerDiscovery(dest);
    });

    radarStartTime = Date.now();
    document.body.classList.add('scanning');
    globalDiscoveryLoop();

    // 6. MISSION CONTROL READY
    console.log("YA-VanLife: Mission Control Root Engine Synchronized.");
});
