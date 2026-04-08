(function () {
    const API = '/api/mx/partidos';
    let allMatches = [];
    let currentFilter = 'all';

    function slugify(text) {
        return (text || '')
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, '-');
    }

    function matchSlug(local, visitante) {
        return slugify(local) + '-vs-' + slugify(visitante);
    }

    function statusClass(estado) {
        if (!estado) return 'status-upcoming';
        const d = (estado.descripcion || estado.tipo || '').toLowerCase();
        if (estado.enVivo) return 'status-live';
        if (estado.finalizado || d.includes('full') || d.includes('final') || d.includes('terminado')) return 'status-finished';
        return 'status-upcoming';
    }

    function statusLabel(estado) {
        if (!estado) return 'Próximo';
        if (estado.enVivo) return estado.reloj || 'En Vivo';
        const d = (estado.descripcion || estado.tipo || '').toLowerCase();
        if (estado.finalizado || d.includes('full') || d.includes('final') || d.includes('terminado')) return 'Terminado';
        if (estado.programado) return 'Próximo';
        return estado.descripcion || 'Próximo';
    }

    function logoUrl(nombre) {
        const map = {
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
        const key = (nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
        const mapped = map[key];
        if (mapped) return `/assets/logos/${mapped}.png`;
        return null;
    }

    function renderTeamLogo(nombre, logoApiUrl) {
        const local = logoUrl(nombre);
        if (local) return `<img class="team-logo" src="${local}" alt="${nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="team-logo-placeholder" style="display:none">⚽</div>`;
        if (logoApiUrl) return `<img class="team-logo" src="${logoApiUrl}" alt="${nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="team-logo-placeholder" style="display:none">⚽</div>`;
        return `<div class="team-logo-placeholder">⚽</div>`;
    }

    function renderCard(match) {
        const { slug, equipo1, equipo2, logo1, logo2, estado, liga, deporte, hora, marcadorLocal, marcadorVisitante, nombreCortoLocal, nombreCortoVisitante } = match;
        const sc = statusClass(estado);
        const sl = statusLabel(estado);
        const isLive = estado && estado.enVivo;
        const scoreL = (marcadorLocal !== null && marcadorLocal !== undefined && marcadorLocal !== '') ? marcadorLocal : '-';
        const scoreV = (marcadorVisitante !== null && marcadorVisitante !== undefined && marcadorVisitante !== '') ? marcadorVisitante : '-';

        return `
        <a href="/mx/${slug}" class="match-card${isLive ? ' live' : ''}" data-deporte="${deporte || 'Fútbol'}">
            <div class="team">
                ${renderTeamLogo(equipo1, logo1)}
                <div>
                    <div class="team-name">${equipo1}</div>
                    <div class="team-abbr">${nombreCortoLocal || ''}</div>
                </div>
            </div>
            <div class="match-center">
                <div class="score">
                    ${scoreL}<span class="score-sep">:</span>${scoreV}
                </div>
                <div class="status-badge ${sc}">${sl}</div>
                <div class="match-liga">${liga || ''}</div>
            </div>
            <div class="team away">
                ${renderTeamLogo(equipo2, logo2)}
                <div>
                    <div class="team-name">${equipo2}</div>
                    <div class="team-abbr">${nombreCortoVisitante || ''}</div>
                </div>
            </div>
            <div class="match-arrow">→</div>
        </a>`;
    }

    function groupAndRender(matches) {
        const live = matches.filter(m => m.estado && m.estado.enVivo);
        const upcoming = matches.filter(m => m.estado && m.estado.programado && !m.estado.enVivo && !m.estado.finalizado);
        const finished = matches.filter(m => m.estado && m.estado.finalizado);

        let html = '';

        if (live.length) {
            html += `<div class="section-title">🔴 En Vivo (${live.length})</div><div class="matches-grid">${live.map(renderCard).join('')}</div><br>`;
        }
        if (upcoming.length) {
            html += `<div class="section-title">🕐 Próximos (${upcoming.length})</div><div class="matches-grid">${upcoming.map(renderCard).join('')}</div><br>`;
        }
        if (finished.length) {
            html += `<div class="section-title">✅ Terminados (${finished.length})</div><div class="matches-grid">${finished.map(renderCard).join('')}</div>`;
        }
        if (!html) {
            html = `<div class="empty"><div class="empty-icon">📅</div><h3>Sin partidos disponibles</h3><p>No hay partidos en esta categoría hoy.</p></div>`;
        }
        return html;
    }

    function applyFilter() {
        const filtered = allMatches.filter(matchesFilter);
        document.getElementById('matches-container').innerHTML = groupAndRender(filtered);
    }

    async function loadMatches() {
        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error('Error al cargar partidos');
            const data = await res.json();
            allMatches = data.partidos || [];
            applyFilter();
        } catch (e) {
            document.getElementById('matches-container').innerHTML = `
                <div class="empty">
                    <div class="empty-icon">⚠️</div>
                    <h3>Sin datos disponibles</h3>
                    <p>No se pudieron cargar los partidos. Intenta recargar la página.</p>
                </div>`;
        }
    }

    function matchesFilter(match) {
        if (currentFilter === 'all') return true;
        const d = (match.deporte || '').toLowerCase();
        if (currentFilter === 'futbol') return d.includes('fútbol') || d.includes('futbol') || d.includes('football') || d.includes('soccer');
        if (currentFilter === 'basket') return d.includes('balonc') || d.includes('basketball') || d.includes('nba');
        if (currentFilter === 'otros') return !d.includes('fútbol') && !d.includes('futbol') && !d.includes('football') && !d.includes('balonc') && !d.includes('basketball');
        return true;
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            applyFilter();
        });
    });

    loadMatches();
    setInterval(loadMatches, 30000);
})();
