const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '..', 'data', 'reels-scraped.json');
// TikTok signed URLs expire — refresh every 90 minutes to keep them fresh
const CACHE_TTL_MS = 90 * 60 * 1000;

const TIKWM_API = 'https://www.tikwm.com/api/feed/search';

// Mix of Liga MX, fútbol mundial, jugadores estrella — all in Spanish/relevant context
const KEYWORDS = [
    { q: 'ligamx',          tag: 'LIGA MX',  color: '#00ff95', team: 'Liga MX' },
    { q: 'futbol mexicano', tag: 'MEXICANO', color: '#006847', team: 'México' },
    { q: 'rayados',         tag: 'RAYADOS',  color: '#003DA5', team: 'Monterrey' },
    { q: 'club america',    tag: 'AMÉRICA',  color: '#FFD700', team: 'América' },
    { q: 'chivas',          tag: 'CHIVAS',   color: '#C8102E', team: 'Guadalajara' },
    { q: 'tigres uanl',     tag: 'TIGRES',   color: '#F5B400', team: 'Tigres' },
    { q: 'pumas unam',      tag: 'PUMAS',    color: '#1B295E', team: 'Pumas' },
    { q: 'cruz azul',       tag: 'CRUZ AZUL',color: '#1F4E8C', team: 'Cruz Azul' },
    { q: 'futbol golazo',   tag: 'GOLAZO',   color: '#FFD700', team: 'Goles' },
    { q: 'futbol skills',   tag: 'JUGADA',   color: '#00BFFF', team: 'Jugadas' },
    { q: 'messi',           tag: 'MESSI',    color: '#75AADB', team: 'Messi' },
    { q: 'cristiano ronaldo',tag: 'CR7',     color: '#c724b1', team: 'Cristiano' }
];

const VIDEOS_PER_KEYWORD = 8;
const MAX_TOTAL_REELS = 40;
const REQUEST_TIMEOUT_MS = 12000;

let cache = { reels: [], lastUpdated: 0, fetching: false };

function ua() {
    return 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
}

function fmtTimeAgo(unixTs) {
    if (!unixTs) return '';
    const diff = Date.now() - unixTs * 1000;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (mins  < 60) return mins  <= 1 ? 'Ahora' : `Hace ${mins} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days  < 7)  return `Hace ${days}d`;
    if (days  < 30) return `Hace ${Math.floor(days / 7)} sem`;
    return `Hace ${Math.floor(days / 30)} m`;
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        return await fetch(url, { ...opts, signal: ctrl.signal });
    } finally {
        clearTimeout(t);
    }
}

async function searchTikWM(keyword) {
    const url = `${TIKWM_API}?keywords=${encodeURIComponent(keyword)}&count=${VIDEOS_PER_KEYWORD}&cursor=0&hd=1`;
    try {
        const res = await fetchWithTimeout(url, {
            headers: { 'User-Agent': ua(), 'Accept': 'application/json' }
        });
        if (!res.ok) {
            console.warn(`[Reels Scraper] tikwm "${keyword}" → HTTP ${res.status}`);
            return [];
        }
        const json = await res.json();
        if (json.code !== 0 || !json.data || !json.data.videos) return [];
        return json.data.videos;
    } catch (e) {
        console.error(`[Reels Scraper] tikwm "${keyword}" failed:`, e.message);
        return [];
    }
}

function buildReel(video, source) {
    if (!video || !video.video_id) return null;

    // Prefer HD URL, fall back to no-watermark URL
    const videoUrl = video.hdplay || video.play || video.wmplay;
    if (!videoUrl) return null;

    const thumbnail = video.cover || video.origin_cover || video.ai_dynamic_cover;
    if (!thumbnail) return null;

    // Skip videos that are too long (>120 sec) — keep it reels-style
    if (video.duration && video.duration > 120) return null;

    let title = (video.title || '').replace(/#\w+/g, '').trim();
    if (!title) title = source.team;
    if (title.length > 100) title = title.substring(0, 97) + '…';

    const author = video.author && (video.author.unique_id || video.author.nickname) || '';

    return {
        id: 'tt_' + video.video_id,
        title,
        description: author ? `@${author} · TikTok` : 'TikTok',
        team: source.team,
        tag: source.tag,
        tagColor: source.color,
        type: 'mp4',
        videoUrl,
        thumbnail,
        likes: video.digg_count || 0,
        shares: video.share_count || 0,
        comments: video.comment_count || 0,
        views: video.play_count || 0,
        date: fmtTimeAgo(video.create_time),
        durationSec: video.duration || 0,
        source: 'tiktok',
        sourceUrl: author ? `https://www.tiktok.com/@${author}/video/${video.video_id}` : ''
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

// Interleave so the feed alternates between teams (no 8 América in a row)
function interleaveByTeam(reels) {
    const buckets = {};
    for (const r of reels) {
        if (!buckets[r.team]) buckets[r.team] = [];
        buckets[r.team].push(r);
    }
    const teamKeys = Object.keys(buckets);
    const out = [];
    let added = true;
    while (added) {
        added = false;
        for (const team of teamKeys) {
            if (buckets[team].length > 0) {
                out.push(buckets[team].shift());
                added = true;
            }
        }
    }
    return out;
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
            source: 'tiktok-via-tikwm',
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
    console.log(`[Reels Scraper] 🔍 Scraping TikTok via TikWM (${KEYWORDS.length} keywords)…`);

    try {
        const allReels = [];
        // Run keyword searches with small staggering to avoid rate limits
        for (const source of KEYWORDS) {
            const videos = await searchTikWM(source.q);
            for (const v of videos) {
                const reel = buildReel(v, source);
                if (reel) allReels.push(reel);
            }
            await new Promise(r => setTimeout(r, 350));
        }

        if (allReels.length === 0) {
            console.warn('[Reels Scraper] ⚠️  No reels extracted — keeping previous cache');
            return cache.reels;
        }

        // De-duplicate by video_id (same TikTok may surface for multiple keywords)
        const seen = new Set();
        const unique = allReels.filter(r => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
        });

        const interleaved = interleaveByTeam(shuffle(unique));
        const finalReels = interleaved.slice(0, MAX_TOTAL_REELS);

        cache.reels = finalReels;
        cache.lastUpdated = Date.now();
        persistToDisk();
        console.log(`[Reels Scraper] ✅ Cached ${finalReels.length} reels (from ${unique.length} unique TikToks)`);
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
            await scrape();
        } else {
            scrape().catch(() => {});
        }
    }
    return cache.reels;
}

function start() {
    loadFromDisk();
    scrape().catch(e => console.error('[Reels Scraper] Initial scrape error:', e));
    setInterval(() => {
        scrape().catch(e => console.error('[Reels Scraper] Refresh error:', e));
    }, CACHE_TTL_MS);
    console.log(`[Reels Scraper] ⏰ Background refresh enabled (every ${CACHE_TTL_MS / 60000} min)`);
}

module.exports = { getReels, scrape, start, KEYWORDS, CATEGORIES: KEYWORDS.map(k => k.q) };
