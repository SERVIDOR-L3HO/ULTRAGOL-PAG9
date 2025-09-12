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

// Servir archivos estáticos de ULTRA en /ULTRA path
app.use('/ULTRA', express.static('.', {
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

// Ruta específica para ULTRA
app.get('/ULTRA/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta principal - servir el index.html del proyecto principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Manejo de rutas para páginas del proyecto principal
app.get('*', (req, res) => {
    // Intentar servir el archivo solicitado del proyecto principal
    const requestedFile = path.join(__dirname, '..', req.path);
    const fs = require('fs');
    
    // Si el archivo existe, servirlo
    if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
        res.sendFile(requestedFile);
    } else {
        // Si no existe, servir el index principal
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ULTRAGOL servidor iniciado en puerto ${PORT}`);
    console.log(`🌐 Servidor disponible en: http://0.0.0.0:${PORT}`);
    console.log('⚽ ¡Listo para recibir transmisiones de fútbol!');
});