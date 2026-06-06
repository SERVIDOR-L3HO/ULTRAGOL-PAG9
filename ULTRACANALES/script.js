/* ===================== ULTRACANALES — HOME SCRIPT ===================== */
const API_URL = 'https://ultragol-api-3--olivia32809.replit.app/canales';

const CAT_META = {
    'Sports':               { label: 'Deportes',          icon: '🏆' },
    'News + Opinion':       { label: 'Noticias',           icon: '📰' },
    'Entertainment':        { label: 'Entretenimiento',    icon: '⭐' },
    'Movies':               { label: 'Películas',          icon: '🎬' },
    'Comedy':               { label: 'Comedia',            icon: '😂' },
    'En Español':           { label: 'En Español',         icon: '🌎' },
    'Kids':                 { label: 'Infantil',           icon: '👶' },
    'Anime':                { label: 'Anime',              icon: '⛩️'  },
    'Drama':                { label: 'Drama',              icon: '🎭' },
    'Music Videos':         { label: 'Música',             icon: '🎵' },
    'History + Science':    { label: 'Historia y Ciencia', icon: '🔬' },
    'Reality':              { label: 'Reality',            icon: '📷' },
    'Classic TV':           { label: 'TV Clásica',         icon: '📺' },
    'Animals + Nature':     { label: 'Naturaleza',         icon: '🦁' },
    'True Crime':           { label: 'Crimen Real',        icon: '🔍' },
    'Sci-Fi':               { label: 'Sci-Fi',             icon: '🚀' },
    'Home + Food':          { label: 'Hogar y Comida',     icon: '🍳' },
    'Local News':           { label: 'Noticias Locales',   icon: '📍' },
    'Westerns':             { label: 'Westerns',           icon: '🤠' },
    'Daytime + Game Shows': { label: 'Programas',          icon: '🎮' },
    'Competition Reality':  { label: 'Competencias',       icon: '🏅' },
};

const CARD_COLORS = ['#8B2FC9','#2563eb','#059669','#dc2626','#d97706','#7c3aed','#0891b2','#16a34a'];
let allChannels = [];
let plutoChannels = [];
let heroChannels = [];
let heroIndex = 0;
let heroTimer = null;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    loadChannels();
    setupSearch();
});

async function loadChannels() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        allChannels = (data.canales || []).filter(c => c.player_url);
        plutoChannels = allChannels.filter(c => c.fuente === 'Pluto TV');
        buildHero();
        buildRows();
        document.getElementById('loadingState').style.display = 'none';
    } catch (e) {
        document.getElementById('loadingState').innerHTML = '<p style="color:var(--text2)">Error al cargar los canales. Intenta de nuevo.</p>';
    }
}

// ---- HERO ----
function buildHero() {
    const featured = plutoChannels.filter(c => c.extra && c.extra.thumbnail);
    if (!featured.length) return;
    // Shuffle & pick 6
    heroChannels = featured.sort(() => Math.random() - 0.5).slice(0, 6);
    setHeroSlide(0);
    buildHeroDots();
}

function setHeroSlide(idx) {
    heroIndex = idx;
    const ch = heroChannels[idx];
    if (!ch) return;
    const bg = document.getElementById('heroBg');
    const content = document.getElementById('heroContent');
    bg.style.backgroundImage = `url('${ch.extra.thumbnail}')`;
    const cat = ch.categorias[0] || '';
    const catMeta = CAT_META[cat] || { label: cat, icon: '📺' };
    content.innerHTML = `
        <div class="uc-hero-inner">
            <div class="uc-hero-source">${catMeta.icon} ${catMeta.label} · EN VIVO</div>
            ${ch.logo ? `<img src="${ch.logo}" alt="${ch.nombre}" class="uc-hero-logo" onerror="this.style.display='none'">` : ''}
            <h1 class="uc-hero-title">${ch.nombre}</h1>
            ${ch.extra && ch.extra.descripcion ? `<p class="uc-hero-desc">${ch.extra.descripcion.slice(0, 140)}...</p>` : ''}
            <div class="uc-hero-actions">
                <button class="uc-hero-play" onclick="playChannel(heroChannels[${idx}])">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Reproducir
                </button>
                <button class="uc-hero-more" onclick="window.location.href='./canales.html'">
                    Todos los canales
                </button>
            </div>
        </div>
    `;
    // Update dots
    document.querySelectorAll('.uc-hero-dot').forEach((d, i) => {
        d.classList.toggle('active', i === idx);
    });
    // Auto-rotate
    clearTimeout(heroTimer);
    heroTimer = setTimeout(() => setHeroSlide((heroIndex + 1) % heroChannels.length), 7000);
}

function buildHeroDots() {
    const dotsEl = document.createElement('div');
    dotsEl.className = 'uc-hero-dots';
    heroChannels.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 'uc-hero-dot' + (i === 0 ? ' active' : '');
        d.onclick = () => setHeroSlide(i);
        dotsEl.appendChild(d);
    });
    document.getElementById('heroSection').appendChild(dotsEl);
}

// ---- ROWS ----
function buildRows() {
    const main = document.getElementById('mainContent');
    main.innerHTML = '';

    const catOrder = ['Sports','News + Opinion','Entertainment','Movies','Comedy','En Español','Kids','Anime','Drama','Music Videos','History + Science','Classic TV','Animals + Nature','Reality','Sci-Fi','True Crime','Home + Food','Daytime + Game Shows'];

    catOrder.forEach(cat => {
        const channels = plutoChannels.filter(c => c.categorias.includes(cat));
        if (!channels.length) return;
        const meta = CAT_META[cat] || { label: cat, icon: '📺' };
        const row = buildRow(meta.icon + ' ' + meta.label, channels, cat);
        main.appendChild(row);
    });
}

function buildRow(title, channels, catKey) {
    const section = document.createElement('section');
    section.className = 'uc-row';
    section.innerHTML = `
        <div class="uc-row-header">
            <h2 class="uc-row-title">${title}</h2>
            <a href="./canales.html?cat=${encodeURIComponent(catKey)}" class="uc-row-see-all">Ver todos →</a>
        </div>
        <div class="uc-cards-scroll">
            <div class="uc-cards-track">
                ${channels.map(buildCard).join('')}
            </div>
        </div>
    `;
    return section;
}

function buildCard(ch) {
    const thumb = ch.extra && ch.extra.thumbnail ? ch.extra.thumbnail : null;
    const cat = ch.categorias[0] || '';
    const meta = CAT_META[cat] || { label: cat };
    const initials = ch.nombre.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    const colorIdx = ch.nombre.charCodeAt(0) % CARD_COLORS.length;
    const id = `ch_${ch.id.replace(/[^a-z0-9]/gi, '_')}`;
    return `
        <div class="uc-card" onclick="playChannel(${JSON.stringify(ch).replace(/"/g, '&quot;')})" data-id="${id}">
            <div class="uc-card-thumb">
                ${thumb
                    ? `<img src="${thumb}" alt="${ch.nombre}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=\\'uc-card-placeholder\\'>${initials}</div>'">`
                    : `<div class="uc-card-placeholder">${initials}</div>`
                }
                <div class="uc-card-live-pill">● EN VIVO</div>
                <div class="uc-card-play-btn">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
            </div>
            <div class="uc-card-info">
                ${ch.logo
                    ? `<img src="${ch.logo}" alt="${ch.nombre}" class="uc-card-logo" onerror="this.style.display='none'">`
                    : `<div class="uc-card-logo-placeholder" style="background:${CARD_COLORS[colorIdx]}">${initials.slice(0,2)}</div>`
                }
                <div class="uc-card-text">
                    <div class="uc-card-name">${ch.nombre}</div>
                    <div class="uc-card-cat">${meta.label || cat}</div>
                </div>
            </div>
        </div>
    `;
}

// ---- PLAYER ----
function playChannel(ch) {
    if (typeof ch === 'string') ch = JSON.parse(ch);
    const overlay = document.getElementById('playerOverlay');
    const iframe = document.getElementById('ucIframe');
    const playerName = document.getElementById('playerName');
    const playerLogo = document.getElementById('playerLogo');
    const playerDesc = document.getElementById('playerDesc');

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    playerName.textContent = ch.nombre;
    playerDesc.textContent = (ch.extra && ch.extra.descripcion) ? ch.extra.descripcion : '';
    if (ch.logo) {
        playerLogo.src = ch.logo;
        playerLogo.style.display = 'block';
    } else {
        playerLogo.style.display = 'none';
    }

    iframe.src = ch.player_url;
}

function closePlayer() {
    const overlay = document.getElementById('playerOverlay');
    const iframe = document.getElementById('ucIframe');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    iframe.src = '';
}

// ---- SEARCH ----
function setupSearch() {
    const input = document.getElementById('searchInput');
    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => doSearch(input.value.trim()), 280);
    });
    input.addEventListener('keydown', e => { if (e.key === 'Escape') { input.value = ''; doSearch(''); } });
}

function doSearch(q) {
    const main = document.getElementById('mainContent');
    if (!q) { buildRows(); return; }
    const lq = q.toLowerCase();
    const results = allChannels.filter(c => c.nombre.toLowerCase().includes(lq) && c.streams.length > 0).slice(0, 60);
    main.innerHTML = `
        <div class="uc-search-results">
            <div class="uc-row-header">
                <h2 class="uc-row-title">🔍 Resultados para "${q}" <span style="font-size:14px;font-weight:400;color:var(--text2)">(${results.length} canales)</span></h2>
            </div>
            <div class="uc-search-grid">
                ${results.map(buildCard).join('')}
            </div>
        </div>
    `;
}

// ---- KEYBOARD ----
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePlayer();
});
