let currentLeague = 'Liga MX';
const API_BASE = 'https://ultrago-xi.vercel.app';

const leaguesConfig = {
    'Liga MX':       { noticias: '/noticias' },
    'Premier League':{ noticias: '/premier/noticias' },
    'La Liga':       { noticias: '/laliga/noticias' },
    'Serie A':       { noticias: '/seriea/noticias' },
    'Bundesliga':    { noticias: '/bundesliga/noticias' },
    'Ligue 1':       { noticias: '/ligue1/noticias' }
};

function selectLeague(leagueName, el) {
    document.querySelectorAll('.nt-chip').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
    currentLeague = leagueName;
    loadNews();
    showToast(leagueName);
}

function relativeTime(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        const diff = (Date.now() - d) / 1000;
        if (diff < 60) return 'Ahora';
        if (diff < 3600) return `Hace ${Math.floor(diff/60)}min`;
        if (diff < 86400) return `Hace ${Math.floor(diff/3600)}h`;
        if (diff < 172800) return 'Ayer';
        return d.toLocaleDateString('es-MX', { day:'numeric', month:'short' });
    } catch(e) { return dateStr; }
}

function escJson(obj) {
    return JSON.stringify(obj).replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function fallbackImg(e) {
    e.target.style.background = '#1a1a1a';
    e.target.style.opacity = '0.3';
}

async function loadNews() {
    const grid = document.getElementById('newsGrid');
    const featured = document.getElementById('featuredNews');
    if (grid) grid.innerHTML = '<div class="nt-loading"><i class="fas fa-circle-notch fa-spin"></i><span>Cargando noticias...</span></div>';
    if (featured) featured.innerHTML = '';

    try {
        const endpoint = (leaguesConfig[currentLeague] || leaguesConfig['Liga MX']).noticias;
        const resp = await fetch(`${API_BASE}${endpoint}`);
        const data = await resp.json();

        if (!data.noticias || data.noticias.length === 0) {
            if (grid) grid.innerHTML = '<div class="nt-loading"><i class="fas fa-newspaper"></i><span>No hay noticias disponibles</span></div>';
            return;
        }

        const [hero, big, ...rest] = data.noticias;
        const defaultImg = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800';

        // ── HERO ──
        if (featured && hero) {
            const hImg = hero.imagen || defaultImg;
            const hTime = relativeTime(hero.fecha);
            featured.innerHTML = `
                <div class="nt-hero" onclick='openNewsModal(${escJson({
                    titulo: hero.titulo, descripcion: hero.descripcion||'',
                    resumen: hero.resumen||'', contenido: hero.contenido||hero.descripcion||'',
                    imagen: hImg, fecha: hero.fecha||'', hora: hero.hora||'',
                    fuente: hero.fuente||'', url: hero.url||''
                })})'>
                    <img class="nt-hero-img" src="${hImg}" alt="${hero.titulo}" onerror="this.style.opacity='0.1'">
                    <div class="nt-hero-overlay"></div>
                    <div class="nt-hero-top">
                        <span class="nt-hero-badge"><i class="fas fa-fire"></i> DESTACADO</span>
                    </div>
                    <div class="nt-hero-content">
                        ${hero.fuente ? `<span class="nt-hero-source">${hero.fuente}</span>` : ''}
                        <h2 class="nt-hero-title">${hero.titulo}</h2>
                        <div class="nt-hero-meta">
                            ${hTime ? `<span class="nt-hero-time"><i class="far fa-clock"></i> ${hTime}</span>` : ''}
                            <span class="nt-hero-read"><i class="fas fa-arrow-right"></i> Leer</span>
                        </div>
                    </div>
                </div>`;
        }

        // ── SECTION LABEL + BIG CARD + LIST ──
        if (!grid) return;

        let html = '<div class="nt-section-label"><span class="nt-section-label-text">Más noticias</span><div class="nt-section-label-line"></div></div>';

        // Second article — big horizontal card
        if (big) {
            const bImg = big.imagen || defaultImg;
            html += `
                <div class="nt-card-big" onclick='openNewsModal(${escJson({
                    titulo: big.titulo, descripcion: big.descripcion||'',
                    resumen: big.resumen||'', contenido: big.contenido||big.descripcion||'',
                    imagen: bImg, fecha: big.fecha||'', hora: big.hora||'',
                    fuente: big.fuente||'', url: big.url||''
                })})'>
                    <img class="nt-card-big-img" src="${bImg}" alt="${big.titulo}" onerror="fallbackImg(event)">
                    <div class="nt-card-big-body">
                        ${big.fuente ? `<span class="nt-card-big-source">${big.fuente}</span>` : ''}
                        <h3 class="nt-card-big-title">${big.titulo}</h3>
                        <span class="nt-card-big-time"><i class="far fa-clock"></i> ${relativeTime(big.fecha)}</span>
                    </div>
                </div>
                <div class="nt-divider"></div>`;
        }

        // Rest — compact cards
        rest.forEach(n => {
            const nImg = n.imagen || defaultImg;
            html += `
                <div class="nt-card" onclick='openNewsModal(${escJson({
                    titulo: n.titulo, descripcion: n.descripcion||'',
                    resumen: n.resumen||'', contenido: n.contenido||n.descripcion||'',
                    imagen: nImg, fecha: n.fecha||'', hora: n.hora||'',
                    fuente: n.fuente||'', url: n.url||''
                })})'>
                    <div class="nt-card-body">
                        ${n.fuente ? `<span class="nt-card-source">${n.fuente}</span>` : ''}
                        <h4 class="nt-card-title">${n.titulo}</h4>
                        <span class="nt-card-time"><i class="far fa-clock"></i> ${relativeTime(n.fecha)}</span>
                    </div>
                    <img class="nt-card-img" src="${nImg}" alt="${n.titulo}" loading="lazy" onerror="fallbackImg(event)">
                </div>`;
        });

        grid.innerHTML = html;

    } catch(err) {
        console.error('Error loading news:', err);
        if (grid) grid.innerHTML = '<div class="nt-loading"><i class="fas fa-exclamation-triangle"></i><span>Error al cargar. Intenta de nuevo.</span></div>';
    }
}

function openNewsModal(noticia) {
    const modal   = document.getElementById('newsModal');
    const title   = document.getElementById('newsModalTitle');
    const image   = document.getElementById('newsModalImage');
    const text    = document.getElementById('newsModalText');
    const source  = document.getElementById('newsModalSource');
    const date    = document.getElementById('newsModalDate');
    const link    = document.getElementById('newsOriginalLink');

    if (title) title.textContent = noticia.titulo;
    if (image) { image.src = noticia.imagen; image.alt = noticia.titulo; }
    if (source) source.textContent = noticia.fuente || '';
    if (date) date.textContent = noticia.fecha ? `${noticia.fecha} ${noticia.hora || ''}`.trim() : '';
    if (link) {
        if (noticia.url) { link.href = noticia.url; link.style.display = 'inline-flex'; }
        else link.style.display = 'none';
    }
    if (text) text.innerHTML = formatArticleContent(noticia.contenido || noticia.descripcion || '');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;
}

function formatArticleContent(content) {
    if (!content) return '';
    return content
        .split('\n\n')
        .filter(p => p.trim())
        .map(p => {
            if (p.includes('pic.twitter.com') || p.includes('????')) {
                return `<div class="article-tweet">${p}</div>`;
            }
            return `<p>${p}</p>`;
        })
        .join('');
}

function closeNewsModal() {
    document.getElementById('newsModal')?.classList.remove('active');
    document.body.style.overflow = '';
}

function showToast(msg) {
    const t = document.getElementById('ntToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

function shareApp() {
    const data = { title: 'ULTRAGOL — Noticias', url: location.href };
    if (navigator.share) navigator.share(data).catch(() => {});
    else navigator.clipboard?.writeText(location.href).then(() => showToast('Enlace copiado'));
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNewsModal(); });
document.getElementById('newsModal')?.addEventListener('click', e => { if (e.target.id === 'newsModal') closeNewsModal(); });

document.addEventListener('DOMContentLoaded', loadNews);
