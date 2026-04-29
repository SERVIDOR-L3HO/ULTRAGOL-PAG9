(function () {
    const API = '/api/mx/partidos';
    const BRAND_PREFIX = window.location.pathname.startsWith('/rojadirecta') ? '/rojadirecta' : '/mx';
    let allMatches = [];
    let filterSport = 'all';
    let filterState = 'all';
    let filterLeague = 'all';
    let searchTerm = '';

    // ---------- Helpers ----------
    function slugify(text) {
        return (text || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '').trim()
            .replace(/\s+/g, '-');
    }

    function statusInfo(estado) {
        if (!estado) return { cls: 'upcoming', label: 'Próximo' };
        if (estado.enVivo) return { cls: 'live', label: estado.reloj || 'EN VIVO' };
        const d = (estado.descripcion || estado.tipo || '').toLowerCase();
        if (estado.finalizado || d.includes('full') || d.includes('final') || d.includes('terminado')) {
            return { cls: 'finished', label: 'Final' };
        }
        return { cls: 'upcoming', label: 'Próximo' };
    }

    const LOGO_MAP = {
        'america': 'america', 'club america': 'america', 'club américa': 'america',
        'chivas': 'chivas', 'guadalajara': 'chivas', 'cd guadalajara': 'chivas',
        'cruz azul': 'cruz-azul',
        'toluca': 'toluca', 'deportivo toluca': 'toluca',
        'pachuca': 'pachuca', 'cf pachuca': 'pachuca',
        'pumas': 'pumas', 'pumas unam': 'pumas',
        'atlas': 'atlas',
        'tigres': 'tigres', 'tigres uanl': 'tigres',
        'necaxa': 'necaxa',
        'juarez': 'fc-juarez', 'fc juarez': 'fc-juarez', 'fc juárez': 'fc-juarez',
        'leon': 'leon', 'club leon': 'leon', 'club león': 'leon',
        'tijuana': 'tijuana', 'xolos': 'tijuana', 'club tijuana': 'tijuana',
        'monterrey': 'monterrey', 'cf monterrey': 'monterrey', 'rayados': 'monterrey',
        'san luis': 'atletico-san-luis', 'atletico san luis': 'atletico-san-luis',
        'atlético de san luis': 'atletico-san-luis',
        'puebla': 'puebla', 'club puebla': 'puebla',
        'queretaro': 'queretaro', 'querétaro': 'queretaro',
        'mazatlan': 'mazatlan', 'mazatlán': 'mazatlan',
        'santos': 'santos', 'santos laguna': 'santos',
    };

    function localLogo(nombre) {
        const key = (nombre || '').toLowerCase().normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
        const file = LOGO_MAP[key];
        return file ? `/assets/logos/${file}.png` : null;
    }

    function teamLogoHTML(nombre, apiUrl) {
        const local = localLogo(nombre);
        const safe = (nombre || '').replace(/"/g, '&quot;');
        if (local) {
            return `<img class="team-logo" src="${local}" alt="${safe}" loading="lazy"
                onerror="this.onerror=null;this.src='${apiUrl || ''}';if(!this.src||this.src==window.location.href){this.style.display='none';this.nextElementSibling.style.display='flex';}">
                <div class="team-logo-placeholder" style="display:none">⚽</div>`;
        }
        if (apiUrl) {
            return `<img class="team-logo" src="${apiUrl}" alt="${safe}" loading="lazy"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div class="team-logo-placeholder" style="display:none">⚽</div>`;
        }
        return `<div class="team-logo-placeholder">⚽</div>`;
    }

    function detectSport(deporte) {
        const d = (deporte || '').toLowerCase();
        if (d.includes('fútbol') || d.includes('futbol') || d.includes('football') || d.includes('soccer') || d === '') return 'futbol';
        if (d.includes('balonc') || d.includes('basket') || d.includes('nba')) return 'basket';
        return 'otros';
    }

    function fmtTime(hora) {
        if (!hora) return '';
        return hora;
    }

    // ---------- Render: Match Card ----------
    function renderCard(m) {
        const { slug, equipo1, equipo2, logo1, logo2, estado, liga, hora,
                marcadorLocal, marcadorVisitante, nombreCortoLocal, nombreCortoVisitante,
                transmisionUrl } = m;

        const st = statusInfo(estado);
        const isLive = st.cls === 'live';
        const isFinished = st.cls === 'finished';
        const showScore = isLive || isFinished;
        const sL = (marcadorLocal !== null && marcadorLocal !== undefined && marcadorLocal !== '') ? marcadorLocal : '-';
        const sV = (marcadorVisitante !== null && marcadorVisitante !== undefined && marcadorVisitante !== '') ? marcadorVisitante : '-';

        const hasStream = !!transmisionUrl;
        const watchAttrs = hasStream
            ? `data-watch="1" data-url="${encodeURIComponent(transmisionUrl)}" data-title="${equipo1} vs ${equipo2}" data-sub="${(liga || '').replace(/"/g,'&quot;')} · ${fmtTime(hora)}" data-slug="${slug}"`
            : '';

        return `
        <article class="match-card${isLive ? ' live' : ''}" data-sport="${detectSport(m.deporte)}" data-state="${st.cls}" data-league="${(liga || 'Otros').replace(/"/g,'&quot;')}" data-search="${(equipo1 + ' ' + equipo2 + ' ' + (liga || '')).toLowerCase()}">
            <div class="card-top">
                <span class="liga">${liga || 'Sin liga'}</span>
                <span class="card-status ${st.cls}">${st.label}</span>
            </div>
            <div class="card-teams">
                <div class="team-block">
                    ${teamLogoHTML(equipo1, logo1)}
                    <div>
                        <div class="team-name">${equipo1}</div>
                        <div class="team-abbr">${nombreCortoLocal || ''}</div>
                    </div>
                </div>
                <div class="score-block">
                    ${showScore
                        ? `<div class="score-num">${sL}<span class="sep">·</span>${sV}</div>`
                        : `<div class="score-num dim">${fmtTime(hora) || 'VS'}</div>`
                    }
                </div>
                <div class="team-block away">
                    ${teamLogoHTML(equipo2, logo2)}
                    <div>
                        <div class="team-name">${equipo2}</div>
                        <div class="team-abbr">${nombreCortoVisitante || ''}</div>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn-watch${hasStream ? '' : ' disabled'}" ${watchAttrs} ${hasStream ? '' : 'disabled'}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    ${hasStream ? 'VER' : 'Sin señal'}
                </button>
                <a class="btn-detail" href="${BRAND_PREFIX}/${slug}" title="Detalle del partido" aria-label="Detalle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </a>
            </div>
        </article>`;
    }

    // ---------- Render: Groups ----------
    function renderGrid(matches) {
        const live = matches.filter(m => statusInfo(m.estado).cls === 'live');
        const upcoming = matches.filter(m => statusInfo(m.estado).cls === 'upcoming');
        const finished = matches.filter(m => statusInfo(m.estado).cls === 'finished');

        let html = '';
        if (live.length) {
            html += `<div class="group-block">
                <div class="group-title live">🔴 En Vivo Ahora <span class="badge">${live.length}</span></div>
                <div class="matches-grid">${live.map(renderCard).join('')}</div>
            </div>`;
        }
        if (upcoming.length) {
            html += `<div class="group-block">
                <div class="group-title upcoming">🕐 Próximos <span class="badge">${upcoming.length}</span></div>
                <div class="matches-grid">${upcoming.map(renderCard).join('')}</div>
            </div>`;
        }
        if (finished.length) {
            html += `<div class="group-block">
                <div class="group-title finished">✅ Terminados <span class="badge">${finished.length}</span></div>
                <div class="matches-grid">${finished.map(renderCard).join('')}</div>
            </div>`;
        }
        if (!html) {
            html = `<div class="empty">
                <div class="empty-icon">📅</div>
                <h3>Sin partidos para mostrar</h3>
                <p>Prueba cambiando los filtros o vuelve más tarde.</p>
            </div>`;
        }
        return html;
    }

    // ---------- Filtering ----------
    function passesFilters(m) {
        if (filterSport !== 'all' && detectSport(m.deporte) !== filterSport) return false;
        if (filterState !== 'all' && statusInfo(m.estado).cls !== filterState) return false;
        if (filterLeague !== 'all' && (m.liga || 'Otros') !== filterLeague) return false;
        if (searchTerm) {
            const hay = (m.equipo1 + ' ' + m.equipo2 + ' ' + (m.liga || '')).toLowerCase();
            if (!hay.includes(searchTerm)) return false;
        }
        return true;
    }

    function applyFilters() {
        const filtered = allMatches.filter(passesFilters);
        document.getElementById('matches-container').innerHTML = renderGrid(filtered);
        attachWatchHandlers();
    }

    // ---------- Sidebar Counts + League list ----------
    function updateSidebar() {
        const counts = { all: 0, futbol: 0, basket: 0, otros: 0 };
        const leagues = new Map();
        allMatches.forEach(m => {
            counts.all++;
            counts[detectSport(m.deporte)]++;
            const lg = m.liga || 'Otros';
            leagues.set(lg, (leagues.get(lg) || 0) + 1);
        });
        document.getElementById('count-all').textContent = counts.all;
        document.getElementById('count-futbol').textContent = counts.futbol;
        document.getElementById('count-basket').textContent = counts.basket;
        document.getElementById('count-otros').textContent = counts.otros;

        const ul = document.getElementById('league-list');
        const sorted = [...leagues.entries()].sort((a, b) => b[1] - a[1]);
        let html = `<li data-league="all" class="${filterLeague === 'all' ? 'active' : ''}">
            <span>🏆</span>Todas las ligas<span class="count">${counts.all}</span>
        </li>`;
        sorted.forEach(([lg, n]) => {
            html += `<li data-league="${lg.replace(/"/g, '&quot;')}" class="${filterLeague === lg ? 'active' : ''}">
                <span>•</span>${lg}<span class="count">${n}</span>
            </li>`;
        });
        if (!sorted.length) {
            html += `<li class="muted">Sin ligas detectadas</li>`;
        }
        ul.innerHTML = html;

        ul.querySelectorAll('li[data-league]').forEach(li => {
            li.addEventListener('click', () => {
                ul.querySelectorAll('li').forEach(x => x.classList.remove('active'));
                li.classList.add('active');
                filterLeague = li.dataset.league;
                applyFilters();
                closeSidebarMobile();
            });
        });
    }

    // ---------- Live ticker ----------
    function updateTicker() {
        const live = allMatches.filter(m => statusInfo(m.estado).cls === 'live');
        const strip = document.getElementById('live-strip');
        if (!live.length) {
            strip.innerHTML = '';
            strip.style.display = 'none';
            return;
        }
        strip.style.display = '';
        const items = live.map(m => {
            const sL = (m.marcadorLocal ?? '-');
            const sV = (m.marcadorVisitante ?? '-');
            return `<span class="ticker-item">
                <b>${m.equipo1}</b> <span class="sc">${sL} - ${sV}</span> <b>${m.equipo2}</b>
                <span class="lg">${m.liga || ''}</span>
            </span>`;
        }).join('');
        strip.innerHTML = `<div class="ticker-track">${items}${items}</div>`;
    }

    // ---------- Modal Player ----------
    const modal = document.getElementById('player-modal');
    const playerFrame = document.getElementById('player-frame');
    const serverButtons = document.getElementById('server-buttons');
    let currentServers = [];

    function openModal(url, title, sub, slug) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-sub').textContent = sub;
        const brandPrefix = window.location.pathname.startsWith('/rojadirecta') ? '/rojadirecta' : '/mx';
        document.getElementById('modal-detail').href = `${brandPrefix}/${slug}`;

        // Build server list — primary stream + alternate proxies (best-effort)
        currentServers = [{ name: 'Servidor 1', url }];
        // Allow comma-separated multi-stream URLs in transmisionUrl
        if (url.includes(',')) {
            currentServers = url.split(',').map((u, i) => ({ name: `Servidor ${i + 1}`, url: u.trim() })).filter(s => s.url);
        }

        renderServerButtons(0);
        loadServer(currentServers[0].url);

        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function loadServer(url) {
        if (!url) {
            playerFrame.innerHTML = `<div class="player-empty">Sin URL de transmisión</div>`;
            return;
        }
        playerFrame.innerHTML = `<iframe src="${url}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="no-referrer"></iframe>`;
    }

    function renderServerButtons(activeIdx) {
        serverButtons.innerHTML = currentServers.map((s, i) =>
            `<button class="server-btn ${i === activeIdx ? 'active' : ''}" data-idx="${i}">${s.name}</button>`
        ).join('');
        serverButtons.querySelectorAll('.server-btn').forEach(b => {
            b.addEventListener('click', () => {
                const idx = +b.dataset.idx;
                renderServerButtons(idx);
                loadServer(currentServers[idx].url);
            });
        });
    }

    function closeModal() {
        modal.hidden = true;
        playerFrame.innerHTML = `<div class="player-empty">Selecciona un servidor para iniciar la transmisión</div>`;
        document.body.style.overflow = '';
    }

    modal.addEventListener('click', e => {
        if (e.target.dataset.close !== undefined || e.target.classList.contains('modal-backdrop')) closeModal();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

    function attachWatchHandlers() {
        document.querySelectorAll('.btn-watch[data-watch="1"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = decodeURIComponent(btn.dataset.url || '');
                const title = btn.dataset.title || '';
                const sub = btn.dataset.sub || '';
                const slug = btn.dataset.slug || '';
                openModal(url, title, sub, slug);
            });
        });
    }

    // ---------- Sidebar interactions ----------
    document.querySelectorAll('#sport-list li').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelectorAll('#sport-list li').forEach(x => x.classList.remove('active'));
            li.classList.add('active');
            filterSport = li.dataset.sport;
            applyFilters();
            closeSidebarMobile();
        });
    });

    document.querySelectorAll('.state-list li').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelectorAll('.state-list li').forEach(x => x.classList.remove('active'));
            li.classList.add('active');
            filterState = li.dataset.state;
            applyFilters();
            closeSidebarMobile();
        });
    });

    // ---------- Search ----------
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', e => {
        searchTerm = e.target.value.trim().toLowerCase();
        applyFilters();
    });

    // ---------- Mobile sidebar toggle ----------
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    function closeSidebarMobile() {
        if (window.innerWidth <= 760) sidebar.classList.remove('open');
    }

    // ---------- Refresh ----------
    document.getElementById('refresh-btn').addEventListener('click', () => loadMatches(true));

    // ---------- Date label ----------
    (function setTodayLabel() {
        const d = new Date();
        const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const txt = d.toLocaleDateString('es-MX', opts);
        document.getElementById('today-label').textContent = `${txt.charAt(0).toUpperCase() + txt.slice(1)} · marcadores en tiempo real`;
    })();

    // ---------- Loader ----------
    async function loadMatches(showSpinner) {
        if (showSpinner) {
            document.getElementById('matches-container').innerHTML =
                `<div class="loading"><div class="spinner"></div><p>Actualizando…</p></div>`;
        }
        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            allMatches = data.partidos || [];
            updateSidebar();
            updateTicker();
            applyFilters();
        } catch (e) {
            document.getElementById('matches-container').innerHTML = `
                <div class="empty">
                    <div class="empty-icon">⚠️</div>
                    <h3>No pudimos cargar los partidos</h3>
                    <p>Revisa tu conexión e intenta nuevamente.</p>
                </div>`;
        }
    }

    loadMatches(true);
    setInterval(loadMatches, 30000);
})();
