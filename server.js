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

// UltraGol API Proxy (para evitar problemas de CORS)
const API_BASE_URL = 'https://ultragol-api-3.vercel.app';

// Authentication API Configuration
const AUTH_API_URL = process.env.AUTH_API_URL || 'https://472832aade2073.lhr.life';
const AUTH_API_FALLBACK = process.env.AUTH_API_FALLBACK_URL || 'http://192.168.100.15:5000';

async function callAuthAPI(endpoint, options = {}) {
    const urls = [AUTH_API_URL, AUTH_API_FALLBACK];
    
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

app.get('/api/ultragol/tabla', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/tabla`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error proxying tabla:', error);
        res.status(500).json({ error: 'Error al obtener la tabla' });
    }
});

app.get('/api/ultragol/goleadores', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/goleadores`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error proxying goleadores:', error);
        res.status(500).json({ error: 'Error al obtener goleadores' });
    }
});

app.get('/api/ultragol/noticias', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/Noticias`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error proxying noticias:', error);
        res.status(500).json({ error: 'Error al obtener noticias' });
    }
});

app.get('/api/ultragol/equipos', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/Equipos`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error proxying equipos:', error);
        res.status(500).json({ error: 'Error al obtener equipos' });
    }
});

app.get('/api/ultragol/videos', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/videos`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error proxying videos:', error);
        res.status(500).json({ error: 'Error al obtener videos' });
    }
});

app.get('/api/ultragol/notificaciones', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error proxying notificaciones:', error);
        res.status(500).json({ error: 'Error al obtener notificaciones' });
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

// ── Share-link store (in-memory, 24 h TTL) ──────────────────────────────────
const shareStore = new Map();
const SHARE_TTL_MS = 24 * 60 * 60 * 1000;

function _cleanShareStore() {
    const cutoff = Date.now() - SHARE_TTL_MS;
    for (const [id, val] of shareStore) { if (val.ts < cutoff) shareStore.delete(id); }
}
function _genShareId() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}

app.post('/api/share/match', express.json(), (req, res) => {
    _cleanShareStore();
    const { title, channels } = req.body || {};
    if (!title || !Array.isArray(channels)) return res.status(400).json({ error: 'Faltan datos' });
    const id = _genShareId();
    shareStore.set(id, { title, channels, ts: Date.now() });
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
        const r = await fetch(`${API_BASE_URL}${liga.endpoint}`, { signal: AbortSignal.timeout(6000) });
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

app.get('/api/ultragol/transmisiones3', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/transmisiones3`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error proxying transmisiones3:', error);
        res.status(500).json({ error: 'Error al obtener transmisiones3' });
    }
});

app.get('/api/ultragol/transmisiones6', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/transmisiones6`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.warn('⚠️ API externa transmisiones6 no disponible, usando JSON local:', error.message);
        try {
            const fs = require('fs');
            const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'ultrax', 'transmisiones6.json'), 'utf8'));
            res.json(data);
        } catch (localError) {
            console.error('Error al leer transmisiones6.json local:', localError);
            res.status(500).json({ error: 'Error al obtener transmisiones6' });
        }
    }
});

app.get('/transmisiones6', (req, res) => {
    res.sendFile(path.join(__dirname, 'ultrax', 'index.html'));
});

console.log('✅ UltraGol API proxy enabled');

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

function slugify(text) {
    return (text || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '').trim()
        .replace(/\s+/g, '-');
}

function matchSlug(local, visitante) {
    return `${slugify(local)}-vs-${slugify(visitante)}`;
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
    const [marc, t2, t3, t4, t5, t6, t7] = await Promise.all([
        safeFetch(`${API_BASE_URL}/marcadores`),
        safeFetch(`${API_BASE_URL}/transmisiones2`),
        safeFetch(`${API_BASE_URL}/transmisiones3`),
        safeFetch(`${API_BASE_URL}/transmisiones4`),
        safeFetch(`${API_BASE_URL}/transmisiones5`),
        safeFetch(`${API_BASE_URL}/transmisiones6`),
        safeFetch(`${API_BASE_URL}/transmisiones7`),
    ]);

    const map = new Map();

    const sources = [
        { data: t2, key: 'transmisiones2' },
        { data: t3, key: 'transmisiones3' },
        { data: t4, key: 'transmisiones4' },
        { data: t5, key: 'transmisiones5' },
        { data: t6, key: 'transmisiones6' },
        { data: t7, key: 'transmisiones7' },
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
        { url: '/',            priority: '1.0', changefreq: 'daily' },
        { url: '/mx',          priority: '0.9', changefreq: 'hourly' },
        { url: '/rojadirecta', priority: '0.9', changefreq: 'hourly' },
    ];

    let matchPages = [];
    try {
        const partidos = await fetchAllPartidos();
        matchPages = [...partidos.values()].map(p => ({
            url: `/mx/${p.slug}`,
            priority: p.estado === 'EN VIVO' ? '0.9' : '0.7',
            changefreq: p.estado === 'EN VIVO' ? 'always' : 'hourly',
            lastmod: today,
        }));
    } catch (e) {
        console.error('Sitemap: error fetching partidos', e.message);
    }

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

// Serve static assets from mx/ folder before route handlers
app.use('/mx', express.static(path.join(__dirname, 'mx'), { index: false }));

// API: all matches from all sources
app.get('/api/mx/partidos', async (req, res) => {
    try {
        const partidos = await fetchAllPartidos();
        res.json({ total: partidos.length, partidos });
    } catch (err) {
        console.error('Error en /api/mx/partidos:', err);
        res.status(500).json({ error: 'No se pudieron obtener los partidos' });
    }
});

// Index: today's matches listing
app.get('/mx', (req, res) => {
    res.sendFile(path.join(__dirname, 'mx', 'index.html'));
});
app.get('/partidos-hoy', (req, res) => {
    res.redirect(301, '/mx');
});

// Roja Directa TV Premium — same data, different brand
app.get(['/rojadirecta', '/rojadirecta/'], (req, res) => {
    res.sendFile(path.join(__dirname, 'rojadirecta', 'index.html'));
});
app.use('/rojadirecta', express.static(path.join(__dirname, 'rojadirecta'), {
    index: false,
    redirect: false,
    setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
}));
app.get('/roja-directa', (req, res) => res.redirect(301, '/rojadirecta'));
app.get('/rojadirectatv', (req, res) => res.redirect(301, '/rojadirecta'));

// SSR: individual match page — full HTML generated with SEO meta tags
async function handleMatchDetail(req, res, brand) {
    const slug = req.params.slug;
    let matchData = null;
    let allPartidos = [];

    try {
        allPartidos = await fetchAllPartidos();
        matchData = allPartidos.find(p => p.slug === slug);
    } catch (e) {
        // continue with no data
    }

    const brandLabel = brand === 'rojadirecta' ? 'Roja Directa TV Premium' : 'Pelota Libre Premium';
    req._brand = brand;
    req._brandLabel = brandLabel;
    req._allPartidos = allPartidos;
    return { slug, matchData, brand, brandLabel, allPartidos };
}

app.get('/mx/:slug', async (req, res) => {
    const ctx = await handleMatchDetail(req, res, 'pelotalibre');
    const { slug, matchData, brand, brandLabel, allPartidos } = ctx;

    if (!matchData) {
        const parts = slug.split('-vs-');
        const t1 = (parts[0] || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const t2 = ((parts[1] || '') + (parts.slice(2).join('-') ? '-' + parts.slice(2).join('-') : '')).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const title = `${t1} vs ${t2} EN VIVO HD | ${brandLabel}`;
        const desc = `Ver ${t1} vs ${t2} en vivo gratis HD en ${brandLabel}. Marcador en tiempo real, goles y transmisión multi-servidor sin cortes.`;
        return res.send(buildMatchPage({ brand, slug, title, desc, equipo1: t1, equipo2: t2, logo1: null, logo2: null, estado: null, goles: [], detalles: {}, transmisionUrl: null, liga: '', hora: '', allPartidos }));
    }

    const { equipo1, equipo2, logo1, logo2, estado, marcadorLocal, marcadorVisitante, goles, detalles, transmisionUrl, liga, hora, nombreCortoLocal, nombreCortoVisitante } = matchData;
    const teamTitle = `${equipo1} vs ${equipo2}`;
    const hasScore = marcadorLocal !== null && marcadorLocal !== undefined && marcadorLocal !== '';
    const scoreStr = hasScore && estado && !estado.programado ? ` ${marcadorLocal}-${marcadorVisitante}` : '';
    const statusStr = estado && estado.enVivo ? ' EN VIVO' : (estado && estado.finalizado ? ' - Resultado Final' : '');
    const title = `${teamTitle}${scoreStr}${statusStr} HD | ${brandLabel}`;
    const desc = `${teamTitle}${scoreStr}. Ver en vivo gratis HD en ${brandLabel} con marcador, goles y transmisión multi-servidor sin cortes.`;

    res.send(buildMatchPage({ brand, slug, title, desc, equipo1, equipo2, logo1, logo2, estado, goles: goles || [], detalles: detalles || {}, transmisionUrl, liga, hora, nombreCortoLocal, nombreCortoVisitante, marcadorLocal, marcadorVisitante, allPartidos }));
});

// Roja Directa TV Premium — match detail (same data, different brand)
app.get('/rojadirecta/:slug', async (req, res) => {
    const ctx = await handleMatchDetail(req, res, 'rojadirecta');
    const { slug, matchData, brand, brandLabel, allPartidos } = ctx;

    if (!matchData) {
        const parts = slug.split('-vs-');
        const t1 = (parts[0] || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const t2 = ((parts[1] || '') + (parts.slice(2).join('-') ? '-' + parts.slice(2).join('-') : '')).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const title = `${t1} vs ${t2} EN VIVO HD | ${brandLabel}`;
        const desc = `Ver ${t1} vs ${t2} en vivo gratis HD en ${brandLabel}. Marcador en tiempo real, goles y transmisión multi-servidor sin cortes.`;
        return res.send(buildMatchPage({ brand, slug, title, desc, equipo1: t1, equipo2: t2, logo1: null, logo2: null, estado: null, goles: [], detalles: {}, transmisionUrl: null, liga: '', hora: '', allPartidos }));
    }

    const { equipo1, equipo2, logo1, logo2, estado, marcadorLocal, marcadorVisitante, goles, detalles, transmisionUrl, liga, hora, nombreCortoLocal, nombreCortoVisitante } = matchData;
    const teamTitle = `${equipo1} vs ${equipo2}`;
    const hasScore = marcadorLocal !== null && marcadorLocal !== undefined && marcadorLocal !== '';
    const scoreStr = hasScore && estado && !estado.programado ? ` ${marcadorLocal}-${marcadorVisitante}` : '';
    const statusStr = estado && estado.enVivo ? ' EN VIVO' : (estado && estado.finalizado ? ' - Resultado Final' : '');
    const title = `${teamTitle}${scoreStr}${statusStr} HD | ${brandLabel}`;
    const desc = `${teamTitle}${scoreStr}. Ver en vivo gratis HD en ${brandLabel} con marcador, goles y transmisión multi-servidor sin cortes.`;

    res.send(buildMatchPage({ brand, slug, title, desc, equipo1, equipo2, logo1, logo2, estado, goles: goles || [], detalles: detalles || {}, transmisionUrl, liga, hora, nombreCortoLocal, nombreCortoVisitante, marcadorLocal, marcadorVisitante, allPartidos }));
});

function buildMatchPage({ brand = 'pelotalibre', slug, title, desc, equipo1, equipo2, logo1, logo2, estado, goles, detalles, transmisionUrl, liga, hora, nombreCortoLocal, nombreCortoVisitante, marcadorLocal, marcadorVisitante, allPartidos = [] }) {
    const isLive = estado && estado.enVivo;
    const isFinished = estado && estado.finalizado;
    const isUpcoming = !isLive && !isFinished;
    const statusLabel = isLive ? (estado.reloj || estado.descripcion || 'En Vivo') : isFinished ? 'Terminado' : (estado ? (estado.descripcion || 'Próximo') : 'Próximo');
    const statusClass = isLive ? 'status-live' : isFinished ? 'status-finished' : 'status-upcoming';

    const brandCfg = brand === 'rojadirecta' ? {
        brandHTML: 'ROJA<b>DIRECTA</b><i>PREMIUM</i>',
        brandLabel: 'Roja Directa TV Premium',
        logo: '/rojadirecta/icon.svg',
        themeCSS: '/rojadirecta/theme.css',
        basePath: '/rojadirecta',
        domain: 'https://www.ultragol-l3ho.com.mx',
        otherLabel: 'PelotaLibre',
        otherSlugPath: `/mx/${slug}`,
        themeColor: '#e60023'
    } : {
        brandHTML: 'PELOTA<b>LIBRE</b><i>PREMIUM</i>',
        brandLabel: 'Pelota Libre Premium',
        logo: '/mx/pelotalibre-premium.svg',
        themeCSS: null,
        basePath: '/mx',
        domain: 'https://www.ultragol-l3ho.com.mx',
        otherLabel: 'RojaDirecta',
        otherSlugPath: `/rojadirecta/${slug}`,
        themeColor: '#00d35a'
    };

    const localLogoHtml = logo1
        ? `<img src="${logo1}" alt="${equipo1}" onerror="this.src='/assets/logos/ultragol-logo.png'">`
        : `<img src="/assets/logos/ultragol-logo.png" alt="${equipo1}">`;
    const visitanteLogoHtml = logo2
        ? `<img src="${logo2}" alt="${equipo2}" onerror="this.src='/assets/logos/ultragol-logo.png'">`
        : `<img src="/assets/logos/ultragol-logo.png" alt="${equipo2}">`;

    const scoreLocal = (marcadorLocal !== null && marcadorLocal !== undefined && marcadorLocal !== '') ? marcadorLocal : '-';
    const scoreVisitante = (marcadorVisitante !== null && marcadorVisitante !== undefined && marcadorVisitante !== '') ? marcadorVisitante : '-';

    const canonicalUrl = `${brandCfg.domain}${brandCfg.basePath}/${slug}`;

    const golesHtml = goles.length
        ? `<div class="md-goals-timeline">
            ${goles.map(g => {
                const isHomeGoal = g.equipo && equipo1 && g.equipo.toLowerCase().includes(equipo1.toLowerCase().slice(0,5));
                const side = isHomeGoal ? 'goal-home' : 'goal-away';
                return `<div class="md-goal ${side}">
                    <div class="md-goal-min">${g.minuto || '?'}'</div>
                    <div class="md-goal-card">
                        <div class="md-goal-icon">⚽</div>
                        <div class="md-goal-text">
                            <div class="md-goal-player">${g.goleador || 'Gol'}</div>
                            <div class="md-goal-team">${g.equipo || ''}</div>
                            ${g.tipoGol && g.tipoGol !== 'Goal' ? `<div class="md-goal-type">${g.tipoGol}</div>` : ''}
                        </div>
                    </div>
                </div>`;
            }).join('')}
        </div>`
        : `<div class="md-no-goals">
            <div class="md-no-goals-icon">⚽</div>
            <p>${isUpcoming ? 'El partido aún no ha comenzado' : 'Sin goles registrados'}</p>
        </div>`;

    const serverUrls = transmisionUrl
        ? [...new Set(transmisionUrl.split(',').map(s => s.trim()).filter(Boolean))]
        : [];
    const firstServer = serverUrls[0] || '';

    const playerSection = serverUrls.length
        ? `<div class="md-player-card">
            <div class="md-player-frame" id="md-player-frame">
                <iframe id="md-iframe" src="${firstServer}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="no-referrer"></iframe>
            </div>
            <div class="md-server-bar">
                <div class="md-server-label">
                    <span class="md-server-icon">📡</span>
                    <span>${serverUrls.length} ${serverUrls.length === 1 ? 'SERVIDOR' : 'SERVIDORES'} HD</span>
                </div>
                <div class="md-server-buttons">
                    ${serverUrls.map((u, i) => `<button class="md-server-btn${i === 0 ? ' active' : ''}" data-url="${encodeURIComponent(u)}"><span class="srv-num">${i + 1}</span><span class="srv-text">Servidor ${i + 1}</span></button>`).join('')}
                </div>
            </div>
            <div class="md-player-actions">
                <button class="md-action-btn" id="md-fs-btn" title="Pantalla completa">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4"/></svg>
                    <span>Pantalla completa</span>
                </button>
                <button class="md-action-btn" id="md-theater-btn" title="Modo cine">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>
                    <span>Modo cine</span>
                </button>
                <a class="md-action-btn" href="${firstServer}" target="_blank" rel="noopener" id="md-open-tab">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M21 14v7H3V3h7"/></svg>
                    <span>Nueva pestaña</span>
                </a>
            </div>
        </div>`
        : `<div class="md-no-stream">
            <div class="md-no-stream-icon">📡</div>
            <h3>Sin transmisión disponible</h3>
            <p>Este partido aún no tiene canales asignados. Vuelve más cerca del horario o explora <a href="${brandCfg.basePath}">otros partidos en vivo</a>.</p>
        </div>`;

    let related = (allPartidos || [])
        .filter(p => p.slug && p.slug !== slug)
        .filter(p => liga ? p.liga === liga : (p.estado && p.estado.enVivo));
    if (related.length < 4) {
        const live = (allPartidos || []).filter(p => p.slug && p.slug !== slug && p.estado && p.estado.enVivo);
        live.forEach(p => { if (!related.find(r => r.slug === p.slug)) related.push(p); });
    }
    related = related.slice(0, 8);

    const relatedHtml = related.length
        ? `<div class="md-related-grid">
            ${related.map(p => {
                const pIsLive = p.estado && p.estado.enVivo;
                const pStatus = pIsLive ? '🔴 EN VIVO' : (p.estado && p.estado.finalizado ? 'Final' : (p.hora || 'Próximo'));
                const pScore = (p.marcadorLocal !== null && p.marcadorLocal !== undefined && p.marcadorLocal !== '') ? `${p.marcadorLocal}-${p.marcadorVisitante}` : 'vs';
                const pl1 = p.logo1 ? `<img src="${p.logo1}" alt="" onerror="this.style.display='none'">` : '';
                const pl2 = p.logo2 ? `<img src="${p.logo2}" alt="" onerror="this.style.display='none'">` : '';
                return `<a href="${brandCfg.basePath}/${p.slug}" class="md-rel-card${pIsLive ? ' is-live' : ''}">
                    <div class="md-rel-meta">${p.liga || 'Partido'}</div>
                    <div class="md-rel-teams">
                        <div class="md-rel-team">${pl1}<span>${p.equipo1 || ''}</span></div>
                        <div class="md-rel-score">${pScore}</div>
                        <div class="md-rel-team">${pl2}<span>${p.equipo2 || ''}</span></div>
                    </div>
                    <div class="md-rel-status">${pStatus}</div>
                </a>`;
            }).join('')}
        </div>`
        : `<div class="md-no-rel">No hay otros partidos para mostrar.</div>`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        'name': `${equipo1} vs ${equipo2}`,
        'description': desc,
        'url': canonicalUrl,
        'sport': 'Soccer',
        'homeTeam': { '@type': 'SportsTeam', 'name': equipo1 },
        'awayTeam': { '@type': 'SportsTeam', 'name': equipo2 },
        'location': detalles.estadio ? { '@type': 'Place', 'name': detalles.estadio, 'address': detalles.ciudad || '' } : undefined,
        'organizer': { '@type': 'Organization', 'name': brandCfg.brandLabel, 'url': brandCfg.domain }
    };

    const shareText = encodeURIComponent(`${equipo1} vs ${equipo2} EN VIVO en ${brandCfg.brandLabel} → `);
    const shareUrl = encodeURIComponent(canonicalUrl);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${desc}">
    <meta name="theme-color" content="${brandCfg.themeColor}">
    <link rel="canonical" href="${canonicalUrl}">

    <meta property="og:site_name" content="${brandCfg.brandLabel}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${desc}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:image" content="${brandCfg.domain}${brandCfg.logo}">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${brandCfg.domain}${brandCfg.logo}">

    <link rel="icon" type="image/svg+xml" href="${brandCfg.logo}">
    <link rel="apple-touch-icon" href="${brandCfg.logo}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/mx/mx.css">
    ${brandCfg.themeCSS ? `<link rel="stylesheet" href="${brandCfg.themeCSS}">` : ''}
    ${isLive ? '<meta http-equiv="refresh" content="60">' : ''}

    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body class="md-body theme-${brand}">

<header class="topbar md-topbar">
    <div class="topbar-inner">
        <div class="brand" role="img" aria-label="${brandCfg.brandLabel}">
            <img src="${brandCfg.logo}" alt="">
            <span>${brandCfg.brandHTML}</span>
        </div>
        <div class="md-mini-score" id="md-mini-score" hidden>
            <span class="mini-team">${nombreCortoLocal || equipo1}</span>
            <span class="mini-score">${scoreLocal} - ${scoreVisitante}</span>
            <span class="mini-team">${nombreCortoVisitante || equipo2}</span>
            ${isLive ? `<span class="mini-live">🔴 ${estado && estado.reloj ? estado.reloj : 'EN VIVO'}</span>` : ''}
        </div>
        <nav class="topnav">
            <a href="${brandCfg.basePath}" class="active">Partidos</a>
            <a href="${brandCfg.otherSlugPath}">${brandCfg.otherLabel}</a>
            <a href="/">Inicio</a>
        </nav>
    </div>
</header>

<div class="md-wrap">
    <nav class="md-crumb">
        <a href="/">Inicio</a><span>›</span>
        <a href="${brandCfg.basePath}">Partidos de Hoy</a><span>›</span>
        <strong>${equipo1} vs ${equipo2}</strong>
    </nav>

    <section class="md-hero md-hero-premium">
        <div class="md-hero-pattern"></div>
        <div class="md-hero-meta">
            ${liga ? `<span class="md-chip md-chip-league">🏆 ${liga}</span>` : ''}
            <span class="md-status ${statusClass}">${isLive ? '🔴 ' : ''}${statusLabel}</span>
            ${hora ? `<span class="md-chip md-chip-time">⏱ ${hora}</span>` : ''}
        </div>
        <div class="md-scoreboard">
            <div class="md-team md-team-home">
                <div class="md-team-logo">${localLogoHtml}</div>
                <div class="md-team-name">${equipo1}</div>
                ${nombreCortoLocal ? `<div class="md-team-abbr">${nombreCortoLocal}</div>` : ''}
            </div>
            <div class="md-score-block">
                <div class="md-score">${scoreLocal}<span class="md-score-sep">·</span>${scoreVisitante}</div>
                ${detalles.estadio ? `<div class="md-stadium">🏟️ ${detalles.estadio}</div>` : ''}
                ${detalles.ciudad ? `<div class="md-city">${detalles.ciudad}</div>` : ''}
            </div>
            <div class="md-team md-team-away">
                <div class="md-team-logo">${visitanteLogoHtml}</div>
                <div class="md-team-name">${equipo2}</div>
                ${nombreCortoVisitante ? `<div class="md-team-abbr">${nombreCortoVisitante}</div>` : ''}
            </div>
        </div>
    </section>

    <nav class="md-tabs" role="tablist">
        <button class="md-tab active" data-tab="player" role="tab"><span>▶</span> Reproductor</button>
        <button class="md-tab" data-tab="goals" role="tab"><span>⚽</span> Goles${goles.length ? ` (${goles.length})` : ''}</button>
        <button class="md-tab" data-tab="info" role="tab"><span>ℹ️</span> Información</button>
        <button class="md-tab" data-tab="related" role="tab"><span>📅</span> Más partidos</button>
    </nav>

    <section class="md-panel active" id="panel-player">
        ${playerSection}
    </section>

    <section class="md-panel" id="panel-goals" hidden>
        <div class="md-card">
            <h2 class="md-section-title">⚽ Goles del partido</h2>
            ${golesHtml}
        </div>
    </section>

    <section class="md-panel" id="panel-info" hidden>
        <div class="md-card">
            <h2 class="md-section-title">ℹ️ Información del partido</h2>
            <div class="md-info">
                ${detalles.estadio ? `<div class="md-row"><span>🏟️ Estadio</span><b>${detalles.estadio}</b></div>` : ''}
                ${detalles.ciudad ? `<div class="md-row"><span>📍 Ciudad</span><b>${detalles.ciudad}</b></div>` : ''}
                ${liga ? `<div class="md-row"><span>🏆 Competición</span><b>${liga}</b></div>` : ''}
                ${hora ? `<div class="md-row"><span>⏱ Hora</span><b>${hora}</b></div>` : ''}
                <div class="md-row"><span>📡 Estado</span><b class="${statusClass}">${statusLabel}</b></div>
                ${isLive && estado && estado.reloj ? `<div class="md-row"><span>⏲ Minuto</span><b style="color:var(--accent)">${estado.reloj}</b></div>` : ''}
                <div class="md-row"><span>🛰️ Servidores HD</span><b>${serverUrls.length}</b></div>
            </div>
        </div>
    </section>

    <section class="md-panel" id="panel-related" hidden>
        <div class="md-card">
            <h2 class="md-section-title">📅 ${liga ? `Más partidos de ${liga}` : 'Otros partidos en vivo'}</h2>
            ${relatedHtml}
        </div>
    </section>

    <section class="md-share">
        <div class="md-share-title">Compartir partido</div>
        <div class="md-share-buttons">
            <a class="md-share-btn share-wa" href="https://wa.me/?text=${shareText}${shareUrl}" target="_blank" rel="noopener" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/></svg>
                <span>WhatsApp</span>
            </a>
            <a class="md-share-btn share-tw" href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener" aria-label="Twitter">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span>Twitter</span>
            </a>
            <a class="md-share-btn share-fb" href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span>Facebook</span>
            </a>
            <a class="md-share-btn share-tg" href="https://t.me/share/url?url=${shareUrl}&text=${shareText}" target="_blank" rel="noopener" aria-label="Telegram">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.464.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                <span>Telegram</span>
            </a>
            <button class="md-share-btn share-copy" id="md-copy-btn" aria-label="Copiar enlace">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span id="md-copy-text">Copiar enlace</span>
            </button>
        </div>
    </section>

    <section class="md-back">
        <a href="${brandCfg.basePath}" class="md-back-btn">← Volver a Partidos de Hoy</a>
    </section>
</div>

<footer class="footer">
    <p>© 2026 <strong>${brandCfg.brandLabel}</strong> — Partidos en vivo, marcadores y transmisiones deportivas.</p>
</footer>

<script>
(function(){
    const iframe = document.getElementById('md-iframe');
    const fsBtn = document.getElementById('md-fs-btn');
    const theaterBtn = document.getElementById('md-theater-btn');
    const playerFrame = document.getElementById('md-player-frame');
    const buttons = document.querySelectorAll('.md-server-btn');
    const openTab = document.getElementById('md-open-tab');

    buttons.forEach(b => {
        b.addEventListener('click', () => {
            buttons.forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            const url = decodeURIComponent(b.dataset.url);
            if (iframe) iframe.src = url;
            if (openTab) openTab.href = url;
        });
    });

    if (fsBtn && iframe) {
        fsBtn.addEventListener('click', () => {
            if (iframe.requestFullscreen) iframe.requestFullscreen();
            else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
        });
    }

    if (theaterBtn && playerFrame) {
        theaterBtn.addEventListener('click', () => {
            playerFrame.classList.toggle('theater-mode');
            document.body.classList.toggle('theater-active');
        });
    }

    const tabs = document.querySelectorAll('.md-tab');
    const panels = document.querySelectorAll('.md-panel');
    tabs.forEach(t => {
        t.addEventListener('click', () => {
            tabs.forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            panels.forEach(p => { p.hidden = true; p.classList.remove('active'); });
            const target = document.getElementById('panel-' + t.dataset.tab);
            if (target) { target.hidden = false; target.classList.add('active'); }
        });
    });

    const miniScore = document.getElementById('md-mini-score');
    const heroEl = document.querySelector('.md-hero');
    if (miniScore && heroEl && 'IntersectionObserver' in window) {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => { miniScore.hidden = e.isIntersecting; });
        }, { threshold: 0.1 });
        obs.observe(heroEl);
    }

    const copyBtn = document.getElementById('md-copy-btn');
    const copyText = document.getElementById('md-copy-text');
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                copyText.textContent = '¡Copiado!';
                setTimeout(() => copyText.textContent = 'Copiar enlace', 2000);
            } catch (e) {
                copyText.textContent = 'Error';
                setTimeout(() => copyText.textContent = 'Copiar enlace', 2000);
            }
        });
    }
})();
</script>

</body>
</html>`;
}

console.log('✅ MX section enabled (/mx, /mx/:slug)');

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UltraGol server started on port ${PORT}`);
    console.log(`🌐 Server available at: http://0.0.0.0:${PORT}`);
    console.log('⚽ Ready for Liga MX action!');
});
