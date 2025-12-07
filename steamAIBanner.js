// ==UserScript==
// @name         Steam AI Badge & Banner (combined)
// @namespace    https://github.com/VincentLorenzi/AI-Banner-for-Steam/
// @version      1.0
// @description  Add an "AI" badge to game tiles and an "AI Generated Content Disclosure" banner on app pages.
// @author       Vincent Lorenzi, Pierre Demessence
// @license      GNU GPL 3.0
// @match        https://store.steampowered.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      raw.githubusercontent.com
// @connect      store.steampowered.com
// @homepageURL  https://github.com/VincentLorenzi/AI-Banner-for-Steam
// @updateURL    https://github.com/VincentLorenzi/AI-Banner-for-Steam/raw/refs/heads/main/steamAIBanner.js
// @downloadURL  https://github.com/VincentLorenzi/AI-Banner-for-Steam/raw/refs/heads/main/steamAIBanner.js
// ==/UserScript==

(function () {
    'use strict';

    /* Configuration */
    const APPIDS_URL = 'https://raw.githubusercontent.com/VincentLorenzi/AI-Banner-for-Steam/refs/heads/main/appids.json';
    const CACHE_KEY = 'aiAppIds';
    const CACHE_TIME_KEY = 'aiAppIdsCacheTime';
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
    const FETCH_DELAY = 800;

    /* Shared helpers */
    function debounce(fn, wait) {
        let t;
        return function (...a) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, a), wait);
        };
    }

    /* Banner logic (app page) */
    const BANNER_ID = 'tm-ai-banner';
    const aiAcronymRegex = /\b(ai|ia|ki)\b/i;
    const generatedWordsRegex = /(generated|g[eé]n[eé]r|generat|generiert|generado|gerado|generato|生成|生成され|生成的)/i;

    function injectBannerStyles() {
        if (document.getElementById(`${BANNER_ID}-styles`)) return;
        const s = document.createElement('style');
        s.id = `${BANNER_ID}-styles`;
        s.textContent = `
            #${BANNER_ID}{background:#ff6b6b;color:#fff;padding:12px 16px;font-size:15px;font-weight:600;border-radius:6px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.2)}
            #${BANNER_ID} .ai-banner-header{font-size:18px;margin-bottom:6px}
            #${BANNER_ID} .ai-toggle{cursor:pointer;font-size:13px;color:#000;background:#fff;padding:4px 8px;border-radius:4px;display:inline-block;margin-bottom:6px;font-weight:600}
            #${BANNER_ID} .ai-description-container{overflow:hidden;transition:max-height .3s ease;max-height:0}
            #${BANNER_ID} .ai-banner-description{font-weight:400;font-size:13px;white-space:pre-line;padding-top:6px}
        `;
        document.head.appendChild(s);
    }

    function addBanner(descriptionText) {
        if (document.getElementById(BANNER_ID)) return;
        const banner = document.createElement('div'); banner.id = BANNER_ID;
        const header = document.createElement('div'); header.className = 'ai-banner-header'; header.textContent = '⚠️ AI Generated Content Disclosure';
        const toggle = document.createElement('div'); toggle.className = 'ai-toggle'; toggle.textContent = 'Afficher la description';
        const container = document.createElement('div'); container.className = 'ai-description-container';
        const description = document.createElement('div'); description.className = 'ai-banner-description'; description.textContent = descriptionText || '';
        container.appendChild(description);
        banner.appendChild(header); banner.appendChild(toggle); banner.appendChild(container);
        toggle.addEventListener('click', () => {
            const collapsed = container.style.maxHeight === '0px' || container.style.maxHeight === '';
            if (collapsed) { container.style.maxHeight = container.scrollHeight + 'px'; toggle.textContent = 'Masquer la description'; }
            else { container.style.maxHeight = '0px'; toggle.textContent = 'Afficher la description'; }
        });
        const title = document.querySelector('#appHubAppName, .apphub_AppName');
        if (title && title.parentElement) title.parentElement.prepend(banner); else document.body.prepend(banner);
    }
    function removeBanner() { document.getElementById(BANNER_ID)?.remove(); }

    function checkAppPageForAi() {
        const block = document.querySelector('#game_area_content_descriptors');
        if (!block) { removeBanner(); return; }
        const header = block.querySelector('h2'); if (!header) { removeBanner(); return; }
        const text = header.textContent.trim();
        const isAi = aiAcronymRegex.test(text) || generatedWordsRegex.test(text);
        if (!isAi) { removeBanner(); return; }
        const paragraphs = Array.from(block.querySelectorAll('p'));
        const descriptionText = paragraphs.map(p => p.textContent.trim()).filter(Boolean).join('\n\n');
        injectBannerStyles(); addBanner(descriptionText);
    }

    /* Badge logic (tiles across the store) */
    const BADGE_CLASS = 'tm-ai-badge';

    function injectBadgeStyles() {
        if (document.getElementById(`${BADGE_CLASS}-styles`)) return;
        const style = document.createElement('style');
        style.id = `${BADGE_CLASS}-styles`;
        style.textContent = `
            .${BADGE_CLASS}{background:#ff6b6b;color:#111;padding:3px 8px;border-radius:3px;font-size:11px;font-weight:700;display:inline-flex;align-items:center}
            .ds_flag.${BADGE_CLASS}{background:linear-gradient(135deg,#ff6b6b,#ff6b6b);top:52px;padding-left:4px}
            .tab_item, .search_result_row{position:relative}
            .tab_item > .${BADGE_CLASS}, .search_result_row > .${BADGE_CLASS}, .${BADGE_CLASS}.wishlist-badge{position:absolute;top:3px;left:0;font-size:11px;padding:3px 14px 3px 10px;color:#111;z-index:10;line-height:1;pointer-events:none}
        `;
        document.head.appendChild(style);
    }

    function createBadgeElement(kind) {
        const text = kind === 'spotlight' ? 'USES AI\u00a0\u00a0' : 'USES AI';
        const el = document.createElement(kind === 'spotlight' ? 'div' : 'span');
        el.classList.add(BADGE_CLASS);
        if (kind === 'spotlight') el.classList.add('ds_flag', 'ds_wishlist_flag');
        if (kind === 'wishlist') el.classList.add('wishlist-badge');
        // small svg
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('viewBox','0 0 24 24'); svg.style.height = '10px'; svg.style.marginRight = '4px'; svg.innerHTML = '<path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>';
        el.appendChild(svg); el.appendChild(document.createTextNode(text));
        return el;
    }

    function addBadgeToTile(tile) {
        if (!tile || tile.querySelector(`.${BADGE_CLASS}`)) return;
        const decorators = tile.querySelector('.CapsuleDecorators');
        if (decorators) { decorators.appendChild(createBadgeElement('default')); return; }
        const dsFlaggedTile = tile.closest('.ds_flagged') ?? tile;
        if (dsFlaggedTile.classList && dsFlaggedTile.classList.contains('ds_flagged')) { dsFlaggedTile.appendChild(createBadgeElement('spotlight')); return; }
        const tabItem = tile.closest('.tab_item') ?? tile;
        if (tabItem.classList && tabItem.classList.contains('tab_item')) { tabItem.appendChild(createBadgeElement('default')); return; }
        const searchRow = tile.closest('.search_result_row') ?? tile;
        if (searchRow.classList && searchRow.classList.contains('search_result_row')) { searchRow.appendChild(createBadgeElement('default')); return; }
        const wishlistInput = tile.querySelector('input[data-appid]');
        if (wishlistInput) { const imgContainer = tile.querySelector('img')?.parentElement; if (imgContainer) { imgContainer.style.position = 'relative'; imgContainer.appendChild(createBadgeElement('wishlist')); } return; }
    }

    function extractAppIdFromNode(node) {
        const input = node.querySelector('input[data-appid]'); if (input) return input.dataset.appid;
        if (node.dataset?.dsAppid) return node.dataset.dsAppid;
        const link = node.tagName === 'A' ? node : node.querySelector("a[href*='/app/']"); if (!link) return null;
        if (link.dataset?.dsAppid) return link.dataset.dsAppid;
        const m = link.href.match(/\/app\/(\d+)/); return m ? m[1] : null;
    }

    // App ID state/cache and queue
    const knownAiAppIds = new Set();
    const checkedTiles = new WeakSet();
    const tilesByAppId = new Map();
    const fetchQueue = [];
    const fetchedAppIds = new Set();
    let queueRunning = false;

    async function loadKnownAppIds() {
        try {
            const cachedTime = await GM_getValue(CACHE_TIME_KEY, 0);
            const now = Date.now();
            if (now - cachedTime < CACHE_TTL) {
                const cached = await GM_getValue(CACHE_KEY, []);
                cached.forEach(id => knownAiAppIds.add(String(id)));
                return;
            }
        } catch (e) { /* ignore */ }

        return new Promise(resolve => {
            GM_xmlhttpRequest({ method: 'GET', url: APPIDS_URL, onload(res) {
                if (res.status === 200) {
                    try {
                        const ids = JSON.parse(res.responseText);
                        ids.forEach(id => knownAiAppIds.add(String(id)));
                        GM_setValue(CACHE_KEY, ids);
                        GM_setValue(CACHE_TIME_KEY, Date.now());
                    } catch (e) { /* ignore */ }
                }
                resolve();
            }, onerror() { resolve(); } });
        });
    }

    function processTileForBadging(tile) {
        if (checkedTiles.has(tile)) return; checkedTiles.add(tile);
        const appId = extractAppIdFromNode(tile); if (!appId) return;
        if (!tilesByAppId.has(appId)) tilesByAppId.set(appId, []);
        tilesByAppId.get(appId).push(tile);
        if (knownAiAppIds.has(appId)) { addBadgeToTile(tile); return; }
        if (!fetchedAppIds.has(appId)) { fetchedAppIds.add(appId); fetchQueue.push(appId); }
    }

    function runFetchQueue() {
        if (fetchQueue.length === 0) { queueRunning = false; return; }
        queueRunning = true;
        const appId = fetchQueue.shift();
        GM_xmlhttpRequest({ method: 'GET', url: `https://store.steampowered.com/app/${appId}/`, onload(res) {
            const hasAI = res.status === 200 && /AI Generated Content Disclosure/i.test(res.responseText);
            if (hasAI) { knownAiAppIds.add(appId); tilesByAppId.get(appId)?.forEach(addBadgeToTile); }
            setTimeout(runFetchQueue, FETCH_DELAY);
        }, onerror() { setTimeout(runFetchQueue, FETCH_DELAY); } });
    }

    function scanAndProcessTiles() {
        document.querySelectorAll("a[href*='/app/']").forEach(link => {
            const tile = link.closest('[class*="_3r4Ny9tQdQZc50XDM5B2q2"]') ?? link.closest('.ds_flagged') ?? link.closest('.tab_item') ?? link.closest('.search_result_row') ?? link;
            processTileForBadging(tile);
        });
        document.querySelectorAll('input[data-appid]').forEach(input => {
            const panel = input.closest('[class*="Panel"]') ?? input.closest('[data-index]') ?? input.parentElement?.parentElement; if (panel) processTileForBadging(panel);
        });
        if (fetchQueue.length > 0 && !queueRunning) runFetchQueue();
    }

    async function init() {
        injectBadgeStyles(); injectBannerStyles();
        await loadKnownAppIds();
        scanAndProcessTiles();
        const debouncedScan = debounce(scanAndProcessTiles, 300);
        const observer = new MutationObserver(debouncedScan);
        observer.observe(document.body, { childList: true, subtree: true });

        const debouncedCheckApp = debounce(checkAppPageForAi, 300);
        const docObserver = new MutationObserver(debouncedCheckApp);
        docObserver.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('popstate', checkAppPageForAi);
        // Some sites fire custom history events; attempt to catch them
        window.addEventListener('pushstate', checkAppPageForAi);
        window.addEventListener('replacestate', checkAppPageForAi);
        setTimeout(() => { scanAndProcessTiles(); checkAppPageForAi(); }, 500);
    }

    setTimeout(init, 300);

})();
