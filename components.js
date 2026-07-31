// ============================================
// SHARED COMPONENTS — YatrAmore
// ============================================
// This file generates the navigation, footer, and accessibility widgets
// so you only need to edit them in ONE place.
//
// Usage: Add <script src="components.js"></script> BEFORE your page content scripts.
// Then call: YatrAmore.renderNav(), YatrAmore.renderFooter(), YatrAmore.renderAccessibility()
// ============================================

const YatrAmore = {
    // ── XSS Sanitization Helper ────────────────────────
    sanitize(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // ── Navigation ──────────────────────────────────────
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

        const iconLinks = [
            { href: '/family-tree', label: 'Family Tree', id: 'family-tree', icon: '<style>@keyframes leafWavy { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-15deg); } 75% { transform: rotate(15deg); } } .nav-icon-link:hover .leaf-wavy { animation: leafWavy 1.5s ease-in-out infinite; transform-origin: bottom center; }</style><i class="fa-solid fa-seedling leaf-wavy" style="font-size: 1.6rem;"></i>' },
            { href: '/collaborator#lucky-draw', label: 'Lucky Draw', id: 'lucky-draw', icon: '<svg viewBox="0 0 100 100" style="width: 2.2rem; height: 2.2rem; overflow: visible;" aria-hidden="true"><style>.lucky-wheel-group { transform-origin: 50px 50px; transition: transform 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.15); } .nav-icon-link:hover .lucky-wheel-group { transform: rotate(720deg); }</style><g class="lucky-wheel-group"><circle cx="50" cy="50" r="46" stroke="currentColor" stroke-width="3" fill="none"/><circle cx="50" cy="50" r="43" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="50" cy="50" r="36" stroke="currentColor" stroke-width="14" stroke-dasharray="18.85 18.85" fill="none"/><circle cx="50" cy="50" r="28" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="50" cy="4" r="2.5" fill="currentColor"/><circle cx="50" cy="96" r="2.5" fill="currentColor"/><circle cx="4" cy="50" r="2.5" fill="currentColor"/><circle cx="96" cy="50" r="2.5" fill="currentColor"/><circle cx="17.5" cy="17.5" r="2.5" fill="currentColor"/><circle cx="82.5" cy="82.5" r="2.5" fill="currentColor"/><circle cx="17.5" cy="82.5" r="2.5" fill="currentColor"/><circle cx="82.5" cy="17.5" r="2.5" fill="currentColor"/></g><path d="M 50 1 L 56 12 L 44 12 Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/><text x="50" y="55" font-family="\'Brush Script MT\', \'Pacifico\', cursive" font-weight="normal" font-size="18" text-anchor="middle" fill="currentColor">Lucky</text></svg>' }
        ];

        // For index.html, use anchor-only links
        const isIndex = activePage === 'index';
        const navLinksHTML = links.map(link => {
            let href = link.href;
            if (isIndex) {
                if (link.href === '/') href = '#home';
                else if (link.href === '/#connect') href = '#connect';
                else if (link.href === '/#about') href = '#about';
                else if (link.href === '/#contact') href = '#contact';
            }

            // Robust active state: Match by explicit key OR by lowercased label mapping
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

        const isMatchmaking = window.location.pathname.includes('matchmaking');
        const chatInboxIconHTML = isMatchmaking ? `
                <!-- Chat Inbox Icon -->
                <button id="nav-inbox-btn" class="nav-icon-link" title="Inbox" aria-label="Inbox" style="background:none; border:none; padding:0; cursor:pointer; position:relative; color:var(--brand-brown); margin-right: 10px; display:inline-flex; align-items:center; justify-content:center; font-size:1.15rem; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s;" onmouseover="this.querySelector('.fa-heart').classList.add('fa-beat'); this.style.transform='scale(1.15) translateY(-2px)';" onmouseout="this.querySelector('.fa-heart').classList.remove('fa-beat'); this.style.transform='scale(1) translateY(0)';">
                    <i class="fa-solid fa-heart" style="font-size: 1.7rem; --fa-animation-duration: 1s;"></i>
                    <span id="nav-inbox-badge" style="display:none; position:absolute; top:-6px; right:-10px; background:var(--brand-red, #e74c3c); color:white; font-size:0.7rem; font-weight:bold; border-radius:50%; width:18px; height:18px; align-items:center; justify-content:center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">0</span>
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

        // A-1 Fix: Ensure a #main-content target exists for the skip link
        if (!document.getElementById('main-content')) {
            const mainTarget = document.querySelector('main') ||
                document.querySelector('.hero, .travel-hero, .faq-hero, .policy-hero, .page-content');
            if (mainTarget) mainTarget.id = 'main-content';
        }
    },

    // ── Footer ──────────────────────────────────────────
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

    // ── Accessibility & Translation Widget ──────────────
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

        <!-- Share Menu -->
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

        <!-- Copied Toast -->
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

    // ── Google Translate (centralized) ──────────────────
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

    // ── Core Security & Logic Loader ──────────────────
    // Centralized versioning: Update once here to refresh all pages
    loadCore() {
        if (window._ytCoreLoaded) return;
        window._ytCoreLoaded = true;

        const CORE_VERSION = 'v20'; // Increment this to break cache
        const script = document.createElement('script');
        script.src = `/script.js?v=SECURITY_${CORE_VERSION}`;
        document.body.appendChild(script);
    },

    // ── Firebase Auth Modal ─────────────────────────────
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
                
                <!-- MULTI-HONEYPOT (Bots will fill this, humans won't see it) -->
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
                    <input type="password" id="auth-password" required placeholder="••••••••">
                </div>

                <div id="auth-forgot-password-container" style="text-align: right; margin-top: -10px; margin-bottom: 15px; font-size: 0.85rem;">
                    <a href="#" id="auth-forgot-password-link" style="color: var(--brand-brown); text-decoration: none;">Forgot Password?</a>
                </div>

                <div class="auth-input-group" id="auth-confirm-password-group" style="display: none;">
                    <label for="auth-confirm-password">Confirm Password</label>
                    <input type="password" id="auth-confirm-password" placeholder="••••••••">
                </div>

                <!-- MATH CAPTCHA -->
                <div class="auth-input-group" id="auth-captcha-group" style="margin-top: 20px;">
                    <div style="background: rgba(107, 66, 38, 0.04); border: 1px solid rgba(107, 66, 38, 0.15); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 15px; box-shadow: inset 0 2px 5px rgba(0,0,0,0.02);">
                        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--brand-brown), #8b5a33); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; box-shadow: 0 3px 8px rgba(107, 66, 38, 0.3); flex-shrink: 0;">
                                <i class="fa-solid fa-shield-halved"></i>
                            </div>
                            <label id="auth-captcha-label" for="auth-captcha-answer" style="color: var(--text-main); font-weight: 600; font-size: 0.9rem; margin: 0; padding: 0; display: block; line-height: 1.2;">Security Check: What is 0 + 0?</label>
                        </div>
                        <input type="number" id="auth-captcha-answer" required placeholder="" oninput="if(this.value.length > 2) this.value = this.value.slice(0,2);" onkeypress="return event.charCode >= 48 && event.charCode <= 57" style="width: 60px; height: 40px; text-align: center; font-size: 1.1rem; font-weight: 700; padding: 0; border-radius: 8px; border: 1px solid rgba(107,66,38,0.2); background: var(--bg-main); color: var(--text-main); outline: none; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.2s ease;">
                    </div>
                </div>

                <button type="submit" id="auth-submit-btn" class="auth-submit-btn">
                    Login
                </button>
            </form>
        </div>`;
        document.body.appendChild(container);
    }
};
