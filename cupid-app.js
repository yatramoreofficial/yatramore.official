

const pb = new PocketBase('https://api.yatramore.com');
window.debugLog = window.debugLog || function() {};

window.secureYatramoreLogout = function() {
    
    const killList = [
        'activeChatMatchId',
        'activeChatOtherUser',
        'ghostReadMessages',
        'globalUnreadCount',
        'autoTranslateUsers',
        'chatTranslationCache',
        'lastVerificationSent',
        'yatramore_joined',
        'yatramore_joined_name',
        'yatramore_joined_email',
        'ya-family'
    ];
    
    killList.forEach(key => {
        localStorage.removeItem(key);
    });

    localStorage.setItem('chatPanelState', 'closed');

    pb.authStore.clear();

    window.location.reload();
};

window.escapeHtml = function (unsafe) {
    if (!unsafe) return '';

    let cleaned = String(unsafe).replace(/[\u200B-\u200D\uFEFF]/g, '');

    if (window.DOMPurify) {

        cleaned = DOMPurify.sanitize(cleaned, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
    }

    return cleaned
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

window.showMatchPopup = function (otherUserName, otherUserAvatar) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 20000; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; backdrop-filter: blur(10px);';

    const content = document.createElement('div');
    content.style.cssText = 'text-align: center; transform: scale(0.8); transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);';

    const title = document.createElement('h1');
    title.style.cssText = 'color: #fff; font-size: 3rem; margin-bottom: 30px; font-style: italic; font-weight: 800; text-shadow: 0 4px 10px rgba(0,0,0,0.5);';
    title.innerHTML = `IT'S A MATCH!`;

    const subtext = document.createElement('p');
    subtext.style.cssText = 'color: #ddd; font-size: 1.2rem; margin-bottom: 40px;';
    subtext.textContent = `You and ${otherUserName} have liked each other.`;

    const avatars = document.createElement('div');
    avatars.style.cssText = 'display: flex; gap: 20px; justify-content: center; margin-bottom: 40px; align-items: center;';

    const myAvatarUrl = (currentUser.photos && currentUser.photos.length > 0) ? pb.files.getUrl(currentUser, currentUser.photos[0]) : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`;
    const avatar1 = document.createElement('img');
    avatar1.src = myAvatarUrl;
    avatar1.style.cssText = 'width: 120px; height: 120px; border-radius: 50%; border: 4px solid #fff; object-fit: cover; box-shadow: 0 10px 20px rgba(0,0,0,0.3);';

    const heart = document.createElement('i');
    heart.className = 'fa-solid fa-heart';
    heart.style.cssText = 'font-size: 2rem; color: #ff4b4b; animation: pulse 1s infinite;';

    const avatar2 = document.createElement('img');
    avatar2.src = otherUserAvatar;
    avatar2.style.cssText = 'width: 120px; height: 120px; border-radius: 50%; border: 4px solid #fff; object-fit: cover; box-shadow: 0 10px 20px rgba(0,0,0,0.3);';

    const btn = document.createElement('button');
    btn.className = 'glass-btn primary';
    btn.textContent = 'Keep Swiping';
    btn.onclick = () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    };

    avatars.appendChild(avatar1);
    avatars.appendChild(heart);
    avatars.appendChild(avatar2);

    content.appendChild(title);
    content.appendChild(avatars);
    content.appendChild(subtext);
    content.appendChild(btn);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        content.style.transform = 'scale(1)';
    });
};

if (pb.authStore.isValid) {
    pb.collection('users').authRefresh().catch(() => {
        console.warn('Stored auth token is invalid (user may have been deleted). Clearing session.');
        window.secureYatramoreLogout();
    });
}

function calculateAge(birthdate) {
    if (!birthdate) return '';
    const dob = new Date(birthdate);
    if (isNaN(dob.getTime())) return '';
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
}
window.calculateAge = calculateAge; 

async function compressToWebP(file, maxKB = 500) {
    if (!file.type.startsWith('image/')) return file;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.9;
                const getBlob = (q) => new Promise(res => canvas.toBlob(res, 'image/webp', q));

                const compress = async () => {
                    let blob = await getBlob(quality);
                    while (blob && blob.size > maxKB * 1024 && quality > 0.4) {
                        quality -= 0.1;
                        blob = await getBlob(quality);
                    }
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp', lastModified: Date.now() });
                    resolve(newFile);
                };
                compress();
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

let currentUser = null;
let tinderContainer = null;

pb.authStore.onChange((token, model) => {
    currentUser = model;
    window.debugLog("Auth state changed:", currentUser);

    const loggedInElements = document.querySelectorAll('.auth-logged-in');
    const loggedOutElements = document.querySelectorAll('.auth-logged-out');

    if (currentUser) {
        document.body.classList.add('is-logged-in');

        if (!window.hasPingedLastActive) {
            window.hasPingedLastActive = true;
            pb.collection('users').update(currentUser.id, { last_active: new Date().toISOString() }, { requestKey: null }).catch(console.error);
        }

        loggedInElements.forEach(el => el.style.display = el.dataset.displayOriginal || 'block');
        loggedOutElements.forEach(el => el.style.display = 'none');

        const verifyBtn = document.getElementById('nav-verify-identity-btn');
        if (verifyBtn) {
            let isLocked = false;
            let diffDays = 0;
            if (currentUser.verification_locked_until) {
                
                const dateStr = currentUser.verification_locked_until.replace(' ', 'T');
                const lockDate = new Date(dateStr);
                const now = new Date();
                if (lockDate > now) {
                    isLocked = true;
                    const diffTime = Math.abs(lockDate - now);
                    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }
            }

            if (currentUser.is_verified) {
                verifyBtn.innerHTML = '<i class="fa-solid fa-user-check" style="color: #1DA1F2;"></i><span class="btn-text"> Verified</span>';
                verifyBtn.style.borderColor = '#1DA1F2';
                verifyBtn.style.color = '#1DA1F2';
            } else if (isLocked) {
                verifyBtn.innerHTML = `<i class="fa-solid fa-lock" style="color: #ff4444;"></i><span class="btn-text"> Locked (${diffDays}d)</span>`;
                verifyBtn.style.borderColor = '#ff4444';
                verifyBtn.style.color = '#ff4444';
            } else if (currentUser.verification_status === 'pending') {
                verifyBtn.innerHTML = '<i class="fa-solid fa-clock" style="color: #f39c12;"></i><span class="btn-text"> Pending Review</span>';
                verifyBtn.style.borderColor = '#f39c12';
                verifyBtn.style.color = '#f39c12';
            } else {
                verifyBtn.innerHTML = '<i class="fa-solid fa-user-check" style="color: #1DA1F2;"></i><span class="btn-text"> Get Verified</span>';
                verifyBtn.style.borderColor = 'var(--brand-brown)';
                verifyBtn.style.color = 'var(--brand-brown)';
            }
        }

        const premiumBtn = document.getElementById('nav-premium-btn');
        if (premiumBtn && currentUser.is_premium) {
            premiumBtn.innerHTML = '<i class="fa-solid fa-crown" style="color: #ffd700;"></i><span class="btn-text"> Premium</span>';
            premiumBtn.style.borderColor = '#d4af37';
            premiumBtn.style.color = '#d4af37';
            premiumBtn.style.background = 'rgba(218, 165, 32, 0.1)';
        } else if (premiumBtn) {
            premiumBtn.innerHTML = '<i class="fa-solid fa-crown" style="color: #ffd700;"></i><span class="btn-text"> Get Premium</span>';
            premiumBtn.style.borderColor = '#d4af37';
            premiumBtn.style.color = '#d4af37';
            premiumBtn.style.background = 'transparent';
        }

        if (premiumBtn) {
            premiumBtn.onclick = (e) => {
                if (e) e.preventDefault();
                if (typeof window.openPremiumModal === 'function') {
                    window.openPremiumModal();
                } else {
                    console.error("openPremiumModal is not defined!");
                }
            };
        }

        if (currentUser.DeletionApproved === true) {
            
            const gateApproved = document.getElementById('gate-deletion-approved');
            if (gateApproved) gateApproved.style.display = 'flex';

            const gateRequested = document.getElementById('gate-deletion-requested');
            if (gateRequested) gateRequested.style.display = 'none';

            document.body.classList.add('show-footer-override');

            const mainGrid = document.getElementById('gate-approved-grid');
            if (mainGrid) mainGrid.style.display = 'none';
            const verifyGate = document.getElementById('gate-verify-email');
            if (verifyGate) verifyGate.style.display = 'none';

            const navCupidIcon = document.getElementById('nav-cupid-icon');
            if (navCupidIcon) {
                navCupidIcon.style.display = 'none';
            }
            const navInboxBtn = document.getElementById('nav-inbox-btn');
            if (navInboxBtn) {
                navInboxBtn.style.display = 'none';
            }

            const chatPanel = document.getElementById('chat-inbox-panel');
            if (chatPanel) chatPanel.style.display = 'none';
            const activeChatView = document.getElementById('active-chat-view');
            if (activeChatView) activeChatView.style.display = 'none';

            document.querySelectorAll('.nav-items a').forEach(btn => btn.style.display = 'none');
            const editBtn = document.getElementById('nav-settings-btn');
            if (editBtn) editBtn.style.display = 'none';
            const filterBtn = document.getElementById('mobile-filter-btn');
            if (filterBtn) filterBtn.style.display = 'none';
            const identityBtn = document.getElementById('nav-verify-identity-btn');
            if (identityBtn) identityBtn.style.display = 'none';

            const authControls = document.querySelector('.auth-controls-container');
            if (authControls) authControls.style.display = 'none';

            setTimeout(() => {
                const fabContainer = document.querySelector('.accessibility-container');
                if (fabContainer) {
                    fabContainer.style.right = 'auto';
                    fabContainer.style.left = '20px';
                }
            }, 100);

            return; 
        }

        if (currentUser.DeletionRequested === true) {
            
            const gateRequested = document.getElementById('gate-deletion-requested');
            if (gateRequested) gateRequested.style.display = 'flex';

            const gateApproved = document.getElementById('gate-deletion-approved');
            if (gateApproved) gateApproved.style.display = 'none';

            document.body.classList.add('show-footer-override');

            const mainGrid = document.getElementById('gate-approved-grid');
            if (mainGrid) mainGrid.style.display = 'none';
            const verifyGate = document.getElementById('gate-verify-email');
            if (verifyGate) verifyGate.style.display = 'none';

            const navCupidIcon = document.getElementById('nav-cupid-icon');
            if (navCupidIcon) {
                navCupidIcon.style.display = 'none';
            }
            const navInboxBtn = document.getElementById('nav-inbox-btn');
            if (navInboxBtn) {
                navInboxBtn.style.display = 'none';
            }

            const chatPanel = document.getElementById('chat-inbox-panel');
            if (chatPanel) chatPanel.style.display = 'none';
            const activeChatView = document.getElementById('active-chat-view');
            if (activeChatView) activeChatView.style.display = 'none';

            document.querySelectorAll('.nav-items a').forEach(btn => btn.style.display = 'none');
            const editBtn = document.getElementById('nav-settings-btn');
            if (editBtn) editBtn.style.display = 'none';
            const filterBtn = document.getElementById('mobile-filter-btn');
            if (filterBtn) filterBtn.style.display = 'none';
            const identityBtn = document.getElementById('nav-verify-identity-btn');
            if (identityBtn) identityBtn.style.display = 'none';
            const premiumBtn = document.getElementById('nav-premium-btn');
            if (premiumBtn) premiumBtn.style.display = 'none';

            const authControls = document.querySelector('.auth-controls-container');
            if (authControls) authControls.style.display = 'none';

            setTimeout(() => {
                const fabContainer = document.querySelector('.accessibility-container');
                if (fabContainer) {
                    fabContainer.style.right = 'auto';
                    fabContainer.style.left = '20px';
                }
            }, 100);

            try {
                pb.collection('users').subscribe(currentUser.id, function (e) {
                    if (e.action === 'update' && e.record.DeletionApproved === true) {
                        
                        window.location.reload();
                    }
                });
            } catch (err) {
                console.error("Realtime subscription failed:", err);
            }

            return; 
        }

        let isAccountLocked = false;
        let lockTitle = '';
        let lockMessage = '';
        let lockIconClass = '';
        let lockIconColor = '';

        if (currentUser.banned === true) {
            isAccountLocked = true;
            lockTitle = 'Account Suspended';
            lockMessage = 'Your account has been permanently banned for violating our community guidelines. If you believe this is a mistake, please contact support.';
            lockIconClass = 'fa-solid fa-ban';
            lockIconColor = '#ff4757'; 
        } else if (currentUser.suspendedUntil) {
            const suspendDate = new Date(currentUser.suspendedUntil);
            if (suspendDate > new Date()) {
                isAccountLocked = true;
                lockTitle = 'Account Temporarily Suspended';
                lockMessage = `Your account is suspended until ${suspendDate.toLocaleDateString()}. Please contact support if you have questions.`;
                lockIconClass = 'fa-solid fa-user-lock';
                lockIconColor = '#f39c12'; 
            }
        }

        if (isAccountLocked) {
            const gateApproved = document.getElementById('gate-deletion-approved');
            if (gateApproved) {
                gateApproved.style.display = 'flex';

                const iconElement = gateApproved.querySelector('.deletion-icon');
                if (iconElement) {
                    iconElement.className = `${lockIconClass} deletion-icon`;
                    iconElement.style.color = lockIconColor;
                }

                const h2 = gateApproved.querySelector('h2');
                if (h2) h2.textContent = lockTitle;
                const p = gateApproved.querySelector('p');
                if (p) p.textContent = lockMessage;

                const actionsContainer = gateApproved.querySelector('.deletion-actions');
                if (actionsContainer && !document.getElementById('ban-contact-btn')) {
                    const contactBtn = document.createElement('a');
                    contactBtn.id = 'ban-contact-btn';
                    contactBtn.href = 'mailto:contact@yatramore.com';
                    contactBtn.className = 'btn logout-btn'; 
                    contactBtn.style.textDecoration = 'none';
                    contactBtn.innerHTML = '<i class="fa-solid fa-envelope"></i> contact@yatramore.com';
                    actionsContainer.appendChild(contactBtn);
                }
            }
            const mainGrid = document.getElementById('gate-approved-grid');
            if (mainGrid) mainGrid.style.display = 'none';
            document.querySelectorAll('.nav-items a').forEach(btn => btn.style.display = 'none');

            const authControls = document.querySelector('.auth-controls-container');
            if (authControls) authControls.style.display = 'none';

            document.body.classList.add('show-footer-override');

            setTimeout(() => {
                const fabContainer = document.querySelector('.accessibility-container');
                if (fabContainer) {
                    fabContainer.style.right = 'auto';
                    fabContainer.style.left = '20px';
                }
            }, 100);

            return; 
        }
        
        let missingFields = [];
        if (!currentUser.name) missingFields.push('Name');
        if (!currentUser.birthdate && !currentUser.birthDate) missingFields.push('Date of Birth');
        if (!currentUser.gender) missingFields.push('Gender');
        if (!currentUser.religion) missingFields.push('Religion');
        if (!currentUser.location) missingFields.push('Location');
        if (!currentUser.photos || currentUser.photos.length < 2) missingFields.push('Photos (at least 2)');

        const isProfileCompleted = currentUser.is_profile_completed === true && missingFields.length === 0;

        if (!isProfileCompleted) {
            if (missingFields.length > 0) {
                setTimeout(() => {
                    window.showToast("Incomplete Profile! Missing: " + missingFields.join(', '), false);
                }, 1000);
            }

            setTimeout(() => {
                window.canCloseEditModal = false; 

                if (window.openEditProfileModal) window.openEditProfileModal();

                const editModal = document.getElementById('edit-modal');
                if (editModal) {
                    
                    editModal.classList.add('active');

                    const closeBtn = document.querySelector('.edit-modal-close');
                    if (closeBtn) closeBtn.style.display = 'none';

                    const title = editModal.querySelector('h2');
                    if (title) title.textContent = "Complete Your Profile";
                    const desc = editModal.querySelector('p');
                    if (desc) desc.textContent = "You must submit your details before you can join the matchmaking grid.";
                }
            }, 100);
        } else if (currentUser.verified === false) {
            
            const verifyGate = document.getElementById('gate-verify-email');
            if (verifyGate) verifyGate.style.display = 'flex';

            document.body.classList.add('show-footer-override');

            const mainGrid = document.getElementById('gate-approved-grid');
            if (mainGrid) mainGrid.style.display = 'none';

            const navButtons = document.querySelectorAll('.nav-items a');
            navButtons.forEach(btn => btn.style.display = 'none');
            
            const navCupidIcon = document.getElementById('nav-cupid-icon');
            if (navCupidIcon) {
                navCupidIcon.style.display = 'none';
            }
            const navInboxBtn = document.getElementById('nav-inbox-btn');
            if (navInboxBtn) {
                navInboxBtn.style.display = 'none';
            }

            const authControls = document.querySelector('.auth-controls-container');
            if (authControls) authControls.style.display = 'none';

            setTimeout(() => {
                const fabContainer = document.querySelector('.accessibility-container');
                if (fabContainer) {
                    fabContainer.style.right = 'auto';
                    fabContainer.style.left = '20px';
                }
            }, 100);

            pb.collection('users').subscribe(currentUser.id, function (e) {
                if (e.action === 'update' && e.record.verified === true) {
                    window.location.reload();
                }
            });

            if (window.initChatSystem) window.initChatSystem();
        } else {
            
            const mainGrid = document.getElementById('gate-approved-grid');
            if (mainGrid) {
                mainGrid.style.display = 'flex';
                document.body.classList.add('match-grid-active');
            }

            const filterGender = document.getElementById('filter-gender');
            if (filterGender && currentUser.lookingFor) {
                
                const genderMap = { 'Male': 'Male', 'Female': 'Female', 'Non-binary': 'Non-binary', 'Any': 'All', 'Everyone': 'All' };
                filterGender.value = genderMap[currentUser.lookingFor] || 'All';
            }
            const filterAgeMin = document.getElementById('filter-age-min');
            const filterAgeMax = document.getElementById('filter-age-max');
            if (filterAgeMin && currentUser.pref_age_min) filterAgeMin.value = currentUser.pref_age_min;
            if (filterAgeMax && currentUser.pref_age_max) filterAgeMax.value = currentUser.pref_age_max;
            
            const ageDisplayMin = document.getElementById('age-display-min');
            const ageDisplayMax = document.getElementById('age-display-max');
            if (ageDisplayMin && currentUser.pref_age_min) ageDisplayMin.textContent = currentUser.pref_age_min;
            if (ageDisplayMax && currentUser.pref_age_max) ageDisplayMax.textContent = currentUser.pref_age_max;

            const filterReligion = document.getElementById('filter-religion');
            if (filterReligion && currentUser.pref_religion && currentUser.pref_religion !== 'Any') {
                filterReligion.value = currentUser.pref_religion;
            }
            const filterCountry = document.getElementById('filter-country');
            if (filterCountry && currentUser.pref_country && currentUser.pref_country !== 'Any') {
                filterCountry.value = currentUser.pref_country;
            }

            loadSwipingProfiles();
            if (window.initChatSystem) window.initChatSystem();

            pb.collection('users').subscribe('*', function (e) {
                if (e.action !== 'update' || !e.record) return;

                if (currentUser && e.record.id === currentUser.id) {
                    
                    if (e.record.banned === true && currentUser.banned === false) {
                        
                        window.location.reload();
                        return;
                    }

                    if (e.record.suspendedUntil && e.record.suspendedUntil !== currentUser.suspendedUntil) {
                        const suspendDate = new Date(e.record.suspendedUntil);
                        if (suspendDate > new Date()) {
                            
                            window.location.reload();
                            return;
                        }
                    }

                    if (e.record.is_verified === true && currentUser.is_verified === false) {
                        currentUser.is_verified = true; 
                        if (window.showToast) {
                            window.showToast("<strong>Congratulations! You're Verified.</strong><br><span style='font-size:0.85em; opacity:0.85;'>Enjoy your exclusive Verified Profile Perks.</span>", true, true);
                        }

                        const verifyBtn = document.getElementById('nav-verify-identity-btn');
                        if (verifyBtn) {
                            verifyBtn.innerHTML = '<i class="fa-solid fa-user-check" style="color: #1DA1F2;"></i><span class="btn-text"> Verified</span>';
                            verifyBtn.style.borderColor = '#1DA1F2';
                            verifyBtn.style.color = '#1DA1F2';
                        }
                    }

                    if (e.record.verification_status === "rejected" && currentUser.verification_status !== "rejected") {
                        currentUser.verification_status = "rejected";
                        currentUser.verification_locked_until = e.record.verification_locked_until; 
                        
                        if (window.showToast) {
                            window.showToast("<strong>Verification Rejected</strong><br><span style='font-size:0.85em; opacity:0.85;'>Your request was denied. You cannot apply again for 14 days.</span>", false);
                        }

                        const verifyBtn = document.getElementById('nav-verify-identity-btn');
                        if (verifyBtn) {
                            verifyBtn.innerHTML = '<i class="fa-solid fa-lock" style="color: #ff4444;"></i><span class="btn-text"> Locked (14 Days)</span>';
                            verifyBtn.style.borderColor = '#ff4444';
                            verifyBtn.style.color = '#ff4444';
                        }
                    }

                    if (e.record.is_premium === true && currentUser.is_premium === false) {
                        currentUser.is_premium = true; 
                        if (window.showToast) {
                            window.showToast("<strong>Welcome to the Premium Club!</strong><br><span style='font-size:0.85em; opacity:0.85;'>Enjoy your exclusive Premium Profile Perks.</span>", true);
                        }

                        const premiumBtn = document.getElementById('nav-premium-btn');
                        if (premiumBtn) {
                            premiumBtn.innerHTML = '<i class="fa-solid fa-crown" style="color: #ffd700;"></i><span class="btn-text"> Premium Profile</span>';
                            premiumBtn.style.borderColor = '#d4af37';
                            premiumBtn.style.color = '#d4af37';
                            premiumBtn.style.background = 'rgba(218, 165, 32, 0.1)';
                        }
                    }
                }

                const card = document.querySelector(`.tinder-card[data-userid="${e.record.id}"]`);
                if (!card) return;

                let isOnline = false;
                if (e.record.last_active && !e.record.ghost_status) {
                    const diffMs = Date.now() - new Date(e.record.last_active).getTime();
                    isOnline = diffMs < 5 * 60 * 1000;
                }

                const imageArea = card.querySelector('.tinder-card-image') || card;
                let onlineWrapper = card.querySelector('.realtime-online-wrapper');

                if (isOnline && !onlineWrapper) {
                    
                    const wrapper = document.createElement('div');
                    wrapper.className = 'realtime-online-wrapper';
                    wrapper.style.cssText = 'position: absolute; top: 13px; left: 13px; display: flex; align-items: center; gap: 6px; z-index: 20;';
                    wrapper.innerHTML = '<div class="online-dot-image" title="Online Now" style="position: static;"></div><span style="font-size: 0.75rem; font-weight: 300; color: #44e88b; text-shadow: 0 1px 3px rgba(0,0,0,0.7); letter-spacing: 0.3px;">Online</span>';
                    imageArea.appendChild(wrapper);
                } else if (!isOnline && onlineWrapper) {
                    
                    onlineWrapper.remove();
                }
            });
        }

    } else {
        document.body.classList.remove('is-logged-in');
        loggedInElements.forEach(el => el.style.display = 'none');
        loggedOutElements.forEach(el => el.style.display = el.dataset.displayOriginal || 'block');

        const chatPanel = document.getElementById('chat-inbox-panel');
        if (chatPanel) chatPanel.style.display = 'none';
        const activeChatView = document.getElementById('active-chat-view');
        if (activeChatView) activeChatView.style.display = 'none';

        try {
            if (window.pb && window.pb.realtime) {
                window.pb.realtime.unsubscribe();
            }
        } catch(e) {}
    }
}, true); 

window.generateAuthCaptcha = () => {
};

function setupAuthUIListeners() {
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            const mode = authForm.dataset.mode || 'login';
            const errorContainer = document.getElementById('auth-error');
            const submitBtn = document.getElementById('auth-submit-btn');

            errorContainer.style.display = 'none';
            errorContainer.textContent = '';

            const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;

            if (!turnstileToken) {
                errorContainer.style.display = 'block';
                errorContainer.textContent = 'Please complete the security check.';
                return;
            }

            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Please wait...';
            submitBtn.disabled = true;

            try {
                if (mode === 'login') {
                    await pb.collection('users').authWithPassword(email, password);
                } else {
                    const confirmPassword = document.getElementById('auth-confirm-password').value;
                    if (password !== confirmPassword) {
                        throw new Error("Passwords do not match.");
                    }

                    const data = {
                        email: email,
                        emailVisibility: false,
                        password: password,
                        passwordConfirm: confirmPassword,
                        name: '',
                        turnstileToken: turnstileToken
                    };

                    await pb.collection('users').create(data);

                    try {
                        await pb.collection('users').requestVerification(email);
                    } catch (e) {
                        console.error("Verification email sending failed (SMTP likely not configured):", e);
                    }

                    await pb.collection('users').authWithPassword(email, password);
                }

                document.getElementById('auth-modal')?.classList.remove('active');
                document.getElementById('auth-overlay')?.classList.remove('active');

            } catch (error) {
                console.error("Auth error:", error);
                errorContainer.style.display = 'block';

                let errorMsg = error.message || "Authentication failed. Please check your credentials.";
                if (error.data && error.data.data) {
                    const details = Object.values(error.data.data).map(d => d.message).join(' ');
                    if (details) {
                        errorMsg += " " + details;
                    }
                }
                errorContainer.textContent = errorMsg;
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    const tabLogin = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const submitBtn = document.getElementById('auth-submit-btn');
    const confirmGroup = document.getElementById('auth-confirm-password-group');
    const forgotLink = document.getElementById('auth-forgot-password-link');

    if (tabLogin && tabSignup) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            if (authForm) authForm.dataset.mode = 'login';
            if (submitBtn) submitBtn.textContent = 'Login';
            if (confirmGroup) confirmGroup.style.display = 'none';
            if (forgotLink) forgotLink.style.display = 'inline-block';
        });

        tabSignup.addEventListener('click', () => {
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            if (authForm) authForm.dataset.mode = 'signup';
            if (submitBtn) submitBtn.textContent = 'Create Account';
            if (confirmGroup) confirmGroup.style.display = 'block';
            if (forgotLink) forgotLink.style.display = 'none';
        });
    }

    if (forgotLink) {
        forgotLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('auth-email');
            const errorContainer = document.getElementById('auth-error');
            const email = emailInput ? emailInput.value.trim() : '';

            if (!email) {
                if (errorContainer) {
                    errorContainer.textContent = "Please enter your email address first to reset your password.";
                    errorContainer.style.background = 'rgba(244, 67, 54, 0.15)';
                    errorContainer.style.color = '#ffb4ab';
                    errorContainer.style.border = '1px solid rgba(244,67,54,0.3)';
                    errorContainer.style.display = 'block';
                }
                return;
            }

            try {
                
                await pb.collection('users').requestPasswordReset(email);

                if (errorContainer) {
                    errorContainer.textContent = "Password reset email sent! Check your inbox.";
                    errorContainer.style.background = 'rgba(76, 175, 80, 0.15)';
                    errorContainer.style.color = '#4CAF50';
                    errorContainer.style.border = '1px solid rgba(76,175,80,0.3)';
                    errorContainer.style.display = 'block';
                }
            } catch (error) {
                console.error("Reset error:", error);
                if (errorContainer) {
                    errorContainer.textContent = error.message || "Failed to send reset email. Please try again.";
                    errorContainer.style.background = 'rgba(244, 67, 54, 0.15)';
                    errorContainer.style.color = '#ffb4ab';
                    errorContainer.style.border = '1px solid rgba(244,67,54,0.3)';
                    errorContainer.style.display = 'block';
                }
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('.trigger-login') || e.target.closest('.trigger-signup')) {
            e.preventDefault();
            document.getElementById('auth-modal')?.classList.add('active');
            document.getElementById('auth-overlay')?.classList.add('active');
            if (window.generateAuthCaptcha) window.generateAuthCaptcha();

            if (e.target.closest('.trigger-signup') && tabSignup) {
                tabSignup.click();
            } else if (tabLogin) {
                tabLogin.click();
            }
        }
        if (e.target.closest('.trigger-logout')) {
            e.preventDefault();
            window.secureYatramoreLogout();
        }
        if (e.target.closest('.auth-close-btn') || e.target.matches('.auth-overlay')) {
            document.getElementById('auth-modal')?.classList.remove('active');
            document.getElementById('auth-overlay')?.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    
    setTimeout(setupAuthUIListeners, 500);
});

let swipeCards = [];
tinderContainer = document.getElementById('profiles-grid');

function initSwipingCards() {
    tinderContainer = document.getElementById('profiles-grid');
    if (!tinderContainer) return;

    const allCards = document.querySelectorAll('.tinder-card');
    swipeCards = Array.from(allCards);

    swipeCards.forEach((el, index) => {
        el.style.zIndex = swipeCards.length - index;
        initCardEvents(el);
    });
}

function initCardEvents(el) {
    const hammertime = new Hammer(el);

    hammertime.on('pan', function (event) {
        el.classList.add('moving');
        if (event.deltaX === 0) return;
        if (event.center.x === 0 && event.center.y === 0) return;

        const xMulti = event.deltaX * 0.03;
        const yMulti = event.deltaY / 80;
        const rotate = xMulti * yMulti;

        el.style.transform = `translate(${event.deltaX}px, ${event.deltaY}px) rotate(${rotate}deg)`;

        const likeStamp = el.querySelector('.tinder-stamp.like');
        const nopeStamp = el.querySelector('.tinder-stamp.nope');

        if (event.deltaX > 50 && likeStamp) {
            likeStamp.style.opacity = Math.min((event.deltaX - 50) / 100, 1);
            if (nopeStamp) nopeStamp.style.opacity = 0;
        } else if (event.deltaX < -50 && nopeStamp) {
            nopeStamp.style.opacity = Math.min((Math.abs(event.deltaX) - 50) / 100, 1);
            if (likeStamp) likeStamp.style.opacity = 0;
        } else {
            if (likeStamp) likeStamp.style.opacity = 0;
            if (nopeStamp) nopeStamp.style.opacity = 0;
        }
    });

    hammertime.on('panend', function (event) {
        el.classList.remove('moving');

        const moveOutWidth = window.innerWidth;
        const keep = Math.abs(event.deltaX) < 100 && Math.abs(event.velocityX) < 0.5;

        if (keep) {
            el.style.transform = '';
            
            const likeStamp = el.querySelector('.tinder-stamp.like');
            const nopeStamp = el.querySelector('.tinder-stamp.nope');
            if (likeStamp) likeStamp.style.opacity = 0;
            if (nopeStamp) nopeStamp.style.opacity = 0;
        } else {
            const liked = event.deltaX > 0;
            if (el.dataset.swiped) return;

            if (window.cupidRemainingTotal !== undefined && window.cupidRemainingTotal <= 0) {
                el.style.transform = '';
                const likeStamp = el.querySelector('.tinder-stamp.like');
                const nopeStamp = el.querySelector('.tinder-stamp.nope');
                if (likeStamp) likeStamp.style.opacity = 0;
                if (nopeStamp) nopeStamp.style.opacity = 0;
                if (window.showToast) window.showToast("You have reached your total daily swipe limit.", false);
                return;
            }

            if (liked && window.cupidRemainingSwipes !== undefined && window.cupidRemainingSwipes <= 0) {
                el.style.transform = '';
                const likeStamp = el.querySelector('.tinder-stamp.like');
                const nopeStamp = el.querySelector('.tinder-stamp.nope');
                if (likeStamp) likeStamp.style.opacity = 0;
                if (nopeStamp) nopeStamp.style.opacity = 0;
                const modal = document.getElementById('swipe-limit-modal');
                if (modal) modal.style.display = 'flex';
                return;
            }

            const endX = Math.max(Math.abs(event.velocityX) * moveOutWidth, moveOutWidth);
            const toX = event.deltaX > 0 ? endX : -endX;
            const endY = Math.abs(event.velocityY) * moveOutWidth;
            const toY = event.deltaY > 0 ? endY : -endY;
            const xMulti = event.deltaX * 0.03;
            const yMulti = event.deltaY / 80;
            const rotate = xMulti * yMulti;

            el.style.transform = `translate(${toX}px, ${toY + event.deltaY}px) rotate(${rotate}deg)`;

            el.dataset.swiped = 'true';
            handleSwipeAction(el.dataset.userid, liked);

            setTimeout(() => {
                el.remove();
                swipeCards.shift();
                checkIfEmpty();
            }, 300);
        }
    });
}

async function handleSwipeAction(targetUserId, liked, isSuperLike = false) {
    if (!currentUser) return;

    if (window.cupidRemainingTotal !== undefined) {
        if (window.cupidRemainingTotal <= 0) {
            if (window.showToast) window.showToast("You have reached your total daily swipe limit. Come back tomorrow!", false);
            return;
        }
    }

    if (isSuperLike) {
        if (window.cupidRemainingSuperLikes !== undefined) {
            if (window.cupidRemainingSuperLikes <= 0) {
                if (window.showToast) window.showToast("You are out of Super Likes for today!", false);
                return;
            }
            window.cupidRemainingSuperLikes--;
        }
    } else {
        if (liked && window.cupidRemainingSwipes !== undefined) {
            if (window.cupidRemainingSwipes <= 0) {
                const modal = document.getElementById('swipe-limit-modal');
                if (modal) modal.style.display = 'flex';
                return;
            }
            window.cupidRemainingSwipes--;
        }
    }

    if (window.cupidRemainingTotal !== undefined) {
        window.cupidRemainingTotal--;
    }

    let swipeAction = liked ? 'like' : 'pass';
    if (isSuperLike) swipeAction = 'super_like';

    try {
        const payload = {
            swiper: currentUser.id,
            swiped_on: targetUserId,
            action: swipeAction,
            liked: liked
        };
        console.log("Sending swipe payload:", payload);

        await pb.collection('swipes').create(payload, { requestKey: null });

        window.debugLog(`User swiped on ${targetUserId}. Liked: ${liked}`);

        if (liked) {
            try {
                
                await pb.collection('swipes').getFirstListItem(`swiper="${targetUserId}" && swiped_on="${currentUser.id}" && liked=true`, { requestKey: null });

                await pb.collection('matches').create({
                    user1: currentUser.id,
                    user2: targetUserId
                }, { requestKey: null });

                const otherUser = await pb.collection('users').getOne(targetUserId);
                const otherUserAvatar = (otherUser.photos && otherUser.photos.length > 0) ? pb.files.getUrl(otherUser, otherUser.photos[0]) : `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`;
                window.showMatchPopup(window.escapeHtml(otherUser.name), otherUserAvatar);
            } catch (err) {
                
                window.debugLog("No mutual match yet.");
            }
        }
    } catch (err) {
        console.error("Error saving swipe:", err);
        console.error("PocketBase validation error data:", JSON.stringify(err.data));
        if (isSuperLike && window.cupidRemainingSuperLikes !== undefined) {
            window.cupidRemainingSuperLikes++;
        } else if (liked && window.cupidRemainingSwipes !== undefined) {
            window.cupidRemainingSwipes++;
        }
        if (window.cupidRemainingTotal !== undefined) {
            window.cupidRemainingTotal++;
        }

        if (err.status === 400) {
            window.cupidRemainingSwipes = 0; 
            const modal = document.getElementById('swipe-limit-modal');
            if (modal) modal.style.display = 'flex';
        }
    }
}

function checkIfEmpty() {
    if (swipeCards.length === 0) {
        if (tinderContainer) {
            tinderContainer.innerHTML = `
                <div style="text-align: center; position: absolute; width: 100%; top: 50%; transform: translateY(-50%); color: #888; z-index: -1;">
                    <i class="fas fa-satellite-dish" style="font-size: 3rem; margin-bottom: 10px;"></i>
                    <h3>You've seen everyone!</h3>
                    <p>Check back later for new profiles.</p>
                </div>
            `;
        }
    }
}

window.triggerPass = () => {
    if (swipeCards.length === 0) return;
    const card = swipeCards[0];
    if (card.dataset.swiped) return;
    card.dataset.swiped = 'true';
    card.style.transform = `translate(-${window.innerWidth}px, 0px) rotate(-30deg)`;
    card.classList.add('moving');
    handleSwipeAction(card.dataset.userid, false);
    setTimeout(() => { card.remove(); swipeCards.shift(); checkIfEmpty(); }, 300);
}

window.triggerLike = () => {
    if (swipeCards.length === 0) return;
    const card = swipeCards[0];
    if (card.dataset.swiped) return;

    if (window.cupidRemainingSwipes !== undefined && window.cupidRemainingSwipes <= 0) {
        const modal = document.getElementById('swipe-limit-modal');
        if (modal) modal.style.display = 'flex';
        return;
    }

    card.dataset.swiped = 'true';
    card.style.transform = `translate(${window.innerWidth}px, 0px) rotate(30deg)`;
    card.classList.add('moving');
    handleSwipeAction(card.dataset.userid, true);
    setTimeout(() => { card.remove(); swipeCards.shift(); checkIfEmpty(); }, 300);
}

window.triggerSuperLike = () => {
    if (swipeCards.length === 0) return;
    const card = swipeCards[0];
    if (card.dataset.swiped) return;

    if (window.cupidRemainingSuperLikes !== undefined && window.cupidRemainingSuperLikes <= 0) {
        if (window.showToast) window.showToast("You are out of Super Likes for today! Verify your profile for more.", false);
        return;
    }

    card.dataset.swiped = 'true';
    card.style.transform = `translate(0px, -${window.innerHeight}px) rotate(0deg)`;
    card.classList.add('moving');
    handleSwipeAction(card.dataset.userid, true, true);
    setTimeout(() => { card.remove(); swipeCards.shift(); checkIfEmpty(); }, 300);
}

async function loadSwipingProfiles() {
    if (!currentUser) return;

    if (!tinderContainer) tinderContainer = document.getElementById('profiles-grid');
    if (!tinderContainer) return;
    tinderContainer.innerHTML = `
        <div style="text-align: center; position: absolute; width: 100%; top: 50%; transform: translateY(-50%); color: #888; z-index: -1;">
            <i class="fas fa-circle-notch fa-spin" style="font-size: 3rem; margin-bottom: 10px;"></i>
            <h3>Loading matches...</h3>
        </div>
    `;

    try {
        
        const mySwipes = await pb.collection('swipes').getFullList({
            filter: `swiper = "${currentUser.id}"`,
            fields: 'id,swiped_on,action,created',
            requestKey: null
        });
        const swipedIds = mySwipes.map(s => s.swiped_on);

        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const todaysNormalSwipes = mySwipes.filter(s => new Date(s.created).getTime() >= startOfDay.getTime() && s.action === 'like');
        const todaysSuperLikes = mySwipes.filter(s => new Date(s.created).getTime() >= startOfDay.getTime() && s.action === 'super_like');
        const todaysTotalSwipes = mySwipes.filter(s => new Date(s.created).getTime() >= startOfDay.getTime());

        const isVerified = currentUser.is_verified;
        const isPremium = currentUser.is_premium;
        const customSwipe = currentUser.custom_swipe_limit;

        let swipeLimit = isVerified ? 10 : 5;
        if (customSwipe && customSwipe > 0) {
            swipeLimit = customSwipe;
        } else if (isPremium) {
            swipeLimit = 30; 
        }

        window.cupidRemainingSwipes = swipeLimit - todaysNormalSwipes.length;

        const customSuper = currentUser.custom_superlike_limit;
        let superLikeLimit = isVerified ? 4 : 2;
        if (customSuper && customSuper > 0) {
            superLikeLimit = customSuper;
        } else if (isPremium) {
            superLikeLimit = 15; 
        }

        window.cupidRemainingSuperLikes = superLikeLimit - todaysSuperLikes.length;

        const customTotal = currentUser.custom_total_limit;
        let totalLimit = isVerified ? 30 : 15;
        if (customTotal && customTotal > 0) {
            totalLimit = customTotal;
        } else if (isPremium) {
            totalLimit = 90;
        }
        window.cupidRemainingTotal = totalLimit - todaysTotalSwipes.length;

        if (window.cupidRemainingTotal <= 0) {
            tinderContainer.innerHTML = `
                <div style="text-align: center; position: absolute; width: 100%; top: 50%; transform: translateY(-50%); color: #888; z-index: -1;">
                    <i class="fa-solid fa-hourglass-end" style="font-size: 3rem; margin-bottom: 10px;"></i>
                    <h3>Daily Limit Reached</h3>
                    <p>You've used all your swipes for today. Come back tomorrow!</p>
                </div>
            `;
            return;
        }

        if (window.cupidRemainingSwipes <= 0) {
            tinderContainer.innerHTML = `
                <div style="text-align: center; position: absolute; width: 100%; top: 50%; transform: translateY(-50%); color: #888; z-index: -1;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">⌛</div>
                    <h3>Out of Swipes!</h3>
                    <p>You've hit your daily limit of ${swipeLimit} swipes.</p>
                </div>
            `;
            const modal = document.getElementById('swipe-limit-modal');
            if (modal) modal.style.display = 'flex';
            return;
        }

        let excludedIds = [...swipedIds];
        if (currentUser.blocked_users && currentUser.blocked_users.length > 0) {
            excludedIds = [...excludedIds, ...currentUser.blocked_users];
        }

        let filterStr = `id != "${currentUser.id}" && is_profile_completed = true && verified = true && DeletionRequested != true && DeletionApproved != true`;
        if (excludedIds.length > 0) {
            const idFilters = excludedIds.map(id => `id != "${id}"`).join(' && ');
            filterStr += ` && (${idFilters})`;
        }

        let genderFilter = document.getElementById('filter-gender')?.value;
        const religionFilter = document.getElementById('filter-religion')?.value;
        const countryFilter = document.getElementById('filter-country')?.value;

        const ageMin = parseInt(document.getElementById('filter-age-min')?.value) || currentUser.pref_age_min || 18;
        const ageMax = parseInt(document.getElementById('filter-age-max')?.value) || currentUser.pref_age_max || 80;

        const sanitize = (val) => val ? val.replace(/["\\'|&~()]/g, '') : '';

        if (genderFilter && genderFilter !== 'All' && genderFilter !== 'Any') {
            filterStr += ` && gender = "${sanitize(genderFilter)}"`;
        }
        if (religionFilter && religionFilter !== 'All' && religionFilter !== 'Any' && religionFilter !== 'All Religions') {
            filterStr += ` && religion = "${sanitize(religionFilter)}"`;
        }
        if (countryFilter && countryFilter !== 'All' && countryFilter !== 'Any' && countryFilter !== 'Any Country') {
            filterStr += ` && location = "${sanitize(countryFilter)}"`;
        }
        const today = new Date();

        if (ageMin > 18) {
            const maxBirthdate = new Date(today.getFullYear() - ageMin, today.getMonth(), today.getDate());
            const y = maxBirthdate.getFullYear();
            const m = maxBirthdate.getMonth() + 1;
            filterStr += ` && (birth_year < ${y} || (birth_year = ${y} && birth_month <= ${m}))`;
        }
        if (ageMax < 80) {
            const minBirthdate = new Date(today.getFullYear() - ageMax - 1, today.getMonth(), today.getDate());
            const y = minBirthdate.getFullYear();
            const m = minBirthdate.getMonth() + 1;
            filterStr += ` && (birth_year > ${y} || (birth_year = ${y} && birth_month >= ${m}))`;
        }

        let profilesList;
        profilesList = await pb.collection('users').getList(1, 50, {
            filter: filterStr,
            sort: '-id',
            requestKey: null
        });

        if (profilesList && profilesList.items) {
            
            profilesList.items = profilesList.items.filter(p => !(p.blocked_users && p.blocked_users.includes(currentUser.id)));
        }

        try {
            const superLikerSwipes = await pb.collection('swipes').getFullList({
                filter: `swiped_on = "${currentUser.id}" && action = "super_like"`,
                requestKey: null
            });
            const superLikerIds = superLikerSwipes.map(s => s.swiper);

            profilesList.items.forEach(p => {
                if (superLikerIds.includes(p.id)) {
                    p.isSuperLiker = true;
                }
            });

            profilesList.items.sort((a, b) => {
                if (a.isSuperLiker && !b.isSuperLiker) return -1;
                if (!a.isSuperLiker && b.isSuperLiker) return 1;
                return 0;
            });
        } catch (e) {
            console.error("Failed to fetch super likers:", e);
        }

        tinderContainer.innerHTML = ''; 

        if (profilesList.items.length === 0) {
            checkIfEmpty();
            return;
        }

        const reversedProfiles = [...profilesList.items].reverse();

        reversedProfiles.forEach(p => {
            tinderContainer.insertAdjacentHTML('beforeend', window.generateTinderCardHTML(p, false));
        });

        initSwipingCards();

    } catch (err) {
        console.error("Failed to load profiles:", err);
        let errorMsg = err.message || "Unknown error";
        if (err.data && err.data.message) {
            errorMsg = err.data.message;
        }
        const safeErrorMsg = window.escapeHtml ? window.escapeHtml(errorMsg) : errorMsg.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; });
        tinderContainer.innerHTML = `<p style="color:red; text-align:center; margin-top:50%;">Failed to load profiles.<br><small>${safeErrorMsg}</small></p>`;
    }
}

window.generateTinderCardHTML = function (p, isModal = false) {
    let photoUrls = [];
    if (p.photos && p.photos.length > 0) {
        photoUrls = p.photos.map(photoId => pb.files.getUrl(p, photoId));
    } else {
        photoUrls = [`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=400`];
    }
    const safePhotosJson = window.escapeHtml(JSON.stringify(photoUrls));

    let dotsHTML = '';
    if (photoUrls.length > 1) {
        dotsHTML = `<div class="tinder-card-dots" style="position: absolute; bottom: 12px; left: 10px; right: 10px; display: flex; gap: 5px; z-index: 15;">` +
            photoUrls.map((_, i) => `<div class="tinder-dot" style="flex: 1; height: 5px; background: ${i === 0 ? 'white' : 'rgba(255,255,255,0.4)'}; border-radius: 3px; transition: background 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>`).join('') +
            `</div>`;
    }

    let hobbiesHTML = '';
    if (p.hobbies && Array.isArray(p.hobbies) && p.hobbies.length > 0) {
        hobbiesHTML = `<div class="tinder-card-hobbies">` +
            p.hobbies.map(h => `<span class="hobby-badge">${window.escapeHtml(h)}</span>`).join('') +
            `</div>`;
    }

    const safeName = window.escapeHtml((p.name || 'Anonymous').trim());
    const safeLocation = window.escapeHtml(p.location || 'Unknown');
    const safeReligion = window.escapeHtml(p.religion || '');

    let displayGender = 'N/A';
    if (p.gender === 'Male') displayGender = 'M';
    else if (p.gender === 'Female') displayGender = 'F';
    else if (p.gender === 'Non-binary') displayGender = 'NB';
    else if (p.gender) displayGender = 'NB';

    let displayReligion = safeReligion;
    if (!displayReligion) {
        displayReligion = 'N/A';
    }

    let ageText = window.calculateAge ? window.calculateAge(p.birthDate || p.birthdate) : '';

    let onlineHTML = '';
    if (p.last_active && !p.ghost_status) {
        const lastActiveTime = new Date(p.last_active).getTime();
        const now = new Date().getTime();
        const diffMinutes = (now - lastActiveTime) / (1000 * 60);
        if (diffMinutes < 5) { 
            onlineHTML = '<div style="position: absolute; top: 12px; left: 12px; display: flex; align-items: center; gap: 6px; z-index: 20; background: rgba(0,0,0,0.45); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); padding: 5px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);"><div class="online-dot-image" title="Online Now" style="position: static; margin:0;"></div><span style="font-size: 0.75rem; font-weight: 500; color: #44e88b; letter-spacing: 0.3px;">Online</span></div>';
        }
    }

    return `
        <div class="tinder-card ${isModal ? 'modal-card' : ''} ${p.isSuperLiker ? 'super-liked-card' : ''} ${p.is_premium ? 'premium-card-glow' : ''} ${p.is_verified && !p.is_premium ? 'verified-card-glow' : ''}" data-userid="${p.id}" ${isModal ? 'style="position: relative; height: 100%; box-shadow: none; transform: none; cursor: default;"' : ''}>
            ${!isModal ? '<div class="tinder-stamp nope">NOPE</div><div class="tinder-stamp like">LIKE</div>' : ''}
            <div class="tinder-card-image-wrapper" data-photos="${safePhotosJson}" data-current-index="0">
                ${dotsHTML}
                ${onlineHTML}
                ${p.isSuperLiker ? '<div class="super-like-badge"><i class="fas fa-star"></i> Super Liked You</div>' : ''}
                <img src="${photoUrls[0]}" class="tinder-card-image" alt="Profile Photo">

                ${photoUrls.length > 1 ? `
                <div class="tap-zone left" onclick="event.stopPropagation(); window.cycleCardPhoto(this, -1)" style="position: absolute; top: 0; left: 0; width: 50%; height: 100%; z-index: 12; ${isModal ? 'cursor: pointer;' : ''}"></div>
                <div class="tap-zone right" onclick="event.stopPropagation(); window.cycleCardPhoto(this, 1)" style="position: absolute; top: 0; right: 0; width: 50%; height: 100%; z-index: 12; ${isModal ? 'cursor: pointer;' : ''}"></div>
                ` : ''}

                ${!isModal ? `<div onclick="event.stopPropagation(); window.openReportModal('${p.id}')" style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.45); color: #ff6b6b; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1); z-index: 15; transition: transform 0.2s, background 0.2s;" onmouseover="this.style.transform='scale(1.1)'; this.style.background='rgba(0,0,0,0.6)'" onmouseout="this.style.transform='scale(1)'; this.style.background='rgba(0,0,0,0.45)'" title="Report User">
                    <i class="fa-solid fa-flag" style="font-size: 0.85rem;"></i>
                </div>` : ''}
            </div>
            <div class="tinder-card-info" style="padding: 15px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0; font-size: 1.2rem; font-weight: bold; color: var(--text-main);">
                    <span style="font-size: 1.4rem; display: flex; align-items: center;">
                        ${safeName}
                        ${p.is_verified ? `<span style="display: inline-flex; position: relative; width: 13px; height: 13px; align-items: center; justify-content: center; transform: translateY(-4px); margin-left: 2px;" title="Verified Profile"><i class="fa-solid fa-certificate" style="color: #1DA1F2; font-size: 13px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></i><i class="fa-solid fa-check" style="color: #fff; font-size: 13px; position: absolute; z-index: 1; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.55);"></i></span>` : ''}
                    </span>
                    <span class="age" style="color: var(--text-muted);">${ageText}</span>
                    <span class="gender" style="color: var(--text-muted);">${displayGender}</span>
                    <span style="color: var(--text-muted); font-size: 1rem; margin-left: 4px; display: flex; align-items: center; gap: 4px;"><i class="fas fa-map-marker-alt"></i> ${safeLocation || 'N/A'}</span>
                    <span style="color: var(--text-muted); font-size: 1rem; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-hands-praying"></i> ${displayReligion}</span>
                </div>
                ${hobbiesHTML ? hobbiesHTML : ''}
                ${p.bio ? `<p style="font-size: 0.95rem; margin: 6px 0 0 0; color: var(--text-main); line-height: 1.4; white-space: pre-wrap;">${window.escapeHtml(p.bio)}</p>` : ''}
            </div>
        </div>
    `;
}

window.pb = pb;
window.loadSwipingProfiles = loadSwipingProfiles; 

window.resendVerificationEmail = async function () {
    if (!currentUser) return;
    const btn = document.getElementById('btn-resend-verification'); 

    const lastSent = localStorage.getItem('lastVerificationSent');
    if (lastSent && Date.now() - parseInt(lastSent) < 1200000) {
        const remainingMinutes = Math.ceil((1200000 - (Date.now() - parseInt(lastSent))) / 60000);
        window.showToast(`Please wait ${remainingMinutes} minutes before requesting another verification email.`, false);
        return;
    }

    if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }

    try {
        await pb.collection('users').requestVerification(currentUser.email);
        localStorage.setItem('lastVerificationSent', Date.now());
        window.showToast("Verification email sent! Please check your inbox and spam folder.", true);
    } catch (e) {
        console.error("Resend error:", e);
        window.showToast("Failed to send verification email. (Is SMTP configured in PocketBase Admin?)", false);
    } finally {
        if (btn) { btn.textContent = 'Resend Verification Request'; btn.disabled = false; }
    }
};

let verifyIdFile = null;
let verifySelfieFile = null;

window.handleVerifySelect = function (e, previewId) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        openCropModal(e.target.result, { type: 'verify', previewId: previewId });
    };
    reader.readAsDataURL(file);

    e.target.value = '';
};

window.submitVerification = async function () {
    if (!currentUser) return;

    if (!verifyIdFile || !verifySelfieFile) {
        window.showToast('Please upload BOTH your Government ID and a Selfie.', false);
        return;
    }

    const btn = document.getElementById('upload-id-btn');
    if (btn) {
        btn.textContent = 'Submitting...';
        btn.disabled = true;
    }

    try {
        const compressedId = await compressToWebP(verifyIdFile);
        const compressedSelfie = await compressToWebP(verifySelfieFile);

        const formData = new FormData();
        formData.append('user', currentUser.id);
        formData.append('name', currentUser.name);
        formData.append('birthdate', currentUser.birthdate);
        formData.append('verification_id', compressedId);
        formData.append('verification_selfie', compressedSelfie);
        formData.append('status', 'pending');
        formData.append('submitted_at', new Date().toISOString());

        await pb.collection('verifications').create(formData);

        await pb.collection('users').update(currentUser.id, {
            verification_status: 'pending'
        });

        currentUser.verification_status = 'pending';
        window.showToast('Verification request submitted successfully! An admin will review it shortly.', true);
    } catch (error) {
        console.error('Verification Upload Error:', error);
        window.showToast('Failed to submit verification.', false);
    } finally {
        if (window.renderVerificationUI) window.renderVerificationUI();
    }
};

window.renderVerificationUI = function () {
    if (!currentUser) return;

    const modal = document.getElementById('verify-identity-modal');
    const title = document.getElementById('verify-modal-title');
    const desc = document.getElementById('verify-modal-subtitle');

    const statusText = document.getElementById('verification-status-text');
    const uploadBtn = document.getElementById('upload-id-btn');
    const uploadGrid = document.getElementById('verification-upload-grid');
    const perksBlock = document.getElementById('verification-perks-list');
    const identityContainer = document.getElementById('identity-verification-container');

    if (currentUser.is_verified) {
        if (title) title.textContent = 'YatrAmore Verified';
        if (desc) desc.textContent = 'You are a verified member. Enjoy your exclusive community perks!';

        if (statusText) statusText.style.display = 'none';
        if (uploadBtn) uploadBtn.style.display = 'none';
        if (uploadGrid) uploadGrid.style.display = 'none';
        if (perksBlock) perksBlock.style.display = 'block';
        if (identityContainer) identityContainer.style.display = 'none';
    } else if (currentUser.verification_status === 'pending') {
        if (title) title.textContent = 'Verification Pending';
        if (desc) desc.textContent = "Your request is currently in the review queue. We'll notify you once approved!";

        if (statusText) {
            statusText.style.display = 'block';
            statusText.innerHTML = '<div style="background: rgba(243, 156, 18, 0.1); padding: 15px; border-radius: 12px; color: #f39c12; font-weight: 600; font-size: 1.1rem; text-align: center;"><i class="fa-solid fa-clock"></i> Pending Review...</div>';
        }
        if (uploadBtn) uploadBtn.style.display = 'none';
        if (uploadGrid) uploadGrid.style.display = 'none';
        if (perksBlock) perksBlock.style.display = 'block';
        if (identityContainer) identityContainer.style.display = 'block';
    } else {
        if (title) title.textContent = 'Get Verified';
        if (desc) desc.textContent = "Upload a Government ID and a Selfie. Get the official blue tick and boost trust!";

        if (statusText) {
            statusText.style.display = 'block';
            statusText.innerHTML = 'Please provide 2 photos for manual verification.';
        }
        if (uploadBtn) {
            uploadBtn.style.display = 'block';
            uploadBtn.textContent = 'Submit for Verification';
            uploadBtn.disabled = false;
        }
        if (uploadGrid) uploadGrid.style.display = 'grid';
        if (perksBlock) perksBlock.style.display = 'block';
        if (identityContainer) identityContainer.style.display = 'block';
    }
};

window.openVerificationModal = function () {
    if (!currentUser) return;
    
    if (currentUser.verification_locked_until) {
        const dateStr = currentUser.verification_locked_until.replace(' ', 'T');
        const lockDate = new Date(dateStr);
        const now = new Date();
        if (lockDate > now) {
            const diffTime = Math.abs(lockDate - now);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (window.showToast) {
                window.showToast(`<strong>Verification Locked</strong><br><span style='font-size:0.85em; opacity:0.85;'>Your previous request was rejected. Try again in ${diffDays} day(s).</span>`, false);
            }
            return;
        }
    }

    if (window.renderVerificationUI) window.renderVerificationUI();
    const modal = document.getElementById('verify-identity-modal');
    if (modal) modal.classList.add('active');
};

const AVAILABLE_HOBBIES = [
    "✈️ Travel", "🍳 Cooking", "🎸 Music", "🏃 Fitness", "📸 Photography",
    "📚 Reading", "🎮 Gaming", "🎬 Movies", "🎨 Art", "🏕️ Outdoors",
    "💃 Dancing", "💻 Technology", "🍕 Foodie", "🐾 Pets", "⚽ Sports"
];
let selectedHobbies = [];

window.openEditProfileModal = async function (isExplicitlyEditing = false) {
    if (!currentUser) return;

    if (currentUser.is_profile_completed && currentUser.last_profile_edit) {
        const lastEditDate = new Date(currentUser.last_profile_edit.replace(' ', 'T'));
        const now = new Date();
        const hoursPassed = (now.getTime() - lastEditDate.getTime()) / (1000 * 60 * 60);
        if (hoursPassed < 72) {
            const hoursLeft = Math.ceil(72 - hoursPassed);
            if (window.showToast) {
                window.showToast(`<strong>Profile Edit Locked</strong><br><span style='font-size:0.85em; opacity:0.85;'>You can only edit your profile details once every 3 days. Please wait another ${hoursLeft} hours.</span>`, false);
            } else {
                alert(`You can only edit your profile details once every 3 days. Please wait another ${hoursLeft} hours.`);
            }
            return;
        }
    }

    document.getElementById('profile-firstName').value = currentUser.name || '';
    const bdateInput = document.getElementById('profile-birthdate');
    if (bdateInput) {
        
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        bdateInput.max = maxDate;
        bdateInput.min = minDate;

        if (currentUser.birthDate || currentUser.birthdate) {
            const storedBirthdate = currentUser.birthDate || currentUser.birthdate;
            bdateInput.value = storedBirthdate.split(' ')[0].split('T')[0];
            bdateInput.disabled = true;
            bdateInput.style.opacity = '0.6';
            bdateInput.style.cursor = 'not-allowed';
        } else {
            bdateInput.disabled = false;
            bdateInput.style.opacity = '1';
            bdateInput.style.cursor = 'pointer';
        }
    }
    
    const genderInput = document.getElementById('profile-gender');
    genderInput.value = currentUser.gender || '';
    if (currentUser.gender) {
        genderInput.disabled = true;
        genderInput.style.opacity = '0.6';
        genderInput.style.cursor = 'not-allowed';
    } else {
        genderInput.disabled = false;
        genderInput.style.opacity = '1';
        genderInput.style.cursor = 'pointer';
    }

    document.getElementById('profile-religion').value = currentUser.religion || '';
    document.getElementById('profile-location').value = currentUser.location || '';
    document.getElementById('profile-bio').value = currentUser.bio || '';

    const lookingForEl = document.getElementById('profile-lookingFor');
    if (lookingForEl) lookingForEl.value = currentUser.lookingFor || 'Any';

    const prefAgeMinEl = document.getElementById('profile-age-min');
    if (prefAgeMinEl) prefAgeMinEl.value = currentUser.pref_age_min || 18;

    const prefAgeMaxEl = document.getElementById('profile-age-max');
    if (prefAgeMaxEl) prefAgeMaxEl.value = currentUser.pref_age_max || 80;

    const prefReligionEl = document.getElementById('profile-pref-religion');
    if (prefReligionEl) prefReligionEl.value = currentUser.pref_religion || 'Any';

    const prefCountryEl = document.getElementById('profile-pref-country');
    if (prefCountryEl) prefCountryEl.value = currentUser.pref_country || 'Any';

    document.getElementById('profile-language').value = currentUser.preferredLanguage || 'en';

    for (let i = 1; i <= 4; i++) {
        const preview = document.getElementById(`preview-${i}`);
        const icon = document.querySelector(`#profile-photo-${i}`).parentElement.querySelector('.fa-plus');
        if (currentUser.photos && currentUser.photos.length >= i) {
            preview.src = pb.files.getUrl(currentUser, currentUser.photos[i - 1]);
            preview.style.display = 'block';
            if (icon) icon.style.display = 'none';
        } else {
            preview.src = '';
            preview.style.display = 'none';
            if (icon) icon.style.display = 'block';
        }
    }

    selectedHobbies = currentUser.hobbies || [];
    renderHobbiesSelection();

    document.getElementById('edit-modal').classList.add('active');
};

function renderHobbiesSelection() {
    const container = document.getElementById('hobbies-container');
    const counter = document.getElementById('hobbies-counter');
    if (!container || !counter) return;

    container.innerHTML = '';
    AVAILABLE_HOBBIES.forEach(hobby => {
        const isSelected = selectedHobbies.includes(hobby);
        const pill = document.createElement('div');
        pill.className = `hobby-pill ${isSelected ? 'active' : ''}`;
        pill.textContent = hobby;

        pill.onclick = () => {
            if (selectedHobbies.includes(hobby)) {
                selectedHobbies = selectedHobbies.filter(h => h !== hobby);
                pill.classList.remove('active');
            } else {
                if (selectedHobbies.length >= 5) {
                    window.showToast("You can only select up to 5 hobbies.", false);
                    return;
                }
                selectedHobbies.push(hobby);
                pill.classList.add('active');
            }
            counter.textContent = `${selectedHobbies.length}/5`;
        };
        container.appendChild(pill);
    });
    counter.textContent = `${selectedHobbies.length}/5`;
}

document.getElementById('native-profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const submitBtn = document.getElementById('profile-submit-btn');
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('profile-firstName').value);

        const bdate = document.getElementById('profile-birthdate').value;
        if (bdate) {
            formData.append('birthdate', `${bdate} 12:00:00.000Z`);
        }
        formData.append('gender', document.getElementById('profile-gender').value);
        formData.append('religion', document.getElementById('profile-religion').value);
        formData.append('location', document.getElementById('profile-location').value);
        formData.append('bio', document.getElementById('profile-bio').value);
        formData.append('lookingFor', document.getElementById('profile-lookingFor').value);
        formData.append('pref_age_min', document.getElementById('profile-age-min')?.value || 18);
        formData.append('pref_age_max', document.getElementById('profile-age-max')?.value || 80);
        formData.append('pref_religion', document.getElementById('profile-pref-religion')?.value || 'Any');
        formData.append('pref_country', document.getElementById('profile-pref-country')?.value || 'Any');
        formData.append('hobbies', JSON.stringify(selectedHobbies));
        formData.append('preferredLanguage', document.getElementById('profile-language').value);

        formData.append('is_profile_completed', 'true');

        let newlyUploaded = 0;
        let retainedPhotos = 0;

        for (let i = 1; i <= 4; i++) {
            
            if (selectedFiles[i]) {
                formData.append('photos', selectedFiles[i]);
                newlyUploaded++;
            } else {
                const photoInput = document.getElementById(`profile-photo-${i}`);
                if (photoInput && photoInput.files.length > 0) {
                    const compressed = await compressToWebP(photoInput.files[0]);
                    formData.append('photos', compressed);
                    newlyUploaded++;
                } else if (currentUser.photos && currentUser.photos.length >= i) {
                    
                    formData.append('photos', currentUser.photos[i - 1]);
                    retainedPhotos++;
                }
            }
        }

        if ((retainedPhotos + newlyUploaded) < 2) {
            window.showToast("Please upload at least 2 images!", false);
            submitBtn.textContent = 'Submit Profile';
            submitBtn.disabled = false;
            return;
        }

        await pb.collection('users').update(currentUser.id, formData, { requestKey: null });

        await pb.collection('users').authRefresh();

        window.showToast("Profile saved successfully!", true);
        selectedFiles = {}; 

        window.location.reload();

    } catch (err) {
        console.error("Error saving profile:", err, err.data, err.originalError);
        window.showToast("Failed to save profile. Please try again.", false);
    } finally {
        submitBtn.textContent = 'Submit Profile';
        submitBtn.disabled = false;
    }
});

let cropperInstance = null;
let currentCropTarget = null; 
let selectedFiles = {}; 

function openCropModal(imageUrl, targetContext) {
    const cropModal = document.getElementById('cropper-modal');
    const image = document.getElementById('cropper-image');
    if (!cropModal || !image) return;

    currentCropTarget = targetContext;
    image.src = imageUrl;
    cropModal.style.display = 'flex';

    if (cropperInstance) cropperInstance.destroy();

    setTimeout(() => {
        cropperInstance = new Cropper(image, {
            aspectRatio: targetContext.type === 'verify' && targetContext.previewId === 'verify-preview-id' ? NaN : 3 / 4, 
            viewMode: 1,
            autoCropArea: 1,
        });
    }, 50);
}

document.addEventListener('DOMContentLoaded', () => {
    
    for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`profile-photo-${i}`);
        if (input) {
            input.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function (ev) {
                        openCropModal(ev.target.result, { type: 'profile', index: i, fileInput: input });
                    };
                    reader.readAsDataURL(e.target.files[0]);
                    e.target.value = ''; 
                }
            });
        }
    }

    const cancelBtn = document.getElementById('cropper-cancel-btn');
    const saveBtn = document.getElementById('cropper-save-btn');
    const cropModal = document.getElementById('cropper-modal');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            cropModal.style.display = 'none';
            if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
            currentCropTarget = null;
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!cropperInstance || !currentCropTarget) return;

            cropperInstance.getCroppedCanvas({
                maxWidth: 1024,
                maxHeight: 1024
            }).toBlob((blob) => {
                const file = new File([blob], 'cropped.webp', { type: 'image/webp' });

                if (currentCropTarget.type === 'profile') {
                    const index = currentCropTarget.index;
                    selectedFiles[index] = file;

                    const preview = document.getElementById(`preview-${index}`);
                    const input = currentCropTarget.fileInput;
                    const icon = input.parentElement.querySelector('.fa-plus');

                    if (preview) {
                        preview.src = URL.createObjectURL(blob);
                        preview.style.display = 'block';
                    }
                    if (icon) icon.style.display = 'none';
                } else if (currentCropTarget.type === 'verify') {
                    const previewId = currentCropTarget.previewId;
                    if (previewId === 'verify-preview-id') verifyIdFile = file;
                    if (previewId === 'verify-preview-selfie') verifySelfieFile = file;

                    const img = document.getElementById(previewId);
                    if (img) {
                        img.src = URL.createObjectURL(blob);
                        img.style.display = 'block';
                        const icon = img.parentElement.querySelector('.fa-plus') || img.parentElement.querySelector('i');
                        if (icon) icon.style.display = 'none';
                    }
                }

                cropModal.style.display = 'none';
                cropperInstance.destroy();
                cropperInstance = null;
                currentCropTarget = null;
            }, 'image/webp', 0.8);
        });
    }
});

window.attachTranslationToMessage = function (messageBubbleEl, originalText) {
    
    if (messageBubbleEl.dataset.translationAttached) return;
    messageBubbleEl.dataset.translationAttached = 'true';

    if (getComputedStyle(messageBubbleEl).position === 'static') {
        messageBubbleEl.style.position = 'relative';
    }

    const hammertime = new Hammer(messageBubbleEl);

    hammertime.on('press', function (event) {
        
        document.querySelectorAll('.translate-btn-popup').forEach(el => el.remove());

        const popup = document.createElement('div');
        popup.className = 'translate-btn-popup';
        popup.innerHTML = `<i class="fa-solid fa-language"></i> Translate`;

        popup.style.top = (event.center.y - 40) + 'px';
        popup.style.left = (event.center.x - 20) + 'px';
        popup.style.position = 'fixed'; 

        document.body.appendChild(popup);

        const removePopup = () => {
            popup.remove();
            document.removeEventListener('pointerdown', removePopup);
        };
        setTimeout(() => document.addEventListener('pointerdown', removePopup), 100);

        popup.onclick = async (e) => {
            e.stopPropagation();
            popup.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Translating...`;

            try {
                
                const targetLang = navigator.language.split('-')[0] || 'en';
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(originalText)}`;

                const response = await fetch(url);
                const data = await response.json();

                let translatedText = '';
                if (data && data[0]) {
                    data[0].forEach(segment => {
                        if (segment[0]) translatedText += segment[0];
                    });
                }

                if (translatedText) {
                    
                    let transBlock = messageBubbleEl.querySelector('.translated-text-block');
                    if (!transBlock) {
                        transBlock = document.createElement('div');
                        transBlock.className = 'translated-text-block';
                        messageBubbleEl.appendChild(transBlock);
                    }
                    transBlock.textContent = translatedText;
                }
            } catch (err) {
                console.error("Translation failed:", err);
                window.showToast("Translation failed. Please try again.", false);
            } finally {
                removePopup();
            }
        };
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const ageMin = document.getElementById('filter-age-min');
    const ageMax = document.getElementById('filter-age-max');
    const ageDisplayMin = document.getElementById('age-display-min');
    const ageDisplayMax = document.getElementById('age-display-max');
    const applyFiltersBtn = document.getElementById('apply-filters');

    const profileLocation = document.getElementById('profile-location');
    const prefCountry = document.getElementById('profile-pref-country');
    if (profileLocation && prefCountry) {
        
        Array.from(profileLocation.options).forEach(opt => {
            if (opt.value && !opt.disabled) {
                const clone = document.createElement('option');
                clone.value = opt.value;
                clone.textContent = opt.textContent;
                prefCountry.appendChild(clone);
            }
        });
    }

    function updateAgeDisplay() {
        if (!ageMin || !ageMax || !ageDisplayMin || !ageDisplayMax) return;
        let minVal = parseInt(ageMin.value);
        let maxVal = parseInt(ageMax.value);

        if (minVal > maxVal) {
            ageMin.value = maxVal;
            ageMax.value = minVal;
            let tmp = minVal;
            minVal = maxVal;
            maxVal = tmp;
        }
        ageDisplayMin.textContent = minVal;
        ageDisplayMax.textContent = maxVal;
    }

    if (ageMin) ageMin.addEventListener('input', updateAgeDisplay);
    if (ageMax) ageMax.addEventListener('input', updateAgeDisplay);

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            
            const sidebar = document.querySelector('.filter-sidebar');
            if (sidebar && sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
                document.querySelector('.accessibility-container')?.classList.remove('hide-fab');
                if (document.querySelector('.cupid-actions')) document.querySelector('.cupid-actions').style.display = '';
            }

            loadSwipingProfiles();
        });
    }
});

window.openSettingsModal = function () {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        
        if (currentUser) {
            const ghostRead = document.getElementById('settings-ghost-read');
            if (ghostRead) ghostRead.checked = currentUser.ghost_read_receipts || false;
            const ghostStatus = document.getElementById('settings-ghost-status');
            if (ghostStatus) ghostStatus.checked = currentUser.ghost_status || false;
        }
        modal.style.display = 'flex';
    }
};

window.closeSettingsModal = function () {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.style.display = 'none';
};

window.openChangeEmailModal = function () {
    const modal = document.getElementById('change-email-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeChangeEmailModal = function () {
    const modal = document.getElementById('change-email-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('change-email-form')?.reset();
    }
};

window.toggleGhostSetting = async function (setting, isChecked) {
    if (!currentUser) return;
    try {
        const data = {};
        let label = '';
        if (setting === 'ghost_status') {
            data['ghost_status'] = isChecked;
            label = 'Online & Last Active Status';
        } else {
            data[setting] = isChecked;
            label = setting === 'ghost_read_receipts' ? 'Read Receipts' : setting;
        }

        await pb.collection('users').update(currentUser.id, data);

        if (setting === 'ghost_status') {
            currentUser.ghost_status = isChecked;
        }

        showToast(`${label} ${isChecked ? 'Hidden 👻' : 'Visible'}`, true);
    } catch (err) {
        console.error(`Failed to update ${setting}:`, err);
        showToast("Failed to update Ghost Setting", false);
        const toggle = document.getElementById(setting === 'ghost_status' ? 'settings-ghost-status' : `settings-${setting.replace(/_/g, '-')}`);
        if (toggle) toggle.checked = !isChecked;
    }
};

window.openBlockModal = function (userId, matchId = '') {
    const modal = document.getElementById('block-modal');
    if (modal) {
        document.getElementById('block-user-id').value = userId;
        document.getElementById('block-match-id').value = matchId;
        modal.style.display = 'flex';
    }
};

window.openReportModal = function (userId, matchId = '') {
    const modal = document.getElementById('report-modal');
    if (modal) {
        document.getElementById('report-user-id').value = userId;
        document.getElementById('report-match-id').value = matchId;
        document.getElementById('report-form').reset();
        modal.style.display = 'flex';
    }
};

document.getElementById('report-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const submitBtn = document.getElementById('report-submit-btn');
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('reporter', currentUser.id);
        formData.append('reported_user', document.getElementById('report-user-id').value);

        let matchId = document.getElementById('report-match-id').value;

        if (!matchId) {
            try {
                const reportedUserId = document.getElementById('report-user-id').value;
                const matchResult = await pb.collection('matches').getFirstListItem(
                    `(user1 = "${currentUser.id}" && user2 = "${reportedUserId}") || (user1 = "${reportedUserId}" && user2 = "${currentUser.id}")`,
                    { requestKey: null }
                );
                if (matchResult) matchId = matchResult.id;
            } catch (e) {
                
            }
        }
        if (matchId) formData.append('match_id', matchId);

        formData.append('reason', document.getElementById('report-reason').value);
        formData.append('details', document.getElementById('report-details').value);

        const photosInput = document.getElementById('report-photos');
        if (photosInput && photosInput.files.length > 0) {
            for (let i = 0; i < Math.min(4, photosInput.files.length); i++) {
                const compressed = await compressToWebP(photosInput.files[i]);
                formData.append('proof_photos', compressed);
            }
        }

        await pb.collection('reports').create(formData);

        if (document.getElementById('report-block-user').checked) {
            let blocked = currentUser.blocked_users || [];
            if (!blocked.includes(document.getElementById('report-user-id').value)) {
                blocked.push(document.getElementById('report-user-id').value);
                await pb.collection('users').update(currentUser.id, { blocked_users: blocked });
                currentUser.blocked_users = blocked;
                showToast("User blocked successfully", true);

                const chatPanel = document.getElementById('chat-inbox-panel');
                if (chatPanel) {
                    chatPanel.classList.remove('open', 'minimized', 'has-active-chat');
                    document.body.classList.remove('chat-minimized');
                    document.getElementById('active-chat-view').style.display = 'none';
                    localStorage.setItem('chatPanelState', 'closed');
                    document.body.style.overflow = '';
                }
                window.loadSwipingProfiles(); 
            }
        }

        showToast("Report submitted successfully", true);
        document.getElementById('report-modal').style.display = 'none';
    } catch (err) {
        console.error("Report submit error:", err);
        if (err.data && err.data.message === "You already have a pending report against this user.") {
            showToast("You already have a pending report against this user.", false);
        } else {
            showToast("Failed to submit report.", false);
        }
    } finally {
        submitBtn.textContent = 'Submit Report';
        submitBtn.disabled = false;
    }
});

document.getElementById('block-submit-btn')?.addEventListener('click', async () => {
    if (!currentUser) return;

    const userId = document.getElementById('block-user-id').value;
    if (!userId) return;

    const submitBtn = document.getElementById('block-submit-btn');
    submitBtn.textContent = 'Blocking...';
    submitBtn.disabled = true;

    try {
        let blocked = currentUser.blocked_users || [];
        if (!blocked.includes(userId)) {
            blocked.push(userId);
            await pb.collection('users').update(currentUser.id, { blocked_users: blocked });
            currentUser.blocked_users = blocked;
        }

        showToast("User blocked successfully", true);
        document.getElementById('block-modal').style.display = 'none';

        if (typeof window.closeChat === 'function') {
            window.closeChat();
        } else {
            
            const chatPanel = document.getElementById('chat-inbox-panel');
            if (chatPanel) {
                chatPanel.classList.remove('open', 'minimized', 'has-active-chat');
                document.body.classList.remove('chat-minimized');
                document.getElementById('active-chat-view').style.display = 'none';
                localStorage.setItem('chatPanelState', 'closed');
                document.body.style.overflow = '';
            }
        }
        if (typeof window.loadSwipingProfiles === 'function') window.loadSwipingProfiles();

    } catch (err) {
        console.error("Block error:", err);
        showToast("Failed to block user.", false);
    } finally {
        submitBtn.textContent = 'Block';
        submitBtn.disabled = false;
    }
});

document.getElementById('change-email-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const newEmail = document.getElementById('new-email-input').value.trim();
    const submitBtn = document.getElementById('change-email-submit-btn');

    if (!newEmail) return;

    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
        await pb.collection('users').requestEmailChange(newEmail);
        showToast("Confirmation link sent to your new email address!", true);
        window.closeChangeEmailModal();
    } catch (err) {
        console.error("Change email error:", err);
        showToast(err.message || "Failed to request email change.", false);
    } finally {
        submitBtn.textContent = 'Send Confirmation Link';
        submitBtn.disabled = false;
    }
});

window.openBlockedUsersModal = async function () {
    const modal = document.getElementById('blocked-users-modal');
    const list = document.getElementById('blocked-users-list');
    if (!modal || !list) return;

    modal.style.display = 'flex';
    list.innerHTML = '<div style="text-align: center; color: var(--text-muted); margin-top: 1rem;"><i class="fas fa-circle-notch fa-spin"></i> Loading...</div>';

    if (!currentUser.blocked_users || currentUser.blocked_users.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-muted); margin-top: 1rem;">No blocked users.</div>';
        return;
    }

    try {
        const filterStr = currentUser.blocked_users.map(id => `id="${id}"`).join(' || ');
        const blockedUsers = await pb.collection('users').getFullList({
            filter: filterStr
        });

        if (blockedUsers.length === 0) {
            list.innerHTML = '<div style="text-align: center; color: var(--text-muted); margin-top: 1rem;">No blocked users.</div>';
            return;
        }

        let html = '';
        blockedUsers.forEach(u => {
            const avatarUrl = (u.photos && u.photos.length > 0) ? pb.files.getUrl(u, u.photos[0]) : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`;
            html += `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid var(--glass-border);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${avatarUrl}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                        <span style="font-weight: 600; color: var(--text-main);">${window.escapeHtml ? window.escapeHtml(u.name) : u.name.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]; })}</span>
                    </div>
                    <button onclick="window.unblockUser('${u.id}')" style="background: var(--brand-brown); color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem;">Unblock</button>
                </div>
            `;
        });
        list.innerHTML = html;
    } catch (err) {
        console.error("Failed to load blocked users:", err);
        list.innerHTML = '<div style="text-align: center; color: red; margin-top: 1rem;">Failed to load.</div>';
    }
};

window.closeBlockedUsersModal = function () {
    const modal = document.getElementById('blocked-users-modal');
    if (modal) modal.style.display = 'none';
};

window.unblockUser = function (userIdToUnblock) {
    if (!currentUser || !currentUser.blocked_users) return;
    
    const modal = document.getElementById('unblock-modal');
    if (modal) {
        document.getElementById('unblock-user-id').value = userIdToUnblock;
        modal.style.display = 'flex';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-unblock-modal-btn')?.addEventListener('click', () => {
        document.getElementById('unblock-modal').style.display = 'none';
    });
    document.getElementById('cancel-unblock-btn')?.addEventListener('click', () => {
        document.getElementById('unblock-modal').style.display = 'none';
    });
    document.getElementById('unblock-modal-backdrop')?.addEventListener('click', () => {
        document.getElementById('unblock-modal').style.display = 'none';
    });

    document.getElementById('unblock-submit-btn')?.addEventListener('click', async () => {
        if (!currentUser) return;
        const userIdToUnblock = document.getElementById('unblock-user-id').value;
        if (!userIdToUnblock) return;
        
        const submitBtn = document.getElementById('unblock-submit-btn');
        submitBtn.textContent = 'Unblocking...';
        submitBtn.disabled = true;

        try {
            const newBlockedList = currentUser.blocked_users.filter(id => id !== userIdToUnblock);
            await pb.collection('users').update(currentUser.id, { blocked_users: newBlockedList });
            currentUser.blocked_users = newBlockedList;

            showToast("User unblocked", true);
            if (typeof window.openBlockedUsersModal === 'function') window.openBlockedUsersModal(); 

            if (typeof window.fetchAndRenderMatches === 'function') {
                window.fetchAndRenderMatches();
            } else {
                
                const event = new Event('matchesUpdated');
                document.dispatchEvent(event);
            }
            if (typeof window.loadSwipingProfiles === 'function') window.loadSwipingProfiles(); 

            if (typeof window.openPocketBaseChat === 'function' && window.currentChatOtherUser && window.currentChatOtherUser.id === userIdToUnblock) {
                window.openPocketBaseChat(window.currentChatMatchId, window.currentChatOtherUser, true);
            }

            document.getElementById('unblock-modal').style.display = 'none';
        } catch (err) {
            console.error("Failed to unblock:", err);
            showToast("Failed to unblock user", false);
        } finally {
            submitBtn.textContent = 'Unblock';
            submitBtn.disabled = false;
        }
    });
});

function adjustAuthControlsPosition() {
    if (window.innerWidth <= 768) {
        const nav = document.querySelector('nav');
        const authControls = document.querySelector('.auth-controls-container');
        if (nav && authControls) {
            const navRect = nav.getBoundingClientRect();
            const navBottom = navRect.bottom;
            authControls.style.top = `${navBottom + 10}px`;
        }
    } else {
        const authControls = document.querySelector('.auth-controls-container');
        if (authControls) authControls.style.top = ''; 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(adjustAuthControlsPosition, 100);
    window.addEventListener('resize', adjustAuthControlsPosition);

    const navEl = document.querySelector('nav');
    if (navEl && navEl.parentNode) {
        const observer = new MutationObserver(adjustAuthControlsPosition);
        observer.observe(navEl.parentNode, { childList: true });
    }
});

window.cycleCardPhoto = function (element, direction) {
    const wrapper = element.closest('.tinder-card-image-wrapper');
    if (!wrapper) return;

    const rawData = wrapper.getAttribute('data-photos');
    if (!rawData) return;

    const unescapedData = rawData.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    let photos = [];
    try {
        photos = JSON.parse(unescapedData);
    } catch (e) {
        console.error("Failed to parse photos:", e);
        return;
    }

    if (photos.length <= 1) return;

    let currentIndex = parseInt(wrapper.getAttribute('data-current-index') || '0');
    currentIndex += direction;

    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= photos.length) currentIndex = photos.length - 1;

    wrapper.setAttribute('data-current-index', currentIndex);

    const img = wrapper.querySelector('.tinder-card-image');
    if (img) img.src = photos[currentIndex];

    const dots = wrapper.querySelectorAll('.tinder-dot');
    dots.forEach((dot, i) => {
        dot.style.background = (i === currentIndex) ? 'white' : 'rgba(255,255,255,0.4)';
    });
};

window.requestAccountDeletion = () => {
    const modal = document.getElementById('account-deletion-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeAccountDeletionModal = () => {
    const modal = document.getElementById('account-deletion-modal');
    if (modal) modal.style.display = 'none';
};

window.confirmAccountDeletion = async () => {
    window.closeAccountDeletionModal();
    try {
        if (!window.pb || !window.pb.authStore.isValid) throw new Error("Not logged in");

        await pb.collection('users').update(window.pb.authStore.model.id, {
            DeletionRequested: true
        });

        window.location.reload();
    } catch (err) {
        console.error("Deletion request failed:", err);
        if (window.showToast) {
            window.showToast("Could not process request. Please check your connection or contact support.", false);
        }
    }
};

window.revokeDeletionRequest = async () => {
    try {
        if (!window.pb || !window.pb.authStore.isValid) throw new Error("Not logged in");

        await pb.collection('users').update(window.pb.authStore.model.id, {
            DeletionRequested: false
        });

        window.showToast("Deletion request revoked successfully!", true);
        window.location.reload();
    } catch (err) {
        console.error("Revoke deletion failed:", err);
        if (window.showToast) window.showToast("Could not revoke request. Please try again.", false);
    }
};

window.openPremiumModal = () => {
    const modal = document.getElementById('premium-perks-modal');
    if (!modal) return;

    const title = document.getElementById('premium-modal-title');
    const desc = modal.querySelector('.premium-modal-subtitle');
    const perksList = modal.querySelector('.premium-perks-list');
    const actionBtn = document.getElementById('premium-action-btn');
    const headerIcon = document.getElementById('premium-modal-header-icon');
    const warningText = modal.querySelector('.fa-shield-halved')?.parentNode;

    if (window.pb && window.pb.authStore.model) {
        if (window.pb.authStore.model.is_premium) {
            if (title) title.textContent = 'Premium Member';
            if (desc) desc.textContent = 'As a Premium member, you are actively enjoying these exclusive VIP features:';

            if (headerIcon) {
                const avatarUrl = (window.pb.authStore.model.photos && window.pb.authStore.model.photos.length > 0) 
                    ? window.pb.files.getUrl(window.pb.authStore.model, window.pb.authStore.model.photos[0]) 
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(window.pb.authStore.model.name)}&background=random`;
                
                headerIcon.innerHTML = `
                    <div style="position: relative; width: 100%; height: 100%; border-radius: 50%;">
                        <img src="${avatarUrl}" class="premium-avatar-ring" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 4px solid var(--bg-main);">
                        <i class="fa-solid fa-crown premium-crown-badge" style="font-size: 1.6rem; top: -10px; left: -10px;"></i>
                    </div>
                `;
                headerIcon.style.background = 'transparent';
                headerIcon.style.border = 'none';
                headerIcon.style.boxShadow = 'none';
            }
            if (perksList) perksList.style.display = 'block';
            if (warningText) warningText.style.display = 'none';

            if (actionBtn) {
                actionBtn.style.display = 'none';
            }
        } else {
            if (title) title.textContent = 'Unlock Royal Premium';
            if (desc) desc.textContent = 'Elevate your dating experience with exclusive VIP features.';

            if (headerIcon) {
                headerIcon.innerHTML = '<i class="fa-solid fa-crown" style="font-size: 2.6rem; color: #fff; filter: drop-shadow(0 3px 5px rgba(139, 90, 51, 0.6));"></i>';
                headerIcon.style.background = 'linear-gradient(135deg, #f9f2d0 0%, #d4af37 50%, #b8860b 100%)';
                headerIcon.style.border = '4px solid var(--bg-main)';
                headerIcon.style.boxShadow = '0 15px 35px rgba(218, 165, 32, 0.5), inset 0 2px 4px rgba(255,255,255,0.8)';
            }

            if (perksList) perksList.style.display = 'block';
            if (warningText) warningText.style.display = 'block';

            if (actionBtn) {
                actionBtn.style.display = 'block';
                actionBtn.innerHTML = '<i class="fa-solid fa-lock" style="margin-right: 8px;"></i> Coming Soon';
                actionBtn.style.background = 'linear-gradient(135deg, #d4af37, #b8860b)';
                actionBtn.style.color = '#fff';
                actionBtn.style.boxShadow = '0 10px 25px rgba(218, 165, 32, 0.4), inset 0 2px 4px rgba(255,255,255,0.4)';
                actionBtn.disabled = true;
            }
        }
    }

    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
};

window.closePremiumModal = () => {
    const modal = document.getElementById('premium-perks-modal');
    if (!modal) return;

    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); 
};

document.addEventListener('DOMContentLoaded', () => {
    const pModal = document.getElementById('premium-perks-modal');
    if (pModal) {
        pModal.addEventListener('click', (e) => {
            if (e.target === pModal || e.target.closest('#close-premium-modal-btn')) {
                window.closePremiumModal();
            }
        });
    }
});
