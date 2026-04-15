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
            const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'ULTRA', 'transmisiones6.json'), 'utf8'));
            res.json(data);
        } catch (localError) {
            console.error('Error al leer transmisiones6.json local:', localError);
            res.status(500).json({ error: 'Error al obtener transmisiones6' });
        }
    }
});

app.get('/transmisiones6', (req, res) => {
    res.sendFile(path.join(__dirname, 'ULTRA', 'index.html'));
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
    const equipo1 = item.equipo1 || item.local || '';
    const equipo2 = item.equipo2 || item.visitante || '';
    const titulo = item.titulo || item.evento || `${equipo1} vs ${equipo2}`;
    const slug = matchSlug(equipo1, equipo2);

    let transmisionUrl = null;
    if (item.url) transmisionUrl = item.url;
    else if (item.enlaces && item.enlaces[0]) transmisionUrl = item.enlaces[0];
    else if (item.canales && item.canales[0]) transmisionUrl = item.canales[0].url;
    else if (item.fuentes && item.fuentes[0]) transmisionUrl = item.fuentes[0].url;

    const estadoRaw = (item.estado || '').toLowerCase();
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
        hora: item.hora || '',
        fecha: item.fecha || item.fechaISO || '',
        liga: item.liga || item.info || item.pais || item.categoria || '',
        deporte: item.deporte || item.categoria || 'Fútbol',
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
    const [marc, t2, t3, t4, t6] = await Promise.all([
        safeFetch(`${API_BASE_URL}/marcadores`),
        safeFetch(`${API_BASE_URL}/transmisiones2`),
        safeFetch(`${API_BASE_URL}/transmisiones3`),
        safeFetch(`${API_BASE_URL}/transmisiones4`),
        safeFetch(`${API_BASE_URL}/transmisiones6`),
    ]);

    const map = new Map();

    const sources = [
        { data: t2, key: 'transmisiones2' },
        { data: t3, key: 'transmisiones3' },
        { data: t4, key: 'transmisiones4' },
        { data: t6, key: 'transmisiones6' },
    ];

    for (const { data, key } of sources) {
        if (!data) continue;
        const items = data.transmisiones || data.partidos || data.eventos || [];
        for (const item of items) {
            const norm = normalizeTransmision(item, key);
            if (!norm.slug || norm.slug === '-vs-') continue;
            if (!map.has(norm.slug)) {
                map.set(norm.slug, norm);
            } else {
                const existing = map.get(norm.slug);
                if (!existing.transmisionUrl && norm.transmisionUrl) existing.transmisionUrl = norm.transmisionUrl;
                if (key === 'transmisiones6') { existing.estado = norm.estado; existing.fuente = key; }
                if (!existing.logo1 && norm.logo1) existing.logo1 = norm.logo1;
                if (!existing.logo2 && norm.logo2) existing.logo2 = norm.logo2;
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

// ─── ROBOTS.TXT — must be BEFORE static middlewares so ULTRA/robots.txt doesn't win ──
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /ultra/
Disallow: /ultracanales/

Sitemap: https://ultragol-l3ho.com.mx/sitemap.xml
`);
});

// ─── SITEMAP.XML dinámico ─────────────────────────────────────────────────────
app.get('/sitemap.xml', async (req, res) => {
    const BASE = 'https://ultragol-l3ho.com.mx';
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
        { url: '/',   priority: '1.0', changefreq: 'daily' },
        { url: '/mx', priority: '0.9', changefreq: 'hourly' },
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

// SSR: individual match page — full HTML generated with SEO meta tags
app.get('/mx/:slug', async (req, res) => {
    const slug = req.params.slug;
    let matchData = null;

    try {
        const partidos = await fetchAllPartidos();
        matchData = partidos.find(p => p.slug === slug);
    } catch (e) {
        // continue with no data
    }

    if (!matchData) {
        const parts = slug.split('-vs-');
        const t1 = (parts[0] || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const t2 = ((parts[1] || '') + (parts.slice(2).join('-') ? '-' + parts.slice(2).join('-') : '')).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const title = `${t1} vs ${t2} EN VIVO | UltraGol`;
        const desc = `Sigue el partido ${t1} vs ${t2} en vivo con marcador en tiempo real, goles y transmisiones en UltraGol.`;
        return res.send(buildMatchPage({ slug, title, desc, equipo1: t1, equipo2: t2, logo1: null, logo2: null, estado: null, goles: [], detalles: {}, transmisionUrl: null, liga: '', hora: '' }));
    }

    const { equipo1, equipo2, logo1, logo2, estado, marcadorLocal, marcadorVisitante, goles, detalles, transmisionUrl, liga, hora, nombreCortoLocal, nombreCortoVisitante } = matchData;
    const teamTitle = `${equipo1} vs ${equipo2}`;
    const hasScore = marcadorLocal !== null && marcadorLocal !== undefined && marcadorLocal !== '';
    const scoreStr = hasScore && estado && !estado.programado ? ` ${marcadorLocal}-${marcadorVisitante}` : '';
    const statusStr = estado && estado.enVivo ? ' EN VIVO' : (estado && estado.finalizado ? ' - Resultado Final' : '');
    const title = `${teamTitle}${scoreStr}${statusStr} | UltraGol`;
    const desc = `${teamTitle}${scoreStr}. Sigue el partido en vivo con marcador, goles y transmisión gratis en UltraGol.`;

    res.send(buildMatchPage({ slug, title, desc, equipo1, equipo2, logo1, logo2, estado, goles: goles || [], detalles: detalles || {}, transmisionUrl, liga, hora, nombreCortoLocal, nombreCortoVisitante, marcadorLocal, marcadorVisitante }));
});

function buildMatchPage({ slug, title, desc, equipo1, equipo2, logo1, logo2, estado, goles, detalles, transmisionUrl, liga, hora, nombreCortoLocal, nombreCortoVisitante, marcadorLocal, marcadorVisitante }) {
    const isLive = estado && estado.enVivo;
    const isFinished = estado && estado.finalizado;
    const isUpcoming = !isLive && !isFinished;
    const statusLabel = isLive ? (estado.reloj || estado.descripcion || 'En Vivo') : isFinished ? 'Terminado' : (estado ? (estado.descripcion || 'Próximo') : 'Próximo');
    const statusClass = isLive ? 'status-live' : isFinished ? 'status-finished' : 'status-upcoming';

    const golesHtml = goles.length
        ? goles.map(g => `
            <div class="goal-item">
                <div class="goal-minute">${g.minuto || ''}'</div>
                <div class="goal-info">
                    <div class="goal-player">⚽ ${g.goleador || 'Gol'}</div>
                    <div class="goal-team">${g.equipo || ''}</div>
                    ${g.tipoGol && g.tipoGol !== 'Goal' ? `<div class="goal-type">${g.tipoGol}</div>` : ''}
                </div>
            </div>`).join('')
        : `<div class="no-goals">${isUpcoming ? 'El partido aún no ha comenzado' : 'Sin goles registrados'}</div>`;

    const localLogoHtml = logo1
        ? `<img src="${logo1}" alt="${equipo1}" onerror="this.src='/assets/logos/ultragol-logo.png'">`
        : `<img src="/assets/logos/ultragol-logo.png" alt="${equipo1}">`;
    const visitanteLogoHtml = logo2
        ? `<img src="${logo2}" alt="${equipo2}" onerror="this.src='/assets/logos/ultragol-logo.png'">`
        : `<img src="/assets/logos/ultragol-logo.png" alt="${equipo2}">`;

    const scoreLocal = (marcadorLocal !== null && marcadorLocal !== undefined && marcadorLocal !== '') ? marcadorLocal : '-';
    const scoreVisitante = (marcadorVisitante !== null && marcadorVisitante !== undefined && marcadorVisitante !== '') ? marcadorVisitante : '-';

    const canonicalUrl = `https://ultragol-l3ho.com.mx/mx/${slug}`;

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
        'organizer': { '@type': 'Organization', 'name': 'UltraGol', 'url': 'https://ultragol-l3ho.com.mx' }
    };

    const streamSection = transmisionUrl
        ? `<a href="${transmisionUrl}" target="_blank" rel="noopener" class="stream-btn">▶ Ver Transmisión EN VIVO</a>`
        : `<div class="no-goals" style="padding:16px 0">Transmisión no disponible en este momento.<br>Ve a <a href="/ultra" style="color:var(--red)">ULTRA</a> para buscar más canales.</div>`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${desc}">
    <link rel="canonical" href="${canonicalUrl}">

    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${desc}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:image" content="https://ultragol-l3ho.com.mx/ULTRA/favicon.png">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${desc}">

    <link rel="icon" type="image/png" href="/ULTRA/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/mx/mx.css">
    ${isLive ? '<meta http-equiv="refresh" content="60">' : ''}

    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>

<nav class="nav">
    <a href="/" class="nav-logo">
        <img src="/ULTRA/favicon.png" alt="UltraGol">
        Ultra<span>Gol</span>
    </a>
    <div class="nav-links">
        <a href="/mx" class="active">Partidos</a>
        <a href="/ultra">ULTRA</a>
        <a href="/">Inicio</a>
    </div>
</nav>

<div class="match-hero">
    <div class="match-hero-inner">
        <div class="breadcrumb">
            <a href="/">UltraGol</a> › <a href="/mx">Partidos de Hoy</a> › ${equipo1} vs ${equipo2}
        </div>
        <div class="match-scorecard">
            <div class="scorecard-team">
                ${localLogoHtml}
                <h2>${equipo1}</h2>
                ${nombreCortoLocal ? `<div style="color:var(--text-muted);font-size:.8rem">${nombreCortoLocal}</div>` : ''}
            </div>
            <div class="scorecard-center">
                <div class="scorecard-score">${scoreLocal}<span>:</span>${scoreVisitante}</div>
                <div class="scorecard-meta">
                    <div class="status-badge ${statusClass}">${isLive ? '🔴 ' : ''}${statusLabel}</div>
                    ${detalles.estadio ? `<div style="color:var(--text-muted);font-size:.8rem;text-align:center">🏟 ${detalles.estadio}</div>` : ''}
                    ${liga ? `<div style="color:var(--text-muted);font-size:.75rem;margin-top:4px">${liga}</div>` : ''}
                    ${hora ? `<div style="color:var(--text-muted);font-size:.75rem">${hora}</div>` : ''}
                </div>
            </div>
            <div class="scorecard-team">
                ${visitanteLogoHtml}
                <h2>${equipo2}</h2>
                ${nombreCortoVisitante ? `<div style="color:var(--text-muted);font-size:.8rem">${nombreCortoVisitante}</div>` : ''}
            </div>
        </div>
    </div>
</div>

<div class="detail-grid">
    <div class="detail-card full-width">
        <h3>Goles</h3>
        ${golesHtml}
    </div>
    <div class="detail-card">
        <h3>Información del Partido</h3>
        ${detalles.estadio ? `<div class="info-row"><span class="info-label">Estadio</span><span class="info-value">${detalles.estadio}</span></div>` : ''}
        ${detalles.ciudad ? `<div class="info-row"><span class="info-label">Ciudad</span><span class="info-value">${detalles.ciudad}</span></div>` : ''}
        <div class="info-row"><span class="info-label">Estado</span><span class="info-value">${statusLabel}</span></div>
        ${isLive && estado.reloj ? `<div class="info-row"><span class="info-label">Minuto</span><span class="info-value live-clock">${estado.reloj}</span></div>` : ''}
    </div>
    <div class="detail-card">
        <h3>Transmisión</h3>
        ${streamSection}
    </div>
</div>

<footer class="footer">
    <p>Volver a <a href="/mx">Partidos de Hoy</a> · <a href="/ultra">ULTRA — Todos los canales</a></p>
</footer>

</body>
</html>`;
}

console.log('✅ MX section enabled (/mx, /mx/:slug)');

app.use(express.static(path.join(__dirname, 'ULTRA'), {
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

app.get('/ultra', (req, res) => {
    res.sendFile(path.join(__dirname, 'ULTRA', 'index.html'));
});

app.use('/ultra', express.static(path.join(__dirname, 'ULTRA'), {
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
