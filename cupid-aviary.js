(function () {
    'use strict';
    let AE = null; 
    let aviaryPanel = null;
    let activeTab = 'dispatch';
    let perchUpdateInterval = null;
    let mapUpdateInterval = null;
    function initAviary() {
        AE = window.AviaryEngine;
        if (!AE) {
            console.warn('[Aviary] Engine not loaded. Skipping init.');
            return;
        }
        aviaryPanel = document.getElementById('aviary-panel');
        if (!aviaryPanel) return;
        document.querySelectorAll('.aviary-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                switchAviaryTab(tab);
            });
        });
        const closeBtn = document.getElementById('aviary-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeAviaryPanel);
        const navBtn = document.getElementById('nav-aviary-btn');
        if (navBtn) navBtn.addEventListener('click', openAviaryPanel);
        const backdrop = document.getElementById('aviary-backdrop');
        if (backdrop) backdrop.addEventListener('click', closeAviaryPanel);
        const dispatchForm = document.getElementById('aviary-dispatch-form');
        if (typeof pb !== 'undefined' && pb) {
            try {
                pb.collection('bird_deliveries').unsubscribe('*');
                pb.collection('public_bird_map').unsubscribe('*');
            } catch (e) { console.warn("Cleanup failed", e); }
            pb.collection('bird_deliveries').subscribe('*', function (e) {
                if (activeTab === 'perch') loadPerch();
            });
            pb.collection('public_bird_map').subscribe('*', function (e) {
                if (activeTab === 'map') loadWorldMap();
            });
        }
        if (dispatchForm) dispatchForm.addEventListener('submit', handleDispatch);
        const detailsModal = document.getElementById('aviary-bird-details-modal');
        const detailsCloseBtn = document.getElementById('aviary-bird-details-close');
        const detailsSelectBtn = document.getElementById('aviary-bird-details-select-btn');
        let currentlyViewingBird = null;
        if (detailsCloseBtn) {
            detailsCloseBtn.addEventListener('click', () => {
                if (detailsModal) {
                    detailsModal.style.opacity = '0';
                    setTimeout(() => { detailsModal.style.display = 'none'; }, 200);
                }
            });
        }
        if (detailsSelectBtn) {
            detailsSelectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentlyViewingBird) {
                    document.querySelectorAll('.bird-select-card').forEach(c => c.classList.remove('active'));
                    currentlyViewingBird.classList.add('active');
                }
                if (detailsModal) {
                    detailsModal.style.opacity = '0';
                    setTimeout(() => { detailsModal.style.display = 'none'; }, 200);
                }
            });
        }
        document.querySelectorAll('.bird-select-card').forEach(card => {
            card.addEventListener('click', () => {
                currentlyViewingBird = card;
                const birdId = card.dataset.bird;
                const pool = window.AviaryEngine.BIRD_QUIRK_POOLS[birdId];
                const titleEl = document.getElementById('aviary-bird-details-name');
                const descEl = document.getElementById('aviary-bird-details-desc');
                const statsContainer = document.getElementById('aviary-bird-details-stats');
                const behaviorList = document.getElementById('aviary-bird-details-behaviors');
                const animContainer = document.getElementById('aviary-bird-details-anim');
                if (titleEl && pool) titleEl.textContent = pool.name;
                if (descEl && pool) descEl.textContent = pool.normalText;
                if (statsContainer && pool) {
                    statsContainer.innerHTML = '';
                    const createStat = (label, value) => `
                        <div style="font-size:0.85rem;color:var(--text-main);display:flex;align-items:center;gap:6px;">
                            <span style="color:var(--text-muted);">${label}:</span> <span style="font-weight:700;color:var(--brand-brown);">${value}</span>
                        </div>
                    `;
                    if (birdId === 'owl') {
                        statsContainer.innerHTML += createStat('Day Speed', '40 km/h');
                        statsContainer.innerHTML += createStat('Night Speed', '110 km/h');
                        statsContainer.innerHTML += createStat('Risk Rate', '5%');
                    } else if (birdId === 'albatross') {
                        statsContainer.innerHTML += createStat('Base Speed', '110 km/h');
                        statsContainer.innerHTML += createStat('Ocean Speed', '130 km/h');
                        statsContainer.innerHTML += createStat('Risk Rate', '4% - 12%');
                    } else {
                        statsContainer.innerHTML += createStat('Base Speed', `${pool.baseSpeed} km/h`);
                        statsContainer.innerHTML += createStat('Lazy Speed', `${pool.lazySpeed} km/h`);
                        statsContainer.innerHTML += createStat('Risk Rate', `${Math.round((pool.crashRate || 0.05) * 100)}%`);
                    }
                }
                if (behaviorList && pool) {
                    behaviorList.innerHTML = '';
                    const allBehaviors = [...(pool.resting || []), ...(pool.lazy || [])];
                    allBehaviors.forEach(b => {
                        const li = document.createElement('li');
                        li.style.display = 'flex';
                        li.style.gap = '8px';
                        li.innerHTML = `<span>${b.icon}</span> <span>${b.text}</span>`;
                        behaviorList.appendChild(li);
                    });
                }
                if (animContainer) {
                    animContainer.innerHTML = '';
                    const originalSvg = card.querySelector('svg');
                    if (originalSvg) {
                        const clonedSvg = originalSvg.cloneNode(true);
                        clonedSvg.setAttribute('width', '160');
                        clonedSvg.setAttribute('height', '120');
                        animContainer.appendChild(clonedSvg);
                    }
                }
                if (detailsModal) {
                    detailsModal.style.display = 'flex';
                    setTimeout(() => { detailsModal.style.opacity = '1'; }, 10);
                }
            });
        });
        const letterInput = document.getElementById('aviary-letter-input');
        const letterCounter = document.getElementById('aviary-letter-counter');
        if (letterInput && letterCounter) {
            letterInput.addEventListener('input', () => {
                const len = letterInput.value.length;
                letterCounter.textContent = `${len}/1000`;
                letterCounter.style.color = len > 900 ? '#f44336' : 'var(--text-muted)';
            });
        }
    }
    function openAviaryPanel() {
        if (!aviaryPanel) return;
        const backdrop = document.getElementById('aviary-backdrop');
        if (backdrop) { backdrop.style.display = 'block'; setTimeout(() => { backdrop.style.opacity = '1'; }, 10); }
        aviaryPanel.style.display = 'flex';
        setTimeout(() => aviaryPanel.classList.add('open'), 10);
        switchAviaryTab('dispatch');
        if (window.loadAviaryRecipients) window.loadAviaryRecipients();
    }
    function closeAviaryPanel() {
        if (!aviaryPanel) return;
        const backdrop = document.getElementById('aviary-backdrop');
        if (backdrop) { backdrop.style.opacity = '0'; setTimeout(() => { backdrop.style.display = 'none'; }, 300); }
        aviaryPanel.classList.remove('open');
        setTimeout(() => { aviaryPanel.style.display = 'none'; }, 300);
        if (perchUpdateInterval) clearInterval(perchUpdateInterval);
        if (mapUpdateInterval) clearInterval(mapUpdateInterval);
    }
    function switchAviaryTab(tab) {
        if (window.aviaryMapResizeInterval) clearInterval(window.aviaryMapResizeInterval);
        activeTab = tab;
        document.querySelectorAll('.aviary-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.aviary-tab-content').forEach(c => c.style.display = 'none');
        const activeBtn = document.querySelector(`.aviary-tab-btn[data-tab="${tab}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        const activeContent = document.getElementById(`aviary-tab-${tab}`);
        if (activeContent) activeContent.style.display = 'flex';
        if (tab === 'perch') loadMyPerch();
        if (tab === 'map') {
            loadWorldMap();
            if (window.aviaryLeafletMap) {
                requestAnimationFrame(() => window.aviaryLeafletMap.invalidateSize());
                let attempts = 0;
                window.aviaryMapResizeInterval = setInterval(() => {
                    if (window.aviaryLeafletMap) window.aviaryLeafletMap.invalidateSize();
                    if (++attempts > 10) clearInterval(window.aviaryMapResizeInterval);
                }, 50);
            }
        }
    }
    async function handleDispatch(e) {
        e.preventDefault();
        if (!pb || !pb.authStore.isValid || !currentUser) return;
        const submitBtn = document.getElementById('aviary-dispatch-btn');
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Releasing...';
        try {
            const letterText = document.getElementById('aviary-letter-input').value.trim();
            if (!letterText || letterText.length > 1000) {
                throw new Error('Letter must be between 1 and 1000 characters.');
            }
            const selectedBird = document.querySelector('.bird-select-card.active');
            if (!selectedBird) throw new Error('Please select a bird.');
            const birdType = selectedBird.dataset.bird;
            const recipientId = document.getElementById('aviary-recipient-select').value;
            if (!recipientId) throw new Error('Please select a recipient.');
            if (recipientId === currentUser.id) throw new Error('Cannot send a letter to yourself.');
            const recipient = await pb.collection('users').getOne(recipientId);
            let senderCoords = null;
            let recipientCoords = null;
            try {
                senderCoords = { lat: parseFloat(currentUser.city_lat || 0), lng: parseFloat(currentUser.city_lng || 0) };
                if (!senderCoords.lat && !senderCoords.lng) senderCoords = null;
            } catch (e) { senderCoords = null; }
            try {
                recipientCoords = { lat: parseFloat(recipient.city_lat || 0), lng: parseFloat(recipient.city_lng || 0) };
                if (!recipientCoords.lat && !recipientCoords.lng) recipientCoords = null;
            } catch (e) { recipientCoords = null; }
            const distanceKm = AE.calculateDistanceKm(senderCoords, recipientCoords);
            const now = new Date();
            const hour = now.getHours();
            const isNight = hour >= 20 || hour < 6;
            const isNightLocked = birdType === 'owl';
            const { willCrash, crashProgress, crashCoords } = AE.rollFlightOutcome(birdType, distanceKm, senderCoords, recipientCoords);
            const crashReason = willCrash ? AE.getCrashReason(birdType, distanceKm, now) : '';
            const smudgedText = willCrash ? AE.generateSmudgedText(letterText) : '';
            const schedule = AE.generateFlightSchedule(birdType, distanceKm, now, recipientCoords);
            const departedAt = now.toISOString();
            const estimatedArrival = new Date(now.getTime() + schedule.durationHours * 3600 * 1000).toISOString();
            const burnOnCrash = document.getElementById('aviary-burn-toggle')?.checked || false;
            const rescueTarget = willCrash ? 2 : 0;
            const record = await pb.collection('bird_deliveries').create({
                sender: currentUser.id,
                recipient: recipientId,
                bird_type: birdType,
                origin_city: currentUser.city || 'Unknown',
                origin_coords: senderCoords,
                dest_city: recipient.city || 'Unknown',
                dest_coords: recipientCoords,
                departed_at: departedAt,
                estimated_arrival: estimatedArrival,
                is_night_locked: isNightLocked,
                burn_on_crash: burnOnCrash,
                letter_original: letterText,
                letter_smudged: smudgedText,
                status: willCrash ? 'crashed' : 'flying',
                crash_progress: crashProgress,
                crash_coords: crashCoords,
                crash_reason: crashReason,
                flight_events: schedule.events,
                rescue_count: 0,
                rescue_target: rescueTarget,
                rescued_by: []
            });
            document.getElementById('aviary-letter-input').value = '';
            document.getElementById('aviary-letter-counter').textContent = '0/1000';
            document.querySelectorAll('.bird-select-card').forEach(c => c.classList.remove('active'));
            const pool = AE.BIRD_QUIRK_POOLS[birdType];
            showAviaryToast(`${pool.name} released! Your letter is on its way. ETA: ${Math.round(schedule.durationHours)}h`, 'success');
            switchAviaryTab('perch');
        } catch (err) {
            showAviaryToast(err.message || 'Failed to dispatch bird.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-feather-pointed"></i> Release Bird';
        }
    }
    async function loadMyPerch() {
        const container = document.getElementById('aviary-perch-list');
        if (!container || !pb || !currentUser) return;
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Loading your birds...</div>';
        try {
            const records = await pb.collection('bird_deliveries').getList(1, 50, {
                filter: `sender = '${currentUser.id}' || recipient = '${currentUser.id}'`,
                sort: '-created',
                requestKey: null
            });
            if (!records.items.length) {
                container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted)"><i class="fa-solid fa-dove" style="font-size:2rem;margin-bottom:1rem;display:block;opacity:0.3"></i>No birds in your perch yet.<br>Send your first letter!</div>';
                return;
            }
            container.innerHTML = '';
            for (const record of records.items) {
                container.appendChild(renderPerchCard(record));
            }
            if (perchUpdateInterval) clearInterval(perchUpdateInterval);
            perchUpdateInterval = setInterval(() => updatePerchCards(), 30000);
        } catch (err) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#f44336"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load birds.</div>';
        }
    }
    function renderPerchCard(record) {
        const pool = AE.BIRD_QUIRK_POOLS[record.bird_type] || AE.BIRD_QUIRK_POOLS.raven;
        const isSender = record.sender === currentUser.id;
        const direction = isSender ? 'Sent' : 'Received';
        const dirIcon = isSender ? 'fa-paper-plane' : 'fa-inbox';
        let statusHTML = '';
        let progressHTML = '';
        if (record.status === 'flying' || record.status === 'crashed') {
            const state = AE.evaluateLiveFlightState(
                record, record.departed_at, record.estimated_arrival,
                record.origin_coords, record.dest_coords,
                record.flight_events, record.bird_type
            );
            if (record.status === 'crashed' && state.isCrashedNow) {
                statusHTML = `<span style="color:#f44336"><i class="fa-solid fa-skull-crossbones"></i> ${escapeHtml(record.crash_reason || 'Crashed')}</span>`;
                if (record.rescue_target > 0) {
                    statusHTML += `<div style="margin-top:6px;font-size:0.8rem;color:var(--text-muted)">🛟 Rescue: ${record.rescue_count || 0}/${record.rescue_target} pushes</div>`;
                }
            } else {
                const statusColor = state.isWarningNow ? '#ff9800' : '#4caf50';
                statusHTML = `<span style="color:${statusColor}">${state.statusIcon} ${escapeHtml(state.statusText)}</span>`;
                progressHTML = `
                    <div class="aviary-progress-bar">
                        <div class="aviary-progress-fill" style="width:${state.percent}%; ${state.isWarningNow ? 'background:#ff9800' : ''}"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);margin-top:4px">
                        <span>${escapeHtml(record.origin_city)}</span>
                        <span>${state.currentSpeed} km/h • ${state.percent}%</span>
                        <span>${escapeHtml(record.dest_city)}</span>
                    </div>`;
            }
        } else if (record.status === 'delivered') {
            if (record.is_night_locked && record.bird_type === 'owl') {
                const h = new Date().getHours();
                const isNow = h >= 20 || h < 6;
                if (!isSender && !isNow) {
                    statusHTML = `<span style="color:#7c4dff"><i class="fa-solid fa-lock"></i> 🌙 Midnight Letter — Unlocks at 8:00 PM</span>`;
                } else {
                    statusHTML = `<span style="color:#4caf50"><i class="fa-solid fa-check-double"></i> Delivered</span>`;
                }
            } else {
                statusHTML = `<span style="color:#4caf50"><i class="fa-solid fa-check-double"></i> Delivered</span>`;
            }
        } else if (record.status === 'rescued') {
            statusHTML = `<span style="color:#ff9800"><i class="fa-solid fa-hands-helping"></i> Rescued by the community!</span>`;
        } else if (record.status === 'degraded') {
            statusHTML = `<span style="color:var(--text-muted)"><i class="fa-solid fa-ghost"></i> Letter degraded beyond recovery</span>`;
        }
        const card = document.createElement('div');
        card.className = 'aviary-perch-card';
        card.dataset.deliveryId = record.id;
        card.innerHTML = `
            <div class="aviary-perch-card-header">
                <span style="font-size:1.2rem">${pool.resting[0]?.icon || '🐦'}</span>
                <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:0.9rem">${escapeHtml(pool.name)}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)"><i class="fa-solid ${dirIcon}"></i> ${direction} • ${escapeHtml(record.origin_city)} → ${escapeHtml(record.dest_city)}</div>
                </div>
                <span class="aviary-status-badge aviary-status-${record.status}">${record.status}</span>
            </div>
            <div class="aviary-perch-card-status">${statusHTML}</div>
            ${progressHTML}
            ${(record.status === 'delivered' || record.status === 'rescued') && !isSender ? renderLetterContent(record) : ''}
        `;
        return card;
    }
    function renderLetterContent(record) {
        if (record.is_night_locked && record.bird_type === 'owl') {
            const h = new Date().getHours();
            const isNightNow = h >= 20 || h < 6;
            if (!isNightNow) {
                return `<div class="aviary-letter-locked"><i class="fa-solid fa-moon"></i> This letter can only be read under the stars. Come back after 8 PM.</div>`;
            }
        }
        const letterText = record.status === 'rescued' ? (record.letter_smudged || record.letter_original) : record.letter_original;
        return `
            <div class="aviary-letter-content">
                <div class="aviary-wax-seal" onclick="this.style.display='none';this.nextElementSibling.style.display='block'">
                    <i class="fa-solid fa-stamp"></i> Break the Wax Seal
                </div>
                <div class="aviary-letter-text" style="display:none">${escapeHtml(letterText)}</div>
            </div>`;
    }
    function updatePerchCards() {
        document.querySelectorAll('.aviary-perch-card').forEach(card => {
            const deliveryId = card.dataset.deliveryId;
        });
    }
    let aviaryLeafletMap = null;
    let aviaryMarkersLayer = null;
    window.aviaryMarkerRegistry = window.aviaryMarkerRegistry || {};
    window.aviaryPathRegistry = window.aviaryPathRegistry || {};
    function getBirdSVG(type, status, isFacingLeft) {
        let transform = isFacingLeft ? "scaleX(-1)" : "none";
        let svgContent = '';
        if (status === 'crashed') {
            svgContent = `
                <svg viewBox="0 0 100 100" width="50" height="50" style="overflow:visible;">
                    <!-- Tombstone -->
                    <path d="M 30 90 L 30 40 C 30 20 70 20 70 40 L 70 90 Z" fill="#9ca3af" stroke="#4b5563" stroke-width="2" />
                    <!-- Cross on Tombstone -->
                    <line x1="50" y1="35" x2="50" y2="55" stroke="#4b5563" stroke-width="3" />
                    <line x1="42" y1="42" x2="58" y2="42" stroke="#4b5563" stroke-width="3" />
                    <!-- Dirt Mound -->
                    <ellipse cx="50" cy="90" rx="35" ry="10" fill="#78350f" />
                    <!-- Rolled Letter -->
                    <g transform="translate(40, 75) rotate(-15)">
                        <!-- Scroll body -->
                        <rect x="0" y="0" width="25" height="12" rx="3" fill="#fef3c7" stroke="#d97706" stroke-width="1" />
                        <!-- Red Ribbon -->
                        <rect x="10" y="0" width="4" height="12" fill="#ef4444" />
                        <!-- Smudge / Burn mark -->
                        <circle cx="20" cy="6" r="3" fill="#451a03" opacity="0.6" />
                    </g>
                </svg>
            `;
            return `<div class="bird-map-marker bird-crashed">${svgContent}</div>`;
        }
        if (type === 'raven') {
            const flapAnim = status === 'flying' ? 'animation: ravenFlapBack 0.5s ease-in-out infinite;' : 'transform: rotate(20deg) scaleY(0.2);';
            const flapFrontAnim = status === 'flying' ? 'animation: ravenFlapFront 0.5s ease-in-out infinite;' : 'transform: rotate(-10deg) scaleY(0.2);';
            const bodyAnim = status === 'flying' ? 'animation: ravenFlyCycle 3s ease-in-out infinite;' : 'transform: rotate(15deg);';
            svgContent = `
                <svg viewBox="0 0 140 100" width="60" height="45" style="transform: ${transform}; overflow:visible;">
                    <g style="${bodyAnim} transform-origin: center;">
                        <!-- Back Wing -->
                        <g style="transform-origin: 48px 40px; ${flapAnim}">
                            <path d="M 48 40 C 35 15 30 -5 50 -10 C 65 5 62 25 48 40 Z" fill="#27272b" />
                        </g>
                        <!-- Tail -->
                        <g fill="#0f0b17">
                            <path d="M 28 48 C 10 44 -2 38 -8 44 C 4 52 18 54 28 50 Z" />
                        </g>
                        <!-- Torso -->
                        <path d="M 28 46 C 28 32 45 28 65 34 C 76 38 80 48 74 58 C 65 68 38 65 28 46 Z" fill="#1a1a1d" />
                        <!-- Head -->
                        <circle cx="76" cy="35" r="12" fill="#1a1a1d" />
                        <circle cx="80" cy="33" r="3.2" fill="#110d18" />
                        <path d="M 85 30 C 105 34 112 40 108 44 C 98 46 86 42 85 38 Z" fill="#181322" stroke="#322842" stroke-width="0.8" />
                        <!-- Front Wing -->
                        <g style="transform-origin: 52px 44px; ${flapFrontAnim}">
                            <path d="M 52 44 C 38 15 32 -10 58 -14 C 78 5 72 28 52 44 Z" fill="#393940" stroke="#7b68a3" stroke-width="0.7" />
                        </g>
                    </g>
                </svg>
            `;
        } else if (type === 'owl') {
            const flapAnimLeft = status === 'flying' ? 'animation: owlWingFlapLeft 3s ease-in-out infinite;' : 'transform: rotate(0deg) scale(0.24, 0.95) translate(22px, 14px);';
            const flapAnimRight = status === 'flying' ? 'animation: owlWingFlapRight 3s ease-in-out infinite;' : 'transform: rotate(0deg) scale(0.24, 0.95) translate(-22px, 14px);';
            const bodyAnim = status === 'flying' ? 'animation: owlDescendCycle 6s cubic-bezier(0.2, 0.9, 0.35, 1) infinite;' : 'transform: translateY(5px);';
            svgContent = `
                <svg viewBox="0 0 140 100" width="60" height="45" style="transform: ${transform}; overflow:visible;">
                    <g style="${bodyAnim} transform-origin: center;" transform="translate(15, 0)">
                        <!-- Left Wing -->
                        <g style="transform-origin: top right; ${flapAnimLeft}">
                            <path d="M 28 36 C 8 20 -4 40 10 60 C 20 70 28 50 28 36 Z" fill="#a46838" />
                        </g>
                        <!-- Right Wing -->
                        <g style="transform-origin: top left; ${flapAnimRight}">
                            <path d="M 62 36 C 82 20 94 40 80 60 C 70 70 62 50 62 36 Z" fill="#a46838" />
                        </g>
                        <!-- Torso -->
                        <ellipse cx="45" cy="52" rx="18" ry="20" fill="#f7ede2" />
                        <!-- Head -->
                        <g style="transform-origin: 45px 28px;">
                            <ellipse cx="45" cy="26" rx="20" ry="17" fill="#c58a55" />
                            <path d="M 45 14 C 32 3 20 14 26 27 C 32 38 45 42 45 42 C 45 42 58 38 64 27 C 70 14 58 3 45 14 Z" fill="#ffffff" stroke="#b07d4f" stroke-width="1.6" />
                            <circle cx="36" cy="25" r="4.2" fill="#0b0914" />
                            <circle cx="54" cy="25" r="4.2" fill="#0b0914" />
                            <path d="M 43 27 C 43 25 47 25 47 27 L 46 36 C 45 38 45 38 44 36 Z" fill="#e2b868" stroke="#a47828" stroke-width="0.6" />
                        </g>
                    </g>
                </svg>
            `;
        } else { 
            const flapAnimLeft = status === 'flying' ? 'animation: albatrossFlapGlideLeft 10s ease-in-out infinite;' : 'transform: rotate(-10deg) scaleY(0.2);';
            const flapAnimRight = status === 'flying' ? 'animation: albatrossFlapGlideRight 10s ease-in-out infinite;' : 'transform: rotate(10deg) scaleY(0.2);';
            const bodyAnim = status === 'flying' ? 'animation: albatrossBodyFlightCycle 10s ease-in-out infinite;' : 'transform: rotate(5deg);';
            svgContent = `
                <svg viewBox="0 0 210 100" width="75" height="35" style="transform: ${transform}; overflow:visible;">
                    <g style="${bodyAnim} transform-origin: center;">
                        <!-- Left Wing -->
                        <g style="transform-origin: 52px 34px; ${flapAnimLeft}">
                            <path d="M 52 34 C 18 20 -15 15 -35 22 C -10 32 25 40 46 42 Z" fill="#e2e8f0" />
                            <polygon points="-35,22 -28,27 -20,26" fill="#020617" />
                        </g>
                        <!-- Right Wing -->
                        <g style="transform-origin: 64px 34px; ${flapAnimRight}">
                            <path d="M 64 34 C 98 10 135 15 155 24 C 130 36 95 42 74 42 Z" fill="#334155" />
                            <polygon points="155,24 148,29 140,28" fill="#020617" />
                        </g>
                        <!-- Torso -->
                        <path d="M 30 40 C 30 30 48 26 72 32 C 85 36 88 44 80 50 C 65 56 30 52 30 40 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8" />
                        <circle cx="78" cy="34" r="9" fill="#ffffff" />
                        <circle cx="80" cy="32" r="2.4" fill="#0f172a" />
                        <path d="M 85 30 C 104 31 106 38 98 42 C 90 42 85 38 85 34 Z" fill="#fca5a5" stroke="#f43f5e" stroke-width="0.8" />
                    </g>
                </svg>
            `;
        }
        return `<div class="bird-map-marker ${status !== 'flying' ? 'bird-resting' : ''}">${svgContent}</div>`;
    }
    async function loadWorldMap() {
        const container = document.getElementById('aviary-map-container');
        if (!container || !pb) return;
        if (!aviaryLeafletMap) {
            container.innerHTML = '';
            container.style.height = "500px";
            aviaryLeafletMap = L.map('aviary-map-container', {
                center: [20, 0],
                zoom: 2,
                minZoom: 2,
                maxBounds: [[-90, -180], [90, 180]]
            });
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const tileUrl = isDark ?
                'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' :
                'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
            L.tileLayer(tileUrl, {
                attribution: '&copy; <a href="https://carto.com/">CartoDB</a>'
            }).addTo(aviaryLeafletMap);
            aviaryMarkersLayer = L.layerGroup().addTo(aviaryLeafletMap);
        }
        try {
            const records = await pb.collection('public_bird_map').getList(1, 200, {
                sort: '-updated',
                requestKey: null
            });
            if (!records.items.length) {
                return;
            }
            const currentRecordIds = new Set(records.items.map(r => r.id));
            for (const record of records.items) {
                const pool = AE.BIRD_QUIRK_POOLS[record.bird_type] || AE.BIRD_QUIRK_POOLS.raven;
                const origin = record.origin_coords || { lat: 28, lng: 77 };
                const dest = record.dest_coords || { lat: 28, lng: 77 };
                let currentLat = origin.lat;
                let currentLng = origin.lng;
                if (record.status === 'flying') {
                    const state = AE.evaluateLiveFlightState(
                        record, record.departed_at, record.estimated_arrival,
                        origin, dest, null, record.bird_type
                    );
                    const p = state.percent / 100;
                    currentLat = origin.lat + (dest.lat - origin.lat) * p;
                    currentLng = origin.lng + (dest.lng - origin.lng) * p;
                } else if (record.status === 'crashed' && record.crash_coords) {
                    currentLat = record.crash_coords.lat;
                    currentLng = record.crash_coords.lng;
                } else {
                    currentLat = dest.lat;
                    currentLng = dest.lng;
                }
                const pathCoords = [
                    [origin.lat, origin.lng],
                    [dest.lat, dest.lng]
                ];
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                if (!window.aviaryPathRegistry[record.id]) {
                    window.aviaryPathRegistry[record.id] = L.polyline(pathCoords, {
                        color: isDark ? '#ffffff' : '#000000',
                        weight: 1,
                        opacity: 0.2,
                        dashArray: '5, 10'
                    }).addTo(aviaryMarkersLayer);
                } else {
                    window.aviaryPathRegistry[record.id].setLatLngs(pathCoords).setStyle({ color: isDark ? '#ffffff' : '#000000' });
                }
                const isFacingLeft = dest.lng < origin.lng;
                const iconHtml = getBirdSVG(record.bird_type, record.status, isFacingLeft);
                const icon = L.divIcon({
                    html: iconHtml,
                    className: 'custom-bird-icon',
                    iconSize: [60, 45],
                    iconAnchor: [30, 22]
                });
                const safeName = escapeHtml(pool.name);
                let popupHtml = `<div style="text-align:center;font-family:inherit;">`;
                popupHtml += `<strong style="font-size:1.1rem;display:block;margin-bottom:4px;">${safeName}</strong>`;
                if (record.status === 'crashed') {
                    popupHtml += `<br><br><span style="color:#ef4444;font-weight:bold;"><i class="fa-solid fa-triangle-exclamation"></i> Crashed!</span>`;
                    popupHtml += `<br><span style="font-size:0.8rem;">${escapeHtml(record.crash_reason || '')}</span>`;
                    const alreadyRescued = record.rescued_by && record.rescued_by.includes(currentUser?.id);
                    if (alreadyRescued) {
                        popupHtml += `<br><button class="aviary-rescue-btn" disabled style="margin-top:10px;padding:5px 10px;background:#4caf50;color:white;border:none;border-radius:5px;"><i class="fa-solid fa-check"></i> Rescued (${record.rescue_count || 0}/2)</button>`;
                    } else {
                        popupHtml += `<br><button class="aviary-rescue-btn" data-delivery-id="${record.id}" onclick="window.aviaryRescue('${record.id}')" style="margin-top:10px;padding:5px 10px;background:#3b82f6;color:white;border:none;border-radius:5px;cursor:pointer;">Rescue Satchel</button>`;
                    }
                } else if (record.status === 'flying') {
                    popupHtml += `<br><br><span style="color:#10b981;font-weight:bold;"><i class="fa-solid fa-wind"></i> Flying</span>`;
                } else {
                    popupHtml += `<br><br><span style="color:#8b5cf6;font-weight:bold;"><i class="fa-solid fa-check-circle"></i> ${escapeHtml(record.status)}</span>`;
                }
                popupHtml += `</div>`;
                if (window.aviaryMarkerRegistry[record.id]) {
                    const marker = window.aviaryMarkerRegistry[record.id];
                    marker.setLatLng([currentLat, currentLng]);
                    marker.setIcon(icon);
                    marker.setPopupContent(popupHtml);
                } else {
                    const marker = L.marker([currentLat, currentLng], { icon: icon }).addTo(aviaryMarkersLayer);
                    marker.bindPopup(popupHtml);
                    window.aviaryMarkerRegistry[record.id] = marker;
                }
            }
            for (const id in window.aviaryMarkerRegistry) {
                if (!currentRecordIds.has(id)) {
                    aviaryMarkersLayer.removeLayer(window.aviaryMarkerRegistry[id]);
                    delete window.aviaryMarkerRegistry[id];
                }
            }
            for (const id in window.aviaryPathRegistry) {
                if (!currentRecordIds.has(id)) {
                    aviaryMarkersLayer.removeLayer(window.aviaryPathRegistry[id]);
                    delete window.aviaryPathRegistry[id];
                }
            }
            if (mapUpdateInterval) clearInterval(mapUpdateInterval);
            mapUpdateInterval = setInterval(() => loadWorldMap(), 30000);
        } catch (err) {
            console.error("Failed to load map:", err);
        }
    }
    window.aviaryRescue = async function (deliveryId) {
        if (!pb || !pb.authStore.isValid) return;
        const btn = document.querySelector(`.aviary-rescue-btn[data-delivery-id="${deliveryId}"]`);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        }
        try {
            const res = await fetch(`https://api.yatramore.com/api/aviary/rescue/${deliveryId}`, {
                method: 'POST',
                headers: { 'Authorization': pb.authStore.token }
            });
            const data = await res.json();
            if (res.status === 401) {
                throw new Error('Session expired. Please log in again to rescue birds.');
            }
            if (!res.ok) {
                throw new Error(data.message || 'Rescue failed.');
            }
            showAviaryToast(`Rescue push successful! (${data.count}/${data.target})`, 'success');
            if (btn) {
                btn.innerHTML = `<i class="fa-solid fa-check"></i> ${data.count}/${data.target}`;
                if (data.status === 'rescued') {
                    btn.innerHTML = '<i class="fa-solid fa-heart"></i> Saved!';
                    btn.style.background = '#4caf50';
                }
            }
        } catch (err) {
            showAviaryToast(err.message || 'Rescue failed.', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-hands-helping"></i> Rescue Satchel';
            }
        }
    };
    window.renderChatBirdPerch = async function (otherUserId) {
        const container = document.getElementById('chat-bird-perch');
        if (!container || !pb || !currentUser || !otherUserId) {
            if (container) container.style.display = 'none';
            return;
        }
        try {
            const filter = `(sender = '${currentUser.id}' && recipient = '${otherUserId}') || (sender = '${otherUserId}' && recipient = '${currentUser.id}')`;
            const records = await pb.collection('bird_deliveries').getList(1, 5, {
                filter: filter + " && (status = 'flying' || status = 'delivered' || status = 'rescued')",
                sort: '-created',
                requestKey: null
            });
            if (!records.items.length) {
                container.style.display = 'none';
                return;
            }
            const latest = records.items[0];
            const pool = AE.BIRD_QUIRK_POOLS[latest.bird_type] || AE.BIRD_QUIRK_POOLS.raven;
            if (latest.status === 'flying') {
                const state = AE.evaluateLiveFlightState(
                    latest, latest.departed_at, latest.estimated_arrival,
                    latest.origin_coords, latest.dest_coords,
                    latest.flight_events, latest.bird_type
                );
                if (state.isCrashedNow) {
                    container.style.display = 'flex';
                    container.innerHTML = `
                        <div class="chat-perch-inner crashed">
                            <span class="chat-perch-icon">🪦</span>
                            <div class="chat-perch-info">
                                <div class="chat-perch-title">${escapeHtml(pool.name)} — Crashed!</div>
                                <div class="chat-perch-detail">${escapeHtml(latest.crash_reason || 'Bird intercepted')}</div>
                            </div>
                        </div>`;
                    return;
                }
                const arrivalTime = new Date(latest.estimated_arrival).getTime();
                const remaining = arrivalTime - Date.now();
                const etaHours = Math.floor(remaining / 3600000);
                const etaMins = Math.floor((remaining % 3600000) / 60000);
                const etaText = remaining > 0 ? `ETA: ~${etaHours}h ${etaMins}m` : 'Arriving...';
                container.style.display = 'flex';
                container.innerHTML = `
                    <div class="chat-perch-inner ${state.isResting ? 'resting' : ''} ${state.isLazy ? 'lazy' : ''}">
                        <span class="chat-perch-icon">${state.statusIcon}</span>
                        <div class="chat-perch-info">
                            <div class="chat-perch-title">${escapeHtml(pool.name)} • ${state.statusIcon} ${escapeHtml(state.statusText)}</div>
                            <div class="aviary-progress-bar" style="margin:6px 0">
                                <div class="aviary-progress-fill" style="width:${state.percent}%"></div>
                            </div>
                            <div class="chat-perch-detail">
                                <span>${escapeHtml(latest.origin_city)} → ${escapeHtml(latest.dest_city)}</span>
                                <span>${state.currentSpeed} km/h ${state.isResting ? '(Resting)' : ''} • ${etaText}</span>
                            </div>
                        </div>
                    </div>`;
            } else if (latest.status === 'delivered' || latest.status === 'rescued') {
                if (latest.is_night_locked && latest.bird_type === 'owl') {
                    const h = new Date().getHours();
                    const isNightNow = h >= 20 || h < 6;
                    const iAmRecipient = latest.recipient === currentUser.id;
                    if (iAmRecipient && !isNightNow) {
                        container.style.display = 'flex';
                        container.innerHTML = `
                            <div class="chat-perch-inner midnight-locked">
                                <span class="chat-perch-icon">🌙</span>
                                <div class="chat-perch-info">
                                    <div class="chat-perch-title">Midnight Letter by ${escapeHtml(pool.name)}</div>
                                    <div class="chat-perch-detail" style="color:#7c4dff">Unlocks under the stars at 8:00 PM</div>
                                </div>
                                <i class="fa-solid fa-lock" style="color:#7c4dff;font-size:1.2rem"></i>
                            </div>`;
                        return;
                    }
                }
                container.style.display = 'flex';
                container.innerHTML = `
                    <div class="chat-perch-inner delivered">
                        <span class="chat-perch-icon">📜</span>
                        <div class="chat-perch-info">
                            <div class="chat-perch-title">${escapeHtml(pool.name)} — Letter Delivered!</div>
                            <div class="chat-perch-detail">Tap to read in My Perch</div>
                        </div>
                        <i class="fa-solid fa-stamp" style="color:var(--brand-brown);font-size:1.2rem"></i>
                    </div>`;
                container.onclick = () => { openAviaryPanel(); switchAviaryTab('perch'); };
            }
        } catch (err) {
            container.style.display = 'none';
        }
    };
    window.loadAviaryRecipients = async function () {
        const select = document.getElementById('aviary-recipient-select');
        if (!select || !pb || !currentUser) return;
        select.innerHTML = '<option value="">Loading matches...</option>';
        try {
            const matches = await pb.collection('matches').getList(1, 100, {
                filter: `user1 = '${currentUser.id}' || user2 = '${currentUser.id}'`,
                requestKey: null
            });
            select.innerHTML = '<option value="">— Select a match —</option>';
            for (const match of matches.items) {
                const otherId = match.user1 === currentUser.id ? match.user2 : match.user1;
                try {
                    const user = await pb.collection('users').getOne(otherId, { requestKey: null });
                    const safeName = escapeHtml(user.name || 'Unknown');
                    const opt = document.createElement('option');
                    opt.value = otherId;
                    opt.textContent = `${safeName} (${escapeHtml(user.city || 'Unknown')})`;
                    select.appendChild(opt);
                } catch (e) {  }
            }
            if (select.options.length <= 1) {
                select.innerHTML = '<option value="">No matches yet — find someone first!</option>';
            }
        } catch (err) {
            select.innerHTML = '<option value="">Failed to load matches</option>';
        }
    };
    function showAviaryToast(msg, type = 'info') {
        const existing = document.querySelector('.aviary-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = `aviary-toast aviary-toast-${type}`;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    function escapeHtml(str) {
        if (window.escapeHtml) return window.escapeHtml(str);
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    // ─── Boot ──────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAviary);
    } else {
        initAviary();
    }
})();
