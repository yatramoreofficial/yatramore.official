(function () {
    let tabLang = 'en';
    try {
        tabLang = sessionStorage.getItem('ym_translation_lang') || 'en';
    } catch (e) {
        console.warn("Session storage access failed:", e);
    }
    const setOrClearGoogleCookie = (lang) => {
        const domains = ['', window.location.hostname, '.' + window.location.hostname, '.github.io', '.yatramoreofficial.github.io', 'yatramore.com', '.yatramore.com', 'www.yatramore.com'];
        const paths = ['/', window.location.pathname, '/yatramore.official', '/yatramore.official/'];

        domains.forEach(domain => {
            paths.forEach(path => {
                const dStr = domain ? `; domain=${domain}` : '';
                if (lang && lang !== 'en') {
                    document.cookie = `googtrans=/en/${lang}; path=${path}${dStr}`;
                } else {
                    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${dStr}`;
                    document.cookie = `googtrans=/en/en; path=${path}${dStr}`;
                }
            });
        });
    };

    setOrClearGoogleCookie(tabLang);
    window._setOrClearGoogleCookie = setOrClearGoogleCookie;
})();

function initializeYatrAmore() {
    let tabLang = 'en';
    try {
        tabLang = sessionStorage.getItem('ym_translation_lang') || 'en';
    } catch (e) {
        console.warn("Storage access limited:", e);
    }

    if (tabLang && tabLang !== 'en') {
        let nudges = 0;
        const enforceInterval = setInterval(() => {
            const combo = document.querySelector(".goog-te-combo");
            const htmlClass = document.documentElement.className || '';

            if (combo && combo.options.length > 0 && !htmlClass.includes('translated-')) {
                combo.value = tabLang;
                combo.dispatchEvent(new Event("change", { bubbles: true }));
            } else if (htmlClass.includes('translated-')) {
                clearInterval(enforceInterval);
            }

            nudges++;
            if (nudges > 40) {
                clearInterval(enforceInterval);
                if (!htmlClass.includes('translated-')) {
                    const translateWidget = document.getElementById("google_translate_element");
                    if (translateWidget) {
                        translateWidget.style.display = "block";
                        if (window.showToast) {
                            window.showToast("Automatic translation blocked by browser. Please use the manual dropdown.", false);
                        }
                    }
                }
            }
        }, 200);
    }

    const navbar = document.getElementById("navbar");
    let isScrolling = false;
    let currentZoom = 1;
    try {
        currentZoom = parseFloat(localStorage.getItem('ym_zoom_level')) || 1;
    } catch (e) {
        console.warn("Local storage blocked:", e);
    }
    if (currentZoom !== 1) document.documentElement.style.setProperty("--zoom-scale", currentZoom);

    const _ga = atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy8=');
    const _gz = '/exec';

    const _keys = {
        counter: atob('QUtmeWNiel9NOVhScFRrdXgxUjg1SnNaSjdKZlNCY1ZLa2JOOFFQR1A1dTgzUWtpUzVuc2xuY1RBNkRveld2S3JUQjJjYzFhTVE='),
        contact: atob('QUtmeWNid19rR3NPam96eWhqak1NX2xFWTE1MzVLdjRsRWVLZ2pOdGMzcmVpQlNnX1JaMUowZ1VwZVFMaE9PQVZBN2Jrell6MFE='),
        family: atob('QUtmeWNieWU1cGo3OWJkRkhUNHZLc21UTjZ3QXVGaTVjaE4yLWwtS1NQYzMzWXVpM0pRWjBLaEV5RE9nTWM2SFZXWTVsN3dQaWc=')
    };

    const gasUrl = (k) => _ga + _keys[k] + _gz;

    const Security = {
        deviceId: null,
        fingerprint: null,
        isPrivate: false,

        initDeviceId() {
            try {
                let id = localStorage.getItem('yatramore_device_id');
                if (!id) {
                    id = 'dv_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
                    localStorage.setItem('yatramore_device_id', id);
                }
                this.deviceId = id;
                return id;
            } catch (e) {
                this.deviceId = 'temp_' + Math.random().toString(36).substr(2, 9);
                return this.deviceId;
            }
        },

        async getFingerprint() {
            if (this.fingerprint) return this.fingerprint;
            const signals = [];

            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.fillText('YatrAmore@Security', 2, 15);
                signals.push(canvas.toDataURL().slice(-64));
            } catch (e) { signals.push('c_err'); }

            try {
                const gl = document.createElement('canvas').getContext('webgl');
                if (gl) {
                    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
                    signals.push(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'no_dbg');
                }
            } catch (e) { signals.push('w_err'); }

            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx) {
                    const oscillator = audioCtx.createOscillator();
                    const analyser = audioCtx.createAnalyser();
                    signals.push(analyser.fftSize.toString());
                    audioCtx.close();
                }
            } catch (e) { signals.push('a_err'); }

            signals.push(`${screen.width}x${screen.height}x${window.devicePixelRatio}`);
            signals.push(navigator.userAgentData?.platform || navigator.platform || 'unk');
            signals.push((navigator.hardwareConcurrency || 0).toString());

            const raw = signals.join('|||');
            let hash = 0;
            for (let i = 0; i < raw.length; i++) {
                hash = ((hash << 5) - hash) + raw.charCodeAt(i);
                hash |= 0;
            }
            this.fingerprint = 'fp_' + Math.abs(hash).toString(36);
            return this.fingerprint;
        },

        async checkPrivateMode() {
            let detectionSignal = '';
            let signals = [];

            try {
                if (window.SharedWorker) {
                    try {
                        const blob = new Blob([''], { type: 'application/javascript' });
                        const url = URL.createObjectURL(blob);
                        const w = new SharedWorker(url);
                        w.onerror = () => { };
                        URL.revokeObjectURL(url);
                    } catch (e) {
                        signals.push('A');
                    }
                }

                if (navigator.storage && navigator.storage.estimate) {
                    try {
                        const { quota } = await navigator.storage.estimate();
                        if (quota > 0 && quota < 800000000) signals.push('B');
                    } catch (e) { console.warn("Non-critical error:", e); }
                }

                if ('caches' in window) {
                    try {
                        await caches.open('_ym_probe');
                        await caches.delete('_ym_probe');
                    } catch (e) {
                        signals.push('C');
                    }
                }

                try {
                    const testKey = '_ym_lock_' + Date.now();
                    localStorage.setItem(testKey, '1');
                    localStorage.removeItem(testKey);
                } catch (e) {
                    signals.push('D');
                }

                if ('serviceWorker' in navigator) {
                    try {
                        const blob = new Blob(['// probe'], { type: 'application/javascript' });
                        const url = URL.createObjectURL(blob);
                        await navigator.serviceWorker.register(url);
                        URL.revokeObjectURL(url);
                    } catch (e) {
                        const msg = (e.message || "").toLowerCase();
                        if (e.name === 'SecurityError' || msg.includes('incognito') || msg.includes('guest') || msg.includes('not supported')) {
                            signals.push('E');
                        }
                    }
                }

                if (window.webkitRequestFileSystem) {
                    await new Promise(resolve => {
                        window.webkitRequestFileSystem(window.TEMPORARY, 1, () => resolve(), (e) => {
                            signals.push('F');
                            resolve();
                        });
                    });
                }

            } catch (e) {
                console.warn('[Security] Detection error:', e);
            }

            const hasWorkersFail = signals.includes('E') && signals.includes('A');
            const hasFileSystemFail = signals.includes('F');

            let isPrivate = signals.includes('C') || hasWorkersFail || (signals.length >= 3 && hasFileSystemFail) || (signals.length >= 4);

            if (signals.length > 0) {
                window.debugLog('[Security] Detected Signals: ' + signals.join(', '));
                window.debugLog('[Security] Private Mode Evaluation: ' + (isPrivate ? '🔒 ACTIVE' : '✅ NORMAL'));
            }

            if (window.location.protocol === 'file:') {
                isPrivate = false;
            }

            detectionSignal = signals.join(',');

            if (isPrivate) {
                window.debugLog('[Security] Private Mode Status: 🔒 ACTIVE (Signals: ' + detectionSignal + ')');
            }
        }
    };

    window.YatrAmoreSecurity = Security;
    Security.initDeviceId();
    Security.checkPrivateMode();

    window.addEventListener("scroll", () => {
        if (!isScrolling) {
            isScrolling = true;
            window.requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    navbar.classList.add("scrolled");
                } else {
                    navbar.classList.remove("scrolled");
                }
                isScrolling = false;
            });
        }
    }, { passive: true });

    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            const icon = hamburger.querySelector("i");
            if (navLinks.classList.contains("active")) {
                icon.classList.remove("fa-bars");
                icon.classList.add("fa-times");
            } else {
                icon.classList.remove("fa-times");
                icon.classList.add("fa-bars");
            }
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("active");
                const icon = hamburger.querySelector("i");
                icon.classList.remove("fa-times");
                icon.classList.add("fa-bars");
            });
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href");
            if (targetId === "#") return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                    top: targetPosition - navHeight,
                    behavior: "smooth"
                });
            }
        });
    });

    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    document.querySelectorAll(".feature-card, .social-card").forEach(card => {
        card.style.opacity = "0";
        card.style.transform = "translateY(40px)";
        card.style.transition = "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)";
        revealObserver.observe(card);
    });

    const heroLogo = document.getElementById("hero-logo");
    if (heroLogo) {
        let isMoving = false;

        document.addEventListener("mousemove", (e) => {
            if (!isMoving) {
                isMoving = true;
                window.requestAnimationFrame(() => {
                    const rotateY = (window.innerWidth / 2 - e.pageX) / 50;
                    const rotateX = (window.innerHeight / 2 - e.pageY) / 50;
                    if (heroLogo) heroLogo.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
                    isMoving = false;
                });
            }
        }, { passive: true });

        document.addEventListener("mouseleave", () => {
            heroLogo.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg)";
            heroLogo.style.transition = "all 0.5s ease";
        });

        document.addEventListener("mouseenter", () => {
            heroLogo.style.transition = "none";
        });
    }

    const contactForm = document.querySelector(".contact-form");
    if (contactForm) {
        const emailInput = document.getElementById("email");
        const verifyBtn = document.getElementById("verify-email-btn");
        const otpGroup = document.getElementById("otp-group");
        const otpInput = document.getElementById("otp_code");
        const submitBtn = document.getElementById("contact-submit-btn");

        let isEmailVerified = false;
        let verifiedForEmail = '';
        let trustCheckId = 0;

        const markVerified = (email) => {
            isEmailVerified = true;
            verifiedForEmail = email || emailInput.value.toLowerCase().trim();
            verifyBtn.innerText = "Verified ✓";
            verifyBtn.style.background = "#4CAF50";
            verifyBtn.disabled = true;
            otpGroup.style.display = "none";
        };

        const resetVerified = () => {
            isEmailVerified = false;
            verifiedForEmail = '';
            verifyBtn.disabled = false;
            verifyBtn.innerText = "Verify";
            verifyBtn.style.background = "";
        };

        const checkTrust = async () => {
            const email = emailInput.value.toLowerCase().trim();

            if (!email || !email.includes("@")) {
                resetVerified();
                return;
            }

            if (isEmailVerified && email === verifiedForEmail) return;

            if (verifiedForEmail && email !== verifiedForEmail) {
                resetVerified();
            }

            const thisCheckId = ++trustCheckId;

            const fp = await YatrAmoreSecurity.getFingerprint();
            if (thisCheckId !== trustCheckId) return;

            const trustKey = `ym_trust_${fp}_${email}`;
            const trustTs = localStorage.getItem(trustKey);

            if (trustTs && (Date.now() - parseInt(trustTs)) < (20 * 86400000)) {
                markVerified(email);
                return;
            }

            try {
                const resp = await fetch(gasUrl('contact'), {
                    method: 'POST',
                    body: JSON.stringify({
                        action: "checkTrust",
                        email: email,
                        fingerprint: fp,
                        deviceId: localStorage.getItem('yatramore_device_id')
                    })
                });
                if (thisCheckId !== trustCheckId) return;
                const result = await resp.json();
                window.debugLog('[Trust] Server response for', email, ':', result);
                if (result.success && result.trusted) {
                    localStorage.setItem(trustKey, Date.now().toString());
                    markVerified(email);
                    return;
                }
            } catch (e) {
                console.warn('[Trust] Server check failed:', e.message);
            }

            if (thisCheckId !== trustCheckId) return;

            isEmailVerified = false;
            verifyBtn.disabled = false;
            verifyBtn.innerText = "Verify";
            verifyBtn.style.background = "";
        };

        let trustTimeout;
        const debouncedCheckTrust = () => {
            clearTimeout(trustTimeout);
            const currentEmail = emailInput.value.toLowerCase().trim();
            if (verifiedForEmail && currentEmail !== verifiedForEmail) {
                resetVerified();
            }
            if (!currentEmail || !currentEmail.includes("@")) {
                resetVerified();
                return;
            }
            trustTimeout = setTimeout(checkTrust, 600);
        };

        emailInput.addEventListener("change", checkTrust);
        emailInput.addEventListener("input", debouncedCheckTrust);

        if (verifyBtn) {
            const OTP_COOLDOWN_KEY = 'ym_otp_cooldown';
            const OTP_COOLDOWN_MS = 10 * 60 * 1000;

            const checkOtpCooldown = () => {
                const lastReq = parseInt(sessionStorage.getItem(OTP_COOLDOWN_KEY) || '0');
                const elapsed = Date.now() - lastReq;
                if (elapsed < OTP_COOLDOWN_MS) {
                    const minsLeft = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 60000);
                    verifyBtn.innerText = `Wait ${minsLeft}m`;
                    verifyBtn.disabled = true;
                    verifyBtn.style.background = "#999";
                    otpGroup.style.display = "block";
                    return true;
                }
                return false;
            };

            checkOtpCooldown();

            verifyBtn.addEventListener("click", async () => {
                const email = emailInput.value.trim();
                if (!email || !email.includes("@")) return window.showToast("Please enter a valid email first.", false);

                if (checkOtpCooldown()) return;

                verifyBtn.innerText = "...";
                verifyBtn.disabled = true;

                const fp = await YatrAmoreSecurity.getFingerprint();
                try {
                    const resp = await fetch(gasUrl('contact'), {
                        method: 'POST',
                        body: JSON.stringify({
                            action: "requestCode",
                            email: email,
                            fingerprint: fp
                        })
                    });
                    const result = await resp.json();

                    if (result.success) {
                        sessionStorage.setItem(OTP_COOLDOWN_KEY, Date.now().toString());
                        otpGroup.style.display = "block";
                        verifyBtn.innerText = "Sent ✓";
                        verifyBtn.style.background = "#4CAF50";

                        setTimeout(() => {
                            if (verifyBtn.innerText !== "Verified ✓") {
                                checkOtpCooldown();
                            }
                        }, 60000);
                    } else {
                        window.showToast("Error: " + (result.error || "Could not send code.", false));
                        verifyBtn.innerText = "Verify";
                        verifyBtn.disabled = false;
                    }
                } catch (e) {
                    window.showToast("Verification Service Unavailable.", false);
                    verifyBtn.innerText = "Verify";
                    verifyBtn.disabled = false;
                }
            });
        }

        if (otpInput) {
            otpInput.addEventListener("input", () => {
                if (otpInput.value.length === 6) {
                    markVerified(emailInput.value.toLowerCase().trim());
                }
            });
        }


        contactForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            if (!isEmailVerified) {
                emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                verifyBtn.style.animation = 'none';
                void verifyBtn.offsetWidth;
                verifyBtn.style.animation = 'pulse 0.5s ease 2';
                window.showToast("Please verify your email first by clicking the 'Verify' button.", false);
                return;
            }

            const fp = await YatrAmoreSecurity.getFingerprint();
            const dv = YatrAmoreSecurity.initDeviceId();

            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            data.action = "submitContact";
            data.fingerprint = fp;
            data.deviceId = dv;
            data.userAgent = navigator.userAgent;

            submitBtn.innerText = "Sending...";
            submitBtn.disabled = true;

            try {
                const resp = await fetch(gasUrl('contact'), {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                const result = await resp.json();

                if (result.success) {
                    localStorage.setItem(`ym_trust_${fp}_${data.email.toLowerCase().trim()}`, Date.now().toString());

                    submitBtn.innerText = "Message Sent ✓";
                    submitBtn.style.background = "#4CAF50";
                    this.reset();
                    setTimeout(() => {
                        submitBtn.innerText = "Send Message";
                        submitBtn.style.background = "";
                        submitBtn.disabled = false;
                        resetVerified();
                    }, 5000);
                } else {
                    window.showToast("Submission Failed: " + (result.error || "Check your verification code.", false));
                    submitBtn.innerText = "Try Again";
                    submitBtn.disabled = false;
                }
            } catch (err) {
                window.showToast("Connection Error. Please try again.", false);
                submitBtn.innerText = "Send Message";
                submitBtn.disabled = false;
            }
        });
    }

    const visitorCountElement = document.getElementById("visitor-count");
    if (visitorCountElement) {
        const BASE_COUNT = 2600;
        const SESSION_KEY = 'ym_counted';
        const CACHE_KEY = 'ym_visitor_count';

        if (sessionStorage.getItem(SESSION_KEY)) {
            const cached = localStorage.getItem(CACHE_KEY);
            visitorCountElement.innerText = cached || BASE_COUNT.toLocaleString();
        } else {
            fetch(gasUrl('counter'), {
                method: "GET",
                mode: "cors",
                redirect: "follow",
                cache: "no-cache"
            })
                .then(response => response.json())
                .then(data => {
                    if (data && data.success && data.count) {
                        const totalVisits = BASE_COUNT + data.count;
                        const formatted = totalVisits.toLocaleString();
                        visitorCountElement.innerText = formatted;
                        localStorage.setItem(CACHE_KEY, formatted);
                        sessionStorage.setItem(SESSION_KEY, '1');
                    }
                })
                .catch(error => {
                    console.warn("Counter error:", error);
                    visitorCountElement.innerText = BASE_COUNT.toLocaleString();
                });
        }
    }

    function fetchFamilyTreeData(force = false) {
        const CACHE_KEY = "yatramore_family_tree_cache";
        const SESSION_READY_KEY = "yatramore_family_tree_session_ready";

        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.php');
        const hasCache = localStorage.getItem(CACHE_KEY);

        if (!isHomePage && hasCache && !force) {
            return;
        }

        if (window._familyTreeFetchInFlight) return;
        window._familyTreeFetchInFlight = true;

        const callbackName = 'preFetchCallback_' + Date.now();
        const scriptURL = gasUrl('family');

        window[callbackName] = function (data) {
            delete window[callbackName];
            const scriptTag = document.getElementById('family-prefetch-script');
            if (scriptTag) document.body.removeChild(scriptTag);
            window._familyTreeFetchInFlight = false;

            if (Array.isArray(data)) {
                const oldDataRaw = localStorage.getItem(CACHE_KEY);
                const oldData = oldDataRaw ? JSON.parse(oldDataRaw) : [];

                const isDifferent = JSON.stringify(data) !== JSON.stringify(oldData);

                if (isDifferent) {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                    sessionStorage.setItem(SESSION_READY_KEY, "true");
                    window.debugLog(`[Global] Family Tree cache updated (${data.length} members).`);
                } else {
                    sessionStorage.setItem(SESSION_READY_KEY, "true");
                }

                localStorage.setItem('yatramore_last_sync_time', Date.now().toString());

                window.dispatchEvent(new CustomEvent('yatramore_family_tree_updated', { detail: data }));
            }
        };

        const script = document.createElement('script');
        script.id = 'family-prefetch-script';
        script.src = `${scriptURL}?callback=${callbackName}&action=getMembers&t=${Date.now()}`;

        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => document.body.appendChild(script));
        } else {
            setTimeout(() => document.body.appendChild(script), 1000);
        }
    }
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const lastSync = parseInt(localStorage.getItem('yatramore_last_sync_time') || '0');
            const COOLDOWN = 30 * 60 * 1000;
            if (Date.now() - lastSync > COOLDOWN) {
                fetchFamilyTreeData(true);
            }
        }
    });

    fetchFamilyTreeData();


    const accFab = document.getElementById("accessibility-fab");
    const accMenu = document.querySelector(".accessibility-menu");

    if (accFab && accMenu) {
        accFab.addEventListener("click", () => {
            const shareMenu = document.querySelector(".share-menu");
            const shareFab = document.getElementById("share-toggle");
            if (shareMenu && shareMenu.classList.contains("active")) {
                shareMenu.classList.remove("active");
                if (shareFab) shareFab.innerHTML = '<i class="fas fa-share-alt"></i>';
            }

            accMenu.classList.toggle("active");
            if (accMenu.classList.contains("active")) {
                accMenu.style.display = "block";
                accFab.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                accMenu.style.display = "none";
                accFab.innerHTML = '<i class="fas fa-universal-access"></i>';
            }
        });

        document.addEventListener("click", (e) => {
            if (!accFab.contains(e.target) && !accMenu.contains(e.target)) {
                accMenu.classList.remove("active");
                accMenu.style.display = "none";
                accFab.innerHTML = '<i class="fas fa-universal-access"></i>';
            }
        });
    }

    const shareFab = document.getElementById("share-toggle");
    const shareMenu = document.querySelector(".share-menu");
    const shareToast = document.getElementById("share-toast");

    if (shareFab && shareMenu) {
        const shareData = {
            title: 'YatrAmore',
            text: 'Discover YatrAmore — A journey of love, culture, and travel between worlds.',
            url: window.location.href
        };

        const updateSocialLinks = () => {
            let shareUrl = window.location.href;
            if (shareUrl.startsWith('file://')) {
                shareUrl = 'https://yatramore.com';
            }

            const currentUrl = encodeURIComponent(shareUrl);
            const shareText = encodeURIComponent(shareData.text);

            const whatsappBtn = document.getElementById("share-whatsapp");
            const facebookBtn = document.getElementById("share-facebook");
            const instagramBtn = document.getElementById("share-instagram");
            const tiktokBtn = document.getElementById("share-tiktok");

            const whatsappIntent = `https://api.whatsapp.com/send?text=${shareText}%20${currentUrl}`;
            const facebookIntent = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;

            const handleSocialClick = (btn, url) => {
                if (!btn) return;
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);

                newBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    window.open(url, '_blank', 'noopener,noreferrer');
                });
            };

            handleSocialClick(whatsappBtn, whatsappIntent);
            handleSocialClick(facebookBtn, facebookIntent);

            if (instagramBtn) instagramBtn.setAttribute("href", "https://www.instagram.com/yatramore.official");
            if (tiktokBtn) tiktokBtn.setAttribute("href", "https://www.tiktok.com/@yatramore.official");
        };

        updateSocialLinks();

        shareFab.addEventListener("click", async () => {
            if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                try {
                    await navigator.share(shareData);
                    shareMenu.classList.remove("active");
                    shareFab.innerHTML = '<i class="fas fa-share-alt"></i>';
                    return;
                } catch (err) {
                }
            }

            updateSocialLinks();

            if (accMenu) {
                accMenu.classList.remove("active");
                accMenu.style.display = "none";
                if (accFab) accFab.innerHTML = '<i class="fas fa-universal-access"></i>';
            }

            shareMenu.classList.toggle("active");
            shareFab.innerHTML = shareMenu.classList.contains("active")
                ? '<i class="fas fa-times"></i>'
                : '<i class="fas fa-share-alt"></i>';
        });

        document.addEventListener("click", (e) => {
            if (!shareFab.contains(e.target) && !shareMenu.contains(e.target)) {
                shareMenu.classList.remove("active");
                shareFab.innerHTML = '<i class="fas fa-share-alt"></i>';
            }
        });

        const showToast = (msg) => {
            if (!shareToast) return;
            shareToast.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
            shareToast.classList.add("show");
            setTimeout(() => shareToast.classList.remove("show"), 2500);
        };

        const copyBtn = document.getElementById("share-copy-link");
        if (copyBtn) {
            copyBtn.addEventListener("click", () => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    showToast("Link copied to clipboard!");
                });
            });
        }

        const socialCopyOpen = (id, platform) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener("click", () => {
                    if (window.innerWidth > 768) {
                        navigator.clipboard.writeText(window.location.href);
                        showToast(`Linked copied! Open ${platform}..`);
                    }
                });
            }
        };
        socialCopyOpen("share-instagram", "Instagram");
        socialCopyOpen("share-tiktok", "TikTok");
    }

    const zoomInBtn = document.getElementById("zoom-in");
    const zoomOutBtn = document.getElementById("zoom-out");
    const zoomResetBtn = document.getElementById("zoom-reset");

    const updateZoom = () => {
        document.documentElement.style.setProperty("--zoom-scale", currentZoom);
        localStorage.setItem('ym_zoom_level', currentZoom);
    };

    if (zoomInBtn) {
        zoomInBtn.addEventListener("click", () => {
            if (currentZoom < 1.5) {
                currentZoom += 0.1;
                updateZoom();
            }
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener("click", () => {
            if (currentZoom > 0.8) {
                currentZoom -= 0.1;
                updateZoom();
            }
        });
    }

    if (zoomResetBtn) {
        zoomResetBtn.addEventListener("click", () => {
            currentZoom = 1;
            updateZoom();
        });
    }

    const themeToggle = document.getElementById("theme-toggle");
    const htmlElement = document.documentElement;

    const currentTheme = htmlElement.getAttribute("data-theme") || "light";
    updateThemeIcon(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const theme = htmlElement.getAttribute("data-theme");
            const newTheme = theme === "dark" ? "light" : "dark";

            htmlElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        const toggleIcon = document.querySelector("#theme-toggle i");
        if (toggleIcon) {
            if (theme === "dark") {
                toggleIcon.classList.remove("fa-moon");
                toggleIcon.classList.add("fa-sun");
            } else {
                toggleIcon.classList.remove("fa-sun");
                toggleIcon.classList.add("fa-moon");
            }
        }
    }

    const languages = [
        { name: "English", code: "en" },
        { name: "Italiano (Italian)", code: "it" },
        { name: "हिन्दी (Hindi)", code: "hi" },
        { name: "ਪੰਜਾਬੀ (Punjabi)", code: "pa" },
        { name: "தமிழ் (Tamil)", code: "ta" },
        { name: "తెలుగు (Telugu)", code: "te" },
        { name: "മലയാളം (Malayalam)", code: "ml" },
        { name: "ಕನ್ನಡ (Kannada)", code: "kn" },
        { name: "বাংলা (Bengali)", code: "bn" },
        { name: "ગુજરાતી (Gujarati)", code: "gu" },
        { name: "मराठी (Marathi)", code: "mr" },
        { name: "اردو (Urdu)", code: "ur" },
        { name: "Français (French)", code: "fr" },
        { name: "Español (Spanish)", code: "es" },
        { name: "Deutsch (German)", code: "de" },
        { name: "Português (Portuguese)", code: "pt" },
        { name: "Nederlands (Dutch)", code: "nl" },
        { name: "Русский (Russian)", code: "ru" },
        { name: "日本語 (Japanese)", code: "ja" },
        { name: "한국어 (Korean)", code: "ko" },
        { name: "中文 (Chinese Simplified)", code: "zh-CN" },
        { name: "中文 (Chinese Traditional)", code: "zh-TW" },
        { name: "العربية (Arabic)", code: "ar" },
        { name: "Türkçe (Turkish)", code: "tr" },
        { name: "Ελληνικά (Greek)", code: "el" },
        { name: "Polski (Polish)", code: "pl" },
        { name: "Tiếng Việt (Vietnamese)", code: "vi" },
        { name: "ไทย (Thai)", code: "th" },
        { name: "Melayu (Malay)", code: "ms" },
        { name: "Filipino", code: "tl" },
        { name: "Indonesian", code: "id" },
        { name: "Svenska (Swedish)", code: "sv" },
        { name: "Norsk (Norwegian)", code: "no" },
        { name: "Dansk (Danish)", code: "da" },
        { name: "Suomi (Finnish)", code: "fi" },
        { name: "Magyar (Hungarian)", code: "hu" },
        { name: "Čeština (Czech)", code: "cs" },
        { name: "Slovenčina (Slovak)", code: "sk" },
        { name: "Română (Romanian)", code: "ro" },
        { name: "Български (Bulgarian)", code: "bg" },
        { name: "Hrvatski (Croatian)", code: "hr" },
        { name: "Srpski (Serbian)", code: "sr" },
        { name: "Slovenščina (Slovenian)", code: "sl" },
        { name: "Eesti (Estonian)", code: "et" },
        { name: "Latviešu (Latvian)", code: "lv" },
        { name: "Lietuvių (Lithuanian)", code: "lt" },
        { name: "Українська (Ukrainian)", code: "uk" },
        { name: "עברית (Hebrew)", code: "iw" },
        { name: "فارسی (Persian)", code: "fa" },
        { name: "Afrikaans", code: "af" },
        { name: "Shqip (Albanian)", code: "sq" },
        { name: "Հայերեն (Armenian)", code: "hy" },
        { name: "Azərbaycan (Azerbaijani)", code: "az" },
        { name: "Euskara (Basque)", code: "eu" },
        { name: "Беларуская (Belarusian)", code: "be" },
        { name: "Bosanski (Bosnian)", code: "bs" },
        { name: "Català (Catalan)", code: "ca" },
        { name: "Cebuano", code: "ceb" },
        { name: "Corsu (Corsican)", code: "co" },
        { name: "Esperanto", code: "eo" },
        { name: "Frysk (Frisian)", code: "fy" },
        { name: "Galego (Galician)", code: "gl" },
        { name: "ka (Georgian)", code: "ka" },
        { name: "Kreyòl Ayisyen (Haitian Creole)", code: "ht" },
        { name: "Hausa", code: "ha" },
        { name: "Hawaiʻi (Hawaiian)", code: "haw" },
        { name: "Isizulu (Zulu)", code: "zu" },
        { name: "Íslenska (Icelandic)", code: "is" },
        { name: "Igbo", code: "ig" },
        { name: "Gaeilge (Irish)", code: "ga" },
        { name: "Basa Jawa (Javanese)", code: "jw" },
        { name: "Қазақ тілі (Kazakh)", code: "kk" },
        { name: "ខ្មែរ (Khmer)", code: "km" },
        { name: "Kurdî (Kurdish)", code: "ku" },
        { name: "Kyrgyz", code: "ky" },
        { name: "ລາວ (Lao)", code: "lo" },
        { name: "Latina (Latin)", code: "la" },
        { name: "Lëtzebuergesch (Luxembourgish)", code: "lb" },
        { name: "Македонски (Macedonian)", code: "mk" },
        { name: "Malagasy", code: "mg" },
        { name: "Malti (Maltese)", code: "mt" },
        { name: "Maori", code: "mi" },
        { name: "Монгол (Mongolian)", code: "mn" },
        { name: "ဗမာ (Myanmar)", code: "my" },
        { name: "नेपाली (Nepali)", code: "ne" },
        { name: "ଓଡ଼ିଆ (Odia)", code: "or" },
        { name: "پښتو (Pashto)", code: "ps" },
        { name: "Gàidhlig (Scots Gaelic)", code: "gd" },
        { name: "Sesotho", code: "st" },
        { name: "Shona", code: "sn" },
        { name: "سنڌي (Sindhi)", code: "sd" },
        { name: "සිංහල (Sinhala)", code: "si" },
        { name: "Somali", code: "so" },
        { name: "Basa Sunda (Sundanese)", code: "su" },
        { name: "Kiswahili (Swahili)", code: "sw" },
        { name: "Тоҷикӣ (Tajik)", code: "tg" },
        { name: "تاتار (Tatar)", code: "tt" },
        { name: "بོད་སྐད་ (Tibetan)", code: "bo" },
        { name: "Türkmen (Turkmen)", code: "tk" },
        { name: "ئۇيغۇرچە (Uyghur)", code: "ug" },
        { name: "Oʻzbek (Uzbek)", code: "uz" },
        { name: "Cymraeg (Welsh)", code: "cy" },
        { name: "Isixhosa (Xhosa)", code: "xh" },
        { name: "ייִדיש (Yiddish)", code: "yi" },
        { name: "Yorùbá (Yoruba)", code: "yo" }
    ];

    const translatePage = (langCode) => {
        if (langCode === 'en' || !langCode) {
            sessionStorage.removeItem('ym_translation_lang');
            window._setOrClearGoogleCookie('en');
            setTimeout(() => window.location.reload(), 100);
        } else {
            sessionStorage.setItem('ym_translation_lang', langCode);
            window._setOrClearGoogleCookie(langCode);
            const combo = document.querySelector(".goog-te-combo");
            if (combo) {
                combo.value = langCode;
                combo.dispatchEvent(new Event("change", { bubbles: true }));
            } else {
                console.log("Translate widget not fully loaded, reloading...");
                setTimeout(() => window.location.reload(), 100);
            }
        }
    };

    const navLangBtn = document.getElementById("nav-lang-btn");
    const navLangDropdown = document.getElementById("nav-lang-dropdown");
    const navLangWrapper = document.getElementById("nav-lang-wrapper");
    const navLangSearch = document.getElementById("nav-language-search");
    const navLangResults = document.getElementById("nav-language-results");

    const renderNavResults = (filter = "") => {
        if (!navLangResults) return;
        const filtered = languages.filter(l =>
            l.name.toLowerCase().includes(filter.toLowerCase())
        );
        navLangResults.innerHTML = filtered.map(l => `
            <div class="nav-lang-item" data-code="${l.code}">${l.name}</div>
        `).join("");
        navLangResults.classList.toggle("active", filtered.length > 0);
    };

    const closeNavLangDropdown = () => {
        if (!navLangDropdown) return;
        navLangDropdown.classList.remove("active");
        if (navLangBtn) navLangBtn.setAttribute("aria-expanded", "false");
        if (navLangSearch) navLangSearch.value = "";
        if (navLangResults) navLangResults.classList.remove("active");
    };

    if (navLangBtn && navLangDropdown) {
        navLangDropdown.addEventListener("click", (e) => e.stopPropagation());

        navLangBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = navLangDropdown.classList.contains("active");

            const shareMenu = document.querySelector(".share-menu");
            const shareFab = document.getElementById("share-toggle");
            const accMenu = document.querySelector(".accessibility-menu");
            const accFab = document.getElementById("accessibility-fab");
            if (shareMenu && shareMenu.classList.contains("active")) {
                shareMenu.classList.remove("active");
                if (shareFab) shareFab.innerHTML = '<i class="fas fa-share-alt"></i>';
            }
            if (accMenu && accMenu.classList.contains("active")) {
                accMenu.classList.remove("active");
                accMenu.style.display = "none";
                if (accFab) accFab.innerHTML = '<i class="fas fa-universal-access"></i>';
            }

            if (!isOpen) {
                navLangDropdown.classList.add("active");
                navLangBtn.setAttribute("aria-expanded", "true");
                renderNavResults("");
                setTimeout(() => { if (navLangSearch) navLangSearch.focus(); }, 150);
            } else {
                closeNavLangDropdown();
            }
        });

        document.addEventListener("click", (e) => {
            if (navLangWrapper && !navLangWrapper.contains(e.target)) {
                closeNavLangDropdown();
            }
        });

        if (navLangSearch) {
            navLangSearch.addEventListener("input", (e) => {
                renderNavResults(e.target.value);
            });
        }

        if (navLangResults) {
            navLangResults.addEventListener("click", (e) => {
                const item = e.target.closest(".nav-lang-item");
                if (item) {
                    translatePage(item.dataset.code);
                    closeNavLangDropdown();
                }
            });
        }
    }

    let translationActiveConfirmed = false;
    setInterval(() => {
        const htmlClass = document.documentElement.className || '';
        if (htmlClass.includes('translated-')) {
            translationActiveConfirmed = true;
        } else if (translationActiveConfirmed && !htmlClass.includes('translated-')) {
            if (sessionStorage.getItem('ym_translation_lang')) {
                window.debugLog("Native Google UI translation cancelled. Syncing state without reload...");
                sessionStorage.removeItem('ym_translation_lang');
                window._setOrClearGoogleCookie('en');
                translationActiveConfirmed = false;
            }
        }
    }, 500);





    async function loadCollaborators() {
        const collaboratorGrid = document.getElementById("collaborator-grid");
        const collaboratorPageGrid = document.getElementById("collaborator-page-grid");
        const loadingNotice = document.getElementById("loading-collaborators");
        const noCollaboratorsNotice = document.getElementById("no-collaborators-notice");

        if (!collaboratorGrid && !collaboratorPageGrid) return;

        let data = (typeof COLLABORATOR_DATA !== 'undefined') ? COLLABORATOR_DATA : [];

        if (!data || data.length === 0) {
            if (loadingNotice) loadingNotice.style.display = "none";
            if (noCollaboratorsNotice) noCollaboratorsNotice.style.display = "block";
            return;
        }

        const renderCard = (collaborator) => {
            const s = {
                category: YatrAmore.sanitize(collaborator.category || ''),
                title: YatrAmore.sanitize(collaborator.title || ''),
                location: YatrAmore.sanitize(collaborator.location || ''),
                description: YatrAmore.sanitize(collaborator.description || '')
                    .replace(/&lt;br\/?&gt;/gi, '<br>')
                    .replace(/&lt;strong&gt;/gi, '<strong>')
                    .replace(/&lt;\/strong&gt;/gi, '</strong>')
                    .replace(/&amp;nbsp;/g, '&nbsp;'),
                image: (collaborator.image || '').replace(/[<>"]/g, ''),
                date: YatrAmore.sanitize(collaborator.date || ''),
                nights: collaborator.nights ? YatrAmore.sanitize(collaborator.nights) : '',
                wardrobe: collaborator.Wardrobe ? YatrAmore.sanitize(collaborator.Wardrobe) : '',
                product: collaborator.Product ? YatrAmore.sanitize(collaborator.Product) : '',
                camera: collaborator.Camera ? YatrAmore.sanitize(collaborator.Camera) : '',
                menu: collaborator.Menu ? YatrAmore.sanitize(collaborator.Menu) : '',
                gift: (collaborator.Gift || collaborator.Gifts || collaborator.Products) ? YatrAmore.sanitize(collaborator.Gift || collaborator.Gifts || collaborator.Products) : '',
                collab: collaborator.Collab ? YatrAmore.sanitize(collaborator.Collab) : '',
                rating: YatrAmore.sanitize(collaborator.rating || collaborator.love || ''),
                status: YatrAmore.sanitize(collaborator.status || 'Partner'),
                tags: (collaborator.tags || []).map(t => YatrAmore.sanitize(t)),
                weblink: collaborator.weblink ? collaborator.weblink.replace(/[<>"]/g, '') : '',
                whatsappClub: collaborator.whatsappClub ? collaborator.whatsappClub.replace(/[<>"]/g, '') : ''
            };

            let middleMetaHTML = '';
            if (s.nights) {
                middleMetaHTML = `
                <div class="card-meta-item">
                    <i class="fas fa-moon"></i>
                    <span>${s.nights}</span>
                </div>`;
            } else if (s.wardrobe) {
                middleMetaHTML = `
                <div class="card-meta-item">
                    <i class="fas fa-tshirt"></i>
                    <span>${s.wardrobe}</span>
                </div>`;
            } else if (s.product) {
                middleMetaHTML = `
                <div class="card-meta-item">
                    <i class="fas fa-wine-bottle" style="transform: rotate(45deg);"></i>
                    <span>${s.product}</span>
                </div>`;
            } else if (s.camera) {
                middleMetaHTML = `
                <div class="card-meta-item">
                    <i class="fas fa-video"></i>
                    <span>${s.camera}</span>
                </div>`;
            } else if (s.menu) {
                middleMetaHTML = `
                <div class="card-meta-item">
                    <i class="fas fa-utensils"></i>
                    <span>${s.menu}</span>
                </div>`;
            } else if (s.collab) {
                middleMetaHTML = `
                <div class="card-meta-item">
                    <i class="fas fa-handshake"></i>
                    <span>${s.collab}</span>
                </div>`;
            } else if (s.gift) {
                middleMetaHTML = `
                <div class="card-meta-item">
                    <i class="fas fa-gift"></i>
                    <span>${s.gift}</span>
                </div>`;
            }

            const hasRealImage = collaborator.image && collaborator.image !== 'Images/logo.svg' && collaborator.image.includes('.');

            const imageHTML = hasRealImage ? `
                <img src="${s.image}" alt="${s.title}" 
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            ` : `
                <div class="card-image-placeholder">
                    <i class="fas fa-camera"></i>
                    <span>Coming Soon</span>
                    <span class="example-notice">Showcase Example Card</span>
                </div>
            `;

            return `
            <article class="travel-card glass" data-category="${s.category}" data-is-collaborator="true"${s.weblink ? ` data-weblink="${s.weblink}" style="cursor:pointer;"` : ''}>
                <div class="card-image-wrapper">
                    ${imageHTML}
                    <div class="card-badge">
                        <i class="fas fa-map-marker-alt"></i> ${s.category}
                    </div>
                    <div class="partner-badge">
                        <i class="fas fa-star"></i> ${s.status}
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-location">
                        <i class="fas fa-map-pin"></i>
                        <span>${s.location}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; gap: 10px;">
                        <h2 class="card-title" style="margin-bottom: 0;">${s.title}</h2>
                        ${s.whatsappClub ? `<a href="${s.whatsappClub}" target="_blank" rel="noopener noreferrer" class="whatsapp-btn" style="background: rgba(37, 211, 102, 0.1); color: #25D366; border: 1px solid rgba(37, 211, 102, 0.4); border-radius: 20px; padding: 8px 14px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: inline-flex; align-items: center; gap: 5px; text-decoration: none; transition: all 0.3s ease; white-space: nowrap; flex-shrink: 0;" onmouseover="this.style.background='rgba(37, 211, 102, 0.2)'" onmouseout="this.style.background='rgba(37, 211, 102, 0.1)'"><i class="fab fa-whatsapp" style="font-size: 1rem;"></i> JOIN CLUB</a>` : ''}
                    </div>
                    <p class="card-description">${s.description}</p>
                    <div class="card-meta">
                        <div class="card-meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${s.date}</span>
                        </div>
                        ${middleMetaHTML}
                        <div class="card-meta-item">
                            <i class="fas fa-heart"></i>
                            <span>${s.rating}</span>
                        </div>
                    </div>
                    <div class="card-tags">
                        ${s.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </article>
        `;
        };

        const cardsHTML = data.map(renderCard).join('');

        if (loadingNotice) loadingNotice.style.display = "none";

        const attachWeblinkListeners = (container) => {
            container.querySelectorAll('.travel-card[data-weblink]').forEach(card => {
                card.addEventListener('click', () => {
                    window.open(card.dataset.weblink, '_blank', 'noopener,noreferrer');
                });
            });
        };

        if (collaboratorGrid) {
            collaboratorGrid.innerHTML = cardsHTML;
            attachWeblinkListeners(collaboratorGrid);

            const currentFilterBtn = document.querySelector('.filter-btn.active');
            if (currentFilterBtn) {
                const filter = currentFilterBtn.dataset.filter;
                const newCards = collaboratorGrid.querySelectorAll('.travel-card');
                newCards.forEach(card => {
                    const category = card.dataset.category || '';
                    const isCollaborator = card.getAttribute('data-is-collaborator') === 'true';

                    const shouldShow = (filter !== 'All' && category === filter);

                    if (!shouldShow) {
                        card.style.display = 'none';
                        card.style.opacity = '0';
                    }
                });
            }
        }

        if (collaboratorPageGrid) {
            collaboratorPageGrid.innerHTML = cardsHTML;
            attachWeblinkListeners(collaboratorPageGrid);
        }

        const revealOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, revealOptions);

        const targetGrid = collaboratorGrid || collaboratorPageGrid;
        if (targetGrid) {
            const cards = targetGrid.querySelectorAll('.travel-card');
            cards.forEach(card => {
                revealObserver.observe(card);

                setTimeout(() => {
                    if (!card.classList.contains('revealed')) card.classList.add('revealed');
                }, 2000);
            });
        }
    }



    loadCollaborators();

    function initPolicyPage() {
        const policyContent = document.querySelector('.policy-content');
        const policySections = document.querySelectorAll('.policy-section h2');

        if (policyContent && policySections.length > 0) {
            policySections.forEach((heading, i) => {
                heading.id = `policy-section-${i + 1}`;
            });

            const tocItems = Array.from(policySections).map((heading, i) => {
                const num = (i + 1) + '.';
                const text = heading.textContent.replace(/^\d+\.\s*/, '');
                return `<li><a href="#policy-section-${i + 1}"><span class="toc-num">${num}</span>${YatrAmore.sanitize(text)}</a></li>`;
            }).join('');

            const tocHTML = `
                <nav class="policy-toc glass">
                    <h3><i class="fas fa-list-ul"></i> Table of Contents</h3>
                    <ol>${tocItems}</ol>
                </nav>
            `;

            policyContent.insertAdjacentHTML('afterbegin', tocHTML);

            document.querySelectorAll('.policy-toc a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = document.querySelector(link.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        }
    }
    initPolicyPage();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeYatrAmore);
} else {
    initializeYatrAmore();
}