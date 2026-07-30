// ==========================================
// firebase-config.js
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, updateDoc, doc, getDocs, getDoc, setDoc, deleteDoc, arrayRemove, arrayUnion, deleteField } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Web Audio API Sound Generator for Chat
window.playChatSound = (type) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'send') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'receive') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        }
    } catch (e) { console.warn('Audio play failed', e); }
};

const firebaseConfig = {
    apiKey: "AIzaSyAIhlyRQXVaINXyKuM9RPxJxrSzsf89lKo",
    authDomain: "yatramore-chat.firebaseapp.com",
    projectId: "yatramore-chat",
    storageBucket: "yatramore-chat.firebasestorage.app",
    messagingSenderId: "745492979348",
    appId: "1:745492979348:web:2d0692aff89f78ac111e81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Export to window for global vanilla JS access
window.firebaseDb = db;
window.firebaseAuth = auth;
window.firebaseStorage = storage;
window.firebaseAuthHelpers = { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification };
window.firebaseHelpers = { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, updateDoc, doc, getDocs, getDoc, setDoc, deleteDoc, arrayRemove, arrayUnion, deleteField };
window.firebaseStorageHelpers = { ref, uploadBytes, getDownloadURL };

window.escapeHtml = (str) => {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, function (match) {
        switch (match) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return match;
        }
    });
};


// ==========================================
// auth.js
// ==========================================

// auth.js
// Handles Firebase Authentication logic and state management

let currentUser = null;

function initAuthSystem() {
    if (!window.firebaseAuth || !window.firebaseAuthHelpers) {
        setTimeout(initAuthSystem, 100);
        return;
    }

    const { onAuthStateChanged } = window.firebaseAuthHelpers;
    const auth = window.firebaseAuth;

    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        window.firebaseCurrentUser = user; // Expose globally

        // Save email to users collection for Admin dashboard visibility
        if (user && window.firebaseHelpers && window.firebaseDb) {
            try {
                const { doc, setDoc } = window.firebaseHelpers;
                await setDoc(doc(window.firebaseDb, 'users', user.uid), { email: user.email }, { merge: true });
            } catch (err) {
                console.warn("Could not sync email to users collection:", err);
            }
        }

        // Admin Button Toggle
        const adminBtn = document.getElementById('admin-dashboard-btn');
        if (adminBtn) {
            if (user && user.uid === "BNtlmi6FmlWx6y86gzmwKFQ1qCk2") {
                adminBtn.style.display = 'inline-block';
            } else {
                adminBtn.style.display = 'none';
            }
        }

        const loggedInElements = document.querySelectorAll('.auth-logged-in');
        const loggedOutElements = document.querySelectorAll('.auth-logged-out');

        if (user) {
            // User is signed in
            loggedInElements.forEach(el => el.style.display = el.dataset.displayOriginal || 'block');
            loggedOutElements.forEach(el => el.style.display = 'none');

            // Dispatch a custom event so other scripts (matchmaking) know auth is ready
            window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user } }));

            checkUserNotifications(user.uid);
        } else {
            // User is signed out
            loggedInElements.forEach(el => el.style.display = 'none');
            loggedOutElements.forEach(el => el.style.display = el.dataset.displayOriginal || 'block');

            window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user: null } }));
        }
    });

    setupAuthUIListeners();
}

let notificationListenerUnsubscribe = null;
function checkUserNotifications(uid) {
    try {
        const { doc, onSnapshot, deleteDoc } = window.firebaseHelpers;
        const db = window.firebaseDb;
        
        if (notificationListenerUnsubscribe) {
            notificationListenerUnsubscribe();
        }

        notificationListenerUnsubscribe = onSnapshot(doc(db, "notifications", uid), (notifDoc) => {
            if (notifDoc.exists()) {
                const data = notifDoc.data();
                setTimeout(() => {
                    if (window.showToast) {
                        window.showToast(data.message);
                    } else {
                        alert(data.message);
                    }
                    deleteDoc(doc(db, "notifications", uid));
                    
                    // Auto-refresh the page after 3 seconds so their profile/grid updates
                    setTimeout(() => window.location.reload(), 3000);
                }, 1500); // Small delay to let UI load completely
            }
        });
    } catch (e) {
        console.error("Error checking notifications:", e);
    }
}

function setupAuthUIListeners() {
    const authModal = document.getElementById('auth-modal');
    const authOverlay = document.getElementById('auth-overlay');
    const authCloseBtn = document.getElementById('auth-close-btn');

    // Auth Triggers
    const loginTriggers = document.querySelectorAll('.trigger-login');
    loginTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal('login');
        });
    });

    const signupTriggers = document.querySelectorAll('.trigger-signup');
    signupTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal('signup');
        });
    });

    const logoutTriggers = document.querySelectorAll('.trigger-logout');
    logoutTriggers.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const { signOut } = window.firebaseAuthHelpers;
            try {
                await signOut(window.firebaseAuth);
                // Reload the page to show the matchmaking welcome screen
                window.location.reload();
            } catch (error) {
                console.error("Logout Error:", error);
            }
        });
    });

    // Close Modal
    const closeModal = () => {
        if (authModal) authModal.classList.remove('active');
        if (authOverlay) authOverlay.classList.remove('active');
    };
    if (authCloseBtn) authCloseBtn.addEventListener('click', closeModal);
    if (authOverlay) authOverlay.addEventListener('click', closeModal);

    // Form logic
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
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Please wait...';
            submitBtn.disabled = true;

            const { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut } = window.firebaseAuthHelpers;
            const auth = window.firebaseAuth;

            try {
                if (mode === 'login') {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    // Let the gatekeeping logic handle unverified emails, do not sign them out!
                } else {
                    const confirmPassword = document.getElementById('auth-confirm-password').value;
                    if (password !== confirmPassword) {
                        throw new Error("Passwords do not match.");
                    }
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    await sendEmailVerification(userCredential.user);
                    // Do not sign out! They will be sent to the Verify Email gate.
                }
                closeModal();
                // Only redirect if they logged in successfully (not on signup, because they need to verify)
                if (mode === 'login') {
                    if (authForm.dataset.redirect) {
                        window.location.href = authForm.dataset.redirect;
                    } else {
                        window.location.reload();
                    }
                }
            } catch (error) {
                errorContainer.style.display = 'block';
                // Clean up Firebase error messages
                let msg = error.message;
                if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
                if (error.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
                if (error.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
                errorContainer.textContent = msg;
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // Forgot Password logic
    const forgotPasswordLink = document.getElementById('auth-forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('auth-email');
            const errorContainer = document.getElementById('auth-error');
            const email = emailInput ? emailInput.value.trim() : '';

            if (!email) {
                errorContainer.style.display = 'block';
                errorContainer.textContent = 'Please enter your email address first to reset your password.';
                return;
            }

            try {
                const { sendPasswordResetEmail } = window.firebaseAuthHelpers;
                const auth = window.firebaseAuth;
                await sendPasswordResetEmail(auth, email);
                errorContainer.style.display = 'block';
                errorContainer.style.background = 'rgba(76, 175, 80, 0.1)';
                errorContainer.style.color = '#4CAF50';
                errorContainer.textContent = 'Password reset email sent! Check your inbox.';
            } catch (error) {
                errorContainer.style.display = 'block';
                errorContainer.style.background = 'rgba(244, 67, 54, 0.1)';
                errorContainer.style.color = '#F44336';
                let msg = error.message;
                if (error.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
                if (error.code === 'auth/user-not-found') msg = 'No account found with this email.';
                errorContainer.textContent = msg;
            }
        });
    }

    // Tab switching
    const tabLogin = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const submitBtn = document.getElementById('auth-submit-btn');

    if (tabLogin && tabSignup) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            if (authForm) authForm.dataset.mode = 'login';
            if (submitBtn) submitBtn.textContent = 'Login';
            const confirmGroup = document.getElementById('auth-confirm-password-group');
            if (confirmGroup) confirmGroup.style.display = 'none';
            const forgotLink = document.getElementById('auth-forgot-password-link');
            if (forgotLink) forgotLink.style.display = 'inline-block';
        });

        tabSignup.addEventListener('click', () => {
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            if (authForm) authForm.dataset.mode = 'signup';
            if (submitBtn) submitBtn.textContent = 'Create Account';
            const confirmGroup = document.getElementById('auth-confirm-password-group');
            if (confirmGroup) confirmGroup.style.display = 'block';
            const forgotLink = document.getElementById('auth-forgot-password-link');
            if (forgotLink) forgotLink.style.display = 'none';
        });
    }
}

function openAuthModal(mode = 'login') {
    const authModal = document.getElementById('auth-modal');
    const authOverlay = document.getElementById('auth-overlay');
    if (authModal && authOverlay) {
        authModal.classList.add('active');
        authOverlay.classList.add('active');

        const tabLogin = document.getElementById('auth-tab-login');
        const tabSignup = document.getElementById('auth-tab-signup');
        if (mode === 'login' && tabLogin) tabLogin.click();
        if (mode === 'signup' && tabSignup) tabSignup.click();
    }
}

// Init on load
document.addEventListener('DOMContentLoaded', initAuthSystem);


// ==========================================
// chat.js
// ==========================================

// chat.js
// Handles real-time messaging logic using Firebase Firestore

let currentMember = null;
let currentChatId = null;
let currentChatOtherUser = null;
let unsubscribeMessages = null;

let isChatInitialized = false;

// Wait for Firebase to be ready
function initChatSystem() {
    if (!document.getElementById('chat-inbox-panel')) return;
    window.addEventListener('auth-state-changed', (e) => {
        const user = e.detail.user;
        if (user) {
            currentMember = { id: user.uid, email: user.email };
            if (!isChatInitialized) {
                setupUIListeners();
                listenForInboxUpdates();
                isChatInitialized = true;
            }
        } else {
            currentMember = null;
        }
    });
}

function setupUIListeners() {
    const inboxBtn = document.getElementById('nav-inbox-btn');
    const panel = document.getElementById('chat-inbox-panel');
    let overlay = document.getElementById('chat-overlay');

    // Create overlay if it doesn't exist in the HTML
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'chat-overlay';
        overlay.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:transparent; z-index:1998; opacity:0; transition:opacity 0.3s;';
        document.body.appendChild(overlay);
    }

    const closeBtn = document.getElementById('close-inbox-btn');

    // Panel Toggle
    if (inboxBtn) {
        inboxBtn.addEventListener('click', () => {
            if (panel) panel.style.display = 'flex';
            setTimeout(() => {
                if (panel) panel.classList.add('open');
                if (window.innerWidth <= 768) {
                    const fab = document.getElementById('mobile-filter-fab');
                    if (fab) fab.classList.add('hide-fab');
                    const ac = document.querySelector('.accessibility-container');
                    if (ac) ac.classList.add('hide-fab');
                }
            }, 10);
        });
    }

    const closePanel = () => {
        if (panel) panel.classList.remove('open');
        const fab = document.getElementById('mobile-filter-fab');
        if (fab) fab.classList.remove('hide-fab');
        const ac = document.querySelector('.accessibility-container');
        if (ac) ac.classList.remove('hide-fab');
        setTimeout(() => {
            if (panel) panel.style.display = 'none';
        }, 300);
        closeActiveChat();
    };

    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (overlay) overlay.addEventListener('click', closePanel);

    // Tabs
    const tabChats = document.getElementById('tab-chats');
    const tabRequests = document.getElementById('tab-requests');
    const listChats = document.getElementById('chats-list');
    const listRequests = document.getElementById('requests-list');

    if (tabChats && tabRequests && listChats && listRequests) {
        tabChats.addEventListener('click', () => {
            tabChats.style.borderBottomColor = 'var(--brand-brown)';
            tabChats.style.color = 'var(--brand-brown)';
            tabRequests.style.borderBottomColor = 'transparent';
            tabRequests.style.color = 'var(--text-muted)';
            listChats.style.display = 'block';
            listRequests.style.display = 'none';
        });

        tabRequests.addEventListener('click', () => {
            tabRequests.style.borderBottomColor = 'var(--brand-brown)';
            tabRequests.style.color = 'var(--brand-brown)';
            tabChats.style.borderBottomColor = 'transparent';
            tabChats.style.color = 'var(--text-muted)';
            listRequests.style.display = 'block';
            listChats.style.display = 'none';
        });
    }

    // Chat Interface Actions
    document.getElementById('back-to-inbox').addEventListener('click', closeActiveChat);
    document.getElementById('close-chat-btn').addEventListener('click', closeActiveChat);

    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        if (window.cancelEditMessage) window.cancelEditMessage();
    });

    document.getElementById('delete-chat-btn').addEventListener('click', () => {
        if (window.deleteConversation) window.deleteConversation();
    });

    // Send Message
    const sendBtn = document.getElementById('send-msg-btn');
    const inputField = document.getElementById('chat-input');

    const sendMessage = async () => {
        const text = inputField.value.trim();
        if (!text || !currentChatId) return;

        const { collection, addDoc, serverTimestamp, updateDoc, doc, deleteField } = window.firebaseHelpers;
        const db = window.firebaseDb;

        if (window.editingMessageId) {
            try {
                await updateDoc(doc(db, "conversations", currentChatId, "messages", window.editingMessageId), {
                    text: text,
                    isEdited: true
                });
                window.cancelEditMessage();
            } catch (e) {
                console.error("Error editing message:", e);
                if (window.showToast) window.showToast("Failed to edit message. You might not have permission.");
            }
            return;
        }

        inputField.value = '';

        // Add to subcollection
        await addDoc(collection(db, "conversations", currentChatId, "messages"), {
            senderId: currentMember.id,
            text: text,
            createdAt: serverTimestamp()
        });

        // Update parent doc
        await updateDoc(doc(db, "conversations", currentChatId), {
            lastMessage: text,
            lastMessageSenderId: currentMember.id,
            unreadBy: [currentChatOtherUser.id],
            updatedAt: serverTimestamp(),
            [`deletedAt.${currentMember.id}`]: deleteField(),
            [`deletedAt.${currentChatOtherUser.id}`]: deleteField()
        });

        // Play sound for outgoing message
        if (window.playChatSound) {
            window.playChatSound('send');
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Report User
    document.getElementById('report-user-btn').addEventListener('click', async () => {
        if (!currentChatId || !currentChatOtherUser) return;
        if (confirm(`Are you sure you want to report ${currentChatOtherUser.name}? This will block them and end the chat immediately.`)) {
            const { updateDoc, doc, addDoc, collection, serverTimestamp } = window.firebaseHelpers;
            const db = window.firebaseDb;

            // Lock conversation
            await updateDoc(doc(db, "conversations", currentChatId), {
                status: 'reported'
            });

            // We would usually add to a "reports" collection to trigger a webhook to Airtable
            await addDoc(collection(db, "reports"), {
                reportedBy: currentMember.id,
                reportedUser: currentChatOtherUser.id,
                conversationId: currentChatId,
                createdAt: serverTimestamp()
            });

            alert('User reported. The conversation has been closed and locked.');
            closeActiveChat();
        }
    });

    // Close Chat
    const closeChatBtn = document.getElementById('close-chat-btn');
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            closeActiveChat();
        });
    }

    // Block User (Personal Block)
    const blockBtn = document.getElementById('block-user-btn');
    if (blockBtn) {
        blockBtn.addEventListener('click', async () => {
            if (!currentChatId || !currentChatOtherUser) return;
            if (confirm(`Are you sure you want to block ${currentChatOtherUser.name}? They will not be able to message you.`)) {
                const { updateDoc, doc, arrayUnion } = window.firebaseHelpers;
                const db = window.firebaseDb;
                await updateDoc(doc(db, "conversations", currentChatId), {
                    blockedBy: arrayUnion(currentMember.id)
                });
                document.getElementById('block-user-btn').style.display = 'none';
                document.getElementById('unblock-user-btn').style.display = 'flex';
                document.getElementById('chat-input').disabled = true;
                document.getElementById('chat-input').placeholder = "You blocked this user.";
                document.getElementById('send-msg-btn').disabled = true;
                alert('User blocked. They can no longer send you messages.');
            }
        });
    }

    // Unblock User (Personal Unblock)
    const unblockBtn = document.getElementById('unblock-user-btn');
    if (unblockBtn) {
        unblockBtn.addEventListener('click', async () => {
            if (!currentChatId || !currentChatOtherUser) return;
            if (confirm(`Are you sure you want to unblock ${currentChatOtherUser.name}?`)) {
                const { updateDoc, doc, arrayRemove } = window.firebaseHelpers;
                const db = window.firebaseDb;
                await updateDoc(doc(db, "conversations", currentChatId), {
                    blockedBy: arrayRemove(currentMember.id)
                });
                document.getElementById('block-user-btn').style.display = 'flex';
                document.getElementById('unblock-user-btn').style.display = 'none';
                document.getElementById('chat-input').disabled = false;
                document.getElementById('chat-input').placeholder = "Type a message...";
                document.getElementById('send-msg-btn').disabled = false;
                alert('User unblocked. You can now chat again.');
            }
        });
    }
}

function closeActiveChat() {
    document.getElementById('active-chat-view').style.display = 'none';
    currentChatId = null;
    currentChatOtherUser = null;
    if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
    }
}

function listenForInboxUpdates() {
    if (!currentMember) return;

    const { collection, query, where, onSnapshot } = window.firebaseHelpers;
    const db = window.firebaseDb;

    const q = query(collection(db, "conversations"),
        where("participants", "array-contains", currentMember.id));

    window.acceptedChatUserIds = new Set();
    window.pendingChatUserIds = new Set();

    let isInitialLoad = true;

    onSnapshot(q, (snapshot) => {
        const chatList = document.getElementById('chats-list');
        const reqList = document.getElementById('requests-list');
        const navBadge = document.getElementById('nav-inbox-badge');

        let pendingCount = 0;
        let unreadChatCount = 0;
        let activeChatsHtml = '';
        let pendingRequestsHtml = '';

        window.acceptedChatUserIds.clear();
        window.pendingChatUserIds.clear();
        window.declinedChatUserIds = window.declinedChatUserIds || new Set();
        window.declinedChatUserIds.clear();

        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        docs.sort((a, b) => {
            const timeA = a.updatedAt ? a.updatedAt.toMillis() : 0;
            const timeB = b.updatedAt ? b.updatedAt.toMillis() : 0;
            return timeB - timeA;
        });

        docs.forEach(data => {
            // Bug #2 fix: null guard on user1/user2
            if (!data.user1 || !data.user2) return;

            const isUser1 = data.user1.id === currentMember.id;
            const otherUser = isUser1 ? data.user2 : data.user1;

            if (data.status === 'reported') return;

            if (data.status === 'pending') {
                if (!isUser1) {
                    // It's a request TO me
                    pendingCount++;
                    pendingRequestsHtml += `
                        <div class="request-item">
                            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                <img src="${window.escapeHtml(otherUser.photo)}" class="inbox-avatar" style="width:45px; height:45px; object-fit: cover;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; font-size: 1rem; color: var(--text-main);">${window.escapeHtml(otherUser.name)}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Wants to connect!</div>
                                </div>
                            </div>
                            
                            ${otherUser.profile ? `
                            <!-- Expandable Profile Section -->
                            <div id="req-profile-${data.id}" class="req-profile-expand" style="display: none;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600;">
                                    <span><i class="fas fa-birthday-cake" style="color: var(--brand-brown); opacity: 0.8;"></i> ${window.escapeHtml(String(otherUser.profile.age))}</span>
                                    <span><i class="fas ${otherUser.profile.gender === 'Male' ? 'fa-mars' : otherUser.profile.gender === 'Female' ? 'fa-venus' : 'fa-user'}" style="color: var(--brand-brown); opacity: 0.8;"></i> ${window.escapeHtml(otherUser.profile.gender || 'N/A')}</span>
                                    <span><i class="fas fa-map-marker-alt" style="color: var(--brand-brown); opacity: 0.8;"></i> ${window.escapeHtml(otherUser.profile.location)}</span>
                                </div>
                                ${otherUser.profile.religion ? `<div style="margin-bottom: 8px; font-weight: 600;"><i class="fas fa-praying-hands" style="color: var(--brand-brown); opacity: 0.8;"></i> ${window.escapeHtml(otherUser.profile.religion === 'Prefer not to say' ? 'N/A' : otherUser.profile.religion)}</div>` : ''}
                                <div style="font-style: italic; opacity: 0.9;">"${window.escapeHtml(otherUser.profile.bio)}"</div>
                            </div>
                            ` : ''}
                            <div class="request-actions">
                                ${otherUser.profile ? `
                                <button onclick="const el = document.getElementById('req-profile-${data.id}'); el.style.display = el.style.display === 'none' ? 'block' : 'none';" class="btn-request-action">
                                    <i class="fas fa-user"></i> View Profile
                                </button>
                                ` : ''}
                                <button class="btn-request-action" onclick="if(event) event.stopPropagation(); handleRequest('${data.id}', 'declined')">Decline</button>
                                <button class="btn-request-action" onclick="if(event) event.stopPropagation(); handleRequest('${data.id}', 'accepted')">Accept</button>
                            </div>
                        </div>
                    `;
                } else {
                    // It's a request FROM me
                    window.pendingChatUserIds.add(otherUser.id);
                }
            } else if (data.status === 'declined') {
                if (isUser1) {
                    const now = Date.now();
                    const declinedTime = data.updatedAt ? data.updatedAt.toMillis() : 0;
                    if (now - declinedTime < 7 * 24 * 60 * 60 * 1000) {
                        window.declinedChatUserIds.add(otherUser.id);
                    }
                }
            } else if (data.status === 'accepted') {
                window.acceptedChatUserIds.add(otherUser.id);
                window.acceptedChatDocIds = window.acceptedChatDocIds || {};
                window.acceptedChatDocIds[otherUser.id] = data.id;
                window.acceptedChatUsers = window.acceptedChatUsers || {};
                window.acceptedChatUsers[otherUser.id] = otherUser;

                let isUnread = false;
                if (data.unreadBy && data.unreadBy.includes(currentMember.id)) {
                    isUnread = true;
                    unreadChatCount++;
                }

                // Active Chat
                let timeStr = '';
                let updatedAtMs = 0;
                if (data.updatedAt) {
                    const date = data.updatedAt.toDate();
                    updatedAtMs = date.getTime();
                    timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                const myDeletedAt = data.deletedAt && data.deletedAt[currentMember.id] ? data.deletedAt[currentMember.id] : 0;
                if (myDeletedAt && updatedAtMs <= myDeletedAt) {
                    return; // Skip rendering this chat because user deleted it and no new messages arrived
                }

                const safeUserStr = encodeURIComponent(JSON.stringify(otherUser)).replace(/'/g, "%27");
                activeChatsHtml += `
                    <div class="swipe-chat-container">
                        <div class="inbox-chat-item swipe-content" onclick="openChat('${data.id}', '${safeUserStr}')" style="${isUnread ? 'background: rgba(107, 66, 38, 0.08); border-left: 3px solid var(--brand-brown);' : ''}">
                            <img src="${window.escapeHtml(otherUser.photo)}" class="inbox-avatar">
                            <div class="inbox-details">
                                <div class="inbox-name">${window.escapeHtml(otherUser.name)} <span class="inbox-time">${timeStr}</span></div>
                                <div class="inbox-preview" style="${isUnread ? 'font-weight: bold; color: var(--brand-brown);' : ''}">${window.escapeHtml(data.lastMessage || 'Tap to chat...')}</div>
                            </div>
                            ${isUnread ? '<div style="width: 10px; height: 10px; background: var(--brand-brown); border-radius: 50%; margin-left: 10px;"></div>' : ''}
                        </div>
                        <div class="swipe-action-delete" onclick="window.deleteConversationById('${data.id}')">
                            <i class="fa-solid fa-trash"></i>
                        </div>
                    </div>
                `;
            }
        });

        // Re-render buttons in matchmaking grid if needed
        if (typeof renderProfiles === 'function' && window.rawAirtableProfiles) {
            // trigger a non-destructive update of just the buttons
            if (window.updateProfileButtons) window.updateProfileButtons();
        }

        // Update DOM
        if (activeChatsHtml) chatList.innerHTML = activeChatsHtml;
        else chatList.innerHTML = `<div style="text-align: center; color: var(--text-muted); margin-top: 2rem; font-size: 0.95rem;">No active chats yet.</div>`;

        if (pendingRequestsHtml) reqList.innerHTML = pendingRequestsHtml;
        else reqList.innerHTML = `<div style="text-align: center; color: var(--text-muted); margin-top: 2rem; font-size: 0.95rem;">No pending requests.</div>`;

        // Update Badges
        const reqBadge = document.getElementById('requests-badge');
        const chatBadge = document.getElementById('chats-badge'); // We need to add this to the HTML!

        const totalBadgeCount = pendingCount + unreadChatCount;

        if (totalBadgeCount > 0 && navBadge) {
            navBadge.textContent = totalBadgeCount;
            navBadge.style.display = 'flex';
        } else if (navBadge) {
            navBadge.style.display = 'none';
        }

        if (pendingCount > 0) {
            reqBadge.textContent = pendingCount;
            reqBadge.style.display = 'inline-block';
        } else {
            reqBadge.style.display = 'none';
        }

        if (chatBadge) {
            if (unreadChatCount > 0) {
                chatBadge.textContent = unreadChatCount;
                chatBadge.style.display = 'inline-block';
            } else {
                chatBadge.style.display = 'none';
            }
        }

        // --- Trigger Toasts for New Items ---
        if (!isInitialLoad) {
            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data();
                // Bug #2 fix: null guard
                if (!data.user1 || !data.user2) return;

                const isUser1 = data.user1.id === currentMember.id;
                const otherUser = isUser1 ? data.user2 : data.user1;

                if (change.type === "added" || change.type === "modified") {
                    if (data.status === 'pending' && !isUser1) {
                        // It's a new or modified request TO me
                        if (change.type === "added") {
                            window.showToast(`New chat request from ${otherUser.name}!`);
                        }
                    } else if (data.status === 'accepted') {
                        if (change.type === "modified" && data.lastMessageSenderId && data.lastMessageSenderId !== currentMember.id) {
                            const msgTime = data.updatedAt ? data.updatedAt.toMillis() : 0;
                            window.lastMessageToasts = window.lastMessageToasts || {};
                            // Bug #3 fix: use change.doc.id (Firestore doc ID), not data.id (undefined)
                            const docId = change.doc.id;
                            const lastToastTime = window.lastMessageToasts[docId] || 0;

                            // Only toast if this is a genuinely new message we haven't toasted for
                            if (msgTime > lastToastTime) {
                                window.lastMessageToasts[docId] = msgTime;

                                // Bug #4 fix: correct element IDs (active-chat-view, active-chat-name)
                                const chatView = document.getElementById('active-chat-view');
                                const isChatOpen = chatView && chatView.style.display === 'flex';
                                const openChatTitle = document.getElementById('active-chat-name');

                                // Play sound for incoming message
                                if (window.notificationAudio) {
                                    window.notificationAudio.currentTime = 0;
                                    window.notificationAudio.play().catch(e => { });
                                }

                                // If the chat is NOT open with this specific person, notify them
                                if (!isChatOpen || (openChatTitle && openChatTitle.textContent !== otherUser.name)) {
                                    window.showToast(`New message from ${otherUser.name}`);
                                }
                            }
                        }
                    }
                }
            });
        }

        isInitialLoad = false;
    });
}

// Global functions for inline onclick handlers
window.handleRequest = async (docId, newStatus) => {
    try {
        const { updateDoc, doc, serverTimestamp } = window.firebaseHelpers;
        const db = window.firebaseDb;
        await updateDoc(doc(db, "conversations", docId), {
            status: newStatus,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Firebase permission error during handleRequest:", error);
        alert("Action failed: Missing or insufficient permissions. Please check your Firebase Security Rules.");
    }
};

// ==========================================
// Advanced Chat Features (Edit/Delete)
// ==========================================

window.editingMessageId = null;

window.startEditMessage = (msgId, rawText) => {
    window.editingMessageId = msgId;
    const input = document.getElementById('chat-input');
    input.value = rawText;
    input.focus();
    document.getElementById('chat-edit-banner').style.display = 'flex';
};

window.cancelEditMessage = () => {
    window.editingMessageId = null;
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-edit-banner').style.display = 'none';
};

window.deleteConversationById = async (chatId) => {
    if (!chatId || !window.firebaseCurrentUser) return;
    if (!confirm("Are you sure you want to delete this chat? This will clear the chat history for you.")) return;

    const { doc, updateDoc } = window.firebaseHelpers;
    const db = window.firebaseDb;

    try {
        await updateDoc(doc(db, "conversations", chatId), {
            [`deletedAt.${window.firebaseCurrentUser.uid}`]: Date.now()
        });
        if (currentChatId === chatId) {
            closeActiveChat();
        }
        if (window.showToast) window.showToast("Conversation deleted.");
    } catch (e) {
        console.error("Error deleting conversation:", e);
        alert("Failed to delete conversation.");
    }
};

window.deleteConversation = async () => {
    if (currentChatId) {
        await window.deleteConversationById(currentChatId);
    }
};


window.openChat = async (docId, otherUserJson) => {
    const otherUser = JSON.parse(decodeURIComponent(otherUserJson));
    currentChatId = docId;
    currentChatOtherUser = otherUser;

    document.getElementById('active-chat-name').textContent = otherUser.name;
    document.getElementById('active-chat-view').style.display = 'flex';
    document.getElementById('chat-input').focus();

    // Clear unread status and check block status
    const { updateDoc, doc, arrayRemove, getDoc } = window.firebaseHelpers;
    if (updateDoc && doc && arrayRemove) {
        updateDoc(doc(window.firebaseDb, "conversations", docId), {
            unreadBy: arrayRemove(currentMember.id)
        }).catch(e => console.error(e));

        // Fetch conversation to check block status
        getDoc(doc(window.firebaseDb, "conversations", docId)).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const blockedBy = data.blockedBy || [];
                const amIBlocked = blockedBy.includes(otherUser.id);
                const didIBlock = blockedBy.includes(currentMember.id);

                const blockBtn = document.getElementById('block-user-btn');
                const unblockBtn = document.getElementById('unblock-user-btn');
                const chatInput = document.getElementById('chat-input');
                const sendBtn = document.getElementById('send-msg-btn');

                if (didIBlock) {
                    if (blockBtn) blockBtn.style.display = 'none';
                    if (unblockBtn) unblockBtn.style.display = 'flex';
                    if (chatInput) {
                        chatInput.disabled = true;
                        chatInput.placeholder = "You blocked this user.";
                    }
                    if (sendBtn) sendBtn.disabled = true;
                } else if (amIBlocked) {
                    if (blockBtn) blockBtn.style.display = 'flex';
                    if (unblockBtn) unblockBtn.style.display = 'none';
                    if (chatInput) {
                        chatInput.disabled = true;
                        chatInput.placeholder = "You cannot reply to this conversation.";
                    }
                    if (sendBtn) sendBtn.disabled = true;
                } else {
                    if (blockBtn) blockBtn.style.display = 'flex';
                    if (unblockBtn) unblockBtn.style.display = 'none';
                    if (chatInput) {
                        chatInput.disabled = false;
                        chatInput.placeholder = "Type a message...";
                    }
                    if (sendBtn) sendBtn.disabled = false;
                }
            }
        }).catch(e => console.error("Error fetching block status:", e));
    }

    // Get deletedAt timestamp for this chat for the current user
    let chatDeletedAt = 0;
    try {
        const { doc, getDoc } = window.firebaseHelpers;
        const chatDocSnap = await getDoc(doc(window.firebaseDb, "conversations", docId));
        if (chatDocSnap.exists()) {
            const cData = chatDocSnap.data();
            if (cData.deletedAt && cData.deletedAt[currentMember.id]) {
                chatDeletedAt = cData.deletedAt[currentMember.id];
            }
        }
    } catch (e) {
        console.error("Error fetching chat deletedAt:", e);
    }

    // Listen for messages
    const { collection, query, orderBy, onSnapshot } = window.firebaseHelpers;
    const db = window.firebaseDb;

    if (unsubscribeMessages) unsubscribeMessages();

    const q = query(collection(db, "conversations", docId, "messages"), orderBy("createdAt", "asc"));

    let isInitialLoad = true;

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        const msgContainer = document.getElementById('chat-messages');
        let html = `
            <div style="text-align: center; margin: 15px; padding: 12px 15px; background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; font-size: 0.85rem; color: var(--text-muted);">
                <div style="font-weight: 600; margin-bottom: 5px; color: #b78a00;"><i class="fa-solid fa-shield-halved"></i> YatrAmore Safety Notice</div>
                For your protection, never share sensitive personal information, passwords, or financial details. YatrAmore is not responsible for your interactions or real-life meetings. If this user makes you uncomfortable, please use the top right menu to block <i class="fa-solid fa-ban"></i> or report <i class="fa-solid fa-flag"></i> them.
            </div>
        `;

        let hasNewIncoming = false;
        if (!isInitialLoad) {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    if (change.doc.data().senderId !== currentMember.id) {
                        hasNewIncoming = true;
                    }
                }
            });
        }
        isInitialLoad = false;

        if (hasNewIncoming && window.playChatSound) {
            window.playChatSound('receive');
        }

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const msgId = doc.id;
            
            // Hide message if it was sent before the user cleared this conversation, or if the user deleted this specific message "for me"
            if (data.createdAt && data.createdAt.toMillis() <= chatDeletedAt) {
                return; 
            }
            if (data.hiddenFor && data.hiddenFor.includes(currentMember.id)) {
                return;
            }

            const isMe = data.senderId === currentMember.id;
            const isStarred = data.starredBy && data.starredBy.includes(currentMember.id);
            let timeStr = '';
            let isWithin5Mins = false;
            
            if (data.createdAt) {
                const date = data.createdAt.toDate();
                timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const now = Date.now();
                isWithin5Mins = (now - date.getTime()) < 5 * 60 * 1000;
            } else {
                timeStr = "Sending...";
                isWithin5Mins = true; // Pending write, so it was just sent
            }

            const messageContent = data.isDeleted 
                ? '<i class="fa-solid fa-ban" style="opacity:0.6;"></i> <span style="font-style:italic; opacity:0.6;">This message was deleted.</span>' 
                : window.escapeHtml(data.text || '');

            const encodedText = encodeURIComponent(data.text || '').replace(/'/g, "%27");
            const starredByJson = encodeURIComponent(JSON.stringify(data.starredBy || []));

            html += `
                <div class="chat-message ${isMe ? 'sent' : 'received'}" 
                     data-msg-id="${msgId}" 
                     data-raw-text="${encodedText}" 
                     data-is-me="${isMe}" 
                     data-is-starred="${!!isStarred}"
                     data-is-within-5mins="${isWithin5Mins}">
                    <div class="message-content">
                        <div class="message-text">${messageContent}</div>
                        <div class="message-meta" style="display: flex; justify-content: flex-end; align-items: center; margin-top: 4px; font-size: 0.7rem; opacity: 0.7; gap: 6px;">
                            <i class="fa-solid fa-star msg-star-indicator" style="display: ${isStarred ? 'inline' : 'none'};"></i>
                            <span class="message-time">${timeStr}</span>
                            ${data.isEdited && !data.isDeleted ? '<span class="message-edited" style="margin-left: 4px;">(edited)</span>' : ''}
                        </div>
                    </div>
                    ${(() => {
                        if (data.reactions && Object.keys(data.reactions).length > 0) {
                            const uniqueEmojis = [...new Set(Object.values(data.reactions))];
                            const count = Object.keys(data.reactions).length;
                            return `<div class="message-reactions">${uniqueEmojis.map(e => window.escapeHtml(e)).join('')}${count > 1 ? `<span style="font-size: 0.65rem; margin-left: 3px; font-weight: bold;">${count}</span>` : ''}</div>`;
                        }
                        return '';
                    })()}
                </div>
            `;
        });

        let previousScrollTop = 0;
        let previousScrollHeight = 0;
        let wasAtBottom = true;
        
        if (msgContainer) {
            previousScrollTop = msgContainer.scrollTop;
            previousScrollHeight = msgContainer.scrollHeight;
            wasAtBottom = (previousScrollHeight - previousScrollTop - msgContainer.clientHeight) < 100;
        }

        msgContainer.innerHTML = html;
        
        if (msgContainer) {
            if (wasAtBottom) {
                msgContainer.scrollTop = msgContainer.scrollHeight; 
            } else {
                msgContainer.scrollTop = previousScrollTop; 
            }
        }
    });
};

// Global function called by profile card buttons
window.sendChatRequest = async (targetUserId, targetUserName, targetUserPhoto) => {
    if (!window.firebaseCurrentUser) {
        alert("Please log in first!");
        return false;
    }
    const currentMember = { id: window.firebaseCurrentUser.uid, email: window.firebaseCurrentUser.email };

    const { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } = window.firebaseHelpers;
    const db = window.firebaseDb;

    // Find my profile from Firebase
    let myName = 'User';
    let myPhoto = `https://ui-avatars.com/api/?name=User&background=random`;
    let myFullProfile = null;
    let targetFullProfile = null;

    try {
        const myProfileDoc = await getDoc(doc(db, "profiles", currentMember.id));
        if (myProfileDoc.exists()) {
            const f = myProfileDoc.data();
            myName = f['First Name'] || myName;
            myPhoto = f['Profile Picture'] || myPhoto;
            myFullProfile = {
                age: f['Age'] || 'N/A',
                gender: f['Gender'] === 'Prefer not to say' ? 'N/A' : (f['Gender'] || ''),
                location: f['Location'] || 'N/A',
                bio: f['Bio'] || '',
                religion: f['Religion'] === 'Prefer not to say' ? 'N/A' : (f['Religion'] || '')
            };
        }

        const targetProfileDoc = await getDoc(doc(db, "profiles", targetUserId));
        if (targetProfileDoc.exists()) {
            const f = targetProfileDoc.data();
            targetFullProfile = {
                age: f['Age'] || 'N/A',
                gender: f['Gender'] === 'Prefer not to say' ? 'N/A' : (f['Gender'] || ''),
                location: f['Location'] || 'N/A',
                bio: f['Bio'] || '',
                religion: f['Religion'] === 'Prefer not to say' ? 'N/A' : (f['Religion'] || '')
            };
        }
    } catch (e) {
        console.error("Error fetching profiles for chat:", e);
    }
    // Validation: Check limits, cooldowns, and duplicates
    try {
        // Use a single query on 'participants' so Firestore Security Rules allow the read
        const checkQ = query(collection(db, "conversations"), where("participants", "array-contains", currentMember.id));
        const checkSnap = await getDocs(checkQ);

        let requestsToday = 0;
        const now = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        for (const docSnap of checkSnap.docs) {
            const data = docSnap.data();

            if (data.status !== 'revoked' && data.status !== 'declined') {
                if (data.participants.includes(targetUserId)) {
                    alert('You already have an active or pending chat with this person.');
                    return false;
                }

                if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                    const createdDate = data.createdAt.toDate();
                    if (now - createdDate < oneDayMs) {
                        requestsToday++;
                    }
                }
            }

            // Check 7-day cooldown for revoked or declined requests to this specific user
            if ((data.status === 'revoked' || data.status === 'declined') && data.participants.includes(targetUserId)) {
                if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
                    const updatedDate = data.updatedAt.toDate();
                    if (now - updatedDate < sevenDaysMs) {
                        const daysLeft = Math.ceil((sevenDaysMs - (now - updatedDate)) / (1000 * 60 * 60 * 24));
                        alert(`You cannot send a request to this user for another ${daysLeft} days.`);
                        return false;
                    }
                }
            }
        }

        if (requestsToday >= 2) {
            alert("You have reached your daily limit of 2 chat requests. Please try again tomorrow.");
            return false;
        }
    } catch (e) {
        console.error("Error checking limits:", e);
        alert("Error connecting to database. Please check your internet connection.");
        return false; // Fail-safe: block the request if limit check fails
    }

    try {
        await addDoc(collection(db, "conversations"), {
            participants: [currentMember.id, targetUserId],
            user1: { id: currentMember.id, name: myName, photo: myPhoto, profile: myFullProfile },
            user2: { id: targetUserId, name: targetUserName, photo: targetUserPhoto, profile: targetFullProfile },
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (e) {
        console.error("Error sending request:", e);
        alert("Failed to send request due to network error or missing permissions.");
        return false;
    }
};

// Init on load
document.addEventListener('DOMContentLoaded', initChatSystem);

window.revokeChatRequest = async (targetUserId) => {
    if (!window.firebaseCurrentUser) return;
    const currentMember = { id: window.firebaseCurrentUser.uid };
    const { collection, query, where, getDocs, updateDoc, serverTimestamp } = window.firebaseHelpers;
    const db = window.firebaseDb;

    // Find the pending request between currentMember and targetUserId
    const q = query(collection(db, "conversations"),
        where("participants", "array-contains", currentMember.id));

    const snapshot = await getDocs(q);
    // Bug #6 fix: use for...of so awaits are respected
    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        // If it's still pending and involves the target user, revoke it instead of deleting
        if (data.status === 'pending' && data.participants.includes(targetUserId)) {
            await updateDoc(docSnap.ref, {
                status: 'revoked',
                updatedAt: serverTimestamp()
            });
        }
    }
};

window.openChatFromGrid = (targetUserId) => {
    if (!window.acceptedChatUsers || !window.acceptedChatUsers[targetUserId]) return;
    const otherUser = window.acceptedChatUsers[targetUserId];
    const docId = window.acceptedChatDocIds[targetUserId];

    // Open panel
    const panel = document.getElementById('chat-inbox-panel');
    const overlay = document.getElementById('chat-overlay');

    // Create overlay if missing in this context
    let actualOverlay = overlay;
    if (!actualOverlay) {
        actualOverlay = document.createElement('div');
        actualOverlay.id = 'chat-overlay';
        actualOverlay.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:transparent; z-index:1998; opacity:0; transition:opacity 0.3s;';
        document.body.appendChild(actualOverlay);
    }

    if (panel) {
        panel.style.display = 'flex';
        setTimeout(() => {
            panel.classList.add('open');
            if (window.innerWidth <= 768) {
                const fab = document.getElementById('mobile-filter-fab');
                if (fab) fab.classList.add('hide-fab');
                const ac = document.querySelector('.accessibility-container');
                if (ac) ac.classList.add('hide-fab');
            }
        }, 10);
    }

    // Switch to Chats tab
    const tabChats = document.getElementById('tab-chats');
    if (tabChats) tabChats.click();

    // Open specific chat
    window.openChat(docId, encodeURIComponent(JSON.stringify(otherUser)));
};

// --- Toast Notification System ---
window.showToast = function (message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        // Positioned under the navbar, perfectly centered
        container.style.cssText = 'position: fixed; top: 90px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 10px; z-index: 9999; align-items: center;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    // Drop down from the top (Premium Design with Spring Animation and Adaptive Text)
    toast.style.cssText = 'background: linear-gradient(135deg, var(--brand-brown), #5D4037); color: #ffffff; padding: clamp(12px, 2.5vw, 16px) clamp(16px, 4vw, 24px); font-size: clamp(0.75rem, 3.5vw, 0.95rem); border-radius: 16px; font-weight: 500; letter-spacing: 0.3px; box-shadow: 0 15px 35px rgba(0,0,0,0.25), 0 5px 15px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.15); transform: translateY(-150%) scale(0.95); opacity: 0; transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); display: flex; align-items: center; gap: 14px; cursor: pointer; width: max-content; max-width: 96vw; border: 1px solid rgba(255,255,255,0.08); font-family: system-ui, -apple-system, sans-serif;';
    toast.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.15); width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;"><i class="fas fa-bell" style="font-size: 0.9rem; color: #fff;"></i></div> <span style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; word-break: break-word; line-height: 1.4;">${window.escapeHtml(message)}</span>`;


    toast.onclick = () => {
        // Bug #10 fix: correct selector for the inbox button
        const inboxBtn = document.getElementById('nav-inbox-btn');
        if (inboxBtn) inboxBtn.click();

        toast.style.transform = 'translateY(-150%) scale(0.9)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    };

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0) scale(1)';
        toast.style.opacity = '1';
    });

    // Auto remove
    setTimeout(() => {
        toast.style.transform = 'translateY(-150%) scale(0.9)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};


// ==========================================
// Account Deletion Logic (User Side)
// ==========================================
window.requestAccountDeletion = async () => {
    if (!confirm("Are you sure you want to permanently delete your account? This action cannot be undone. \n\nClick OK to hide your profile and send a deletion request to the Admin.")) return;

    try {
        if (!window.firebaseHelpers || !window.firebaseDb || !window.firebaseAuth) throw new Error("Firebase not initialized");
        const { doc, updateDoc, serverTimestamp } = window.firebaseHelpers;
        const db = window.firebaseDb;
        const user = window.firebaseAuth.currentUser;
        if (!user) throw new Error("Not logged in");

        await updateDoc(doc(db, "profiles", user.uid), {
            DeletionRequested: true,
            Approved: false,
            updatedAt: serverTimestamp()
        });

        // Try updating the users metadata as well if permitted
        try {
            await updateDoc(doc(db, "users", user.uid), {
                DeletionRequested: true
            });
        } catch (e) {
            console.warn("Could not update users doc, proceeding anyway.");
        }

        alert("Your deletion request has been sent to the Admin. Your profile is now hidden from the directory.");
        window.location.reload();
    } catch (err) {
        console.error("Deletion request failed:", err);
        alert("Could not process request. Please check your connection or contact support.");
    }
};


// ==========================================
// matchmaking.js
// ==========================================


// Profiles are fetched from Firebase Firestore

let allProfiles = [];
let currentUserMetaData = {};

function initMatchmaking() {
    if (!document.getElementById('profiles-grid')) return;

    // Setup Resend Verification button
    const btnResend = document.getElementById('btn-resend-verification');
    if (btnResend) {
        btnResend.addEventListener('click', async () => {
            const user = window.firebaseAuth.currentUser;
            if (user) {
                try {
                    const { sendEmailVerification } = window.firebaseAuthHelpers;
                    btnResend.textContent = 'Sending...';
                    await sendEmailVerification(user);
                    btnResend.textContent = 'Email Sent!';
                    setTimeout(() => { btnResend.textContent = 'Resend Verification Email'; }, 3000);
                } catch (e) {
                    alert('Error sending email: ' + e.message);
                    btnResend.textContent = 'Resend Verification Email';
                }
            }
        });
    }

    // Old Profile Setup Form removed, using native edit-modal instead

    window.addEventListener('auth-state-changed', async (e) => {
        const user = e.detail.user;

        // References to all 4 states
        const elVerify = document.getElementById('gate-verify-email');
        const elSetup = document.getElementById('gate-setup-profile');
        const elPending = document.getElementById('gate-pending-approval');
        const elGrid = document.getElementById('gate-approved-grid');

        // Hide all initially
        if (elVerify) elVerify.style.display = 'none';
        if (elSetup) elSetup.style.display = 'none';
        if (elPending) elPending.style.display = 'none';
        if (elGrid) elGrid.style.display = 'none';

        if (!user) return; // User logged out, handled by updateUIForUser

        if (!user.emailVerified) {
            if (elVerify) elVerify.style.display = 'block';

            // Auto-check for verification every 3 seconds so they don't have to refresh manually
            if (!window.verificationCheckInterval) {
                window.verificationCheckInterval = setInterval(async () => {
                    const currentUser = window.firebaseAuth.currentUser;
                    if (currentUser) {
                        await currentUser.reload();
                        if (currentUser.emailVerified) {
                            clearInterval(window.verificationCheckInterval);
                            window.location.reload(); // Instantly advance them
                        }
                    }
                }, 3000);
            }

            return;
        } else {
            if (window.verificationCheckInterval) {
                clearInterval(window.verificationCheckInterval);
            }
        }

        // Fetch profile data
        let profileData = null;
        try {
            const { doc, getDoc } = window.firebaseHelpers;
            const db = window.firebaseDb;
            const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
            if (profileDoc.exists()) {
                profileData = profileDoc.data();
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }

        let photoUrl = '';
        if (profileData && profileData['Profile Picture']) {
            if (Array.isArray(profileData['Profile Picture']) && profileData['Profile Picture'].length > 0) {
                photoUrl = profileData['Profile Picture'][0].url;
            } else if (typeof profileData['Profile Picture'] === 'string') {
                photoUrl = profileData['Profile Picture'];
            }
        }

        // Attach event listeners regardless of gate state so the modal forms actually work
        setupProfileForm();

        const isComplete = profileData && Boolean(
            profileData['First Name'] &&
            profileData['Age'] &&
            profileData['Location'] &&
            profileData['Gender'] &&
            profileData['Religion'] &&
            profileData['Bio'] &&
            photoUrl
        );

        if (!isComplete) {
            const editModal = document.getElementById('edit-modal');
            if (editModal) {
                editModal.classList.add('active');

                // Hide the close button to force them to complete it
                const closeBtn = document.querySelector('.edit-modal-close');
                if (closeBtn) closeBtn.style.display = 'none';
                
                // Hide the delete account link
                const deleteLink = document.getElementById('delete-account-link');
                if (deleteLink) deleteLink.style.display = 'none';

                // Update the text to reflect setup mode
                const title = editModal.querySelector('h2');
                const desc = editModal.querySelector('p');
                if (title) title.textContent = "Complete Your Profile";

                if (desc) desc.textContent = "You must submit your details before you can join the matchmaking grid.";
            }
            return;
        }

        if (!profileData['Approved']) {
            if (elPending) elPending.style.display = 'block';
            return;
        }

        // ALL GATES PASSED!
        // Check if user is blocked
        if (profileData['Blocked'] === true) {
            document.body.innerHTML = `
                <div style="display: flex; height: 100vh; flex-direction: column; align-items: center; justify-content: center; background: #fafafa; font-family: system-ui, sans-serif; color: #333;">
                    <i class="fa-solid fa-ban" style="font-size: 4rem; color: #f44336; margin-bottom: 1rem;"></i>
                    <h1 style="margin: 0 0 10px 0; font-size: 1.5rem;">Access Denied</h1>
                    <p style="margin: 0; color: #666;">Your account has been blocked by the YatrAmore Matchmaking Team.</p>
                </div>
            `;
            return;
        }

        if (elGrid) elGrid.style.display = 'flex'; // It's a flex container

        // Fetch metadata from Firestore
        try {
            if (window.firebaseHelpers && window.firebaseDb) {
                const { doc, getDoc } = window.firebaseHelpers;
                const db = window.firebaseDb;
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    currentUserMetaData = userDoc.data().metaData || {};
                }
            }
        } catch (error) {
            console.error("Error fetching user metadata:", error);
        }

        window.startProfilesListener();
        setupEventListeners();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMatchmaking();
    
    // Keep filter FAB separate from fab-group so it can be fixed to bottom-right
});

function setupProfileForm() {
    const form = document.getElementById('native-profile-form');
    if (!form || form.dataset.setupDone) return;
    form.dataset.setupDone = "true";

    const bioInput = document.getElementById('profile-bio');
    const bioCounter = document.getElementById('bio-counter');

    if (bioInput && bioCounter) {
        const updateBioCounter = () => {
            const currentLength = bioInput.value.length;
            bioCounter.textContent = `${currentLength}/800`;
            if (currentLength >= 750) {
                bioCounter.style.color = '#e74c3c';
                bioCounter.style.fontWeight = 'bold';
            } else {
                bioCounter.style.color = 'var(--text-muted)';
                bioCounter.style.fontWeight = '400';
            }
        };
        bioInput.addEventListener('input', updateBioCounter);
    }

    const photoInput = document.getElementById('profile-photo');
    const photoPreview = document.getElementById('profile-photo-preview');

    if (photoInput && photoPreview) {
        photoInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                    alert("Please upload a valid image file (JPEG, PNG, or WEBP).");
                    this.value = ''; // clear input
                    photoPreview.src = 'https://ui-avatars.com/api/?name=U&background=random';
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    alert("File size exceeds 5MB limit. Please choose a smaller image.");
                    this.value = ''; // clear input
                    photoPreview.src = 'https://ui-avatars.com/api/?name=U&background=random';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    // Initialize Cropper Modal
                    const cropperModal = document.getElementById('cropper-modal');
                    const cropperImage = document.getElementById('cropper-image');
                    const cancelBtn = document.getElementById('cropper-cancel-btn');
                    const saveBtn = document.getElementById('cropper-save-btn');
                    
                    cropperImage.src = e.target.result;
                    cropperModal.style.display = 'flex';
                    
                    if (window.cropperInstance) {
                        window.cropperInstance.destroy();
                    }
                    
                    window.cropperInstance = new Cropper(cropperImage, {
                        aspectRatio: 1,
                        viewMode: 1,
                        background: false,
                        zoomable: true
                    });
                    
                    cancelBtn.onclick = () => {
                        cropperModal.style.display = 'none';
                        if (window.cropperInstance) window.cropperInstance.destroy();
                        photoInput.value = ''; // clear
                    };
                    
                    saveBtn.onclick = () => {
                        if (window.cropperInstance) {
                            // Extract compressed WebP blob (<150kb)
                            window.cropperInstance.getCroppedCanvas({
                                width: 500,
                                height: 500
                            }).toBlob((blob) => {
                                window.croppedImageBlob = blob;
                                photoPreview.src = URL.createObjectURL(blob);
                                cropperModal.style.display = 'none';
                                window.cropperInstance.destroy();
                            }, 'image/webp', 0.8);
                        }
                    };
                }
                reader.readAsDataURL(file);
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('profile-submit-btn');
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Step 1/4: Preparing...';

        try {
            if (!window.firebaseCurrentUser) throw new Error("Not authenticated");
            const uid = window.firebaseCurrentUser.uid;

            let photoUrl = '';
            if ((photoInput && photoInput.files.length > 0) || window.croppedImageBlob) {
                const file = window.croppedImageBlob || photoInput.files[0];

                const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                    throw new Error("Invalid file type. Please upload a JPEG, PNG, or WEBP image.");
                }
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error("File size exceeds 5MB limit. Please choose a smaller image.");
                }

                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Step 2/4: Uploading Image...';

                // Upload to Cloudinary with a 15-second timeout
                const formData = new FormData();
                if (window.croppedImageBlob) {
                    formData.append('file', file, 'profile.webp');
                } else {
                    formData.append('file', file);
                }
                formData.append('upload_preset', 'yatramore_profiles');

                const uploadPromise = fetch('https://api.cloudinary.com/v1_1/kitnycjp/image/upload', {
                    method: 'POST',
                    body: formData
                }).then(async (response) => {
                    if (!response.ok) {
                        const errText = await response.text();
                        console.error("Cloudinary error:", errText);
                        throw new Error("Cloudinary upload failed. Make sure your upload preset is named 'yatramore_profiles' and is set to Unsigned.");
                    }
                    return response.json();
                });

                const uploadTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Image upload timed out after 15 seconds.")), 15000));
                const cloudinaryData = await Promise.race([uploadPromise, uploadTimeout]);

                photoUrl = cloudinaryData.secure_url;
            }

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Step 3/4: Checking Database...';

            const profileData = {
                'First Name': document.getElementById('profile-firstName').value.trim(),
                'Gender': document.getElementById('profile-gender').value,
                'Age': parseInt(document.getElementById('profile-age').value, 10),
                'Religion': document.getElementById('profile-religion').value,
                'Location': document.getElementById('profile-location').value.trim(),
                'Bio': document.getElementById('profile-bio').value.trim(),
                'Profile Picture': photoUrl,
                'DeletionRequested': false
            };
            const { setDoc, doc, getDoc } = window.firebaseHelpers;
            const db = window.firebaseDb;

            const getDocPromise = getDoc(doc(db, 'profiles', uid));
            const getDocTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Database read timed out.")), 15000));
            const existingProfile = await Promise.race([getDocPromise, getDocTimeout]);
            let isExistingComplete = false;

            if (existingProfile.exists()) {
                const exData = existingProfile.data();
                let exPhoto = '';
                if (exData['Profile Picture']) {
                    if (Array.isArray(exData['Profile Picture']) && exData['Profile Picture'].length > 0) exPhoto = exData['Profile Picture'][0].url;
                    else if (typeof exData['Profile Picture'] === 'string') exPhoto = exData['Profile Picture'];
                }

                isExistingComplete = Boolean(
                    exData['First Name'] &&
                    exData['Age'] &&
                    exData['Location'] &&
                    exData['Gender'] &&
                    exData['Religion'] &&
                    exData['Bio'] &&
                    exPhoto
                );
            }

            if (existingProfile.exists() && isExistingComplete) {
                // Update Request Flow (User is already complete and approved/pending, and is requesting an update)
                if (!photoUrl) {
                    const existingData = existingProfile.data();
                    if (existingData['Profile Picture']) {
                        if (Array.isArray(existingData['Profile Picture']) && existingData['Profile Picture'].length > 0) {
                            photoUrl = existingData['Profile Picture'][0].url;
                        } else if (typeof existingData['Profile Picture'] === 'string') {
                            photoUrl = existingData['Profile Picture'];
                        }
                    }
                }

                profileData['Profile Picture'] = photoUrl;
                profileData['status'] = 'pending';
                profileData['requestedAt'] = window.firebaseHelpers.serverTimestamp();
                // Preserve the original createdAt and Approved status in the update request payload for admin reference if needed
                profileData['Approved'] = existingProfile.data().Approved || false;
                profileData['createdAt'] = existingProfile.data().createdAt;

                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Step 4/4: Saving Update...';

                // Use Promise.race to prevent setDoc from hanging indefinitely if offline
                const setDocPromise = setDoc(doc(db, 'profile_updates', uid), profileData);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Database write timed out. Check your internet connection.")), 15000));

                await Promise.race([setDocPromise, timeoutPromise]);

                if (window.showToast) {
                    window.showToast("Your update request has been submitted and is pending review by the YA-Matchmaking Team.");
                } else {
                    alert("Your update request has been submitted and is pending review by the YA-Matchmaking Team.");
                }

                // Cleanup session data
                window.croppedImageBlob = null;
                if (photoInput) photoInput.value = '';

                document.getElementById('edit-modal').classList.remove('active');
            } else {
                // New Profile Creation / Incomplete Profile Fixing Flow

                // If they didn't upload a photo and didn't have one before, reject
                if (!photoUrl && (!existingProfile.exists() || !existingProfile.data()['Profile Picture'])) {
                    throw new Error("Please upload a Profile Picture to complete your profile.");
                }

                // If they didn't upload a new photo, use their existing incomplete one (if it somehow existed)
                if (!photoUrl && existingProfile.exists()) {
                    const exData = existingProfile.data();
                    if (exData['Profile Picture']) {
                        if (Array.isArray(exData['Profile Picture']) && exData['Profile Picture'].length > 0) photoUrl = exData['Profile Picture'][0].url;
                        else if (typeof exData['Profile Picture'] === 'string') photoUrl = exData['Profile Picture'];
                    }
                }

                profileData['Profile Picture'] = photoUrl;
                profileData['Approved'] = false;
                profileData['createdAt'] = (existingProfile.exists() && existingProfile.data().createdAt) ? existingProfile.data().createdAt : window.firebaseHelpers.serverTimestamp();

                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Step 4/4: Saving Profile...';

                // Use Promise.race to prevent setDoc from hanging indefinitely if offline
                const setDocPromise = setDoc(doc(db, 'profiles', uid), profileData);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Database write timed out. Check your internet connection.")), 15000));

                await Promise.race([setDocPromise, timeoutPromise]);

                if (window.showToast) {
                    window.showToast("Profile submitted! It is now pending review by the YA-Matchmaking Team.");
                } else {
                    alert("Profile submitted! It is now pending review by the YA-Matchmaking Team.");
                }

                // Cleanup session data
                window.croppedImageBlob = null;
                if (photoInput) photoInput.value = '';

                // Hard reload ignoring cache
                window.location.href = window.location.href.split('?')[0] + '?t=' + new Date().getTime();
            }

        } catch (error) {
            console.error("Error submitting profile:", error);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
            try { alert("Error submitting profile: " + error.message); } catch (e) { }
        }
    });
}

window.openEditProfileModal = async function () {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;

    modal.classList.add('active');

    if (!window.firebaseCurrentUser) return;

    try {
        const { doc, getDoc } = window.firebaseHelpers;
        const db = window.firebaseDb;
        const uid = window.firebaseCurrentUser.uid;

        const profileDoc = await getDoc(doc(db, 'profiles', uid));
        if (profileDoc.exists()) {
            const data = profileDoc.data();

            if (data['First Name']) document.getElementById('profile-firstName').value = data['First Name'];
            if (data['Gender']) document.getElementById('profile-gender').value = data['Gender'];
            if (data['Age']) document.getElementById('profile-age').value = data['Age'];
            if (data['Religion']) document.getElementById('profile-religion').value = data['Religion'];
            if (data['Location']) document.getElementById('profile-location').value = data['Location'];
            if (data['Bio']) {
                const bioEl = document.getElementById('profile-bio');
                bioEl.value = data['Bio'];
                bioEl.dispatchEvent(new Event('input'));
            }

            let photoUrl = 'https://ui-avatars.com/api/?name=U&background=random';
            if (data['Profile Picture']) {
                if (Array.isArray(data['Profile Picture']) && data['Profile Picture'].length > 0) {
                    photoUrl = data['Profile Picture'][0].url;
                } else if (typeof data['Profile Picture'] === 'string') {
                    photoUrl = data['Profile Picture'];
                }
            }
            document.getElementById('profile-photo-preview').src = photoUrl;
        }
    } catch (e) {
        console.error("Error pre-filling profile data:", e);
    }
}

window.profilesUnsubscribe = null;

window.forceReRenderProfiles = function() {
    if (!window.firebaseProfiles) return;
    
    let currentUserId = null;
    if (window.firebaseCurrentUser) {
        currentUserId = window.firebaseCurrentUser.uid;
    }
    
    allProfiles = window.firebaseProfiles.filter(p => {
        return p['Firebase UID'] && p['Firebase UID'] !== currentUserId && p['Approved'];
    });

    renderProfiles(allProfiles);
}

window.startProfilesListener = function() {
    try {
        let currentUserId = null;
        if (window.firebaseCurrentUser) {
            currentUserId = window.firebaseCurrentUser.uid;
        }

        const { collection, onSnapshot, query, where, doc, getDoc } = window.firebaseHelpers;
        const db = window.firebaseDb;

        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where("Approved", "==", true));

        if (window.profilesUnsubscribe) {
            window.profilesUnsubscribe();
        }

        window.profilesUnsubscribe = onSnapshot(q, async (snapshot) => {
            let rawProfiles = [];
            let hasProfile = false;

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                data['Firebase UID'] = docSnap.id;
                rawProfiles.push(data);
            });

            if (currentUserId) {
                const myProfileDoc = await getDoc(doc(db, 'profiles', currentUserId));
                if (myProfileDoc.exists()) {
                    hasProfile = true;
                    if (!myProfileDoc.data().Approved) {
                        const myData = myProfileDoc.data();
                        myData['Firebase UID'] = currentUserId;
                        rawProfiles.push(myData);
                    }
                }
            }

            rawProfiles = rawProfiles.filter((p, index, self) =>
                index === self.findIndex((t) => (
                    t['Firebase UID'] === p['Firebase UID']
                ))
            );

            window.firebaseProfiles = rawProfiles;
            window.rawAirtableProfiles = rawProfiles;

            allProfiles = rawProfiles.filter(p => {
                return p['Firebase UID'] && p['Firebase UID'] !== currentUserId && p['Approved'];
            });

            renderProfiles(allProfiles);

            if (currentUserId) {
                if (!hasProfile) {
                    const modalTitle = document.querySelector('#edit-modal h2');
                    if (modalTitle) modalTitle.textContent = "Complete Your Profile";
                    const deleteLink = document.getElementById('delete-account-link');
                    if (deleteLink) deleteLink.style.display = 'none';
                    const editModal = document.getElementById('edit-modal');
                    if (editModal) {
                        editModal.classList.add('active');
                        if (window.showToast) {
                            window.showToast("Welcome! Please complete your profile to continue.");
                        }
                    }
                } else {
                    const modalTitle = document.querySelector('#edit-modal h2');
                    if (modalTitle) modalTitle.textContent = "Edit Your Profile";
                    const deleteLink = document.getElementById('delete-account-link');
                    if (deleteLink) deleteLink.style.display = 'block';
                }
            }
        }, (error) => {
            console.error('Error in profiles listener:', error);
            const grid = document.getElementById('profiles-grid');
            if (grid) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 2rem; background: rgba(244, 67, 54, 0.1); border: 1px solid var(--status-error); color: var(--status-error); border-radius: 12px; text-align: center;">
                        <p style="font-weight: 700; margin-bottom: 0.5rem;">Failed to load profiles.</p>
                        <p style="font-size: 0.875rem;">${error.message}</p>
                    </div>
                `;
            }
        });
    } catch (error) {
        console.error('Error setting up profile listener:', error);
    }
}

function renderProfiles(profiles) {
    const grid = document.getElementById('profiles-grid');
    if (!grid) return; // Exit if Memberstack hides the DOM

    const resultsCount = document.getElementById('results-count');
    grid.innerHTML = ''; // Clear loading spinner

    if (resultsCount) {
        resultsCount.textContent = `${profiles.length} Profiles`;
    }

    if (profiles.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; padding: 4rem 0; color: var(--text-muted);">
                <i class="fas fa-users-slash" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="font-size: 1.1rem; font-weight: 600;">No profiles found matching your criteria.</p>
            </div>
        `;
        return;
    }

    profiles.forEach(profile => {
        // If data comes straight from Airtable, fields are usually nested in a `fields` object.
        const fields = profile.fields || profile;

        // Fallbacks with HTML Escaping to prevent XSS
        const name = window.escapeHtml(fields['First Name'] || 'Anonymous');
        const age = window.escapeHtml(String(fields['Age'] || 'N/A'));
        const genderRaw = fields['Gender'];
        const gender = window.escapeHtml(genderRaw === 'Prefer not to say' ? 'N/A' : (genderRaw || 'N/A'));
        const location = window.escapeHtml(fields['Location'] || 'Unknown location');
        const bio = window.escapeHtml(fields['Bio'] || 'No bio provided.');
        const religionRaw = fields['Religion'];
        const religion = window.escapeHtml(religionRaw === 'Prefer not to say' ? 'N/A' : (religionRaw || 'N/A'));

        // Handle images (Airtable returns an array of objects for attachments, our native form returns a string URL)
        let photoUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=random&size=150';
        if (fields['Profile Picture']) {
            if (Array.isArray(fields['Profile Picture']) && fields['Profile Picture'].length > 0) {
                photoUrl = fields['Profile Picture'][0].url;
            } else if (typeof fields['Profile Picture'] === 'string') {
                photoUrl = fields['Profile Picture'];
            }
        }

        // Sanitize photo URL to prevent src/onerror injections
        photoUrl = window.escapeHtml(photoUrl);

        const firebaseUid = window.escapeHtml(fields['Firebase UID']);

        // Cooldown check (14 days) - Checks both cloud metadata and local storage
        const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
        const localSent = localStorage.getItem('interest_' + firebaseUid);
        const cloudSent = currentUserMetaData['interest_' + firebaseUid];

        const lastSent = cloudSent || localSent;
        const now = Date.now();
        let isCooldown = false;

        if (lastSent && (now - parseInt(lastSent, 10)) < fourteenDaysMs) {
            isCooldown = true;
        }

        const isAccepted = window.acceptedChatUserIds && window.acceptedChatUserIds.has(firebaseUid);
        const isDeclined = window.declinedChatUserIds && window.declinedChatUserIds.has(firebaseUid);

        let btnHtml = '';
        if (isAccepted) {
            btnHtml = `<button onclick="window.openChatFromGrid('${firebaseUid}')" class="btn-interest btn-chat">
                <i class="fa-solid fa-comment" style="color: white;"></i> Open Chat
            </button>`;
        } else if (isDeclined) {
            btnHtml = `<button disabled class="btn-interest btn-pending">
                <i class="fa-solid fa-clock"></i> Request Pending...
            </button>`;
        } else if (isCooldown || (window.pendingChatUserIds && window.pendingChatUserIds.has(firebaseUid))) {
            btnHtml = `<button onclick="if(event) event.stopPropagation(); revokeInterest('${firebaseUid}', this)" class="btn-interest btn-revoke">
                <i class="fas fa-undo"></i> Revoke Request
            </button>`;
        } else {
            const safeName = (fields['First Name'] || 'User').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            let photoUrl = '';
            if (fields['Profile Picture']) {
                if (typeof fields['Profile Picture'] === 'string') {
                    photoUrl = fields['Profile Picture'];
                } else if (Array.isArray(fields['Profile Picture']) && fields['Profile Picture'].length > 0) {
                    photoUrl = fields['Profile Picture'][0].url;
                }
            }
            const safePhoto = encodeURIComponent(photoUrl).replace(/'/g, "%27");

            // Safely encode user generated variables for inline JS handler
            const safeJsName = encodeURIComponent(name).replace(/'/g, "%27");
            btnHtml = `<button onclick="expressInterest('${firebaseUid}', decodeURIComponent('${safeJsName}'), decodeURIComponent('${safePhoto}'), this)" class="btn-interest btn-send">
                <i class="fa-solid fa-paper-plane" style="color: #1a1a1a;"></i> Send Chat Request
            </button>`;
        }

        const card = document.createElement('div');
        card.className = 'profile-card glass-card';
        card.dataset.firebaseUid = firebaseUid;
        card.style.height = '100%';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';

        card.innerHTML = `
            <div class="profile-image-wrapper">
                <img src="${photoUrl}" alt="${name}" class="profile-image" loading="lazy">
            </div>
            <div class="profile-content" style="padding: 1.5rem; display: flex; flex-direction: column; flex-grow: 1; background: transparent;">
                <div class="profile-name" style="color: var(--text-main); font-size: 1.6rem; font-weight: 700; margin-bottom: 0.8rem;">${name}</div>
                <div style="display: flex; gap: 15px; margin-bottom: 1.2rem; flex-wrap: wrap; color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">
                    <div class="profile-location" style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-map-marker-alt" style="color: var(--brand-brown);"></i> ${location}
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-birthday-cake" style="color: var(--brand-brown);"></i> ${age} y/o
                    </div>
                    ${gender ? `<div style="display: flex; align-items: center; gap: 6px;"><i class="fas ${gender === 'Male' ? 'fa-mars' : gender === 'Female' ? 'fa-venus' : 'fa-user'}" style="color: var(--brand-brown);"></i> ${gender}</div>` : ''}
                    ${religion ? `<div style="display: flex; align-items: center; gap: 6px;"><i class="fas fa-praying-hands" style="color: var(--brand-brown);"></i> ${religion}</div>` : ''}
                </div>
                
                <p class="profile-bio" style="color: var(--text-main); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; flex-grow: 1; opacity: 0.9; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;">"${bio}"</p>
                <div style="margin-top: auto; position: relative; z-index: 10;">
                    ${btnHtml}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setupEventListeners() {
    const ageMinInput = document.getElementById('filter-age-min');
    const ageMaxInput = document.getElementById('filter-age-max');
    const ageDisplay = document.getElementById('age-display');
    const applyBtn = document.getElementById('apply-filters');

    // Safety check if elements are gated by Memberstack
    if (!ageMinInput || !ageMaxInput || !ageDisplay || !applyBtn) return;

    // Update age display dynamically
    function updateAgeDisplay() {
        let min = parseInt(ageMinInput.value, 10);
        let max = parseInt(ageMaxInput.value, 10);
        if (min > max) {
            let tmp = min; min = max; max = tmp;
        }
        ageDisplay.textContent = `${min} - ${max}`;
    }

    ageMinInput.addEventListener('input', updateAgeDisplay);
    ageMaxInput.addEventListener('input', updateAgeDisplay);

    // Apply filters logic
    applyBtn.addEventListener('click', () => {
        // Visual feedback on button
        const originalText = applyBtn.innerHTML;
        applyBtn.innerHTML = 'Filtering...';
        applyBtn.style.opacity = '0.75';

        setTimeout(() => {
            const gender = document.getElementById('filter-gender').value;
            let minAge = parseInt(ageMinInput.value, 10);
            let maxAge = parseInt(ageMaxInput.value, 10);
            const actualMin = Math.min(minAge, maxAge);
            const actualMax = Math.max(minAge, maxAge);
            const country = document.getElementById('filter-country').value.toLowerCase();
            const filterRel = document.getElementById('filter-religion').value;

            const filtered = allProfiles.filter(profile => {
                const f = profile.fields || profile;
                const matchesGender = gender === 'All' || f['Gender'] === gender;

                const profileAge = parseInt(f['Age'], 10);
                const matchesAge = !f['Age'] || (profileAge >= actualMin && profileAge <= actualMax);
                const matchesCountry = !country ||
                    (f['Location'] && f['Location'].toLowerCase().includes(country)) ||
                    (f['Country'] && f['Country'].toLowerCase().includes(country));
                const matchesReligion = filterRel === 'All' || f['Religion'] === filterRel;

                return matchesGender && matchesAge && matchesCountry && matchesReligion;
            });

            renderProfiles(filtered);

            // Reset button
            applyBtn.innerHTML = originalText;
            applyBtn.style.opacity = '1';
        }, 300); // Small delay for UX feel
    });
}

// Function to handle showing interest securely
window.expressInterest = async function expressInterest(targetUserId, targetName, targetPhoto, btnElement) {
    if (!targetUserId) {
        alert("This profile doesn't have a valid ID.");
        return;
    }

    // Immediately update button UI to show it's sent
    if (btnElement) {
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btnElement.style.opacity = '0.7';
        btnElement.disabled = true;
    }

    if (window.sendChatRequest) {
        const success = await window.sendChatRequest(targetUserId, targetName, targetPhoto);
        if (success) {
            // Save to local storage for cooldown UI
            localStorage.setItem('interest_' + targetUserId, Date.now());
            if (window.firebaseCurrentUser && window.firebaseHelpers) {
                const { doc, setDoc } = window.firebaseHelpers;
                const db = window.firebaseDb;
                currentUserMetaData['interest_' + targetUserId] = Date.now();
                setDoc(doc(db, 'users', window.firebaseCurrentUser.uid), { metaData: currentUserMetaData }, { merge: true }).catch(e => console.error(e));
            }

            if (btnElement) {
                btnElement.classList.add('btn-disabled');
                btnElement.innerHTML = '<i class="fas fa-check"></i> Request Sent';
                btnElement.style.opacity = '1';
                btnElement.style.background = 'rgba(0,0,0,0.03)';
                btnElement.style.color = 'var(--text-muted)';
                btnElement.style.border = '1px solid rgba(107, 66, 38, 0.1)';
            }
        } else {
            if (btnElement) {
                btnElement.innerHTML = '<i class="fa-solid fa-paper-plane" style="color: #1a1a1a;"></i> Send Chat Request';
                btnElement.style.opacity = '1';
                btnElement.disabled = false;
            }
            // Alert is now handled inside sendChatRequest, so we don't show a generic misleading one here.
        }
    } else {
        alert('Chat system is currently initializing. Please try again in a moment.');
        if (btnElement) {
            btnElement.innerHTML = '<i class="fa-solid fa-paper-plane" style="color: #1a1a1a;"></i> Send Chat Request';
            btnElement.style.opacity = '1';
            btnElement.disabled = false;
        }
    }
};

window.revokeInterest = async (targetUserId, btnElement) => {
    if (confirm("Are you sure you want to revoke this chat request?")) {
        const btnHtmlOriginal = btnElement.innerHTML;
        btnElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Revoking...`;
        btnElement.style.opacity = '0.7';

        try {
            // 1. Clear local and cloud cooldown
            localStorage.removeItem('interest_' + targetUserId);
            if (window.firebaseCurrentUser && window.firebaseHelpers) {
                const { doc, setDoc } = window.firebaseHelpers;
                const db = window.firebaseDb;
                delete currentUserMetaData['interest_' + targetUserId];
                setDoc(doc(db, 'users', window.firebaseCurrentUser.uid), { metaData: currentUserMetaData }, { merge: true }).catch(e => console.error(e));
            }

            // 2. Tell chat.js to delete the pending request from Firebase
            if (window.revokeChatRequest) {
                await window.revokeChatRequest(targetUserId);
            }

            // 3. Reset Button UI by re-rendering
            window.forceReRenderProfiles();
        } catch (error) {
            console.error("Firebase error revoking request:", error);
            alert("Revoke failed: Missing or insufficient permissions. Please check your Firebase Security Rules.");
            btnElement.innerHTML = btnHtmlOriginal;
            btnElement.style.opacity = '1';
        }
    }
}

window.updateProfileButtons = () => {
    document.querySelectorAll('.profile-card').forEach(card => {
        const firebaseUid = card.dataset.firebaseUid;
        if (!firebaseUid) return;

        // Find the button wrapper/container or just replace the button
        const btn = card.querySelector('.btn-interest');
        if (!btn) return;

        const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
        const localSent = localStorage.getItem('interest_' + firebaseUid);
        const cloudSent = currentUserMetaData ? currentUserMetaData['interest_' + firebaseUid] : null;

        const lastSent = cloudSent || localSent;
        const now = Date.now();
        let isCooldown = false;

        if (lastSent && (now - parseInt(lastSent, 10)) < fourteenDaysMs) {
            isCooldown = true;
        }

        const isAccepted = window.acceptedChatUserIds && window.acceptedChatUserIds.has(firebaseUid);
        const isPending = window.pendingChatUserIds && window.pendingChatUserIds.has(firebaseUid);
        const isDeclined = window.declinedChatUserIds && window.declinedChatUserIds.has(firebaseUid);

        let newBtnHtml = '';
        if (isAccepted) {
            newBtnHtml = `<button onclick="window.openChatFromGrid('${firebaseUid}')" class="btn-interest btn-chat">
                <i class="fa-solid fa-comment" style="color: white;"></i> Open Chat
            </button>`;
        } else if (isDeclined) {
            newBtnHtml = `<button disabled class="btn-interest btn-pending">
                <i class="fa-solid fa-clock"></i> Request Pending...
            </button>`;
        } else if (isCooldown || isPending) {
            newBtnHtml = `<button onclick="if(event) event.stopPropagation(); revokeInterest('${firebaseUid}', this)" class="btn-interest btn-revoke">
                <i class="fas fa-undo"></i> Revoke Request
            </button>`;
        } else {
            let name = 'User';
            let photo = '';
            if (window.rawAirtableProfiles) {
                const record = window.rawAirtableProfiles.find(p => (p.fields || p)['Firebase UID'] === firebaseUid);
                if (record) {
                    const f = record.fields || record;
                    name = (f['First Name'] || 'User').replace(/'/g, "\\'");
                    if (f['Profile Picture']) {
                        if (typeof f['Profile Picture'] === 'string') {
                            photo = f['Profile Picture'];
                        } else if (Array.isArray(f['Profile Picture']) && f['Profile Picture'].length > 0) {
                            photo = f['Profile Picture'][0].url;
                        }
                    }
                }
            }
            const safeJsName = encodeURIComponent(name).replace(/'/g, "%27");
            newBtnHtml = `<button onclick="expressInterest('${firebaseUid}', decodeURIComponent('${safeJsName}'), decodeURIComponent('${encodeURIComponent(photo).replace(/'/g, "%27")}'), this)" class="btn-interest btn-send">
                <i class="fa-solid fa-paper-plane" style="color: #1a1a1a;"></i> Send Chat Request
            </button>`;
        }

        btn.outerHTML = newBtnHtml;
    });
};

// --- ADMIN PANEL EASTER EGG ---
let adminTapCount = 0;
let adminTapTimer = null;

window.promptAdminAccess = () => {
    // The real security is enforced by your Firestore Security Rules.
    // This client-side check just prevents non-admins from seeing the UI.
    const adminUid = "BNtlmi6FmlWx6y86gzmwKFQ1qCk2";
    if (!window.firebaseCurrentUser || window.firebaseCurrentUser.uid !== adminUid) {
        alert("Access Denied.");
        return;
    }

    // Since Firebase Auth has already securely verified you are the admin,
    // we don't need a vulnerable client-side PIN prompt.
    openAdminPanel();
};

window.switchAdminTab = function (tab) {
    const tabUsers = document.getElementById('admin-tab-users');
    const tabUpdates = document.getElementById('admin-tab-updates');
    const tabReports = document.getElementById('admin-tab-reports');
    const listUsers = document.getElementById('admin-users-list');
    const listUpdates = document.getElementById('admin-updates-list');
    const listReports = document.getElementById('admin-reports-list');
    const tabDeletions = document.getElementById('admin-tab-deletions');
    const listDeletions = document.getElementById('admin-deletions-list');

    if (tabUsers) { tabUsers.style.borderBottomColor = 'transparent'; tabUsers.style.color = 'var(--text-muted)'; }
    if (tabUpdates) { tabUpdates.style.borderBottomColor = 'transparent'; tabUpdates.style.color = 'var(--text-muted)'; }
    if (tabReports) { tabReports.style.borderBottomColor = 'transparent'; tabReports.style.color = 'var(--text-muted)'; }
    if (tabDeletions) { tabDeletions.style.borderBottomColor = 'transparent'; tabDeletions.style.color = 'var(--text-muted)'; }
    if (listUsers) listUsers.style.display = 'none';
    if (listUpdates) listUpdates.style.display = 'none';
    if (listReports) listReports.style.display = 'none';
    if (listDeletions) listDeletions.style.display = 'none';

    if (tab === 'users') {
        if (tabUsers) { tabUsers.style.borderBottomColor = 'var(--brand-brown)'; tabUsers.style.color = 'var(--brand-brown)'; }
        if (listUsers) listUsers.style.display = 'flex';
        loadAdminUsers();
    } else if (tab === 'updates') {
        if (tabUpdates) { tabUpdates.style.borderBottomColor = 'var(--brand-brown)'; tabUpdates.style.color = 'var(--brand-brown)'; }
        if (listUpdates) listUpdates.style.display = 'flex';
        loadAdminUpdates();
    } else if (tab === 'deletions') {
        if (tabDeletions) { tabDeletions.style.borderBottomColor = '#f44336'; tabDeletions.style.color = '#f44336'; }
        if (listDeletions) listDeletions.style.display = 'flex';
        loadAdminDeletions();
    } else {
        if (tabReports) { tabReports.style.borderBottomColor = 'var(--brand-brown)'; tabReports.style.color = 'var(--brand-brown)'; }
        if (listReports) listReports.style.display = 'flex';
        loadAdminReports();
    }
}

async function openAdminPanel() {
    const modal = document.getElementById('admin-reports-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    window.switchAdminTab('users');
}

async function loadAdminUsers() {
    const listContainer = document.getElementById('admin-users-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted);">Loading users...</div>';

    try {
        const { collection, getDocs, orderBy, query } = window.firebaseHelpers;
        const db = window.firebaseDb;

        const profilesRef = collection(db, "profiles");
        const q = query(profilesRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        let html = `
            <div style="overflow: auto; width: 100%; max-width: 100%; box-sizing: border-box; height: 60vh; background: #ffffff; border: 1px solid #d3d3d3; position: relative;">
            <table style="width: max-content; min-width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <thead style="position: sticky; top: 0; z-index: 10;">
                    <tr style="color: #333333;">
                        <th style="background: #f5f5f5; padding: 6px 8px; border: 1px solid #d3d3d3; font-weight: normal; width: 50px; text-align: center;"><input type="checkbox" /></th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">First Name</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 80px;">Age</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">Location</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 100px;">Gender</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 200px;">Bio</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">Profile Picture</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 200px;">Firebase UID</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 100px;">Approved</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">Religion</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 80px; text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        let rowIndex = 1;
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const uid = docSnap.id;

            const name = window.escapeHtml(data['First Name'] || '');
            let photoUrl = '';
            if (data['Profile Picture']) {
                if (Array.isArray(data['Profile Picture']) && data['Profile Picture'].length > 0) {
                    photoUrl = data['Profile Picture'][0].url;
                } else if (typeof data['Profile Picture'] === 'string') {
                    photoUrl = data['Profile Picture'];
                }
            }
            photoUrl = window.escapeHtml(photoUrl);
            const hasPhoto = photoUrl ? `<a href="${photoUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;"><img src="${photoUrl}" style="height: 24px; border-radius: 4px; cursor: pointer; border: 1px solid #ccc; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1" /></a>` : '';

            const isApproved = data['Approved'] === true;
            const isBlocked = data['Blocked'] === true;
            const isDeletionRequested = data['DeletionRequested'] === true;

            const isComplete = Boolean(
                data['First Name'] &&
                data['Age'] &&
                data['Location'] &&
                data['Gender'] &&
                data['Bio'] &&
                data['Religion'] &&
                photoUrl
            );

            let rowBg = '#ffffff';
            if (isBlocked) rowBg = '#ffebee';
            else if (isDeletionRequested) rowBg = '#fff8e1';

            html += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #d3d3d3; padding: 6px 8px; text-align: center; color: #888; font-size: 11px; background: rgba(0,0,0,0.02);">
                        ${rowIndex} <input type="checkbox" style="margin-left: 4px;" />
                    </td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111;">${name} ${isDeletionRequested ? '<span style="color:red; font-size:10px;">(Del Req)</span>' : ''}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111;">${window.escapeHtml(String(data['Age'] || ''))}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111;">${window.escapeHtml(data['Location'] || '')}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111;">${window.escapeHtml(data['Gender'] || '')}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${window.escapeHtml(data['Bio'] || '')}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111;">${hasPhoto}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111; font-family: monospace;">${uid}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; text-align: center; cursor: pointer; user-select: none;" onclick="toggleUserApproval('${uid}', ${isApproved}, ${isComplete})">
                        ${isApproved ? '<i class="fa-solid fa-check" style="color: #4CAF50;" title="Approved"></i>' : (!isComplete ? '<i class="fa-solid fa-exclamation-circle" style="color: #ff9800;" title="Incomplete Profile"></i>' : '<i class="fa-solid fa-clock" style="color: #888;" title="Pending"></i>')}
                    </td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111;">${window.escapeHtml(data['Religion'] || '')}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; text-align: center;">
                        <i class="fa-solid ${isBlocked ? 'fa-unlock' : 'fa-ban'}" style="color: ${isBlocked ? '#4caf50' : '#f44336'}; cursor: pointer; margin-right: 10px;" onclick="blockUserProfile('${uid}', ${isBlocked})" title="${isBlocked ? 'Unblock User' : 'Block User'}"></i>
                        <i class="fa-solid fa-trash" style="color: #f44336; opacity: 0.5; cursor: pointer;" onclick="deleteUserProfile('${uid}')" title="Delete Data"></i>
                    </td>
                </tr>
            `;
            rowIndex++;
        });
        html += `</tbody></table></div>`;


        listContainer.innerHTML = html;
    } catch (e) {
        console.error("Error fetching users:", e);
        listContainer.innerHTML = '<div style="text-align: center; color: var(--status-error, #f44336);">Error loading users. (Check Firestore rules/indexes)</div>';
    }
}

window.toggleUserApproval = async (uid, currentApprovedStatus, isComplete) => {
    if (!currentApprovedStatus && !isComplete) {
        alert("Cannot approve this profile! The user has not completely submitted all their data (missing bio, photo, location, etc).");
        return;
    }

    try {
        const { doc, updateDoc, setDoc } = window.firebaseHelpers;
        const db = window.firebaseDb;
        const newStatus = !currentApprovedStatus;
        await updateDoc(doc(db, "profiles", uid), {
            Approved: newStatus,
            Blocked: false // Approving unblocks them
        });

        try {
            if (newStatus) {
                await setDoc(doc(db, "notifications", uid), {
                    message: "Great news! Your profile has been approved and you are now visible in the directory!",
                    createdAt: window.firebaseHelpers.serverTimestamp()
                });
            } else {
                await setDoc(doc(db, "notifications", uid), {
                    message: "Your profile has been hidden from the directory. Please reach out to contact@yatramore.com if you believe this was a mistake.",
                    createdAt: window.firebaseHelpers.serverTimestamp()
                });
            }
        } catch (notifErr) {
            console.warn("Could not send notification (likely missing Firestore rules for 'notifications'). Approval still succeeded.", notifErr);
        }

        loadAdminUsers();
        // fetchProfiles(); (Listener handles this automatically)
    } catch (e) {
        console.error("Error updating approval:", e);
        alert("Failed to update status.");
    }
};

window.deleteUserProfile = async (uid) => {
    if (!confirm("Are you sure you want to permanently delete this profile?")) return;
    try {
        const { doc, deleteDoc } = window.firebaseHelpers;
        const db = window.firebaseDb;
        await deleteDoc(doc(db, "profiles", uid));
        loadAdminUsers();
        // fetchProfiles();
    } catch (e) {
        console.error("Error deleting user profile:", e);
        alert("Error deleting user profile. Check console.");
    }
}

window.blockUserProfile = async (uid, currentBlockStatus) => {
    const isBlocking = !currentBlockStatus;
    if (isBlocking && !confirm("Are you sure you want to BLOCK this user? They will be unable to access the app and hidden from the directory.")) return;
    if (!isBlocking && !confirm("Are you sure you want to UNBLOCK this user?")) return;

    try {
        const { doc, updateDoc } = window.firebaseHelpers;
        const db = window.firebaseDb;
        
        const updateData = { Blocked: isBlocking };
        if (isBlocking) {
            updateData.Approved = false; // Automatically hide their profile
        }

        await updateDoc(doc(db, "profiles", uid), updateData);
        alert(`User has been ${isBlocking ? 'blocked' : 'unblocked'} successfully.`);
        loadAdminUsers();
        // fetchProfiles();
    } catch (e) {
        console.error("Error blocking/unblocking user:", e);
        alert("Error updating block status. Check console.");
    }
}

window.loadAdminDeletions = async () => {
    const listContainer = document.getElementById('admin-deletions-list');
    if (!listContainer) return;
    listContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);"><i class="fas fa-circle-notch fa-spin"></i> Fetching deletion requests...</div>';

    try {
        const { collection, getDocs, doc, getDoc } = window.firebaseHelpers;
        const db = window.firebaseDb;

        // Fetch all profiles and filter locally to avoid needing a composite index for now
        const querySnapshot = await getDocs(collection(db, "profiles"));
        const deletionRequests = [];

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.DeletionRequested === true) {
                deletionRequests.push({ uid: docSnap.id, data });
            }
        });

        if (deletionRequests.length === 0) {
            listContainer.innerHTML = '<div style="padding: 3rem; text-align: center; color: var(--text-muted); font-size: 1.1rem;"><i class="fa-regular fa-face-smile" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; display: block;"></i> No pending account deletion requests.</div>';
            return;
        }

        let html = `
            <div style="overflow-x: auto; max-width: 100%; box-sizing: border-box;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <thead>
                    <tr style="background: #f44336; color: white;">
                        <th style="padding: 10px; border: 1px solid #d3d3d3;">Name</th>
                        <th style="padding: 10px; border: 1px solid #d3d3d3;">User ID (UID)</th>
                        <th style="padding: 10px; border: 1px solid #d3d3d3;">Auth Email (Fetches from users collection)</th>
                        <th style="padding: 10px; border: 1px solid #d3d3d3; text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (const req of deletionRequests) {
            const name = window.escapeHtml(req.data['First Name'] || 'Unknown');
            
            // Try to fetch email from users collection
            let email = 'Unknown (Not in users db)';
            try {
                const userDoc = await getDoc(doc(db, "users", req.uid));
                if (userDoc.exists()) {
                    email = window.escapeHtml(userDoc.data().email || 'Unknown');
                }
            } catch(e) {
                console.warn("Could not fetch user doc for email", e);
            }

            const safeJsEmail = encodeURIComponent(email).replace(/'/g, "%27");
            html += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 10px; color: #111;"><strong>${name}</strong></td>
                    <td style="padding: 12px 10px; font-family: monospace; color: #111; user-select: all; cursor: copy;" title="Double click to copy">${req.uid}</td>
                    <td style="padding: 12px 10px; color: #111; user-select: all; cursor: copy;" title="Double click to copy">${email}</td>
                    <td style="padding: 12px 10px; text-align: center;">
                        <button onclick="window.approveDeletionRequest('${req.uid}', decodeURIComponent('${safeJsEmail}'))" style="background: #f44336; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600;"><i class="fa-solid fa-fire"></i> Approve & Wipe Data</button>
                    </td>
                </tr>
            `;
        }

        html += `</tbody></table></div>`;
        html += `<p style="margin-top: 15px; font-size: 0.9rem; color: var(--text-muted);"><i class="fa-solid fa-circle-info"></i> <strong>Note:</strong> Clicking "Approve & Wipe Data" will delete their profile and user metadata from Firestore. However, due to security limitations, you must manually delete their email (<strong>${deletionRequests.length > 0 ? 'above' : 'listed'}</strong>) from your Firebase Authentication console, and delete their image from Cloudinary.</p>`;

        listContainer.innerHTML = html;

    } catch (e) {
        console.error("Error fetching deletion requests:", e);
        listContainer.innerHTML = '<div style="text-align: center; color: var(--status-error, #f44336);">Error loading deletion requests.</div>';
    }
}

window.approveDeletionRequest = async (uid, email) => {
    if (!confirm(`Are you sure you want to completely wipe the data for user ${uid}? \n\nAfter doing this, remember to go to your Firebase Console and delete their authentication email: ${email}`)) return;

    try {
        const { deleteDoc, doc } = window.firebaseHelpers;
        const db = window.firebaseDb;

        await deleteDoc(doc(db, "profiles", uid));
        
        try {
            await deleteDoc(doc(db, "users", uid));
        } catch(e) {
            console.warn("User document already deleted or inaccessible.", e);
        }

        alert("Profile and User Database Records Wiped Successfully!");
        window.loadAdminDeletions(); // Refresh list
        loadAdminUsers();

    } catch (e) {
        console.error("Error approving deletion request:", e);
        alert("Error wiping data. Check console.");
    }
}

async function loadAdminUpdates() {
    const listContainer = document.getElementById('admin-updates-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted);">Loading requests...</div>';

    try {
        const { collection, getDocs, orderBy, query, where } = window.firebaseHelpers;
        const db = window.firebaseDb;

        const updatesRef = collection(db, "profile_updates");
        const q = query(updatesRef, where("status", "==", "pending"));
        const snapshot = await getDocs(q);

        let html = `
            <div style="overflow: auto; width: 100%; max-width: 100%; box-sizing: border-box; height: 60vh; background: #ffffff; border: 1px solid #d3d3d3; position: relative;">
            <table style="width: max-content; min-width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <thead style="position: sticky; top: 0; z-index: 10;">
                    <tr style="color: #333333;">
                        <th style="background: #f5f5f5; padding: 6px 8px; border: 1px solid #d3d3d3; font-weight: normal; width: 50px; text-align: center;"><input type="checkbox" /></th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">First Name</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 80px;">Age</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">Location</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">Religion</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 200px;">Bio</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">Profile Picture</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 200px;">Firebase UID</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        let rowIndex = 1;
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const uid = docSnap.id;

            const { getDoc, doc } = window.firebaseHelpers;
            const originalDoc = await getDoc(doc(db, "profiles", uid));
            const oldData = originalDoc.exists() ? originalDoc.data() : {};

            const escAdmin = (str) => {
                const div = document.createElement('div');
                div.textContent = String(str);
                return div.innerHTML;
            };

            const renderDiff = (key) => {
                const newVal = data[key] || '';
                const oldVal = oldData[key] || '';
                if (String(newVal).trim() !== String(oldVal).trim()) {
                    return `<span style="background: #fff3cd; color: #856404; font-weight: 600; padding: 2px 4px; border-radius: 4px;" title="Was: ${escAdmin(oldVal || 'empty')}">${escAdmin(newVal)}</span>`;
                }
                return escAdmin(newVal);
            };

            const name = renderDiff('First Name');

            let photoUrl = '';
            if (data['Profile Picture']) {
                if (Array.isArray(data['Profile Picture']) && data['Profile Picture'].length > 0) {
                    photoUrl = data['Profile Picture'][0].url;
                } else if (typeof data['Profile Picture'] === 'string') {
                    photoUrl = data['Profile Picture'];
                }
            }

            let oldPhotoUrl = '';
            if (oldData['Profile Picture']) {
                if (Array.isArray(oldData['Profile Picture']) && oldData['Profile Picture'].length > 0) {
                    oldPhotoUrl = oldData['Profile Picture'][0].url;
                } else if (typeof oldData['Profile Picture'] === 'string') {
                    oldPhotoUrl = oldData['Profile Picture'];
                }
            }
            const photoChanged = photoUrl !== oldPhotoUrl;
            const photoStyle = photoChanged ? `height: 24px; border-radius: 4px; cursor: pointer; border: 2px solid #ffc107; box-shadow: 0 0 5px #ffc107; transition: opacity 0.2s;` : `height: 24px; border-radius: 4px; cursor: pointer; border: 1px solid #ccc; transition: opacity 0.2s;`;

            const hasPhoto = photoUrl ? `<a href="${photoUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;"><img src="${photoUrl}" style="${photoStyle}" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1" /></a>` : '';

            html += `
                <tr style="background: #ffffff;">
                    <td style="border: 1px solid #d3d3d3; padding: 6px 8px; text-align: center; color: #888; font-size: 11px; background: #fafafa;">
                        ${rowIndex} <input type="checkbox" style="margin-left: 4px;" />
                    </td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111;">${name}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111;">${renderDiff('Age')}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111;">${renderDiff('Location')}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111;">${renderDiff('Religion')}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${renderDiff('Bio')}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111;">${hasPhoto}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; color: #111; font-family: monospace;">${uid}</td>
                    <td style="border: 1px solid #d3d3d3; padding: 6px 10px; display: flex; gap: 8px; justify-content: center; align-items: center;">
                        <button onclick="approveProfileUpdate('${uid}')" style="background: transparent; border: none; color: #4CAF50; cursor: pointer; font-size: 14px;" title="Approve">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button onclick="rejectProfileUpdate('${uid}')" style="background: transparent; border: none; color: #f44336; cursor: pointer; font-size: 14px;" title="Reject">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </td>
                </tr>
            `;
            rowIndex++;
        }
        html += `</tbody></table></div>`;

        listContainer.innerHTML = html;
    } catch (e) {
        console.error("Error fetching updates:", e);
        listContainer.innerHTML = '<div style="text-align: center; color: var(--status-error, #f44336);">Error loading updates.</div>';
    }
}

window.approveProfileUpdate = async (uid) => {
    try {
        const { doc, getDoc, setDoc, deleteDoc } = window.firebaseHelpers;
        const db = window.firebaseDb;

        // 1. Get the update data
        const updateDocSnap = await getDoc(doc(db, "profile_updates", uid));
        if (!updateDocSnap.exists()) return;
        const updateData = updateDocSnap.data();

        // 2. Remove update-specific metadata
        delete updateData.status;
        delete updateData.requestedAt;

        // 3. Overwrite the live profile
        await setDoc(doc(db, "profiles", uid), updateData);

        // 4. Delete the request
        await deleteDoc(doc(db, "profile_updates", uid));

        // 5. Send Notification
        await setDoc(doc(db, "notifications", uid), {
            message: "Great news! Your profile update request has been approved!",
            createdAt: window.firebaseHelpers.serverTimestamp()
        });

        loadAdminUpdates();
        // fetchProfiles();
    } catch (e) {
        console.error("Error approving update:", e);
        alert("Failed to approve update.");
    }
};

window.rejectProfileUpdate = async (uid) => {
    if (!confirm("Reject and delete this update request?")) return;
    try {
        const { doc, deleteDoc, setDoc } = window.firebaseHelpers;
        const db = window.firebaseDb;
        await deleteDoc(doc(db, "profile_updates", uid));

        await setDoc(doc(db, "notifications", uid), {
            message: "Your profile update request was not approved. Please reach out to contact@yatramore.com if you believe this was a mistake.",
            createdAt: window.firebaseHelpers.serverTimestamp()
        });

        loadAdminUpdates();
    } catch (e) {
        console.error("Error rejecting update:", e);
        alert("Failed to reject update.");
    }
};

async function loadAdminReports() {
    const listContainer = document.getElementById('admin-reports-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted);">Loading reports...</div>';

    try {
        const { collection, getDocs, orderBy, query } = window.firebaseHelpers;
        const db = window.firebaseDb;

        // Fetch all reports
        const reportsRef = collection(db, "reports");
        const q = query(reportsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        let html = `
            <div style="overflow: auto; width: 100%; max-width: 100%; box-sizing: border-box; height: 60vh; background: #ffffff; border: 1px solid #d3d3d3; position: relative;">
            <table style="width: max-content; min-width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <thead style="position: sticky; top: 0; z-index: 10;">
                    <tr style="color: #333333;">
                        <th style="background: #f5f5f5; padding: 6px 8px; border: 1px solid #d3d3d3; font-weight: normal; width: 50px; text-align: center;"><input type="checkbox" /></th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">Reported User</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">Reported By</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">Date</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 100px;">Status</th>
                        <th style="background: #f5f5f5; padding: 6px 10px; border: 1px solid #d3d3d3; font-weight: 500; min-width: 120px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        let rowIndex = 1;
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const reportId = docSnap.id;

            let reportedUserPhoto = '';
            let reporterUserPhoto = '';
            let targetName = 'Unknown User';
            let reporterName = 'Unknown User';

            const { getDoc, doc } = window.firebaseHelpers;

            // Fetch target user profile from Firestore
            try {
                if (data.reportedUser) {
                    const targetDoc = await getDoc(doc(db, "profiles", data.reportedUser));
                    if (targetDoc.exists()) {
                        const targetData = targetDoc.data();
                        const fields = targetData.fields || targetData;
                        let photoRaw = fields['Profile Picture'];
                        if (Array.isArray(photoRaw) && photoRaw.length > 0) photoRaw = photoRaw[0].url;
                        reportedUserPhoto = window.escapeHtml(photoRaw || '');
                        targetName = window.escapeHtml(fields['First Name'] || 'Unknown User');
                    }
                }
            } catch (e) { console.warn("Target profile fetch error:", e); }

            // Fetch reporter profile
            try {
                if (data.reportedBy) {
                    const reporterDoc = await getDoc(doc(db, "profiles", data.reportedBy));
                    if (reporterDoc.exists()) {
                        const rData = reporterDoc.data();
                        const fields = rData.fields || rData;
                        let photoRaw = fields['Profile Picture'];
                        if (Array.isArray(photoRaw) && photoRaw.length > 0) photoRaw = photoRaw[0].url;
                        reporterUserPhoto = window.escapeHtml(photoRaw || '');
                        reporterName = window.escapeHtml(fields['First Name'] || 'Unknown User');
                    }
                }
            } catch (e) { console.warn("Reporter profile fetch error:", e); }

            const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleString() : 'Unknown Date';
            const status = data.adminStatus || 'pending';
            const isDone = status === 'done';
            const conversationId = window.escapeHtml(data.conversationId || 'Unknown ID');

            const hasPhotoTarget = reportedUserPhoto ? `<a href="${reportedUserPhoto}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;"><img src="${reportedUserPhoto}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 50%; margin-right: 12px; cursor: pointer; border: 1px solid #eaeaea; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1" /></a>` : '<div style="width: 32px; height: 32px; border-radius: 50%; background: #eaeaea; margin-right: 12px; display: flex; align-items: center; justify-content: center; color: #aaa;"><i class="fa-solid fa-user"></i></div>';

            const hasPhotoReporter = reporterUserPhoto ? `<a href="${reporterUserPhoto}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;"><img src="${reporterUserPhoto}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 50%; margin-right: 12px; cursor: pointer; border: 1px solid #eaeaea; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1" /></a>` : '<div style="width: 32px; height: 32px; border-radius: 50%; background: #eaeaea; margin-right: 12px; display: flex; align-items: center; justify-content: center; color: #aaa;"><i class="fa-solid fa-user"></i></div>';

            html += `
                <tr style="background: #ffffff; opacity: ${isDone ? '0.5' : '1'}; transition: background 0.2s; border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 12px 15px; text-align: center; color: #888; font-size: 12px; background: #fafafa; border-right: 1px solid #f0f0f0;">
                        ${rowIndex} <input type="checkbox" style="margin-left: 6px; cursor: pointer;" />
                    </td>
                    <td style="padding: 12px 15px; color: #111; display: flex; align-items: center;">
                        ${hasPhotoTarget}
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 600; font-size: 14px;">${targetName}</span>
                            <span style="font-size: 11px; color: #888; font-family: monospace; margin-top: 2px;">UID: ${window.escapeHtml(data.reportedUser)}</span>
                        </div>
                    </td>
                    <td style="padding: 12px 15px; color: #111;">
                        <div style="display: flex; align-items: center;">
                            ${hasPhotoReporter}
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-weight: 600; font-size: 14px;">${reporterName}</span>
                                <span style="font-size: 11px; color: #888; font-family: monospace; margin-top: 2px;">UID: ${data.reportedBy}</span>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 12px 15px; color: #555; font-size: 13px;">
                        <div style="display: flex; flex-direction: column;">
                            <span>${dateStr}</span>
                            <span style="font-size: 11px; color: #888; font-family: monospace; margin-top: 2px;">Chat ID: ${conversationId}</span>
                        </div>
                    </td>
                    <td style="padding: 12px 15px; text-align: center; cursor: pointer; user-select: none;" onclick="toggleReportStatus('${reportId}', '${status}')">
                        ${isDone
                    ? '<span style="display: inline-flex; align-items: center; gap: 4px; background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;"><i class="fa-solid fa-check"></i> Resolved</span>'
                    : '<span style="display: inline-flex; align-items: center; gap: 4px; background: #ffebee; color: #c62828; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;"><i class="fa-solid fa-circle-exclamation"></i> Action Req</span>'}
                    </td>
                    <td style="padding: 12px 15px;">
                        <div style="display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap;">
                            <button onclick="toggleReportStatus('${reportId}', '${status}')" style="background: transparent; border: 1px solid #ccc; color: #333; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.background='#f5f5f5';" onmouseout="this.style.background='transparent';" title="Mark report as resolved or pending">
                                ${isDone ? 'Mark Pending' : 'Mark Resolved'}
                            </button>
                            <button onclick="dismissReport('${reportId}', '${data.conversationId}')" style="background: transparent; border: 1px solid #ff9800; color: #f57c00; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.background='#fff3e0';" onmouseout="this.style.background='transparent';" title="Dismiss report and unlock the chat conversation">
                                Dismiss Report
                            </button>
                            <button onclick="blockUser('${data.reportedUser}')" style="background: #f44336; border: none; color: white; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; box-shadow: 0 2px 5px rgba(244,67,54,0.2); transition: all 0.2s;" onmouseover="this.style.background='#d32f2f'; this.style.transform='translateY(-1px)';" onmouseout="this.style.background='#f44336'; this.style.transform='translateY(0)';" title="Block this user from matchmaking entirely">
                                Block User
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            rowIndex++;
        }

        if (snapshot.empty) {
            html += `
                <tr style="background: #ffffff;">
                    <td colspan="6" style="border: 1px solid #d3d3d3; padding: 20px; text-align: center; color: #888;">No reports found.</td>
                </tr>
            `;
        }

        html += `</tbody></table></div>`;

        listContainer.innerHTML = html;

    } catch (e) {
        console.error("Error fetching reports:", e);
        listContainer.innerHTML = '<div style="text-align: center; color: var(--status-error, #f44336);">Error loading reports. You may need to create a Firestore Index for orderBy("timestamp").</div>';
    }
}

window.toggleReportStatus = async (reportId, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'done' : 'pending';
    try {
        const { doc, updateDoc } = window.firebaseHelpers;
        const db = window.firebaseDb;
        await updateDoc(doc(db, "reports", reportId), {
            adminStatus: newStatus
        });
        // Refresh panel
        loadAdminReports();
    } catch (e) {
        console.error("Error updating report status:", e);
        alert("Failed to update status.");
    }
};

window.dismissReport = async (reportId, conversationId) => {
    if (!confirm("Are you sure you want to dismiss this report? This will unlock the chat conversation for the users and delete the report from the system.")) return;
    try {
        const { doc, deleteDoc, updateDoc } = window.firebaseHelpers;
        const db = window.firebaseDb;

        // 1. Delete the report document
        await deleteDoc(doc(db, "reports", reportId));

        // 2. Unlock the conversation (set status back to accepted)
        if (conversationId) {
            await updateDoc(doc(db, "conversations", conversationId), {
                status: 'accepted'
            });
        }

        alert("Report dismissed and chat unlocked successfully.");
        // Refresh panel
        loadAdminReports();
    } catch (e) {
        console.error("Error dismissing report:", e);
        alert("Failed to dismiss report. Check console for details.");
    }
};

// ==========================================
// LONG PRESS CONTEXT MENU (WHATSAPP STYLE)
// ==========================================

let pressTimer = null;
let currentTargetMsgId = null;
let currentTargetMsgElement = null;

const chatMessagesContainer = document.getElementById('chat-messages');
const chatOverlay = document.getElementById('chat-overlay');
const reactionBar = document.getElementById('ctx-reaction-bar');
const actionMenu = document.getElementById('ctx-action-menu');
let clonedMsgElement = null;

if (chatMessagesContainer) {
    chatMessagesContainer.addEventListener('touchstart', handlePressStart, { passive: true });
    chatMessagesContainer.addEventListener('mousedown', handlePressStart);
    chatMessagesContainer.addEventListener('touchend', handlePressEnd);
    chatMessagesContainer.addEventListener('mouseup', handlePressEnd);
    chatMessagesContainer.addEventListener('mouseleave', handlePressEnd);
    chatMessagesContainer.addEventListener('touchmove', handlePressEnd, { passive: true });
}

function handlePressStart(e) {
    const msgElement = e.target.closest('.chat-message');
    if (!msgElement) return;
    
    // Ignore if already deleted
    if (msgElement.dataset.isDeleted === 'true') return;

    // Start timer for 500ms
    pressTimer = setTimeout(() => {
        showContextMenu(msgElement, e);
    }, 500);
}

function handlePressEnd(e) {
    if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
    }
}

function showContextMenu(msgElement, event) {
    currentTargetMsgElement = msgElement;
    currentTargetMsgId = msgElement.dataset.msgId;

    const isMe = msgElement.getAttribute('data-is-me') === 'true';
    const isWithin5Mins = msgElement.getAttribute('data-is-within-5mins') === 'true';
    const isStarred = msgElement.getAttribute('data-is-starred') === 'true';
    const rawText = decodeURIComponent(msgElement.dataset.rawText);

    // DEFENSIVE FIX: Move UI elements directly to body to escape ANY CSS containing blocks (transforms, filters) from ancestors like .chat-panel
    if (chatOverlay && chatOverlay.parentNode !== document.body) document.body.appendChild(chatOverlay);
    if (reactionBar && reactionBar.parentNode !== document.body) document.body.appendChild(reactionBar);
    if (actionMenu && actionMenu.parentNode !== document.body) document.body.appendChild(actionMenu);

    // Vibrate if on mobile
    if (navigator.vibrate) navigator.vibrate(50);

    // Update Star context menu button
    const starBtn = document.getElementById('ctx-star-btn');
    if (isStarred) {
        starBtn.querySelector('span').innerText = 'Unstar';
        starBtn.querySelector('i').classList.remove('fa-regular');
        starBtn.querySelector('i').classList.add('fa-solid');
    } else {
        starBtn.querySelector('span').innerText = 'Star';
        starBtn.querySelector('i').classList.remove('fa-solid');
        starBtn.querySelector('i').classList.add('fa-regular');
    }

    // Hide context menu buttons based on context
    document.getElementById('ctx-edit-btn').style.display = (isMe && isWithin5Mins) ? 'flex' : 'none';
    document.getElementById('ctx-del-everyone-btn').style.display = (isMe && isWithin5Mins) ? 'flex' : 'none';
    
    // Get exact coordinates of the message
    const rect = msgElement.getBoundingClientRect();
    
    // Create clone for highlight
    clonedMsgElement = msgElement.cloneNode(true);
    clonedMsgElement.style.position = 'fixed';
    clonedMsgElement.style.top = `${rect.top}px`;
    clonedMsgElement.style.left = `${rect.left}px`;
    clonedMsgElement.style.width = `${rect.width}px`;
    clonedMsgElement.style.margin = '0';
    clonedMsgElement.style.zIndex = '9999';
    clonedMsgElement.style.boxShadow = '0 5px 25px rgba(0,0,0,0.3)';
    clonedMsgElement.style.transform = 'scale(1)'; // Initial state
    clonedMsgElement.style.transition = 'top 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // Smooth pop up and translation
    
    // Ensure the clone doesn't trigger its own touch events
    clonedMsgElement.style.pointerEvents = 'none';
    document.body.appendChild(clonedMsgElement);

    // Show overlay
    if (chatOverlay) chatOverlay.style.display = 'block';
    
    // Setup initial positions (hidden to calculate size)
    if (reactionBar) {
        reactionBar.style.display = 'flex';
        reactionBar.style.opacity = '0';
        reactionBar.style.transform = 'scale(0.95)';
        reactionBar.style.margin = '0px';
        void reactionBar.offsetHeight; // Force layout flush for WebKit
    }

    if (actionMenu) {
        actionMenu.style.display = 'flex';
        actionMenu.style.opacity = '0';
        actionMenu.style.transform = 'scale(0.95)';
        actionMenu.style.margin = '0px';
        void actionMenu.offsetHeight; // Force layout flush for WebKit
    }

    // Define safe bounds for the 'sandwich' (Emoji Bar + Message + Action Menu)
    const chatPanelHeader = document.querySelector('.chat-panel-header');
    const navBarHeight = chatPanelHeader ? chatPanelHeader.offsetHeight : 65; 
    const chatInputArea = document.querySelector('.chat-input-area');
    const inputBarHeight = chatInputArea ? chatInputArea.offsetHeight : 80;
    const maxBottom = Number(window.innerHeight) - inputBarHeight;

    // Foolproof height calculation based on visible items
    const emojiHeight = 50;
    let visibleButtons = 0;
    ['ctx-star-btn', 'ctx-copy-btn', 'ctx-edit-btn', 'ctx-del-me-btn', 'ctx-del-everyone-btn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn && btn.style.display !== 'none') visibleButtons++;
    });
    const actionHeight = visibleButtons > 0 ? (visibleButtons * 48) : 150; 
    const padding = 8; // Tighter gap for native feel

    const safeRectTop = Number(rect.top) || 0;
    const safeRectHeight = Number(rect.height) || Number(rect.bottom - rect.top) || 0;
    const safeRectRight = Number(rect.right) || 0;
    const safeRectLeft = Number(rect.left) || 0;

    // Store original position to animate back on close
    window.originalMsgTop = safeRectTop;
    
    // Ideal sandwich layout: Emoji on top, Message in middle, Action on bottom
    let msgTop = safeRectTop;
    
    // Check if sandwich overflows top
    const sandwichTop = msgTop - emojiHeight - padding;
    if (sandwichTop < navBarHeight) {
        msgTop += (navBarHeight - sandwichTop);
    }

    // Check if sandwich overflows bottom
    const sandwichBottom = msgTop + safeRectHeight + padding + actionHeight;
    if (sandwichBottom > maxBottom) {
        msgTop -= (sandwichBottom - maxBottom);
    }

    // Final positions for the sandwich elements
    const reactionTop = msgTop - emojiHeight - padding;
    const actionTop = msgTop + rect.height + padding;

    // Apply strict top positioning
    if (reactionBar) {
        reactionBar.style.setProperty('position', 'fixed', 'important');
        reactionBar.style.setProperty('bottom', 'auto', 'important');
        reactionBar.style.setProperty('top', `${reactionTop}px`, 'important');
    }
    if (actionMenu) {
        actionMenu.style.setProperty('position', 'fixed', 'important');
        actionMenu.style.setProperty('bottom', 'auto', 'important');
        actionMenu.style.setProperty('top', `${actionTop}px`, 'important');
    }

    // Apply horizontal alignments
    const applyHorizontalAlign = (el) => {
        if (!el) return;
        if (isMe) {
            el.style.setProperty('right', `${Number(window.innerWidth) - safeRectRight}px`, 'important');
            el.style.setProperty('left', 'auto', 'important');
            el.style.transformOrigin = 'center right';
        } else {
            el.style.setProperty('left', `${safeRectLeft}px`, 'important');
            el.style.setProperty('right', 'auto', 'important');
            el.style.transformOrigin = 'bottom left';
        }
    };

    applyHorizontalAlign(reactionBar);
    applyHorizontalAlign(actionMenu);

    // Animate in
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

    // Setup Emoji Bar
    document.querySelectorAll('.ctx-emoji-btn').forEach(btn => {
        btn.onclick = () => {
            hideContextMenu();
            if (currentTargetMsgId) {
                window.reactToMessage(currentTargetMsgId, btn.dataset.emoji);
            }
        };
    });

    const emojiInput = document.getElementById('ctx-custom-emoji-input');
    if (emojiInput) {
        emojiInput.value = ''; // Reset
        emojiInput.oninput = (ev) => {
            const val = ev.target.value.trim();
            if (val) {
                hideContextMenu();
                if (currentTargetMsgId) {
                    window.reactToMessage(currentTargetMsgId, Array.from(val)[0] || val); 
                }
            }
        };
    }

    const emojiPlusBtn = document.getElementById('ctx-emoji-plus-btn');
    if (emojiPlusBtn) {
        emojiPlusBtn.onclick = (ev) => {
            ev.stopPropagation(); 
            
            // Show custom emoji picker
            let picker = document.getElementById('custom-emoji-picker-overlay');
            if (!picker) {
                // Dynamically import the picker script
                import('https://cdn.jsdelivr.net/npm/emoji-picker-element@1/index.js').then(() => {
                    picker = document.createElement('div');
                    picker.id = 'custom-emoji-picker-overlay';
                    picker.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 10001; display: flex; align-items: center; justify-content: center;';
                    
                    const pickerElement = document.createElement('emoji-picker');
                    picker.appendChild(pickerElement);
                    
                    picker.onclick = (e) => {
                        if (e.target === picker) picker.style.display = 'none';
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
                    if(window.showToast) window.showToast("Could not load emoji picker.");
                });
            } else {
                picker.style.display = 'flex';
            }
        };
    }

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
            if(window.showToast) window.showToast("Message copied");
        });
    });
    setActionMenuClick('ctx-edit-btn', () => window.startEditMessage(currentTargetMsgId, rawText));
    setActionMenuClick('ctx-del-me-btn', () => window.deleteMessageForMe(currentTargetMsgId));
    setActionMenuClick('ctx-del-everyone-btn', () => window.deleteMessageForEveryone(currentTargetMsgId));
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
        clonedMsgElement.style.transform = 'scale(1)'; // Revert pop
        if (window.originalMsgTop !== undefined) {
            clonedMsgElement.style.top = `${window.originalMsgTop}px`; // Slide back to original place
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

// Hide context menu when tapping outside (on the overlay)
if (chatOverlay) {
    chatOverlay.addEventListener('click', hideContextMenu);
    chatOverlay.addEventListener('touchstart', (e) => {
        // Prevent scrolling underneath
        e.preventDefault(); 
        hideContextMenu();
    });
}

window.deleteMessageForEveryone = async (msgId) => {
    if (!currentChatId || !msgId) return;
    try {
        const { updateDoc, doc } = window.firebaseHelpers;
        const db = window.firebaseDb;
        await updateDoc(doc(db, "conversations", currentChatId, "messages", msgId), {
            isDeleted: true
        });
        if(window.showToast) window.showToast("Message deleted for everyone");
    } catch (e) {
        console.error("Error deleting message:", e);
        if(window.showToast) window.showToast("Failed to delete message");
    }
};

window.deleteMessageForMe = async (msgId) => {
    if (!currentChatId || !msgId) return;
    try {
        const { updateDoc, doc, arrayUnion } = window.firebaseHelpers;
        const db = window.firebaseDb;
        await updateDoc(doc(db, "conversations", currentChatId, "messages", msgId), {
            hiddenFor: arrayUnion(currentMember.id)
        });
        if(window.showToast) window.showToast("Message deleted for you");
    } catch (e) {
        console.error("Error deleting message for me:", e);
        if(window.showToast) window.showToast("Failed to delete. Did you update Firebase rules?");
    }
};

window.toggleStarMessage = async (msgId, currentlyStarred) => {
    if (!currentChatId || !msgId) return;
    try {
        const { updateDoc, doc, arrayUnion, arrayRemove } = window.firebaseHelpers;
        const db = window.firebaseDb;
        await updateDoc(doc(db, "conversations", currentChatId, "messages", msgId), {
            starredBy: currentlyStarred ? arrayRemove(currentMember.id) : arrayUnion(currentMember.id)
        });
    } catch (e) {
        console.error("Error toggling star:", e);
        if(window.showToast) window.showToast("Failed to update star. Did you update Firebase rules?");
    }
};

let showStarredOnly = false;
document.getElementById('toggle-starred-btn')?.addEventListener('click', (e) => {
    showStarredOnly = !showStarredOnly;
    const btn = e.currentTarget;
    const icon = btn.querySelector('i');
    const container = document.getElementById('chat-messages');
    
    if (showStarredOnly) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        icon.style.color = ''; 
        container.classList.add('show-starred-only');
    } else {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
        icon.style.color = ''; 
        container.classList.remove('show-starred-only');
        setTimeout(() => {
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 50);
    }
});

// React to a message
window.reactToMessage = async (msgId, emoji) => {
    if (!window.firebaseCurrentUser || !currentChatId) return;
    try {
        const { doc, updateDoc, deleteField } = window.firebaseHelpers;
        const msgRef = doc(db, "conversations", currentChatId, "messages", msgId);
        
        // Take just the first emoji character if they pasted multiple
        const finalEmoji = Array.from(emoji)[0] || '👍';
        
        // Need to know if they already reacted with this emoji to toggle it off
        // Since we don't have the full reactions map in the DOM easily, we will 
        // optimistically update it. If they want to toggle, they tap it again.
        // Actually, we can fetch the document or keep it simple: always set it.
        // If they want to remove their reaction, they tap the same emoji.
        
        // Let's get the current message data to check if we are toggling
        const { getDoc } = window.firebaseHelpers;
        const msgSnap = await getDoc(msgRef);
        
        if (msgSnap.exists()) {
            const data = msgSnap.data();
            const currentReaction = (data.reactions || {})[window.firebaseCurrentUser.uid];
            
            if (currentReaction === finalEmoji) {
                // Toggle off
                await updateDoc(msgRef, {
                    [`reactions.${window.firebaseCurrentUser.uid}`]: deleteField()
                });
            } else {
                // Set new reaction
                await updateDoc(msgRef, {
                    [`reactions.${window.firebaseCurrentUser.uid}`]: finalEmoji
                });
            }
        }
    } catch (e) {
        console.error("Error reacting to message: ", e);
        showToast("Failed to react to message.");
    }
};
