/* Family Tree Logic v20 - Smart Hardware Strict Sync */

document.addEventListener("DOMContentLoaded", () => {
    const initFamilyTree = () => {
        // Loading overlay removed as requested

        const starContainer = document.getElementById("star-rating-container");
        const stars = starContainer.querySelectorAll("i");
        const ratingInput = document.getElementById("rating-input");
        const familyForm = document.getElementById("family-form");
        const formMessage = document.getElementById("form-message");
        const submitBtn = document.getElementById("family-submit-btn");
        const treeSearch = document.getElementById("tree-search");

        // Canvas & Zoom elements
        const svgLayer = document.getElementById("family-tree-svg");
        const treeCanvas = document.getElementById("tree-canvas");
        const treeStructure = document.getElementById("tree-structure");
        const treeLeaves = document.getElementById("tree-leaves");

        // 0. CONFIG & DEVICE ID (Hardened Fragmentation)
        const _ga = ['h', 't', 't', 'p', 's', ':', '/', '/', 's', 'c', 'r', 'i', 'p', 't', '.', 'g', 'o', 'o', 'g', 'l', 'e', '.', 'c', 'o', 'm', '/', 'm', 'a', 'c', 'r', 'o', 's', '/', 's', '/'].join('');
        const _id = "AKfycbye5pj79bdFHT4vKsmTN6wAuFi5chN2-l-KSPc33Yui3JQZ0KhEyDOgMc6HVWY5l7wPig";
        const _gz = '/exec';
        const scriptURL = _ga + _id + _gz;

        // v45: Use Universal Security Core for Device ID & Fingerprint
        const deviceId = YatrAmoreSecurity.deviceId;
        // Populate the hidden form field so the submit logic can read it
        const devInput = document.getElementById('deviceId');
        if (devInput) devInput.value = deviceId || '';

        let systemFingerprint = '';
        YatrAmoreSecurity.getFingerprint().then(fp => systemFingerprint = fp);

        // Enable smooth transitions on the canvas for auto-zoom
        treeCanvas.style.transition = "transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
        treeCanvas.style.transformOrigin = "0 0"; // v31: Fix zoom math origin

        // 1. STAR RATING
        stars.forEach(star => {
            star.addEventListener("mouseover", () => highlightStars(parseInt(star.dataset.value)));
            star.addEventListener("mouseleave", () => highlightStars(parseInt(ratingInput.value || "0")));
            star.addEventListener("click", () => {
                ratingInput.value = star.dataset.value;
                highlightStars(parseInt(star.dataset.value));
            });
        });

        function highlightStars(count) {
            stars.forEach(s => {
                const v = parseInt(s.dataset.value);
                s.classList.toggle("fas", v <= count);
                s.classList.toggle("far", v > count);
            });
        }

        // 2. CLICK-TO-ZOOM LOGIC
        let svgTransform = { x: 0, y: 0 };
        let scale = 1;

        function applyTransforms() {
            treeCanvas.setAttribute("transform", `translate(${svgTransform.x}, ${svgTransform.y}) scale(${scale})`);
        }

        function alignCenter() {
            const baseWidth = 3000;
            const rect = svgLayer.getBoundingClientRect();
            // Calculate the translation to keep the tree root (1500, 1800) centered horizontally
            const centerOffsetX = (baseWidth / 2) - (baseWidth / 2) * scale;
            svgTransform = { x: centerOffsetX, y: 0 };
        }

        function zoomToNode(nodeX, nodeY, duration = 2000) {
            // Temporarily upgrade the transition for a slow, cinematic 'side-by-side' pan+zoom
            treeCanvas.style.transition = "transform 3.5s cubic-bezier(0.25, 1, 0.5, 1)";

            // 4.5x Zoom requested by user (applied simultaneously with panning)
            scale = 4.5;
            svgTransform.x = 1500 - (nodeX * scale);
            svgTransform.y = 550 - (nodeY * scale); // Precise center on the panorama
            applyTransforms();

            // Automatically zoom out after specified duration
            if (duration > 0) {
                setTimeout(() => {
                    if (scale > 1) {
                        // Smoothly reset
                        treeCanvas.style.transition = "transform 2.0s cubic-bezier(0.25, 1, 0.5, 1)";
                        resetZoom();

                        // Restore default transition speed
                        setTimeout(() => {
                            treeCanvas.style.transition = "transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
                        }, 2000);
                    }
                }, duration);
            } else {
                // Restore default transition speed if no auto-reset
                setTimeout(() => {
                    treeCanvas.style.transition = "transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
                }, 2500);
            }
        }

        function resetZoom() {
            scale = 1;
            alignCenter();
            applyTransforms();
        }

        // Click anywhere on the background to reset zoom
        svgLayer.addEventListener('click', (e) => {
            // If clicking on an empty space (not a leaf)
            if (!e.target.closest('.tree-leaf')) {
                scale = 1;
                alignCenter();
                applyTransforms();
            }
        });

        // 3. MASTERPIECE BANYAN GENERATOR
        const terminalNodes = [];

        // Seeded Random Number Generator to PERMANENTLY lock the tree structure layout
        let treeSeed = 8483;
        function sRandom() {
            let t = treeSeed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }

        function drawThickBranch(x, y, angle, length, width, depth, isPropRoot = false) {
            if (depth === 0) {
                terminalNodes.push({ x, y, angle, occupiedCount: 0 });
                return;
            }
            const angleRad = angle * Math.PI / 180;
            const x2 = x + Math.cos(angleRad) * length;
            const y2 = y + Math.sin(angleRad) * length;

            const cpX = x + Math.cos(angleRad) * (length * 0.5) - (sRandom() - 0.5) * length * 0.2;
            const cpY = y + Math.sin(angleRad) * (length * 0.5) - (sRandom() - 0.5) * length * 0.2;

            // v24: Massively expanded anchor pool by digging deeper into branches (depth <= 6).
            // Capturing 6 levels of depth inside an 11-level deep tree establishes ~12,000 distinct potential anchor points!
            if (depth <= 6) {
                terminalNodes.push({ x: x2, y: y2, angle: angle, occupiedCount: 0 });
            }

            const branch = document.createElementNS("http://www.w3.org/2000/svg", "path");
            branch.setAttribute("d", `M ${x},${y} Q ${cpX},${cpY} ${x2},${y2}`);

            // Root Trunk ID for curved text engraving - MUST sit on the initial central branch
            if (depth === 11 && !isPropRoot) {
                branch.setAttribute("id", "mainTrunkPath");
            }

            // Use CSS variables for theme-aware bark colors
            branch.setAttribute("stroke", `var(--bark-${depth > 6 ? 6 : (depth || 1)})`);
            branch.setAttribute("stroke-width", width);
            branch.setAttribute("fill", "none");
            branch.setAttribute("stroke-linecap", "round");

            treeStructure.appendChild(branch);

            if (!isPropRoot && depth > 2 && depth < 5 && sRandom() > 0.6) {
                drawThickBranch(x2, y2, 90 + (sRandom() * 10 - 5), length * 1.5, width * 0.3, depth - 1, true);
            }

            const subDepth = depth - 1;
            const subWidth = width * 0.65;
            const subLength = length * (0.8 + sRandom() * 0.1);

            if (!isPropRoot && depth > 0) {
                drawThickBranch(x2, y2, angle - 25 - sRandom() * 25, subLength, subWidth, subDepth);
                drawThickBranch(x2, y2, angle + 25 + sRandom() * 25, subLength, subWidth, subDepth);
            }
        }

        const TreeRootX = 1500; // Expanded Panorama Center
        const TreeRootY = 1800; // Base utilizing 100% of the new deeper grid space

        // v25: Initial 3 Trunks Expanded Hugely
        treeSeed = 8483;
        drawThickBranch(TreeRootX, TreeRootY, -90, 460, 120, 11); // Colossal Central Trunk
        drawThickBranch(TreeRootX - 110, TreeRootY, -105, 360, 75, 10); // Expanded length Supports
        drawThickBranch(TreeRootX + 110, TreeRootY, -75, 360, 75, 10);

        // 3b. BARK ENGRAVING: YA-FAMILY (Curved along Trunk)
        const barkText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        barkText.setAttribute("class", "bark-engraving");

        const barkPath = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
        barkPath.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#mainTrunkPath");
        barkPath.setAttribute("startOffset", "35%"); // V25: Perfect visual height along the colossal trunk logic
        barkPath.textContent = "YA-FAMILY";
        barkText.appendChild(barkPath);
        barkText.setAttribute("class", "bark-engraving");
        treeStructure.appendChild(barkText);

        // 4. DEEP ROOT BURY (v24) - Ground Shift
        function drawDeepRootBury() {
            const trunkBaseX = 1500;
            const trunkBaseY = 1800;
            const trunkRadius = 60;

            // Rounded Ground Shadow
            for (let s = 0; s < 5; s++) {
                const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
                shadow.setAttribute("cx", trunkBaseX);
                shadow.setAttribute("cy", trunkBaseY + trunkRadius + 15);
                shadow.setAttribute("rx", 320 - s * 60);
                shadow.setAttribute("ry", 120 - s * 20);
                shadow.setAttribute("fill", "var(--tree-shadow)");
                shadow.setAttribute("filter", "blur(28px)");
                treeStructure.appendChild(shadow);
            }

            const density = 300; // Optimized object count for butter-smooth zoom
            for (let i = 0; i < density; i++) {
                const seed = sRandom();
                const spreadX = 480;
                const gx = trunkBaseX + (sRandom() - 0.5) * spreadX;
                const gy = (trunkBaseY + trunkRadius) + (sRandom() * 90 - 45);

                const blade = document.createElementNS("http://www.w3.org/2000/svg", "path");
                let d = "";
                let strokeWidth = 1.4;
                let color = "";

                if (seed < 0.35) {
                    const r = 3 + sRandom() * 6;
                    d = `M ${gx - r},${gy} a ${r},${r} 0 1,0 ${r * 2},0`;
                    color = sRandom() > 0.5 ? "var(--grass-1)" : "var(--grass-2)";
                    strokeWidth = 2.6;
                } else if (seed < 0.85) {
                    const h = 18 + sRandom() * 25;
                    const c = (sRandom() - 0.5) * 12;
                    d = `M ${gx},${gy} Q ${gx + c},${gy - h / 2} ${gx + c * 1.5},${gy - h}`;
                    color = sRandom() > 0.6 ? "var(--grass-2)" : "var(--grass-3)";
                } else {
                    const h = 35 + sRandom() * 25;
                    const c = (sRandom() - 0.5) * 18;
                    d = `M ${gx},${gy} Q ${gx + c},${gy - h / 3} ${gx + c * 0.4},${gy - h}`;
                    color = "var(--grass-3)";
                    strokeWidth = 1.0;
                }

                blade.setAttribute("d", d);
                blade.setAttribute("stroke", color);
                blade.setAttribute("stroke-width", strokeWidth);
                blade.setAttribute("fill", "none");
                blade.setAttribute("stroke-linecap", "round");
                blade.setAttribute("opacity", 0.9);

                treeStructure.appendChild(blade);
            }
        }
        drawDeepRootBury();

        let familyMembers = [];
        const CACHE_KEY = "yatramore_family_tree_cache";

        // --- INITIAL CACHE LOAD ---
        let cachedData = null;
        try {
            cachedData = localStorage.getItem(CACHE_KEY);
            if (cachedData) {
                familyMembers = JSON.parse(cachedData);
                renderLeaves("", true);
                checkJoinedStatus();
            }
        } catch (e) {
            console.error("Cache access failed:", e);
        }

        // v35: MEMBER-AWARE SYNC - Optimization to save data for joined members
        fetchFamilyMembers();

        function fetchFamilyMembers(force = false) {
            const SESSION_READY_KEY = "yatramore_family_tree_session_ready";
            let hasCache = null;
            let isJoined = false;
            try {
                hasCache = localStorage.getItem(CACHE_KEY);
                isJoined = localStorage.getItem("yatramore_joined") === "true";
            } catch (e) {
                console.warn("Storage access restricted in fetch:", e);
            }

            // Listen for updates from background fetch (if Home page is trigger)
            window.addEventListener('yatramore_family_tree_updated', (e) => {
                //  // console.log("[Family Tree] Live sync received from background fetch.");
                const data = e.detail;
                if (Array.isArray(data)) {
                    syncData(data);
                }
            });

            // OPTIMIZATION: If user is already a member, strictly use cache (Home sync takes care of updates)
            // Admin Mode or manual 'force' bypasses this to allow manual refresh.
            if (hasCache && JSON.parse(hasCache).length > 0 && isJoined && !force) {
                if (localStorage.getItem('ya-family') !== 'true') {
                    //  // console.log("[Family Tree] Member recognized. Strictly using cached data to save bandwidth.");
                    return;
                }
            }

            if (hasCache && JSON.parse(hasCache).length > 0 && sessionStorage.getItem(SESSION_READY_KEY) === "true" && !force) {
                //  // console.log("[Family Tree] Cache is fresh this session. Skipping redundant fetch.");
                return;
            }

            if (!scriptURL || scriptURL === "") return;

            //  // console.log("[Family Tree] Initiating direct fetch...");
            const callbackName = 'fetchCallback_' + Date.now();
            const scriptId = 'fetch-script-' + Date.now(); // Unique ID for absolute perfection

            const fetchTimeout = setTimeout(() => {
                console.warn("[Family Tree] Connection Timeout.");
                const staleScript = document.getElementById(scriptId);
                if (staleScript) document.body.removeChild(staleScript);
            }, 8000);

            window[callbackName] = function (data) {
                clearTimeout(fetchTimeout);
                delete window[callbackName];
                const scriptTag = document.getElementById(scriptId);
                if (scriptTag) document.body.removeChild(scriptTag);
                try {
                    localStorage.setItem('yatramore_last_sync_time', Date.now().toString());
                    sessionStorage.setItem(SESSION_READY_KEY, "true");
                } catch (e) { /* Storage restricted (Private Mode) */ }
                syncData(data);
            };

            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `${scriptURL}?callback=${callbackName}&action=getMembers&t=${Date.now()}`;
            document.body.appendChild(script);
        }

        function syncData(data) {
            if (!Array.isArray(data)) return;

            // Initial load
            if (familyMembers.length === 0) {
                familyMembers = data;
                localStorage.setItem(CACHE_KEY, JSON.stringify(familyMembers));
                renderLeaves("", true);
                checkJoinedStatus();
                return;
            }

            // v34: Differential Update (Sync logic shared by events/fetches)
            if (data.length > familyMembers.length) {
                console.log(`[Family Tree] Sync: Adding ${data.length - familyMembers.length} new members.`);
                const newMembers = data.slice(familyMembers.length);
                const oldLength = familyMembers.length;

                familyMembers = data;
                localStorage.setItem(CACHE_KEY, JSON.stringify(familyMembers));

                newMembers.forEach((member, i) => {
                    const name = (member.name || "").trim();
                    if (name) {
                        appendNewLeaf(name, false, oldLength + i, false);
                    }
                });
                checkJoinedStatus();
            }
            else if (data.length === familyMembers.length) {
                let changedCount = 0;
                data.forEach((member, i) => {
                    if (member.name !== familyMembers[i].name) {
                        console.log(`[Family Tree] Choice A Correction: "${familyMembers[i].name}" -> "${member.name}"`);
                        familyMembers[i].name = member.name;
                        changedCount++;
                    }
                });
                if (changedCount > 0) {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(familyMembers));
                    // v56: Choice A Move - Full re-render ensures leaves move to correct branches based on new names
                    renderLeaves("", true);
                } else {
                    //  // console.log("[Family Tree] Sync complete. No changes found.");
                }
                checkJoinedStatus();
            }
        }

        function renderLeaves(filter = "", isInitial = false) {
            const searchTerm = filter.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            if (!isInitial && treeLeaves.children.length === familyMembers.length) {
                const leafGroups = Array.from(treeLeaves.querySelectorAll('.tree-leaf'));
                leafGroups.forEach(leaf => {
                    const nameLabel = leaf.querySelector('.leaf-text-masterpiece');
                    if (nameLabel) {
                        const name = nameLabel.textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        const matches = name.includes(searchTerm);
                        leaf.style.display = matches ? "block" : "none";
                    }
                });
                return;
            }

            const fragment = document.createDocumentFragment();
            terminalNodes.forEach(node => node.occupiedCount = 0);

            familyMembers.forEach((member, index) => {
                // v60: Surgical Empty-Hide: Skip rendering if name is missing or empty
                const name = (member.name || "").trim();
                if (!name) return;

                appendNewLeaf(name, false, index, isInitial, fragment);
            });

            treeLeaves.innerHTML = "";
            treeLeaves.appendChild(fragment);

            if (filter) renderLeaves(filter);
        }

        function appendNewLeaf(name, isNew = false, index = 0, isInitial = false, container = null) {
            // v61: Row-Locked Scattering (Deterministic based on Sheet Row, not Name string)
            let nodeIndex = Math.abs(indexHash(index)) % terminalNodes.length;
            const node = terminalNodes[nodeIndex];
            const ringSize = 6;
            const ringLevel = Math.floor(node.occupiedCount / ringSize);
            const positionInRing = node.occupiedCount % ringSize;
            const leafOffset = (positionInRing * (180 / ringSize)) - 90;
            const stemDistance = ringLevel * 45;

            // Still use name for jitter and visual variation so 'John' and 'John' look slightly different
            const leafElement = addCornerAttachedLeaf(name, node, index, false, isNew, leafOffset, stemDistance, isInitial, container);
            node.occupiedCount++;
            return leafElement;
        }

        function indexHash(idx) {
            // v61: Prime-multiplication scattering hash to ensure row 1, 2, 3 are spread across the canopy
            let hash = idx * 131071; // Using a large Mersenne prime
            return (hash ^ (hash >>> 16));
        }

        function nameHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
            return hash;
        }



        function addCornerAttachedLeaf(name, node, index, isFiltered = false, isNew = false, leafOffset = 0, stemDistance = 0, isInitial = false, container = null) {
            const { x, y, angle } = node;
            const leafGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

            leafGroup.setAttribute("class", "tree-leaf");
            leafGroup.setAttribute("data-name", name);
            const deviceIdVal = node.deviceId || node['Device ID'] || "";
            leafGroup.setAttribute("data-device-id", deviceIdVal);
            leafGroup.setAttribute("data-x", x);
            leafGroup.setAttribute("data-y", y);

            const innerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            // v56: Original Jitter
            const leafJitter = (Math.abs(nameHash(name)) % 16) - 8;
            const hangAngle = angle + leafOffset + leafJitter + 180;
            innerGroup.setAttribute("transform", `rotate(${hangAngle})`);

            const rad = hangAngle * Math.PI / 180;
            const anchorX = x + (Math.cos(rad) * stemDistance);
            const anchorY = y + (Math.sin(rad) * stemDistance);

            if (isNew) {
                // Spawn in the center of the viewport and immediately glow
                leafGroup.setAttribute("transform", `translate(${TreeRootX}, ${TreeRootY - 500}) scale(4.5)`);
                leafGroup.style.willChange = "transform";
                leafGroup.classList.add("glow-leaf"); 

                // Let the leaf sit and pulse in the center for 2 seconds
                setTimeout(() => {
                    // Begin the slow, sweeping 4.0s flight down to the branch
                    leafGroup.style.transition = "all 4.0s ease-in-out";
                    leafGroup.setAttribute("transform", `translate(${anchorX}, ${anchorY}) scale(1)`);

                    // After 4.0 seconds, it lands. 
                    setTimeout(() => {
                        leafGroup.style.willChange = "auto";
                        
                        // Keep glowing for 1.5 seconds post-attachment, then revert normal.
                        setTimeout(() => {
                            leafGroup.classList.remove("glow-leaf");
                        }, 1500);
                    }, 4000); 

                }, 2000);
            } else {
                leafGroup.setAttribute("transform", `translate(${anchorX}, ${anchorY}) scale(1)`);
                if (!isFiltered && !isInitial) {
                    const stagger = index * 0.05;
                    leafGroup.style.animation = `leafAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards ${stagger}s`;
                }
            }

            const leafUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
            leafUse.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#leaf-master");
            leafUse.setAttribute("href", "#leaf-master"); // Dual-attribute for Safari compatibility
            leafUse.setAttribute("width", "80");
            leafUse.setAttribute("height", "70");
            leafUse.setAttribute("y", "-35");
            if (isNew) leafUse.style.fill = "var(--brand-gold)";

            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("class", "leaf-text-masterpiece");
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("dominant-baseline", "middle");
            label.setAttribute("x", "40");
            label.setAttribute("y", "0");

            let fSize = Math.max(4.5, Math.min(9, 65 / name.length));
            label.style.fontSize = `${fSize}px`;
            label.textContent = name;

            innerGroup.appendChild(leafUse);
            innerGroup.appendChild(label);
            leafGroup.appendChild(innerGroup);

            if (container) { container.appendChild(leafGroup); } else { treeLeaves.appendChild(leafGroup); }

            leafGroup.addEventListener('click', (e) => {
                e.stopPropagation();
                zoomToNode(x, y);
            });

            return leafGroup;
        }

        alignCenter();
        applyTransforms();

        if (treeSearch) {
            treeSearch.addEventListener("input", (e) => renderLeaves(e.target.value));
            treeSearch.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    const term = e.target.value.trim().toLowerCase();
                    if (!term) return;

                    // Reset zoom to view the entire tree overview centered
                    resetZoom();

                    const leaves = Array.from(treeLeaves.querySelectorAll('.tree-leaf'));

                    const targetLeaves = leaves.filter(leaf => {
                        const label = leaf.querySelector('.leaf-text-masterpiece').textContent.toLowerCase();
                        return label.includes(term);
                    });

                    if (targetLeaves.length > 0) {
                        targetLeaves.forEach(targetLeaf => {
                            targetLeaf.classList.add("glow-leaf");
                            // Zoom removed as requested, just glow
                            setTimeout(() => targetLeaf.classList.remove("glow-leaf"), 4000);
                        });
                    }
                }
            });
        }

        submitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const nameInput = document.getElementById("name");
            const emailInput = document.getElementById("email");
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const ratingInputEl = document.getElementById("rating-input");
            const rating = ratingInputEl.value;
            const comment = document.getElementById("comment").value.trim();
            const gotchaValue = document.getElementById("_gotcha").value;
            const deviceIdValue = document.getElementById("deviceId").value;

            if (gotchaValue && gotchaValue.length > 0) return;
            if (!name || !email || !rating) {
                showMessage("Please fill in all required fields!", "var(--status-warning)");
                return;
            }

            const formData = new FormData(document.getElementById("family-form"));
            const turnstileResponse = formData.get('cf-turnstile-response');
            if (turnstileResponse === null || turnstileResponse.trim() === '') {
                showMessage("Please complete the Security Check (CAPTCHA).", "var(--status-warning)");
                return;
            }

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                showMessage("Invalid Email Address", "var(--status-error)");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = "Engraving Leaf...";

            // Clear any active search filters to ensure the entire tree is visible
            if (treeSearch) {
                treeSearch.value = "";
                renderLeaves("");
            }

            resetZoom();
            setTimeout(() => {
                const treeSvg = document.getElementById("family-tree-svg");
                if (treeSvg) {
                    const rect = treeSvg.getBoundingClientRect();
                    const absoluteTop = rect.top + window.pageYOffset;
                    const offset = absoluteTop - (window.innerHeight / 2) + (rect.height / 2) - 50;
                    window.scrollTo({ top: offset, behavior: 'smooth' });
                }
            }, 100);

            if (!scriptURL || scriptURL === "") {
                setTimeout(() => handleSuccess(name), 1200);
                return;
            }

            let optimisticLeaf = null;
            if (!familyMembers.find(m => m.name === name)) {
                optimisticLeaf = appendNewLeaf(name, true, familyMembers.length);
            }

            const callbackName = 'gasCallback_' + Date.now();
            window[callbackName] = function (result) {
                delete window[callbackName];
                const scriptTag = document.getElementById('gas-script');
                if (scriptTag) document.body.removeChild(scriptTag);

                if (result.result === "success") {
                    handleSuccess(name, optimisticLeaf);
                } else {
                    if (optimisticLeaf && optimisticLeaf.parentNode) {
                        treeLeaves.removeChild(optimisticLeaf);
                        let nodeIndex = Math.abs(nameHash(name)) % terminalNodes.length;
                        terminalNodes[nodeIndex].occupiedCount = Math.max(0, terminalNodes[nodeIndex].occupiedCount - 1);
                    }
                    showMessage(result.message || "Email might already exist!", "var(--status-error)");
                    resetState();
                }
            };

            const script = document.createElement('script');
            script.id = 'gas-script';
            script.src = `${scriptURL}?callback=${callbackName}&action=submit&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&rating=${rating}&comment=${encodeURIComponent(comment)}&deviceId=${deviceIdValue}&fingerprint=${encodeURIComponent(systemFingerprint)}&userAgent=${encodeURIComponent(navigator.userAgent)}`;
            document.body.appendChild(script);

            function handleSuccess(submittedName, existingLeaf) {
                submitBtn.classList.add("btn-success");
                submitBtn.innerText = "Success! Engraved";

                if (!familyMembers.find(m => m.name === submittedName)) {
                    familyMembers.push({
                        name: submittedName,
                        rating: parseInt(rating),
                        ['Device ID']: deviceIdValue
                    });
                    localStorage.setItem(CACHE_KEY, JSON.stringify(familyMembers));
                    localStorage.setItem("yatramore_joined", "true");
                    localStorage.setItem("yatramore_joined_name", submittedName);
                    localStorage.setItem("yatramore_joined_email", email); // Anchor for perfect identification
                }

                setTimeout(() => {
                    if (!existingLeaf) renderLeaves();
                    showMessage("Welcome to the YatrAmore Family!", "var(--brand-gold)");
                    setTimeout(() => {
                        const statusSection = document.getElementById("family-status-card").parentNode;
                        statusSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        checkJoinedStatus();
                    }, 4500);
                    nameInput.value = "";
                    emailInput.value = "";
                    document.getElementById("comment").value = "";
                    resetStars();
                    resetState();
                }, 300);
            }

            function resetState() {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove("btn-success");
                    submitBtn.innerText = "Grow My Leaf";
                }, 5000);
            }
        });

        function resetStars() {
            const ratingInputEl = document.getElementById("rating-input");
            if (ratingInputEl) ratingInputEl.value = "";
            highlightStars(0);
        }

        function showMessage(text, color) {
            // Prevent hiding if a persistent note (like Private Mode) is active
            if (formMessage.classList.contains("persistent-note")) return;

            formMessage.innerText = text;
            formMessage.style.display = "block";
            formMessage.style.backgroundColor = color;
            setTimeout(() => {
                if (!formMessage.classList.contains("persistent-note")) {
                    formMessage.style.display = "none";
                }
            }, 5000);
        }

        function checkJoinedStatus() {
            let isJoined = localStorage.getItem("yatramore_joined") === "true";
            let joinedName = localStorage.getItem("yatramore_joined_name");
            const statusCard = document.getElementById("family-status-card");
            const form = document.getElementById("family-form");
            const nameDisplay = document.getElementById("status-user-name");

            if (Array.isArray(familyMembers)) {
                const currentDeviceId = localStorage.getItem('yatramore_device_id');
                const currentEmail = localStorage.getItem('yatramore_joined_email') || '';
                const currentFingerprint = systemFingerprint || localStorage.getItem('yatramore_fingerprint') || '';

                const match = familyMembers.find(m =>
                    (currentEmail && (m.email || "").toLowerCase() === currentEmail.toLowerCase()) ||
                    (m.deviceId && m.deviceId === currentDeviceId) ||
                    (m.device_id && m.device_id === currentDeviceId) ||
                    (m['Device ID'] && m['Device ID'] === currentDeviceId) ||
                    (m.uid && m.uid === currentDeviceId) ||
                    (m.id && m.id === currentDeviceId) ||
                    (currentFingerprint && m.fingerprint && m.fingerprint === currentFingerprint)
                );

                if (match) {
                    isJoined = true;
                    joinedName = match.name || "Member";
                    // Update storage so they see the corrected name everywhere
                    localStorage.setItem("yatramore_joined", "true");
                    localStorage.setItem("yatramore_joined_name", joinedName);
                    if (match.email) localStorage.setItem("yatramore_joined_email", match.email.toLowerCase());
                }
            }

            if (isJoined && joinedName) {
                if (form) form.style.display = "none";
                const header = document.querySelector(".form-header-integrated");
                if (header) header.style.display = "none";
                if (statusCard) statusCard.classList.add("active");
                if (nameDisplay) nameDisplay.innerText = `${joinedName}, you're in!`;
            }
        }

        const findBtn = document.getElementById("find-my-leaf-btn");
        if (findBtn) findBtn.addEventListener("click", () => {
            const joinedName = localStorage.getItem("yatramore_joined_name");
            const joinedId = localStorage.getItem("yatramore_device_id");
            if (!joinedName || !joinedId) return;

            // v54: Clear search to ensure the user's leaf is visible
            if (treeSearch) {
                treeSearch.value = "";
                renderLeaves(""); // Reset filters
            }

            const treeSection = document.getElementById("family-tree-svg");
            // Mobile fix: 'center' prevents the SVG from colliding underneath the fixed position top-navbar!
            if (treeSection) treeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            resetZoom();
            let targetLeaf = Array.from(treeLeaves.querySelectorAll('.tree-leaf')).find(l =>
                l.getAttribute('data-device-id') === joinedId || l.getAttribute('data-name') === joinedName
            );
            if (targetLeaf) {
                targetLeaf.classList.add('glow-leaf');

                // Let the user see the beating heart in the wide-screen panorama for 2 seconds first
                setTimeout(() => {
                    const transform = targetLeaf.getAttribute("transform");
                    const match = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
                    if (match) {
                        const x = parseFloat(match[1]);
                        const y = parseFloat(match[2]);
                        zoomToNode(x, y, 6200);
                    }
                }, 1500);

                // Hold the glow effect through the 2s wait + 3.5s zoom in + 2.7s hold + 2.0s zoom out = 10.2s
                setTimeout(() => targetLeaf.classList.remove('glow-leaf'), 10200);
            }
        });

        // v54: 5-Click Magic Trigger & Hidden Admin Sync
        const heroTag = document.querySelector(".travel-hero-tag");
        if (heroTag) {
            let clickCount = 0;
            let lastClickTime = 0;

            heroTag.addEventListener("click", () => {
                const now = Date.now();
                if (now - lastClickTime < 500) {
                    clickCount++;
                } else {
                    clickCount = 1;
                }
                lastClickTime = now;

                const isAdmin = localStorage.getItem('ya-family') === 'true';

                if (clickCount >= 5) {
                    localStorage.setItem('ya-family', isAdmin ? 'false' : 'true');
                    alert(`Admin Mode ${!isAdmin ? 'Enabled' : 'Disabled'}`);
                    window.location.reload();
                    clickCount = 0;
                    return;
                }

                if (isAdmin && clickCount === 1) {
                    // console.log("[Admin] Manual sync triggered via YA-Family tag.");
                    fetchFamilyMembers(true);
                }
            });
        }

        checkJoinedStatus();
    };

    // Wait for async script.js to load (YatrAmoreSecurity)
    const checkSecurity = setInterval(() => {
        if (typeof window.YatrAmoreSecurity !== 'undefined') {
            clearInterval(checkSecurity);
            initFamilyTree();
        }
    }, 50);
});
