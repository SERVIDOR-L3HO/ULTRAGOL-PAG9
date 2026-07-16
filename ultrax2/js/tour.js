/* ── ULTRAGOL TOUR GUIDE — ultrax ───────────────────────────────────────── */
(function () {
    'use strict';

    const STORAGE_KEY = 'ultragol_ultrax_tour_v1';

    // ── PASOS ─────────────────────────────────────────────────────────────────
    const STEPS = [
        {
            target: '.app-header',
            title: 'Barra superior',
            body: 'Aquí ves el reloj en tiempo real, cuántos usuarios están conectados ahora mismo, el modo TV para pantallas grandes, ajustes y tu cuenta de usuario.',
            position: 'below',
            pad: 4,
        },
        {
            target: '.league-bar',
            title: 'Selector de ligas',
            body: 'Filtra los partidos por liga: Liga MX, Premier League, La Liga, Serie A, Bundesliga y Ligue 1. Solo toca el logo para cambiar.',
            position: 'below',
            pad: 4,
        },
        {
            target: '.featured-match-container',
            title: 'Partido destacado',
            body: 'El carrusel muestra los partidos más importantes del momento con marcador en vivo, equipos y el botón para ver la transmisión al instante.',
            position: 'below',
            pad: 6,
        },
        {
            target: '.world-cup-banner',
            title: 'Copa Mundial 2026',
            body: 'Cuenta regresiva en tiempo real para el evento más grande del fútbol mundial. ¡Cada segundo cuenta!',
            position: 'above',
            pad: 6,
        },
        {
            target: '.important-matches-btn-container',
            title: 'Todos los partidos',
            body: 'Abre el panel completo con todos los partidos disponibles, sus canales de transmisión y filtros por estado (en vivo, próximos).',
            position: 'above',
            pad: 6,
        },
        {
            target: '.tabs-container',
            title: 'Pestañas de contenido',
            body: '"EN VIVO" muestra partidos activos ahora. "PRÓXIMOS PARTIDOS" los que vienen. "MEJORES MOMENTOS" los highlights y replays.',
            position: 'above',
            pad: 4,
        },
        {
            target: '.standings-section',
            title: 'Tabla de posiciones',
            body: 'Consulta la clasificación actualizada de la liga seleccionada y los últimos resultados. Cambia entre "Tabla" y "Resultados" con las pestañas.',
            position: 'above',
            pad: 8,
        },
        {
            target: '.bottom-nav',
            title: 'Navegación principal',
            body: 'Accede a Inicio, Reels (videos TikTok de fútbol), Búsqueda por voz o texto, Noticias y tu perfil. El botón central es la búsqueda rápida.',
            position: 'above',
            pad: 4,
        },
    ];

    // ── DOM HELPERS ───────────────────────────────────────────────────────────
    function mk(tag, cls, html) {
        const e = document.createElement(tag);
        if (cls)  e.className = cls;
        if (html) e.innerHTML = html;
        return e;
    }

    // ── STATE ─────────────────────────────────────────────────────────────────
    let step   = 0;
    let active = false;

    // ── ELEMENTS ──────────────────────────────────────────────────────────────
    const welcome = mk('div', 'tour-welcome');
    welcome.innerHTML = `
      <div class="tour-welcome-card">
        <div class="tour-welcome-icon">⚽</div>
        <h2>Bienvenido a UltraGol</h2>
        <p>Te mostramos en segundos cómo funciona cada sección de la plataforma. Sin perderte nada.</p>
        <div class="tour-welcome-actions">
          <button class="tour-btn-start" id="tourStart"><i class="fas fa-play"></i> Iniciar recorrido</button>
          <button class="tour-btn-dismiss" id="tourDismiss">Ya la conozco, omitir</button>
        </div>
      </div>`;

    const panels = ['top','bottom','left','right'].map(() => mk('div','tour-panel'));

    const ring = mk('div','tour-spotlight-ring');

    const card = mk('div','tour-card');
    card.innerHTML = `
      <div class="tour-step-label">
        <span class="tour-step-badge" id="tBadge">Paso 1 de ${STEPS.length}</span>
        <div class="tour-step-dots" id="tDots"></div>
      </div>
      <div class="tour-title" id="tTitle"></div>
      <div class="tour-body"  id="tBody"></div>
      <div class="tour-actions">
        <button class="tour-btn-skip" id="tSkip">Omitir</button>
        <button class="tour-btn-next" id="tNext">Siguiente <i class="fas fa-arrow-right"></i></button>
      </div>`;

    // ── MOUNT ─────────────────────────────────────────────────────────────────
    function mount() {
        document.body.appendChild(welcome);
        panels.forEach(p => document.body.appendChild(p));
        document.body.appendChild(ring);
        document.body.appendChild(card);

        // Dots
        const dotsEl = document.getElementById('tDots');
        STEPS.forEach((_, i) => {
            const d = mk('div','tour-dot');
            d.dataset.i = i;
            dotsEl.appendChild(d);
        });

        // Events
        document.getElementById('tourStart').addEventListener('click', startTour);
        document.getElementById('tourDismiss').addEventListener('click', dismiss);
        document.getElementById('tNext').addEventListener('click', next);
        document.getElementById('tSkip').addEventListener('click', endTour);
    }

    // ── WELCOME ───────────────────────────────────────────────────────────────
    function showWelcome() {
        welcome.classList.add('active');
    }
    function dismiss() {
        welcome.classList.remove('active');
        save();
    }

    // ── START / END ───────────────────────────────────────────────────────────
    function startTour() {
        welcome.classList.remove('active');
        active = true;
        step   = 0;
        panels.forEach(p => { p.style.display = 'block'; });
        ring.style.display   = 'block';
        card.style.display   = 'block';
        showStep(step);
    }

    function endTour() {
        active = false;
        // fade out panels
        panels.forEach(p => { p.style.background = 'transparent'; setTimeout(() => { p.style.display = 'none'; }, 420); });
        ring.style.opacity = '0';
        card.classList.remove('visible');
        setTimeout(() => {
            ring.style.display = 'none';
            card.style.display = 'none';
        }, 450);
        save();
    }

    function save() { try { localStorage.setItem(STORAGE_KEY, '1'); } catch(_) {} }

    // ── STEPS ─────────────────────────────────────────────────────────────────
    function next() {
        if (step < STEPS.length - 1) { step++; showStep(step); }
        else finish();
    }

    function showStep(idx) {
        const s  = STEPS[idx];
        const el = document.querySelector(s.target);
        if (!el) { next(); return; }

        // Scroll into view smoothly
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            const rect = el.getBoundingClientRect();
            const pad  = s.pad || 8;
            positionPanels(rect, pad);
            positionRing(rect, pad);
            positionCard(rect, s, idx);
            updateCard(idx);
        }, 360);
    }

    function positionPanels(rect, pad) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const t = Math.max(0, rect.top - pad);
        const b = Math.min(vh, rect.bottom + pad);
        const l = Math.max(0, rect.left - pad);
        const r = Math.min(vw, rect.right + pad);

        setPanel(panels[0], `top:0;left:0;right:0;height:${t}px`);
        setPanel(panels[1], `top:${b}px;left:0;right:0;bottom:0`);
        setPanel(panels[2], `top:${t}px;left:0;width:${l}px;height:${b-t}px`);
        setPanel(panels[3], `top:${t}px;left:${r}px;right:0;height:${b-t}px`);
    }

    function setPanel(p, css) {
        p.style.cssText = css + ';background:rgba(5,8,16,0.84);display:block;position:fixed;z-index:9991;transition:all 0.42s cubic-bezier(0.4,0,0.2,1)';
    }

    function positionRing(rect, pad) {
        const t = Math.max(0, rect.top - pad);
        const l = Math.max(0, rect.left - pad);
        const w = Math.min(window.innerWidth,  rect.right  + pad) - l;
        const h = Math.min(window.innerHeight, rect.bottom + pad) - t;
        const br = rect.height > 200 ? 18 : 12;
        ring.style.cssText = `top:${t}px;left:${l}px;width:${w}px;height:${h}px;border-radius:${br}px;opacity:1;display:block;position:fixed;z-index:9992;transition:all 0.42s cubic-bezier(0.4,0,0.2,1);border:2px solid rgba(233,69,96,0.9);pointer-events:none;`;
    }

    function positionCard(rect, s, idx) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cw = Math.min(300, vw - 24);
        const ch = 210;
        const gap = 14;

        card.className = 'tour-card';
        let top, left, arrow = 'arrow-none';

        const spaceBelow = vh - rect.bottom;
        const spaceAbove = rect.top;

        if (s.position === 'below' && spaceBelow > ch + gap) {
            top   = rect.bottom + gap;
            left  = clamp(rect.left, 12, vw - cw - 12);
            arrow = 'arrow-top';
        } else if (s.position === 'above' && spaceAbove > ch + gap) {
            top   = rect.top - ch - gap;
            left  = clamp(rect.left, 12, vw - cw - 12);
            arrow = 'arrow-bottom';
        } else if (spaceBelow > ch + gap) {
            top   = rect.bottom + gap;
            left  = clamp(rect.left, 12, vw - cw - 12);
            arrow = 'arrow-top';
        } else if (spaceAbove > ch + gap) {
            top   = rect.top - ch - gap;
            left  = clamp(rect.left, 12, vw - cw - 12);
            arrow = 'arrow-bottom';
        } else {
            // center
            top   = Math.max(12, (vh - ch) / 2);
            left  = Math.max(12, (vw - cw) / 2);
            arrow = 'arrow-none';
        }

        top  = clamp(top,  12, vh - ch - 12);
        left = clamp(left, 12, vw - cw - 12);

        card.style.cssText = `top:${top}px;left:${left}px;width:${cw}px;display:block;`;
        card.classList.add(arrow);

        // Animate in
        card.classList.remove('visible');
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('visible')));
    }

    function updateCard(idx) {
        const s      = STEPS[idx];
        const isLast = idx === STEPS.length - 1;

        document.getElementById('tBadge').textContent = `Paso ${idx + 1} de ${STEPS.length}`;
        document.getElementById('tTitle').textContent = s.title;
        document.getElementById('tBody').textContent  = s.body;

        const btn = document.getElementById('tNext');
        btn.innerHTML = isLast
            ? '<i class="fas fa-check"></i> Finalizar'
            : 'Siguiente <i class="fas fa-arrow-right"></i>';

        document.querySelectorAll('.tour-dot').forEach((d, i) => {
            d.className = 'tour-dot';
            if (i < idx)  d.classList.add('done');
            if (i === idx) d.classList.add('active');
        });
    }

    // ── FINISH ────────────────────────────────────────────────────────────────
    function finish() {
        endTour();
        const burst = mk('div','tour-finish-burst','<span>🎉</span>');
        document.body.appendChild(burst);
        setTimeout(() => burst.remove(), 900);
    }

    // ── UTILS ─────────────────────────────────────────────────────────────────
    function clamp(v, mn, mx) { return Math.max(mn, Math.min(v, mx)); }

    // ── KEYBOARD ──────────────────────────────────────────────────────────────
    document.addEventListener('keydown', e => {
        if (!active) return;
        if (e.key === 'ArrowRight' || e.key === 'Enter') next();
        if (e.key === 'Escape') endTour();
    });

    // ── RESIZE ────────────────────────────────────────────────────────────────
    let resizeT;
    window.addEventListener('resize', () => {
        if (!active) return;
        clearTimeout(resizeT);
        resizeT = setTimeout(() => showStep(step), 200);
    });

    // ── INIT ──────────────────────────────────────────────────────────────────
    function init() {
        mount();
        const done = localStorage.getItem(STORAGE_KEY);
        if (!done) setTimeout(showWelcome, 1200);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
