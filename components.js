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
            { href: 'index.html', label: 'Home', anchor: false },
            { href: 'index.html#connect', label: 'Community', anchor: false },
            { href: 'index.html#about', label: 'About', anchor: false },
            { href: 'our-journey.html', label: 'Journey', anchor: false },
            { href: 'van-life.html', label: 'VanLife', anchor: false },
            { href: 'collaborator.html', label: 'Collaborator', anchor: false },
            { href: 'faq.html', label: 'FAQ', anchor: false },
            { href: 'index.html#contact', label: 'Contact', anchor: false }
        ];


        // For index.html, use anchor-only links
        const isIndex = activePage === 'index';
        const navLinksHTML = links.map(link => {
            let href = link.href;
            if (isIndex) {
                if (link.href === 'index.html') href = '#home';
                else if (link.href === 'index.html#connect') href = '#connect';
                else if (link.href === 'index.html#about') href = '#about';
                else if (link.href === 'index.html#contact') href = '#contact';
            }

            // Robust active state: Match by explicit key OR by lowercased label mapping
            const linkKey = link.label.toLowerCase().replace(/\s+/g, '-');
            const isSponsorLegacy = (activePage === 'sponsor' && linkKey === 'collaborator');
            const isActive = (activePage === linkKey) || isSponsorLegacy;
            const activeAttrs = isActive ? ' class="active" aria-current="page"' : '';

            return `<a href="${href}"${activeAttrs}>${link.label}</a>`;
        }).join('\n                ');

        const brandTag = isIndex ? 'div' : 'a';
        const brandAttrs = isIndex
            ? 'class="brand brand-text"'
            : 'href="index.html" class="brand brand-text" style="text-decoration: none; color: inherit;"';

        nav.innerHTML = `
        <a href="#main-content" class="skip-link">Skip to content</a>
        <div class="container nav-content">
            <${brandTag} ${brandAttrs}>
                <img src="Images/logo.svg" alt="YatrAmore Nav Logo" class="nav-logo" width="38" height="38">
                YatrAmore
            </${brandTag}>

            <div class="hamburger" id="hamburger">
                <i class="fas fa-bars"></i>
            </div>

            <div class="nav-links" id="nav-links">
                ${navLinksHTML}
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
        const footer = document.querySelector('footer');
        if (!footer) return;

        footer.innerHTML = `
        <div class="container footer-content">
            <div class="footer-header">
                <div class="footer-brand">
                    <span class="brand-text">YatrAmore</span>
                </div>
                <div class="footer-tagline">
                    <p>Laura & Yazavinder sharing love, culture, travel, and life between two worlds.</p>
                </div>
            </div>
            <div class="footer-row footer-links">
                <a href="privacy-policy.html">Privacy Policy</a>
                <span class="footer-divider">·</span>
                <a href="faq.html">FAQ</a>
                <span class="footer-divider">·</span>
                <a href="index.html#contact">Contact Us</a>
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
                <a href="#" class="share-option-btn whatsapp-btn" id="share-whatsapp" target="_blank" title="Share on WhatsApp">
                    <div class="icon-circle"><i class="fa-brands fa-whatsapp"></i></div>
                    <span>WhatsApp</span>
                </a>
                <a href="#" class="share-option-btn facebook-btn" id="share-facebook" target="_blank" title="Share on Facebook">
                    <div class="icon-circle"><i class="fa-brands fa-facebook"></i></div>
                    <span>Facebook</span>
                </a>
                <a href="#" class="share-option-btn instagram-btn" id="share-instagram" target="_blank" title="Visit Instagram">
                    <div class="icon-circle"><i class="fa-brands fa-instagram"></i></div>
                    <span>Instagram</span>
                </a>
                <a href="#" class="share-option-btn tiktok-btn" id="share-tiktok" target="_blank" title="Visit TikTok">
                    <div class="icon-circle"><i class="fa-brands fa-tiktok"></i></div>
                    <span>TikTok</span>
                </a>
            </div>
        </div>

        <!-- Copied Toast -->
        <div id="share-toast" class="share-toast glass">
            <i class="fas fa-check-circle"></i> Link copied to clipboard!
        </div>

        <div class="accessibility-menu">
            <div class="menu-section">
                <h4>Language</h4>
                <div class="language-search-container">
                        <input type="text" id="language-search" placeholder="Search language..." autocomplete="off">
                    <div id="language-results" class="language-results"></div>
                </div>
                <div id="google_translate_element" style="display: none !important;"></div>
            </div>
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
        script.src = `script.js?v=SECURITY_${CORE_VERSION}`;
        document.body.appendChild(script);
    }
};
