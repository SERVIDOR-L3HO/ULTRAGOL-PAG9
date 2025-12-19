const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

const sharedChannels = new Map();
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const RATE_LIMIT_MAX = 100; // máximo de requests por minuto
const BOT_USER_AGENTS = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 
    'python', 'java', 'nodejs', 'ruby', 'perl', 'php',
    'selenium', 'puppeteer', 'phantomjs', 'headless'
];

function generateShortId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Rate Limiting por IP
function isRateLimited(ip) {
    const now = Date.now();
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
    }
    
    const requests = requestCounts.get(ip);
    const recentRequests = requests.filter(t => now - t < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= RATE_LIMIT_MAX) {
        return true;
    }
    
    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);
    return false;
}

// Detectar bots
function isBot(userAgent) {
    if (!userAgent) return true; // Sin user agent = probablemente bot
    const ua = userAgent.toLowerCase();
    return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

// Limpiar requests antiguos cada 2 minutos
setInterval(() => {
    const now = Date.now();
    for (const [ip, requests] of requestCounts.entries()) {
        const recentRequests = requests.filter(t => now - t < RATE_LIMIT_WINDOW);
        if (recentRequests.length === 0) {
            requestCounts.delete(ip);
        } else {
            requestCounts.set(ip, recentRequests);
        }
    }
}, 120000);

setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;
    for (const [id, data] of sharedChannels.entries()) {
        if (now - data.ts > maxAge) {
            sharedChannels.delete(id);
        }
    }
}, 60 * 60 * 1000);

// Middleware de seguridad avanzada
app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';
    
    // Bloquear bots conocidos
    if (isBot(userAgent)) {
        console.warn(`🚫 Bot detectado: ${ip} - ${userAgent}`);
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    // Rate limiting
    if (isRateLimited(ip)) {
        console.warn(`⚠️ Rate limit excedido: ${ip}`);
        return res.status(429).json({ error: 'Demasiadas solicitudes' });
    }
    
    // Headers de seguridad anti-scraping
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Security-Policy', "default-src 'self' https:; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https:");
    
    // Prevenir descarga directa de archivos
    if (req.path.match(/\.(html|css|js)$/i)) {
        res.setHeader('Content-Disposition', 'inline');
    }
    
    next();
});

// CORS restrictivo
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : '*',
    credentials: false,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Deshabilitar métodos HTTP innecesarios
app.use((req, res, next) => {
    if (['PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return res.status(405).json({ error: 'Método no permitido' });
    }
    next();
});

// Servir archivos estáticos con protecciones
app.use(express.static('.', {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');
    }
}));

// Ruta principal (incluyendo parámetros de query para links compartidos)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Manejar cualquier ruta que no sea archivo para SPA
app.get('/ULTRA', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/ULTRA/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/ULTRA/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para index2 (enlaces oficiales)
app.get('/enlaces', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index2.html'));
});

// Ruta para L3HO-LINKS
app.get('/l3ho-links', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'l3ho-links.html'));
});

// Servir attached_assets desde el directorio padre
app.use('/attached_assets', express.static(path.join(__dirname, '..', 'attached_assets')));

app.post('/api/share-channels', (req, res) => {
    try {
        const { title, channels } = req.body;
        
        if (!title || !channels) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }
        
        let shortId = generateShortId();
        while (sharedChannels.has(shortId)) {
            shortId = generateShortId();
        }
        
        sharedChannels.set(shortId, {
            t: title,
            c: channels,
            ts: Date.now()
        });
        
        console.log(`📤 Canales compartidos con ID: ${shortId}`);
        res.json({ id: shortId });
    } catch (error) {
        console.error('Error al compartir canales:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

app.get('/api/get-channels/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = sharedChannels.get(id);
        
        if (!data) {
            return res.status(404).json({ error: 'Enlace no encontrado o expirado' });
        }
        
        console.log(`📥 Canales recuperados con ID: ${id}`);
        res.json(data);
    } catch (error) {
        console.error('Error al recuperar canales:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ULTRAGOL servidor iniciado en puerto ${PORT}`);
    console.log(`🌐 Servidor disponible en: http://0.0.0.0:${PORT}`);
    console.log('⚽ ¡Listo para recibir transmisiones de fútbol!');
});