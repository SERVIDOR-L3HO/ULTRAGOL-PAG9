const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');

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

app.use(express.static(path.join(__dirname), {
    setHeaders: (res, filepath) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UltraGol server started on port ${PORT}`);
    console.log(`🌐 Server available at: http://0.0.0.0:${PORT}`);
    console.log('⚽ Ready for Liga MX action!');
});
