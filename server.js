const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fs = require('fs');
const webpush = require('web-push');

// ── VAPID keys for Web Push ───────────────────────────────────────────────────
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BNM5t2bsIMpDNEhPTtz3IvUjejXTs5x6NmpuT0C2xomXTuxBhlqlU_gSdGXf-66tv2VMiyg1e_w33oJXBjC7mKs';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'QEDtfLL6iA2dh_jF2Pkoi1wVsDE6HR5eT8MrvDMOP8Y';
webpush.setVapidDetails('mailto:admin@ultragol-l3ho.com.mx', VAPID_PUBLIC, VAPID_PRIVATE);

// ── Push subscription store (file-backed) ─────────────────────────────────────
const SUBS_FILE = path.join(__dirname, 'push-subscriptions.json');
function loadSubscriptions() {
    try { return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8')); } catch (_) { return {}; }
}
function saveSubscriptions(subs) {
    try { fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2)); } catch (_) {}
}
let pushSubscriptions = loadSubscriptions(); // { endpoint: subscriptionObject }

const app = express();
const PORT = process.env.PORT || 5000;

// ── Redirigir sin-www → www en producción ─────────────────────────────────────
app.use((req, res, next) => {
    const host = req.headers.host || '';
    if (process.env.NODE_ENV === 'production' && host === 'ultragol-l3ho.com.mx') {
        return res.redirect(301, `https://www.ultragol-l3ho.com.mx${req.originalUrl}`);
    }
    next();
});

// ── MODO MANTENIMIENTO ────────────────────────────────────────────────────────
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true' || false;

app.use((req, res, next) => {
    if (!MAINTENANCE_MODE) return next();
    // Allow API and static assets to pass through
    if (req.path.startsWith('/api/') || req.path.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|woff|woff2|ttf|json)$/)) {
        return next();
    }
    res.status(503).send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UltraGol — En Mantenimiento</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
            height: 100%;
            background: #000;
            font-family: 'Inter', 'Segoe UI', sans-serif;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 500px;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1.5rem;
            display: block;
        }
        h1 {
            font-size: 2rem;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 1rem;
            color: #fff;
        }
        h1 span {
            color: #e94560;
        }
        p {
            color: rgba(255,255,255,0.55);
            font-size: 1rem;
            line-height: 1.6;
        }
        .dot {
            display: inline-block;
            width: 8px; height: 8px;
            border-radius: 50%;
            background: #e94560;
            margin: 2rem auto 0;
            animation: pulse 1.4s ease-in-out infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; margin: 2rem 4px 0; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <span class="icon">⚙️</span>
        <h1>Sitio en <span>Mantenimiento</span></h1>
        <p>Estamos trabajando para mejorar tu experiencia. Volvemos pronto.</p>
        <div>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
    </div>
</body>
</html>`);
});
// ─────────────────────────────────────────────────────────────────────────────

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (!process.env.SESSION_SECRET) {
    console.warn('⚠️  SESSION_SECRET not set. Using a random secret for this session.');
}

app.use(session({
    secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// ── Rate limiting (in-memory, por IP) ────────────────────────────────────────
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 60;           // máx 60 peticiones por minuto por IP

function getRealIP(req) {
    return (req.headers['cf-connecting-ip'] ||
            req.headers['x-forwarded-for']?.split(',')[0] ||
            req.ip || '').trim();
}

function rateLimit(req, res, next) {
    const ip = getRealIP(req);
    const now = Date.now();
    const entry = rateLimitStore.get(ip) || { count: 0, start: now };

    if (now - entry.start > RATE_LIMIT_WINDOW) {
        entry.count = 1;
        entry.start = now;
    } else {
        entry.count++;
    }
    rateLimitStore.set(ip, entry);

    if (entry.count > RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Demasiadas peticiones. Intenta en un momento.' });
    }
    next();
}

// Limpieza periódica del store de rate limit
setInterval(() => {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW * 2;
    for (const [ip, e] of rateLimitStore) {
        if (e.start < cutoff) rateLimitStore.delete(ip);
    }
}, 5 * 60 * 1000);

// ── Protección de origen para rutas API ──────────────────────────────────────
const ALLOWED_ORIGINS = [
    'https://www.ultragol-l3ho.com.mx',
    'https://ultragol-l3ho.com.mx',
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
    process.env.REPLIT_DEPLOYMENT_ID ? `https://${process.env.REPLIT_DEPLOYMENT_ID}.repl.co` : null,
].filter(Boolean);

function apiOriginGuard(req, res, next) {
    const origin = req.headers['origin'] || '';
    const referer = req.headers['referer'] || '';

    // Allow same-origin requests from Replit domains (*.replit.dev, *.repl.co)
    const isReplitDomain = (s) => s.includes('.replit.dev') || s.includes('.repl.co') || s.includes('.replit.app');

    // Si viene directo sin origen (curl, bots simples) y no es localhost → bloquear
    if (!origin && !referer) {
        const ip = getRealIP(req);
        const isLocal = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.');
        if (!isLocal) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        return next();
    }

    // Allow any Replit-hosted domain automatically
    if (isReplitDomain(origin) || isReplitDomain(referer)) {
        return next();
    }

    const allowed = ALLOWED_ORIGINS.some(o =>
        origin.startsWith(o) || referer.startsWith(o)
    );
    if (!allowed) {
        return res.status(403).json({ error: 'Origen no permitido' });
    }
    next();
}

// Aplicar rate limit a todas las rutas /api/*
app.use('/api/', rateLimit);

// Aplicar origin guard a los endpoints de datos sensibles
[
    '/api/ultragol/',
    '/api/reels',
    '/api/share/',
    '/api/notifications',
].forEach(path => app.use(path, apiOriginGuard));

// ── Cloudflare Turnstile verification ─────────────────────────────────────────
app.post('/api/turnstile/verify', async (req, res) => {
    const token = req.body?.token;
    if (!token) return res.json({ success: false, error: 'missing_token' });

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        // If no secret is configured, allow through (dev mode)
        return res.json({ success: true, dev: true });
    }

    try {
        const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret, response: token, remoteip: req.ip })
        });
        const data = await r.json();
        if (data.success) {
            req.session.humanVerified = true;
            req.session.humanVerifiedAt = Date.now();
        }
        res.json({ success: data.success, error: data['error-codes']?.[0] });
    } catch (e) {
        console.error('[Turnstile]', e.message);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

// UltraGol API Proxy (para evitar problemas de CORS)
const API_BASE_URL = 'https://ultragol-api-3-phi.vercel.app';
const ULTRAGOL_API_KEY = process.env.ULTRAGOL_API_KEY || '';

function apiUrl(endpoint) {
    const url = `${API_BASE_URL}${endpoint}`;
    return ULTRAGOL_API_KEY ? `${url}${endpoint.includes('?') ? '&' : '?'}apiKey=${ULTRAGOL_API_KEY}` : url;
}

// Authentication API Configuration
const AUTH_API_URL = process.env.AUTH_API_URL || '';
const AUTH_API_FALLBACK = process.env.AUTH_API_FALLBACK_URL || '';

async function callAuthAPI(endpoint, options = {}) {
    const urls = [AUTH_API_URL, AUTH_API_FALLBACK].filter(Boolean);
    if (urls.length === 0) {
        throw new Error('No auth API configured');
    }
    
    for (const baseUrl of urls) {
        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                credentials: 'include'
            });
            return response;
        } catch (error) {
            console.error(`Error calling ${baseUrl}${endpoint}:`, error.message);
            if (baseUrl === urls[urls.length - 1]) {
                throw error;
            }
        }
    }
}

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email, favoriteTeam } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username y password son requeridos' });
        }

        if (!AUTH_API_URL && !AUTH_API_FALLBACK) {
            return res.status(503).json({ error: 'Servicio de autenticación no configurado' });
        }

        const registerData = { username, password };
        if (email) registerData.email = email;
        if (favoriteTeam) registerData.favoriteTeam = favoriteTeam;

        const response = await callAuthAPI('/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        });

        const data = await response.json();
        
        if (response.ok) {
            req.session.user = {
                ...data.user,
                email: email || data.user.email,
                favoriteTeam: favoriteTeam || data.user.favoriteTeam
            };
            req.session.isAuthenticated = true;
            res.status(201).json({
                ...data,
                user: req.session.user
            });
        } else {
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error del servidor al registrar usuario' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username y password son requeridos' });
        }

        if (!AUTH_API_URL && !AUTH_API_FALLBACK) {
            return res.status(503).json({ error: 'Servicio de autenticación no configurado' });
        }

        const response = await callAuthAPI('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            req.session.user = {
                id: data.user.id,
                username: data.user.username,
                role: data.user.role,
                created_at: data.user.created_at,
                email: data.user.email,
                favoriteTeam: data.user.favoriteTeam
            };
            req.session.isAuthenticated = true;
            res.json({
                ...data,
                user: req.session.user
            });
        } else {
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error del servidor al iniciar sesión' });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    try {
        await callAuthAPI('/logout', {
            method: 'POST'
        });
        
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.json({ message: 'Sesión cerrada exitosamente' });
        });
    } catch (error) {
        console.error('Error en logout:', error);
        req.session.destroy();
        res.json({ message: 'Sesión cerrada exitosamente' });
    }
});

app.get('/api/auth/perfil', async (req, res) => {
    try {
        if (!req.session.isAuthenticated) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const response = await callAuthAPI('/perfil', {
            method: 'GET'
        });

        const data = await response.json();
        
        if (response.ok) {
            res.json(data);
        } else {
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ error: 'Error del servidor al obtener perfil' });
    }
});

app.get('/api/auth/session', (req, res) => {
    if (req.session.isAuthenticated && req.session.user) {
        res.json({
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({
            authenticated: false
        });
    }
});

console.log('✅ Authentication API proxy enabled');

async function safeProxy(res, upstreamPath, fallback = {}) {
    try {
        const response = await fetch(apiUrl(upstreamPath), { signal: AbortSignal.timeout(8000) });
        if (!response.ok) return res.json(fallback);
        const data = await response.json();
        res.json(data);
    } catch (_) {
        res.json(fallback);
    }
}

app.get('/api/ultragol/tabla', (req, res) => safeProxy(res, '/tabla', { tabla: [] }));
app.get('/api/ultragol/goleadores', (req, res) => safeProxy(res, '/goleadores', { goleadores: [] }));
app.get('/api/ultragol/noticias', (req, res) => safeProxy(res, '/Noticias', { noticias: [] }));
app.get('/api/ultragol/equipos', (req, res) => safeProxy(res, '/Equipos', []));
app.get('/api/ultragol/videos', (req, res) => safeProxy(res, '/videos', { videos: [] }));
app.get('/api/ultragol/notificaciones', (req, res) => safeProxy(res, '/notificaciones', { notificaciones: [], total: 0 }));

// League-specific marcadores proxy endpoints (used by ticker and live scoreboard)
const LEAGUE_ENDPOINTS = [
    { path: '/api/ultragol/marcadores',            upstream: '/marcadores' },
    { path: '/api/ultragol/premier-marcadores',    upstream: '/premier/marcadores' },
    { path: '/api/ultragol/laliga-marcadores',     upstream: '/laliga/marcadores' },
    { path: '/api/ultragol/seriea-marcadores',     upstream: '/seriea/marcadores' },
    { path: '/api/ultragol/bundesliga-marcadores', upstream: '/bundesliga/marcadores' },
    { path: '/api/ultragol/ligue1-marcadores',     upstream: '/ligue1/marcadores' },
];

for (const { path: routePath, upstream } of LEAGUE_ENDPOINTS) {
    app.get(routePath, async (req, res) => {
        try {
            const response = await fetch(apiUrl(upstream), { signal: AbortSignal.timeout(8000) });
            if (!response.ok) {
                return res.json({ partidos: [], matches: [], events: [] });
            }
            const data = await response.json();
            res.json(data);
        } catch (error) {
            res.json({ partidos: [], matches: [], events: [] });
        }
    });
}

// /api/ultragol/partidos — returns merged transmissions (used by live-scoreboard)
app.get('/api/ultragol/partidos', async (req, res) => {
    try {
        const response = await fetch(apiUrl('/gol-3'), { signal: AbortSignal.timeout(8000) });
        if (!response.ok) {
            return res.json({ transmisiones: [], partidos: [] });
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.json({ transmisiones: [], partidos: [] });
    }
});

// ─── REELS SCRAPER (Reddit-based) ───
const reelsScraper = require('./server/reels-scraper');
reelsScraper.start();

app.get('/api/reels', async (req, res) => {
    try {
        const force = req.query.refresh === '1';
        const reels = await reelsScraper.getReels(force);
        res.set('Cache-Control', 'public, max-age=300');
        res.json({
            ok: true,
            count: reels.length,
            sources: reelsScraper.CATEGORIES,
            reels
        });
    } catch (e) {
        console.error('[/api/reels]', e);
        res.status(500).json({ ok: false, error: 'Failed to load reels', reels: [] });
    }
});

// Smart notifications endpoint — generates real notifications from all 6 leagues
const LIGAS_CONFIG = [
    { nombre: 'Liga MX',        emoji: '🇲🇽', endpoint: '/marcadores' },
    { nombre: 'Premier League', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', endpoint: '/premier/marcadores' },
    { nombre: 'La Liga',        emoji: '🇪🇸', endpoint: '/laliga/marcadores' },
    { nombre: 'Serie A',        emoji: '🇮🇹', endpoint: '/seriea/marcadores' },
    { nombre: 'Bundesliga',     emoji: '🇩🇪', endpoint: '/bundesliga/marcadores' },
    { nombre: 'Ligue 1',        emoji: '🇫🇷', endpoint: '/ligue1/marcadores' },
];

// In-memory broadcast queue — admin can push custom notifications to all users
const broadcastQueue = [];
const BROADCAST_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function cleanBroadcasts() {
    const cutoff = Date.now() - BROADCAST_TTL_MS;
    while (broadcastQueue.length && broadcastQueue[0].ts < cutoff) broadcastQueue.shift();
}

// ── Share-link store (file-backed, 48 h TTL) ─────────────────────────────────
const SHARE_STORE_FILE = path.join(__dirname, 'data', 'share-store.json');
const SHARE_TTL_MS = 48 * 60 * 60 * 1000;
const shareStore = new Map();

(function _loadShareStore() {
    try {
        if (fs.existsSync(SHARE_STORE_FILE)) {
            const raw = JSON.parse(fs.readFileSync(SHARE_STORE_FILE, 'utf8'));
            const cutoff = Date.now() - SHARE_TTL_MS;
            for (const [id, val] of Object.entries(raw)) {
                if (val.ts >= cutoff) shareStore.set(id, val);
            }
            console.log(`📎 Share store cargado: ${shareStore.size} enlaces`);
        }
    } catch (e) { console.warn('⚠️  No se pudo cargar share store:', e.message); }
})();

function _saveShareStore() {
    try {
        const obj = {};
        for (const [id, val] of shareStore) obj[id] = val;
        fs.writeFileSync(SHARE_STORE_FILE, JSON.stringify(obj), 'utf8');
    } catch (e) { console.warn('⚠️  No se pudo guardar share store:', e.message); }
}

function _cleanShareStore() {
    const cutoff = Date.now() - SHARE_TTL_MS;
    let removed = 0;
    for (const [id, val] of shareStore) { if (val.ts < cutoff) { shareStore.delete(id); removed++; } }
    if (removed) _saveShareStore();
}

function _genShareId() {
    let id;
    do { id = Math.random().toString(36).slice(2, 8).toUpperCase(); } while (shareStore.has(id));
    return id;
}

app.post('/api/share/match', express.json(), (req, res) => {
    _cleanShareStore();
    const { title, channels } = req.body || {};
    if (!title || !Array.isArray(channels)) return res.status(400).json({ error: 'Faltan datos' });
    const id = _genShareId();
    shareStore.set(id, { title, channels, ts: Date.now() });
    _saveShareStore();
    console.log(`🔗 Share link creado: ${id} — "${title}" (${channels.length} canales)`);
    res.json({ id });
});

app.get('/api/share/match/:id', (req, res) => {
    _cleanShareStore();
    const data = shareStore.get((req.params.id || '').toUpperCase());
    if (!data) return res.status(404).json({ error: 'Link expirado o no encontrado' });
    res.json({ title: data.title, channels: data.channels });
});
// ────────────────────────────────────────────────────────────────────────────

// SSE client registry — one entry per connected browser tab
const sseClients = new Set();

// GET /api/notifications/stream — Server-Sent Events for real-time delivery
app.get('/api/notifications/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`);

    sseClients.add(res);
    console.log(`📡 SSE client connected (total: ${sseClients.size})`);

    // Heartbeat every 25s to keep the connection alive through proxies
    const heartbeat = setInterval(() => {
        try { res.write(':ping\n\n'); } catch (_) {}
    }, 25000);

    req.on('close', () => {
        clearInterval(heartbeat);
        sseClients.delete(res);
        console.log(`📡 SSE client disconnected (total: ${sseClients.size})`);
    });
});

// GET /api/notifications/stream/count — how many clients are connected right now
app.get('/api/notifications/stream/count', (req, res) => {
    res.json({ count: sseClients.size });
});

function pushToSSEClients(notif) {
    const payload = `data: ${JSON.stringify(notif)}\n\n`;
    sseClients.forEach(client => {
        try { client.write(payload); } catch (_) { sseClients.delete(client); }
    });
}

// GET /api/vapid-key — public VAPID key for the browser to subscribe
app.get('/api/vapid-key', (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC });
});

// POST /api/subscribe — save a new push subscription
app.post('/api/subscribe', (req, res) => {
    const sub = req.body;
    if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Suscripción inválida' });
    pushSubscriptions[sub.endpoint] = sub;
    saveSubscriptions(pushSubscriptions);
    const total = Object.keys(pushSubscriptions).length;
    console.log(`📲 Nueva suscripción push. Total: ${total}`);
    res.json({ success: true, total });
});

// DELETE /api/subscribe — remove a push subscription
app.delete('/api/subscribe', (req, res) => {
    const { endpoint } = req.body || {};
    if (endpoint && pushSubscriptions[endpoint]) {
        delete pushSubscriptions[endpoint];
        saveSubscriptions(pushSubscriptions);
    }
    res.json({ success: true });
});

// GET /api/subscribe/count — total stored push subscriptions
app.get('/api/subscribe/count', (req, res) => {
    res.json({ total: Object.keys(pushSubscriptions).length });
});

// Helper: send Web Push to all stored subscriptions
async function sendWebPushToAll(payload) {
    const subs = Object.values(pushSubscriptions);
    let sent = 0, failed = 0, expired = [];
    await Promise.allSettled(subs.map(async (sub) => {
        try {
            await webpush.sendNotification(sub, JSON.stringify(payload));
            sent++;
        } catch (err) {
            failed++;
            // 410 Gone = subscription expired/unsubscribed — remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
                expired.push(sub.endpoint);
            }
        }
    }));
    // Clean expired subscriptions
    expired.forEach(ep => delete pushSubscriptions[ep]);
    if (expired.length) saveSubscriptions(pushSubscriptions);
    return { sent, failed, expired: expired.length };
}

// POST /api/admin/broadcast — send a custom notification to all users
app.post('/api/admin/broadcast', async (req, res) => {
    const { titulo, mensaje, icono, url, liga } = req.body || {};
    if (!titulo || !mensaje) {
        return res.status(400).json({ success: false, error: 'titulo y mensaje son requeridos' });
    }
    cleanBroadcasts();
    const notif = {
        id: `broadcast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        icono: icono || '/app-icon.png',
        url: url || '/',
        ts: Date.now(),
        tipo: 'broadcast',
        liga: liga || ''
    };
    broadcastQueue.push(notif);

    // 1. Push immediately to all connected SSE clients (app open right now)
    pushToSSEClients(notif);

    // 2. Send Web Push to ALL stored subscriptions (app closed too)
    const pushPayload = {
        title: notif.titulo,
        body: notif.mensaje,
        icon: notif.icono,
        url: notif.url,
        tag: notif.id
    };
    const pushResult = await sendWebPushToAll(pushPayload);
    const totalSubs = Object.keys(pushSubscriptions).length;

    console.log(`📣 Broadcast: SSE=${sseClients.size} WebPush enviados=${pushResult.sent}/${totalSubs} fallidos=${pushResult.failed}`);
    res.json({
        success: true,
        id: notif.id,
        ts: notif.ts,
        clientesConectados: sseClients.size,
        webPush: { enviados: pushResult.sent, total: totalSubs, fallidos: pushResult.failed }
    });
});

async function fetchLigaMatches(liga) {
    try {
        const r = await fetch(apiUrl(liga.endpoint), { signal: AbortSignal.timeout(6000) });
        if (!r.ok) return [];
        const d = await r.json();
        const partidos = d.partidos || d.ligamx || d.matches || [];
        return partidos.map(p => ({ ...p, _liga: liga.nombre, _emoji: liga.emoji }));
    } catch (_) {
        return [];
    }
}

app.get('/api/notifications', async (req, res) => {
    try {
        const since = parseInt(req.query.since) || 0;
        const notifications = [];
        const now = Date.now();

        // Fetch all 6 leagues in parallel
        const results = await Promise.allSettled(LIGAS_CONFIG.map(fetchLigaMatches));
        const todosLosPartidos = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

        todosLosPartidos.forEach(p => {
            const id = p.id || p.matchId || `${p.local?.nombre}-${p.visitante?.nombre}`;
            const enVivo = p.estado?.enVivo || p.live || false;
            const finalizado = p.estado?.finalizado || p.finished || false;
            const programado = p.estado?.programado || false;
            const local = p.local?.nombreCorto || p.local?.nombre || 'Local';
            const visitante = p.visitante?.nombreCorto || p.visitante?.nombre || 'Visitante';
            const marcadorL = p.local?.marcador ?? '';
            const marcadorV = p.visitante?.marcador ?? '';
            const liga = p._liga || '';
            const emoji = p._emoji || '⚽';

            if (enVivo) {
                notifications.push({
                    id: `live-${id}-${marcadorL}-${marcadorV}`,
                    titulo: `${emoji} EN VIVO · ${liga}`,
                    mensaje: `${local} ${marcadorL} : ${marcadorV} ${visitante}`,
                    icono: '/app-icon.png',
                    url: '/',
                    ts: now,
                    tipo: 'live',
                    liga
                });
            } else if (finalizado && marcadorL !== '' && marcadorV !== '') {
                notifications.push({
                    id: `final-${id}-${marcadorL}-${marcadorV}`,
                    titulo: `🏁 Final · ${liga}`,
                    mensaje: `${local} ${marcadorL} - ${marcadorV} ${visitante}`,
                    icono: '/app-icon.png',
                    url: '/',
                    ts: now,
                    tipo: 'final',
                    liga
                });
            } else if (programado) {
                let hora = '';
                if (p.fecha && typeof p.fecha === 'string') {
                    hora = p.fecha.split(',')[1]?.trim() || p.fecha;
                }
                notifications.push({
                    id: `sched-${id}`,
                    titulo: `📅 ${liga}`,
                    mensaje: hora ? `${local} vs ${visitante} a las ${hora}` : `${local} vs ${visitante}`,
                    icono: '/app-icon.png',
                    url: '/',
                    ts: now,
                    tipo: 'programado',
                    liga
                });
            }
        });

        // Include any broadcast messages from the admin
        cleanBroadcasts();
        broadcastQueue.forEach(b => notifications.push(b));

        // Filter to only newer than `since`
        const filtered = since > 0
            ? notifications.filter(n => n.ts > since)
            : notifications;

        res.json({
            success: true,
            total: filtered.length,
            notificaciones: filtered,
            actualizado: new Date().toLocaleString('es-MX')
        });
    } catch (error) {
        console.error('Error generating notifications:', error);
        res.json({ success: false, total: 0, notificaciones: [] });
    }
});

app.get('/api/ultragol/transmisiones1', async (req, res) => {
    try {
        const response = await fetch(apiUrl('/gol-1'));
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error proxying gol-1:', error);
        res.status(500).json({ transmisiones: [] });
    }
});

app.get('/api/ultragol/transmisiones3', async (req, res) => {
    try {
        const response = await fetch(apiUrl('/gol-3'));
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error proxying gol-3:', error);
        res.status(500).json({ error: 'Error al obtener gol-3' });
    }
});

app.get('/api/ultragol/transmisiones6', async (req, res) => {
    try {
        const response = await fetch(apiUrl('/gol-6'));
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.warn('⚠️ API externa gol-6 no disponible, usando JSON local:', error.message);
        try {
            const fs = require('fs');
            const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'ultrax', 'transmisiones6.json'), 'utf8'));
            res.json(data);
        } catch (localError) {
            console.error('Error al leer transmisiones6.json local:', localError);
            res.status(500).json({ error: 'Error al obtener gol-6' });
        }
    }
});

app.get('/transmisiones6', (req, res) => {
    res.sendFile(path.join(__dirname, 'ultrax', 'index.html'));
});

console.log('✅ UltraGol API proxy enabled');

// ── Geo: country detection proxy (evita CORS del navegador) ──────────────────
app.get('/api/geo', async (req, res) => {
    const ip = getRealIP(req);
    try {
        const r = await fetch(`https://ipapi.co/${ip}/json/`, {
            headers: { 'User-Agent': 'UltraGol/1.0' },
            signal: AbortSignal.timeout(4000)
        });
        if (!r.ok) return res.json({ country_code: null });
        const data = await r.json();
        res.json({ country_code: data.country_code || null, country_name: data.country_name || null });
    } catch (_) {
        res.json({ country_code: null });
    }
});

// ── Gemini AI proxy (via Replit AI Integrations — no user key needed) ─────────
app.post('/api/gemini/chat', express.json(), async (req, res) => {
    const GEMINI_API_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const GEMINI_BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
    if (!GEMINI_API_KEY) {
        return res.status(503).json({ error: 'Gemini AI not configured' });
    }
    const { prompt, generationConfig } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    try {
        const baseUrl = GEMINI_BASE_URL
            ? `${GEMINI_BASE_URL}/models/gemini-2.5-flash:generateContent`
            : `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const headers = { 'Content-Type': 'application/json' };
        if (GEMINI_BASE_URL) headers['Authorization'] = `Bearer ${GEMINI_API_KEY}`;
        const r = await fetch(baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: generationConfig || {
                    temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024
                }
            }),
            signal: AbortSignal.timeout(30000)
        });
        const data = await r.json();
        if (!r.ok) return res.status(r.status).json(data);
        res.json(data);
    } catch (e) {
        console.error('[/api/gemini/chat]', e.message);
        res.status(500).json({ error: 'AI request failed' });
    }
});

if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    const { 
        createPaypalOrder, 
        capturePaypalOrder, 
        loadPaypalDefault 
    } = require('./server/paypal');

    app.post('/api/paypal/orders', createPaypalOrder);
    app.post('/api/paypal/orders/:orderID/capture', capturePaypalOrder);
    app.get('/api/paypal', loadPaypalDefault);
    console.log('✅ PayPal integration enabled');
} else {
    console.log('⚠️  PayPal integration disabled (missing credentials)');
    app.post('/api/paypal/orders', (req, res) => {
        res.status(503).json({ error: 'PayPal service not configured' });
    });
    app.post('/api/paypal/orders/:orderID/capture', (req, res) => {
        res.status(503).json({ error: 'PayPal service not configured' });
    });
    app.get('/api/paypal', (req, res) => {
        res.status(503).json({ error: 'PayPal service not configured' });
    });
}

// ============================================================
//  MX — SEO Match Pages
// ============================================================

// Canonical country-name aliases: maps any known variant (EN/ES/short) → canonical ES slug base
const COUNTRY_ALIASES = {
    // Korea
    'korea republic':       'corea del sur',
    'republic of korea':    'corea del sur',
    'south korea':          'corea del sur',
    'corea':                'corea del sur',
    'korea':                'corea del sur',
    // USA
    'united states':        'estados unidos',
    'united states of america': 'estados unidos',
    'usa':                  'estados unidos',
    'us':                   'estados unidos',
    // England
    'england':              'inglaterra',
    // Germany
    'germany':              'alemania',
    // France
    'france':               'francia',
    // Switzerland
    'switzerland':          'suiza',
    // Netherlands
    'netherlands':          'paises bajos',
    'holland':              'paises bajos',
    'the netherlands':      'paises bajos',
    // Saudi Arabia
    'saudi arabia':         'arabia saudita',
    // Ivory Coast
    'ivory coast':          'costa de marfil',
    "cote d'ivoire":        'costa de marfil',
    'cote divoire':         'costa de marfil',
    // Democratic Republic Congo
    'dr congo':             'congo dr',
    'democratic republic of congo': 'congo dr',
    // IR Iran
    'ir iran':              'iran',
    'islamic republic of iran': 'iran',
    // New Zealand
    'new zealand':          'nueva zelanda',
    // North Korea
    'korea dpr':            'corea del norte',
    'dpr korea':            'corea del norte',
    'north korea':          'corea del norte',
    // Czech Republic
    'czech republic':       'republica checa',
    'czechia':              'republica checa',
    // Serbia
    'serbia':               'serbia',
    // Japan
    'japan':                'japon',
    // Australia
    'australia':            'australia',
    // Portugal
    'portugal':             'portugal',
    // Morocco
    'morocco':              'marruecos',
    // Egypt
    'egypt':                'egipto',
    // Nigeria
    'nigeria':              'nigeria',
    // Senegal
    'senegal':              'senegal',
    // Cameroon
    'cameroon':             'camerun',
    // Ghana
    'ghana':                'ghana',
    // Tunisia
    'tunisia':              'tunez',
    // Algeria
    'algeria':              'argelia',
    // Belgium
    'belgium':              'belgica',
    // Poland
    'poland':               'polonia',
    // Denmark
    'denmark':              'dinamarca',
    // Sweden
    'sweden':               'suecia',
    // Norway
    'norway':               'noruega',
    // Austria
    'austria':              'austria',
    // Romania
    'romania':              'rumania',
    // Hungary
    'hungary':              'hungria',
    // Slovakia
    'slovakia':             'eslovaquia',
    // Slovenia
    'slovenia':             'eslovenia',
    // Greece
    'greece':               'grecia',
    // Turkey
    'turkey':               'turquia',
    'turkiye':              'turquia',
    // Ukraine
    'ukraine':              'ucrania',
    // Russia
    'russia':               'rusia',
    // China PR
    'china pr':             'china',
    "china people's republic": 'china',
    // Chinese Taipei
    'chinese taipei':       'taipei chino',
    // Uzbekistan
    'uzbekistan':           'uzbekistan',
    // India
    'india':                'india',
    // Venezuela
    'venezuela':            'venezuela',
    // Bolivia
    'bolivia':              'bolivia',
    // Ecuador
    'ecuador':              'ecuador',
    // Paraguay
    'paraguay':             'paraguay',
    // Trinidad and Tobago
    'trinidad and tobago':  'trinidad y tobago',
    // Costa Rica
    'costa rica':           'costa rica',
    // Honduras
    'honduras':             'honduras',
    // El Salvador
    'el salvador':          'el salvador',
    // Guatemala
    'guatemala':            'guatemala',
    // Jamaica
    'jamaica':              'jamaica',
    // Haiti
    'haiti':                'haiti',
    // Canada
    'canada':               'canada',
    // New Caledonia
    'new caledonia':        'nueva caledonia',
    // Tahiti
    'tahiti':               'tahiti',
    // Fiji
    'fiji':                 'fiji',
    // Solomon Islands
    'solomon islands':      'islas salomon',
    // Cuba
    'cuba':                 'cuba',
    // Panama
    'panama':               'panama',
    // Trinidad
    'trinidad':             'trinidad y tobago',
};

function normalizeCountryName(name) {
    if (!name) return '';
    const key = (name).toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '').trim();
    return COUNTRY_ALIASES[key] || name;
}

function slugify(text) {
    return (text || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '').trim()
        .replace(/\s+/g, '-');
}

function matchSlug(local, visitante) {
    return `${slugify(local)}-vs-${slugify(visitante)}`;
}

// Build slug using normalized country names for cross-language matching
function mundialMatchSlug(home, away) {
    return matchSlug(normalizeCountryName(home), normalizeCountryName(away));
}

async function safeFetch(url) {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const text = await res.text();
        return JSON.parse(text);
    } catch { return null; }
}

// Map team name → local logo file (overrides API logos which can be swapped)
const LOCAL_LOGO_MAP = {
    'america': 'america', 'club america': 'america', 'club américa': 'america',
    'chivas': 'chivas', 'guadalajara': 'chivas', 'cd guadalajara': 'chivas', 'chivas de guadalajara': 'chivas',
    'cruz azul': 'cruz-azul',
    'toluca': 'toluca', 'deportivo toluca': 'toluca',
    'pachuca': 'pachuca', 'cf pachuca': 'pachuca', 'tuzos': 'pachuca',
    'pumas': 'pumas', 'pumas unam': 'pumas',
    'atlas': 'atlas', 'atlas fc': 'atlas',
    'tigres': 'tigres', 'tigres uanl': 'tigres',
    'necaxa': 'necaxa', 'club necaxa': 'necaxa',
    'juarez': 'fc-juarez', 'fc juarez': 'fc-juarez', 'fc juárez': 'fc-juarez',
    'leon': 'leon', 'club leon': 'leon', 'club león': 'leon',
    'tijuana': 'tijuana', 'xolos': 'tijuana', 'club tijuana': 'tijuana',
    'monterrey': 'monterrey', 'cf monterrey': 'monterrey', 'rayados': 'monterrey',
    'san luis': 'atletico-san-luis', 'atletico san luis': 'atletico-san-luis',
    'atlético de san luis': 'atletico-san-luis', 'atletico de san luis': 'atletico-san-luis',
    'puebla': 'puebla', 'club puebla': 'puebla',
    'queretaro': 'queretaro', 'querétaro': 'queretaro', 'gallos blancos': 'queretaro',
    'mazatlan': 'mazatlan', 'mazatlán': 'mazatlan', 'mazatlan fc': 'mazatlan',
    'santos': 'santos', 'santos laguna': 'santos',
};

function getLocalLogo(teamName) {
    const key = (teamName || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '').trim();
    const file = LOCAL_LOGO_MAP[key];
    return file ? `/assets/logos/${file}.png` : null;
}

// Normalize any transmission item into a common match object
function normalizeTransmision(item, fuente) {
    // Some sources (e.g. transmisiones5) only provide a "title" like "PSG vs Bayern"
    let equipo1 = item.equipo1 || item.local || '';
    let equipo2 = item.equipo2 || item.visitante || '';
    if ((!equipo1 || !equipo2) && (item.title || item.evento || item.titulo)) {
        const raw = item.title || item.evento || item.titulo;
        const m = String(raw).split(/\s+vs\.?\s+|\s+x\s+/i);
        if (m.length >= 2) {
            equipo1 = equipo1 || m[0].trim();
            equipo2 = equipo2 || m.slice(1).join(' vs ').trim();
        }
    }
    const titulo = item.titulo || item.evento || item.title || `${equipo1} vs ${equipo2}`;
    const slug = matchSlug(equipo1, equipo2);

    // Collect ALL stream URLs available, comma-joined for multi-server playback
    const urls = [];
    const pushUrl = u => { if (u && typeof u === 'string' && /^https?:/i.test(u)) urls.push(u); };
    if (item.url) pushUrl(item.url);
    if (Array.isArray(item.enlaces)) item.enlaces.forEach(pushUrl);
    if (Array.isArray(item.canales)) {
        item.canales.forEach(c => pushUrl(c && (c.url || c.urlStream || c.link)));
    }
    if (Array.isArray(item.fuentes)) item.fuentes.forEach(f => pushUrl(f && (f.url || f.urlStream)));
    // transmisiones5 → links: [{ type:'urls_list', data:[{ match_url, stream_source, stream_quality }] }]
    if (Array.isArray(item.links)) {
        item.links.forEach(group => {
            if (group && Array.isArray(group.data)) {
                group.data.forEach(d => pushUrl(d && (d.match_url || d.url)));
            } else if (group && (group.match_url || group.url)) {
                pushUrl(group.match_url || group.url);
            }
        });
    }
    const transmisionUrl = urls.length ? [...new Set(urls)].join(',') : null;

    const estadoRaw = (item.estado || item.status || '').toString().toLowerCase();
    const enVivo = estadoRaw.includes('vivo') || estadoRaw.includes('live');
    const finalizado = estadoRaw.includes('finaliz') || estadoRaw.includes('terminado') || estadoRaw.includes('full');

    // Prefer local logos (always correct) over API logos (can be swapped).
    // When at least one team has a local logo, avoid using API logos for the other
    // team (API may have logos in the wrong order for that match).
    const localLogo1 = getLocalLogo(equipo1);
    const localLogo2 = getLocalLogo(equipo2);
    const eitherLocal = localLogo1 || localLogo2;

    return {
        slug,
        titulo,
        equipo1,
        equipo2,
        logo1: localLogo1 || (eitherLocal ? null : item.logo1) || null,
        logo2: localLogo2 || (eitherLocal ? null : item.logo2) || null,
        hora: item.hora || item.hour || '',
        fecha: item.fecha || item.fechaISO || '',
        liga: item.liga || item.league || item.info || item.pais || item.categoria || '',
        deporte: item.deporte || item.categoria || item.sport || 'Fútbol',
        estado: {
            enVivo,
            finalizado,
            programado: !enVivo && !finalizado,
            descripcion: item.estado || (enVivo ? 'En Vivo' : finalizado ? 'Terminado' : 'Próximo'),
        },
        transmisionUrl,
        fuente,
        marcadorLocal: null,
        marcadorVisitante: null,
        goles: [],
        detalles: {},
    };
}

// Fetch and merge all transmission sources + marcadores
async function fetchAllPartidos() {
    const [marc, t1, t2, t3, t4, t5, t6, t7, t8] = await Promise.all([
        safeFetch(apiUrl('/marcadores')),
        safeFetch(apiUrl('/gol-1')),
        safeFetch(apiUrl('/gol-2')),
        safeFetch(apiUrl('/gol-3')),
        safeFetch(apiUrl('/gol-4')),
        safeFetch(apiUrl('/gol-5')),
        safeFetch(apiUrl('/gol-6')),
        safeFetch(apiUrl('/gol-7')),
        safeFetch(apiUrl('/gol-8')),
    ]);

    const map = new Map();

    const sources = [
        { data: t1, key: 'transmisiones1' },
        { data: t2, key: 'transmisiones2' },
        { data: t3, key: 'transmisiones3' },
        { data: t4, key: 'transmisiones4' },
        { data: t5, key: 'transmisiones5' },
        { data: t6, key: 'transmisiones6' },
        { data: t7, key: 'transmisiones7' },
        { data: t8, key: 'transmisiones8' },
    ];

    for (const { data, key } of sources) {
        if (!data) continue;
        const items = data.transmisiones || data.partidos || data.eventos || data.matches || [];
        for (const item of items) {
            const norm = normalizeTransmision(item, key);
            if (!norm.slug || norm.slug === '-vs-') continue;
            if (!map.has(norm.slug)) {
                map.set(norm.slug, norm);
            } else {
                const existing = map.get(norm.slug);
                // Merge stream URLs from multiple sources (multi-server playback)
                if (norm.transmisionUrl) {
                    const merged = new Set(
                        [...(existing.transmisionUrl || '').split(','), ...norm.transmisionUrl.split(',')]
                            .map(s => s.trim()).filter(Boolean)
                    );
                    existing.transmisionUrl = [...merged].join(',');
                }
                if (key === 'transmisiones6') { existing.estado = norm.estado; existing.fuente = key; }
                if (!existing.logo1 && norm.logo1) existing.logo1 = norm.logo1;
                if (!existing.logo2 && norm.logo2) existing.logo2 = norm.logo2;
                if (!existing.liga && norm.liga) existing.liga = norm.liga;
                if (!existing.hora && norm.hora) existing.hora = norm.hora;
            }
        }
    }

    // Enrich with marcadores (real scores, goals, stadium)
    if (marc && marc.partidos) {
        for (const p of marc.partidos) {
            const s = matchSlug(p.local.nombre, p.visitante.nombre);
            const prev = map.get(s);
            map.set(s, {
                slug: s,
                titulo: `${p.local.nombre} vs ${p.visitante.nombre}`,
                equipo1: p.local.nombre,
                equipo2: p.visitante.nombre,
                logo1: getLocalLogo(p.local.nombre) || p.local.logo || null,
                logo2: getLocalLogo(p.visitante.nombre) || p.visitante.logo || null,
                hora: p.fecha || '',
                liga: marc.liga || 'Liga MX',
                deporte: 'Fútbol',
                estado: p.estado,
                marcadorLocal: p.local.marcador,
                marcadorVisitante: p.visitante.marcador,
                goles: p.goles || [],
                detalles: p.detalles || {},
                transmisionUrl: (prev && prev.transmisionUrl) || null,
                fuente: 'marcadores',
                nombreCortoLocal: p.local.nombreCorto,
                nombreCortoVisitante: p.visitante.nombreCorto,
            });
        }
    }

    const partidos = Array.from(map.values());
    partidos.sort((a, b) => {
        const score = p => p.estado && p.estado.enVivo ? 0 : p.estado && p.estado.programado ? 1 : 2;
        return score(a) - score(b);
    });
    return partidos;
}

// ─── PLAYER PHOTO + INFO (TheSportsDB + ESPN, caché 60 min) ──────────────────
const playerCache = new Map();

app.get('/api/player-photo', async (req, res) => {
    const name = (req.query.name || '').trim();
    const teamHint = (req.query.team || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
    if (!name) return res.json({ url: null });

    const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
    const key = norm(name) + (teamHint ? ':' + teamHint : '');
    const cached = playerCache.get('photo:' + key);
    if (cached && Date.now() - cached.ts < 3_600_000) return res.json({ url: cached.url });

    try {
        const r = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`, { signal: AbortSignal.timeout(5000) });
        const d = await r.json();
        const allPlayers = d.player || [];
        const soccerPlayers = allPlayers.filter(p => p.strSport === 'Soccer' || p.strSport === 'Football');

        let p = null;
        if (teamHint && soccerPlayers.length > 1) {
            p = soccerPlayers.find(pl => norm(pl.strTeam).includes(teamHint) || teamHint.includes(norm(pl.strTeam)));
        }
        p = p || soccerPlayers[0] || allPlayers[0];

        const url = p?.strCutout || p?.strThumb || null;
        playerCache.set('photo:' + key, { url, ts: Date.now() });
        return res.json({ url });
    } catch(_) {
        playerCache.set('photo:' + key, { url: null, ts: Date.now() });
        return res.json({ url: null });
    }
});

app.get('/api/player-info', async (req, res) => {
    const name = (req.query.name || '').trim();
    const teamHint = (req.query.team || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
    if (!name) return res.json({ error: 'name required' });

    const key = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim() + (teamHint ? ':' + teamHint : '');
    const cached = playerCache.get('info:' + key);
    if (cached && Date.now() - cached.ts < 3_600_000) return res.json(cached.data);

    const result = { name, photo: null, cutout: null, nationality: null, position: null, age: null, born: null, team: null, teamLogo: null, height: null, weight: null, goals: null, assists: null, shots: null, appearances: null, espnUrl: null };

    // Helper: normalize string for comparison
    const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim();

    // 1. TheSportsDB — photo, nationality, position, DOB (prefer team match)
    try {
        const r = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`, { signal: AbortSignal.timeout(5000) });
        const d = await r.json();
        const allPlayers = (d.player || []);
        const soccerPlayers = allPlayers.filter(p => p.strSport === 'Soccer' || p.strSport === 'Football');

        // Try to pick the best match using team hint
        let p = null;
        if (teamHint && soccerPlayers.length > 1) {
            p = soccerPlayers.find(pl => norm(pl.strTeam).includes(teamHint) || teamHint.includes(norm(pl.strTeam)));
        }
        p = p || soccerPlayers[0] || allPlayers[0];

        if (p) {
            result.name = p.strPlayer || name;
            result.photo = p.strThumb || null;
            result.cutout = p.strCutout || null;
            result.nationality = p.strNationality || null;
            result.position = p.strPosition || null;
            result.born = p.dateBorn || null;
            if (result.born) {
                const age = Math.floor((Date.now() - new Date(result.born)) / (365.25 * 86400000));
                result.age = age;
            }
        }
    } catch(_) {}

    // 2. ESPN search — get athlete ID → stats (prefer team match)
    try {
        const r = await fetch(`https://site.api.espn.com/apis/search/v2?query=${encodeURIComponent(name)}&limit=10&lang=es`, { signal: AbortSignal.timeout(4000) });
        const d = await r.json();
        const section = (d.results || []).find(s => s.type === 'player');
        const candidates = section?.contents || [];

        // Pick best match: prefer if subtitle (team) matches teamHint
        let p = null;
        if (teamHint && candidates.length > 1) {
            p = candidates.find(c => norm(c.subtitle).includes(teamHint) || teamHint.includes(norm(c.subtitle)));
        }
        p = p || candidates[0];

        if (p?.uid) {
            const match = p.uid.match(/~a:(\d+)/);
            const athleteId = match?.[1];
            if (athleteId) {
                result.espnUrl = p.link?.web || null;
                try {
                    const sr = await fetch(`https://site.api.espn.com/apis/common/v3/sports/soccer/athletes/${athleteId}`, { signal: AbortSignal.timeout(4000) });
                    const sd = await sr.json();
                    const athlete = sd.athlete || {};
                    result.height = athlete.displayHeight || null;
                    result.weight = athlete.displayWeight || null;
                    if (athlete.displayDOB) result.born = athlete.displayDOB;
                    if (athlete.age) result.age = athlete.age;
                    const team = athlete.team;
                    if (team) {
                        result.team = team.displayName || null;
                        result.teamLogo = team.logos?.[0]?.href || null;
                    }
                    if (!result.position && athlete.position?.displayName) result.position = athlete.position.displayName;
                    const stats = athlete.statsSummary?.statistics || [];
                    for (const s of stats) {
                        if (s.name === 'totalGoals') result.goals = s.displayValue;
                        if (s.name === 'goalAssists') result.assists = s.displayValue;
                        if (s.name === 'totalShots') result.shots = s.displayValue;
                        if (s.name === 'gamesPlayed') result.appearances = s.displayValue;
                        if (s.name === 'starts-subIns') result.appearances = s.displayValue;
                    }
                } catch(_) {}
            }
        }
    } catch(_) {}

    playerCache.set('info:' + key, { data: result, ts: Date.now() });
    res.json(result);
});

// ─── TEAM PROFILE — Google-style aggregated data (TheSportsDB, caché 30 min) ──
const teamProfileCache = new Map();
const TEAM_PROFILE_TTL = 30 * 60 * 1000;
const TSDB_KEY = process.env.TSDB_API_KEY || '3';
const TSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${TSDB_KEY}`;

const _normTeam = s => (s || '').toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

async function _tsdbFetch(url, timeoutMs = 5000) {
    try {
        const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
        if (!r.ok) return null;
        return await r.json();
    } catch (_) { return null; }
}

const _ligaMxAliases = {
    'america': ['CF America', 'Club America'],
    'club america': ['CF America'],
    'chivas': ['CD Guadalajara'],
    'guadalajara': ['CD Guadalajara'],
    'tigres': ['Tigres'],
    'tigres uanl': ['Tigres'],
    'rayados': ['Monterrey'],
    'monterrey': ['Monterrey'],
    'pumas': ['Pumas'],
    'pumas unam': ['Pumas'],
    'unam': ['Pumas'],
    'cruz azul': ['Cruz Azul'],
    'tuzos': ['Pachuca'],
    'pachuca': ['Pachuca'],
    'xolos': ['Tijuana'],
    'tijuana': ['Tijuana'],
    'atlas': ['Atlas'],
    'leon': ['León'], 'león': ['León'],
    'toluca': ['Toluca'],
    'puebla': ['Puebla'],
    'necaxa': ['Necaxa'],
    'santos': ['Santos Laguna'],
    'mazatlan': ['Mazatlán'], 'mazatlán': ['Mazatlán'],
    'queretaro': ['Queretaro FC'], 'querétaro': ['Queretaro FC'],
    'juarez': ['FC Juarez'], 'juárez': ['FC Juarez'],
    'san luis': ['Atletico de San Luis'], 'atletico san luis': ['Atletico de San Luis'],
};

// Common aliases for international clubs (city/short name → TheSportsDB team name)
const _intlAliases = {
    'los angeles': ['Los Angeles FC', 'LA Galaxy'],
    'la': ['Los Angeles FC', 'LA Galaxy'],
    'lafc': ['Los Angeles FC'],
    'la galaxy': ['LA Galaxy'],
    'inter miami': ['Inter Miami CF', 'Inter Miami'],
    'miami': ['Inter Miami CF'],
    'new york': ['New York City FC', 'New York Red Bulls'],
    'nyc': ['New York City FC'],
    'nycfc': ['New York City FC'],
    'psg': ['Paris Saint-Germain', 'Paris SG'],
    'paris': ['Paris Saint-Germain'],
    'manchester united': ['Manchester United'],
    'man united': ['Manchester United'],
    'man utd': ['Manchester United'],
    'manchester city': ['Manchester City'],
    'man city': ['Manchester City'],
    'bayern': ['Bayern Munich'],
    'barca': ['Barcelona'], 'barça': ['Barcelona'],
    'atleti': ['Atletico Madrid'],
    'atletico': ['Atletico Madrid'],
    'atlético': ['Atletico Madrid'],
    'juventus': ['Juventus'],
    'juve': ['Juventus'],
    'milan': ['AC Milan'],
    'inter': ['Inter Milan'],
    'inter milan': ['Inter Milan'],
    'liverpool': ['Liverpool'],
    'arsenal': ['Arsenal'],
    'chelsea': ['Chelsea'],
    'tottenham': ['Tottenham'], 'spurs': ['Tottenham'],
    'dortmund': ['Borussia Dortmund'],
    'bvb': ['Borussia Dortmund'],
};

async function _resolveTeam(name, sport = 'soccer') {
    if (!name) return null;
    const variants = [];
    const original = name.trim();
    variants.push(original);
    const stripped = original.replace(/^(club|cf|fc|cd|real|deportivo|atlético|atletico|sc|ac)\s+/i, '').trim();
    if (stripped && stripped.toLowerCase() !== original.toLowerCase()) variants.push(stripped);
    const tokens = original.split(/\s+/).filter(t => t.length >= 4);
    if (tokens.length > 1) {
        const longest = tokens.sort((a, b) => b.length - a.length)[0];
        if (!variants.find(v => v.toLowerCase() === longest.toLowerCase())) variants.push(longest);
    }
    const aliasKey = original.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const ligaMxMatches = _ligaMxAliases[aliasKey] || [];
    const intlMatches = _intlAliases[aliasKey] || [];
    const isLigaMx = ligaMxMatches.length > 0;
    [...ligaMxMatches, ...intlMatches].forEach(m => {
        if (!variants.find(v => v.toLowerCase() === m.toLowerCase())) variants.push(m);
    });
    // Fallback: try common suffixes for short queries
    if (original.split(/\s+/).length <= 2 && !ligaMxMatches.length && !intlMatches.length) {
        ['FC', 'United'].forEach(suffix => {
            const v = `${original} ${suffix}`;
            if (!variants.find(x => x.toLowerCase() === v.toLowerCase())) variants.push(v);
        });
    }
    for (const v of variants) {
        const search = await _tsdbFetch(`${TSDB_BASE}/searchteams.php?t=${encodeURIComponent(v)}`);
        const team = _pickBestTeam(search?.teams, v, sport, isLigaMx);
        if (team) return team;
    }
    return null;
}

function _mapEvent(e) {
    return {
        id: e.idEvent,
        date: e.dateEvent || e.dateEventLocal,
        time: e.strTime || e.strTimeLocal || '',
        timestamp: e.strTimestamp,
        league: e.strLeague,
        leagueId: e.idLeague,
        season: e.strSeason,
        round: e.intRound,
        home: e.strHomeTeam,
        away: e.strAwayTeam,
        homeId: e.idHomeTeam,
        awayId: e.idAwayTeam,
        homeScore: e.intHomeScore,
        awayScore: e.intAwayScore,
        homeBadge: e.strHomeTeamBadge || null,
        awayBadge: e.strAwayTeamBadge || null,
        status: e.strStatus || (e.intHomeScore != null ? 'Finished' : 'Scheduled'),
        thumb: e.strThumb || null,
        video: e.strVideo || null,
        venue: e.strVenue || null,
        country: e.strCountry || null,
        postponed: e.strPostponed || null,
    };
}

function _pickBestTeam(teams, query, sportHint, preferMexican = false) {
    if (!Array.isArray(teams) || teams.length === 0) return null;
    const q = _normTeam(query);
    const sport = (sportHint || 'soccer').toLowerCase();
    let pool = teams.filter(t => (t.strSport || '').toLowerCase().includes(sport === 'soccer' ? 'soccer' : sport));
    if (pool.length === 0) pool = teams;
    pool.sort((a, b) => {
        // Prefer Mexican Primera League for known Liga MX team queries
        if (preferMexican) {
            const am = (a.strLeague || '').toLowerCase().includes('mexican primera') ? 0 : 1;
            const bm = (b.strLeague || '').toLowerCase().includes('mexican primera') ? 0 : 1;
            if (am !== bm) return am - bm;
        }
        const an = _normTeam(a.strTeam);
        const bn = _normTeam(b.strTeam);
        const ax = an === q ? 0 : an.startsWith(q) ? 1 : an.includes(q) ? 2 : 3;
        const bx = bn === q ? 0 : bn.startsWith(q) ? 1 : bn.includes(q) ? 2 : 3;
        if (ax !== bx) return ax - bx;
        // tie-break: prefer top European/American leagues
        const topLeagues = ['english premier', 'spanish la liga', 'italian serie a', 'german bundesliga', 'french ligue 1', 'mls'];
        const ap = topLeagues.some(l => (a.strLeague || '').toLowerCase().includes(l)) ? 0 : 1;
        const bp = topLeagues.some(l => (b.strLeague || '').toLowerCase().includes(l)) ? 0 : 1;
        return ap - bp;
    });
    return pool[0];
}

app.get('/api/team-profile', async (req, res) => {
    const name = (req.query.name || '').trim();
    const sport = (req.query.sport || 'soccer').trim();
    if (!name) return res.status(400).json({ ok: false, error: 'name required' });

    const cacheKey = `${_normTeam(name)}:${sport}`;
    const cached = teamProfileCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < TEAM_PROFILE_TTL) {
        return res.json(cached.data);
    }

    try {
        const team = await _resolveTeam(name, sport);
        if (!team) {
            const empty = { ok: false, error: 'team_not_found', query: name };
            teamProfileCache.set(cacheKey, { data: empty, ts: Date.now() });
            return res.json(empty);
        }

        const teamId = team.idTeam;
        const leagueId = team.idLeague;

        // 2. Parallel fetch: last events, next events, squad, standings
        const [last, next, squad, standings] = await Promise.all([
            _tsdbFetch(`${TSDB_BASE}/eventslast.php?id=${teamId}`),
            _tsdbFetch(`${TSDB_BASE}/eventsnext.php?id=${teamId}`),
            _tsdbFetch(`${TSDB_BASE}/lookup_all_players.php?id=${teamId}`),
            leagueId ? _tsdbFetch(`${TSDB_BASE}/lookuptable.php?l=${leagueId}&s=${encodeURIComponent(team.strCurrentSeason || '2025-2026')}`) : Promise.resolve(null),
        ]);

        const data = {
            ok: true,
            team: {
                id: teamId,
                name: team.strTeam,
                shortName: team.strTeamShort || team.strTeam,
                alternate: team.strAlternate,
                league: team.strLeague,
                leagueId: leagueId,
                country: team.strCountry,
                founded: team.intFormedYear,
                stadium: team.strStadium,
                stadiumThumb: team.strStadiumThumb,
                stadiumLocation: team.strStadiumLocation,
                stadiumCapacity: team.intStadiumCapacity,
                stadiumDescription: team.strStadiumDescription,
                website: team.strWebsite,
                instagram: team.strInstagram,
                twitter: team.strTwitter,
                facebook: team.strFacebook,
                youtube: team.strYoutube,
                badge: team.strBadge || team.strTeamBadge,
                logo: team.strLogo,
                banner: team.strBanner,
                fanart: team.strFanart1 || team.strFanart2 || null,
                jersey: team.strEquipment,
                description: team.strDescriptionES || team.strDescriptionEN || '',
                colors: [team.strColour1, team.strColour2, team.strColour3].filter(Boolean),
            },
            lastMatches: (last?.results || []).map(_mapEvent),
            nextMatches: (next?.events || []).map(_mapEvent),
            squad: (squad?.player || []).map(p => ({
                id: p.idPlayer,
                name: p.strPlayer,
                position: p.strPosition,
                nationality: p.strNationality,
                born: p.dateBorn,
                photo: p.strCutout || p.strThumb,
                number: p.strNumber,
                wage: p.strWage,
                height: p.strHeight,
                weight: p.strWeight,
                signed: p.strSigning,
            })).filter(p => p.name),
            standings: (standings?.table || []).map(s => ({
                position: parseInt(s.intRank, 10),
                teamId: s.idTeam,
                team: s.strTeam,
                badge: s.strBadge || s.strTeamBadge,
                played: parseInt(s.intPlayed, 10),
                wins: parseInt(s.intWin, 10),
                draws: parseInt(s.intDraw, 10),
                losses: parseInt(s.intLoss, 10),
                goalsFor: parseInt(s.intGoalsFor, 10),
                goalsAgainst: parseInt(s.intGoalsAgainst, 10),
                goalDifference: parseInt(s.intGoalDifference, 10),
                points: parseInt(s.intPoints, 10),
                form: s.strForm || '',
                isCurrent: s.idTeam === teamId,
            })),
            cachedAt: Date.now(),
        };

        teamProfileCache.set(cacheKey, { data, ts: Date.now() });
        res.set('Cache-Control', 'public, max-age=900');
        res.json(data);
    } catch (e) {
        console.error('[/api/team-profile]', e);
        res.status(500).json({ ok: false, error: 'fetch_failed' });
    }
});

// ─── MATCH PROFILE (scrape para "EquipoA vs EquipoB", caché 15 min) ──────────
const matchProfileCache = new Map();
const MATCH_PROFILE_TTL = 15 * 60 * 1000;

app.get('/api/match-profile', async (req, res) => {
    const home = (req.query.home || '').trim();
    const away = (req.query.away || '').trim();
    const sport = (req.query.sport || 'soccer').trim();
    if (!home || !away) return res.status(400).json({ ok: false, error: 'home and away required' });

    const cacheKey = `${_normTeam(home)}|${_normTeam(away)}|${sport}`;
    const cached = matchProfileCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < MATCH_PROFILE_TTL) {
        return res.json(cached.data);
    }

    try {
        // Resolve both teams in parallel
        const [teamA, teamB] = await Promise.all([
            _resolveTeam(home, sport),
            _resolveTeam(away, sport),
        ]);

        if (!teamA && !teamB) {
            const empty = { ok: false, error: 'teams_not_found', home, away };
            matchProfileCache.set(cacheKey, { data: empty, ts: Date.now() });
            return res.json(empty);
        }

        // Fetch each team's last/next events in parallel
        const fetches = [];
        if (teamA) {
            fetches.push(_tsdbFetch(`${TSDB_BASE}/eventslast.php?id=${teamA.idTeam}`));
            fetches.push(_tsdbFetch(`${TSDB_BASE}/eventsnext.php?id=${teamA.idTeam}`));
        } else { fetches.push(null, null); }
        if (teamB) {
            fetches.push(_tsdbFetch(`${TSDB_BASE}/eventslast.php?id=${teamB.idTeam}`));
            fetches.push(_tsdbFetch(`${TSDB_BASE}/eventsnext.php?id=${teamB.idTeam}`));
        } else { fetches.push(null, null); }

        const [lastA, nextA, lastB, nextB] = await Promise.all(fetches);

        const allEvents = [
            ...((lastA?.results || []).map(_mapEvent)),
            ...((nextA?.events || []).map(_mapEvent)),
            ...((lastB?.results || []).map(_mapEvent)),
            ...((nextB?.events || []).map(_mapEvent)),
        ];

        // Find head-to-head events (matches involving BOTH teams)
        const h2hAll = teamA && teamB
            ? allEvents.filter(e => {
                const ids = [String(e.homeId), String(e.awayId)];
                return ids.includes(String(teamA.idTeam)) && ids.includes(String(teamB.idTeam));
            })
            : [];
        // Dedup by event id
        const seen = new Set();
        const h2h = h2hAll.filter(e => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
        }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        // Pick "main match": next upcoming H2H, fallback to most recent H2H
        const now = Date.now();
        const upcoming = h2h.filter(e => {
            const t = e.date ? new Date(e.date + (e.time ? 'T' + e.time : '')).getTime() : 0;
            return t >= now - 6 * 3600 * 1000; // include matches starting up to 6h ago (live)
        }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        const mainMatch = upcoming[0] || h2h[0] || null;

        // Pick league for standings: from main match, else from teamA, else teamB
        const leagueId = mainMatch?.leagueId || teamA?.idLeague || teamB?.idLeague || null;
        const leagueName = mainMatch?.league || teamA?.strLeague || teamB?.strLeague || null;
        const season = teamA?.strCurrentSeason || teamB?.strCurrentSeason || '2025-2026';

        const standingsRaw = leagueId
            ? await _tsdbFetch(`${TSDB_BASE}/lookuptable.php?l=${leagueId}&s=${encodeURIComponent(season)}`)
            : null;

        const standings = (standingsRaw?.table || []).map(s => ({
            position: parseInt(s.intRank, 10),
            teamId: s.idTeam,
            team: s.strTeam,
            badge: s.strBadge || s.strTeamBadge,
            played: parseInt(s.intPlayed, 10),
            wins: parseInt(s.intWin, 10),
            draws: parseInt(s.intDraw, 10),
            losses: parseInt(s.intLoss, 10),
            goalsFor: parseInt(s.intGoalsFor, 10),
            goalsAgainst: parseInt(s.intGoalsAgainst, 10),
            goalDifference: parseInt(s.intGoalDifference, 10),
            points: parseInt(s.intPoints, 10),
            form: s.strForm || '',
            isHome: teamA && s.idTeam === teamA.idTeam,
            isAway: teamB && s.idTeam === teamB.idTeam,
        }));

        // Each team's last 5 results (form)
        const teamForm = (raw, teamId) => (raw?.results || []).slice(0, 5).map(e => {
            const isHome = String(e.idHomeTeam) === String(teamId);
            const myScore = isHome ? parseInt(e.intHomeScore, 10) : parseInt(e.intAwayScore, 10);
            const oppScore = isHome ? parseInt(e.intAwayScore, 10) : parseInt(e.intHomeScore, 10);
            let result = '?';
            if (!isNaN(myScore) && !isNaN(oppScore)) {
                if (myScore > oppScore) result = 'V';
                else if (myScore < oppScore) result = 'D';
                else result = 'E';
            }
            return {
                result,
                date: e.dateEvent,
                opponent: isHome ? e.strAwayTeam : e.strHomeTeam,
                myScore: isNaN(myScore) ? null : myScore,
                oppScore: isNaN(oppScore) ? null : oppScore,
                isHome,
            };
        });

        const teamCard = t => t ? {
            id: t.idTeam,
            name: t.strTeam,
            shortName: t.strTeamShort || t.strTeam,
            badge: t.strBadge || t.strTeamBadge,
            league: t.strLeague,
            country: t.strCountry,
            stadium: t.strStadium,
        } : null;

        const data = {
            ok: true,
            query: { home, away },
            home: teamCard(teamA),
            away: teamCard(teamB),
            mainMatch,
            headToHead: h2h.slice(0, 8),
            homeForm: teamForm(lastA, teamA?.idTeam),
            awayForm: teamForm(lastB, teamB?.idTeam),
            homeNext: ((nextA?.events || []).map(_mapEvent)).slice(0, 3),
            awayNext: ((nextB?.events || []).map(_mapEvent)).slice(0, 3),
            league: leagueName ? { id: leagueId, name: leagueName, season } : null,
            standings,
            cachedAt: Date.now(),
        };

        matchProfileCache.set(cacheKey, { data, ts: Date.now() });
        res.set('Cache-Control', 'public, max-age=600');
        res.json(data);
    } catch (e) {
        console.error('[/api/match-profile]', e);
        res.status(500).json({ ok: false, error: 'fetch_failed' });
    }
});

// ─── LOGO LOOKUP (scrape ESPN por nombre de equipo, con caché 30 min) ─────────
const logoCache = new Map();
app.get('/api/team-logo', async (req, res) => {
    const team = (req.query.team || '').trim();
    if (!team) return res.json({ url: null });

    const key = team.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

    const local = getLocalLogo(key);
    if (local) return res.json({ url: local });

    const cached = logoCache.get(key);
    if (cached && Date.now() - cached.ts < 1_800_000) return res.json({ url: cached.url });

    // 1. Try ESPN text search first (fastest, covers most teams)
    try {
        const searchUrl = `https://site.api.espn.com/apis/search/v2?query=${encodeURIComponent(key)}&limit=5&type=team&lang=es`;
        const r = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
        const data = await r.json();
        const teamSection = (data?.results || []).find(s => s.type === 'team');
        const contents = teamSection?.contents || [];
        for (const item of contents) {
            const logo = item?.image?.default || item?.image?.href;
            if (logo) {
                logoCache.set(key, { url: logo, ts: Date.now() });
                return res.json({ url: logo });
            }
        }
    } catch (_) {}

    // 2. Fallback: iterate known ESPN league endpoints
    const endpoints = [
        'https://site.api.espn.com/apis/site/v2/sports/soccer/conmebol.libertadores/teams?limit=100',
        'https://site.api.espn.com/apis/site/v2/sports/soccer/conmebol.sudamericana/teams?limit=100',
        'https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams?limit=700',
        'https://site.api.espn.com/apis/site/v2/sports/soccer/col.1/teams?limit=40',
        'https://site.api.espn.com/apis/site/v2/sports/soccer/pe.1/teams?limit=40',
        'https://site.api.espn.com/apis/site/v2/sports/soccer/uru.1/teams?limit=40',
        'https://site.api.espn.com/apis/site/v2/sports/soccer/ven.1/teams?limit=40',
        'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=60',
        'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams?limit=60',
        'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams?limit=60',
        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams?limit=60',
    ];

    for (const url of endpoints) {
        try {
            const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
            const data = await r.json();
            const teams = (data?.sports?.[0]?.leagues || []).flatMap(l => l.teams || [])
                .concat(data?.teams || []);
            const found = teams.find(({ team: t }) => {
                const d = (t?.displayName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
                const s = (t?.shortDisplayName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
                return d.includes(key) || key.includes(d) || s.includes(key) || key.includes(s);
            });
            if (found?.team?.logos?.[0]?.href) {
                const logoUrl = found.team.logos[0].href;
                logoCache.set(key, { url: logoUrl, ts: Date.now() });
                return res.json({ url: logoUrl });
            }
        } catch (_) {}
    }

    logoCache.set(key, { url: null, ts: Date.now() });
    res.json({ url: null });
});

// ─── Google Search Console verification (explicit route so Vercel bundles the file) ──
app.get('/google45d0913179243d5e.html', (req, res) => {
    res.type('text/html');
    res.send('google-site-verification: google45d0913179243d5e.html');
});

// ─── ROBOTS.TXT — must be BEFORE static middlewares so ULTRA/robots.txt doesn't win ──
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /ultra/
Disallow: /ultracanales/

Sitemap: https://www.ultragol-l3ho.com.mx/sitemap.xml
`);
});

// ─── SITEMAP.XML dinámico ─────────────────────────────────────────────────────
app.get('/sitemap.xml', async (req, res) => {
    const BASE = 'https://www.ultragol-l3ho.com.mx';
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
    ];

    const matchPages = [];

    const allPages = [...staticPages, ...matchPages];
    const urls = allPages.map(p => `
  <url>
    <loc>${BASE}${p.url}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`);
});


app.use(express.static(path.join(__dirname, 'ultrax'), {
    index: false,
    setHeaders: (res, filepath) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

app.use(express.static(path.join(__dirname), {
    index: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}));

app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=86400');
    }
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ULTRACANALES routes MUST come before /ultra to avoid prefix collision
// (/ultracanales starts with /ultra so Express would match the wrong middleware)
app.get(/^\/ultracanales$/, (req, res) => {
    res.redirect(301, '/ultracanales/');
});
app.get(/^\/ULTRACANALES\/?$/, (req, res) => {
    res.redirect(301, '/ultracanales/');
});
app.get('/ultracanales/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ULTRACANALES', 'index.html'));
});
const _ucStaticOpts = {
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
};
app.use('/ultracanales', express.static(path.join(__dirname, 'ULTRACANALES'), _ucStaticOpts));
app.use('/ULTRACANALES', express.static(path.join(__dirname, 'ULTRACANALES'), _ucStaticOpts));

// Redirects for old /ULTRA/* and /ultra/* URLs → /ultrax
app.use('/ULTRA', (req, res) => {
    const dest = req.path && req.path !== '/' ? `/ultrax${req.path}` : '/ultrax';
    res.redirect(301, dest);
});
app.use('/ultra', (req, res) => {
    const dest = req.path && req.path !== '/' ? `/ultrax${req.path}` : '/ultrax';
    res.redirect(301, dest);
});

// ultrax — exact copy of ULTRA (must be before /ultra to avoid prefix match)
app.get('/ultrax', (req, res) => {
    res.sendFile(path.join(__dirname, 'ultrax', 'index.html'));
});
app.use('/ultrax', express.static(path.join(__dirname, 'ultrax'), {
    index: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}));


app.get('/test-notifications', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-notifications.html'));
});
app.get('/test-notifications.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-notifications.html'));
});

app.get('/cinenova', (req, res) => {
    res.sendFile(path.join(__dirname, 'cinenova.html'));
});

app.get('/knexo', (req, res) => {
    res.sendFile(path.join(__dirname, 'knexo.html'));
});


// ── UltraWidget agenda proxy (fetches all 7 APIs server-side) ────────────────
let agendaCache = null;
let agendaCacheTime = 0;
const AGENDA_TTL = 4 * 60 * 1000; // 4 min cache

async function fetchAgendaAPI(url) {
    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 12000);
        const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'UltraWidget/1.0' } });
        clearTimeout(timer);
        if (!r.ok) return {};
        return await r.json();
    } catch (e) { return {}; }
}

app.get('/api/ultrawidget-agenda', async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    const now = Date.now();
    if (agendaCache && (now - agendaCacheTime) < AGENDA_TTL) {
        return res.json(agendaCache);
    }
    const BASE = 'https://ultragol-api-3-phi.vercel.app';
    const [d1, d2, d3, d4, d5, d6, d7, d8] = await Promise.all([
        fetchAgendaAPI(`${BASE}/gol-1`),
        fetchAgendaAPI(`${BASE}/gol-2`),
        fetchAgendaAPI(`${BASE}/gol-3`),
        fetchAgendaAPI(`${BASE}/gol-4`),
        fetchAgendaAPI(`${BASE}/gol-5`),
        fetchAgendaAPI(`${BASE}/gol-6`),
        fetchAgendaAPI(`${BASE}/gol-7`),
        fetchAgendaAPI(`${BASE}/gol-8`),
    ]);
    const payload = {
        api1: d1.transmisiones || [],
        api2: d2.transmisiones || [],
        api3: d3.transmisiones || [],
        api4: d4.transmisiones || [],
        api5: d5.matches || [],
        api6: d6.transmisiones || [],
        api7: d7.transmisiones || [],
        api8: d8.transmisiones || [],
        ts: now,
    };
    agendaCache = payload;
    agendaCacheTime = now;
    res.json(payload);
});

app.get('/ultrawidget', (req, res) => {
    res.sendFile(path.join(__dirname, 'ultrawidget', 'index.html'));
});
app.get(['/ultrawidget/', '/ultrawidget/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'ultrawidget', 'index.html'));
});
app.use('/ultrawidget', express.static(path.join(__dirname, 'ultrawidget'), {
    index: false,
    setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
}));

// ─── COPA MUNDIAL 2026 — Real-time data endpoints ─────────────────────────────
const mundialCache = { partidos: null, grupos: null, goleadores: null, ts: 0, goleadoresTs: 0 };
const MUNDIAL_TTL = 60 * 1000; // 60-second cache

// ── FIFA Official API helpers ──────────────────────────────────────────────────
const FIFA_BASE = 'https://api.fifa.com/api/v3';
const FIFA_COMPETITION = '17';
const FIFA_SEASON_2026  = '285023';
const FIFA_HEADERS = {
    'Origin': 'https://www.fifa.com',
    'Referer': 'https://www.fifa.com/',
    'User-Agent': 'Mozilla/5.0 (compatible; UltraGol/2.0)',
    'Accept': 'application/json',
};

async function fifaFetch(url) {
    try {
        const r = await fetch(url, {
            signal: AbortSignal.timeout(10000),
            headers: FIFA_HEADERS,
        });
        if (!r.ok) return null;
        return await r.json();
    } catch (_) { return null; }
}

// Map FIFA MatchStatus codes to our state strings
// 0=Finished  1=Scheduled  2=1st Half  3=HalfTime  4=2nd Half
// 5=ExtraTime  6=Penalties  7=Final  8=Postponed  9=Abandoned
function fifaState(statusCode) {
    if (statusCode === 0 || statusCode === 7) return 'post';
    if ([2, 3, 4, 5, 6].includes(statusCode)) return 'in';
    return 'pre'; // 1 = scheduled, 8 = postponed, etc.
}

function fifaStatusLabel(statusCode) {
    const map = { 0:'Final', 1:'Programado', 2:'1er Tiempo', 3:'Medio Tiempo', 4:'2do Tiempo', 5:'Tiempo Extra', 6:'Penales', 7:'Final', 8:'Pospuesto', 9:'Suspendido' };
    return map[statusCode] || '';
}

function fifaFlagUrl(countryCode) {
    if (!countryCode) return '';
    return `https://api.fifa.com/api/v3/picture/flags-sq-1/${countryCode}`;
}

function fifaLocale(arr, locale = 'en-GB') {
    if (!Array.isArray(arr) || arr.length === 0) return '';
    return (arr.find(x => x.Locale === locale) || arr[0])?.Description || '';
}

function parseMatchRecord(m) {
    const statusCode = m.MatchStatus ?? 1;
    const state = fifaState(statusCode);
    const home = m.Home || {};
    const away = m.Away || {};
    const stadium = m.Stadium || {};

    return {
        id: m.IdMatch,
        titulo: `${fifaLocale(home.TeamName)} vs ${fifaLocale(away.TeamName)}`,
        home: {
            name: fifaLocale(home.TeamName) || home.ShortClubName || '',
            shortName: home.ShortClubName || home.Abbreviation || '',
            code: home.IdCountry || '',
            logo: fifaFlagUrl(home.IdCountry),
            score: home.Score ?? null,
        },
        away: {
            name: fifaLocale(away.TeamName) || away.ShortClubName || '',
            shortName: away.ShortClubName || away.Abbreviation || '',
            code: away.IdCountry || '',
            logo: fifaFlagUrl(away.IdCountry),
            score: away.Score ?? null,
        },
        estado: state,
        enVivo: state === 'in',
        finalizado: state === 'post',
        programado: state === 'pre',
        minuto: m.MatchTime || '',
        detalle: fifaStatusLabel(statusCode),
        statusCode,
        periodo: m.Period || null,
        fecha: m.Date || '',
        fechaLocal: m.LocalDate || '',
        venue: fifaLocale(stadium.Name),
        venueCity: fifaLocale(stadium.CityName),
        grupo: fifaLocale(m.GroupName),
        fase: fifaLocale(m.StageName),
        transmisionUrl: null,
    };
}

// GET /api/mundial/partidos — live + upcoming + finished from FIFA official API
app.get('/api/mundial/partidos', async (req, res) => {
    const now = Date.now();
    if (mundialCache.partidos && (now - mundialCache.ts) < MUNDIAL_TTL) {
        return res.json(mundialCache.partidos);
    }

    try {
        // Fetch all 104 scheduled matches + any live ones in parallel
        const [allData, liveData] = await Promise.all([
            fifaFetch(`${FIFA_BASE}/calendar/matches?idCompetition=${FIFA_COMPETITION}&idSeason=${FIFA_SEASON_2026}&language=en&count=104`),
            fifaFetch(`${FIFA_BASE}/live/football/${FIFA_COMPETITION}/${FIFA_SEASON_2026}?language=en`),
        ]);

        if (!allData?.Results) {
            return res.status(502).json({ ok: false, error: 'FIFA API unavailable', partidos: [] });
        }

        // Build a live-match lookup keyed by IdMatch for enrichment
        const liveMap = {};
        for (const lm of (liveData?.Results || [])) {
            liveMap[lm.IdMatch] = lm;
        }

        const partidos = allData.Results.map(m => {
            // Override with live data when available
            const live = liveMap[m.IdMatch];
            const source = live ? { ...m, ...live } : m;
            return parseMatchRecord(source);
        });

        // Sort: live first, then by date ascending
        partidos.sort((a, b) => {
            const ord = s => s === 'in' ? 0 : s === 'pre' ? 1 : 2;
            return ord(a.estado) - ord(b.estado) || new Date(a.fecha) - new Date(b.fecha);
        });

        // Enrich with transmission URLs
        try {
            const allPartidos = await fetchAllPartidos();
            for (const p of partidos) {
                const slug1 = mundialMatchSlug(p.home.name, p.away.name);
                const slug2 = mundialMatchSlug(p.home.shortName, p.away.shortName);
                const slug3 = matchSlug(p.home.name, p.away.name);
                const slug4 = matchSlug(p.home.shortName, p.away.shortName);
                const match = allPartidos.find(ap =>
                    ap.slug === slug1 ||
                    ap.slug === slug2 ||
                    ap.slug === slug3 ||
                    ap.slug === slug4 ||
                    // Fuzzy: check if both team names appear in the transmission slug
                    (ap.slug && slug1 && (() => {
                        const h = slugify(normalizeCountryName(p.home.name));
                        const a = slugify(normalizeCountryName(p.away.name));
                        return ap.slug.includes(h) && ap.slug.includes(a);
                    })())
                );
                if (match?.transmisionUrl) p.transmisionUrl = match.transmisionUrl;
            }
        } catch (_) {}

        const result = { ok: true, count: partidos.length, partidos, ts: now, source: 'fifa.com' };
        mundialCache.partidos = result;
        mundialCache.ts = now;
        res.json(result);
    } catch (e) {
        console.error('[/api/mundial/partidos]', e.message);
        res.status(500).json({ ok: false, error: e.message, partidos: [] });
    }
});

// GET /api/mundial/grupos — live group standings from FIFA official API
app.get('/api/mundial/grupos', async (req, res) => {
    const now = Date.now();
    if (mundialCache.grupos && (now - mundialCache.ts) < MUNDIAL_TTL * 5) {
        return res.json(mundialCache.grupos);
    }

    try {
        const data = await fifaFetch(`${FIFA_BASE}/groupstanding/${FIFA_COMPETITION}/${FIFA_SEASON_2026}?language=en`);

        if (!data?.Results?.length) {
            // Tournament hasn't started yet — return empty so UI shows static groups
            return res.json({ ok: true, grupos: [], source: 'fifa.com', empty: true });
        }

        const grupos = data.Results.map(grp => ({
            nombre: fifaLocale(grp.Name),
            equipos: (grp.Teams || []).map(t => ({
                nombre: fifaLocale(t.Team?.TeamName) || t.Team?.ShortClubName || '',
                abrev: t.Team?.Abbreviation || '',
                code: t.Team?.IdCountry || '',
                logo: fifaFlagUrl(t.Team?.IdCountry),
                pts: t.Points ?? 0,
                pj: t.Played ?? 0,
                pg: t.Won ?? 0,
                pe: t.Drawn ?? 0,
                pp: t.Lost ?? 0,
                gf: t.For ?? 0,
                gc: t.Against ?? 0,
                dg: t.GoalsDiference ?? 0,
            }))
        }));

        const result = { ok: true, grupos, source: 'fifa.com' };
        mundialCache.grupos = result;
        res.json(result);
    } catch (e) {
        console.error('[/api/mundial/grupos]', e.message);
        res.json({ ok: false, grupos: [], error: e.message });
    }
});

// GET /api/mundial/transmisiones — filter all transmissions for World Cup matches
app.get('/api/mundial/transmisiones', async (req, res) => {
    try {
        const all = await fetchAllPartidos();
        const wc = all.filter(p => {
            const liga = (p.liga || '').toLowerCase();
            const titulo = (p.titulo || '').toLowerCase();
            return liga.includes('mundial') || liga.includes('world cup') || liga.includes('fifa') ||
                   titulo.includes('mundial') || titulo.includes('world cup');
        });
        res.json({ ok: true, count: wc.length, partidos: wc });
    } catch (e) {
        console.error('[/api/mundial/transmisiones]', e.message);
        res.json({ ok: false, partidos: [] });
    }
});

// GET /api/mundial/hoy — today's World Cup matches (Mexico time UTC-6)
app.get('/api/mundial/hoy', async (req, res) => {
    try {
        let partidos = mundialCache.partidos?.partidos;
        if (!partidos) {
            const data = await fifaFetch(`${FIFA_BASE}/calendar/matches?idCompetition=${FIFA_COMPETITION}&idSeason=${FIFA_SEASON_2026}&language=en&count=104`);
            if (!data?.Results) return res.json({ ok: true, partidos: [], count: 0 });
            partidos = data.Results.map(parseMatchRecord);
        }
        // Today in Mexico City time (UTC-6)
        const mxNow = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const todayStr = mxNow.toISOString().slice(0, 10);
        const hoy = partidos.filter(p => {
            if (!p.fecha) return false;
            const d = new Date(new Date(p.fecha).getTime() - 6 * 60 * 60 * 1000);
            return d.toISOString().slice(0, 10) === todayStr;
        });
        res.json({ ok: true, count: hoy.length, partidos: hoy, fecha: todayStr, source: 'fifa.com' });
    } catch (e) {
        res.json({ ok: false, partidos: [], error: e.message });
    }
});

// GET /api/mundial/proximo — next upcoming match (or current live if any)
app.get('/api/mundial/proximo', async (req, res) => {
    try {
        let partidos = mundialCache.partidos?.partidos;
        if (!partidos) {
            const data = await fifaFetch(`${FIFA_BASE}/calendar/matches?idCompetition=${FIFA_COMPETITION}&idSeason=${FIFA_SEASON_2026}&language=en&count=104`);
            if (!data?.Results) return res.json({ ok: true, partido: null });
            partidos = data.Results.map(parseMatchRecord);
        }
        const live = partidos.filter(p => p.enVivo);
        const next = partidos
            .filter(p => p.programado && p.fecha)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        const partido = live.length > 0 ? live[0] : (next[0] || null);
        res.json({ ok: true, partido, enVivo: live.length > 0, source: 'fifa.com' });
    } catch (e) {
        res.json({ ok: false, partido: null, error: e.message });
    }
});

// GET /api/mundial/goleadores — top scorers from FIFA official API
app.get('/api/mundial/goleadores', async (req, res) => {
    const now = Date.now();
    const force = req.query.force === '1';
    if (!force && mundialCache.goleadores && (now - mundialCache.goleadoresTs) < MUNDIAL_TTL * 5) {
        return res.json(mundialCache.goleadores);
    }
    try {
        const data = await fifaFetch(`${FIFA_BASE}/topscorers?idCompetition=${FIFA_COMPETITION}&idSeason=${FIFA_SEASON_2026}&language=es&count=20`);
        if (!data?.Results?.length) {
            return res.json({ ok: true, goleadores: [], source: 'fifa.com', empty: true });
        }
        const goleadores = data.Results.map((r, idx) => ({
            posicion: idx + 1,
            nombre: fifaLocale(r.Player?.Name) || r.Player?.ShortName || '',
            equipo: fifaLocale(r.Team?.TeamName) || r.Team?.ShortClubName || '',
            code: r.Team?.IdCountry || '',
            logo: fifaFlagUrl(r.Team?.IdCountry),
            goles: r.Goals ?? 0,
            penales: r.PenaltyGoals ?? 0,
            partidosJugados: r.MatchesPlayed ?? 0,
        }));
        const result = { ok: true, count: goleadores.length, goleadores, source: 'fifa.com' };
        mundialCache.goleadores = result;
        mundialCache.goleadoresTs = now;
        res.json(result);
    } catch (e) {
        console.error('[/api/mundial/goleadores]', e.message);
        res.json({ ok: false, goleadores: [], error: e.message });
    }
});

console.log('🌍 Copa Mundial 2026 API endpoints enabled');

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UltraGol server started on port ${PORT}`);
    console.log(`🌐 Server available at: http://0.0.0.0:${PORT}`);
    console.log('⚽ Ready for Liga MX action!');
});
