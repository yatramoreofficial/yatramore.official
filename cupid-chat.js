let currentChatMatchId = null;
let currentChatOtherUser = null;
let isChatInitialized = false;
let autoTranslateUsers = JSON.parse(localStorage.getItem('autoTranslateUsers') || '{}');
let sharedAudioCtx = null;
function getAudioContext() {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        sharedAudioCtx = new AudioContext();
    }
    if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
    return sharedAudioCtx;
}
window.playChatSound = (type) => {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        if (type === 'send') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        } else if (type === 'receive') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        }
    } catch (e) {
        console.warn("Web Audio API not supported", e);
    }
};
window.initChatSystem = async function () {
    if (isChatInitialized) return;
    isChatInitialized = true;
    setupChatUIListeners();
    const matchPromise = listenForMatches();
    if (window.fetchAndRenderNotifications) {
        window.fetchAndRenderNotifications();
    }
    await matchPromise;
    const pingLastActive = () => {
        if (currentUser && pb && pb.authStore.isValid) {
            pb.collection('users').update(currentUser.id, { last_active: new Date().toISOString() }, { requestKey: null }).catch(() => { });
        }
    };
    pingLastActive(); 
    setInterval(pingLastActive, 60 * 1000); 
    if (pb && pb.authStore.isValid) {
        pb.collection('users').subscribe('*', function (e) {
            let needsRerender = false;
            if (currentUser && e.record.id === currentUser.id) {
                const prevBlocked = JSON.stringify(currentUser.blocked_users || []);
                const oldPremium = currentUser.is_premium;
                const oldVerified = currentUser.is_verified;
                currentUser = Object.assign(currentUser, e.record);
                const newBlocked = JSON.stringify(currentUser.blocked_users || []);
                if (prevBlocked !== newBlocked) needsRerender = true;
                if (oldPremium !== currentUser.is_premium || oldVerified !== currentUser.is_verified) needsRerender = true;
                if (window.updateActiveChatStatus && currentChatOtherUser) {
                    window.updateActiveChatStatus(currentChatOtherUser);
                }
            }
            if (currentChatOtherUser && e.record.id === currentChatOtherUser.id) {
                const prevBlocked = JSON.stringify(currentChatOtherUser.blocked_users || []);
                const oldPremium = currentChatOtherUser.is_premium;
                const oldVerified = currentChatOtherUser.is_verified;
                currentChatOtherUser = Object.assign(currentChatOtherUser, e.record);
                const newBlocked = JSON.stringify(currentChatOtherUser.blocked_users || []);
                if (prevBlocked !== newBlocked) needsRerender = true;
                if (oldPremium !== currentChatOtherUser.is_premium || oldVerified !== currentChatOtherUser.is_verified) needsRerender = true;
                if (window.updateActiveChatStatus) window.updateActiveChatStatus(currentChatOtherUser);
            }
            if (needsRerender) {
                if (typeof fetchAndRenderMatches === 'function') fetchAndRenderMatches();
                if (currentChatMatchId && currentChatOtherUser) {
                    window.openPocketBaseChat(currentChatMatchId, currentChatOtherUser, true);
                }
            }
        });
        pb.collection('notifications').subscribe('*', function (e) {
            if (e.action === 'create' || e.action === 'update' || e.action === 'delete') {
                if (window.fetchAndRenderNotifications) window.fetchAndRenderNotifications();
                if (e.action === 'create') {
                    window.playChatSound('receive');
                }
            }
        });
        pb.collection('messages').subscribe('*', function (e) {
            if (e.action === 'create') {
                const msg = e.record;
                if (msg.sender !== currentUser.id) {
                    window.playChatSound('receive');
                    if (currentChatMatchId === msg.match_id) {
                        appendMessageToUI(msg);
                        if (!currentUser.ghost_read_receipts) {
                            const sendRead = () => {
                                pb.collection('messages').update(e.record.id, { read: true }).catch(console.error);
                            };
                            if (document.visibilityState === 'visible') {
                                sendRead();
                            } else {
                                if (window.activeSubVisibilityHandler) {
                                    document.removeEventListener('visibilitychange', window.activeSubVisibilityHandler);
                                }
                                window.activeSubVisibilityHandler = () => {
                                    if (document.visibilityState === 'visible') {
                                        if (currentChatMatchId === msg.match_id) sendRead();
                                        document.removeEventListener('visibilitychange', window.activeSubVisibilityHandler);
                                        window.activeSubVisibilityHandler = null;
                                    }
                                };
                                document.addEventListener('visibilitychange', window.activeSubVisibilityHandler);
                            }
                        } else {
                            let ghostRead = JSON.parse(localStorage.getItem('ghostReadMessages') || '[]');
                            if (!ghostRead.includes(msg.id)) {
                                ghostRead.push(msg.id);
                                if (ghostRead.length > 500) ghostRead = ghostRead.slice(-500);
                                localStorage.setItem('ghostReadMessages', JSON.stringify(ghostRead));
                            }
                        }
                    }
                } else {
                    if (currentChatMatchId === msg.match_id) {
                        const existing = document.querySelector(`.chat-message-wrapper[data-msg-id="${msg.id}"]`);
                        if (!existing) {
                            appendMessageToUI(msg);
                        }
                    }
                }
                fetchAndRenderMatches();
            } else if (e.action === 'update') {
                const msg = e.record;
                let shouldUpdateUI = true;
                if (msg.sender !== currentUser.id && msg.read === true) {
                    const existingWrap = document.querySelector(`.chat-message-wrapper[data-msg-id="${msg.id}"]`);
                    if (existingWrap) {
                        const domDeleted = existingWrap.dataset.isDeleted === 'true';
                        const domText = decodeURIComponent(existingWrap.dataset.rawText || "");
                        const domReactions = existingWrap.dataset.reactionsString || "{}";
                        const domStarred = existingWrap.dataset.starredByString || "[]";
                        let parsedNewReactions = msg.reactions;
                        if (typeof parsedNewReactions === 'string') {
                            try { parsedNewReactions = JSON.parse(parsedNewReactions); } catch(e) { parsedNewReactions = {}; }
                        }
                        const newReactionsString = JSON.stringify(parsedNewReactions || {});
                        const newStarredString = JSON.stringify(msg.starredBy || []);
                        if (msg.isDeleted === domDeleted && msg.text === domText && newReactionsString === domReactions && newStarredString === domStarred) {
                            shouldUpdateUI = false;
                        }
                    }
                }
                fetchAndRenderMatches();
                if (shouldUpdateUI) {
                    if (currentChatMatchId === msg.match_id) {
                        appendMessageToUI(msg);
                    }
                }
            }
        });
    }
    if (window.visualViewport) {
        let lastVvHeight = window.visualViewport.height;
        const adjustForKeyboard = () => {
            lastVvHeight = window.visualViewport.height;
            const isKeyboardActive = (window.visualViewport.height < window.innerHeight - 100);
            if (isKeyboardActive) {
                document.body.classList.add('keyboard-open');
                if (window.innerWidth <= 768) {
                    const offsetTop = window.visualViewport.offsetTop;
                    const keyboardHeight = Math.max(0, window.innerHeight - window.visualViewport.height);
                    const bottomOffset = Math.max(0, keyboardHeight - offsetTop);
                    document.documentElement.style.setProperty('--keyboard-top', offsetTop + 'px');
                    document.documentElement.style.setProperty('--keyboard-bottom', bottomOffset + 'px');
                    document.documentElement.style.setProperty('--vv-height', window.visualViewport.height + 'px');
                    setTimeout(() => {
                        const msgs = document.getElementById('chat-messages');
                        if (msgs) msgs.scrollTop = msgs.scrollHeight;
                    }, 50);
                }
            } else {
                setTimeout(() => {
                    const stillActive = (window.visualViewport.height < window.innerHeight - 100);
                    if (!stillActive) {
                        const wasOpen = document.body.classList.contains('keyboard-open');
                        document.body.classList.remove('keyboard-open');
                        document.documentElement.style.removeProperty('--keyboard-top');
                        document.documentElement.style.removeProperty('--keyboard-bottom');
                        document.documentElement.style.removeProperty('--vv-height');
                        if (wasOpen && window.innerWidth <= 768) {
                            window.scrollTo(0, 0);
                        }
                    }
                }, 100);
            }
        };
        window.visualViewport.addEventListener('resize', adjustForKeyboard);
        window.visualViewport.addEventListener('scroll', adjustForKeyboard);
        setInterval(() => {
            if (window.innerWidth <= 768 && window.visualViewport) {
                if (window.visualViewport.height !== lastVvHeight) {
                    adjustForKeyboard();
                } else if (document.body.classList.contains('keyboard-open') && window.visualViewport.height >= window.innerHeight - 100) {
                    const keyboardHeight = Math.max(0, window.innerHeight - window.visualViewport.height);
                    if (keyboardHeight === 0 && document.documentElement.style.getPropertyValue('--keyboard-bottom') !== '0px') {
                        adjustForKeyboard();
                    }
                }
            }
        }, 400);
        document.addEventListener('focusin', adjustForKeyboard);
        document.addEventListener('focusout', adjustForKeyboard);
    }
    const panel = document.getElementById('chat-inbox-panel');
    const state = localStorage.getItem('chatPanelState');
    if ((state === 'open' || state === 'minimized') && panel) {
        panel.style.display = 'flex';
        setTimeout(() => {
            panel.classList.add('open');
            if (state === 'minimized') {
                panel.classList.add('minimized');
                document.body.classList.add('chat-minimized');
                document.body.style.overflow = '';
                if (document.body.classList.contains('chat-active')) {
                    document.body.classList.remove('chat-active');
                    const scrollY = document.body.style.top;
                    document.body.style.top = '';
                    window.scrollTo(0, parseInt(scrollY || '0') * -1);
                }
            } else {
                if (window.innerWidth <= 768) document.body.style.overflow = 'hidden';
                if (window.innerWidth <= 768 && !document.body.classList.contains('chat-active')) {
                    document.body.style.top = `-${window.scrollY}px`;
                    document.body.classList.add('chat-active');
                }
            }
            const savedMatchId = localStorage.getItem('activeChatMatchId');
            const savedOtherUserStr = localStorage.getItem('activeChatOtherUser');
            if (savedMatchId && savedOtherUserStr) {
                try {
                    const savedOtherUser = JSON.parse(savedOtherUserStr);
                    if (document.querySelector(`.inbox-chat-item[onclick*='${savedMatchId}']`)) {
                        window.openPocketBaseChat(savedMatchId, savedOtherUser, true);
                    } else {
                        localStorage.removeItem('activeChatMatchId');
                        localStorage.removeItem('activeChatOtherUser');
                    }
                } catch (e) {
                    console.error('Failed to restore active chat state', e);
                }
            }
        }, 100);
    }
};
function setupChatUIListeners() {
    const panel = document.getElementById('chat-inbox-panel');
    const closeInboxBtn = document.getElementById('close-inbox-btn');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const backBtn = document.getElementById('back-to-inbox');
    const sendBtn = document.getElementById('send-msg-btn');
    const chatInput = document.getElementById('chat-input');
    const autoTranslateBtn = document.getElementById('auto-translate-btn');
    const chatMenuBtn = document.getElementById('chat-menu-btn');
    const chatMenuDropdown = document.getElementById('chat-menu-dropdown');
    const viewProfileBtn = document.getElementById('view-chat-profile-btn');
    const tabNotifications = document.getElementById('tab-notifications');
    const tabInbox = document.getElementById('tab-inbox');
    const contentNotifications = document.getElementById('notifications-content');
    const contentInbox = document.getElementById('inbox-content');
    if (tabNotifications && tabInbox && contentNotifications && contentInbox) {
        tabNotifications.addEventListener('click', () => {
            tabNotifications.classList.add('active');
            tabInbox.classList.remove('active');
            contentNotifications.style.transform = 'translateX(0%)';
            contentInbox.style.transform = 'translateX(100%)';
        });
        tabInbox.addEventListener('click', () => {
            tabInbox.classList.add('active');
            tabNotifications.classList.remove('active');
            contentInbox.style.transform = 'translateX(0%)';
            contentNotifications.style.transform = 'translateX(-100%)';
        });
    }
    document.addEventListener('click', (e) => {
        const inboxBtn = e.target.closest('#nav-inbox-btn');
        if (inboxBtn) {
            const currentPanel = document.getElementById('chat-inbox-panel');
            if (currentPanel) {
                currentPanel.style.display = 'flex';
                currentPanel.classList.remove('minimized');
            }
            setTimeout(() => {
                if (currentPanel) currentPanel.classList.add('open');
                localStorage.setItem('chatPanelState', 'open');
                if (window.innerWidth <= 768) document.body.style.overflow = 'hidden';
                if (window.innerWidth <= 768) {
                    if (!document.body.classList.contains('chat-active')) {
                        document.body.style.top = `-${window.scrollY}px`;
                        document.body.classList.add('chat-active');
                    }
                }
            }, 10);
        }
    });
    const activeChatHeader = document.getElementById('active-chat-header');
    const inboxHeader = document.getElementById('inbox-panel-header');
    window.updateChatMinimizeOffset = () => {
        if (!panel) return;
        let offset = 56;
        if (panel.classList.contains('has-active-chat')) {
            const fsBar = document.getElementById('fast-switcher-bar');
            const acHeader = document.getElementById('active-chat-header');
            const fsHeight = (fsBar && fsBar.style.display !== 'none' && fsBar.innerHTML.trim() !== '') ? Math.max(fsBar.offsetHeight, 62) : 0;
            const headerHeight = acHeader ? Math.max(acHeader.offsetHeight, 56) : 56;
            offset = fsHeight + headerHeight;
        } else {
            const ibHeader = document.getElementById('inbox-panel-header');
            offset = ibHeader ? Math.max(ibHeader.offsetHeight, 56) : 56;
        }
        panel.style.setProperty('--minimize-offset', `${offset}px`);
        document.documentElement.style.setProperty('--minimize-offset', `${offset}px`);
    };
    const toggleMinimize = (e) => {
        if (!panel) return;
        if (e.target.closest && (e.target.closest('button') || e.target.closest('.chat-dropdown-item'))) return;
        if (panel.classList.contains('minimized')) {
            panel.classList.remove('minimized');
            document.body.classList.remove('chat-minimized');
            localStorage.setItem('chatPanelState', 'open');
            if (window.innerWidth <= 768) document.body.style.overflow = 'hidden';
            if (window.innerWidth <= 768) {
                if (!document.body.classList.contains('chat-active')) {
                    document.body.style.top = `-${window.scrollY}px`;
                    document.body.classList.add('chat-active');
                }
            }
        } else {
            window.updateChatMinimizeOffset();
            panel.classList.add('minimized');
            document.body.classList.add('chat-minimized');
            localStorage.setItem('chatPanelState', 'minimized');
            document.body.style.overflow = '';
            if (document.body.classList.contains('chat-active')) {
                document.body.classList.remove('chat-active');
                const scrollY = document.body.style.top;
                document.body.style.top = '';
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }
    };
    if (activeChatHeader) activeChatHeader.addEventListener('click', toggleMinimize);
    if (inboxHeader) inboxHeader.addEventListener('click', toggleMinimize);
    const closeDrawer = () => {
        if (document.activeElement) document.activeElement.blur();
        document.body.classList.remove('keyboard-open', 'keyboard-opening');
        document.documentElement.style.removeProperty('--keyboard-top');
        document.documentElement.style.removeProperty('--keyboard-bottom');
        document.documentElement.style.removeProperty('--vv-height');
        if (panel) {
            panel.classList.remove('open');
            panel.classList.remove('minimized');
            document.body.classList.remove('chat-minimized');
        }
        localStorage.setItem('chatPanelState', 'closed');
        document.body.style.overflow = '';
        if (document.body.classList.contains('chat-active')) {
            document.body.classList.remove('chat-active');
            const scrollY = document.body.style.top;
            document.body.style.top = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
        setTimeout(() => {
            if (panel) panel.style.display = 'none';
        }, 300);
        currentChatMatchId = null;
        currentChatOtherUser = null;
        localStorage.removeItem('activeChatMatchId');
        localStorage.removeItem('activeChatOtherUser');
        document.getElementById('active-chat-view').style.display = 'none';
        if (panel) panel.classList.remove('has-active-chat');
    };
    window.closeChat = closeDrawer;
    closeInboxBtn?.addEventListener('click', closeDrawer);
    closeChatBtn?.addEventListener('click', closeDrawer);
    backBtn?.addEventListener('click', () => {
        if (document.activeElement) document.activeElement.blur();
        document.body.classList.remove('keyboard-open');
        document.getElementById('active-chat-view').style.display = 'none';
        if (panel) panel.classList.remove('has-active-chat');
        currentChatMatchId = null;
        currentChatOtherUser = null;
        localStorage.removeItem('activeChatMatchId');
        localStorage.removeItem('activeChatOtherUser');
    });
    sendBtn?.addEventListener('pointerdown', (e) => {
        if (e.cancelable) e.preventDefault();
        sendMessage();
        setTimeout(() => { if (chatInput) chatInput.style.height = '44px'; }, 50);
    });
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    cancelEditBtn?.addEventListener('click', () => {
        if (window.cancelEditMessage) window.cancelEditMessage();
    });
    chatMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        chatMenuDropdown.style.display = chatMenuDropdown.style.display === 'flex' ? 'none' : 'flex';
    });
    document.addEventListener('click', (e) => {
        if (chatMenuDropdown && !chatMenuBtn.contains(e.target)) {
            chatMenuDropdown.style.display = 'none';
        }
    });
    viewProfileBtn?.addEventListener('click', () => {
        if (!currentChatOtherUser) return;
        const modal = document.getElementById('chat-profile-modal');
        const content = document.getElementById('chat-profile-modal-content');
        if (!modal || !content) return;
        const p = currentChatOtherUser;
        const avatarUrl = (p.photos && p.photos.length > 0) ? pb.files.getUrl(p, p.photos[0]) : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=400`;
        const safeName = window.escapeHtml ? window.escapeHtml(p.name) : p.name;
        let hobbiesHTML = '';
        if (p.hobbies && Array.isArray(p.hobbies) && p.hobbies.length > 0) {
            hobbiesHTML = `<div class="tinder-card-hobbies" style="display: flex; flex-wrap: wrap; gap: 6px;">` +
                p.hobbies.map(h => `<span class="hobby-badge" style="padding: 4px 10px; border-radius: 12px; background: rgba(107, 66, 38, 0.1); color: var(--brand-brown); font-size: 0.75rem;">${window.escapeHtml ? window.escapeHtml(h) : h}</span>`).join('') +
                `</div>`;
        }
        let age = '';
        if (p.birthDate || p.birthdate) {
            const birthDate = new Date(p.birthDate || p.birthdate);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            age = calculatedAge;
        }
        let displayGender = 'N/A';
        if (p.gender === 'Male') displayGender = 'M';
        else if (p.gender === 'Female') displayGender = 'F';
        else if (p.gender === 'Non-binary') displayGender = 'NB';
        else if (p.gender) displayGender = 'NB';
        content.innerHTML = `
            <div style="width: 100%; height: 600px; max-height: 75vh; margin: -10px auto 0 auto;">
                ${window.generateTinderCardHTML(p, true)}
            </div>
        `;
        modal.classList.add('active');
    });
    autoTranslateBtn?.addEventListener('click', () => {
        if (!currentChatOtherUser) return;
        const userId = currentChatOtherUser.id;
        if (autoTranslateUsers[userId]) {
            delete autoTranslateUsers[userId];
        } else {
            autoTranslateUsers[userId] = Date.now();
        }
        localStorage.setItem('autoTranslateUsers', JSON.stringify(autoTranslateUsers));
        chatMenuDropdown.style.display = 'none';
        const atBtn = document.getElementById('auto-translate-btn');
        if (autoTranslateUsers[userId]) {
            if (atBtn) atBtn.innerHTML = '<i class="fa-solid fa-language"></i> Disable Auto-Translate';
            if (window.showToast) window.showToast("Auto-Translate is ON. Incoming messages will be translated.");
            loadChatHistory(currentChatMatchId);
        } else {
            if (atBtn) atBtn.innerHTML = '<i class="fa-solid fa-language"></i> Auto-Translate';
            if (window.showToast) window.showToast("Auto-Translate is OFF.");
            loadChatHistory(currentChatMatchId);
        }
    });
    document.querySelectorAll('.chat-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            if (chatMenuDropdown) chatMenuDropdown.style.display = 'none';
        });
    });
    const deleteChatBtn = document.getElementById('delete-chat-btn');
    if (deleteChatBtn) {
        deleteChatBtn.addEventListener('click', () => {
            if (!currentChatMatchId || !currentChatOtherUser) return;
            window.triggerUnmatchModal(currentChatMatchId, currentChatOtherUser);
        });
    }
    window.triggerUnmatchModal = function (matchId, otherUser) {
        if (!matchId || !otherUser) return;
        const unmatchedName = otherUser.name || 'this user';
        const modal = document.getElementById('unmatch-modal');
        if (modal) {
            const nameEl = document.getElementById('unmatch-modal-name');
            if (nameEl) nameEl.textContent = unmatchedName;
            modal.style.display = 'flex';
            void modal.offsetWidth;
            modal.style.opacity = '1';
            const content = modal.querySelector('.modal-content');
            if (content) content.style.transform = 'scale(1)';
            const confirmBtn = document.getElementById('unmatch-submit-btn');
            const cancelBtn = document.getElementById('cancel-unmatch-btn');
            const closeBtn = document.getElementById('close-unmatch-modal-btn');
            const backdrop = document.getElementById('unmatch-modal-backdrop');
            const cleanup = () => {
                modal.style.opacity = '0';
                if (content) content.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 200); 
                confirmBtn.onclick = null;
                cancelBtn.onclick = null;
                closeBtn.onclick = null;
                backdrop.onclick = null;
            };
            cancelBtn.onclick = cleanup;
            closeBtn.onclick = cleanup;
            backdrop.onclick = cleanup;
            confirmBtn.onclick = async () => {
                cleanup();
                try {
                    await pb.collection('matches').delete(matchId);
                    if (currentChatMatchId === matchId) {
                        currentChatMatchId = null;
                        currentChatOtherUser = null;
                        localStorage.removeItem('activeChatMatchId');
                        localStorage.removeItem('activeChatOtherUser');
                        const panel = document.getElementById('chat-inbox-panel');
                        if (document.activeElement) document.activeElement.blur();
                        document.body.classList.remove('keyboard-open', 'keyboard-opening');
                        if (panel) {
                            panel.classList.remove('open', 'minimized', 'has-active-chat');
                            document.body.classList.remove('chat-minimized');
                        }
                        document.getElementById('active-chat-view').style.display = 'none';
                        localStorage.setItem('chatPanelState', 'closed');
                        document.body.style.overflow = '';
                        if (document.body.classList.contains('chat-active')) {
                            document.body.classList.remove('chat-active');
                            const scrollY = document.body.style.top;
                            document.body.style.top = '';
                            window.scrollTo(0, parseInt(scrollY || '0') * -1);
                        }
                        setTimeout(() => { if (panel) panel.style.display = 'none'; }, 300);
                    }
                    if (typeof fetchAndRenderMatches === 'function') fetchAndRenderMatches();
                    if (window.showToast) window.showToast(`Unmatched from ${unmatchedName}.`, true);
                } catch (err) {
                    console.error('Failed to delete chat:', err);
                    if (window.showToast) window.showToast('Failed to unmatch.', false);
                }
            };
        }
    };
    const reportUserBtn = document.getElementById('report-user-btn');
    if (reportUserBtn) {
        reportUserBtn.addEventListener('click', () => {
            if (!currentChatOtherUser) return;
            window.openReportModal(currentChatOtherUser.id);
        });
    }
    const blockUserBtn = document.getElementById('block-user-btn');
    if (blockUserBtn) {
        blockUserBtn.addEventListener('click', () => {
            if (!currentChatOtherUser || !currentChatMatchId) return;
            document.getElementById('chat-menu-dropdown').style.display = 'none';
            if (typeof window.openBlockModal === 'function') {
                window.openBlockModal(currentChatOtherUser.id, currentChatMatchId);
            }
        });
    }
    const unblockUserBtn = document.getElementById('unblock-user-btn');
    if (unblockUserBtn) {
        unblockUserBtn.addEventListener('click', () => {
            if (!currentChatOtherUser) return;
            document.getElementById('chat-menu-dropdown').style.display = 'none';
            if (typeof window.unblockUser === 'function') {
                window.unblockUser(currentChatOtherUser.id);
            }
        });
    }
    window.showingStarredOnly = false;
    const toggleStarredBtn = document.getElementById('toggle-starred-btn');
    if (toggleStarredBtn) {
        toggleStarredBtn.addEventListener('click', () => {
            window.showingStarredOnly = !window.showingStarredOnly;
            if (window.showingStarredOnly) {
                toggleStarredBtn.innerHTML = '<i class="fa-solid fa-star"></i> Show All Messages';
            } else {
                toggleStarredBtn.innerHTML = '<i class="fa-regular fa-star"></i> Show Starred';
            }
            if (chatMenuDropdown) chatMenuDropdown.style.display = 'none';
            if (currentChatMatchId) loadChatHistory(currentChatMatchId);
        });
    }
    if (chatInput) {
        const autoResizeInput = () => {
            chatInput.style.height = 'auto'; 
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        };
        chatInput.addEventListener('input', autoResizeInput);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                setTimeout(() => {
                    chatInput.style.height = '44px';
                }, 50);
            }
        });
    }
}
async function listenForMatches() {
    if (!currentUser) return;
    await fetchAndRenderMatches();
    pb.collection('matches').subscribe('*', async function (e) {
        if (e.record.user1 === currentUser.id || e.record.user2 === currentUser.id) {
            fetchAndRenderMatches();
            if (e.action === 'create' && e.record.user2 === currentUser.id && e.record.user1 !== currentUser.id) {
                try {
                    const otherUser = await pb.collection('users').getOne(e.record.user1);
                    const otherUserAvatar = (otherUser.photos && otherUser.photos.length > 0)
                        ? pb.files.getUrl(otherUser, otherUser.photos[0])
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`;
                    if (typeof window.showToast === 'function') {
                        setTimeout(() => {
                            window.showToast(`It's a Match! You and ${window.escapeHtml(otherUser.name)} liked each other. 🎉`, true);
                        }, 500);
                    }
                } catch (err) {
                    console.error("Could not fetch user for match popup", err);
                }
            }
        }
    });
}
async function fetchAndRenderMatches() {
    try {
        const matches = await pb.collection('matches').getFullList({
            filter: `user1 = "${currentUser.id}" || user2 = "${currentUser.id}"`,
            expand: 'user1,user2',
            sort: '' 
        });
        const chatsList = document.getElementById('chats-list');
        const fastSwitcher = document.getElementById('fast-switcher-bar');
        const sidebarMatches = document.getElementById('sidebar-matches');
        let unreadTotal = 0;
        let matchCount = 0;
        const renderedUsers = new Set();
        const matchDataList = [];
        const matchPromises = matches.map(async (match) => {
            const isUser1 = match.user1 === currentUser.id;
            const otherUser = isUser1 ? match.expand?.user2 : match.expand?.user1;
            if (!otherUser || renderedUsers.has(otherUser.id)) return null;
            const hasBlockedThem = currentUser.blocked_users && currentUser.blocked_users.includes(otherUser.id);
            const haveTheyBlockedMe = otherUser.blocked_users && otherUser.blocked_users.includes(currentUser.id);
            if (hasBlockedThem || haveTheyBlockedMe) {
                otherUser.name = "Blocked User";
                otherUser.photos = [];
                otherUser.is_premium = false;
                otherUser.is_verified = false;
                otherUser.bio = "";
                otherUser.isBlocked = true; 
            }
            renderedUsers.add(otherUser.id);
            let msg = null;
            let unreadForMatch = 0;
            let latestMsgTime = 0; 
            try {
                const latestResult = await pb.collection('messages').getList(1, 1, {
                    filter: `match_id = "${match.id}"`,
                    sort: '-sent_at',
                    $autoCancel: false
                });
                if (latestResult.items && latestResult.items.length > 0) {
                    msg = latestResult.items[0];
                    latestMsgTime = new Date(String(msg.created || msg.sent_at || '').replace(' ', 'T')).getTime() || 0;
                }
                const unreadResult = await pb.collection('messages').getFullList({
                    filter: `match_id = "${match.id}" && sender != "${currentUser.id}" && read = false`,
                    fields: 'id', 
                    sort: '',
                    $autoCancel: false
                });
                if (msg) {
                    let ghostRead = JSON.parse(localStorage.getItem('ghostReadMessages') || '[]');
                    if (ghostRead.length > 500) {
                        ghostRead = ghostRead.slice(-500);
                        localStorage.setItem('ghostReadMessages', JSON.stringify(ghostRead));
                    }
                    let actualUnreadCount = 0;
                    for (const unreadMsg of unreadResult) {
                        if (!ghostRead.includes(unreadMsg.id)) {
                            actualUnreadCount++;
                        }
                    }
                    unreadForMatch = actualUnreadCount;
                }
            } catch (msgErr) {
                console.warn(`Failed to fetch latest message for match ${match.id}:`, msgErr);
            }
            let previewText = "You matched!";
            let timeStr = "";
            let isUnread = false;
            if (msg) {
                let rawText = msg.text ? msg.text.replace(/<[^>]*>?/gm, '').trim() : '';
                previewText = rawText;
                if (!previewText) previewText = 'Sent an attachment';
                const createdStr = msg.created || msg.sent_at || new Date().toISOString();
                const d = new Date(String(createdStr).replace(' ', 'T'));
                timeStr = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                if (unreadForMatch > 0) {
                    isUnread = true;
                }
            }
            return { match, otherUser, msg, previewText, timeStr, isUnread, unreadForMatch, latestMsgTime };
        });
        const results = await Promise.all(matchPromises);
        for (const res of results) {
            if (!res) continue;
            matchCount++;
            if (res.isUnread) unreadTotal += res.unreadForMatch;
            matchDataList.push(res);
        }
        matchDataList.sort((a, b) => b.latestMsgTime - a.latestMsgTime);
        let chatsHtml = '';
        let switcherHtml = '';
        let sidebarHtml = '<h3 style="margin-bottom: 15px;">Matches</h3><div class="sidebar-matches-container">';
        for (const { match, otherUser, msg, previewText, timeStr, isUnread } of matchDataList) {
            const avatarUrl = (otherUser.photos && otherUser.photos.length > 0) ? pb.files.getUrl(otherUser, otherUser.photos[0]) : `https://ui-avatars.com/api/?name=${otherUser.name}&background=random`;
            const safeOtherUserJson = JSON.stringify(otherUser).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const verifiedBadgeSmall = otherUser.is_verified ? `<span style="display: inline-flex; position: relative; width: 12px; height: 12px; align-items: center; justify-content: center; transform: translateY(-4px); margin-left: 2px;" title="Verified Profile"><i class="fa-solid fa-certificate" style="color: #1DA1F2; font-size: 12px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></i><i class="fa-solid fa-check" style="color: #fff; font-size: 12px; position: absolute; z-index: 1; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.55);"></i></span>` : '';
            chatsHtml += `
                <div class="inbox-chat-item long-press-unmatch" data-match-id="${match.id}" data-other-user='${safeOtherUserJson}' style="${isUnread ? 'border-left: 4px solid var(--brand-brown); background: rgba(107, 66, 38, 0.05);' : ''} -webkit-touch-callout: none; user-select: none;" 
                     onclick='window.openPocketBaseChat("${match.id}", JSON.parse(this.getAttribute("data-other-user")))'>
                    <div style="position:relative;">
                        <img src="${avatarUrl}" class="inbox-avatar ${otherUser.is_premium ? 'premium-avatar-ring' : ''}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">
                        ${otherUser.is_premium ? '<i class="fa-solid fa-crown premium-crown-badge"></i>' : ''}
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px; align-items:center;">
                            <span style="font-weight:600; color:var(--text-main); font-size:1.05rem; display:flex; align-items:center;">${window.escapeHtml ? window.escapeHtml(otherUser.name || 'Anonymous') : (otherUser.name || 'Anonymous')}${verifiedBadgeSmall}</span>
                            <span style="font-size:0.8rem; color:${isUnread ? 'var(--brand-brown)' : 'var(--text-muted)'}; font-weight:${isUnread ? 'bold' : 'normal'};">${timeStr}</span>
                        </div>
                        <div style="font-size:0.9rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:${isUnread ? '600' : 'normal'};">
                            ${msg && msg.sender === currentUser.id ? 'You: ' : ''}${window.escapeHtml ? window.escapeHtml(previewText) : previewText.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; })}
                        </div>
                    </div>
                </div>
            `;
            switcherHtml += `
                <div class="fast-switcher-item long-press-unmatch" data-match-id="${match.id}" data-other-user='${safeOtherUserJson}' onclick='window.openPocketBaseChat("${match.id}", JSON.parse(this.getAttribute("data-other-user")))' style="display:flex; flex-direction:column; align-items:center; cursor:pointer; flex-shrink:0; -webkit-touch-callout: none; user-select: none;">
                    <div style="position:relative;">
                        <img src="${avatarUrl}" class="${(otherUser.is_premium && currentChatMatchId !== match.id) ? 'premium-avatar-ring' : ''}" style="width:45px; height:45px; border-radius:50%; object-fit:cover; border: 2px solid ${currentChatMatchId === match.id ? '#4ade80' : 'var(--glass-border)'};">
                        ${otherUser.is_premium ? '<i class="fa-solid fa-crown premium-crown-badge"></i>' : ''}
                        ${isUnread ? '<div style="position:absolute; top:0; right:0; width:12px; height:12px; background:var(--brand-brown); border-radius:50%; border:2px solid var(--bg-main);"></div>' : ''}
                    </div>
                </div>
            `;
            sidebarHtml += `
                <div class="sidebar-match-item long-press-unmatch" data-match-id="${match.id}" data-other-user='${safeOtherUserJson}' style="display:flex; align-items:center; gap: 10px; margin-bottom: 10px; cursor: pointer; padding: 5px; border-radius: 8px; transition: background 0.2s; -webkit-touch-callout: none; user-select: none;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'" onclick='window.openPocketBaseChat("${match.id}", JSON.parse(this.getAttribute("data-other-user")))'>
                    <div style="position:relative;">
                        <img src="${avatarUrl}" class="${otherUser.is_premium ? 'premium-avatar-ring' : ''}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border: 1px solid var(--brand-brown);">
                        ${otherUser.is_premium ? '<i class="fa-solid fa-crown premium-crown-badge"></i>' : ''}
                        ${isUnread ? '<div style="position:absolute; top:0; right:0; width:10px; height:10px; background:var(--brand-brown); border-radius:50%; border:2px solid var(--bg-main);"></div>' : ''}
                    </div>
                    <div style="flex: 1; overflow: hidden;">
                        <div style="font-weight:600; font-size:0.9rem; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center;">${window.escapeHtml ? window.escapeHtml((otherUser.name || 'Anonymous').split(' ')[0]) : (otherUser.name || 'Anonymous').split(' ')[0]}${verifiedBadgeSmall}</div>
                        ${msg ? '<div class="sidebar-match-msg" style="font-size:0.75rem; color:' + (isUnread ? 'var(--brand-brown)' : 'var(--text-muted)') + '; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:' + (isUnread ? 'bold' : 'normal') + ';">' + (msg.sender === currentUser.id ? 'You: ' : '') + (window.escapeHtml ? window.escapeHtml(previewText) : previewText.replace(/</g, "&lt;")) + '</div>' : '<div class="sidebar-match-msg" style="font-size:0.75rem; color:var(--brand-brown);">New Match!</div>'}
                    </div>
                </div>
            `;
        }
        if (chatsHtml === '') {
            chatsHtml = `
                <div style="text-align: center; color: var(--text-muted); margin-top: 2rem; font-size: 0.95rem;">
                    <i class="fa-regular fa-comments" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; display: block;"></i>
                    No matches yet. Keep swiping!
                </div>
            `;
        }
        if (matchCount === 0) {
            sidebarHtml += `<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center;">Your matches will appear here.</p>`;
        }
        sidebarHtml += '</div>';
        if (chatsList) chatsList.innerHTML = chatsHtml;
        if (fastSwitcher) fastSwitcher.innerHTML = switcherHtml;
        if (sidebarMatches) sidebarMatches.innerHTML = sidebarHtml;
        localStorage.setItem('globalUnreadCount', unreadTotal);
        if (window.updateCombinedBadge) window.updateCombinedBadge();
        document.querySelectorAll('.long-press-unmatch').forEach(el => {
            let pressTimer;
            const startPress = (e) => {
                if (e.type === 'contextmenu') {
                    e.preventDefault();
                    triggerModal();
                    return;
                }
                pressTimer = setTimeout(() => {
                    triggerModal();
                }, 600); 
            };
            const cancelPress = () => {
                clearTimeout(pressTimer);
            };
            const triggerModal = () => {
                const mId = el.getAttribute('data-match-id');
                const oUserRaw = el.getAttribute('data-other-user');
                if (mId && oUserRaw) {
                    try {
                        const oUser = JSON.parse(oUserRaw);
                        window.triggerUnmatchModal(mId, oUser);
                    } catch (e) { }
                }
            };
            el.addEventListener('mousedown', startPress);
            el.addEventListener('touchstart', startPress, { passive: true });
            el.addEventListener('mouseup', cancelPress);
            el.addEventListener('mouseleave', cancelPress);
            el.addEventListener('touchend', cancelPress);
            el.addEventListener('touchcancel', cancelPress);
            el.addEventListener('contextmenu', startPress);
        });
    } catch (err) {
        if (err.isAbort) {
            return;
        }
        console.error("Error loading matches:", err);
        if (err.data) {
            console.error("Match error details:", JSON.stringify(err.data, null, 2));
        }
    }
}
window.updateActiveChatStatus = function (otherUser) {
    const statusEl = document.getElementById('active-chat-status');
    if (!statusEl || !otherUser) return;
    if (otherUser.isBlocked) {
        statusEl.innerHTML = '';
        statusEl.style.display = 'none';
        return;
    }
    statusEl.style.display = 'block';
    let statusText = 'Offline';
    let statusColor = ''; 
    if (!otherUser.ghost_status && currentUser && !currentUser.ghost_status) {
        let diffMins = 999999;
        if (otherUser.last_active) {
            const lastActiveDate = new Date(String(otherUser.last_active).replace(' ', 'T'));
            diffMins = Math.floor((new Date() - lastActiveDate) / 60000);
        }
        if (diffMins < 5) {
            statusText = '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#4CAF50; margin-right:4px; box-shadow: 0 0 5px #4CAF50;"></span> Online';
            statusColor = '#4CAF50';
        } else if (otherUser.last_active) {
            if (diffMins < 60) {
                statusText = `Last active ${diffMins || 1}m ago`;
            } else if (diffMins < 1440) {
                statusText = `Last active ${Math.floor(diffMins / 60)}h ago`;
            } else {
                statusText = `Last active ${Math.floor(diffMins / 1440)}d ago`;
            }
        }
    }
    if (statusText === 'Offline') {
        statusEl.innerHTML = '';
        statusEl.style.display = 'none';
    } else {
        statusEl.innerHTML = statusText;
        if (statusColor) {
            statusEl.style.color = statusColor;
        } else {
            statusEl.style.removeProperty('color'); 
        }
    }
};
window.openPocketBaseChat = async function (matchId, otherUser, isRestore = false) {
    currentChatMatchId = matchId;
    currentChatOtherUser = otherUser;
    try {
        const freshUser = await pb.collection('users').getOne(otherUser.id);
        const myBlocked = (currentUser && currentUser.blocked_users) ? currentUser.blocked_users : [];
        const theirBlocked = freshUser.blocked_users || [];
        const iBlockedThem = myBlocked.includes(freshUser.id);
        const theyBlockedMe = theirBlocked.includes(currentUser.id);
        const isCurrentlyBlocked = iBlockedThem || theyBlockedMe;
        if (isCurrentlyBlocked) {
            freshUser.name = "Blocked User";
            freshUser.photos = [];
            freshUser.is_premium = false;
            freshUser.is_verified = false;
            freshUser.bio = "";
            freshUser.isBlocked = true;
        }
        freshUser.iBlockedThem = iBlockedThem;
        currentChatOtherUser = freshUser;
        otherUser = freshUser;
    } catch (e) {
        console.error("Failed to fetch fresh user for status", e);
        const myBlocked = (currentUser && currentUser.blocked_users) ? currentUser.blocked_users : [];
        const iBlockedThem = myBlocked.includes(otherUser.id);
        if (iBlockedThem) {
            otherUser.name = "Blocked User";
            otherUser.photos = [];
            otherUser.is_premium = false;
            otherUser.is_verified = false;
            otherUser.bio = "";
            otherUser.isBlocked = true;
        }
        otherUser.iBlockedThem = iBlockedThem;
    }
    localStorage.setItem('activeChatMatchId', matchId);
    localStorage.setItem('activeChatOtherUser', JSON.stringify(otherUser));
    const panel = document.getElementById('chat-inbox-panel');
    if (!isRestore && panel && panel.classList.contains('minimized')) {
        panel.classList.remove('minimized');
        document.body.classList.remove('chat-minimized');
        localStorage.setItem('chatPanelState', 'open');
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
            if (!document.body.classList.contains('chat-active')) {
                document.body.style.top = `-${window.scrollY}px`;
                document.body.classList.add('chat-active');
            }
        }
    }
    if (panel && panel.style.display !== 'flex') {
        panel.style.display = 'flex';
        setTimeout(() => panel.classList.add('open'), 10);
        localStorage.setItem('chatPanelState', 'open');
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
            if (!document.body.classList.contains('chat-active')) {
                document.body.style.top = `-${window.scrollY}px`;
                document.body.classList.add('chat-active');
            }
        }
    }
    document.getElementById('active-chat-view').style.display = 'flex';
    if (panel) {
        panel.classList.add('has-active-chat');
        if (window.updateChatMinimizeOffset) window.updateChatMinimizeOffset();
    }
    const verifiedBadge = otherUser.is_verified ? `<span style="display: inline-flex; position: relative; width: 13px; height: 13px; align-items: center; justify-content: center; transform: translateY(-5px); margin-left: 2px;" title="Verified Profile"><i class="fa-solid fa-certificate" style="color: #1DA1F2; font-size: 13px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></i><i class="fa-solid fa-check" style="color: #fff; font-size: 13px; position: absolute; z-index: 1; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.55);"></i></span>` : '';
    document.getElementById('active-chat-name').innerHTML = `${window.escapeHtml ? window.escapeHtml(otherUser.name) : otherUser.name.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; })}${verifiedBadge}`;
    window.updateActiveChatStatus(otherUser);
    const atBtn = document.getElementById('auto-translate-btn');
    if (atBtn) {
        if (autoTranslateUsers[otherUser.id]) {
            atBtn.innerHTML = '<i class="fa-solid fa-language"></i> Disable Auto-Translate';
        } else {
            atBtn.innerHTML = '<i class="fa-solid fa-language"></i> Auto-Translate';
        }
    }
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        if (window.innerWidth > 768) {
            chatInput.focus();
        } else {
            if (document.body.classList.contains('keyboard-open')) {
                chatInput.focus();
            }
        }
    }
    fetchAndRenderMatches();
    const chatInputWrapper = document.querySelector('.chat-input-area');
    const sendBtn = document.getElementById('chat-send-btn');
    const blockBanner = document.getElementById('read-only-block-banner');
    if (blockBanner) blockBanner.style.display = 'none'; 
    if (otherUser.isBlocked) {
        if (chatInputWrapper) chatInputWrapper.style.display = 'flex';
        if (chatInput) {
            chatInput.disabled = true;
            chatInput.placeholder = 'Chat unavailable';
            chatInput.value = '';
        }
        if (sendBtn) sendBtn.disabled = true;
        const viewProfileBtn = document.getElementById('view-chat-profile-btn');
        if (viewProfileBtn) viewProfileBtn.style.display = 'none';
        const avatarEl = document.getElementById('active-chat-avatar');
        if (avatarEl) {
            avatarEl.onclick = null;
            avatarEl.style.cursor = 'default';
        }
        const nameEl = document.getElementById('active-chat-name');
        if (nameEl) {
            nameEl.onclick = null;
            nameEl.style.cursor = 'default';
        }
        document.getElementById('chat-menu-btn').style.display = 'block';
        if (otherUser.iBlockedThem) {
            if (document.getElementById('block-user-btn')) document.getElementById('block-user-btn').style.display = 'none';
            if (document.getElementById('unblock-user-btn')) document.getElementById('unblock-user-btn').style.display = 'block';
        } else {
            if (document.getElementById('block-user-btn')) document.getElementById('block-user-btn').style.display = 'block';
            if (document.getElementById('unblock-user-btn')) document.getElementById('unblock-user-btn').style.display = 'none';
        }
    } else {
        if (chatInputWrapper) chatInputWrapper.style.display = 'flex';
        if (chatInput) {
            chatInput.disabled = false;
            chatInput.placeholder = 'Type a message...';
        }
        if (sendBtn) sendBtn.disabled = false;
        const viewProfileBtn = document.getElementById('view-chat-profile-btn');
        if (viewProfileBtn) viewProfileBtn.style.display = 'block';
        const avatarEl = document.getElementById('active-chat-avatar');
        if (avatarEl) avatarEl.style.cursor = 'pointer';
        const nameEl = document.getElementById('active-chat-name');
        if (nameEl) nameEl.style.cursor = 'pointer';
        document.getElementById('chat-menu-btn').style.display = 'block';
        if (document.getElementById('block-user-btn')) document.getElementById('block-user-btn').style.display = 'block';
        if (document.getElementById('unblock-user-btn')) document.getElementById('unblock-user-btn').style.display = 'none';
    }
    await loadChatHistory(matchId);
    // Aviary: Render in-chat bird perch widget for active flights
    if (window.renderChatBirdPerch && otherUser && otherUser.id) {
        try { window.renderChatBirdPerch(otherUser.id); } catch (e) { }
    }
}
async function loadChatHistory(matchId) {
    const container = document.getElementById('chat-messages');
    container.innerHTML = ''; 
    try {
        const messagesRaw = await pb.collection('messages').getFullList({
            filter: `match_id = "${matchId}"`,
            sort: '', 
            $autoCancel: false
        });
        let messages = messagesRaw || [];
        messages = messages.filter(msg => {
            if (msg.hiddenFor && Array.isArray(msg.hiddenFor)) {
                if (msg.hiddenFor.includes(currentUser.id)) return false;
            }
            if (window.showingStarredOnly) {
                if (!msg.starredBy || !Array.isArray(msg.starredBy) || !msg.starredBy.includes(currentUser.id)) {
                    return false;
                }
            }
            return true;
        });
        messages.sort((a, b) => {
            const aTime = new Date(String(a.created || a.sent_at || a.createdAt || a.timestamp || '').replace(' ', 'T')).getTime() || 0;
            const bTime = new Date(String(b.created || b.sent_at || b.createdAt || b.timestamp || '').replace(' ', 'T')).getTime() || 0;
            return aTime - bTime; 
        });
        if (messages.length > 200) {
            messages = messages.slice(-200);
        }
        container.innerHTML = `
            <div style="text-align: center; margin: 15px; padding: 12px 15px; background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; font-size: 0.85rem; color: var(--text-muted);">
                <div style="font-weight: 600; margin-bottom: 5px; color: #b78a00;"><i class="fa-solid fa-shield-halved"></i> YatrAmore Safety Notice</div>
                For your protection, never share sensitive personal information, passwords, or financial details. YatrAmore is not responsible for your interactions or real-life meetings. If this user makes you uncomfortable, please use the top right menu to block <i class="fa-solid fa-ban"></i> or report <i class="fa-solid fa-flag"></i> them.
            </div>
        `;
        let lastDate = '';
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        let firstUnreadId = null;
        for (const msg of messages) {
            if (msg.sender !== currentUser.id && !msg.read) {
                firstUnreadId = msg.id;
                break;
            }
        }
        for (const msg of messages) {
            const createdStr = msg.created || msg.sent_at || msg.createdAt || msg.timestamp || new Date().toISOString();
            const msgDate = new Date(String(createdStr).replace(' ', 'T'));
            let dateLabel = msgDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            if (msgDate.toDateString() === today.toDateString()) {
                dateLabel = 'Today';
            } else if (msgDate.toDateString() === yesterday.toDateString()) {
                dateLabel = 'Yesterday';
            }
            if (dateLabel !== lastDate) {
                const divider = document.createElement('div');
                divider.className = 'chat-date-separator';
                divider.style.cssText = 'text-align: center; margin: 16px 0; font-size: 0.75rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 1px;';
                const pill = document.createElement('span');
                pill.style.cssText = 'background: var(--glass-border); padding: 4px 12px; border-radius: 12px; backdrop-filter: blur(4px);';
                pill.textContent = dateLabel;
                divider.appendChild(pill);
                container.appendChild(divider);
                lastDate = dateLabel;
            }
            if (msg.id === firstUnreadId) {
                const unreadDiv = document.createElement('div');
                unreadDiv.id = 'unread-messages-divider';
                unreadDiv.style.cssText = 'display: flex; align-items: center; text-align: center; margin: 20px 0; scroll-margin-top: 80px; font-size: 0.75rem; color: var(--brand-brown); font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; opacity: 1; transition: opacity 1.5s ease-out;';
                unreadDiv.innerHTML = '<hr style="flex:1; border:none; border-top:1px dashed rgba(107, 66, 38, 0.4); margin-right:15px;"><span style="background: rgba(107, 66, 38, 0.1); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(107, 66, 38, 0.2);"><i class="fa-solid fa-chevron-down"></i> &nbsp; Unread Messages &nbsp; <i class="fa-solid fa-chevron-down"></i></span><hr style="flex:1; border:none; border-top:1px dashed rgba(107, 66, 38, 0.4); margin-left:15px;">';
                container.appendChild(unreadDiv);
                setTimeout(() => {
                    if (window.IntersectionObserver) {
                        const obs = new IntersectionObserver((entries) => {
                            if (entries[0].isIntersecting) {
                                setTimeout(() => {
                                    unreadDiv.style.opacity = '0';
                                    setTimeout(() => unreadDiv.remove(), 1500);
                                }, 3000);
                                obs.disconnect();
                            }
                        }, { threshold: 0.1 });
                        obs.observe(unreadDiv);
                    }
                }, 500);
            }
            let shouldSkipTranslate = true;
            if (msg.sender !== currentUser.id) {
                const activatedAt = autoTranslateUsers[msg.sender];
                if (activatedAt) {
                    const msgTime = new Date(String(msg.created || msg.sent_at || msg.createdAt || msg.timestamp || '').replace(' ', 'T')).getTime() || 0;
                    if (msgTime >= activatedAt) {
                        shouldSkipTranslate = false;
                    }
                }
            }
            appendMessageToUI(msg, shouldSkipTranslate);
            if (msg.sender !== currentUser.id && !msg.read) {
                if (currentUser.ghost_read_receipts) {
                    let ghostRead = JSON.parse(localStorage.getItem('ghostReadMessages') || '[]');
                    if (!ghostRead.includes(msg.id)) {
                        ghostRead.push(msg.id);
                        if (ghostRead.length > 500) ghostRead = ghostRead.slice(-500);
                        localStorage.setItem('ghostReadMessages', JSON.stringify(ghostRead));
                    }
                }
            }
        }
        if (!currentUser.ghost_read_receipts) {
            try {
                const unreadResult = messages.filter(m => m.sender !== currentUser.id && (!m.read || m.read === 0 || m.read === 'false'));
                if (unreadResult.length > 0) {
                    const processReadReceipts = async () => {
                        let currentGlobalUnread = parseInt(localStorage.getItem('globalUnreadCount') || '0');
                        let newGlobalUnread = Math.max(0, currentGlobalUnread - unreadResult.length);
                        localStorage.setItem('globalUnreadCount', newGlobalUnread);
                        const navCupidBadge = document.getElementById('nav-cupid-notification');
                        if (window.updateCombinedBadge) window.updateCombinedBadge();
                        const sidebarDot = document.querySelector(`.chat-item[data-match-id="${matchId}"] .unread-dot`);
                        if (sidebarDot) sidebarDot.style.display = 'none';
                        const updatePromises = unreadResult.map(msg =>
                            pb.collection('messages').update(msg.id, { read: true }).catch(console.error)
                        );
                        await Promise.all(updatePromises);
                        fetchAndRenderMatches();
                    };
                    if (document.visibilityState === 'visible') {
                        processReadReceipts();
                    } else {
                        if (window.activeChatVisibilityHandler) {
                            document.removeEventListener('visibilitychange', window.activeChatVisibilityHandler);
                        }
                        window.activeChatVisibilityHandler = () => {
                            if (document.visibilityState === 'visible') {
                                if (window.currentChatMatchId === matchId) {
                                    processReadReceipts();
                                }
                                document.removeEventListener('visibilitychange', window.activeChatVisibilityHandler);
                                window.activeChatVisibilityHandler = null;
                            }
                        };
                        document.addEventListener('visibilitychange', window.activeChatVisibilityHandler);
                    }
                }
            } catch (e) {
                window.debugLog("Read receipt update failed:", e);
            }
        }
        if (window.pendingScrollToMessage) {
            const msgEl = document.querySelector(`.chat-message-wrapper[data-msg-id="${window.pendingScrollToMessage}"]`);
            if (msgEl) {
                setTimeout(() => {
                    msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    msgEl.style.transition = 'background-color 0.5s';
                    const origBg = msgEl.style.backgroundColor;
                    msgEl.style.backgroundColor = 'rgba(218, 165, 32, 0.2)';
                    setTimeout(() => { msgEl.style.backgroundColor = origBg; }, 1500);
                }, 300);
            }
            window.pendingScrollToMessage = null;
        } else {
            const unreadDiv = document.getElementById('unread-messages-divider');
            if (unreadDiv) {
                unreadDiv.scrollIntoView({ behavior: 'auto', block: 'start' });
            } else {
                container.scrollTop = container.scrollHeight;
            }
        }
    } catch (err) {
        console.error("Error loading messages:", err);
        const safeError = window.escapeHtml ? window.escapeHtml(err.message || err.toString()) : (err.message || err.toString()).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; });
        container.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Failed to load messages: ${safeError}</div>`;
    }
}
async function appendMessageToUI(msg, skipAutoTranslate = false) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    if (msg.hiddenFor && Array.isArray(msg.hiddenFor) && msg.hiddenFor.includes(currentUser.id)) {
        const existingWrap = document.querySelector(`.chat-message-wrapper[data-msg-id="${msg.id}"]`);
        if (existingWrap) existingWrap.remove();
        return; 
    }
    let wrap = document.querySelector(`.chat-message-wrapper[data-msg-id="${msg.id}"]`);
    let isUpdating = !!wrap;
    if (!wrap) {
        wrap = document.createElement('div');
    }
    const isMe = msg.sender === currentUser.id;
    const createdStr = msg.created || msg.sent_at || msg.createdAt || msg.timestamp || new Date().toISOString();
    const time = new Date(String(createdStr).replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    wrap.className = `chat-message-wrapper ${isMe ? 'is-sent' : 'is-received'}`;
    wrap.dataset.msgId = msg.id;
    wrap.dataset.rawText = encodeURIComponent(msg.text);
    wrap.dataset.isDeleted = msg.isDeleted === true ? 'true' : 'false';
    wrap.dataset.isStarred = msg.starredBy && msg.starredBy.includes(currentUser.id) ? 'true' : 'false';
    let parsedReactions = msg.reactions;
    if (typeof parsedReactions === 'string') {
        try { parsedReactions = JSON.parse(parsedReactions); } catch(e) { parsedReactions = {}; }
    }
    wrap.dataset.reactionsString = JSON.stringify(parsedReactions || {});
    wrap.dataset.starredByString = JSON.stringify(msg.starredBy || []);
    const createdDate = new Date(String(createdStr).replace(' ', 'T'));
    const isWithin5Mins = (new Date() - createdDate) < 5 * 60 * 1000;
    wrap.dataset.isRecent = isWithin5Mins ? 'true' : 'false';
    let ticksHtml = '';
    if (isMe) {
        const canSeeReadReceipts = (!currentUser.ghost_read_receipts && currentChatOtherUser && !currentChatOtherUser.ghost_read_receipts);
        const showBlueTick = canSeeReadReceipts && msg.read;
        ticksHtml = `<span style="font-size:0.75rem; margin-left:6px; color:${showBlueTick ? '#4fc3f7' : 'rgba(255,255,255,0.6)'};"><i class="fa-solid fa-check-double"></i></span>`;
    }
    const isEdited = msg.text && String(msg.text).indexOf('\u200B') !== -1;
    const safeText = window.escapeHtml ? window.escapeHtml(msg.text) : msg.text.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; });
    let themeClass = msg.sender_theme;
    if (!themeClass) {
        const isSenderPremium = isMe ? currentUser.is_premium : (currentChatOtherUser && currentChatOtherUser.is_premium);
        const isSenderVerified = isMe ? currentUser.is_verified : (currentChatOtherUser && currentChatOtherUser.is_verified);
        if (isSenderPremium) themeClass = 'theme-premium';
        else if (isSenderVerified) themeClass = 'theme-verified';
        else themeClass = 'theme-basic';
    }
    const bubbleClass = `chat-bubble ${themeClass}`;
    if (msg.isDeleted === true) {
        wrap.innerHTML = `
            <div class="${bubbleClass}" style="opacity: 0.7; font-style: italic;">
                <span class="chat-text"><i class="fa-solid fa-ban"></i> This message was deleted</span>
                <span class="chat-meta">
                    ${time}
                </span>
            </div>
        `;
    } else {
        let reactionsHtml = '';
        if (parsedReactions && typeof parsedReactions === 'object' && Object.keys(parsedReactions).length > 0) {
            const reactionPosition = isMe ? 'left: 10px; right: auto;' : 'right: 10px; left: auto;';
            const emptyContainer = `<div style="position: absolute; bottom: -16px; ${reactionPosition} background: var(--bg-main); border: 1px solid var(--glass-border); border-radius: 12px; padding: 2px 6px; font-size: 0.8rem; box-shadow: 0 2px 5px rgba(0,0,0,0.2); display: flex; gap: 4px; z-index: 2;">`;
            reactionsHtml = emptyContainer;
            for (const [emoji, users] of Object.entries(parsedReactions)) {
                if (users && users.length > 0) {
                    const safeEmoji = window.escapeHtml ? window.escapeHtml(emoji) : emoji.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; });
                    const countHtml = users.length > 1 ? ` <small style="font-size:0.7em; opacity:0.8;">${users.length}</small>` : '';
                    reactionsHtml += `<span>${safeEmoji}${countHtml}</span>`;
                }
            }
            reactionsHtml += '</div>';
            if (reactionsHtml === emptyContainer + '</div>') {
                reactionsHtml = '';
            }
        }
        if (reactionsHtml) {
            wrap.style.marginBottom = '20px';
        } else {
            wrap.style.marginBottom = '';
        }
        let replyQuoteHtml = '';
        if (msg.reply_to && msg.reply_to_text) {
            const safeReplyId = window.escapeHtml ? window.escapeHtml(msg.reply_to) : msg.reply_to.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; });
            const safeReplyText = window.escapeHtml ? window.escapeHtml(msg.reply_to_text) : msg.reply_to_text.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; });
            const safeReplySender = window.escapeHtml ? window.escapeHtml(msg.reply_to_sender || '') : (msg.reply_to_sender || '').replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; });
            const truncatedReply = safeReplyText.length > 100 ? safeReplyText.substring(0, 100) + '…' : safeReplyText;
            replyQuoteHtml = `<div class="reply-quote" data-reply-id="${safeReplyId}" style="background: rgba(0,0,0,0.08); border-left: 3px solid var(--brand-brown); border-radius: 6px; padding: 6px 10px; margin-bottom: 6px; cursor: pointer; font-size: 0.82rem; max-width: 100%;" onclick="const el=document.querySelector('[data-msg-id=&quot;${safeReplyId}&quot;]'); if(el){el.scrollIntoView({behavior:'smooth',block:'center'}); el.style.background='rgba(107,66,38,0.15)'; setTimeout(()=>el.style.background='',1500);}">
                <div style="font-weight: 600; color: var(--brand-brown); font-size: 0.78rem; margin-bottom: 2px;">${safeReplySender}</div>
                <div style="color: var(--text-muted); opacity: 0.85;">${truncatedReply}</div>
            </div>`;
        }
        wrap.innerHTML = `
            <div class="${bubbleClass}">
                ${replyQuoteHtml}
                <span class="chat-text">${safeText}</span>
                <span class="chat-meta">
                    ${msg.starredBy && msg.starredBy.includes(currentUser.id) ? '<i class="fa-solid fa-star" style="color:#FFC107; margin-right:4px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);"></i>' : ''}${time} ${isEdited ? '<span style="font-size: 0.85em; opacity: 0.7; margin-left: 3px; font-style: italic;">(edited)</span>' : ''} ${ticksHtml}
                </span>
                ${reactionsHtml}
            </div>
        `;
    }
    if (!isUpdating) {
        container.appendChild(wrap);
        container.scrollTop = container.scrollHeight;
    }
    const bubble = wrap.querySelector('.premium-chat-bubble') || wrap.querySelector('.chat-bubble');
    if (bubble && window.attachTranslationToMessage) {
        window.attachTranslationToMessage(bubble, msg.text);
    }
    if (!skipAutoTranslate && !isMe && currentChatOtherUser && autoTranslateUsers[currentChatOtherUser.id]) {
        try {
            const targetLang = currentUser.preferredLanguage || 'en';
            let chatTranslationCache = {};
            try { chatTranslationCache = JSON.parse(localStorage.getItem('chatTranslationCache') || '{}'); } catch(e) {}
            const cacheKey = msg.id + '_' + targetLang;
            let translatedText = '';
            if (chatTranslationCache[cacheKey] && chatTranslationCache[cacheKey].original === msg.text) {
                translatedText = chatTranslationCache[cacheKey].translated;
                const translationBlock = document.createElement('div');
                translationBlock.className = 'chat-translation-block';
                translationBlock.style.marginTop = '8px';
                translationBlock.style.paddingTop = '8px';
                translationBlock.style.borderTop = '1px solid rgba(128,128,128,0.2)';
                translationBlock.style.fontSize = '0.9rem';
                translationBlock.style.color = 'inherit';
                translationBlock.style.opacity = '0.85';
                const safeTrans = window.escapeHtml ? window.escapeHtml(translatedText) : translatedText.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; });
                translationBlock.innerHTML = `<i class="fa-solid fa-language" style="opacity:0.6; margin-right:5px;"></i> ${safeTrans}`;
                bubble.appendChild(translationBlock);
            } else {
                const translationBlock = document.createElement('div');
                translationBlock.className = 'chat-translation-block';
                translationBlock.style.marginTop = '8px';
                translationBlock.style.paddingTop = '8px';
                translationBlock.style.borderTop = '1px solid rgba(128,128,128,0.2)';
                translationBlock.style.fontSize = '0.9rem';
                translationBlock.style.color = 'inherit';
                translationBlock.style.opacity = '0.85';
                translationBlock.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Translating to ${targetLang}...`;
                bubble.appendChild(translationBlock);
                const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(msg.text)}`);
                const data = await res.json();
                translatedText = data[0].map(item => item[0]).join('');
                chatTranslationCache[cacheKey] = { original: msg.text, translated: translatedText };
                const cacheKeys = Object.keys(chatTranslationCache);
                if (cacheKeys.length > 100) { 
                    const keysToRemove = cacheKeys.slice(0, cacheKeys.length - 100);
                    keysToRemove.forEach(k => delete chatTranslationCache[k]);
                }
                localStorage.setItem('chatTranslationCache', JSON.stringify(chatTranslationCache));
                const safeTrans = window.escapeHtml ? window.escapeHtml(translatedText) : translatedText.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; });
                translationBlock.innerHTML = `<i class="fa-solid fa-language" style="opacity:0.6; margin-right:5px;"></i> ${safeTrans}`;
            }
        } catch (e) {
            console.error("Auto-translate failed", e);
        }
    }
}
window.editingMessageId = null;
window.startEditMessage = (msgId, rawText) => {
    window.editingMessageId = msgId;
    const input = document.getElementById('chat-input');
    input.value = rawText;
    input.focus();
    const banner = document.getElementById('chat-edit-banner');
    if (banner) banner.style.display = 'flex';
};
window.cancelEditMessage = () => {
    window.editingMessageId = null;
    document.getElementById('chat-input').value = '';
    const banner = document.getElementById('chat-edit-banner');
    if (banner) banner.style.display = 'none';
};
let recentMessageTimestamps = [];
let isSpamCooldown = false;
async function sendMessage() {
    if (isSpamCooldown) return;
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat-btn');
    const text = input.value.trim();
    if (!text || !currentChatMatchId) return;
    const nowMs = Date.now();
    recentMessageTimestamps = recentMessageTimestamps.filter(t => nowMs - t < 1000);
    if (recentMessageTimestamps.length >= 4) {
        if (window.showToast) window.showToast("Spam detected. Chat paused for 3 seconds.", false);
        isSpamCooldown = true;
        input.disabled = true;
        if (sendBtn) sendBtn.style.opacity = '0.3';
        setTimeout(() => {
            isSpamCooldown = false;
            input.disabled = false;
            if (sendBtn) sendBtn.style.opacity = '1';
            input.focus();
        }, 3000);
        return;
    }
    recentMessageTimestamps.push(nowMs);
    input.value = '';
    window.playChatSound('send');
    let tempId = null;
    try {
        if (window.editingMessageId) {
            await pb.collection('messages').update(window.editingMessageId, {
                text: text
            }, { $autoCancel: false });
            window.cancelEditMessage();
            loadChatHistory(currentChatMatchId);
        } else {
            tempId = 'temp_' + Date.now();
            const tempMsg = {
                id: tempId,
                match_id: currentChatMatchId,
                sender: currentUser.id,
                text: text,
                read: false,
                created: new Date().toISOString()
            };
            appendMessageToUI(tempMsg);
            const tempEl = document.querySelector(`.chat-message-wrapper[data-msg-id="${tempId}"]`);
            if (tempEl) {
                tempEl.style.opacity = '0.6';
                tempEl.style.transition = 'opacity 0.2s';
            }
            const themeStr = currentUser.is_premium ? 'theme-premium' : (currentUser.is_verified ? 'theme-verified' : 'theme-basic');
            const createPayload = {
                match_id: currentChatMatchId,
                sender: currentUser.id,
                text: text,
                sender_theme: themeStr,
                sent_at: new Date().toISOString()
            };
            if (replyToMsgId) {
                createPayload.reply_to = replyToMsgId;
                createPayload.reply_to_text = replyToText || '';
                createPayload.reply_to_sender = replyToSender || '';
            }
            window.cancelReply();
            const newMsg = await pb.collection('messages').create(createPayload, { $autoCancel: false });
            if (tempEl) tempEl.remove();
            const existing = document.querySelector(`.chat-message-wrapper[data-msg-id="${newMsg.id}"]`);
            if (!existing) {
                appendMessageToUI(newMsg);
            }
        }
    } catch (err) {
        console.error("Failed to send/edit message:", err);
        if (tempId) {
            const failedEl = document.querySelector(`.chat-message-wrapper[data-msg-id="${tempId}"]`);
            if (failedEl) failedEl.remove();
        }
        if (window.showToast) window.showToast("Failed to send message: " + (err.message || err.data?.message || err.toString()), false);
    }
}
let pressTimer = null;
let currentTargetMsgId = null;
let currentTargetMsgElement = null;
const chatMessagesContainer = document.getElementById('chat-messages');
const chatOverlay = document.getElementById('ctx-overlay');
const reactionBar = document.getElementById('ctx-reaction-bar');
const actionMenu = document.getElementById('ctx-action-menu');
let clonedMsgElement = null;
let touchStartX = 0;
let touchStartY = 0;
let isSwiping = false;
let replyToMsgId = null;
let replyToText = null;
let replyToSender = null;
window.setReplyContext = function(msgId, text, senderName) {
    replyToMsgId = msgId;
    replyToText = text;
    replyToSender = senderName;
    const bar = document.getElementById('reply-preview-bar');
    if (bar) {
        document.getElementById('reply-preview-sender').textContent = senderName;
        document.getElementById('reply-preview-text').textContent = text.length > 80 ? text.substring(0, 80) + '…' : text;
        bar.style.display = 'block';
    }
    const chatInput = document.getElementById('chat-input');
    if (chatInput) chatInput.focus();
};
window.cancelReply = function() {
    replyToMsgId = null;
    replyToText = null;
    replyToSender = null;
    const bar = document.getElementById('reply-preview-bar');
    if (bar) bar.style.display = 'none';
};
if (chatMessagesContainer) {
    chatMessagesContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    chatMessagesContainer.addEventListener('mousedown', handleTouchStart);
    chatMessagesContainer.addEventListener('touchend', handleTouchEnd);
    chatMessagesContainer.addEventListener('mouseup', handleTouchEnd);
    chatMessagesContainer.addEventListener('mouseleave', handleTouchEnd);
    chatMessagesContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
}
function handleTouchStart(e) {
    const msgElement = e.target.closest('.chat-message-wrapper');
    if (!msgElement) return;
    if (msgElement.dataset.isDeleted === 'true') return;
    touchStartX = e.touches ? e.touches[0].clientX : e.clientX;
    touchStartY = e.touches ? e.touches[0].clientY : e.clientY;
    isSwiping = false;
    pressTimer = setTimeout(() => {
        if (!isSwiping) {
            showContextMenu(msgElement, e);
        }
    }, 500);
}
function handleTouchMove(e) {
    if (!touchStartX) return;
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaX = currentX - touchStartX;
    const deltaY = Math.abs(currentY - touchStartY);
    if (deltaY > 15) {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
        return;
    }
    if (deltaX > 15) { 
        isSwiping = true;
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
        const msgElement = e.target.closest('.chat-message-wrapper');
        if (msgElement) {
            const maxSwipe = 60;
            const swipeDist = Math.min(deltaX, maxSwipe);
            msgElement.style.transition = 'none';
            msgElement.style.transform = `translateX(${swipeDist}px)`;
        }
    }
}
function handleTouchEnd(e) {
    if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
    }
    if (!touchStartX) return;
    const currentX = (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : (e.clientX || touchStartX);
    const deltaX = currentX - touchStartX;
    const msgElement = e.target.closest('.chat-message-wrapper');
    if (isSwiping && msgElement) {
        msgElement.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        msgElement.style.transform = 'translateX(0)';
        if (deltaX > 40 && msgElement.dataset.isDeleted !== 'true') {
            if (navigator.vibrate) navigator.vibrate(30);
            const rawText = decodeURIComponent(msgElement.dataset.rawText || '');
            const isMe = msgElement.classList.contains('is-sent');
            const senderName = isMe ? (currentUser.name || 'You') : (currentChatOtherUser ? currentChatOtherUser.name : 'Them');
            window.setReplyContext(msgElement.dataset.msgId, rawText, senderName);
        }
    }
    touchStartX = 0;
    touchStartY = 0;
    isSwiping = false;
}
function showContextMenu(msgElement, event) {
    currentTargetMsgElement = msgElement;
    currentTargetMsgId = msgElement.dataset.msgId;
    const isMe = msgElement.classList.contains('is-sent');
    const isWithin5Mins = msgElement.getAttribute('data-is-recent') === 'true';
    const isStarred = msgElement.getAttribute('data-is-starred') === 'true';
    const rawText = decodeURIComponent(msgElement.dataset.rawText || '');
    if (chatOverlay && chatOverlay.parentNode !== document.body) document.body.appendChild(chatOverlay);
    if (reactionBar && reactionBar.parentNode !== document.body) document.body.appendChild(reactionBar);
    if (actionMenu && actionMenu.parentNode !== document.body) document.body.appendChild(actionMenu);
    if (navigator.vibrate) navigator.vibrate(50);
    const starBtn = document.getElementById('ctx-star-btn');
    if (starBtn) {
        if (isStarred) {
            starBtn.querySelector('span').innerText = 'Unstar';
            starBtn.querySelector('i').classList.remove('fa-regular');
            starBtn.querySelector('i').classList.add('fa-solid');
        } else {
            starBtn.querySelector('span').innerText = 'Star';
            starBtn.querySelector('i').classList.remove('fa-solid');
            starBtn.querySelector('i').classList.add('fa-regular');
        }
    }
    document.getElementById('ctx-edit-btn').style.display = (isMe && isWithin5Mins) ? 'flex' : 'none';
    document.getElementById('ctx-del-everyone-btn').style.display = (isMe && isWithin5Mins) ? 'flex' : 'none';
    const rect = msgElement.getBoundingClientRect();
    clonedMsgElement = msgElement.cloneNode(true);
    clonedMsgElement.style.position = 'fixed';
    clonedMsgElement.style.top = `${rect.top}px`;
    clonedMsgElement.style.left = `${rect.left}px`;
    clonedMsgElement.style.width = `${rect.width}px`;
    clonedMsgElement.style.margin = '0';
    clonedMsgElement.style.zIndex = '9999';
    clonedMsgElement.style.boxShadow = '0 5px 25px rgba(0,0,0,0.3)';
    clonedMsgElement.style.transform = 'scale(1)';
    clonedMsgElement.style.transition = 'top 0.2s, transform 0.2s';
    clonedMsgElement.style.pointerEvents = 'none';
    document.body.appendChild(clonedMsgElement);
    if (chatOverlay) chatOverlay.style.display = 'block';
    if (reactionBar) {
        reactionBar.style.display = 'flex';
        reactionBar.style.opacity = '0';
        reactionBar.style.transform = 'scale(0.95)';
        void reactionBar.offsetHeight;
    }
    if (actionMenu) {
        actionMenu.style.display = 'flex';
        actionMenu.style.opacity = '0';
        actionMenu.style.transform = 'scale(0.95)';
        void actionMenu.offsetHeight;
    }
    const maxBottom = Number(window.innerHeight) - 80;
    const emojiHeight = 50;
    let visibleButtons = 0;
    ['ctx-reply-btn', 'ctx-star-btn', 'ctx-copy-btn', 'ctx-translate-btn', 'ctx-edit-btn', 'ctx-del-me-btn', 'ctx-del-everyone-btn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn && btn.style.display !== 'none') visibleButtons++;
    });
    const actionHeight = visibleButtons > 0 ? (visibleButtons * 48) : 150;
    const padding = 8;
    const safeRectTop = Number(rect.top) || 0;
    window.originalMsgTop = safeRectTop;
    let msgTop = safeRectTop;
    const sandwichTop = msgTop - emojiHeight - padding;
    if (sandwichTop < 65) msgTop += (65 - sandwichTop);
    const sandwichBottom = msgTop + rect.height + padding + actionHeight;
    if (sandwichBottom > maxBottom) msgTop -= (sandwichBottom - maxBottom);
    if (reactionBar) {
        reactionBar.style.setProperty('position', 'fixed', 'important');
        reactionBar.style.setProperty('top', `${msgTop - emojiHeight - padding}px`, 'important');
    }
    if (actionMenu) {
        actionMenu.style.setProperty('position', 'fixed', 'important');
        actionMenu.style.setProperty('top', `${msgTop + rect.height + padding}px`, 'important');
    }
    const applyHorizontalAlign = (el) => {
        if (!el) return;
        if (isMe) {
            el.style.setProperty('right', `${Number(window.innerWidth) - rect.right}px`, 'important');
            el.style.setProperty('left', 'auto', 'important');
            el.style.transformOrigin = 'center right';
        } else {
            el.style.setProperty('left', `${rect.left}px`, 'important');
            el.style.setProperty('right', 'auto', 'important');
            el.style.transformOrigin = 'bottom left';
        }
    };
    applyHorizontalAlign(reactionBar);
    applyHorizontalAlign(actionMenu);
    requestAnimationFrame(() => {
        setTimeout(() => {
            if (clonedMsgElement) {
                clonedMsgElement.style.top = `${msgTop}px`;
                clonedMsgElement.style.transform = 'scale(1.03)';
            }
            if (chatOverlay) chatOverlay.style.opacity = '1';
            if (reactionBar) {
                reactionBar.style.opacity = '1';
                reactionBar.style.transform = 'scale(1)';
            }
            if (actionMenu) {
                actionMenu.style.opacity = '1';
                actionMenu.style.transform = 'scale(1)';
            }
        }, 10);
    });
    document.querySelectorAll('.ctx-emoji-btn').forEach(btn => {
        btn.onclick = () => {
            hideContextMenu();
            if (currentTargetMsgId) window.reactToMessage(currentTargetMsgId, btn.dataset.emoji);
        };
    });
    const setActionMenuClick = (id, callback) => {
        const el = document.getElementById(id);
        if (el) {
            el.onclick = () => {
                hideContextMenu();
                if (currentTargetMsgId) callback();
            };
        }
    };
    setActionMenuClick('ctx-star-btn', () => window.toggleStarMessage(currentTargetMsgId, isStarred));
    setActionMenuClick('ctx-copy-btn', () => {
        navigator.clipboard.writeText(rawText).then(() => {
            if (window.showToast) window.showToast("Message copied");
        });
    });
    setActionMenuClick('ctx-translate-btn', () => window.translateMessage(currentTargetMsgId, rawText));
    setActionMenuClick('ctx-edit-btn', () => window.startEditMessage(currentTargetMsgId, rawText));
    setActionMenuClick('ctx-del-me-btn', () => window.deleteMessageForMe(currentTargetMsgId));
    setActionMenuClick('ctx-del-everyone-btn', () => window.deleteMessageForEveryone(currentTargetMsgId));
    setActionMenuClick('ctx-reply-btn', () => {
        const rawText = decodeURIComponent(currentTargetMsgElement.dataset.rawText || '');
        const isMe = currentTargetMsgElement.classList.contains('is-sent');
        const senderName = isMe ? (currentUser.name || 'You') : (currentChatOtherUser ? currentChatOtherUser.name : 'Them');
        window.setReplyContext(currentTargetMsgId, rawText, senderName);
    });
}
function hideContextMenu() {
    if (chatOverlay) chatOverlay.style.opacity = '0';
    if (reactionBar) {
        reactionBar.style.opacity = '0';
        reactionBar.style.transform = 'scale(0.95)';
    }
    if (actionMenu) {
        actionMenu.style.opacity = '0';
        actionMenu.style.transform = 'scale(0.95)';
    }
    if (clonedMsgElement) {
        clonedMsgElement.style.opacity = '0';
        clonedMsgElement.style.transform = 'scale(1)';
        if (window.originalMsgTop !== undefined) {
            clonedMsgElement.style.top = `${window.originalMsgTop}px`;
        }
    }
    setTimeout(() => {
        if (chatOverlay) chatOverlay.style.display = 'none';
        if (reactionBar) reactionBar.style.display = 'none';
        if (actionMenu) actionMenu.style.display = 'none';
        if (clonedMsgElement) {
            clonedMsgElement.remove();
            clonedMsgElement = null;
        }
    }, 200);
}
if (chatOverlay) {
    chatOverlay.addEventListener('click', hideContextMenu);
    chatOverlay.addEventListener('touchstart', (e) => {
        e.preventDefault();
        hideContextMenu();
    });
}
const emojiPlusBtn = document.getElementById('ctx-emoji-plus-btn');
const customEmojiInput = document.getElementById('ctx-custom-emoji-input');
if (emojiPlusBtn) {
    const handleEmojiPlus = (e) => {
        e.preventDefault();
        e.stopPropagation();
        let picker = document.getElementById('custom-emoji-picker-overlay');
        if (!picker) {
            import('https://cdn.jsdelivr.net/npm/emoji-picker-element@1/index.js').then(() => {
                picker = document.createElement('div');
                picker.id = 'custom-emoji-picker-overlay';
                picker.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 10001; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);';
                const pickerElement = document.createElement('emoji-picker');
                pickerElement.classList.add('light'); 
                picker.appendChild(pickerElement);
                picker.onclick = (ev) => {
                    if (ev.target === picker) picker.style.display = 'none';
                };
                pickerElement.addEventListener('emoji-click', event => {
                    picker.style.display = 'none';
                    hideContextMenu();
                    if (currentTargetMsgId) {
                        window.reactToMessage(currentTargetMsgId, event.detail.unicode);
                    }
                });
                document.body.appendChild(picker);
            }).catch(err => {
                console.error("Failed to load emoji picker", err);
                if (window.showToast) window.showToast("Could not load emoji picker. Please check your connection.");
            });
        } else {
            picker.style.display = 'flex';
        }
    };
    emojiPlusBtn.addEventListener('click', handleEmojiPlus);
    emojiPlusBtn.addEventListener('touchend', handleEmojiPlus);
}
window.deleteMessageForEveryone = async (msgId) => {
    if (!currentChatMatchId || !msgId) return;
    try {
        await pb.collection('messages').update(msgId, { isDeleted: true });
        if (window.showToast) window.showToast("Message deleted for everyone");
    } catch (e) {
        console.error("Error deleting:", e);
        if (window.showToast) window.showToast("Failed to delete message");
    }
};
window.deleteMessageForMe = async (msgId) => {
    if (!currentChatMatchId || !msgId) return;
    try {
        const msg = await pb.collection('messages').getOne(msgId);
        let hiddenFor = msg.hiddenFor || [];
        if (!hiddenFor.includes(currentUser.id)) {
            hiddenFor.push(currentUser.id);
            await pb.collection('messages').update(msgId, { hiddenFor: hiddenFor });
            if (window.showToast) window.showToast("Message deleted for you");
        }
    } catch (e) {
        console.error("Error deleting for me:", e);
        if (window.showToast) window.showToast("Failed to delete message");
    }
};
window.toggleStarMessage = async (msgId, currentlyStarred) => {
    if (!currentChatMatchId || !msgId) return;
    try {
        const msg = await pb.collection('messages').getOne(msgId);
        let starredBy = msg.starredBy || [];
        if (currentlyStarred) {
            starredBy = starredBy.filter(id => id !== currentUser.id);
        } else {
            if (!starredBy.includes(currentUser.id)) starredBy.push(currentUser.id);
        }
        await pb.collection('messages').update(msgId, { starredBy: starredBy });
    } catch (e) {
        console.error("Error toggling star:", e);
    }
};
window.reactToMessage = async (msgId, emoji) => {
    if (!currentChatMatchId || !msgId) return;
    try {
        const msg = await pb.collection('messages').getOne(msgId);
        let reactions = msg.reactions || {};
        if (typeof reactions === 'string') {
            try { reactions = JSON.parse(reactions); } catch(e) { reactions = {}; }
        }
        let hadThisEmoji = false;
        if (reactions[emoji] && reactions[emoji].includes(currentUser.id)) {
            hadThisEmoji = true;
        }
        for (const e in reactions) {
            reactions[e] = reactions[e].filter(id => id !== currentUser.id);
            if (reactions[e].length === 0) delete reactions[e];
        }
        if (!hadThisEmoji) {
            if (!reactions[emoji]) reactions[emoji] = [];
            reactions[emoji].push(currentUser.id);
        }
        msg.reactions = reactions;
        appendMessageToUI(msg);
        await pb.collection('messages').update(msgId, { reactions: reactions });
    } catch (e) {
        console.error("Error reacting:", e);
    }
};
window.translateMessage = async (msgId, rawText) => {
    try {
        const targetLang = currentUser.preferredLanguage || 'en';
        if (window.showToast) window.showToast("Translating...");
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(rawText)}`);
        const data = await response.json();
        if (data && data[0]) {
            const translation = data[0].map(item => item[0]).join('');
            const msgEl = document.querySelector(`.chat-message-wrapper[data-msg-id="${msgId}"] .chat-text`);
            if (msgEl) {
                let transBlock = msgEl.parentNode.querySelector('.chat-translation-block');
                if (!transBlock) {
                    transBlock = document.createElement('div');
                    transBlock.className = 'chat-translation-block';
                    transBlock.style.marginTop = '8px';
                    transBlock.style.paddingTop = '8px';
                    transBlock.style.borderTop = '1px solid rgba(128,128,128,0.2)';
                    transBlock.style.fontSize = '0.9em';
                    transBlock.style.color = 'inherit';
                    transBlock.style.opacity = '0.85';
                    msgEl.parentNode.appendChild(transBlock);
                }
                const safeTranslation = window.escapeHtml ? window.escapeHtml(translation) : translation.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; });
                transBlock.innerHTML = `<em><i class="fa-solid fa-language"></i> ${safeTranslation}</em>`;
            }
        }
    } catch (e) {
        console.error("Error translating:", e);
        if (window.showToast) window.showToast("Translation failed");
    }
};
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (pb && pb.authStore && pb.authStore.isValid && window.initChatSystem) {
            window.initChatSystem();
        }
    }, 500); 
});
let globalNotifications = [];
window.fetchAndRenderNotifications = async function () {
    if (!pb || !pb.authStore.isValid) return;
    try {
        const notifs = await pb.collection('notifications').getFullList();
        notifs.sort((a, b) => new Date(String(b.created).replace(' ', 'T')) - new Date(String(a.created).replace(' ', 'T')));
        globalNotifications = notifs;
        renderNotifications();
        updateCombinedBadge();
    } catch (err) {
        console.error("Error fetching notifications:", err);
        const listEl = document.getElementById('notifications-list');
        if (listEl) {
            listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); margin-top: 2rem;">Error loading alerts. Please refresh or check database setup.</div>`;
        }
    }
};
function renderNotifications() {
    const listEl = document.getElementById('notifications-list');
    if (!listEl) return;
    if (globalNotifications.length === 0) {
        listEl.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); margin-top: 2rem; font-size: 0.95rem;">
                <i class="fa-regular fa-bell-slash" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; display: block;"></i>
                You're all caught up! Keep swiping.
            </div>`;
        return;
    }
    listEl.innerHTML = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
            <button id="clear-all-alerts-btn" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); border-radius: 20px; padding: 6px 14px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                <i class="fa-solid fa-trash-can" style="margin-right: 5px;"></i> Clear All
            </button>
        </div>
    `;
    globalNotifications.forEach(notif => {
        const item = document.createElement('div');
        item.className = `notification-item type-${notif.type} ${!notif.is_read ? 'unread' : ''}`;
        item.style.position = 'relative';
        let iconHtml = '<i class="fa-solid fa-bell"></i>';
        if (notif.type === 'match') iconHtml = '<i class="fa-solid fa-heart"></i>';
        else if (notif.type === 'reaction' || (notif.type === 'system' && notif.message.includes('reacted with'))) iconHtml = '<i class="fa-solid fa-face-smile" style="color: #ff9800;"></i>';
        else if (notif.type === 'verification_approved') iconHtml = '<i class="fa-solid fa-user-check"></i>';
        else if (notif.type === 'verification_rejected') iconHtml = '<i class="fa-solid fa-user-xmark"></i>';
        else if (notif.type === 'admin_warning') iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
        const baseDateStr = notif.created || notif.createdAt || notif.updated || notif.updatedAt;
        let finalDateStr = baseDateStr;
        let displayMessage = notif.message;
        let matchId = null;
        let msgId = null;
        if (displayMessage.includes('|||')) {
            const parts = displayMessage.split('|||');
            displayMessage = parts[0];
            if (parts.length > 2) {
                matchId = parts[1];
                msgId = parts[2];
            }
            if (parts.length > 3 && parts[3]) {
                finalDateStr = parts[3];
            }
        }
        let timeStr = "Unknown time";
        const safeDateStr = finalDateStr || new Date().toISOString();
        let dStr = String(safeDateStr).replace(' ', 'T');
        if (!dStr.endsWith('Z') && !dStr.includes('+')) dStr += 'Z';
        const date = new Date(dStr);
        if (!isNaN(date.getTime())) {
            timeStr = date.toLocaleDateString() === new Date().toLocaleDateString() ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString();
        }
        const safeDisplayMessage = window.escapeHtml 
            ? window.escapeHtml(displayMessage) 
            : displayMessage.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; });
        item.innerHTML = `
            <button class="delete-notif-btn" title="Delete Notification" style="position:absolute; top:0px; right:0px; background:rgba(255,255,255,0.08); border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border:none; color:var(--text-muted); cursor:pointer; font-size:14px; z-index: 10; padding: 0; opacity: 0.8; transition: all 0.2s; backdrop-filter: blur(4px);">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="notification-icon">${iconHtml}</div>
            <div class="notification-content">
                <div class="notification-text">${safeDisplayMessage}</div>
                <div class="notification-time">${timeStr}</div>
            </div>
        `;
        if (matchId && msgId && notif.related_user) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', async (e) => {
                if (e.target.closest('.delete-notif-btn')) return;
                try {
                    const otherUser = await pb.collection('users').getOne(notif.related_user);
                    const panel = document.getElementById('notifications-panel');
                    if (panel) panel.classList.remove('open');
                    window.pendingScrollToMessage = msgId;
                    if (window.openPocketBaseChat) {
                        await window.openPocketBaseChat(matchId, otherUser);
                    }
                    setTimeout(() => {
                        if (window.pendingScrollToMessage === msgId) {
                            const msgEl = document.querySelector(`.chat-message-wrapper[data-msg-id="${msgId}"]`);
                            if (msgEl) {
                                msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                msgEl.style.transition = 'background-color 0.5s';
                                const origBg = msgEl.style.backgroundColor;
                                msgEl.style.backgroundColor = 'rgba(218, 165, 32, 0.2)';
                                setTimeout(() => { msgEl.style.backgroundColor = origBg; }, 1500);
                                window.pendingScrollToMessage = null;
                            }
                        }
                    }, 500);
                    if (!notif.is_read) {
                        pb.collection('notifications').update(notif.id, { is_read: true }).catch(console.error);
                        notif.is_read = true;
                        item.classList.remove('unread');
                        if (window.updateUnreadBadge) window.updateUnreadBadge();
                    }
                } catch (err) {
                    console.error("Failed to open chat from notification:", err);
                }
            });
        }
        const deleteBtn = item.querySelector('.delete-notif-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('mouseenter', () => deleteBtn.style.opacity = '1');
            deleteBtn.addEventListener('mouseleave', () => deleteBtn.style.opacity = '0.6');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    await pb.collection('notifications').delete(notif.id);
                    item.remove();
                    globalNotifications = globalNotifications.filter(n => n.id !== notif.id);
                    updateCombinedBadge();
                } catch (err) {
                    console.error("Failed to delete notification", err);
                    alert("Failed to delete notification.");
                }
            });
        }
        item.addEventListener('click', async (e) => {
            if (e.target.closest('.delete-notif-btn')) return;
            if (matchId && msgId && notif.related_user) return;
            if (!notif.is_read) {
                try {
                    await pb.collection('notifications').update(notif.id, { is_read: true });
                    notif.is_read = true;
                    item.classList.remove('unread');
                    updateCombinedBadge();
                } catch (e) {
                    console.error("Failed to mark read:", e);
                }
            }
            if (notif.type === 'match' && notif.related_user) {
                document.getElementById('tab-inbox')?.click();
            }
        });
        listEl.appendChild(item);
    });
    const clearAllBtn = document.getElementById('clear-all-alerts-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            const confirmModal = document.createElement('div');
            confirmModal.style.position = 'fixed';
            confirmModal.style.top = '0';
            confirmModal.style.left = '0';
            confirmModal.style.width = '100vw';
            confirmModal.style.height = '100vh';
            confirmModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            confirmModal.style.backdropFilter = 'blur(5px)';
            confirmModal.style.zIndex = '9999';
            confirmModal.style.display = 'flex';
            confirmModal.style.alignItems = 'center';
            confirmModal.style.justifyContent = 'center';
            confirmModal.style.opacity = '0';
            confirmModal.style.transition = 'opacity 0.2s';
            confirmModal.innerHTML = `
                <div style="background: var(--bg-main, #1c1c1c); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; width: 90%; max-width: 320px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(255, 69, 58, 0.1); color: #ff453a; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px auto;">
                        <i class="fa-solid fa-trash-can"></i>
                    </div>
                    <h3 style="margin: 0 0 8px 0; font-size: 1.25rem; color: var(--text-main, white); font-weight: 600;">Clear All Alerts?</h3>
                    <p style="margin: 0 0 24px 0; font-size: 0.95rem; color: var(--text-muted, #aaa); line-height: 1.5;">This action cannot be undone. All your notifications will be permanently deleted.</p>
                    <div style="display: flex; gap: 12px; width: 100%;">
                        <button id="cancel-clear-btn" style="flex: 1; padding: 12px; background: transparent; border: 1px solid var(--glass-border); color: var(--text-main); border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='var(--glass-border)'" onmouseout="this.style.background='transparent'">Cancel</button>
                        <button id="confirm-clear-btn" style="flex: 1; padding: 12px; border-radius: 50px; border: none; background: #ff453a; color: white; font-weight: 600; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#ff3327'" onmouseout="this.style.background='#ff453a'">Clear All</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmModal);
            setTimeout(() => {
                confirmModal.style.opacity = '1';
                confirmModal.children[0].style.transform = 'scale(1)';
            }, 10);
            const closeModal = () => {
                confirmModal.style.opacity = '0';
                confirmModal.children[0].style.transform = 'scale(0.9)';
                setTimeout(() => confirmModal.remove(), 200);
            };
            document.getElementById('cancel-clear-btn').addEventListener('click', closeModal);
            document.getElementById('confirm-clear-btn').addEventListener('click', async () => {
                closeModal();
                const btnOriginalText = clearAllBtn.innerHTML;
                clearAllBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Clearing...';
                clearAllBtn.style.opacity = '0.7';
                clearAllBtn.style.pointerEvents = 'none';
                try {
                    const deletePromises = globalNotifications.map(n => pb.collection('notifications').delete(n.id));
                    await Promise.all(deletePromises);
                    globalNotifications = [];
                    renderNotifications();
                    updateCombinedBadge();
                } catch (err) {
                    console.error("Failed to clear alerts", err);
                    if (window.showToast) window.showToast("Failed to clear alerts");
                    clearAllBtn.innerHTML = btnOriginalText;
                    clearAllBtn.style.opacity = '1';
                    clearAllBtn.style.pointerEvents = 'auto';
                }
            });
        });
    }
}
window.updateCombinedBadge = function () {
    const chatUnread = parseInt(localStorage.getItem('globalUnreadCount') || '0');
    const notifUnread = globalNotifications.filter(n => !n.is_read).length;
    const totalUnread = chatUnread + notifUnread;
    const notifBadge = document.getElementById('notifications-badge');
    if (notifBadge) {
        notifBadge.textContent = notifUnread;
        notifBadge.style.display = notifUnread > 0 ? 'inline-block' : 'none';
    }
    const inboxBadge = document.getElementById('inbox-badge');
    if (inboxBadge) {
        inboxBadge.textContent = chatUnread;
        inboxBadge.style.display = chatUnread > 0 ? 'inline-block' : 'none';
    }
    const navCupidBtn = document.getElementById('nav-inbox-btn');
    if (navCupidBtn) {
        let badge = navCupidBtn.querySelector('.nav-combined-badge');
        if (totalUnread > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'nav-combined-badge';
                navCupidBtn.appendChild(badge);
            }
            badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
            badge.style.display = 'inline-block';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }
};
window.addEventListener('storage', function(e) {
    if (e.key === 'globalUnreadCount') {
        window.updateCombinedBadge();
    }
});
