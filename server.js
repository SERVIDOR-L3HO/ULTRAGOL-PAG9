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

async function fetchMarcadores() {
    const res = await fetch(`${API_BASE_URL}/marcadores`);
    return res.json();
}

async function fetchTransmisiones() {
    try {
        const res = await fetch(`${API_BASE_URL}/transmisiones3`);
        return res.json();
    } catch { return { transmisiones: [] }; }
}

// Serve static assets from mx/ folder before route handlers
app.use('/mx', express.static(path.join(__dirname, 'mx'), { index: false }));

// API: today's matches (used by the client-side index page)
app.get('/api/mx/partidos', async (req, res) => {
    try {
        const data = await fetchMarcadores();
        res.json(data);
    } catch (err) {
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
    let transmisionUrl = null;

    try {
        const [marcData, transData] = await Promise.all([fetchMarcadores(), fetchTransmisiones()]);
        const partidos = marcData.partidos || [];

        matchData = partidos.find(p => {
            const s = matchSlug(p.local.nombre, p.visitante.nombre);
            return s === slug;
        });

        if (matchData && transData.transmisiones) {
            const localSlug = slugify(matchData.local.nombre);
            const visSlug = slugify(matchData.visitante.nombre);
            const found = transData.transmisiones.find(t => {
                const e = slugify(t.evento || t.titulo || '');
                return e.includes(localSlug) || e.includes(visSlug);
            });
            if (found) transmisionUrl = found.url || (found.enlaces && found.enlaces[0]);
        }
    } catch (e) {
        // continue with no data
    }

    if (!matchData) {
        // Build a generic SEO page from the slug
        const parts = slug.split('-vs-');
        const t1 = (parts[0] || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const t2 = (parts[1] || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const title = `${t1} vs ${t2} EN VIVO | UltraGol`;
        const desc = `Sigue el partido ${t1} vs ${t2} en vivo con marcador en tiempo real, goles y transmisiones en UltraGol.`;
        return res.send(buildMatchPage({ slug, title, desc, local: { nombre: t1 }, visitante: { nombre: t2 }, estado: null, goles: [], detalles: {}, transmisionUrl }));
    }

    const { local, visitante, estado, goles, detalles } = matchData;
    const teamTitle = `${local.nombre} vs ${visitante.nombre}`;
    const scoreStr = (estado && !estado.programado)
        ? ` ${local.marcador}-${visitante.marcador}`
        : '';
    const statusStr = estado && estado.enVivo ? ' EN VIVO' : (estado && estado.finalizado ? ' - Resultado Final' : '');
    const title = `${teamTitle}${scoreStr}${statusStr} | UltraGol`;
    const desc = `${teamTitle}${scoreStr}. Sigue el partido en vivo con marcador, goles y transmisión gratis en UltraGol.`;

    res.send(buildMatchPage({ slug, title, desc, local, visitante, estado, goles: goles || [], detalles: detalles || {}, transmisionUrl }));
});

function buildMatchPage({ slug, title, desc, local, visitante, estado, goles, detalles, transmisionUrl }) {
    const isLive = estado && estado.enVivo;
    const isFinished = estado && estado.finalizado;
    const isUpcoming = !isLive && !isFinished;
    const statusLabel = isLive ? (estado.reloj || 'En Vivo') : isFinished ? 'Terminado' : (estado ? (estado.descripcion || 'Próximo') : 'Próximo');
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

    const localLogoHtml = local.logo
        ? `<img src="${local.logo}" alt="${local.nombre}" onerror="this.src='/assets/logos/ultragol-logo.png'">`
        : `<img src="/assets/logos/ultragol-logo.png" alt="${local.nombre}">`;
    const visitanteLogoHtml = visitante.logo
        ? `<img src="${visitante.logo}" alt="${visitante.nombre}" onerror="this.src='/assets/logos/ultragol-logo.png'">`
        : `<img src="/assets/logos/ultragol-logo.png" alt="${visitante.nombre}">`;

    const scoreLocal = (local.marcador !== undefined && local.marcador !== '') ? local.marcador : '-';
    const scoreVisitante = (visitante.marcador !== undefined && visitante.marcador !== '') ? visitante.marcador : '-';

    const canonicalUrl = `https://ultragol-l3ho.com.mx/mx/${slug}`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        'name': `${local.nombre} vs ${visitante.nombre}`,
        'description': desc,
        'url': canonicalUrl,
        'sport': 'Soccer',
        'homeTeam': { '@type': 'SportsTeam', 'name': local.nombre },
        'awayTeam': { '@type': 'SportsTeam', 'name': visitante.nombre },
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
            <a href="/">UltraGol</a> › <a href="/mx">Partidos de Hoy</a> › ${local.nombre} vs ${visitante.nombre}
        </div>
        <div class="match-scorecard">
            <div class="scorecard-team">
                ${localLogoHtml}
                <h2>${local.nombre}</h2>
                ${local.nombreCorto ? `<div style="color:var(--text-muted);font-size:.8rem">${local.nombreCorto}</div>` : ''}
            </div>
            <div class="scorecard-center">
                <div class="scorecard-score">${scoreLocal}<span>:</span>${scoreVisitante}</div>
                <div class="scorecard-meta">
                    <div class="status-badge ${statusClass}">${isLive ? '🔴 ' : ''}${statusLabel}</div>
                    ${detalles.estadio ? `<div style="color:var(--text-muted);font-size:.8rem;text-align:center">🏟 ${detalles.estadio}</div>` : ''}
                </div>
            </div>
            <div class="scorecard-team">
                ${visitanteLogoHtml}
                <h2>${visitante.nombre}</h2>
                ${visitante.nombreCorto ? `<div style="color:var(--text-muted);font-size:.8rem">${visitante.nombreCorto}</div>` : ''}
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

app.get('/ultra', (req, res) => {
    res.sendFile(path.join(__dirname, 'ULTRA', 'index.html'));
});

app.get('/cinenova', (req, res) => {
    res.sendFile(path.join(__dirname, 'cinenova.html'));
});

app.get('/knexo', (req, res) => {
    res.sendFile(path.join(__dirname, 'knexo.html'));
});

// ULTRACANALES — use regex to match ONLY without trailing slash to avoid redirect loops
app.get(/^\/ultracanales$/, (req, res) => {
    res.redirect(301, '/ultracanales/');
});

app.get(/^\/ULTRACANALES\/?$/, (req, res) => {
    res.redirect(301, '/ultracanales/');
});

app.get('/ultracanales/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ULTRACANALES', 'index.html'));
});

const staticOpts = {
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
};

app.use('/ultracanales', express.static(path.join(__dirname, 'ULTRACANALES'), staticOpts));
app.use('/ULTRACANALES', express.static(path.join(__dirname, 'ULTRACANALES'), staticOpts));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UltraGol server started on port ${PORT}`);
    console.log(`🌐 Server available at: http://0.0.0.0:${PORT}`);
    console.log('⚽ Ready for Liga MX action!');
});
