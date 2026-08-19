(function () {
'use strict';
const BIRD_QUIRK_POOLS = {
    raven: {
        id: "raven",
        name: "Raven",
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
function generateFlightSchedule(birdType, distanceKm, now = new Date(), destCoords = null) {
    const pool = BIRD_QUIRK_POOLS[birdType] || BIRD_QUIRK_POOLS.raven;
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
    const restDurationHours = 0.5 + Math.random() * 0.5;
    const isLazy = Math.random() < 0.20;
    const finalSpeed = isLazy ? pool.lazySpeed : baseSpeed;
    if (isLazy) {
        flightDurationHours = distanceKm / finalSpeed;
    }
    const totalDurationHours = flightDurationHours + restDurationHours;
    const distanceBeforeRestPct = 0.2 + Math.random() * 0.6;
    const distanceAfterRestPct = 1.0 - distanceBeforeRestPct;
    const flightBeforeRestHours = flightDurationHours * distanceBeforeRestPct;
    const restStartTimelinePct = flightBeforeRestHours / totalDurationHours;
    const restEndTimelinePct = (flightBeforeRestHours + restDurationHours) / totalDurationHours;
    const restItem = pool.resting[Math.floor(Math.random() * pool.resting.length)];
    const lazyItem = pool.lazy[Math.floor(Math.random() * pool.lazy.length)];
    const events = [
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
    const start = new Date(departedAtStr).getTime();
    const end = new Date(estimatedArrivalStr).getTime();
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
        percent: Math.round(timeProgress * 100),
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
window.AviaryEngine = {
    BIRD_QUIRK_POOLS,
    sanitizeCoords,
    getMirroredCoords,
    calculateDistanceKm,
    generateFlightSchedule,
    evaluateLiveFlightState,
    rollFlightOutcome,
    getCrashReason,
    generateSmudgedText
};
})();
