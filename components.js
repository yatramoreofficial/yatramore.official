window.DEBUG_MODE = false;

window.debugLog = function (...args) {
    if (window.DEBUG_MODE) {
        console.log(...args);
    }
};

window.showToast = function (message, isSuccess = true) {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        toastContainer.style.cssText = "position: fixed; top: 100px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; flex-direction: column; gap: 12px; pointer-events: none; align-items: center;";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");

    const iconClass = isSuccess ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation";
    const bgColor = isSuccess ? "rgba(20, 20, 20, 0.65)" : "rgba(30, 10, 10, 0.65)";
    const borderColor = isSuccess ? "rgba(74, 222, 128, 0.3)" : "rgba(248, 113, 113, 0.3)";
    const shadowColor = isSuccess ? "rgba(74, 222, 128, 0.15)" : "rgba(248, 113, 113, 0.15)";
    const iconColor = isSuccess ? "#4ade80" : "#f87171";

    toast.style.cssText = `
        display: flex;
        align-items: center;
        gap: 14px;
        background: ${bgColor};
        color: #f8fafc;
        padding: 14px 28px 14px 20px;
        border-radius: 50px;
        font-family: "Inter", system-ui, -apple-system, sans-serif;
        font-size: 15px;
        font-weight: 500;
        letter-spacing: 0.2px;
        border: 1px solid ${borderColor};
        box-shadow: 0 10px 40px -10px ${shadowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
        opacity: 0;
        transform: translateY(-30px) scale(0.9);
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    toast.innerHTML = `
        <i class="${iconClass}" style="color: ${iconColor}; font-size: 20px; filter: drop-shadow(0 0 8px ${iconColor});"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateY(0) scale(1)";
        });
    });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-20px) scale(0.95)";
        toast.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};

const YatrAmore = {
    sanitize(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    renderNav(activePage) {
        const nav = document.getElementById('navbar');
        if (!nav) return;

        const links = [
            { href: '/', label: 'Home', anchor: false },
            { href: '/#connect', label: 'Community', anchor: false },
            { href: '/#about', label: 'About', anchor: false },
            { href: '/our-journey', label: 'Journey', anchor: false },
            { href: '/van-life', label: 'VanLife', anchor: false },
            { href: '/collaborator', label: 'Collaborator', anchor: false },
            { href: '/blog', label: 'Story', anchor: false },
            { href: '/vlog', label: 'Vlog', anchor: false },
            { href: '/faq', label: 'FAQ', anchor: false },
            { href: '/#contact', label: 'Contact', anchor: false }
        ];

        const isCupidPage = activePage === 'cupid';
        const cupidIconContent = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 2.6rem; height: 2.6rem;">
            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; overflow: visible;" aria-hidden="true">
                <style>
                    .cupid-wing-left { transform-origin: 40px 50px; animation: flapLeft 0.8s ease-in-out infinite alternate; }
                    .cupid-wing-right { transform-origin: 60px 50px; animation: flapRight 0.8s ease-in-out infinite alternate; }
                    @keyframes flapLeft { 0% { transform: rotate(0deg); } 100% { transform: rotate(15deg) skewY(-15deg); } }
                    @keyframes flapRight { 0% { transform: rotate(0deg); } 100% { transform: rotate(-15deg) skewY(15deg); } }
                    .cupid-heart { transform-origin: 50px 50px; transition: transform 0.3s ease, fill 0.3s ease, stroke 0.3s ease; }
                    .nav-icon-link:hover .cupid-heart { transform: scale(1.15); fill: #f44336; stroke: #f44336; }
                    @keyframes floatCupid { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
                    .cupid-group { animation: floatCupid 2s ease-in-out infinite; }
                </style>
                <g class="cupid-group">
                    <!-- lef-win -->
                    <path class="cupid-wing-left" d="M35 45 C 15 25, 5 35, 10 45 C 5 50, 10 60, 20 55 C 15 65, 25 70, 35 60 Z" fill="transparent" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
                    <!-- rig-win -->
                    <path class="cupid-wing-right" d="M65 45 C 85 25, 95 35, 90 45 C 95 50, 90 60, 80 55 C 85 65, 75 70, 65 60 Z" fill="transparent" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
                    <!-- hea -->
                    <path class="cupid-heart" d="M50 80 C 50 80, 25 55, 25 35 C 25 20, 40 15, 50 25 C 60 15, 75 20, 75 35 C 75 55, 50 80, 50 80 Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
                </g>
            </svg>
            <span id="nav-cupid-notification" style="display: none; position: absolute; top: -2px; right: -2px; font-size: 0.65rem; font-family: sans-serif; background-color: #f44336; color: white; border-radius: 50%; width: 16px; height: 16px; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 0 0 2px var(--bg-nav); font-style: normal; z-index: 10;">0</span>
        </div>`;

        const iconLinks = [
            { href: '/family-tree', label: 'Family Tree', id: 'family-tree', icon: '<style>@keyframes leafWavy { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-15deg); } 75% { transform: rotate(15deg); } } .nav-icon-link:hover .leaf-wavy { animation: leafWavy 1.5s ease-in-out infinite; transform-origin: bottom center; }</style><i class="fa-solid fa-seedling leaf-wavy" style="font-size: 1.6rem;"></i>' },
            { href: '/collaborator#lucky-draw', label: 'Lucky Draw', id: 'lucky-draw', icon: '<svg viewBox="0 0 100 100" style="width: 2.2rem; height: 2.2rem; overflow: visible;" aria-hidden="true"><style>.lucky-wheel-group { transform-origin: 50px 50px; transition: transform 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.15); } .nav-icon-link:hover .lucky-wheel-group { transform: rotate(720deg); }</style><g class="lucky-wheel-group"><circle cx="50" cy="50" r="46" stroke="currentColor" stroke-width="3" fill="none"/><circle cx="50" cy="50" r="43" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="50" cy="50" r="36" stroke="currentColor" stroke-width="14" stroke-dasharray="18.85 18.85" fill="none"/><circle cx="50" cy="50" r="28" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="50" cy="4" r="2.5" fill="currentColor"/><circle cx="50" cy="96" r="2.5" fill="currentColor"/><circle cx="4" cy="50" r="2.5" fill="currentColor"/><circle cx="96" cy="50" r="2.5" fill="currentColor"/><circle cx="17.5" cy="17.5" r="2.5" fill="currentColor"/><circle cx="82.5" cy="82.5" r="2.5" fill="currentColor"/><circle cx="17.5" cy="82.5" r="2.5" fill="currentColor"/><circle cx="82.5" cy="17.5" r="2.5" fill="currentColor"/></g><path d="M 50 1 L 56 12 L 44 12 Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/><text x="50" y="55" font-family="\'Brush Script MT\', \'Pacifico\', cursive" font-weight="normal" font-size="18" text-anchor="middle" fill="currentColor">Lucky</text></svg>' }
        ];

        if (!isCupidPage) {
            iconLinks.push({ href: 'javascript:void(0)', label: 'Matches', id: 'nav-cupid-icon', icon: cupidIconContent });
        }

        const isIndex = activePage === 'index';
        const navLinksHTML = links.map(link => {
            let href = link.href;
            if (isIndex) {
                if (link.href === '/') href = '#home';
                else if (link.href === '/#connect') href = '#connect';
                else if (link.href === '/#about') href = '#about';
                else if (link.href === '/#contact') href = '#contact';
            }

            const linkKey = link.label.toLowerCase().replace(/\s+/g, '-');
            const isSponsorLegacy = (activePage === 'sponsor' && linkKey === 'collaborator');
            const isStory = (activePage === 'blog' && linkKey === 'story');
            const isActive = (activePage === linkKey) || isSponsorLegacy || isStory;
            let activeAttrs = isActive ? ' class="active" aria-current="page"' : '';

            return `<a href="${href}"${activeAttrs}>${link.label}</a>`;
        }).join('\n                ');

        const iconLinksHTML = iconLinks.map(link => {
            const isActive = activePage === link.id;
            const iconClass = isActive ? 'nav-icon-link active' : 'nav-icon-link';
            return `<a href="${link.href}" class="${iconClass}" title="${link.label}" aria-label="${link.label}" ${isActive ? 'aria-current="page"' : ''}>${link.icon}</a>`;
        }).join('\n                ');

        const brandTag = isIndex ? 'div' : 'a';
        const brandAttrs = isIndex
            ? 'class="brand brand-text"'
            : 'href="/" class="brand brand-text" style="text-decoration: none; color: inherit;"';

        const isMatchmaking = window.location.pathname.includes('matchmaking') || window.location.pathname.includes('cupid');
        const chatInboxIconHTML = isMatchmaking ? `
                <!-- cha-inb-ico -->
                <button id="nav-inbox-btn" class="nav-icon-link" title="Inbox" aria-label="Inbox" style="background:none; border:none; padding:0; cursor:pointer; position:relative; color:var(--brand-brown); margin-right: 10px; display:inline-flex; align-items:center; justify-content:center;">
                    ${cupidIconContent}
                </button>` : '';

        nav.innerHTML = `
        <a href="#main-content" class="skip-link">Skip to content</a>
        <div class="container nav-content">
            <${brandTag} ${brandAttrs}>
                <img src="/Images/logo.svg" alt="YatrAmore Nav Logo" class="nav-logo" width="38" height="38">
                YatrAmore
            </${brandTag}>

            <div class="nav-links" id="nav-links">
                ${navLinksHTML}
            </div>

            <div class="nav-right-controls">
                ${iconLinksHTML}
                ${chatInboxIconHTML}
                <div class="nav-lang-wrapper" id="nav-lang-wrapper">
                    <button class="nav-lang-btn" id="nav-lang-btn" title="Translate this page" aria-label="Open language selector" aria-expanded="false">
                        <i class="fas fa-globe"></i>
                        <span class="nav-lang-label">Translate</span>
                    </button>
                    <div class="nav-lang-dropdown" id="nav-lang-dropdown" role="dialog" aria-label="Language selector">
                        <div class="nav-lang-dropdown-header">
                            <i class="fas fa-globe"></i>
                            <div>
                                <strong>Translate Page</strong>
                                <p>Select your language</p>
                            </div>
                        </div>
                        <div class="nav-lang-search-wrap">
                            <i class="fas fa-search nav-lang-search-icon"></i>
                            <input type="text" id="nav-language-search" placeholder="Search language..." autocomplete="off" aria-label="Search languages">
                        </div>
                        <div id="nav-language-results" class="nav-language-results"></div>
                        <div id="google_translate_element" style="display:none !important;"></div>
                    </div>
                </div>
                <div class="hamburger" id="hamburger" role="button" tabindex="0" aria-label="Toggle navigation menu" aria-expanded="false">
                    <i class="fas fa-bars"></i>
                </div>
            </div>
        </div>`;

        if (!document.getElementById('main-content')) {
            const mainTarget = document.querySelector('main') ||
                document.querySelector('.hero, .travel-hero, .faq-hero, .policy-hero, .page-content');
            if (mainTarget) mainTarget.id = 'main-content';
        }

    },

    checkGlobalUnreadMessages: async function () {
    },

    startNotificationPolling: function () {
    },


    renderFooter() {
        const footer = document.querySelector('footer:not(.post-footer)');
        if (!footer) return;

        footer.innerHTML = `
        <div class="container footer-content">
            <div class="footer-header">
                <div class="footer-brand">
                    <span class="brand-text">YatrAmore</span>
                </div>
                <div class="footer-tagline">
                    <p>Laura & Yazavinder sharing love, culture, travel, and life between two worlds</p>
                </div>
            </div>
            <div class="footer-row footer-links">
                <a href="/privacy-policy">Privacy Policy</a>
                <span class="footer-divider">·</span>
                <a href="/terms-of-service">Terms & Conditions</a>
                <span class="footer-divider">·</span>
                <a href="/faq">FAQ</a>
                <span class="footer-divider">·</span>
                <a href="/#contact">Contact Us</a>
            </div>
            <div class="footer-row footer-copyright">
                <p>&copy; 2026 YatrAmore - All rights reserved.</p>
            </div>

            <div class="footer-row footer-visitor">
                <div class="footer-stats">
                    <i class="fas fa-eye"></i> <span id="visitor-count">0</span> visitors
                </div>
            </div>
        </div>`;
    },

    renderAccessibility() {
        const container = document.querySelector('.accessibility-container');
        if (!container) return;

        container.innerHTML = `
        <div class="fab-group">
            <button class="accessibility-fab theme-toggle-fab" id="theme-toggle" title="Toggle Dark/Light Mode" aria-label="Toggle Dark/Light Mode">
                <i class="fas fa-moon"></i>
            </button>
            <button class="accessibility-fab" id="accessibility-fab" title="Accessibility Menu" aria-label="Open Accessibility Menu">
                <i class="fas fa-universal-access"></i>
            </button>
            <button class="accessibility-fab share-fab" id="share-toggle" title="Share YatrAmore" aria-label="Share YatrAmore">
                <i class="fas fa-share-alt"></i>
            </button>
        </div>

        <!-- sha-men -->
        <div class="share-menu glass-card">
            <div class="share-header">
                <h3>Share YatrAmore</h3>
                <p>Choose your platform</p>
            </div>
            <div class="share-options-grid">
                <button class="share-option-btn copy-link-btn" id="share-copy-link" title="Copy Link">
                    <div class="icon-circle"><i class="fas fa-link"></i></div>
                    <span>Copy Link</span>
                </button>
                <button class="share-option-btn whatsapp-btn" id="share-whatsapp" title="Share on WhatsApp">
                    <div class="icon-circle"><i class="fa-brands fa-whatsapp"></i></div>
                    <span>WhatsApp</span>
                </button>
                <button class="share-option-btn facebook-btn" id="share-facebook" title="Share on Facebook">
                    <div class="icon-circle"><i class="fa-brands fa-facebook"></i></div>
                    <span>Facebook</span>
                </button>
                <button class="share-option-btn instagram-btn" id="share-instagram" title="Visit Instagram">
                    <div class="icon-circle"><i class="fa-brands fa-instagram"></i></div>
                    <span>Instagram</span>
                </button>
                <button class="share-option-btn tiktok-btn" id="share-tiktok" title="Visit TikTok">
                    <div class="icon-circle"><i class="fa-brands fa-tiktok"></i></div>
                    <span>TikTok</span>
                </button>
            </div>
        </div>

        <!-- cop-toa -->
        <div id="share-toast" class="share-toast glass">
            <i class="fas fa-check-circle"></i> Link copied to clipboard!
        </div>

        <div class="accessibility-menu">
            <div class="menu-section">
                <h4>Text Size</h4>
                <div class="zoom-controls">
                    <button class="zoom-btn" id="zoom-out" title="Zoom Out">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="zoom-btn" id="zoom-reset" title="Reset Zoom">
                        Reset
                    </button>
                    <button class="zoom-btn" id="zoom-in" title="Zoom In">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>`;
    },

    renderGoogleTranslate() {
        if (window._ytGoogleTranslateLoaded) return;
        window._ytGoogleTranslateLoaded = true;

        window.googleTranslateElementInit = function () {
            new google.translate.TranslateElement({
                pageLanguage: 'en',
                layout: google.translate.TranslateElement.InlineLayout.NONE,
                autoDisplay: false
            }, 'google_translate_element');
        };

        const script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.body.appendChild(script);
    },

    loadCore() {
        if (window._ytCoreLoaded) return;
        window._ytCoreLoaded = true;

        const CORE_VERSION = 'v20';
        const script = document.createElement('script');
        script.src = `/script.js?v=SECURITY_${CORE_VERSION}`;
        document.body.appendChild(script);
    },

    renderAuthModal() {
        if (document.getElementById('auth-modal')) return;

        const container = document.createElement('div');
        container.innerHTML = `
        <div id="auth-overlay" class="auth-overlay"></div>
        <div id="auth-modal" class="auth-modal glass-card">
            <button id="auth-close-btn" class="auth-close-btn" title="Close" aria-label="Close modal">
                <i class="fas fa-times"></i>
            </button>
            <div class="auth-header">
                <h2 style="margin: 0; color: var(--brand-brown); font-family: 'Playfair Display', serif;">Welcome to YatrAmore</h2>
                <p style="color: var(--text-muted); margin-top: 5px;">Join the community today.</p>
            </div>
            
            <div class="auth-tabs">
                <button id="auth-tab-login" class="auth-tab active">Login</button>
                <button id="auth-tab-signup" class="auth-tab">Sign Up</button>
            </div>

            <form id="auth-form" data-mode="login">
                <div id="auth-error" class="auth-error" style="display: none; background: rgba(244, 67, 54, 0.1); color: #F44336; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 0.9rem;"></div>
                
                <div style="position: absolute; opacity: 0; left: -9999px; pointer-events: none;" aria-hidden="true">
                    <input type="text" id="auth-hp-website" name="website" tabindex="-1" autocomplete="off">
                    <input type="text" id="auth-hp-phone" name="phone-ext" tabindex="-1" autocomplete="off">
                </div>

                <div class="auth-input-group">
                    <label for="auth-email">Email Address</label>
                    <input type="email" id="auth-email" required placeholder="you@example.com">
                </div>
                
                <div class="auth-input-group">
                    <label for="auth-password">Password</label>
                    <div style="position: relative; display: flex; align-items: center;">
                        <input type="password" id="auth-password" required placeholder="••••••••" style="width: 100%; padding-right: 40px;">
                        <button type="button" aria-label="Toggle password visibility" tabindex="-1" onclick="const p=document.getElementById('auth-password'); const i=this.querySelector('i'); if(p.type==='password'){p.type='text';i.className='fa-solid fa-eye-slash';}else{p.type='password';i.className='fa-solid fa-eye';}" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: #777; padding: 5px; display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>

                <div id="auth-forgot-password-container" style="text-align: right; margin-top: -10px; margin-bottom: 15px; font-size: 0.85rem;">
                    <a href="#" id="auth-forgot-password-link" style="color: var(--brand-brown); text-decoration: none;">Forgot Password?</a>
                </div>

                <div class="auth-input-group" id="auth-confirm-password-group" style="display: none;">
                    <label for="auth-confirm-password">Confirm Password</label>
                    <div style="position: relative; display: flex; align-items: center;">
                        <input type="password" id="auth-confirm-password" placeholder="••••••••" style="width: 100%; padding-right: 40px;">
                        <button type="button" aria-label="Toggle password visibility" tabindex="-1" onclick="const p=document.getElementById('auth-confirm-password'); const i=this.querySelector('i'); if(p.type==='password'){p.type='text';i.className='fa-solid fa-eye-slash';}else{p.type='password';i.className='fa-solid fa-eye';}" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: #777; padding: 5px; display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>

                <div class="cf-turnstile" data-sitekey="0x4AAAAAAC75vfDlt1Ng8f6d" data-theme="auto" style="margin-top: 20px; margin-bottom: 1.5rem; display: flex; justify-content: center;"></div>

                <button type="submit" id="auth-submit-btn" class="auth-submit-btn">
                    Login
                </button>
            </form>
        </div>`;
        document.body.appendChild(container);
    }
};
