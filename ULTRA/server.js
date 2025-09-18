const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Configuración de seguridad con Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Para Firebase y scripts inline necesarios
                "https://www.gstatic.com",
                "https://cdnjs.cloudflare.com",
                "https://apis.google.com",
                "https://www.paypal.com",
                "https://www.sandbox.paypal.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'", // Para estilos en línea
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com"
            ],
            imgSrc: ["'self'", "data:", "https:", "https://www.paypalobjects.com"],
            connectSrc: [
                "'self'",
                "https://firestore.googleapis.com",
                "https://identitytoolkit.googleapis.com",
                "https://firebase.googleapis.com",
                "https://securetoken.googleapis.com",
                "https://www.googleapis.com",
                "https://firebasestorage.googleapis.com",
                "https://firebasestorage.app",
                "https://accounts.google.com",
                "https://apis.google.com",
                "https://www.paypal.com",
                "https://www.sandbox.paypal.com",
                "https://api.paypal.com",
                "https://api.sandbox.paypal.com"
            ],
            frameSrc: [
                "'self'",
                "https://accounts.google.com",
                "https://www.paypal.com",
                "https://www.sandbox.paypal.com",
                "https://www.youtube.com"
            ]
        }
    },
    hsts: {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true
    }
}));

// Remover header que revela tecnología
app.disable('x-powered-by');

// Configurar parseo de cookies con secreto
app.use(cookieParser(process.env.COOKIE_SECRET || 'ultragol-cookie-secret-2025'));

// Configurar sesiones seguras
app.use(session({
    name: 'ultragol_session',
    secret: process.env.SESSION_SECRET || 'ultragol-session-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        sameSite: 'strict'
    }
}));

// Middleware para verificar consentimiento de cookies
const checkCookieConsent = (req, res, next) => {
    const consent = req.cookies.cookieConsent;
    
    if (!consent && req.path !== '/api/cookie-consent' && req.path !== '/privacy-policy' && req.path !== '/cookie-policy') {
        res.locals.showCookieBanner = true;
    }
    
    // Parsear preferencias de cookies
    if (consent) {
        try {
            res.locals.cookiePreferences = JSON.parse(consent);
        } catch (e) {
            res.locals.cookiePreferences = { necessary: true };
        }
    } else {
        res.locals.cookiePreferences = { necessary: true };
    }
    
    next();
};

app.use(checkCookieConsent);

// Middleware CORS con configuración segura
app.use(cors({
    origin: isProduction ? false : true, // Más restrictivo en producción
    credentials: true
}));

// Configurar headers para evitar cache (solo para HTML)
app.use((req, res, next) => {
    if (req.path.endsWith('.html') || req.path === '/' || req.path.includes('/ULTRA')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// API Routes para gestión de cookies
app.use(express.json());

// Middleware de protección CSRF para endpoints críticos
const csrfProtection = (req, res, next) => {
    // Verificar Origin o Referer para endpoints de consentimiento
    const origin = req.get('Origin') || req.get('Referer');
    const allowedOrigins = [
        `http://localhost:${PORT}`,
        `https://localhost:${PORT}`,
        req.get('Host') ? `http://${req.get('Host')}` : null,
        req.get('Host') ? `https://${req.get('Host')}` : null
    ].filter(Boolean);
    
    if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return res.status(403).json({ 
            success: false, 
            error: 'Solicitud bloqueada por política de seguridad CSRF' 
        });
    }
    
    next();
};

// Endpoint para gestionar consentimiento de cookies
app.post('/api/cookie-consent', csrfProtection, (req, res) => {
    const { necessary = true, analytics = false, marketing = false, preferences = false } = req.body;
    
    const consentData = {
        necessary: true, // Siempre requerido
        analytics: analytics === true,
        marketing: marketing === true,
        preferences: preferences === true,
        timestamp: new Date().toISOString(),
        version: '1.0'
    };
    
    // Establecer cookie de consentimiento por 1 año
    res.cookie('cookieConsent', JSON.stringify(consentData), {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: false, // Permitir acceso JS para el banner
        secure: isProduction,
        sameSite: 'strict'
    });
    
    res.json({ 
        success: true, 
        message: 'Consentimiento guardado exitosamente',
        consent: consentData 
    });
});

// Endpoint para retirar consentimiento
app.delete('/api/cookie-consent', csrfProtection, (req, res) => {
    res.clearCookie('cookieConsent');
    res.clearCookie('_ga'); // Limpiar Google Analytics si existe
    res.clearCookie('_gid');
    res.clearCookie('_fbp'); // Facebook Pixel
    
    res.json({ 
        success: true, 
        message: 'Consentimiento retirado exitosamente' 
    });
});

// Endpoint para obtener estado actual del consentimiento
app.get('/api/cookie-consent', (req, res) => {
    const consent = req.cookies.cookieConsent;
    
    if (consent) {
        try {
            res.json({ hasConsent: true, preferences: JSON.parse(consent) });
        } catch (e) {
            res.json({ hasConsent: false, preferences: { necessary: true } });
        }
    } else {
        res.json({ hasConsent: false, preferences: { necessary: true } });
    }
});

// PayPal endpoints from integration (conditional loading for development)
let createPaypalOrder, capturePaypalOrder, loadPaypalDefault;

try {
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
        const paypalModule = require('../server/paypal');
        createPaypalOrder = paypalModule.createPaypalOrder;
        capturePaypalOrder = paypalModule.capturePaypalOrder;
        loadPaypalDefault = paypalModule.loadPaypalDefault;
        console.log('✅ PayPal integration loaded successfully');
    } else {
        console.log('⚠️  PayPal credentials not found - PayPal features will be disabled');
        // Create mock functions that return appropriate errors
        createPaypalOrder = (req, res) => res.status(503).json({ error: 'PayPal no configurado en desarrollo' });
        capturePaypalOrder = (req, res) => res.status(503).json({ error: 'PayPal no configurado en desarrollo' });
        loadPaypalDefault = (req, res) => res.status(503).json({ error: 'PayPal no configurado en desarrollo' });
    }
} catch (error) {
    console.log('⚠️  PayPal integration error - PayPal features will be disabled:', error.message);
    createPaypalOrder = (req, res) => res.status(503).json({ error: 'PayPal no configurado en desarrollo' });
    capturePaypalOrder = (req, res) => res.status(503).json({ error: 'PayPal no configurado en desarrollo' });
    loadPaypalDefault = (req, res) => res.status(503).json({ error: 'PayPal no configurado en desarrollo' });
}

app.get('/api/paypal/setup', async (req, res) => {
    await loadPaypalDefault(req, res);
});

app.get('/api/paypal/config', (req, res) => {
    if (!process.env.PAYPAL_CLIENT_ID) {
        return res.status(500).json({
            error: 'Configuración de PayPal no disponible'
        });
    }
    
    res.json({
        client_id: process.env.PAYPAL_CLIENT_ID,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    });
});

app.post('/api/paypal/order', csrfProtection, async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
});

app.post('/api/paypal/order/:orderID/capture', csrfProtection, async (req, res) => {
    await capturePaypalOrder(req, res);
});


// Health check endpoint for monitoring
app.get('/healthz', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'ULTRAGOL Server'
    });
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

// Servir archivos estáticos del proyecto principal de forma segura
const allowedDirectories = ['assets', 'css', 'js', 'data', 'attached_assets'];
allowedDirectories.forEach(dir => {
    app.use(`/${dir}`, express.static(path.join(__dirname, '..', dir), {
        setHeaders: (res, path) => {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }));
});

// Sub-rutas de ULTRA - servir SPA para rutas ULTRA usando regex
app.get(/^\/ULTRA\/.*/, (req, res) => {
    // Only serve index.html if it's not already handled by static files
    if (!req.url.includes('.')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Ruta principal - servir el index.html del proyecto principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Rutas específicas para páginas HTML del proyecto principal
const mainPages = ['calendario.html', 'chat-global.html', 'donaciones.html', 'estadisticas.html', 'fotos.html', 'historias.html', 'noticias.html', 'standings.html', 'team-profile.html', 'teams.html'];

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
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ULTRAGOL servidor iniciado en puerto ${PORT}`);
    console.log(`🌐 Servidor disponible en: http://0.0.0.0:${PORT}`);
    console.log('⚽ ¡Listo para recibir transmisiones de fútbol!');
});