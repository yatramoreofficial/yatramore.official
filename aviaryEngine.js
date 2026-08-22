(function () {
'use strict';
const BIRD_QUIRK_POOLS = {
    raven: {
        id: "raven",
        name: "Raven",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em" style="vertical-align:-0.15em;"><path d="M21.5,10.5 c-2.1-1.3-5.3-2-8-0.5 c-1.1,0.6-2.5,1.8-3.5,2.5 c-2-2.5-4-4.5-6.5-6.5 c-0.5,1.5,0,3.5,1,5.5 c-1.5,1-3,2.5-3.5,4 c1.5,0,4-1,6.5-2.5 c1.5,2.5,3.5,4,6.5,4.5 c2-1.5,2.5-3.5,2-5.5 c1.5-1,3.5-1.5,5.5-1.5 C22.5,11.5,22,11,21.5,10.5z"/></svg>`,
        lottiePath: "/assets/animations/raven-flight.json",
        baseSpeed: 80,
        lazySpeed: 45,
        crashRate: 0.08,
        nightLocked: false,
        normalText: "Soaring swiftly through clear skies",
        resting: [
            { text: "Perched on a gargoyle admiring a shiny coin", icon: "🪙" },
            { text: "Scavenging blackberries in a quiet orchard", icon: "🍇" },
            { text: "Resting atop a stone watchtower", icon: "🏰" }
        ],
        lazy: [
            { text: "Gliding lazily on warm thermal updrafts", icon: "🌬️" },
            { text: "Flying in leisurely circles taunting a hawk", icon: "🪶" },
            { text: "Distracted by a glittering stream below", icon: "✨" }
        ]
    },
    owl: {
        id: "owl",
        name: "Owl",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="0.95em" height="0.95em" style="vertical-align:-0.15em;"><path d="M12,16C12.56,16.84 13.31,17.53 14.2,18L12,20.2L9.8,18C10.69,17.53 11.45,16.84 12,16M17,11.2A2,2 0 0,0 15,13.2A2,2 0 0,0 17,15.2A2,2 0 0,0 19,13.2C19,12.09 18.1,11.2 17,11.2M7,11.2A2,2 0 0,0 5,13.2A2,2 0 0,0 7,15.2A2,2 0 0,0 9,13.2C9,12.09 8.1,11.2 7,11.2M17,8.7A4,4 0 0,1 21,12.7A4,4 0 0,1 17,16.7A4,4 0 0,1 13,12.7A4,4 0 0,1 17,8.7M7,8.7A4,4 0 0,1 11,12.7A4,4 0 0,1 7,16.7A4,4 0 0,1 3,12.7A4,4 0 0,1 7,8.7M2.24,1C4,4.7 2.73,7.46 1.55,10.2C1.19,11 1,11.83 1,12.7A6,6 0 0,0 7,18.7C7.21,18.69 7.42,18.68 7.63,18.65L10.59,21.61L12,23L13.41,21.61L16.37,18.65C16.58,18.68 16.79,18.69 17,18.7A6,6 0 0,0 23,12.7C23,11.83 22.81,11 22.45,10.2C21.27,7.46 20,4.7 21.76,1C19.12,3.06 15.36,4.69 12,4.7C8.64,4.69 4.88,3.06 2.24,1Z"/></svg>`,
        lottiePath: "/assets/animations/owl-flight.json",
        baseSpeed: 80,
        lazySpeed: 30,
        crashRate: 0.05,
        nightLocked: true,
        normalText: "Gliding silently on nocturnal air currents",
        resting: [
            { text: "Fast asleep inside a hollow oak tree", icon: "🌳" },
            { text: "Dozing in the rafters of an abandoned barn", icon: "🏚️" },
            { text: "Preening feathers on a sheltered tavern roof", icon: "🪵" }
        ],
        lazy: [
            { text: "Squinting through daylight at a sluggish pace", icon: "🥱" },
            { text: "Hovering sleepily near a foggy pass", icon: "🌫️" },
            { text: "Taking heavy, tired wingbeats through midday heat", icon: "☀️" }
        ]
    },
    albatross: {
        id: "albatross",
        name: "Albatross",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em" style="vertical-align:-0.15em;"><path d="M22.8,11.5c-4.4-1.7-8.8-1.5-10.8,0.4c-2-1.9-6.4-2.1-10.8-0.4c-0.6,0.2-1.2,1-0.9,1.5 c0.4,0.6,1.2,0.6,1.8,0.3c3.5-1.5,6.7-1.4,8.5,0.2C11,14.1,11.5,15,12,15s1-0.9,1.4-1.5c1.8-1.6,5-1.7,8.5-0.2 c0.6,0.3,1.4,0.3,1.8-0.3C24,12.5,23.4,11.7,22.8,11.5z"/></svg>`,
        lottiePath: "/assets/animations/albatross-flight.json",
        baseSpeed: 110,
        lazySpeed: 50,
        shortDistCrashRate: 0.12,
        longDistCrashRate: 0.04,
        nightLocked: false,
        normalText: "Carving massive arcs through open sea winds",
        resting: [
            { text: "Floating calmly on ocean swells taking a nap", icon: "🌊" },
            { text: "Hitching a free ride atop a cargo ship mast", icon: "🚢" },
            { text: "Perched atop a coastal lighthouse railing", icon: "🏮" }
        ],
        lazy: [
            { text: "Dynamic soaring in wide, slow ocean loops", icon: "🪁" },
            { text: "Tracking a fishing trawler for fish scraps", icon: "🐟" },
            { text: "Drifting effortlessly along a soft sea breeze", icon: "☁️" }
        ]
    }
};
function sanitizeCoords(coords) {
    if (coords && typeof coords === "object") {
        const lat = Number(coords.lat);
        const lng = Number(coords.lng);
        if (!Number.isNaN(lat) && Number.isFinite(lat) && !Number.isNaN(lng) && Number.isFinite(lng)) {
            return { 
                lat: Number(lat.toFixed(4)), 
                lng: Number(lng.toFixed(4)) 
            };
        }
    }
    return null;
}
function getMirroredCoords(c1, c2) {
    const validC1 = sanitizeCoords(c1);
    const validC2 = sanitizeCoords(c2);
    const ABSOLUTE_FALLBACK = { lat: 28, lng: 77 };
    const origin = validC1 || validC2 || ABSOLUTE_FALLBACK;
    const dest = validC2 || validC1 || ABSOLUTE_FALLBACK;
    return { origin, dest };
}
function calculateDistanceKm(c1, c2) {
    const { origin, dest } = getMirroredCoords(c1, c2);
    const R = 6371;
    const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
    const dLon = ((dest.lng - origin.lng) * Math.PI) / 180;
    const a =
        Math.pow(Math.sin(dLat / 2), 2) +
        Math.cos((origin.lat * Math.PI) / 180) *
        Math.cos((dest.lat * Math.PI) / 180) *
        Math.pow(Math.sin(dLon / 2), 2);
    const rawDist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    return Math.max(60, rawDist); 
}
function generateFlightSchedule(birdType, distanceKm, now = new Date(), destCoords = null, senderCoords = null) {
    const pool = BIRD_QUIRK_POOLS[birdType] || BIRD_QUIRK_POOLS.raven;
    const isLazy = Math.random() < 0.20;
    const lazyItem = pool.lazy[Math.floor(Math.random() * pool.lazy.length)];
    const restItem = pool.resting[Math.floor(Math.random() * pool.resting.length)];
    const restDurationHours = 0.5 + Math.random() * 0.5;
    const distanceBeforeRestPct = 0.2 + Math.random() * 0.6;
    
    let totalDurationHours = 0;
    let events = [];
    
    if (senderCoords && destCoords && typeof window !== 'undefined' && window.biomeImageLoaded && window.biomePixelData) {
        const pathData = generateBirdPath('schedule_temp', senderCoords, destCoords, birdType);
        if (pathData && pathData.segments && pathData.segments.length > 0) {
            let flightDuration = pathData.flightDurationHours;
            if (isLazy) {
                flightDuration = distanceKm / pool.lazySpeed;
            }
            totalDurationHours = flightDuration + restDurationHours;
            
            let currentPct = 0;
            let restingInjected = false;
            
            for (let i = 0; i < pathData.segments.length; i++) {
                const seg = pathData.segments[i];
                let segPct = seg.duration / pathData.flightDurationHours;
                let segDistPct = seg.distance / pathData.totalDist;
                
                let icon = "🕊️";
                let text = pool.normalText;
                
                if (isLazy) {
                    text = lazyItem.text;
                    icon = lazyItem.icon;
                } else if (seg.hab === 'water' && birdType === 'albatross') {
                    text = "Gliding fast over the ocean waves";
                    icon = "🌊";
                } else if (seg.hab === 'forest') {
                    text = "Navigating through dense forest canopy";
                    icon = "🌲";
                } else if (seg.hab === 'mountain') {
                    text = "Scaling high mountain peaks";
                    icon = "⛰️";
                } else if (seg.hab === 'ice') {
                    text = "Braving freezing arctic winds";
                    icon = "❄️";
                } else if (birdType === 'owl') {
                    // Owl uses time-based logic, so we keep its default text
                    text = pool.normalText;
                }
                
                events.push({
                    type: isLazy ? "lazy_flight" : "flight",
                    speed: isLazy ? pool.lazySpeed : seg.speed,
                    start_pct: currentPct,
                    end_pct: currentPct + (seg.duration / totalDurationHours),
                    distance_pct_contribution: segDistPct,
                    status_text: text,
                    icon: icon,
                    habitat: seg.hab
                });
                
                currentPct += (seg.duration / totalDurationHours);
                
                if (!restingInjected && currentPct > distanceBeforeRestPct) {
                    events.push({
                        type: "resting",
                        speed: 0,
                        start_pct: currentPct,
                        end_pct: currentPct + (restDurationHours / totalDurationHours),
                        distance_pct_contribution: 0.0,
                        duration_mins: Math.round(restDurationHours * 60),
                        status_text: restItem.text,
                        icon: restItem.icon
                    });
                    currentPct += (restDurationHours / totalDurationHours);
                    restingInjected = true;
                }
            }
            
            if (events.length > 0) {
                events[events.length - 1].end_pct = 1.0;
            }
            
            return { durationHours: totalDurationHours, events };
        }
    }
    
    // FALLBACK IF NO PATH DATA
    let flightDurationHours = 0;
    let baseSpeed = pool.baseSpeed;
    if (birdType !== "owl") {
        baseSpeed = birdType === "albatross" ? (distanceKm > 500 ? 130 : 110) : pool.baseSpeed;
        flightDurationHours = distanceKm / baseSpeed;
    } else {
        let distanceRemaining = distanceKm;
        let currentTime = now.getTime();
        let destLngNum = destCoords ? Number(destCoords.lng) : NaN;
        let offsetHours = (!Number.isNaN(destLngNum) && Number.isFinite(destLngNum)) ? Math.round(destLngNum / 15) : 0;
        let iterations = 0;
        while (distanceRemaining > 0.01 && iterations < 1000) {
            iterations++;
            let date = new Date(currentTime);
            let utcHour = date.getUTCHours();
            let localHourDecimal = ((utcHour + offsetHours + 24) % 24) + (date.getUTCMinutes() / 60) + (date.getUTCSeconds() / 3600);
            let isNight = localHourDecimal >= 20 || localHourDecimal < 6;
            let speed = isNight ? 110 : 40;
            if (iterations === 1) baseSpeed = speed;
            let nextBoundaryHour = isNight ? 6 : 20;
            let hoursUntil = nextBoundaryHour - localHourDecimal;
            if (hoursUntil <= 0) hoursUntil += 24;
            let maxDist = speed * hoursUntil;
            if (distanceRemaining <= maxDist) {
                flightDurationHours += (distanceRemaining / speed);
                distanceRemaining = 0;
            } else {
                flightDurationHours += hoursUntil;
                distanceRemaining -= maxDist;
                currentTime += (hoursUntil * 3600 * 1000) + 10;
            }
        }
    }
    const finalSpeed = isLazy ? pool.lazySpeed : baseSpeed;
    if (isLazy) {
        flightDurationHours = distanceKm / finalSpeed;
    }
    totalDurationHours = flightDurationHours + restDurationHours;
    const distanceAfterRestPct = 1.0 - distanceBeforeRestPct;
    const flightBeforeRestHours = flightDurationHours * distanceBeforeRestPct;
    const restStartTimelinePct = flightBeforeRestHours / totalDurationHours;
    const restEndTimelinePct = (flightBeforeRestHours + restDurationHours) / totalDurationHours;
    
    events = [
        {
            type: isLazy ? "lazy_flight" : "flight",
            speed: finalSpeed,
            start_pct: 0.0,
            end_pct: restStartTimelinePct,
            distance_pct_contribution: distanceBeforeRestPct,
            status_text: isLazy ? lazyItem.text : pool.normalText,
            icon: isLazy ? lazyItem.icon : "🕊️"
        },
        {
            type: "resting",
            speed: 0,
            start_pct: restStartTimelinePct,
            end_pct: restEndTimelinePct,
            distance_pct_contribution: 0.0,
            duration_mins: Math.round(restDurationHours * 60),
            status_text: restItem.text,
            icon: restItem.icon
        },
        {
            type: isLazy ? "lazy_flight" : "flight",
            speed: finalSpeed,
            start_pct: restEndTimelinePct,
            end_pct: 1.0,
            distance_pct_contribution: distanceAfterRestPct,
            status_text: isLazy ? lazyItem.text : "Refreshed and picking up speed towards destination",
            icon: isLazy ? lazyItem.icon : "⚡"
        }
    ];
    return { durationHours: totalDurationHours, events };
}
function evaluateLiveFlightState(record, departedAtStr, estimatedArrivalStr, originCoords, destCoords, flightEvents, birdType) {
    const start = new Date(String(departedAtStr).replace(' ', 'T')).getTime();
    const end = new Date(String(estimatedArrivalStr).replace(' ', 'T')).getTime();
    const now = Date.now();
    const totalDuration = end - start;
    let timeProgress = 0.0;
    if (totalDuration > 0) {
        timeProgress = Math.min(1.0, Math.max(0.0, (now - start) / totalDuration));
    } else if (now >= start) {
        timeProgress = 1.0;
    }
    const hasCrashedData = record.crash_progress && record.crash_progress > 0;
    const isCrashedNow = hasCrashedData && timeProgress >= record.crash_progress;
    if (isCrashedNow) {
        return {
            progress: record.crash_progress,
            geoProgress: record.crash_progress,
            percent: Math.round(record.crash_progress * 100),
            currentCoords: record.crash_coords || null,
            currentSpeed: 0,
            statusText: record.crash_reason || "Bird intercepted!",
            statusIcon: "🪦",
            isResting: false,
            isLazy: false,
            isComplete: false,
            isCrashedNow: true,
            isWarningNow: false
        };
    }
    let isWarningNow = false;
    let warningReason = '';
    if (hasCrashedData && !isCrashedNow) {
        const crashTimeMs = start + (totalDuration * record.crash_progress);
        let seed = 0;
        if (record.id) {
            for (let i = 0; i < record.id.length; i++) {
                seed += record.id.charCodeAt(i);
            }
        }
        let warningOffsetMins = 1 + (seed % 120);
        const maxWarningMins = (totalDuration * record.crash_progress) / 60000 * 0.5;
        if (warningOffsetMins > maxWarningMins) {
            warningOffsetMins = Math.max(1, maxWarningMins); 
        }
        const warningTimeMs = crashTimeMs - (warningOffsetMins * 60000);
        if (now >= warningTimeMs && now < crashTimeMs) {
            isWarningNow = true;
            warningReason = getWarningReason(birdType);
        }
    }
    const safeEvents = (flightEvents && Array.isArray(flightEvents) && flightEvents.length > 0) ? flightEvents : null;
    const defaultPool = BIRD_QUIRK_POOLS[birdType] || BIRD_QUIRK_POOLS.raven;
    const fallbackEvent = { type: "flight", speed: defaultPool.baseSpeed, status_text: defaultPool.normalText, icon: "🕊️" };
    let geoProgress = 0.0;
    let activeEvent = null;
    const lookupProgress = Math.min(0.9999, timeProgress);
    if (safeEvents) {
        for (let i = 0; i < safeEvents.length; i++) {
            const event = safeEvents[i];
            if (lookupProgress >= event.start_pct && lookupProgress < event.end_pct) {
                activeEvent = event;
                const timeSpentInThisEvent = lookupProgress - event.start_pct;
                const eventDuration = event.end_pct - event.start_pct;
                const ratio = eventDuration > 0 ? (timeSpentInThisEvent / eventDuration) : 0;
                geoProgress += (event.distance_pct_contribution * ratio);
                break;
            } else if (lookupProgress >= event.end_pct) {
                geoProgress += event.distance_pct_contribution;
            }
        }
        if (!activeEvent) activeEvent = fallbackEvent;
    } else {
        geoProgress = lookupProgress;
        activeEvent = fallbackEvent;
    }
    const { origin, dest } = getMirroredCoords(originCoords, destCoords);
    const currentCoords = {
        lat: Number((origin.lat + (dest.lat - origin.lat) * geoProgress).toFixed(4)),
        lng: Number((origin.lng + (dest.lng - origin.lng) * geoProgress).toFixed(4))
    };
    return {
        progress: timeProgress,
        geoProgress: geoProgress,
        percent: Math.round(geoProgress * 100),
        currentCoords,
        currentSpeed: activeEvent.speed,
        statusText: isWarningNow ? warningReason : activeEvent.status_text,
        statusIcon: isWarningNow ? "⚠️" : activeEvent.icon,
        isResting: isWarningNow ? false : activeEvent.type === "resting",
        isLazy: isWarningNow ? false : activeEvent.type === "lazy_flight",
        isComplete: timeProgress >= 1.0,
        isCrashedNow: false,
        isWarningNow: isWarningNow
    };
}
function rollFlightOutcome(birdType, distanceKm, originCoords, destCoords) {
    let rate = BIRD_QUIRK_POOLS[birdType]?.crashRate || 0.05;
    if (birdType === "albatross") {
        rate = distanceKm > 500
            ? BIRD_QUIRK_POOLS.albatross.longDistCrashRate
            : BIRD_QUIRK_POOLS.albatross.shortDistCrashRate;
    }
    const willCrash = Math.random() < rate;
    let crashProgress = null;
    let crashCoords = null;
    if (willCrash) {
        crashProgress = parseFloat((0.1 + Math.random() * 0.8).toFixed(2));
        const { origin, dest } = getMirroredCoords(originCoords, destCoords);
        crashCoords = {
            lat: Number((origin.lat + (dest.lat - origin.lat) * crashProgress).toFixed(4)),
            lng: Number((origin.lng + (dest.lng - origin.lng) * crashProgress).toFixed(4))
        };
    }
    return { willCrash, crashProgress, crashCoords };
}
function getCrashReason(birdType, distanceKm, date) {
    const d = date || new Date();
    const hour = d.getHours();
    const isNight = hour >= 20 || hour < 6;
    if (birdType === "albatross") {
        if (distanceKm > 500) {
            const oceanic = [
                "Exhausted by a massive mid-ocean hurricane",
                "Lost bearings over the endless open sea"
            ];
            return oceanic[Math.floor(Math.random() * oceanic.length)];
        }
        const coastalInland = [
            "Collided with a coastal lighthouse in the fog",
            "Caught in a fishing trawler's net",
            "Stranded far inland from the sea breezes",
            "Disoriented by dense inland mountains"
        ];
        return coastalInland[Math.floor(Math.random() * coastalInland.length)];
    }
    if (birdType === "owl") {
        if (isNight) {
            const nightOwl = [
                "Blinded by unnatural city lights",
                "Ambushed by a predator of the night",
                "Lost sense of magnetic north in an aurora",
                "Collided with a glass spire in the dark"
            ];
            return nightOwl[Math.floor(Math.random() * nightOwl.length)];
        }
        const dayOwl = [
            "Mobbed by aggressive daytime crows",
            "Overheated and exhausted in the midday sun"
        ];
        return dayOwl[Math.floor(Math.random() * dayOwl.length)];
    }
    const ravenReasons = [
        "Intercepted by rival scouts",
        "Brought down by a falconer",
        "Caught in a hunter's snare",
        "Attacked by a territorial eagle",
        "Disoriented in a thunderstorm"
    ];
    return ravenReasons[Math.floor(Math.random() * ravenReasons.length)];
}
function getWarningReason(birdType) {
    if (birdType === "albatross") {
        const albatrossWarnings = [
            "Losing bearings over the open ocean...",
            "Battling massive hurricane-force winds...",
            "Struggling against a massive sea storm...",
            "Blown far off course by oceanic gales..."
        ];
        return albatrossWarnings[Math.floor(Math.random() * albatrossWarnings.length)];
    }
    if (birdType === "owl") {
        const owlWarnings = [
            "Being aggressively mobbed by daytime crows...",
            "Flying blindly into intense unnatural city lights...",
            "Losing altitude due to extreme exhaustion...",
            "Spotted a large predator circling nearby..."
        ];
        return owlWarnings[Math.floor(Math.random() * owlWarnings.length)];
    }
    const ravenWarnings = [
        "Flying into a heavy thunderstorm...",
        "Spotted rival scouts circling ahead...",
        "Struggling against unpredictable crosswinds...",
        "Evasive maneuvers... predator sighted!"
    ];
    return ravenWarnings[Math.floor(Math.random() * ravenWarnings.length)];
}
function generateSmudgedText(originalText) {
    if (!originalText || typeof originalText !== "string") return "";
    const smudges = ["[ink washed away]", "[torn fragment]", "[weather-stained]", "[illegible]"];
    const words = originalText.trim().split(/\s+/);
    return words.map((word) => {
        if (word.length > 3 && Math.random() < 0.35) {
            return smudges[Math.floor(Math.random() * smudges.length)];
        }
        return word;
    }).join(" ");
}
    // Offline Canvas Biome Reader
    let biomeCanvas = null;
    let biomeCtx = null;
    let biomeImageLoaded = false;
    let biomePixelData = null;
    
    function initBiomeCanvas() {
        if (biomeImageLoaded) return;
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            biomeCanvas = document.createElement('canvas');
            biomeCanvas.width = img.width;
            biomeCanvas.height = img.height;
            biomeCtx = biomeCanvas.getContext('2d');
            biomeCtx.drawImage(img, 0, 0);
            biomePixelData = biomeCtx.getImageData(0, 0, img.width, img.height).data;
            biomeImageLoaded = true;
            window.aviaryGeneratedPaths = {}; // Clear any blind straight lines cached while loading!
            console.log("Biome mask loaded successfully!");
            if (window.loadWorldMap && typeof window.loadWorldMap === 'function') window.loadWorldMap();
        };
        img.onerror = () => {
            console.error("Failed to load biome-mask.png. Birds will fly straight.");
        };
        img.src = 'Images/biome-mask-detailed.png?v=' + Date.now();
    }
    
    function getHabitatAtPixel(x, y) {
        if (!biomeImageLoaded || !biomePixelData) return 'land';
        const idx = (y * biomeCanvas.width + x) * 4;
        const r = biomePixelData[idx], g = biomePixelData[idx+1], b = biomePixelData[idx+2];
        
        const dist = (r1, g1, b1, r2, g2, b2) => (r1-r2)*(r1-r2) + (g1-g2)*(g1-g2) + (b1-b2)*(b1-b2);
        const targets = [
            { name: 'water', r: 0, g: 0, b: 255 },
            { name: 'forest', r: 0, g: 255, b: 0 },
            { name: 'desert', r: 255, g: 255, b: 0 },
            { name: 'mountain', r: 128, g: 128, b: 128 },
            { name: 'ice', r: 255, g: 255, b: 255 },
            { name: 'land', r: 255, g: 128, b: 0 }
        ];

        let closest = 'land';
        let minDist = Infinity;
        for (let i = 0; i < targets.length; i++) {
            const d = dist(r, g, b, targets[i].r, targets[i].g, targets[i].b);
            if (d < minDist) {
                minDist = d;
                closest = targets[i].name;
            }
        }
        return closest;
    }

    function getHabitatAt(lat, lng) {
        if (!biomeImageLoaded || !biomeCanvas) return 'land';
        let x = Math.floor(((lng + 180) / 360) * biomeCanvas.width);
        let y = Math.floor(((90 - lat) / 180) * biomeCanvas.height);
        if (x < 0) x = (x % biomeCanvas.width) + biomeCanvas.width;
        if (x >= biomeCanvas.width) x = x % biomeCanvas.width;
        if (y < 0) y = 0;
        if (y >= biomeCanvas.height) y = biomeCanvas.height - 1;
        return getHabitatAtPixel(x, y);
    }

    class MinHeap {
        constructor() { this.data = []; }
        push(val, priority) { this.data.push({val, priority}); this.up(this.data.length - 1); }
        pop() { 
            if (this.data.length === 0) return null;
            const top = this.data[0];
            const bottom = this.data.pop();
            if (this.data.length > 0) {
                this.data[0] = bottom;
                this.down(0);
            }
            return top.val;
        }
        up(i) {
            while (i > 0) {
                const p = (i - 1) >> 1;
                if (this.data[i].priority >= this.data[p].priority) break;
                const tmp = this.data[i]; this.data[i] = this.data[p]; this.data[p] = tmp;
                i = p;
            }
        }
        down(i) {
            const len = this.data.length;
            while ((i << 1) + 1 < len) {
                let left = (i << 1) + 1;
                let right = left + 1;
                let min = left;
                if (right < len && this.data[right].priority < this.data[left].priority) min = right;
                if (this.data[i].priority <= this.data[min].priority) break;
                const tmp = this.data[i]; this.data[i] = this.data[min]; this.data[min] = tmp;
                i = min;
            }
        }
        isEmpty() { return this.data.length === 0; }
    }

    function generateBirdPath(recordId, mOrigin, mDest, birdType) {
        if (window.aviaryGeneratedPaths && window.aviaryGeneratedPaths[recordId]) {
            return window.aviaryGeneratedPaths[recordId];
        }
        window.aviaryGeneratedPaths = window.aviaryGeneratedPaths || {};

        const w = biomeCanvas ? biomeCanvas.width : 512;
        const h = biomeCanvas ? biomeCanvas.height : 256;
        
        const lngToX = (lng) => {
            let x = Math.floor(((lng + 180) / 360) * w);
            if (x < 0) x = (x % w) + w;
            return x % w;
        };
        const latToY = (lat) => {
            let y = Math.floor(((90 - lat) / 180) * h);
            if (y < 0) y = 0;
            if (y >= h) y = h - 1;
            return y;
        };
        
        const xToLng = (x) => (x / w) * 360 - 180;
        const yToLat = (y) => 90 - (y / h) * 180;

        let startX = lngToX(mOrigin.lng);
        let startY = latToY(mOrigin.lat);
        let endX = lngToX(mDest.lng);
        let endY = latToY(mDest.lat);

        const getCost = (hab) => {
            if (birdType === 'albatross') {
                if (hab === 'water') return 1;
                if (hab === 'mountain' || hab === 'ice') return 30;
                if (hab === 'forest') return 12;
                return 8; // land, desert
            }
            if (birdType === 'owl') {
                if (hab === 'forest') return 1;
                if (hab === 'mountain') return 1.5; 
                if (hab === 'ice') return 10;
                if (hab === 'water') return 100;
                return 2; 
            }
            if (hab === 'land') return 1;
            if (hab === 'mountain') return 1.5;
            if (hab === 'desert') return 3;
            if (hab === 'ice') return 10;
            if (hab === 'water') return 100;
            return 3;
        };

        const getSpeed = (hab, durationOffsetHours = 0, lng = 0) => {
            if (birdType === 'albatross') return hab === 'water' ? 130 : 110;
            if (birdType === 'owl') {
                const now = new Date();
                const utcHour = now.getUTCHours();
                const offsetHours = Math.round(lng / 15);
                const localHourDecimal = ((utcHour + offsetHours + 24) % 24) + (now.getUTCMinutes() / 60) + durationOffsetHours;
                const currentLocalHour = localHourDecimal % 24;
                const isNight = currentLocalHour >= 20 || currentLocalHour < 6;
                return isNight ? 110 : 40;
            }
            return (hab === 'land' || hab === 'mountain') ? 80 : (hab === 'forest' ? 60 : 40);
        };

        let rawPath = [];
        
        if (biomeImageLoaded && biomePixelData && (startX !== endX || startY !== endY)) {
            const gScore = new Map();
            const parent = new Map();
            const openSet = new MinHeap();
            
            const toIdx = (x, y) => y * w + x;
            const startIdx = toIdx(startX, startY);
            const endIdx = toIdx(endX, endY);
            
            gScore.set(startIdx, 0);
            
            const isMobile = window.innerWidth <= 768;
            const multiplier = isMobile ? 5.0 : 1.0;

            const hScore = (x, y) => {
                let dx = Math.abs(x - endX);
                if (dx > w / 2) dx = w - dx; 
                let dy = Math.abs(y - endY);
                return Math.sqrt(dx*dx + dy*dy) * multiplier;
            };
            
            openSet.push(startIdx, hScore(startX, startY));
            
            const closedSet = new Set();
            let nodesVisited = 0;
            const t0 = performance.now();
            
            while (!openSet.isEmpty() && nodesVisited < 500000) {
                const curr = openSet.pop();
                if (closedSet.has(curr)) continue;
                closedSet.add(curr);
                
                nodesVisited++;
                if (curr === endIdx) break;
                
                const cx = curr % w;
                const cy = Math.floor(curr / w);
                
                const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
                for (let i=0; i<dirs.length; i++) {
                    let nx = cx + dirs[i][0];
                    let ny = cy + dirs[i][1];
                    
                    if (nx < 0) nx = w - 1;
                    if (nx >= w) nx = 0;
                    
                    if (ny < 0 || ny >= h) continue;
                    
                    const nIdx = toIdx(nx, ny);
                    const isDiag = i >= 4;
                    
                    const hab = getHabitatAtPixel(nx, ny);
                    const stepCost = getCost(hab) * (isDiag ? 1.414 : 1);
                    
                    const tentativeG = gScore.get(curr) + stepCost;
                    
                    if (!gScore.has(nIdx) || tentativeG < gScore.get(nIdx)) {
                        parent.set(nIdx, curr);
                        gScore.set(nIdx, tentativeG);
                        openSet.push(nIdx, tentativeG + hScore(nx, ny));
                    }
                }
            }
            
            let curr = endIdx;
            while (curr !== startIdx && parent.has(curr)) {
                rawPath.push({x: curr % w, y: Math.floor(curr / w)});
                curr = parent.get(curr);
            }
            rawPath.push({x: startX, y: startY});
            rawPath.reverse();
            const t1 = performance.now();
            console.log(`[A* Engine] Pathfinding finished in ${(t1 - t0).toFixed(2)}ms. Nodes visited: ${nodesVisited}. IsMobile: ${window.innerWidth <= 768}. Multiplier: ${window.innerWidth <= 768 ? 5.0 : 1.0}`);
        }
        
        if (rawPath.length === 0) {
            rawPath = [{x: startX, y: startY}, {x: endX, y: endY}];
        }

        let path = [];
        path.push({lat: mOrigin.lat, lng: mOrigin.lng, distFromStart: 0});
        
        for (let i = 1; i < rawPath.length; i += 1) {
            let pt = rawPath[i];
            let lat = yToLat(pt.y);
            let lng = xToLng(pt.x);
            
            let prevLng = path[path.length-1].lng;
            if (Math.abs(lng - prevLng) > 180) {
                continue;
            }
            path.push({lat, lng, distFromStart: 0});
        }
        
        path.push({lat: mDest.lat, lng: mDest.lng, distFromStart: 0});

        let totalDist = 0;
        let flightDurationHours = 0;
        
        const getDist = (p1, p2) => {
            const R = 6371; 
            const dLat = (p2.lat - p1.lat) * Math.PI / 180;
            const dLng = (p2.lng - p1.lng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
                      Math.sin(dLng/2) * Math.sin(dLng/2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        };

        if (path.length > 3) {
            let smoothed = [path[0]];
            for (let i = 1; i < path.length - 1; i++) {
                smoothed.push({
                    lat: (path[i-1].lat + path[i].lat + path[i+1].lat) / 3,
                    lng: (path[i-1].lng + path[i].lng + path[i+1].lng) / 3,
                    distFromStart: 0
                });
            }
            smoothed.push(path[path.length - 1]);
            path = smoothed;
        }

        path[0].distFromStart = 0;
        let segments = [];
        let currentSegment = null;
        let cumulativeDuration = 0;

        for (let i = 1; i < path.length; i++) {
            let d = getDist(path[i-1], path[i]);
            totalDist += d;
            path[i].distFromStart = totalDist;
            
            let px = lngToX(path[i].lng);
            let py = latToY(path[i].lat);
            let hab = getHabitatAtPixel(px, py);
            let speed = getSpeed(hab, cumulativeDuration, path[i].lng);
            let segmentDuration = (d / speed);
            
            if (!currentSegment || currentSegment.hab !== hab || currentSegment.speed !== speed) {
                if (currentSegment) {
                    currentSegment.endDist = totalDist - d;
                    currentSegment.endDuration = cumulativeDuration;
                    segments.push(currentSegment);
                }
                currentSegment = { hab, speed, startDist: totalDist - d, startDuration: cumulativeDuration, distance: 0, duration: 0 };
            }
            currentSegment.distance += d;
            currentSegment.duration += segmentDuration;
            cumulativeDuration += segmentDuration;
            flightDurationHours += segmentDuration;
        }
        
        if (currentSegment) {
            currentSegment.endDist = totalDist;
            currentSegment.endDuration = cumulativeDuration;
            segments.push(currentSegment);
        }
        
        if (flightDurationHours <= 0) flightDurationHours = 0.1;

        const result = { path, totalDist, flightDurationHours, segments };
        if (biomeImageLoaded && biomePixelData) {
            window.aviaryGeneratedPaths[recordId] = result;
            
            const keys = Object.keys(window.aviaryGeneratedPaths);
            if (keys.length > 300) {
                delete window.aviaryGeneratedPaths[keys[0]];
            }
        }
        return result;
    }

window.AviaryEngine = {
    BIRD_QUIRK_POOLS,
    sanitizeCoords,
    getMirroredCoords,
    calculateDistanceKm,
    generateFlightSchedule,
    evaluateLiveFlightState,
    rollFlightOutcome,
    getCrashReason,
    generateSmudgedText,
    initBiomeCanvas,
    getHabitatAtPixel,
    getHabitatAt,
    generateBirdPath
};
})();
