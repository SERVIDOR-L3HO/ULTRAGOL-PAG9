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

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

// Configurar headers para evitar cache
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Servir archivos estáticos
app.use(express.static('.', {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// Ruta principal
app.get('/', (req, res) => {
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