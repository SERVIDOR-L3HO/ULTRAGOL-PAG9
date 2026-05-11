// ═══════════════════════════════════════════════════════════
//  STANDINGS PRO — UltraGol Premium Standings System
// ═══════════════════════════════════════════════════════════

const LOGO_MAP = {
  'america':          '/assets/logos/america.png',
  'club america':     '/assets/logos/america.png',
  'cf america':       '/assets/logos/america.png',
  'atlas':            '/assets/logos/atlas.png',
  'atletico de san luis': '/assets/logos/atletico-san-luis.png',
  'atletico san luis':    '/assets/logos/atletico-san-luis.png',
  'chivas':           '/assets/logos/chivas.png',
  'guadalajara':      '/assets/logos/chivas.png',
  'cd guadalajara':   '/assets/logos/chivas.png',
  'cruz azul':        '/assets/logos/cruz-azul.png',
  'fc juarez':        '/assets/logos/fc-juarez.png',
  'juarez':           '/assets/logos/fc-juarez.png',
  'leon':             '/assets/logos/leon.png',
  'mazatlan':         '/assets/logos/mazatlan.png',
  'mazatlan fc':      '/assets/logos/mazatlan.png',
  'monterrey':        '/assets/logos/monterrey.png',
  'rayados':          '/assets/logos/monterrey.png',
  'necaxa':           '/assets/logos/necaxa.png',
  'pachuca':          '/assets/logos/pachuca.png',
  'puebla':           '/assets/logos/puebla.png',
  'pumas':            '/assets/logos/pumas.png',
  'pumas unam':       '/assets/logos/pumas.png',
  'queretaro':        '/assets/logos/queretaro.png',
  'queretaro fc':     '/assets/logos/queretaro.png',
  'santos':           '/assets/logos/santos.png',
  'santos laguna':    '/assets/logos/santos.png',
  'tigres':           '/assets/logos/tigres.png',
  'tigres uanl':      '/assets/logos/tigres.png',
  'tijuana':          '/assets/logos/tijuana.png',
  'xolos':            '/assets/logos/tijuana.png',
  'toluca':           '/assets/logos/toluca.png',
};

function getTeamLogo(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  return LOGO_MAP[key] || null;
}

// ── Zone helpers ─────────────────────────────────────────────
function getZone(pos) {
  if (pos === 1)   return 'leader';
  if (pos <= 6)    return 'liguilla';
  if (pos <= 10)   return 'playin';
  return 'elim';
}

function getMedal(pos) {
  if (pos === 1) return '🥇';
  if (pos === 2) return '🥈';
  if (pos === 3) return '🥉';
  return null;
}

// ── State ────────────────────────────────────────────────────
let standingsData = [];
let activeLeague = 'ligamx';

const LEAGUES = [
  { id: 'ligamx',      label: 'Liga MX',    emoji: '🇲🇽', liguilla: 6, playin: 10 },
  { id: 'premier',     label: 'Premier',    emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', liguilla: 4, playin: 6 },
  { id: 'laliga',      label: 'La Liga',    emoji: '🇪🇸', liguilla: 4, playin: 6 },
  { id: 'seriea',      label: 'Serie A',    emoji: '🇮🇹', liguilla: 4, playin: 6 },
  { id: 'bundesliga',  label: 'Bundesliga', emoji: '🇩🇪', liguilla: 4, playin: 6 },
  { id: 'ligue1',      label: 'Ligue 1',    emoji: '🇫🇷', liguilla: 4, playin: 6 },
];

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderTabs();
  loadLeague('ligamx');
  updateClock();
  setInterval(updateClock, 30000);
});

function updateClock() {
  const el = document.getElementById('st-clock');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

// ── Tabs ─────────────────────────────────────────────────────
function renderTabs() {
  const wrap = document.getElementById('st-tabs');
  if (!wrap) return;
  wrap.innerHTML = LEAGUES.map(l => `
    <button class="st-tab${l.id === activeLeague ? ' active' : ''}" data-league="${l.id}">
      <span>${l.emoji}</span> ${l.label}
    </button>
  `).join('');

  wrap.querySelectorAll('.st-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.league;
      if (id === activeLeague) return;
      activeLeague = id;
      wrap.querySelectorAll('.st-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadLeague(id);
    });
  });
}

// ── Data loading ─────────────────────────────────────────────
async function loadLeague(leagueId) {
  showLoading();

  try {
    if (leagueId === 'ligamx') {
      // Try live API first
      try {
        const res = await fetch('/api/ultragol/tabla');
        if (!res.ok) throw new Error('api error');
        const json = await res.json();
        standingsData = (json.tabla || []).map((t, i) => ({
          position: t.posicion || i + 1,
          name:     t.equipo,
          logo:     t.logo || null,
          played:   t.estadisticas?.pj   || 0,
          wins:     t.estadisticas?.pg   || 0,
          draws:    t.estadisticas?.pe   || 0,
          losses:   t.estadisticas?.pp   || 0,
          goalsFor: t.estadisticas?.gf   || 0,
          goalsAgainst: t.estadisticas?.gc || 0,
          points:   t.estadisticas?.pts  || 0,
          form:     [],
        }));
      } catch (_) {
        // Fallback to local JSON
        const res2 = await fetch('/data/standings.json');
        standingsData = await res2.json();
      }
    } else {
      // Try external API via our proxy
      const endpointMap = {
        premier:    '/api/ultragol/premier/tabla',
        laliga:     '/api/ultragol/laliga/tabla',
        seriea:     '/api/ultragol/seriea/tabla',
        bundesliga: '/api/ultragol/bundesliga/tabla',
        ligue1:     '/api/ultragol/ligue1/tabla',
      };
      const endpoint = endpointMap[leagueId];
      try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('no data');
        const json = await res.json();
        const raw = json.tabla || json.standings || [];
        standingsData = raw.map((t, i) => ({
          position: t.posicion || t.rank || i + 1,
          name:     t.equipo  || t.team || t.name || 'Equipo',
          logo:     t.logo    || t.badge || null,
          played:   t.estadisticas?.pj  || t.played || 0,
          wins:     t.estadisticas?.pg  || t.wins   || 0,
          draws:    t.estadisticas?.pe  || t.draws  || 0,
          losses:   t.estadisticas?.pp  || t.losses || 0,
          goalsFor: t.estadisticas?.gf  || t.goalsFor || 0,
          goalsAgainst: t.estadisticas?.gc || t.goalsAgainst || 0,
          points:   t.estadisticas?.pts || t.points || 0,
          form:     [],
        }));
      } catch (_) {
        showEmptyState(leagueId);
        return;
      }
    }

    standingsData.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      return b.goalsFor - a.goalsFor;
    });

    renderStandings(leagueId);
  } catch (err) {
    console.error('[Standings]', err);
    showEmptyState(leagueId);
  }
}

// ── Render ────────────────────────────────────────────────────
function renderStandings(leagueId) {
  const league = LEAGUES.find(l => l.id === leagueId) || LEAGUES[0];
  const wrap = document.getElementById('st-main');
  if (!wrap) return;

  if (!standingsData.length) { showEmptyState(leagueId); return; }

  const top3 = standingsData.slice(0, 3);
  const rest  = standingsData.slice(3);

  // Stats summary
  const totalGoals = standingsData.reduce((s, t) => s + (t.goalsFor || 0), 0);
  const leader     = standingsData[0];
  const maxPts     = leader?.points || 0;

  wrap.innerHTML = `
    <!-- Podium top 3 -->
    <div class="st-podium" id="st-podium"></div>

    <!-- Table -->
    <div class="st-table-card">
      ${renderTableHeader()}
      <div id="st-rows"></div>
    </div>

    <!-- Legend -->
    <div class="st-legend">
      <div class="st-legend-item">
        <div class="st-legend-dot" style="background:var(--st-gold)"></div>
        <span>Líder</span>
      </div>
      <div class="st-legend-item">
        <div class="st-legend-dot" style="background:var(--st-liguilla)"></div>
        <span>${leagueId === 'ligamx' ? 'Liguilla directa (1–6)' : 'Champions (1–4)'}</span>
      </div>
      <div class="st-legend-item">
        <div class="st-legend-dot" style="background:var(--st-playin)"></div>
        <span>${leagueId === 'ligamx' ? 'Play-In (7–10)' : 'Europa (5–6)'}</span>
      </div>
      <div class="st-legend-item">
        <div class="st-legend-dot" style="background:rgba(255,255,255,0.18)"></div>
        <span>Eliminados</span>
      </div>
    </div>

    <!-- Stats summary bar -->
    <div class="st-stats-bar">
      <div class="st-stat-box">
        <div class="st-stat-box-val">${standingsData.length}</div>
        <div class="st-stat-box-lbl">Equipos</div>
      </div>
      <div class="st-stat-box">
        <div class="st-stat-box-val">${leader?.played || 0}</div>
        <div class="st-stat-box-lbl">Jornadas</div>
      </div>
      <div class="st-stat-box">
        <div class="st-stat-box-val">${totalGoals}</div>
        <div class="st-stat-box-lbl">Goles totales</div>
      </div>
      <div class="st-stat-box">
        <div class="st-stat-box-val">${maxPts}</div>
        <div class="st-stat-box-lbl">Máx. puntos</div>
      </div>
    </div>
  `;

  // Render podium
  renderPodium(top3, league);

  // Render rows
  const rowsWrap = document.getElementById('st-rows');
  if (!rowsWrap) return;

  let prevZone = null;
  standingsData.forEach((team, i) => {
    const pos  = i + 1;
    const zone = getZoneByLeague(pos, league);

    // Zone separator
    if (zone !== prevZone && pos > 1) {
      if (zone === 'playin') {
        rowsWrap.insertAdjacentHTML('beforeend', zoneSep('playin', leagueId === 'ligamx' ? 'Play-In' : 'Europa League'));
      } else if (zone === 'elim') {
        rowsWrap.insertAdjacentHTML('beforeend', zoneSep('elim-sep', 'Eliminados'));
      }
    }
    prevZone = zone;

    rowsWrap.insertAdjacentHTML('beforeend', renderRow(team, pos, zone, i));
  });
}

function getZoneByLeague(pos, league) {
  if (pos === 1)              return 'leader';
  if (pos <= league.liguilla) return 'liguilla';
  if (pos <= league.playin)   return 'playin';
  return 'elim';
}

function renderTableHeader() {
  return `
    <div class="st-table-header">
      <div class="col-num">#</div>
      <div class="col-team">Equipo</div>
      <div class="col-num">PJ</div>
      <div class="col-num st-col-g">G</div>
      <div class="col-num st-col-e col-e">E</div>
      <div class="col-num">P</div>
      <div class="col-num st-col-dif col-dif">DIF</div>
      <div class="col-num">PTS</div>
    </div>
  `;
}

function renderRow(team, pos, zone, idx) {
  const logo    = team.logo || getTeamLogo(team.name);
  const logoEl  = logo
    ? `<img class="st-team-logo" src="${logo}" alt="${team.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const phEl = `<div class="st-team-logo-ph" style="${logo ? 'display:none' : ''}">${team.name.substring(0, 2).toUpperCase()}</div>`;

  const gd     = (team.goalsFor || 0) - (team.goalsAgainst || 0);
  const gdStr  = gd > 0 ? `+${gd}` : `${gd}`;
  const gdColor = gd > 0 ? 'var(--st-green)' : gd < 0 ? 'var(--st-red)' : 'var(--st-muted)';

  const form = (team.form || []).slice(0, 5);
  const formHtml = form.length
    ? `<div class="st-team-form">${form.map(r => `<div class="st-form-dot ${r}"></div>`).join('')}</div>`
    : '';

  return `
    <div class="st-row zone-${zone}" style="animation-delay:${idx * 0.04}s">
      <div class="st-pos">
        <div class="st-pos-badge">${pos}</div>
      </div>
      <div class="st-team">
        ${logoEl}${phEl}
        <div class="st-team-info">
          <div class="st-team-name">${team.name}</div>
          ${formHtml}
        </div>
      </div>
      <div class="st-num">${team.played || 0}</div>
      <div class="st-num st-col-g">${team.wins || 0}</div>
      <div class="st-num st-col-e col-e">${team.draws || 0}</div>
      <div class="st-num">${team.losses || 0}</div>
      <div class="st-num st-col-dif col-dif" style="color:${gdColor};font-weight:700">${gdStr}</div>
      <div class="st-pts">${team.points || 0}</div>
    </div>
  `;
}

function renderPodium(top3, league) {
  const wrap = document.getElementById('st-podium');
  if (!wrap) return;

  // Reorder: 2nd | 1st | 3rd (classic podium)
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);

  wrap.innerHTML = order.map((team, i) => {
    const realPos = i === 1 ? 1 : i === 0 ? 2 : 3;
    const logo    = team.logo || getTeamLogo(team.name);
    const logoEl  = logo
      ? `<img class="st-podium-logo" src="${logo}" alt="${team.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const phEl    = `<div class="st-podium-logo-placeholder" style="${logo ? 'display:none' : ''}">${team.name.substring(0, 2).toUpperCase()}</div>`;

    return `
      <div class="st-podium-card rank-${realPos}">
        <span class="st-podium-medal">${getMedal(realPos)}</span>
        ${logoEl}${phEl}
        <div class="st-podium-name">${team.name}</div>
        <div class="st-podium-pts">${team.points}</div>
        <div class="st-podium-pts-label">pts</div>
      </div>
    `;
  }).join('');
}

function zoneSep(type, label) {
  if (type === 'elim-sep') {
    return `
      <div class="st-zone-sep" style="border-bottom:1px solid var(--st-border)">
        <div class="st-zone-sep-line" style="background:rgba(255,255,255,0.1)"></div>
        <span class="st-zone-sep-text" style="color:var(--st-muted);background:rgba(255,255,255,0.06)">${label}</span>
        <div class="st-zone-sep-line" style="background:rgba(255,255,255,0.1)"></div>
      </div>`;
  }
  return `
    <div class="st-zone-sep sep-${type}">
      <div class="st-zone-sep-line"></div>
      <span class="st-zone-sep-text">${label}</span>
      <div class="st-zone-sep-line"></div>
    </div>`;
}

// ── Loading / empty ───────────────────────────────────────────
function showLoading() {
  const wrap = document.getElementById('st-main');
  if (!wrap) return;
  wrap.innerHTML = `
    <div class="st-loading">
      <div class="st-spinner"></div>
      <span>Cargando posiciones…</span>
    </div>`;
}

function showEmptyState(leagueId) {
  const wrap = document.getElementById('st-main');
  if (!wrap) return;
  const l = LEAGUES.find(x => x.id === leagueId);
  wrap.innerHTML = `
    <div class="st-loading">
      <span style="font-size:2.5rem">${l?.emoji || '⚽'}</span>
      <span style="color:var(--st-text);font-weight:700">Datos no disponibles</span>
      <span style="font-size:0.82rem">Los datos de ${l?.label || 'esta liga'} no están disponibles en este momento.</span>
      <button onclick="loadLeague('${leagueId}')" style="margin-top:0.5rem;padding:0.5rem 1.25rem;background:var(--st-accent);color:#fff;border:none;border-radius:100px;font-weight:700;cursor:pointer;font-size:0.82rem">
        Reintentar
      </button>
    </div>`;
}

console.log('🏆 Standings Pro loaded');
