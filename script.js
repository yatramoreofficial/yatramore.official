document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.getElementById("navbar");
    let isScrolling = false;
    let currentZoom = 1; // Initialized for accessibility logic

    // ── GAS Endpoint Protection (obfuscated, rate-limited) ──
    const _gs = 'https://script.google.com/macros/s/';
    const _ge = '/exec';
    const _ep = {
        counter: ['AKfycbz_M9XRpTkux1R85', 'JsZJ7JfSBcVKkbN8QPGP5u', '83QkiS5nslncTA6DozWvKrTB2cc1aMQ'].join(''),
        contact: ['AKfycbw_kGsOjozyhjjMM_', 'lEY1535Kv4lEeKgjNtc3r', 'eiBSg_RZ1J0gUpeQLhOOAVA7bkzYz0Q'].join('')
    };
    const gasUrl = (k) => _gs + _ep[k] + _ge;

    // Navbar scroll effect
    window.addEventListener("scroll", () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    navbar.classList.add("scrolled");
                } else {
                    navbar.classList.remove("scrolled");
                }
                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    // Mobile menu logic
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

    // Smooth scrolling for anchor links
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

    // Intersection observer for section reveal
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

    // Logo parallax effect
    const heroLogo = document.getElementById("hero-logo");
    if (heroLogo) {
        let isMoving = false;
        let rotateY = 0;
        let rotateX = 0;

        document.addEventListener("mousemove", (e) => {
            rotateY = (window.innerWidth / 2 - e.pageX) / 50;
            rotateX = (window.innerHeight / 2 - e.pageY) / 50;
            if (!isMoving) {
                window.requestAnimationFrame(() => {
                    heroLogo.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
                    isMoving = false;
                });
                isMoving = true;
            }
        });

        document.addEventListener("mouseleave", () => {
            heroLogo.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg)";
            heroLogo.style.transition = "all 0.5s ease";
        });

        document.addEventListener("mouseenter", () => {
            heroLogo.style.transition = "none";
        });
    }

    // Contact form handling
    const contactForm = document.querySelector(".contact-form");
    if (contactForm) {
        // Set endpoint dynamically (prevents URL scraping from raw HTML)
        contactForm.action = gasUrl('contact');

        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const form = this;
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;

            // Client-side rate limiting: 60-second cooldown
            const cooldownKey = 'ym_form_ts';
            const lastTs = parseInt(localStorage.getItem(cooldownKey) || '0');
            if (Date.now() - lastTs < 60000) {
                submitBtn.innerText = "Please wait...";
                submitBtn.style.backgroundColor = "#FF9800";
                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.style.backgroundColor = "";
                }, 3000);
                return;
            }

            submitBtn.innerText = "Sending...";
            submitBtn.disabled = true;

            const formData = new FormData(form);

            // Convert FormData to JSON for safer Formspree submission
            const object = {};
            formData.forEach((value, key) => object[key] = value);
            const json = JSON.stringify(object);
            localStorage.setItem('ym_form_ts', Date.now().toString());

            // Safety check for the placeholder Google Apps Script ID
            if (form.action.includes("PASTE_YOUR_APPS_SCRIPT_URL_HERE")) {
                submitBtn.innerText = "Set Script URL";
                submitBtn.style.backgroundColor = "#FF9800";
                console.warn("Contact Us Error: You must replace PASTE_YOUR_APPS_SCRIPT_URL_HERE in your index.html with your actual Google Script URL.");
                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.style.backgroundColor = "";
                    submitBtn.disabled = false;
                }, 4000);
                return;
            }

            fetch(form.action, {
                method: form.method,
                body: json,
                headers: {
                    "Content-Type": "text/plain;charset=utf-8", // Google Apps Script handles this best
                }
            }).then(response => {
                // Google Apps Script returns a redirect (302) which resolves as opaque or ok.
                // If it's a network-level failure, it would go to .catch instead.
                if (!response.ok && response.type !== 'opaque' && response.type !== 'cors') {
                    throw new Error('Submission may have failed');
                }
                submitBtn.innerText = "Message Sent!";
                submitBtn.style.backgroundColor = "#4CAF50";
                form.reset();
                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.style.backgroundColor = "";
                    submitBtn.disabled = false;
                }, 4000);
            }).catch(error => {
                submitBtn.innerText = "Network Error";
                submitBtn.style.backgroundColor = "#F44336";
                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.style.backgroundColor = "";
                    submitBtn.disabled = false;
                }, 4000);
            });
        });
    }

    // Global Visitor Counter (Session-guarded to prevent inflation)
    const visitorCountElement = document.getElementById("visitor-count");
    if (visitorCountElement) {
        const BASE_COUNT = 2600;
        const SESSION_KEY = 'ym_counted';
        const CACHE_KEY = 'ym_visitor_count';

        // Only hit the backend once per browser session
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

    // --- Accessibility & Translation ---

    const accFab = document.getElementById("accessibility-fab");
    const accMenu = document.querySelector(".accessibility-menu");

    if (accFab && accMenu) {
        accFab.addEventListener("click", () => {
            accMenu.classList.toggle("active");

            // Toggle menu visibility
            if (accMenu.classList.contains("active")) {
                accMenu.style.display = "block";
                accFab.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                accMenu.style.display = "none";
                accFab.innerHTML = '<i class="fas fa-universal-access"></i>';
            }
        });

        // Close menu when clicking outside
        document.addEventListener("click", (e) => {
            if (!accFab.contains(e.target) && !accMenu.contains(e.target)) {
                accMenu.classList.remove("active");
                accMenu.style.display = "none";
                accFab.innerHTML = '<i class="fas fa-universal-access"></i>';
            }
        });
    }

    // Zoom Logic
    const zoomInBtn = document.getElementById("zoom-in");
    const zoomOutBtn = document.getElementById("zoom-out");
    const zoomResetBtn = document.getElementById("zoom-reset");

    const updateZoom = () => {
        document.documentElement.style.setProperty("--zoom-scale", currentZoom);
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

    // --- Theme Toggle Logic ---
    const themeToggle = document.getElementById("theme-toggle");
    const htmlElement = document.documentElement;

    // In-page initialization for UI elements
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

    // --- Searchable Language Selector ---
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

    const langSearch = document.getElementById("language-search");
    const langResults = document.getElementById("language-results");

    const renderResults = (filter = "") => {
        if (!langResults) return;
        const filtered = languages.filter(l => 
            l.name.toLowerCase().includes(filter.toLowerCase())
        );

        langResults.innerHTML = filtered.map(l => `
            <div class="language-item" data-code="${l.code}">${l.name}</div>
        `).join("");

        if (filter || filtered.length > 0) {
            langResults.classList.add("active");
        } else {
            langResults.classList.remove("active");
        }

        // Add click events to items
        langResults.querySelectorAll(".language-item").forEach(item => {
            item.addEventListener("click", () => {
                const code = item.dataset.code;
                translatePage(code);
                if (langSearch) langSearch.value = ""; 
                langResults.classList.remove("active");
            });
        });
    };

    const translatePage = (langCode) => {
        const googleCombo = document.querySelector(".goog-te-combo");
        if (googleCombo) {
            googleCombo.value = langCode;
            googleCombo.dispatchEvent(new Event("change"));
        }
    };

    if (langSearch) {
        langSearch.addEventListener("input", (e) => {
            renderResults(e.target.value);
        });

        langSearch.addEventListener("focus", () => {
            renderResults(langSearch.value);
        });
    }

    // Initialize with common languages
    if (langSearch) setTimeout(renderResults, 1000); // Only init when language selector exists

    // The in-page Google Translate widget is now handled by the initialization in your HTML files.

    // --- XSS Sanitization Helper ---
    const sanitize = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    // --- Dynamic Sponsor Loading ---
    async function loadSponsors() {
        const sponsoredGrid = document.getElementById("sponsored-grid");
        const sponsorPageGrid = document.getElementById("sponsor-page-grid");
        const loadingNotice = document.getElementById("loading-sponsors");
        const noSponsorsNotice = document.getElementById("no-sponsors-notice");

        if (!sponsoredGrid && !sponsorPageGrid) return;

        // Use global SPONSOR_DATA from sponsors.js as the single source of truth
        let data = (typeof SPONSOR_DATA !== 'undefined') ? SPONSOR_DATA : [];

        if (!data || data.length === 0) {
            if (loadingNotice) loadingNotice.style.display = "none";
            if (noSponsorsNotice) noSponsorsNotice.style.display = "block";
            return;
        }

        const renderCard = (sponsor) => {
            const s = {
                category: sanitize(sponsor.category || ''),
                title: sanitize(sponsor.title || ''),
                location: sanitize(sponsor.location || ''),
                description: sanitize(sponsor.description || ''),
                image: (sponsor.image || '').replace(/[<>"]/g, ''), // URL-safe filter (don't HTML-escape URLs)
                date: sanitize(sponsor.date || ''),
                nights: sanitize(sponsor.nights || ''),
                rating: sanitize(sponsor.rating || ''),
                status: sanitize(sponsor.status || 'Partner'),
                tags: (sponsor.tags || []).map(t => sanitize(t))
            };
            return `
            <article class="travel-card glass revealed" data-category="${s.category}" data-is-sponsor="true">
                <div class="card-image-wrapper">
                    <img src="${s.image}" alt="${s.title}" 
                        style="display: ${sponsor.image === 'Images/logo.svg' ? 'none' : 'block'}" 
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="card-image-placeholder" style="display: ${sponsor.image === 'Images/logo.svg' || !sponsor.image.includes('.') ? 'flex' : 'none'}; height: 100%; width: 100%;">
                        <span>Coming Soon</span>
                    </div>
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
                    <h2 class="card-title">${s.title}</h2>
                    <p class="card-description">${s.description}</p>
                    <div class="card-meta">
                        <div class="card-meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${s.date}</span>
                        </div>
                        <div class="card-meta-item">
                            <i class="fas fa-moon"></i>
                            <span>${s.nights}</span>
                        </div>
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

        if (sponsoredGrid) {
            sponsoredGrid.innerHTML = cardsHTML;

            // Immediately apply active filter to new cards on the journey page
            const currentFilterBtn = document.querySelector('.filter-btn.active');
            if (currentFilterBtn) {
                const filter = currentFilterBtn.dataset.filter;
                const newCards = sponsoredGrid.querySelectorAll('.travel-card');
                newCards.forEach(card => {
                    const category = card.dataset.category || '';
                    const isSponsor = card.getAttribute('data-is-sponsor') === 'true';

                    // Logic: Sponsors ONLY show in their category, NOT in "All"
                    const shouldShow = (filter !== 'All' && category === filter);

                    if (!shouldShow) {
                        card.style.display = 'none';
                        card.style.opacity = '0';
                    }
                });
            }
        }

        if (sponsorPageGrid) {
            sponsorPageGrid.innerHTML = cardsHTML;
        }
    }

    loadSponsors();

    // ── Navbar Search ─────────────────────────────────
    const searchToggle = document.getElementById('nav-search-toggle');
    const searchBox = document.getElementById('nav-search-box');
    const searchInput = document.getElementById('site-search');
    const searchResults = document.getElementById('site-search-results');

    if (searchToggle && searchBox) {
        searchToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            searchBox.classList.toggle('active');
            if (searchBox.classList.contains('active')) {
                setTimeout(() => searchInput.focus(), 100);
            } else {
                searchResults.classList.remove('active');
                searchInput.value = '';
            }
        });

        // Global Site Index - Content Keywords Only
        const GLOBAL_SITE_INDEX = [
            // Home / About
            { text: "About YatrAmore", url: "index.html#about", keywords: ["about", "story", "mission", "vision"] },
            { text: "Italy - Our Roots", url: "index.html#about", keywords: ["italy", "italia", "europe", "roots"] },
            { text: "India - Our Heart", url: "index.html#about", keywords: ["india", "bharat", "asia", "culture"] },
            { text: "Connect Anywhere", url: "index.html#connect", keywords: ["connect", "community", "social", "join"] },
            { text: "Contact Us", url: "index.html#contact", keywords: ["contact", "email", "support", "reach"] },
            
            // Journey
            { text: "Travel Stories & Gallery", url: "our-journey.html", keywords: ["journey", "travel", "stories", "photos", "gallery"] },
            { text: "Varanasi - The Sacred Ganges", url: "our-journey.html", keywords: ["varanasi", "ganges", "river", "spiritual"] },
            { text: "Jaipur - The Pink City", url: "our-journey.html", keywords: ["jaipur", "pink city", "rajasthan", "forts"] },
            { text: "Agra - Taj Mahal", url: "our-journey.html", keywords: ["agra", "taj mahal", "love", "monument"] },
            { text: "Kerala Backwaters", url: "our-journey.html", keywords: ["kerala", "backwaters", "nature", "serene"] },
            { text: "Amritsar - Golden Temple", url: "our-journey.html", keywords: ["amritsar", "golden temple", "punjab", "peace"] },
            { text: "Leh Ladakh - High Altitude", url: "our-journey.html", keywords: ["leh", "ladakh", "mountains", "himalayas"] },

            // Sponsors
            { text: "Sponsor Us & Partnership", url: "sponsor.html", keywords: ["sponsor", "partnership", "support", "business", "tiers"] },

            // Privacy
            { text: "Privacy Policy", url: "privacy-policy.html", keywords: ["privacy", "policy", "data", "legal", "terms"] }
        ];

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            if (!query) {
                searchResults.classList.remove('active');
                return;
            }

            // Search in global index based on text and keywords
            const matches = GLOBAL_SITE_INDEX.filter(item => 
                item.text.toLowerCase().includes(query) || 
                item.keywords.some(k => k.toLowerCase().includes(query))
            ).slice(0, 8);

            if (matches.length === 0) {
                searchResults.innerHTML = `<div class="search-no-result">No results found</div>`;
            } else {
                searchResults.innerHTML = matches.map((m, i) =>
                    `<div class="search-result-item" data-url="${m.url}">
                        <span class="search-item-text">${sanitize(m.text)}</span>
                    </div>`
                ).join('');

                searchResults.querySelectorAll('.search-result-item').forEach(el => {
                    el.addEventListener('click', () => {
                        const url = el.getAttribute('data-url');
                        const [path, hash] = url.split('#');
                        const currentPath = window.location.pathname.split('/').pop() || 'index.html';

                        if (path === currentPath && hash) {
                            const target = document.getElementById(hash);
                            if (target) {
                                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                target.classList.add('search-highlight');
                                setTimeout(() => target.classList.remove('search-highlight'), 3000);
                            }
                        } else {
                            window.location.href = url;
                        }

                        searchBox.classList.remove('active');
                        searchInput.value = '';
                        searchResults.classList.remove('active');
                    });
                });
            }
            searchResults.classList.add('active');
        });

        // Close search on outside click
        document.addEventListener('click', (e) => {
            if (!searchBox.contains(e.target) && !searchToggle.contains(e.target)) {
                searchBox.classList.remove('active');
                searchResults.classList.remove('active');
                if (searchInput) searchInput.value = '';
            }
        });
    }

    // ── Share FAB (REMOVED as per user request) ───────

    // ── Privacy Policy TOC ──────────────────────────────
    const policyContent = document.querySelector('.policy-content');
    const policySections = document.querySelectorAll('.policy-section h2');

    if (policyContent && policySections.length > 0) {
        // Add IDs to each section heading
        policySections.forEach((heading, i) => {
            heading.id = `policy-section-${i + 1}`;
        });

        // Build TOC HTML
        const tocItems = Array.from(policySections).map((heading, i) => {
            const num = (i + 1) + '.';
            const text = heading.textContent.replace(/^\d+\.\s*/, ''); // Remove leading number
            return `<li><a href="#policy-section-${i + 1}"><span class="toc-num">${num}</span>${sanitize(text)}</a></li>`;
        }).join('');

        const tocHTML = `
            <nav class="policy-toc glass">
                <h3><i class="fas fa-list-ul"></i> Table of Contents</h3>
                <ol>${tocItems}</ol>
            </nav>
        `;

        // Insert TOC at the very top of the content card so it sticks for the whole duration
        policyContent.insertAdjacentHTML('afterbegin', tocHTML);

        // Smooth scroll for TOC links
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
});