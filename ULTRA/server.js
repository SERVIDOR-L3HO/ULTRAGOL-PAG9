const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

const sharedChannels = new Map();

function generateShortId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;
    for (const [id, data] of sharedChannels.entries()) {
        if (now - data.ts > maxAge) {
            sharedChannels.delete(id);
        }
    }
}, 60 * 60 * 1000);

// Middleware de seguridad global
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// CSP para páginas estáticas (sin Google Ads)
app.get(['/enlaces', '/l3ho-links'], (req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self' https:; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https: wss:;");
    next();
});

// CORS restrictivo
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : '*',
    credentials: false,
    methods: ['GET', 'POST', 'HEAD'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Deshabilitar métodos HTTP innecesarios (pero permitir HEAD para navegadores)
app.use((req, res, next) => {
    if (['PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(req.method)) {
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

// Servir ULTRACANALES desde el directorio padre
app.use('/ULTRACANALES', express.static(path.join(__dirname, '..', 'ULTRACANALES'), {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');
    }
}));

// Middleware CSP para app (con Google Ads)
app.use((req, res, next) => {
    if (req.path === '/' || req.path.startsWith('/ULTRA')) {
        res.setHeader('Content-Security-Policy', "default-src 'self' https:; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://pagead2.googlesyndication.com https://www.gstatic.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https: wss:;");
    }
    next();
});

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

// Ruta para transmisiones6
app.get('/api/transmisiones6', (req, res) => {
    try {
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'transmisiones6.json'), 'utf8'));
        res.json(data);
    } catch (error) {
        console.error('Error al leer transmisiones6:', error);
        res.status(500).json({ error: 'Error al cargar transmisiones' });
    }
});

app.get('/transmisiones6', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ULTRAGOL servidor iniciado en puerto ${PORT}`);
    console.log(`🌐 Servidor disponible en: http://0.0.0.0:${PORT}`);
    console.log('⚽ ¡Listo para recibir transmisiones de fútbol!');
});