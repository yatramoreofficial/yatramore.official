(function () {
    'use strict';
    let AE = null;
    let aviaryPanel = null;
    let activeTab = 'dispatch';
    let perchUpdateInterval = null;
    let mapUpdateInterval = null;

    function initAviary() {
        AE = window.AviaryEngine;
        if (AE && typeof AE.initBiomeCanvas === 'function') {
            AE.initBiomeCanvas();
        }
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
            } catch (e) { console.warn("Cleanup failed", e); }

            pb.collection('bird_deliveries').subscribe('*', function (e) {
                if (activeTab === 'perch') loadMyPerch();
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
                    } else if (birdId === 'raven') {
                        statsContainer.innerHTML += createStat('Top Speed', '80 km/h (Land)');
                        statsContainer.innerHTML += createStat('Min Speed', '40 km/h (Water)');
                        statsContainer.innerHTML += createStat('Risk Rate', '8%');
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
        const panel = document.getElementById('aviary-panel');
        if (panel) panel.setAttribute('data-active-tab', tab);
        document.querySelectorAll('.aviary-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.aviary-tab-content').forEach(c => c.style.display = 'none');
        const activeBtn = document.querySelector(`.aviary-tab-btn[data-tab="${tab}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        const activeContent = document.getElementById(`aviary-tab-${tab}`);
        if (activeContent) activeContent.style.display = 'flex';
        if (tab === 'perch') loadMyPerch();
        if (tab === 'collection') loadLetterCollection();
        if (tab === 'map') {
            loadWorldMap();
            if (aviaryLeafletMap) {
                requestAnimationFrame(() => aviaryLeafletMap.invalidateSize());
                let attempts = 0;
                window.aviaryMapResizeInterval = setInterval(() => {
                    if (aviaryLeafletMap) aviaryLeafletMap.invalidateSize();
                    if (++attempts > 12) clearInterval(window.aviaryMapResizeInterval);
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
            const schedule = AE.generateFlightSchedule(birdType, distanceKm, now, recipientCoords, senderCoords);
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
                expand: 'sender,recipient',
                requestKey: null
            });
            if (!records.items.length) {
                container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted)"><i class="fa-solid fa-dove" style="font-size:2rem;margin-bottom:1rem;display:block;opacity:0.3"></i>No birds in your perch yet.<br>Send your first letter!</div>';
                return;
            }
            container.innerHTML = '';
            let visibleCount = 0;
            for (const record of records.items) {
                const isSender = record.sender === currentUser.id;
                const isOpened = record.flight_events?.some(e =>
                    (isSender && (e.type === 'opened_sender' || e.type === 'hide_sender')) ||
                    (!isSender && (e.type === 'opened_recipient' || e.type === 'hide_recipient'))
                );
                const isActive = record.status === 'flying' || record.status === 'crashed';

                if (isActive || !isOpened) {
                    container.appendChild(renderPerchCard(record));
                    visibleCount++;
                }
            }
            if (visibleCount === 0) {
                container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted)"><i class="fa-solid fa-dove" style="font-size:2rem;margin-bottom:1rem;display:block;opacity:0.3"></i>No active birds in your perch. Check your Collection!</div>';
            }
            if (perchUpdateInterval) clearInterval(perchUpdateInterval);
            perchUpdateInterval = setInterval(() => updatePerchCards(), 30000);
        } catch (err) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#f44336"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load birds.</div>';
        }
    }

    async function loadLetterCollection() {
        const container = document.getElementById('aviary-collection-list');
        if (!container || !pb || !currentUser) return;
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Loading your collection...</div>';
        try {
            const records = await pb.collection('bird_deliveries').getList(1, 100, {
                filter: `(sender = '${currentUser.id}' || recipient = '${currentUser.id}') && (status = 'delivered' || status = 'rescued' || status = 'degraded')`,
                sort: '-created',
                expand: 'sender,recipient',
                requestKey: null
            });
            container.innerHTML = '';
            let visibleCount = 0;
            for (const record of records.items) {
                const isSender = record.sender === currentUser.id;
                const isOpened = record.flight_events?.some(e =>
                    (isSender && e.type === 'opened_sender') ||
                    (!isSender && e.type === 'opened_recipient')
                );
                const isHidden = record.flight_events?.some(e =>
                    (isSender && e.type === 'hide_sender') ||
                    (!isSender && e.type === 'hide_recipient')
                );


                if (isOpened && !isHidden) {
                    container.appendChild(renderCollectionCard(record));
                    visibleCount++;
                }
            }
            if (visibleCount === 0) {
                container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted)"><i class="fa-solid fa-book-open" style="font-size:2rem;margin-bottom:1rem;display:block;opacity:0.3"></i>No letters in your collection yet.</div>';
            }
        } catch (err) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#f44336"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load collection.</div>';
        }
    }

    function renderCollectionCard(record) {
        const pool = AE.BIRD_QUIRK_POOLS[record.bird_type] || AE.BIRD_QUIRK_POOLS.raven;
        const isSender = record.sender === currentUser.id;
        const otherUser = record.expand ? (isSender ? record.expand.recipient : record.expand.sender) : null;
        const otherUserName = otherUser ? (otherUser.name || 'Unknown User') : 'Unknown User';

        let directionStr = isSender ? `Sent to ${otherUserName}` : `Received from ${otherUserName}`;
        const dirIcon = isSender ? 'fa-paper-plane' : 'fa-inbox';
        let badgeText = record.status === 'rescued' ? 'RESCUED (SMUDGED)' : record.status.toUpperCase();

        const card = document.createElement('div');
        card.className = 'aviary-perch-card';
        card.style.border = '1px solid var(--brand-brown)';

        let letterHTML = '';
        if (record.is_night_locked && record.bird_type === 'owl') {
            const h = new Date().getHours();
            const isNightNow = h >= 20 || h < 6;
            if (!isNightNow) {
                letterHTML = `<div class="aviary-letter-locked"><i class="fa-solid fa-moon"></i> This letter can only be read under the stars. Come back after 8 PM.</div>`;
            } else {
                const text = record.status === 'rescued' ? (record.letter_smudged || record.letter_original) : record.letter_original;
                letterHTML = `<div class="aviary-letter-content" style="padding:15px; background:rgba(124, 77, 255, 0.05);"><div class="aviary-letter-text" style="display:block;">${escapeHtml(text).replace(/\\n/g, '<br>')}</div></div>`;
            }
        } else {
            const text = record.status === 'rescued' ? (record.letter_smudged || record.letter_original) : record.letter_original;
            letterHTML = `<div class="aviary-letter-content" style="padding:15px;"><div class="aviary-letter-text" style="display:block;">${escapeHtml(text).replace(/\\n/g, '<br>')}</div></div>`;
        }

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <div style="font-weight:600;font-size:0.9rem;display:flex;align-items:center;gap:8px;">
                        <span style="display:flex; align-items:center; width:30px; justify-content:center;">${getBirdSVG(record.bird_type, 'still', false)}</span>
                        ${escapeHtml(pool.name)}
                    </div>
                    <div style="font-size:0.75rem;color:var(--text-muted)"><i class="fa-solid ${dirIcon}"></i> ${escapeHtml(directionStr)}</div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                    <span class="aviary-status-badge aviary-status-${record.status}">${badgeText}</span>
                    <button onclick="
                        if(confirm('Delete this letter from your collection? It will remain in the database.')) {
                            this.disabled = true;
                            window.aviaryLogEvent('${record.id}', '${isSender ? 'hide_sender' : 'hide_recipient'}').then(() => {
                                this.closest('.aviary-perch-card').remove();
                                if(document.getElementById('aviary-collection-list').children.length === 0) {
                                    loadLetterCollection();
                                }
                            });
                        }
                    " style="background:none; border:none; color:#f44336; cursor:pointer; font-size:0.85rem;" title="Delete for me"><i class="fa-solid fa-trash-can"></i> Delete</button>
                </div>
            </div>
            ${letterHTML}
        `;
        return card;
    }

    function renderPerchCard(record) {
        const pool = AE.BIRD_QUIRK_POOLS[record.bird_type] || AE.BIRD_QUIRK_POOLS.raven;
        const isSender = record.sender === currentUser.id;

        const otherUser = record.expand ? (isSender ? record.expand.recipient : record.expand.sender) : null;
        const otherUserName = otherUser ? (otherUser.name || 'Unknown User') : 'Unknown User';
        const isDelivered = record.status === 'delivered' || record.status === 'rescued';

        let directionStr = '';
        if (isSender) {
            directionStr = isDelivered ? `Delivered to ${otherUserName}` : `Sent to ${otherUserName}`;
        } else {
            directionStr = isDelivered ? `Received from ${otherUserName}` : `Incoming from ${otherUserName}`;
        }
        const dirIcon = isSender ? 'fa-paper-plane' : 'fa-inbox';
        let statusHTML = '';
        let progressHTML = '';
        let badgeText = record.status.toUpperCase();
        let visualStatus = record.status;

        if (record.status === 'flying' || record.status === 'crashed') {
            const state = AE.evaluateLiveFlightState(
                record, record.departed_at, record.estimated_arrival,
                record.origin_coords, record.dest_coords,
                record.flight_events, record.bird_type
            );

            if (record.status === 'crashed' && !state.isCrashedNow) {
                visualStatus = 'flying';
                badgeText = state.currentSpeed === 0 ? 'RESTING' : 'IN TRANSIT';
            } else if (record.status === 'flying') {
                badgeText = state.currentSpeed === 0 ? 'RESTING' : 'IN TRANSIT';
            }

            if (visualStatus === 'crashed') {
                statusHTML = `<span style="color:#f44336"><i class="fa-solid fa-skull-crossbones"></i> ${escapeHtml(record.crash_reason || 'Crashed')}</span>`;
                if (record.rescue_target > 0) {
                    statusHTML += `<div style="margin-top:6px;font-size:0.8rem;color:var(--text-muted)">🛟 Rescue: ${record.rescue_count || 0}/${record.rescue_target} pushes</div>`;
                }
            } else {
                const statusColor = state.isWarningNow ? '#ff9800' : '#4caf50';
                statusHTML = `<span style="color:${statusColor}">${escapeHtml(state.statusIcon)} ${escapeHtml(state.statusText)}</span>`;
                progressHTML = `
                    <div style="display:flex; align-items:center; gap:8px; font-size:0.75rem; color:var(--text-muted); margin-top:8px;">
                        <span style="white-space:nowrap;">${escapeHtml(record.origin_city)}</span>
                        <div class="aviary-progress-bar" style="flex:1; margin:0;">
                            <div class="aviary-progress-fill" style="width:${state.percent}%; ${state.isWarningNow ? 'background:#ff9800' : ''}"></div>
                        </div>
                        <span style="white-space:nowrap;">${escapeHtml(record.dest_city)}</span>
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
        card.dataset.recordRaw = JSON.stringify(record);

        if (record.status === 'flying' || record.status === 'crashed') {
            card.style.cursor = 'pointer';
            card.onclick = (e) => {
                if (e.target.closest('.aviary-wax-seal')) return;


                const panel = document.getElementById('aviary-panel');
                if (panel && panel.classList.contains('minimized')) {
                    panel.classList.remove('minimized');
                    const minBtn = document.querySelector('.aviary-minimize-btn i');
                    if (minBtn) {
                        minBtn.classList.remove('fa-chevron-up');
                        minBtn.classList.add('fa-chevron-down');
                    }
                }

                switchAviaryTab('map');

                setTimeout(() => {
                    if (typeof aviaryLeafletMap !== 'undefined' && aviaryLeafletMap) {
                        const marker = window.aviaryMarkerRegistry && window.aviaryMarkerRegistry[record.id];
                        if (marker) {
                            aviaryLeafletMap.flyTo(marker.getLatLng(), 8, { duration: 1.0 });
                            setTimeout(() => marker.openPopup(), 1000);
                        } else {
                            const st = AE.evaluateLiveFlightState(
                                record, record.departed_at, record.estimated_arrival,
                                record.origin_coords, record.dest_coords,
                                record.flight_events, record.bird_type
                            );
                            if (st && st.currentCoords) {
                                aviaryLeafletMap.flyTo([st.currentCoords.lat, st.currentCoords.lng], 8, { duration: 1.0 });
                            }
                        }
                    }
                }, 300);
            };
        }

        let etaText = '';
        if (record.status === 'flying') {
            const etaDate = new Date(String(record.estimated_arrival).replace(' ', 'T'));
            const remaining = etaDate.getTime() - Date.now();


            const st = AE.evaluateLiveFlightState(
                record, record.departed_at, record.estimated_arrival,
                record.origin_coords, record.dest_coords,
                record.flight_events, record.bird_type
            );
            const extraStats = ` • ${st.currentSpeed} km/h • ${st.percent}%`;

            if (remaining > 0) {
                const etaDays = Math.floor(remaining / 86400000);
                const etaHours = Math.floor((remaining % 86400000) / 3600000);
                const etaMins = Math.floor((remaining % 3600000) / 60000);
                if (etaDays > 0) {
                    etaText = ` • ETA: ~${etaDays}d ${etaHours}h ${etaMins}m${extraStats}`;
                } else {
                    etaText = ` • ETA: ~${etaHours}h ${etaMins}m${extraStats}`;
                }
            } else {
                etaText = ` • Arriving...${extraStats}`;
            }
        }

        let iconMarginLeft = record.bird_type === 'albatross' ? '4px' : '-6px';
        card.innerHTML = `
            <div class="aviary-perch-card-header">
                <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:0.9rem;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        <span style="display:flex; align-items:center; width:46px; justify-content:center; margin-left:${iconMarginLeft};">${getBirdSVG(record.bird_type, visualStatus === 'crashed' ? 'crashed' : 'still', false, record.burn_on_crash)}</span>
                        ${escapeHtml(pool.name)}
                        <span style="font-size:0.8rem;font-weight:normal;">${statusHTML}</span>
                    </div>
                    <div style="font-size:0.75rem;color:var(--text-muted)"><i class="fa-solid ${dirIcon}"></i> ${escapeHtml(directionStr)}${etaText}</div>
                </div>
                <span class="aviary-status-badge aviary-status-${visualStatus}">${badgeText}</span>
            </div>
            ${progressHTML}
            ${(record.status === 'delivered' || record.status === 'rescued') && !isSender ? renderLetterContent(record) : ''}
            ${(record.status === 'delivered' || record.status === 'rescued') && isSender ? renderSenderAcknowledge(record) : ''}
        `;
        return card;
    }
    window.aviaryLogEvent = async function (recordId, eventType) {
        if (!pb || !currentUser) return;
        try {
            await fetch(`${pb.baseUrl}/api/aviary/log-event/${recordId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': pb.authStore.token
                },
                body: JSON.stringify({ type: eventType })
            });
        } catch (e) {
            console.error("Failed to log aviary event", e);
        }
    };

    function renderSenderAcknowledge(record) {
        return `
            <div class="aviary-letter-content" style="text-align:center; padding: 15px;">
                <p style="color:var(--text-muted); font-size:0.9rem; margin-top:0;">Your bird has safely delivered the letter!</p>
                <button onclick="
                    const btn = this;
                    btn.disabled = true;
                    btn.innerHTML = '<i class=\\'fa-solid fa-spinner fa-spin\\'></i> Moving...';
                    window.aviaryLogEvent('${record.id}', 'opened_sender').then(() => {
                        switchAviaryTab('collection');
                    });
                " class="btn" style="background:var(--bg-accent);color:var(--text-main);border:1px solid var(--glass-border);padding:8px 16px;border-radius:20px;font-size:0.85rem;cursor:pointer;">
                    <i class="fa-solid fa-book-open"></i> View in Collection
                </button>
            </div>`;
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
                <div class="aviary-wax-seal" onclick="
                    const seal = this;
                    seal.style.pointerEvents = 'none';
                    seal.innerHTML = '<i class=\\'fa-solid fa-spinner fa-spin\\'></i> Breaking...';
                    window.aviaryLogEvent('${record.id}', 'opened_recipient').then(() => {
                        seal.style.display='none';
                        seal.nextElementSibling.style.display='block';
                        setTimeout(() => { switchAviaryTab('collection'); }, 2500);
                    });
                ">
                    <i class="fa-solid fa-stamp"></i> Break the Wax Seal
                </div>
                <div class="aviary-letter-text" style="display:none">
                    <div style="margin-bottom:15px; color:var(--brand-brown); font-weight:600;"><i class="fa-solid fa-envelope-open-text"></i> Letter Opened! Moving to your Collection...</div>
                    ${escapeHtml(letterText).replace(/\\n/g, '<br>')}
                </div>
            </div>`;
    }
    function updatePerchCards() {
        document.querySelectorAll('.aviary-perch-card').forEach(card => {
            if (!card.dataset.recordRaw) return;
            const record = JSON.parse(card.dataset.recordRaw);
            if (record.status !== 'flying' && record.status !== 'crashed') return;

            const state = AE.evaluateLiveFlightState(
                record, record.departed_at, record.estimated_arrival,
                record.origin_coords, record.dest_coords,
                record.flight_events, record.bird_type
            );

            const fill = card.querySelector('.aviary-progress-fill');
            if (fill) {
                fill.style.width = `${state.percent}%`;
                fill.style.background = state.isWarningNow ? '#ff9800' : '';
            }


            const headerDiv = card.querySelector('.aviary-perch-card-header > div > div:nth-child(2)');
            if (headerDiv && record.status === 'flying') {
                const etaDate = new Date(String(record.estimated_arrival).replace(' ', 'T'));
                const remaining = etaDate.getTime() - Date.now();
                const extraStats = ` • ${state.currentSpeed} km/h • ${state.percent}%`;
                let etaText = ` • Arriving...${extraStats}`;
                if (remaining > 0) {
                    const etaDays = Math.floor(remaining / 86400000);
                    const etaHours = Math.floor((remaining % 86400000) / 3600000);
                    const etaMins = Math.floor((remaining % 3600000) / 60000);
                    etaText = etaDays > 0 ? ` • ETA: ~${etaDays}d ${etaHours}h ${etaMins}m${extraStats}` : ` • ETA: ~${etaHours}h ${etaMins}m${extraStats}`;
                }
                const isSender = record.sender === currentUser?.id;
                const otherUser = record.expand ? (isSender ? record.expand.recipient : record.expand.sender) : null;
                const otherUserName = otherUser ? (otherUser.name || 'Unknown User') : 'Unknown User';
                const isDelivered = record.status === 'delivered' || record.status === 'rescued';
                let directionStr = '';
                if (isSender) {
                    directionStr = isDelivered ? `Delivered to ${otherUserName}` : `Sent to ${otherUserName}`;
                } else {
                    directionStr = isDelivered ? `Received from ${otherUserName}` : `Incoming from ${otherUserName}`;
                }
                const dirIcon = isSender ? 'fa-paper-plane' : 'fa-inbox';
                headerDiv.innerHTML = `<i class="fa-solid ${dirIcon}"></i> ${escapeHtml(directionStr)}${etaText}`;
            }
        });
    }
    let aviaryLeafletMap = null;
    let aviaryMarkersLayer = null;
    window.aviaryMarkerRegistry = window.aviaryMarkerRegistry || {};
    window.aviaryPathRegistry = window.aviaryPathRegistry || {};
    function getBirdSVG(type, status, isFacingLeft, isBurned = false) {
        let transform = isFacingLeft ? "scaleX(-1)" : "none";
        let svgContent = '';

        if (status === 'crashed') {
            if (isBurned) {
                let ghostBird = '';
                if (type === 'raven') {
                    ghostBird = `
                    <div style="position:absolute; top: -15px; left: -10px; animation: floatGhost 3s ease-in-out infinite; ${floatDelay}">
                        <svg viewBox="0 0 140 100" width="100" height="70" style="overflow:visible;">
                            <g style="transform-origin: center;">
                                <g style="transform-origin: 48px 40px; animation: ravenFlapBack 1s infinite; ${flapDelay}">
                                    <path d="M 48 40 C 35 15 30 -5 50 -10 C 65 5 62 25 48 40 Z" fill="#27272b" />
                                </g>
                                <g fill="#0f0b17">
                                    <path d="M 30 48 L 0 38 L 10 48 L 0 58 L 30 52 Z" />
                                </g>
                                <path d="M 28 46 C 28 32 45 28 65 34 C 76 38 80 48 74 58 C 65 68 38 65 28 46 Z" fill="#1a1a1d" />
                                <circle cx="76" cy="35" r="12" fill="#1a1a1d" />
                                <circle cx="80" cy="33" r="3.2" fill="#110d18" />
                                <path d="M 85 30 C 105 34 112 40 108 44 C 98 46 86 42 85 38 Z" fill="#181322" stroke="#322842" stroke-width="0.8" />
                                <g style="transform-origin: 52px 44px; animation: ravenFlapFront 1s infinite; ${flapDelay}">
                                    <path d="M 52 44 C 38 15 32 -10 58 -14 C 78 5 72 28 52 44 Z" fill="#393940" stroke="#7b68a3" stroke-width="0.7" />
                                </g>
                            </g>
                        </svg>
                    </div>`;
                } else if (type === 'owl') {
                    ghostBird = `
                    <div style="position:absolute; top: -15px; left: -10px; animation: floatGhost 3.5s ease-in-out infinite; ${floatDelay}">
                        <svg viewBox="0 0 140 100" width="100" height="70" style="overflow:visible;">
                            <g style="transform-origin: center;">
                                <g style="transform-origin: 50px 40px; animation: owlSideFlapBack 1.2s infinite; ${flapDelay}">
                                    <path d="M 50 40 C 35 15 30 -5 50 -10 C 70 5 65 25 50 40 Z" fill="#784a28" />
                                </g>
                                <path d="M 28 48 C 15 44 5 38 0 44 C 10 52 20 54 28 50 Z" fill="#663c1f" />
                                <path d="M 28 46 C 28 25 45 25 65 30 C 80 34 85 45 78 55 C 65 70 38 65 28 46 Z" fill="#a46838" />
                                <path d="M 45 42 C 50 35 60 30 70 32 C 80 34 83 45 78 52 C 70 60 55 58 45 42 Z" fill="#f7ede2" />
                                <circle cx="72" cy="38" r="4" fill="#0b0914" />
                                <circle cx="68" cy="38" r="4" fill="#0b0914" />
                                <path d="M 80 40 C 85 42 88 44 85 46 Z" fill="#e2b868" />
                                <g style="transform-origin: 52px 42px; animation: owlSideFlapFront 1.2s infinite; ${flapDelay}">
                                    <path d="M 52 42 C 38 15 32 -10 60 -10 C 80 5 72 28 52 42 Z" fill="#8d562f" />
                                </g>
                            </g>
                        </svg>
                    </div>`;
                } else {
                    ghostBird = `
                    <div style="position:absolute; top: -15px; left: -25px; animation: floatGhost 4s ease-in-out infinite; ${floatDelay}">
                        <svg viewBox="0 0 210 100" width="120" height="60" style="overflow:visible;">
                            <g style="transform-origin: center;">
                                <g style="transform-origin: 52px 34px; animation: albatrossFlapGlideLeft 2s infinite; ${flapDelay}">
                                    <path d="M 52 34 C 18 20 -15 15 -35 22 C -10 32 25 40 46 42 Z" fill="#e2e8f0" />
                                    <polygon points="-35,22 -28,27 -20,26" fill="#020617" />
                                </g>
                                <g style="transform-origin: 64px 34px; animation: albatrossFlapGlideRight 2s infinite; ${flapDelay}">
                                    <path d="M 64 34 C 98 10 135 15 155 24 C 130 36 95 42 74 42 Z" fill="#cbd5e1" />
                                    <polygon points="155,24 148,29 140,28" fill="#020617" />
                                </g>
                                <path d="M 35 42 L 20 40 L 15 45 L 20 50 L 35 48 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8" />
                                <path d="M 30 40 C 30 30 48 26 72 32 C 85 36 88 44 80 50 C 65 56 30 52 30 40 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8" />
                                <circle cx="78" cy="34" r="9" fill="#ffffff" />
                                <circle cx="80" cy="32" r="2.4" fill="#0f172a" />
                                <path d="M 85 30 C 104 31 106 38 98 42 C 90 42 85 38 85 34 Z" fill="#fca5a5" stroke="#f43f5e" stroke-width="0.8" />
                            </g>
                        </svg>
                    </div>`;
                }
                
                let cracks = '';
                if (type === 'raven') {
                    cracks = `
                    <path d="M 45 30 L 40 40 L 50 50" stroke="#3f3f46" stroke-width="1.5" fill="none" />
                    <path d="M 55 50 L 50 60 L 60 70" stroke="#3f3f46" stroke-width="1.5" fill="none" />`;
                } else if (type === 'owl') {
                    cracks = `<path d="M 45 30 L 55 40 L 50 50" stroke="#3f3f46" stroke-width="1.5" fill="none" />`;
                } else {
                    cracks = `<path d="M 50 30 L 45 40 L 55 50" stroke="#3f3f46" stroke-width="1.5" fill="none" />`;
                }

                return `
                    <style>
                        @keyframes floatGhost { 0% { transform: translateY(0px) scale(0.35); filter: drop-shadow(0 0 4px #e0f2fe) brightness(2.5) grayscale(1) opacity(0.7); } 50% { transform: translateY(-8px) scale(0.35); filter: drop-shadow(0 0 8px #e0f2fe) brightness(2.5) grayscale(1) opacity(0.5); } 100% { transform: translateY(0px) scale(0.35); filter: drop-shadow(0 0 4px #e0f2fe) brightness(2.5) grayscale(1) opacity(0.7); } }
                        @keyframes ravenFlapBack { 0% { transform: rotate(0deg); } 50% { transform: rotate(-30deg); } 100% { transform: rotate(0deg); } }
                        @keyframes ravenFlapFront { 0% { transform: rotate(0deg); } 50% { transform: rotate(40deg); } 100% { transform: rotate(0deg); } }
                        @keyframes owlSideFlapBack { 0% { transform: rotate(0deg); } 50% { transform: rotate(-30deg); } 100% { transform: rotate(0deg); } }
                        @keyframes owlSideFlapFront { 0% { transform: rotate(0deg); } 50% { transform: rotate(40deg); } 100% { transform: rotate(0deg); } }
                        @keyframes albatrossFlapGlideLeft { 0% { transform: rotate(0deg); } 50% { transform: rotate(-20deg); } 100% { transform: rotate(0deg); } }
                        @keyframes albatrossFlapGlideRight { 0% { transform: rotate(0deg); } 50% { transform: rotate(20deg); } 100% { transform: rotate(0deg); } }
                    </style>
                    <div class="bird-map-marker bird-burned" style="display:flex; justify-content:center; align-items:center; width:100%; height:100%; position:relative; padding-bottom:5px;">
                        <div style="position:relative; width: 60px; height: 80px; display:flex; justify-content:center; align-items:flex-end;">
                            <svg viewBox="0 0 100 120" width="60" height="72" style="overflow:visible; filter: drop-shadow(0px 5px 5px rgba(0,0,0,0.6)); position:absolute; bottom:0;">
                                <ellipse cx="50" cy="110" rx="40" ry="10" fill="#09090b" opacity="0.7" />
                                <path d="M 20 110 L 20 50 Q 50 0 80 50 L 80 110 Z" fill="#52525b" stroke="#27272a" stroke-width="2" />
                                <path d="M 23 108 L 23 50 Q 50 5 77 50 L 77 108 Z" fill="#71717a" />
                                <text x="50" y="65" font-family="Times New Roman, serif" font-size="16" font-weight="900" fill="#27272a" text-anchor="middle" letter-spacing="2">R.I.P</text>
                                ${cracks}
                                <ellipse cx="50" cy="108" rx="20" ry="6" fill="#18181b" />
                                <path d="M 35 105 Q 50 95 65 105 L 60 112 Q 45 108 35 110 Z" fill="#27272a" />
                                <circle cx="45" cy="105" r="1.5" fill="#ef4444" opacity="0.8" />
                                <circle cx="55" cy="108" r="1" fill="#f97316" opacity="0.8" />
                                <circle cx="50" cy="103" r="1" fill="#ef4444" opacity="0.5" />
                            </svg>
                            ${ghostBird}
                        </div>
                    </div>
                `;
            }


            const scrollSVG = `
                <svg viewBox="0 0 120 120" width="30" height="30" style="overflow:visible; filter: drop-shadow(0px 8px 10px rgba(0,0,0,0.5)); transform: translateY(-5px);">
                    <ellipse cx="60" cy="95" rx="45" ry="12" fill="#000" opacity="0.4" />
                    <path d="M 20 85 L 85 45 Q 95 40 100 55 L 35 95 Q 25 100 20 85 Z" fill="#FFF3E0" stroke="#BCAAA4" stroke-width="1" />
                    <path d="M 20 85 Q 12 90 15 95 Q 25 100 35 95 L 20 85 Z" fill="#FFCC80" stroke="#BCAAA4" stroke-width="1" />
                    <path d="M 17 88 Q 25 85 28 92" stroke="#8D6E63" stroke-width="1.5" fill="none" />
                    <path d="M 45 70 L 65 57" stroke="#b91c1c" stroke-width="12" stroke-linecap="round" />
                    <circle cx="55" cy="62" r="14" fill="#991b1b" />
                    <circle cx="54" cy="61" r="12" fill="#dc2626" />
                    <circle cx="55" cy="62" r="8" fill="none" stroke="#7f1d1d" stroke-width="2" />
                    <path d="M 52 59 L 58 65 M 58 59 L 52 65" stroke="#fca5a5" stroke-width="2" stroke-linecap="round" />
                    <path d="M 55 74 C 58 74 60 78 55 80 C 50 78 52 74 55 74 Z" fill="#dc2626" />
                </svg>
            `;

            let crashedBirdSVG = '';
            if (type === 'raven') {
                crashedBirdSVG = `
                    <div style="animation: struggle 3s infinite;">
                        <svg viewBox="0 0 120 120" width="50" height="50">
                            <ellipse cx="60" cy="80" rx="50" ry="25" fill="#000" opacity="0.4" filter="blur(3px)" />
                            <g style="animation: flapGroundLeft 0.5s infinite; transform-origin: 50px 55px;">
                                <path d="M 50 55 Q 20 20 5 45 Q 20 70 45 70 Z" fill="#27272b" stroke="#1a1a1d" stroke-width="1" />
                            </g>
                            <g style="animation: flapGroundRight 0.5s infinite; transform-origin: 70px 55px;">
                                <path d="M 70 55 Q 100 20 115 45 Q 100 70 75 70 Z" fill="#27272b" stroke="#1a1a1d" stroke-width="1" />
                            </g>
                            <path d="M 50 90 L 45 105 M 45 105 L 42 110 M 45 105 L 48 110" stroke="#f59e0b" stroke-width="2" fill="none" />
                            <path d="M 70 90 L 75 105 M 75 105 L 72 110 M 75 105 L 78 110" stroke="#f59e0b" stroke-width="2" fill="none" />
                            <ellipse cx="60" cy="70" rx="20" ry="25" fill="#1a1a1d" />
                            <path d="M 45 70 Q 60 85 75 70 Q 60 55 45 70 Z" fill="#27272b" />
                            <circle cx="60" cy="45" r="16" fill="#1a1a1d" />
                            <path d="M 52 40 L 56 44 M 56 40 L 52 44" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" />
                            <path d="M 64 40 L 68 44 M 68 40 L 64 44" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" />
                            <polygon points="56,48 64,48 60,65" fill="#393940" />
                        </svg>
                    </div>
                `;
            } else if (type === 'owl') {
                crashedBirdSVG = `
                    <div style="animation: struggle 3s infinite; animation-delay: 1s;">
                        <svg viewBox="0 0 120 120" width="50" height="50">
                            <ellipse cx="60" cy="80" rx="55" ry="25" fill="#000" opacity="0.4" filter="blur(3px)" />
                            <g style="animation: flapGroundLeft 0.7s infinite; transform-origin: 45px 55px;">
                                <path d="M 45 55 Q 15 25 5 55 Q 25 80 45 75 Z" fill="#784a28" stroke="#5c381c" stroke-width="2" />
                            </g>
                            <g style="animation: flapGroundRight 0.7s infinite; transform-origin: 75px 55px;">
                                <path d="M 75 55 Q 105 25 115 55 Q 95 80 75 75 Z" fill="#784a28" stroke="#5c381c" stroke-width="2" />
                            </g>
                            <path d="M 45 90 L 40 100" stroke="#f59e0b" stroke-width="3" />
                            <path d="M 75 90 L 80 100" stroke="#f59e0b" stroke-width="3" />
                            <ellipse cx="60" cy="70" rx="25" ry="26" fill="#a46838" />
                            <ellipse cx="60" cy="75" rx="18" ry="18" fill="#f7ede2" />
                            <ellipse cx="60" cy="40" rx="22" ry="18" fill="#c58a55" />
                            <circle cx="48" cy="40" r="10" fill="#ffffff" />
                            <circle cx="72" cy="40" r="10" fill="#ffffff" />
                            <path d="M 43 40 Q 48 35 53 40" stroke="#0b0914" stroke-width="1.5" fill="none" stroke-linecap="round" />
                            <path d="M 67 40 Q 72 35 77 40" stroke="#0b0914" stroke-width="1.5" fill="none" stroke-linecap="round" />
                            <polygon points="57,45 63,45 60,55" fill="#e2b868" />
                        </svg>
                    </div>
                `;
            } else if (type === 'albatross') {
                crashedBirdSVG = `
                    <div style="animation: struggle 3s infinite; animation-delay: 2s;">
                        <svg viewBox="0 0 180 120" width="70" height="50" style="overflow:visible;">
                            <ellipse cx="90" cy="80" rx="75" ry="20" fill="#000" opacity="0.4" filter="blur(3px)" />
                            <g style="animation: flapGroundLeft 1s infinite; transform-origin: 75px 50px;">
                                <path d="M 75 50 Q 20 20 -10 40 Q 30 70 70 65 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
                            </g>
                            <g style="animation: flapGroundRight 1s infinite; transform-origin: 105px 50px;">
                                <path d="M 105 50 Q 160 20 190 40 Q 150 70 110 65 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
                            </g>
                            <path d="M 75 90 L 70 105" stroke="#f59e0b" stroke-width="3" />
                            <path d="M 105 90 L 110 105" stroke="#f59e0b" stroke-width="3" />
                            <ellipse cx="90" cy="70" rx="20" ry="28" fill="#ffffff" stroke="#cbd5e1" />
                            <circle cx="90" cy="35" r="15" fill="#ffffff" stroke="#cbd5e1" />
                            <polygon points="85,42 95,42 90,65" fill="#fca5a5" stroke="#ef4444" stroke-width="1" />
                            <path d="M 80 32 L 85 37 M 85 32 L 80 37" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" />
                            <path d="M 95 32 L 100 37 M 100 32 L 95 37" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" />
                        </svg>
                    </div>
                `;
            } else {
                crashedBirdSVG = `
                    <div style="animation: struggle 3s infinite;">
                        <svg viewBox="0 0 120 120" width="50" height="50">
                            <ellipse cx="60" cy="80" rx="50" ry="25" fill="#000" opacity="0.4" filter="blur(3px)" />
                            <g style="animation: flapGroundLeft 0.5s infinite; transform-origin: 50px 55px;">
                                <path d="M 50 55 Q 20 20 5 45 Q 20 70 45 70 Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />
                            </g>
                            <g style="animation: flapGroundRight 0.5s infinite; transform-origin: 70px 55px;">
                                <path d="M 70 55 Q 100 20 115 45 Q 100 70 75 70 Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />
                            </g>
                            <path d="M 50 90 L 45 105" stroke="#f59e0b" stroke-width="2" />
                            <path d="M 70 90 L 75 105" stroke="#f59e0b" stroke-width="2" />
                            <ellipse cx="60" cy="70" rx="20" ry="25" fill="#ffffff" stroke="#e2e8f0" />
                            <circle cx="60" cy="45" r="14" fill="#ffffff" stroke="#e2e8f0" />
                            <path d="M 52 40 L 56 44 M 56 40 L 52 44" stroke="#475569" stroke-width="1.5" stroke-linecap="round" />
                            <path d="M 64 40 L 68 44 M 68 40 L 64 44" stroke="#475569" stroke-width="1.5" stroke-linecap="round" />
                            <polygon points="58,48 62,48 60,60" fill="#f59e0b" />
                        </svg>
                    </div>
                `;
            }

            return `
                <style>
                    @keyframes struggle { 0% { transform: scale(1); } 50% { transform: scale(1.03) translateY(-1px); } 100% { transform: scale(1); } }
                    @keyframes flapGroundLeft { 0% { transform: rotate(0deg); } 50% { transform: rotate(-8deg); } 100% { transform: rotate(0deg); } }
                    @keyframes flapGroundRight { 0% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } 100% { transform: rotate(0deg); } }
                </style>
                <div class="bird-map-marker bird-crashed" style="display:flex; justify-content:center; align-items:center; width:100%; height:100%; position:relative; flex-direction:column; padding-bottom:5px;">
                    <div style="display:flex; justify-content:center; align-items:flex-end;">
                        <div class="crashed-bird-container" style="position:relative; width:auto; height:auto; display:flex; justify-content:center; align-items:flex-end;">
                            ${crashedBirdSVG}
                        </div>
                        <div class="crashed-scroll" style="margin-left:-18px; z-index:10; position:relative;">
                            ${scrollSVG}
                        </div>
                    </div>
                </div>
            `;
        }

        if (type === 'raven') {
            if (status === 'resting') {
                svgContent = `
                <svg viewBox="0 0 100 100" width="36" height="36" style="overflow:visible; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
                    <g style="transform: translateY(4px); transform-origin: center;">
                        <!-- branch -->
                        <path d="M 15 82 Q 50 87 85 82 L 85 86 Q 50 91 15 86 Z" fill="#5c4033" />
                        <!-- wings folded behind -->
                        <path d="M 40 35 C 30 42 24 64 34 75 C 38 77 40 70 38 65 Z" fill="#0f0b17" />
                        <path d="M 60 35 C 70 42 76 64 66 75 C 62 77 60 70 62 65 Z" fill="#0f0b17" />
                        <!-- body -->
                        <ellipse cx="50" cy="55" rx="16" ry="27" fill="#1a1a1d" />
                        <!-- head -->
                        <circle cx="50" cy="35" r="14" fill="#1a1a1d" />
                        <!-- beak -->
                        <polygon points="46,37 54,37 50,45" fill="#393940" />
                        <!-- eyes -->
                        <circle cx="45" cy="33" r="2.5" fill="#a855f7" />
                        <circle cx="55" cy="33" r="2.5" fill="#a855f7" />
                        <!-- feet -->
                        <path d="M 45 80 L 42 85 M 45 80 L 45 85 M 45 80 L 48 85" stroke="#f59e0b" stroke-width="1.5" fill="none" stroke-linecap="round" />
                        <path d="M 55 80 L 52 85 M 55 80 L 55 85 M 55 80 L 58 85" stroke="#f59e0b" stroke-width="1.5" fill="none" stroke-linecap="round" />
                    </g>
                </svg>`;
            } else {
                const randDelay = `animation-delay: -${(Math.random() * 5).toFixed(2)}s;`;
                const flapAnim = status === 'flying' ? `animation: ravenFlapBack 4s ease-in-out infinite; ${randDelay}` : 'transform: rotate(20deg) scaleY(0.2);';
                const flapFrontAnim = status === 'flying' ? `animation: ravenFlapFront 4s ease-in-out infinite; ${randDelay}` : 'transform: rotate(-10deg) scaleY(0.2);';
                const bodyAnim = status === 'flying' ? `animation: ravenFlyCycle 4s ease-in-out infinite; ${randDelay}` : 'transform: rotate(15deg);';
                svgContent = `
                    <svg viewBox="0 0 140 100" width="45" height="34" style="transform: ${transform}; overflow:visible;">
                        <g style="${bodyAnim} transform-origin: center;">
                            <g style="transform-origin: 48px 40px; ${flapAnim}">
                                <path d="M 48 40 C 35 15 30 -5 50 -10 C 65 5 62 25 48 40 Z" fill="#27272b" />
                            </g>
                            <g fill="#0f0b17">
                                <path d="M 30 48 L 0 38 L 10 48 L 0 58 L 30 52 Z" />
                            </g>
                            <path d="M 28 46 C 28 32 45 28 65 34 C 76 38 80 48 74 58 C 65 68 38 65 28 46 Z" fill="#1a1a1d" />
                            <circle cx="76" cy="35" r="12" fill="#1a1a1d" />
                            <circle cx="80" cy="33" r="3.2" fill="#110d18" />
                            <path d="M 85 30 C 105 34 112 40 108 44 C 98 46 86 42 85 38 Z" fill="#181322" stroke="#322842" stroke-width="0.8" />
                            <g style="transform-origin: 52px 44px; ${flapFrontAnim}">
                                <path d="M 52 44 C 38 15 32 -10 58 -14 C 78 5 72 28 52 44 Z" fill="#393940" stroke="#7b68a3" stroke-width="0.7" />
                            </g>
                        </g>
                    </svg>
                `;
            }
        } else if (type === 'owl') {
            if (status === 'resting') {
                svgContent = `
                <svg viewBox="0 0 100 100" width="36" height="36" style="overflow:visible; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
                    <g style="transform: translateY(4px); transform-origin: center;">
                        <!-- branch -->
                        <path d="M 15 82 Q 50 87 85 82 L 85 86 Q 50 91 15 86 Z" fill="#5c4033" />
                        <!-- wings folded behind -->
                        <path d="M 40 30 C 26 42 24 62 30 72 C 32 75 35 72 34 65 Z" fill="#784a28" />
                        <path d="M 60 30 C 74 42 76 62 70 72 C 68 75 65 72 66 65 Z" fill="#784a28" />
                        <!-- body -->
                        <ellipse cx="50" cy="55" rx="18" ry="20" fill="#f7ede2" />
                        <ellipse cx="50" cy="35" rx="20" ry="17" fill="#c58a55" />
                        <path d="M 50 23 C 37 12 25 23 31 36 C 37 47 50 51 50 51 C 50 51 63 47 69 36 C 75 23 63 12 50 23 Z" fill="#ffffff" stroke="#b07d4f" stroke-width="1.6" />
                        <circle cx="41" cy="34" r="4" fill="#0b0914" />
                        <circle cx="59" cy="34" r="4" fill="#0b0914" />
                        <polygon points="47,37 53,37 50,43" fill="#e2b868" />
                        <!-- feet -->
                        <path d="M 45 75 L 42 82 M 45 75 L 45 82 M 45 75 L 48 82" stroke="#f59e0b" stroke-width="1.5" fill="none" stroke-linecap="round" />
                        <path d="M 55 75 L 52 82 M 55 75 L 55 82 M 55 75 L 58 82" stroke="#f59e0b" stroke-width="1.5" fill="none" stroke-linecap="round" />
                    </g>
                </svg>`;
            } else {
                const randDelay = `animation-delay: -${(Math.random() * 5).toFixed(2)}s;`;
                const flapAnim = status === 'flying' ? `animation: owlSideFlapBack 6s ease-in-out infinite; ${randDelay}` : 'transform: rotate(-5deg) scaleY(0.15);';
                const flapFrontAnim = status === 'flying' ? `animation: owlSideFlapFront 6s ease-in-out infinite; ${randDelay}` : 'transform: rotate(-2deg) scaleY(0.15);';
                const bodyAnim = status === 'flying' ? `animation: owlDescendCycle 6s ease-in-out infinite; ${randDelay}` : 'transform: translateY(5px);';
                svgContent = `
                    <svg viewBox="0 0 140 100" width="45" height="34" style="transform: ${transform}; overflow:visible;">
                        <g style="${bodyAnim} transform-origin: center;">
                            <g style="transform-origin: 50px 40px; ${flapAnim}">
                                <path d="M 50 40 C 35 15 30 -5 50 -10 C 70 5 65 25 50 40 Z" fill="#784a28" />
                            </g>
                            <!-- Tail -->
                            <path d="M 28 48 C 15 44 5 38 0 44 C 10 52 20 54 28 50 Z" fill="#663c1f" />
                            <!-- Body -->
                            <path d="M 28 46 C 28 25 45 25 65 30 C 80 34 85 45 78 55 C 65 70 38 65 28 46 Z" fill="#a46838" />
                            <!-- Belly/Face -->
                            <path d="M 45 42 C 50 35 60 30 70 32 C 80 34 83 45 78 52 C 70 60 55 58 45 42 Z" fill="#f7ede2" />
                            <circle cx="72" cy="38" r="4" fill="#0b0914" />
                            <circle cx="68" cy="38" r="4" fill="#0b0914" />
                            <path d="M 80 40 C 85 42 88 44 85 46 Z" fill="#e2b868" />
                            <g style="transform-origin: 52px 42px; ${flapFrontAnim}">
                                <path d="M 52 42 C 38 15 32 -10 60 -10 C 80 5 72 28 52 42 Z" fill="#8d562f" />
                            </g>
                        </g>
                    </svg>
                `;
            }
        } else {
            if (status === 'resting') {
                svgContent = `
                <svg viewBox="0 0 100 100" width="38" height="38" style="overflow:visible; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
                    <g style="transform: translateY(4px); transform-origin: center;">
                        <!-- branch -->
                        <path d="M 15 82 Q 50 87 85 82 L 85 86 Q 50 91 15 86 Z" fill="#5c4033" />
                        <!-- wings folded behind -->
                        <path d="M 36 42 C 22 52 24 72 32 85 C 35 87 36 75 35 65 Z" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1" />
                        <path d="M 64 42 C 78 52 76 72 68 85 C 65 87 64 75 65 65 Z" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1" />
                        <!-- body -->
                        <ellipse cx="50" cy="55" rx="17" ry="28" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
                        <circle cx="50" cy="31" r="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
                        <polygon points="47,33 53,33 50,39" fill="#fca5a5" />
                        <circle cx="45" cy="29" r="2.5" fill="#0f172a" />
                        <circle cx="55" cy="29" r="2.5" fill="#0f172a" />
                        <path d="M 45 81 L 42 86 M 45 81 L 45 86 M 45 81 L 48 86" stroke="#f59e0b" stroke-width="1.5" fill="none" stroke-linecap="round" />
                        <path d="M 55 81 L 52 86 M 55 81 L 55 86 M 55 81 L 58 86" stroke="#f59e0b" stroke-width="1.5" fill="none" stroke-linecap="round" />
                    </g>
                </svg>`;
            } else {
                const randDelay = `animation-delay: -${(Math.random() * 5).toFixed(2)}s;`;
                const flapAnimLeft = status === 'flying' ? `animation: albatrossFlapGlideLeft 12s ease-in-out infinite; ${randDelay}` : 'transform: rotate(-10deg) scaleY(0.2);';
                const flapAnimRight = status === 'flying' ? `animation: albatrossFlapGlideRight 12s ease-in-out infinite; ${randDelay}` : 'transform: rotate(10deg) scaleY(0.2);';
                const bodyAnim = status === 'flying' ? `animation: albatrossBodyFlightCycle 12s ease-in-out infinite; ${randDelay}` : 'transform: rotate(5deg);';
                svgContent = `
                    <svg viewBox="0 0 210 100" width="56" height="26" style="transform: ${transform}; overflow:visible;">
                        <g style="${bodyAnim} transform-origin: center;">
                            <g style="transform-origin: 52px 34px; ${flapAnimLeft}">
                                <path d="M 52 34 C 18 20 -15 15 -35 22 C -10 32 25 40 46 42 Z" fill="#e2e8f0" />
                                <polygon points="-35,22 -28,27 -20,26" fill="#020617" />
                            </g>
                            <g style="transform-origin: 64px 34px; ${flapAnimRight}">
                                <path d="M 64 34 C 98 10 135 15 155 24 C 130 36 95 42 74 42 Z" fill="#cbd5e1" />
                                <polygon points="155,24 148,29 140,28" fill="#020617" />
                            </g>
                            <!-- Tail -->
                            <path d="M 35 42 L 20 40 L 15 45 L 20 50 L 35 48 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8" />
                            <!-- Body -->
                            <path d="M 30 40 C 30 30 48 26 72 32 C 85 36 88 44 80 50 C 65 56 30 52 30 40 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8" />
                            <!-- Head / Eye / Beak -->
                            <circle cx="78" cy="34" r="9" fill="#ffffff" />
                            <circle cx="80" cy="32" r="2.4" fill="#0f172a" />
                            <path d="M 85 30 C 104 31 106 38 98 42 C 90 42 85 38 85 34 Z" fill="#fca5a5" stroke="#f43f5e" stroke-width="0.8" />
                        </g>
                    </svg>
                `;
            }
        }


        return `
            <div class="bird-map-marker ${status !== 'flying' ? 'bird-resting' : ''}" style="display:flex; justify-content:center; align-items:center; width:100%; height:100%; filter: drop-shadow(0 0 4px rgba(255,255,255,0.8)) drop-shadow(0px 5px 10px rgba(0,0,0,0.5));">
                ${svgContent}
            </div>
        `;
    }

    function getInterpolatedPoint(pathData, progress) {
        if (progress <= 0) return pathData.path[0];
        if (progress >= 1) return pathData.path[pathData.path.length - 1];

        const targetDist = progress * pathData.totalDist;
        for (let i = 0; i < pathData.path.length - 1; i++) {
            const curr = pathData.path[i];
            const next = pathData.path[i + 1];
            if (targetDist >= curr.distFromStart && targetDist <= next.distFromStart) {
                const segDist = next.distFromStart - curr.distFromStart;
                if (segDist === 0) return curr;
                const ratio = (targetDist - curr.distFromStart) / segDist;
                return {
                    lat: curr.lat + (next.lat - curr.lat) * ratio,
                    lng: curr.lng + (next.lng - curr.lng) * ratio
                };
            }
        }
        return pathData.path[pathData.path.length - 1];
    }

    async function loadWorldMap() {
        const container = document.getElementById('aviary-map-container');
        if (!container || !pb) return;
        if (!aviaryLeafletMap) {
            container.innerHTML = '';
            container.style.height = '100%';
            container.style.minHeight = '500px';

            let initialCenter = [20, 0];
            let initialZoom = 2;
            if (currentUser && currentUser.city_lat && currentUser.city_lng) {
                initialCenter = [parseFloat(currentUser.city_lat), parseFloat(currentUser.city_lng)];
            }

            aviaryLeafletMap = L.map('aviary-map-container', {
                center: initialCenter,
                zoom: initialZoom,
                minZoom: 2,
                maxBounds: [[-90, -180], [90, 180]]
            });
            const tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            L.tileLayer(tileUrl, {
                attribution: 'Tiles &copy; Esri'
            }).addTo(aviaryLeafletMap);

            const homeControl = L.control({ position: 'topleft' });
            homeControl.onAdd = function (map) {
                const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-home');
                div.innerHTML = `<a href="#" title="Go to My City" role="button"><i class="fa-solid fa-house"></i></a>`;
                div.onclick = function (e) {
                    e.preventDefault();
                    if (currentUser && currentUser.city_lat && currentUser.city_lng) {
                        map.setView([parseFloat(currentUser.city_lat), parseFloat(currentUser.city_lng)], 2);
                    }
                };
                return div;
            };
            homeControl.addTo(aviaryLeafletMap);

            aviaryMarkersLayer = L.layerGroup().addTo(aviaryLeafletMap);
        }
        try {
            const publicRecords = await pb.collection('public_bird_map').getList(1, 200, {
                sort: '-updated',
                requestKey: null
            });
            let myRecords = { items: [] };
            if (currentUser) {
                myRecords = await pb.collection('bird_deliveries').getList(1, 200, {
                    filter: `(sender = '${currentUser.id}' || recipient = '${currentUser.id}') && (status = 'flying' || status = 'crashed')`,
                    sort: '-updated',
                    requestKey: null
                });
            }

            const allRecordsMap = new Map();
            for (const r of publicRecords.items) allRecordsMap.set(r.id, { ...r, isParticipant: false });
            for (const r of myRecords.items) allRecordsMap.set(r.id, { ...r, isParticipant: true });
            const combinedItems = Array.from(allRecordsMap.values());

            if (!combinedItems.length) return;
            const currentRecordIds = new Set(combinedItems.map(r => r.id));

            for (const record of combinedItems) {
                if (record.status === 'crashed' && record.burn_on_crash) {
                    try {
                        const dep = new Date(String(record.departed_at).replace(' ', 'T')).getTime();
                        const arr = new Date(String(record.estimated_arrival).replace(' ', 'T')).getTime();
                        const crashMs = dep + (arr - dep) * (record.crash_progress || 0.5);
                        if (Date.now() - crashMs > 72 * 60 * 60 * 1000) {
                            continue;
                        }
                    } catch (e) { }
                }
                const pool = AE.BIRD_QUIRK_POOLS[record.bird_type] || AE.BIRD_QUIRK_POOLS.raven;
                const origin = record.origin_coords || { lat: 28, lng: 77 };
                const dest = record.dest_coords || { lat: 28, lng: 77 };
                const { origin: mOrigin, dest: mDest } = AE.getMirroredCoords(origin, dest);
                const isParticipant = record.isParticipant;

                const pathData = AE.generateBirdPath(record.id, mOrigin, mDest, record.bird_type);

                let currentLat = mOrigin.lat;
                let currentLng = mOrigin.lng;
                let state = null;

                if (record.status === 'flying' || record.status === 'crashed') {
                    state = AE.evaluateLiveFlightState(
                        record, record.departed_at, record.estimated_arrival,
                        origin, dest, isParticipant ? record.flight_events : null, record.bird_type
                    );

                    if (record.status === 'crashed' && state.isCrashedNow) {
                        const pt = getInterpolatedPoint(pathData, record.crash_progress || 0.5);
                        currentLat = pt.lat;
                        currentLng = pt.lng;
                    } else {
                        const t = state.geoProgress;
                        const pt = getInterpolatedPoint(pathData, t);
                        currentLat = pt.lat;
                        currentLng = pt.lng;
                    }
                } else {
                    currentLat = mDest.lat;
                    currentLng = mDest.lng;
                }


                if (isParticipant) {
                    const pathCoords = pathData.path.map(p => [p.lat, p.lng]);

                    let lineColor = '#38bdf8';
                    if (record.bird_type === 'albatross') lineColor = '#0284c7';
                    if (record.bird_type === 'owl') lineColor = '#22c55e';
                    if (record.bird_type === 'raven') lineColor = '#9333ea';

                    if (!window.aviaryPathRegistry[record.id]) {
                        window.aviaryPathRegistry[record.id] = L.polyline(pathCoords, {
                            color: lineColor,
                            weight: 1.5,
                            opacity: 0.9,
                            dashArray: '3, 4'
                        }).addTo(aviaryMarkersLayer);
                    } else {
                        window.aviaryPathRegistry[record.id].setLatLngs(pathCoords).setStyle({ color: lineColor });
                    }
                } else if (window.aviaryPathRegistry[record.id]) {
                    aviaryMarkersLayer.removeLayer(window.aviaryPathRegistry[record.id]);
                    delete window.aviaryPathRegistry[record.id];
                }

                let visualStatus = record.status;
                if (record.status === 'crashed' && state && !state.isCrashedNow) {
                    visualStatus = 'flying';
                } else if (state && state.isResting) {
                    visualStatus = 'resting';
                }
                const isFacingLeft = mDest.lng < mOrigin.lng;
                const iconHtml = getBirdSVG(record.bird_type, visualStatus, isFacingLeft, record.burn_on_crash);
                const icon = L.divIcon({
                    html: iconHtml,
                    className: 'custom-bird-icon',
                    iconSize: [60, 60],
                    iconAnchor: [30, 30]
                });

                let speedText = 'Speed: 0 km/h';
                if (state && typeof state.currentSpeed !== 'undefined') {
                    speedText = `Speed: ${Math.round(state.currentSpeed)} km/h`;
                } else if (record.status === 'flying') {
                    if (record.bird_type === 'raven') speedText = 'Speed: ~40 km/h';
                    if (record.bird_type === 'owl') speedText = 'Speed: ~32 km/h';
                    if (record.bird_type === 'albatross') speedText = 'Speed: ~50 km/h';
                }

                let popupHtml = `<div class="aviary-map-popup">`;
                popupHtml += `<strong style="font-size:1rem;display:block;margin-bottom:2px;text-transform:capitalize;">${escapeHtml(record.bird_type)}</strong>`;
                popupHtml += `<div style="font-size:0.8rem;opacity:0.8;margin-bottom:6px;">${speedText}</div>`;

                if (record.status === 'crashed') {
                    popupHtml += `<span style="color:#ef4444;font-weight:bold;font-size:0.9rem;"><i class="fa-solid fa-triangle-exclamation"></i> Crashed!</span>`;
                    popupHtml += `<div style="font-size:0.75rem;margin-top:2px;">${escapeHtml(record.crash_reason || '')}</div>`;

                    if (!record.burn_on_crash) {
                        const smudgedSnippet = (record.letter_smudged || record.letter_original || '').substring(0, 100) + '...';
                        popupHtml += `<div style="font-size:0.75rem;color:var(--text-muted);font-style:italic;margin-top:6px;background:rgba(0,0,0,0.1);padding:6px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">"${escapeHtml(smudgedSnippet)}"</div>`;
                    }

                    if (record.burn_on_crash) {
                        popupHtml += `<div style="margin-top:6px;font-size:0.75rem;color:var(--text-muted);"><i class="fa-solid fa-tombstone"></i> A burned out delivery. Cannot be rescued.</div>`;
                    } else if (isParticipant) {
                        popupHtml += `<div style="margin-top:6px;font-size:0.75rem;color:#ef4444;background:rgba(244,67,54,0.1);padding:4px;border-radius:4px;">Cannot rescue your own bird.</div>`;
                    } else {
                        const alreadyRescued = record.rescued_by && record.rescued_by.includes(currentUser?.id);
                        if (alreadyRescued) {
                            popupHtml += `<div style="margin-top:6px;"><button class="aviary-rescue-btn" disabled style="padding:4px 8px;background:#4caf50;color:white;border:none;border-radius:4px;font-size:0.8rem;"><i class="fa-solid fa-check"></i> Rescued (${record.rescue_count || 0}/2)</button></div>`;
                        } else {
                            popupHtml += `<div style="margin-top:6px;"><button class="aviary-rescue-btn" data-delivery-id="${record.id}" onclick="window.aviaryRescue('${record.id}')" style="padding:4px 8px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.8rem;">Rescue Satchel</button></div>`;
                        }
                    }
                } else if (record.status === 'flying') {
                    if (state && state.isResting) {
                        popupHtml += `<span style="color:#ff9800;font-weight:bold;font-size:0.9rem;"><i class="fa-solid fa-tree"></i> Resting</span>`;
                        popupHtml += `<div style="font-size:0.75rem;margin-top:2px;">${escapeHtml(state.statusText)}</div>`;
                    } else {
                        popupHtml += `<span style="color:#10b981;font-weight:bold;font-size:0.9rem;"><i class="fa-solid fa-wind"></i> Flying</span>`;
                    }
                } else {
                    popupHtml += `<span style="color:#8b5cf6;font-weight:bold;font-size:0.9rem;"><i class="fa-solid fa-check-circle"></i> <span style="text-transform:capitalize;">${escapeHtml(record.status)}</span></span>`;
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


                container.style.display = 'none';
                return;
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
                } catch (e) { console.warn("Non-critical error:", e); }
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

    window.loadWorldMap = loadWorldMap;


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAviary);
    } else {
        initAviary();
    }
})();
