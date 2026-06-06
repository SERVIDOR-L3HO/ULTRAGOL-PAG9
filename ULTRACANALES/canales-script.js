/* ===================== ULTRACANALES — CANALES SCRIPT ===================== */
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
    'April Ghouls':         { label: 'Terror',             icon: '👻' },
    // IPTV
    'sports':       { label: 'Deportes',       icon: '🏆' },
    'news':         { label: 'Noticias',       icon: '📰' },
    'entertainment':{ label: 'Entretenimiento',icon: '⭐' },
    'movies':       { label: 'Películas',      icon: '🎬' },
    'kids':         { label: 'Infantil',       icon: '👶' },
    'music':        { label: 'Música',         icon: '🎵' },
    'documentary':  { label: 'Documentales',   icon: '🎥' },
    'comedy':       { label: 'Comedia',        icon: '😂' },
    'general':      { label: 'General',        icon: '📡' },
    'business':     { label: 'Negocios',       icon: '💼' },
    'lifestyle':    { label: 'Estilo de Vida', icon: '✨' },
    'auto':         { label: 'Autos',          icon: '🚗' },
    'shop':         { label: 'Shopping',       icon: '🛒' },
    'relax':        { label: 'Relax',          icon: '🌙' },
    'culture':      { label: 'Cultura',        icon: '🎨' },
    'family':       { label: 'Familia',        icon: '👨‍👩‍👧' },
    'outdoor':      { label: 'Naturaleza',     icon: '🦁' },
    'religious':    { label: 'Religión',       icon: '✝️'  },
    'animation':    { label: 'Animación',      icon: '🎞️'  },
    'weather':      { label: 'Clima',          icon: '🌤️'  },
    'classic':      { label: 'Clásicos',       icon: '📺' },
    'education':    { label: 'Educación',      icon: '📚' },
    'travel':       { label: 'Viajes',         icon: '✈️'  },
    'science':      { label: 'Ciencia',        icon: '🔬' },
    'cooking':      { label: 'Cocina',         icon: '🍳' },
    'public':       { label: 'Público',        icon: '🏛️'  },
};

const CARD_COLORS = ['#8B2FC9','#2563eb','#059669','#dc2626','#d97706','#7c3aed','#0891b2','#16a34a','#be185d','#b45309'];

let allChannels = [];
let filteredChannels = [];
let visibleCount = 60;
const PAGE_SIZE = 60;
let currentCat = 'all';
let currentSrc = 'all';
let searchQuery = '';

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cat')) currentCat = params.get('cat');
    loadChannels();
    setupSearch();
});

async function loadChannels() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        allChannels = (data.canales || []).filter(c => c.player_url);
        document.getElementById('channelCount').textContent = `${allChannels.length.toLocaleString()} canales`;
        buildSidebar();
        applyFilters();
        document.getElementById('loadingState').style.display = 'none';
    } catch (e) {
        document.getElementById('loadingState').innerHTML = '<p style="color:var(--text2)">Error al cargar. Recarga la página.</p>';
    }
}

// ---- SIDEBAR ----
function buildSidebar() {
    const catList = document.getElementById('catList');

    // Collect all categories with counts
    const catCounts = {};
    allChannels.forEach(ch => {
        (ch.categorias || []).forEach(cat => {
            catCounts[cat] = (catCounts[cat] || 0) + 1;
        });
    });

    // Update "all" count
    document.getElementById('count-all').textContent = allChannels.length.toLocaleString();

    // Sort: put known categories first, then rest alphabetically
    const knownOrder = ['Sports','News + Opinion','Entertainment','Movies','Comedy','En Español','Kids','Anime','Drama','Music Videos','History + Science','Classic TV','Animals + Nature','Reality','Sci-Fi','True Crime','Home + Food','Daytime + Game Shows','Competition Reality','Westerns','April Ghouls','sports','news','entertainment','movies','kids','music','documentary','comedy','general','lifestyle','auto','relax','culture','family','outdoor','cooking','travel','science','education','animation','weather','religious','classic','public','business','shop'];
    const allCats = [...new Set([...knownOrder.filter(k => catCounts[k]), ...Object.keys(catCounts).sort()])];

    allCats.forEach(cat => {
        const meta = CAT_META[cat] || { label: cat, icon: '📡' };
        const count = catCounts[cat] || 0;
        const btn = document.createElement('button');
        btn.className = 'cn-cat-btn' + (cat === currentCat ? ' active' : '');
        btn.dataset.cat = cat;
        btn.innerHTML = `<span class="cn-cat-icon">${meta.icon}</span><span class="cn-cat-label">${meta.label}</span><span class="cn-cat-count">${count.toLocaleString()}</span>`;
        btn.onclick = () => filterCat(cat, btn);
        catList.appendChild(btn);
        document.getElementById(`count-all`); // keep "all" first
    });

    // Activate selected cat
    if (currentCat !== 'all') {
        const btn = catList.querySelector(`[data-cat="${currentCat}"]`);
        if (btn) btn.click();
    }
}

// ---- FILTERS ----
function filterCat(cat, btn) {
    currentCat = cat;
    visibleCount = PAGE_SIZE;
    document.querySelectorAll('.cn-cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    applyFilters();
    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
}

function filterSource(src, btn) {
    currentSrc = src;
    visibleCount = PAGE_SIZE;
    document.querySelectorAll('.cn-src-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    applyFilters();
}

function applyFilters() {
    let channels = allChannels;

    // Source filter
    if (currentSrc !== 'all') {
        channels = channels.filter(c => c.fuente === currentSrc);
    }
    // Category filter
    if (currentCat !== 'all') {
        channels = channels.filter(c => (c.categorias || []).includes(currentCat));
    }
    // Search filter
    if (searchQuery) {
        const lq = searchQuery.toLowerCase();
        channels = channels.filter(c =>
            c.nombre.toLowerCase().includes(lq) ||
            (c.pais || '').toLowerCase().includes(lq)
        );
    }

    filteredChannels = channels;
    renderGrid();
    updateGridHeader();
}

function updateGridHeader() {
    const catMeta = currentCat === 'all' ? { label: 'Todos los Canales', icon: '📡' } : (CAT_META[currentCat] || { label: currentCat, icon: '📺' });
    let title = currentCat === 'all' ? 'Todos los Canales' : `${catMeta.icon} ${catMeta.label}`;
    if (searchQuery) title = `🔍 Resultados para "${searchQuery}"`;
    document.getElementById('gridTitle').textContent = title;
    document.getElementById('gridInfo').textContent = `${filteredChannels.length.toLocaleString()} canales`;
}

// ---- GRID ---- 
function renderGrid() {
    const grid = document.getElementById('channelGrid');
    const slice = filteredChannels.slice(0, visibleCount);
    grid.innerHTML = slice.length === 0
        ? '<div class="cn-no-results">No se encontraron canales.</div>'
        : slice.map(buildCard).join('');
    const loadWrap = document.getElementById('loadMoreWrap');
    loadWrap.style.display = filteredChannels.length > visibleCount ? 'block' : 'none';
}

function buildCard(ch) {
    const thumb = ch.extra && ch.extra.thumbnail ? ch.extra.thumbnail : null;
    const cat = (ch.categorias || [])[0] || '';
    const meta = CAT_META[cat] || { label: cat };
    const initials = ch.nombre.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    const colorIdx = ch.nombre.charCodeAt(0) % CARD_COLORS.length;
    const chData = JSON.stringify(ch).replace(/"/g, '&quot;');
    const isPluto = ch.fuente === 'Pluto TV';
    return `
        <div class="cn-card" onclick="playChannel('${chData}')">
            <div class="cn-card-thumb">
                ${thumb
                    ? `<img src="${thumb}" alt="${ch.nombre}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=\\'cn-card-placeholder\\'>${initials}</div>'">`
                    : `<div class="cn-card-placeholder">${initials}</div>`
                }
                <div class="cn-card-overlay">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <div class="cn-card-live">● EN VIVO</div>
                ${isPluto ? '<div class="cn-card-source">Pluto TV</div>' : ''}
            </div>
            <div class="cn-card-info">
                ${ch.logo
                    ? `<img src="${ch.logo}" alt="${ch.nombre}" class="cn-card-logo" onerror="this.style.display='none'">`
                    : `<div class="cn-card-logo-ph" style="background:${CARD_COLORS[colorIdx]}">${initials.slice(0,2)}</div>`
                }
                <div class="cn-card-text">
                    <div class="cn-card-name">${ch.nombre}</div>
                    <div class="cn-card-sub">${meta.label || cat || ch.pais || ''}</div>
                </div>
            </div>
        </div>
    `;
}

function loadMore() {
    visibleCount += PAGE_SIZE;
    renderGrid();
}

// ---- PLAYER ----
function playChannel(chData) {
    let ch;
    try { ch = typeof chData === 'string' ? JSON.parse(chData.replace(/&quot;/g, '"')) : chData; }
    catch (e) { return; }

    const overlay = document.getElementById('playerOverlay');
    const iframe = document.getElementById('cnIframe');

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.getElementById('playerName').textContent = ch.nombre;
    document.getElementById('playerDesc').textContent = (ch.extra && ch.extra.descripcion) ? ch.extra.descripcion : '';

    const logo = document.getElementById('playerLogo');
    if (ch.logo) { logo.src = ch.logo; logo.style.display = 'block'; } else { logo.style.display = 'none'; }

    // Tags
    const tagsEl = document.getElementById('playerTags');
    const tags = [];
    if (ch.pais && ch.pais !== 'Internacional') tags.push(ch.bandera ? `${ch.bandera} ${ch.pais}` : ch.pais);
    (ch.categorias || []).slice(0,2).forEach(cat => {
        const m = CAT_META[cat]; if (m) tags.push(m.icon + ' ' + m.label);
    });
    if (ch.fuente) tags.push(ch.fuente);
    tagsEl.innerHTML = tags.map(t => `<span class="cn-player-tag">${t}</span>`).join('');

    iframe.src = ch.player_url;
}

function closePlayer() {
    const overlay = document.getElementById('playerOverlay');
    const iframe = document.getElementById('cnIframe');
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
        timer = setTimeout(() => {
            searchQuery = input.value.trim();
            visibleCount = PAGE_SIZE;
            applyFilters();
        }, 280);
    });
    input.addEventListener('keydown', e => { if (e.key === 'Escape') clearSearch(); });
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    input.value = '';
    searchQuery = '';
    visibleCount = PAGE_SIZE;
    applyFilters();
}

// ---- SIDEBAR TOGGLE (mobile) ----
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ---- KEYBOARD ----
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePlayer(); });
