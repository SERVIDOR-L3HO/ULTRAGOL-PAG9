(function () {
    'use strict';

    const STORAGE_KEY = 'ultragol_reels_likes';
    const API_URL = '/api/reels';
    const FALLBACK_URL = '/data/reels.json';

    let reelsData = [];
    let currentIndex = 0;
    let isMuted = true;
    let likedSet = new Set();

    // ─── LOAD LIKES FROM LOCAL STORAGE ───
    function loadLikes() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) likedSet = new Set(JSON.parse(stored));
        } catch (e) { /* noop */ }
    }

    function saveLikes() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...likedSet]));
        } catch (e) { /* noop */ }
    }

    // ─── FETCH DATA (live API first, static fallback) ───
    async function fetchReels() {
        // Try live scraper API first
        try {
            const res = await fetch(API_URL, { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                if (json.reels && json.reels.length > 0) {
                    reelsData = json.reels;
                    console.log(`[Reels] Loaded ${reelsData.length} live reels from API`);
                    return reelsData;
                }
            }
        } catch (e) {
            console.warn('[Reels] API fetch failed, using fallback:', e.message);
        }
        // Fallback to static JSON
        try {
            const res = await fetch(FALLBACK_URL);
            const json = await res.json();
            reelsData = json.reels || [];
            console.log(`[Reels] Loaded ${reelsData.length} fallback reels`);
            return reelsData;
        } catch (e) {
            console.error('[Reels] Both API and fallback failed:', e);
            return [];
        }
    }

    // ─── INLINE TEASER (home page section) ───
    function buildTeaser(container) {
        if (!container || reelsData.length === 0) return;

        const cards = reelsData.slice(0, 8).map((r, idx) => `
            <div class="reels-card" data-idx="${idx}" role="button" tabindex="0" aria-label="Ver: ${escapeHtml(r.title)}">
                <div class="reels-card-thumb" style="background-image: url('${r.thumbnail}')"></div>
                <div class="reels-card-overlay"></div>
                <span class="reels-card-tag" style="background:${r.tagColor || '#FFD700'}">${escapeHtml(r.tag)}</span>
                <div class="reels-card-play"><i class="fas fa-play"></i></div>
                <div class="reels-card-info">
                    <div class="reels-card-team">${escapeHtml(r.team)}</div>
                    <div class="reels-card-title">${escapeHtml(r.title)}</div>
                    <div class="reels-card-stats">
                        <span><i class="fas fa-heart"></i> ${formatCount(r.likes)}</span>
                        <span><i class="fas fa-share"></i> ${formatCount(r.shares)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="reels-teaser-header">
                <div class="reels-teaser-title-wrap">
                    <span class="reels-teaser-fire">🔥</span>
                    <h2 class="reels-teaser-title">Momentos del momento</h2>
                    <span class="reels-teaser-new-badge">Nuevo</span>
                </div>
                <button class="reels-teaser-cta" id="reelsViewAll">
                    Ver todos <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            <div class="reels-teaser-scroller">${cards}</div>
        `;

        // Click handlers
        container.querySelectorAll('.reels-card').forEach(card => {
            const handler = () => openViewer(parseInt(card.dataset.idx, 10));
            card.addEventListener('click', handler);
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
            });
        });

        const viewAll = container.querySelector('#reelsViewAll');
        if (viewAll) viewAll.addEventListener('click', () => openViewer(0));
    }

    // ─── HOOK NAV BUTTON (any element with [data-reels-trigger]) ───
    function attachTriggers() {
        document.querySelectorAll('[data-reels-trigger]').forEach(el => {
            if (el.dataset.reelsHooked === '1') return;
            el.dataset.reelsHooked = '1';
            el.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (reelsData.length === 0) {
                    // Show loading state, retry fetch
                    showToast('Cargando reels…');
                    await fetchReels();
                }
                if (reelsData.length === 0) {
                    showToast('No hay reels disponibles. Inténtalo más tarde.');
                    return;
                }
                openViewer(0);
            });
        });
        console.log('[Reels] Triggers attached:', document.querySelectorAll('[data-reels-trigger]').length);
    }

    function showToast(msg) {
        let toast = document.getElementById('reelsToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'reelsToast';
            toast.style.cssText = 'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:12px 20px;border-radius:24px;z-index:99999;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,0.15);';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
    }

    // ─── FULLSCREEN VIEWER ───
    function buildViewer() {
        if (document.querySelector('.reels-viewer')) return;
        const v = document.createElement('div');
        v.className = 'reels-viewer';
        v.setAttribute('role', 'dialog');
        v.setAttribute('aria-modal', 'true');
        v.innerHTML = `
            <div class="reels-viewer-stage" id="reelsStage"></div>
            <div class="reels-toast" id="reelsToast"></div>
        `;
        document.body.appendChild(v);
    }

    function renderSlides() {
        const stage = document.getElementById('reelsStage');
        if (!stage) return;
        stage.innerHTML = reelsData.map((r, idx) => slideHtml(r, idx)).join('');
        attachSlideHandlers();
        observeSlides();
    }

    function slideHtml(r, idx) {
        const liked = likedSet.has(r.id);
        const likes = r.likes + (liked ? 1 : 0);
        const dots = reelsData.map((_, i) =>
            `<div class="reels-progress-dot ${i === idx ? 'active' : ''}" data-dot="${i}"></div>`
        ).join('');

        const swipeHint = idx === 0 ? `
            <div class="reels-swipe-hint">
                <i class="fas fa-chevron-up"></i>
                <span>Desliza para más</span>
            </div>
        ` : '';

        return `
            <section class="reels-slide" data-slide="${idx}" data-id="${r.id}">
                <div class="reels-video-wrap" data-video-wrap="${idx}">
                    <div class="reels-loading"><i class="fas fa-circle-notch"></i></div>
                </div>

                <div class="reels-topbar">
                    <div class="reels-brand">
                        <span class="reels-brand-fire">🔥</span> UltraGol Reels
                    </div>
                    <button class="reels-close" id="reelsClose-${idx}" aria-label="Cerrar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="reels-progress">${dots}</div>

                <div class="reels-actions">
                    <button class="reels-mute-btn" data-mute aria-label="Sonido">
                        <i class="fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}"></i>
                    </button>
                    <button class="reels-action-btn ${liked ? 'liked' : ''}" data-like="${r.id}" aria-label="Me gusta">
                        <span class="reels-action-icon"><i class="fas fa-heart"></i></span>
                        <span class="reels-action-count">${formatCount(likes)}</span>
                    </button>
                    <button class="reels-action-btn" data-share="${idx}" aria-label="Compartir">
                        <span class="reels-action-icon"><i class="fas fa-share"></i></span>
                        <span class="reels-action-count">${formatCount(r.shares)}</span>
                    </button>
                    <button class="reels-action-btn" data-fav="${r.id}" aria-label="Guardar">
                        <span class="reels-action-icon"><i class="fas fa-bookmark"></i></span>
                        <span class="reels-action-count">Guardar</span>
                    </button>
                </div>

                <div class="reels-info">
                    <span class="reels-info-tag" style="background:${r.tagColor || '#FFD700'}">${escapeHtml(r.tag)}</span>
                    <div class="reels-info-team"><i class="fas fa-shield-halved"></i> ${escapeHtml(r.team)}</div>
                    <h3 class="reels-info-title">${escapeHtml(r.title)}</h3>
                    <p class="reels-info-desc">${escapeHtml(r.description)}</p>
                    <div class="reels-info-date">${escapeHtml(r.date)}</div>
                </div>

                ${swipeHint}
            </section>
        `;
    }

    function attachSlideHandlers() {
        document.querySelectorAll('.reels-close').forEach(btn => {
            btn.addEventListener('click', closeViewer);
        });

        document.querySelectorAll('[data-mute]').forEach(btn => {
            btn.addEventListener('click', () => toggleMute(btn));
        });

        document.querySelectorAll('[data-like]').forEach(btn => {
            btn.addEventListener('click', () => toggleLike(btn));
        });

        document.querySelectorAll('[data-share]').forEach(btn => {
            btn.addEventListener('click', () => shareReel(parseInt(btn.dataset.share, 10)));
        });

        document.querySelectorAll('[data-fav]').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('liked');
                showToast(btn.classList.contains('liked') ? 'Guardado en favoritos' : 'Quitado de favoritos');
            });
        });

        document.querySelectorAll('.reels-progress-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const i = parseInt(dot.dataset.dot, 10);
                scrollToSlide(i);
            });
        });
    }

    // ─── INTERSECTION OBSERVER (lazy load + auto-play tracking) ───
    function observeSlides() {
        const slides = document.querySelectorAll('.reels-slide');
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const idx = parseInt(entry.target.dataset.slide, 10);
                if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
                    currentIndex = idx;
                    loadVideo(idx);
                    updateAllProgressDots(idx);
                } else if (entry.intersectionRatio < 0.3) {
                    pauseVideo(idx);
                }
            });
        }, { threshold: [0.3, 0.6, 0.9] });

        slides.forEach(s => obs.observe(s));
    }

    function loadVideo(idx) {
        const wrap = document.querySelector(`[data-video-wrap="${idx}"]`);
        if (!wrap || wrap.dataset.loaded === '1') return;

        const r = reelsData[idx];
        if (!r) return;

        wrap.dataset.loaded = '1';

        if (r.type === 'mp4' && r.videoUrl) {
            wrap.innerHTML = `
                <video src="${r.videoUrl}" poster="${r.thumbnail || ''}" autoplay ${isMuted ? 'muted' : ''} loop playsinline preload="metadata"></video>
            `;
            const v = wrap.querySelector('video');
            if (v) {
                v.addEventListener('click', () => {
                    if (v.paused) v.play(); else v.pause();
                });
            }
        } else if (r.type === 'iframe' && r.videoUrl) {
            wrap.innerHTML = `
                <iframe src="${r.videoUrl}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>
            `;
        }
    }

    function pauseVideo(idx) {
        const wrap = document.querySelector(`[data-video-wrap="${idx}"]`);
        if (!wrap) return;
        const video = wrap.querySelector('video');
        if (video) { try { video.pause(); } catch(e) {} }
    }

    function updateAllProgressDots(activeIdx) {
        document.querySelectorAll('.reels-slide').forEach(slide => {
            slide.querySelectorAll('.reels-progress-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === activeIdx);
            });
        });
    }

    function scrollToSlide(idx) {
        const slide = document.querySelector(`.reels-slide[data-slide="${idx}"]`);
        if (slide) slide.scrollIntoView({ behavior: 'smooth' });
    }

    // ─── ACTIONS ───
    function toggleMute(btn) {
        isMuted = !isMuted;
        document.querySelectorAll('[data-mute]').forEach(b => {
            b.innerHTML = `<i class="fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}"></i>`;
        });
        // Update all currently loaded videos
        document.querySelectorAll('.reels-video-wrap video').forEach(v => {
            v.muted = isMuted;
            if (!isMuted && v.paused) { v.play().catch(() => {}); }
        });
        showToast(isMuted ? 'Sonido desactivado' : 'Sonido activado');
    }

    function toggleLike(btn) {
        const id = btn.dataset.like;
        const countEl = btn.querySelector('.reels-action-count');
        const reel = reelsData.find(r => r.id === id);
        if (!reel) return;

        if (likedSet.has(id)) {
            likedSet.delete(id);
            btn.classList.remove('liked');
            countEl.textContent = formatCount(reel.likes);
        } else {
            likedSet.add(id);
            btn.classList.add('liked');
            countEl.textContent = formatCount(reel.likes + 1);
        }
        saveLikes();
    }

    async function shareReel(idx) {
        const r = reelsData[idx];
        if (!r) return;
        const url = window.location.href.split('#')[0] + '#reel-' + r.id;
        const shareData = {
            title: `UltraGol — ${r.title}`,
            text: `Mira este momento de ${r.team}: ${r.title}`,
            url
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(url);
                showToast('Enlace copiado al portapapeles');
            }
        } catch (e) { /* user cancelled */ }
    }

    function showToast(msg) {
        const toast = document.getElementById('reelsToast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    // ─── OPEN / CLOSE ───
    function openViewer(idx) {
        const viewer = document.querySelector('.reels-viewer');
        if (!viewer) return;
        currentIndex = Math.max(0, Math.min(idx, reelsData.length - 1));
        renderSlides();
        viewer.classList.add('active');
        document.body.classList.add('reels-viewer-open');
        // Scroll to the requested slide
        requestAnimationFrame(() => {
            const stage = document.getElementById('reelsStage');
            if (stage && reelsData[currentIndex]) {
                const slide = stage.querySelector(`.reels-slide[data-slide="${currentIndex}"]`);
                if (slide) slide.scrollIntoView({ behavior: 'auto' });
            }
        });
    }

    function closeViewer() {
        const viewer = document.querySelector('.reels-viewer');
        if (!viewer) return;
        viewer.classList.remove('active');
        document.body.classList.remove('reels-viewer-open');
        // Clear iframes to stop audio
        const stage = document.getElementById('reelsStage');
        if (stage) stage.innerHTML = '';
    }

    // ─── KEYBOARD SUPPORT ───
    document.addEventListener('keydown', (e) => {
        const viewer = document.querySelector('.reels-viewer.active');
        if (!viewer) return;
        if (e.key === 'Escape') closeViewer();
        if (e.key === 'ArrowDown') scrollToSlide(Math.min(currentIndex + 1, reelsData.length - 1));
        if (e.key === 'ArrowUp') scrollToSlide(Math.max(currentIndex - 1, 0));
        if (e.key === 'm' || e.key === 'M') {
            const muteBtn = document.querySelector('[data-mute]');
            if (muteBtn) toggleMute(muteBtn);
        }
    });

    // ─── HELPERS ───
    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function formatCount(n) {
        if (n == null) return '0';
        if (n < 1000) return String(n);
        if (n < 1000000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }

    // ─── INIT ───
    async function init() {
        loadLikes();
        // Attach triggers FIRST so the button always responds, even if data load fails
        buildViewer();
        attachTriggers();
        // Then fetch reels — if it fails, clicking shows a friendly error toast
        await fetchReels();
        const teaserContainer = document.getElementById('reelsTeaser');
        if (teaserContainer && reelsData.length > 0) buildTeaser(teaserContainer);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    window.UltraGolReels = {
        open: openViewer,
        close: closeViewer,
        reload: init
    };
})();
