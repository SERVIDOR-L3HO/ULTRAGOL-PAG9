const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));

// Configurar headers para evitar cache
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Ruta específica para ULTRA - manejo exacto (antes de static middleware)
app.get('/ULTRA', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/ULTRA/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Servir archivos estáticos de ULTRA
app.use('/ULTRA', express.static(__dirname, {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// Servir archivos estáticos del proyecto principal
app.use(express.static('..', {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// Sub-rutas de ULTRA - servir SPA para rutas ULTRA
app.get('/ULTRA/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta principal - servir el index.html del proyecto principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Rutas específicas para páginas HTML del proyecto principal
const mainPages = ['calendario.html', 'chat-global.html', 'estadisticas.html', 'fotos.html', 'historias.html', 'noticias.html', 'standings.html', 'team-profile.html', 'teams.html'];

mainPages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, '..', page));
    });
    
    // Handle routes without .html extension
    const routeName = page.replace('.html', '');
    app.get(`/${routeName}`, (req, res) => {
        res.sendFile(path.join(__dirname, '..', page));
    });
});

// Fallback for any other routes - serve main index
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ULTRAGOL servidor iniciado en puerto ${PORT}`);
    console.log(`🌐 Servidor disponible en: http://0.0.0.0:${PORT}`);
    console.log('⚽ ¡Listo para recibir transmisiones de fútbol!');
});