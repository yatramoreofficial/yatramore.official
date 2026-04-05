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

    // ── Navigation ──────────────────────────────────────
    renderNav(activePage) {
        const nav = document.getElementById('navbar');
        if (!nav) return;

        const links = [
            { href: 'index.html', label: 'Home', anchor: false },
            { href: 'index.html#connect', label: 'Join Community', anchor: false },
            { href: 'index.html#about', label: 'About', anchor: false },
            { href: 'our-journey.html', label: 'Our Journey', anchor: false },
            { href: 'sponsor.html', label: 'Sponsor', anchor: false },
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
            const activeClass = (activePage === link.label.toLowerCase().replace(/\s+/g, '-')) ? ' class="active"' : '';
            return `<a href="${href}"${activeClass}>${link.label}</a>`;
        }).join('\n                ');

        const brandTag = isIndex ? 'div' : 'a';
        const brandAttrs = isIndex
            ? 'class="brand brand-text"'
            : 'href="index.html" class="brand brand-text" style="text-decoration: none; color: inherit;"';

        nav.innerHTML = `
        <div class="container nav-content">
            <${brandTag} ${brandAttrs}>
                <img src="Images/logo.svg" alt="YatrAmore Nav Logo" class="nav-logo">
                YatrAmore
            </${brandTag}>

            <div class="hamburger" id="hamburger">
                <i class="fas fa-bars"></i>
            </div>

            <div class="nav-links" id="nav-links">
                ${navLinksHTML}
                <div class="nav-search-wrapper">
                    <button class="nav-search-toggle" id="nav-search-toggle" title="Search" aria-label="Search this site">
                        <i class="fas fa-search"></i>
                    </button>
                    <div class="nav-search-box" id="nav-search-box">
                        <input type="text" id="site-search" placeholder="Search page..." autocomplete="off">
                        <div id="site-search-results" class="site-search-results"></div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    // ── Footer ──────────────────────────────────────────
    renderFooter() {
        const footer = document.querySelector('footer');
        if (!footer) return;

        footer.innerHTML = `
        <div class="container">
            <p>&copy; 2026 YatrAmore. All rights reserved.</p>
            <p class="footer-tagline">Sharing the vibes, one story at a time.</p>
            <div class="footer-stats">
                <i class="fas fa-eye"></i> <span id="visitor-count">0</span> visitors
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
        </div>

        <div class="accessibility-menu">
            <div class="menu-section">
                <h4>Language</h4>
                <div class="language-search-container">
                    <div class="search-input-wrapper">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" id="language-search" placeholder="Search language..." autocomplete="off">
                    </div>
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
    }
};
