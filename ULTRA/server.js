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
                "https://js.stripe.com"
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
            imgSrc: ["'self'", "data:", "https:"],
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
                "https://api.stripe.com",
                "https://js.stripe.com"
            ],
            frameSrc: [
                "'self'",
                "https://accounts.google.com",
                "https://js.stripe.com",
                "https://hooks.stripe.com"
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

// Stripe payment endpoints
app.post('/api/create-payment-intent', csrfProtection, async (req, res) => {
    try {
        const { amount, currency = 'mxn', metadata = {} } = req.body;
        
        // Validar que amount es un número válido en pesos MXN
        const amountInPesos = Number(amount);
        if (!amountInPesos || amountInPesos < 10) { // Mínimo $10 MXN
            return res.status(400).json({
                error: 'Cantidad mínima requerida es $10 MXN'
            });
        }
        
        if (amountInPesos > 50000) { // Máximo $50,000 MXN
            return res.status(400).json({
                error: 'Cantidad máxima permitida es $50,000 MXN'
            });
        }
        
        // Convertir pesos a centavos para Stripe
        const amountInCentavos = Math.round(amountInPesos * 100);
        
        // Verificar que las claves de Stripe estén configuradas
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('STRIPE_SECRET_KEY no está configurada');
            return res.status(500).json({
                error: 'Configuración de pagos no disponible'
            });
        }
        
        // Crear PaymentIntent con Stripe
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCentavos, // amount en centavos
            currency: currency.toLowerCase(),
            payment_method_types: ['card'],
            metadata: {
                platform: 'UltraGol',
                type: 'donation',
                amountInPesos: amountInPesos.toString(),
                ...metadata
            }
        });
        
        res.json({
            client_secret: paymentIntent.client_secret,
            status: 'success'
        });
        
    } catch (error) {
        console.error('Error creating PaymentIntent:', error);
        res.status(500).json({
            error: 'Error interno del servidor al procesar el pago'
        });
    }
});

// Endpoint para obtener configuración de Stripe (clave pública)
app.get('/api/stripe-config', (req, res) => {
    if (!process.env.STRIPE_PUBLISHABLE_KEY) {
        return res.status(500).json({
            error: 'Configuración de Stripe no disponible'
        });
    }
    
    res.json({
        publishable_key: process.env.STRIPE_PUBLISHABLE_KEY
    });
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

// Sub-rutas de ULTRA - servir SPA para rutas ULTRA
app.get('/ULTRA/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ULTRAGOL servidor iniciado en puerto ${PORT}`);
    console.log(`🌐 Servidor disponible en: http://0.0.0.0:${PORT}`);
    console.log('⚽ ¡Listo para recibir transmisiones de fútbol!');
});