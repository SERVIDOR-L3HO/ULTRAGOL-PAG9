/* ── ULTRAGOL TOUR GUIDE ─────────────────────────────────────────────────── */
(function () {
    'use strict';

    const STORAGE_KEY = 'ultragol_tour_done_v1';

    // ── PASOS DEL TOUR ────────────────────────────────────────────────────────
    const STEPS = [
        {
            target: 'nav',
            title: 'Barra de navegación',
            body: 'Desde aquí accedes rápidamente a las transmisiones en vivo. El botón rojo te lleva directo a la plataforma.',
            position: 'below',
            padding: 6,
        },
        {
            target: '.hero',
            title: 'Pantalla principal',
            body: 'Esta es la portada de UltraGol. Aquí ves el acceso directo para ver partidos en vivo y consultar tablas.',
            position: 'center',
            padding: 10,
        },
        {
            target: '.stats-strip',
            title: 'Nuestros números',
            body: 'Más de 6 ligas, 250 canales disponibles, cobertura 24/7 y completamente gratis. Sin registros ni pagos.',
            position: 'above',
            padding: 6,
        },
        {
            target: '.features-grid',
            title: 'Todo en un solo lugar',
            body: 'Streaming en vivo, marcadores en tiempo real, noticias, tabla de goleadores, app móvil y notificaciones de goles.',
            position: 'above',
            padding: 12,
        },
        {
            target: '.leagues-section',
            title: 'Las mejores ligas',
            body: 'Cubrimos Liga MX, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, NBA, F1, MLB, UFC y más.',
            position: 'above',
            padding: 8,
        },
        {
            target: '.cta-card',
            title: '¡Listo para empezar!',
            body: 'Sin registros ni pagos. Haz clic en "Entrar a UltraGol" y disfruta todos tus deportes favoritos ahora mismo.',
            position: 'above',
            padding: 10,
        },
    ];

    // ── DOM HELPERS ───────────────────────────────────────────────────────────
    function el(tag, cls, html) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html) e.innerHTML = html;
        return e;
    }

    // ── TOUR STATE ────────────────────────────────────────────────────────────
    let currentStep = 0;
    let tourActive  = false;

    // ── BUILD ELEMENTS ────────────────────────────────────────────────────────
    // Welcome screen
    const welcome = el('div', 'tour-welcome');
    welcome.innerHTML = `
        <div class="tour-welcome-card">
            <div class="tour-welcome-icon">⚽</div>
            <h2>Bienvenido a UltraGol</h2>
            <p>¿Quieres conocer todo lo que ofrece la plataforma? Te hacemos un recorrido rápido por cada sección.</p>
            <div class="tour-welcome-actions">
                <button class="tour-btn-start" id="tourBtnStart">
                    <i class="fas fa-play"></i> Iniciar recorrido
                </button>
                <button class="tour-btn-dismiss" id="tourBtnDismiss">No, gracias — ya la conozco</button>
            </div>
        </div>`;

    // Overlay panels (top / bottom / left / right)
    const panels = ['top','bottom','left','right'].map(side => {
        const p = el('div', 'tour-panel');
        p.dataset.side = side;
        return p;
    });

    // Spotlight ring
    const ring = el('div', 'tour-spotlight-ring');

    // Tooltip card
    const card = el('div', 'tour-card');
    card.innerHTML = `
        <div class="tour-step-label">
            <span class="tour-step-badge" id="tourStepBadge">Paso 1 de ${STEPS.length}</span>
            <div class="tour-step-dots" id="tourDots"></div>
        </div>
        <div class="tour-title" id="tourTitle"></div>
        <div class="tour-body"  id="tourBody"></div>
        <div class="tour-actions">
            <button class="tour-btn-skip" id="tourBtnSkip">Omitir</button>
            <button class="tour-btn-next" id="tourBtnNext">
                Siguiente <i class="fas fa-arrow-right"></i>
            </button>
        </div>`;

    // Trigger button (reabre el tour)
    const triggerBtn = el('div', 'tour-trigger-btn');
    triggerBtn.title = 'Ver guía de UltraGol';
    triggerBtn.innerHTML = '<i class="fas fa-question"></i>';

    // ── MOUNT ─────────────────────────────────────────────────────────────────
    function mount() {
        document.body.appendChild(welcome);
        panels.forEach(p => document.body.appendChild(p));
        document.body.appendChild(ring);
        document.body.appendChild(card);
        document.body.appendChild(triggerBtn);

        // Dots
        const dotsContainer = document.getElementById('tourDots');
        STEPS.forEach((_, i) => {
            const d = el('div', 'tour-dot');
            d.dataset.idx = i;
            dotsContainer.appendChild(d);
        });

        // Events
        document.getElementById('tourBtnStart').addEventListener('click', startTour);
        document.getElementById('tourBtnDismiss').addEventListener('click', dismissWelcome);
        document.getElementById('tourBtnNext').addEventListener('click', nextStep);
        document.getElementById('tourBtnSkip').addEventListener('click', endTour);
        triggerBtn.addEventListener('click', () => { currentStep = 0; showWelcome(); });
    }

    // ── WELCOME ───────────────────────────────────────────────────────────────
    function showWelcome() {
        welcome.classList.add('active');
    }
    function dismissWelcome() {
        welcome.classList.remove('active');
        localStorage.setItem(STORAGE_KEY, '1');
    }

    // ── START / END ───────────────────────────────────────────────────────────
    function startTour() {
        welcome.classList.remove('active');
        tourActive = true;
        currentStep = 0;
        showStep(currentStep);
        panels.forEach(p => { p.style.display = 'block'; });
        ring.style.display = 'block';
    }

    function endTour() {
        tourActive = false;
        hideOverlay();
        localStorage.setItem(STORAGE_KEY, '1');
        triggerBtn.style.opacity = '1';
    }

    function hideOverlay() {
        panels.forEach(p => { p.style.background = 'transparent'; });
        ring.style.opacity = '0';
        card.classList.remove('visible');
        setTimeout(() => {
            panels.forEach(p => { p.style.display = 'none'; });
            ring.style.display = 'none';
        }, 450);
    }

    // ── STEP RENDERING ────────────────────────────────────────────────────────
    function nextStep() {
        if (currentStep < STEPS.length - 1) {
            currentStep++;
            showStep(currentStep);
        } else {
            finishTour();
        }
    }

    function showStep(idx) {
        const step = STEPS[idx];
        const target = document.querySelector(step.target);
        if (!target) { nextStep(); return; }

        // Scroll target into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            const rect = target.getBoundingClientRect();
            const pad  = step.padding || 8;

            positionSpotlight(rect, pad);
            positionCard(rect, step);
            updateCard(idx);
        }, 350);
    }

    function positionSpotlight(rect, pad) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const t = Math.max(0, rect.top    - pad);
        const b = Math.min(vh, rect.bottom + pad);
        const l = Math.max(0, rect.left   - pad);
        const r = Math.min(vw, rect.right  + pad);

        // Panels
        const [pTop, pBottom, pLeft, pRight] = panels;
        pTop.style.cssText    = `top:0;left:0;right:0;height:${t}px;display:block;background:rgba(5,8,16,0.82)`;
        pBottom.style.cssText = `top:${b}px;left:0;right:0;bottom:0;display:block;background:rgba(5,8,16,0.82)`;
        pLeft.style.cssText   = `top:${t}px;left:0;width:${l}px;height:${b - t}px;display:block;background:rgba(5,8,16,0.82)`;
        pRight.style.cssText  = `top:${t}px;left:${r}px;right:0;height:${b - t}px;display:block;background:rgba(5,8,16,0.82)`;

        // Ring
        ring.style.cssText = `
            top:${t}px;left:${l}px;
            width:${r - l}px;height:${b - t}px;
            opacity:1;display:block;
            border-radius:${rect.height > 300 ? 20 : 14}px;`;
    }

    function positionCard(rect, step) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cw = Math.min(320, vw - 32);
        const ch = 220; // estimated card height
        const gap = 16;

        card.className = 'tour-card';

        let top, left, arrowClass = 'arrow-none';

        if (step.position === 'below' || rect.bottom + ch + gap < vh) {
            // Below target
            top = rect.bottom + gap;
            left = Math.max(16, Math.min(rect.left, vw - cw - 16));
            arrowClass = 'arrow-top';
        } else if (step.position === 'above' || rect.top - ch - gap > 0) {
            // Above target
            top = rect.top - ch - gap;
            left = Math.max(16, Math.min(rect.left, vw - cw - 16));
            arrowClass = 'arrow-bottom';
        } else if (rect.left - cw - gap > 0) {
            // Left of target
            top = Math.max(16, Math.min(rect.top, vh - ch - 16));
            left = rect.left - cw - gap;
            arrowClass = 'arrow-right';
        } else {
            // Right of target
            top = Math.max(16, Math.min(rect.top, vh - ch - 16));
            left = rect.right + gap;
            arrowClass = 'arrow-left';
        }

        // Center fallback for very tall targets
        if (step.position === 'center') {
            top  = Math.max(16, (vh - ch) / 2);
            left = Math.max(16, (vw - cw) / 2);
            arrowClass = 'arrow-none';
        }

        // Clamp
        top  = Math.max(16, Math.min(top,  vh - ch - 16));
        left = Math.max(16, Math.min(left, vw - cw - 16));

        card.style.top   = top + 'px';
        card.style.left  = left + 'px';
        card.style.width = cw + 'px';
        card.classList.add(arrowClass);

        // Animate in
        card.classList.remove('visible');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => card.classList.add('visible'));
        });
    }

    function updateCard(idx) {
        const step   = STEPS[idx];
        const isLast = idx === STEPS.length - 1;

        document.getElementById('tourStepBadge').textContent = `Paso ${idx + 1} de ${STEPS.length}`;
        document.getElementById('tourTitle').textContent = step.title;
        document.getElementById('tourBody').textContent  = step.body;

        const nextBtn = document.getElementById('tourBtnNext');
        nextBtn.innerHTML = isLast
            ? '<i class="fas fa-check"></i> Finalizar'
            : 'Siguiente <i class="fas fa-arrow-right"></i>';

        // Update dots
        document.querySelectorAll('.tour-dot').forEach((d, i) => {
            d.className = 'tour-dot';
            if (i < idx)  d.classList.add('done');
            if (i === idx) d.classList.add('active');
        });
    }

    // ── FINISH ────────────────────────────────────────────────────────────────
    function finishTour() {
        endTour();

        const burst = el('div', 'tour-finish-burst', '<span>🎉</span>');
        document.body.appendChild(burst);
        setTimeout(() => burst.remove(), 900);
    }

    // ── KEYBOARD ──────────────────────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
        if (!tourActive) return;
        if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
        if (e.key === 'Escape') endTour();
    });

    // ── RESIZE ────────────────────────────────────────────────────────────────
    let resizeTimer;
    window.addEventListener('resize', () => {
        if (!tourActive) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => showStep(currentStep), 200);
    });

    // ── INIT ──────────────────────────────────────────────────────────────────
    function init() {
        mount();
        const done = localStorage.getItem(STORAGE_KEY);
        if (!done) {
            setTimeout(showWelcome, 900);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
