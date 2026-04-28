const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '..', 'data', 'reels-scraped.json');
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (Commons content is stable)

// Wikimedia Commons categories that contain real football match clips
// (free, public-domain / CC-licensed videos served from upload.wikimedia.org CDN)
const CATEGORIES = [
    'Category:Videos_of_association_football',
    'Category:Videos_of_FIFA_U-17_Women%27s_World_Cup',
    'Category:Football_videos_of_FIFA_World_Cup',
    'Category:Football_match_video_clips'
];

const FILES_PER_CATEGORY = 25;
const MAX_TOTAL_REELS = 30;
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

let cache = { reels: [], lastUpdated: 0, fetching: false };

function ua() {
    return 'UltraGol-Reels/1.0 (https://ultragol-l3ho.com.mx; contact@ultragol.mx) Node/Express';
}

function fmtRelDate(isoTs) {
    if (!isoTs) return '';
    const t = new Date(isoTs).getTime();
    const diff = Date.now() - t;
    const days = Math.floor(diff / 86400000);
    if (days < 7)   return `Hace ${days}d`;
    if (days < 30)  return `Hace ${Math.floor(days / 7)} sem`;
    if (days < 365) return `Hace ${Math.floor(days / 30)} m`;
    return `Hace ${Math.floor(days / 365)} año(s)`;
}

// ─── Auto-categorize based on title keywords ────────────────────
const TAG_RULES = [
    { rx: /(gol|goal|golazo|score)/i,            tag: 'GOLAZO',     color: '#FFD700', team: 'Goles' },
    { rx: /(world\s?cup|mundial|fifa)/i,         tag: 'MUNDIAL',    color: '#00ff95', team: 'FIFA' },
    { rx: /(penalty|penal)/i,                    tag: 'PENAL',      color: '#ff3b8b', team: 'Tiros Penales' },
    { rx: /(women|female|femenil|u-17|u17)/i,    tag: 'FEMENIL',    color: '#c724b1', team: 'Fútbol Femenil' },
    { rx: /(save|atajada|keeper|portero)/i,      tag: 'ATAJADA',    color: '#ff6b35', team: 'Porteros' },
    { rx: /(skill|trick|dribble|regate)/i,       tag: 'JUGADA',     color: '#00BFFF', team: 'Jugadas' },
    { rx: /(celebration|festejo|celebrate)/i,    tag: 'FESTEJO',    color: '#FF1493', team: 'Festejos' },
    { rx: /(free\s?kick|tiro\s?libre)/i,         tag: 'TIRO LIBRE', color: '#FFA500', team: 'Tiros Libres' },
    { rx: /(corner|esquina)/i,                   tag: 'CÓRNER',     color: '#9370DB', team: 'Córners' },
    { rx: /(match|partido|game|vs\.|vs )/i,      tag: 'PARTIDO',    color: '#1ec9ff', team: 'Partidos' }
];

function classifyTitle(title) {
    for (const rule of TAG_RULES) {
        if (rule.rx.test(title)) return { tag: rule.tag, tagColor: rule.color, team: rule.team };
    }
    return { tag: 'FÚTBOL', tagColor: '#00ff95', team: 'Highlights' };
}

// ─── Friendly Spanish title from raw filename ────────────────────
function prettifyTitle(rawTitle) {
    // Remove "File:" prefix and extension
    let t = rawTitle.replace(/^File:/i, '').replace(/\.(webm|ogv|ogg|mp4|mov)$/i, '');
    // Replace underscores with spaces
    t = t.replace(/_/g, ' ').trim();
    // Decode percent-encoding
    try { t = decodeURIComponent(t); } catch (e) { /* noop */ }
    // Limit length
    if (t.length > 95) t = t.substring(0, 92) + '…';
    return t;
}

// ─── Fetch list of files in a Wikimedia category ────────────────
async function fetchCategoryFiles(category) {
    const url = `${COMMONS_API}?action=query&list=categorymembers&cmtitle=${category}&cmlimit=${FILES_PER_CATEGORY}&cmtype=file&format=json&origin=*`;
    try {
        const res = await fetch(url, { headers: { 'User-Agent': ua(), 'Accept': 'application/json' } });
        if (!res.ok) {
            console.warn(`[Reels Scraper] ${category} → HTTP ${res.status}`);
            return [];
        }
        const json = await res.json();
        return (json.query && json.query.categorymembers) ? json.query.categorymembers : [];
    } catch (e) {
        console.error(`[Reels Scraper] ${category} fetch failed:`, e.message);
        return [];
    }
}

// ─── Resolve a batch of file titles to direct video URLs + thumbnails ──
async function fetchFileInfo(titles) {
    if (titles.length === 0) return {};
    // Wikimedia API allows up to 50 titles per request
    const batch = titles.slice(0, 50).map(encodeURIComponent).join('|');
    const url = `${COMMONS_API}?action=query&prop=imageinfo&iiprop=url|size|mime|mediatype&iiurlwidth=720&titles=${batch}&format=json&origin=*`;
    try {
        const res = await fetch(url, { headers: { 'User-Agent': ua(), 'Accept': 'application/json' } });
        if (!res.ok) return {};
        const json = await res.json();
        return (json.query && json.query.pages) ? json.query.pages : {};
    } catch (e) {
        console.error('[Reels Scraper] fileinfo fetch failed:', e.message);
        return {};
    }
}

function buildReel(page) {
    if (!page.imageinfo || page.imageinfo.length === 0) return null;
    const info = page.imageinfo[0];

    // Only video files
    if (info.mediatype !== 'VIDEO' && !/^video\//.test(info.mime || '')) return null;
    if (!info.url) return null;

    // Skip files that are too big (>30MB) to keep mobile-friendly
    if (info.size && info.size > 30 * 1024 * 1024) return null;

    const rawTitle = page.title || '';
    const niceTitle = prettifyTitle(rawTitle);
    const meta = classifyTitle(niceTitle);

    // Wikimedia auto-generates a thumbnail JPG for videos
    const thumb = info.thumburl || `https://upload.wikimedia.org/wikipedia/commons/thumb/${info.url.split('/commons/')[1]}/640px--${rawTitle.replace(/^File:/, '')}.jpg`;

    // Stable pseudo-random metrics derived from pageid
    const seed = page.pageid || Math.floor(Math.random() * 100000);
    const likes  = 1200 + (seed % 9800);
    const shares = 50 + (seed % 950);

    return {
        id: 'wm_' + page.pageid,
        title: niceTitle,
        description: `${meta.team} · Wikimedia Commons`,
        team: meta.team,
        tag: meta.tag,
        tagColor: meta.tagColor,
        type: 'mp4', // viewer treats webm/mp4 the same (HTML5 <video> tag)
        videoUrl: info.url,
        thumbnail: thumb,
        likes,
        shares,
        date: 'Liga libre',
        source: 'wikimedia',
        sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(rawTitle)}`,
        sizeBytes: info.size || 0,
        mime: info.mime || 'video/webm'
    };
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function loadFromDisk() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
            if (parsed && Array.isArray(parsed.reels)) {
                cache = {
                    reels: parsed.reels,
                    lastUpdated: parsed.lastUpdated || 0,
                    fetching: false
                };
                console.log(`[Reels Scraper] 💾 Loaded ${cache.reels.length} reels from disk`);
            }
        }
    } catch (e) {
        console.warn('[Reels Scraper] Disk load failed:', e.message);
    }
}

function persistToDisk() {
    try {
        const dir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify({
            lastUpdated: cache.lastUpdated,
            updatedAt: new Date(cache.lastUpdated).toISOString(),
            count: cache.reels.length,
            reels: cache.reels
        }, null, 2));
        console.log(`[Reels Scraper] 💾 Persisted ${cache.reels.length} reels to disk`);
    } catch (e) {
        console.warn('[Reels Scraper] Disk persist failed:', e.message);
    }
}

async function scrape() {
    if (cache.fetching) return cache.reels;
    cache.fetching = true;
    console.log('[Reels Scraper] 🔍 Scraping Wikimedia Commons…');

    try {
        // Step 1: collect file titles from each category
        const allTitles = new Set();
        const categoryStats = {};
        for (const cat of CATEGORIES) {
            const files = await fetchCategoryFiles(cat);
            categoryStats[cat] = files.length;
            for (const f of files) allTitles.add(f.title);
            await new Promise(r => setTimeout(r, 200)); // be polite
        }

        if (allTitles.size === 0) {
            console.warn('[Reels Scraper] ⚠️  No file titles retrieved — keeping previous cache');
            return cache.reels;
        }

        console.log(`[Reels Scraper] Found ${allTitles.size} candidate files across ${CATEGORIES.length} categories`);

        // Step 2: resolve file info in batches of 50
        const titleList = Array.from(allTitles);
        const reels = [];
        for (let i = 0; i < titleList.length; i += 50) {
            const batch = titleList.slice(i, i + 50);
            const pages = await fetchFileInfo(batch);
            for (const pageId in pages) {
                const reel = buildReel(pages[pageId]);
                if (reel) reels.push(reel);
            }
            await new Promise(r => setTimeout(r, 200));
        }

        if (reels.length === 0) {
            console.warn('[Reels Scraper] ⚠️  No playable reels extracted — keeping previous cache');
            return cache.reels;
        }

        // De-duplicate, shuffle, limit
        const seen = new Set();
        const unique = reels.filter(r => {
            if (seen.has(r.videoUrl)) return false;
            seen.add(r.videoUrl);
            return true;
        });
        const finalReels = shuffle(unique).slice(0, MAX_TOTAL_REELS);

        cache.reels = finalReels;
        cache.lastUpdated = Date.now();
        persistToDisk();
        console.log(`[Reels Scraper] ✅ Cached ${finalReels.length} reels (from ${unique.length} unique candidates)`);
    } catch (e) {
        console.error('[Reels Scraper] Scrape failed:', e.message);
    } finally {
        cache.fetching = false;
    }
    return cache.reels;
}

async function getReels(forceRefresh = false) {
    if (cache.reels.length === 0 && cache.lastUpdated === 0) {
        loadFromDisk();
    }
    const expired = Date.now() - cache.lastUpdated > CACHE_TTL_MS;
    if (forceRefresh || (expired && !cache.fetching) || cache.reels.length === 0) {
        if (cache.reels.length === 0) {
            // Block until first scrape completes
            await scrape();
        } else {
            // Refresh in background
            scrape().catch(() => {});
        }
    }
    return cache.reels;
}

function start() {
    loadFromDisk();
    // Initial scrape (non-blocking)
    scrape().catch(e => console.error('[Reels Scraper] Initial scrape error:', e));
    // Periodic refresh
    setInterval(() => {
        scrape().catch(e => console.error('[Reels Scraper] Refresh error:', e));
    }, CACHE_TTL_MS);
    console.log(`[Reels Scraper] ⏰ Background refresh enabled (every ${CACHE_TTL_MS / 60000} min)`);
}

module.exports = { getReels, scrape, start, CATEGORIES };
