/* ═══════════════════════════════════════════════════════════
   ULTRAGOL — GLASS NAV (injector)
   Injects a floating glass bottom tab-bar (mobile) that morphs
   into a glass hamburger + dropdown panel on desktop (>=1024px).
   Items: Home · Buscar · Goleadores · Noticias
   ═══════════════════════════════════════════════════════════ */
(function () {
    var ITEMS = [
        { key: 'home',       label: 'Home',       icon: 'fa-house',        href: 'index.html' },
        { key: 'buscar',     label: 'Buscar',      icon: 'fa-magnifying-glass', href: null },
        { key: 'goleadores', label: 'Goleadores',  icon: 'fa-futbol',       href: 'goleadores.html' },
        { key: 'noticias',   label: 'Noticias',    icon: 'fa-newspaper',    href: 'noticias.html' }
    ];

    function currentPage() {
        var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        if (file === '' ) return 'home';
        if (file.indexOf('goleadores') !== -1) return 'goleadores';
        if (file.indexOf('noticias') !== -1) return 'noticias';
        return 'home';
    }

    function handleBuscar() {
        if (typeof window.showSearchModal === 'function') {
            window.showSearchModal();
        } else {
            location.href = 'index.html?openSearch=1';
        }
    }

    function goTo(item) {
        if (item.key === 'buscar') { handleBuscar(); return; }
        if (item.href) location.href = item.href;
    }

    function ripple(el) {
        el.classList.remove('ugn-tap');
        void el.offsetWidth;
        el.classList.add('ugn-tap');
        setTimeout(function () { el.classList.remove('ugn-tap'); }, 500);
    }

    function buildItemsHTML(active) {
        return ITEMS.map(function (item) {
            var isActive = item.key === active;
            return '<button type="button" class="ugn-item' + (isActive ? ' active' : '') + '" data-key="' + item.key + '" aria-label="' + item.label + '">' +
                '<i class="fas ' + item.icon + '"></i><span>' + item.label + '</span>' +
                '</button>';
        }).join('');
    }

    function init() {
        var active = currentPage();

        // ── Bottom glass tab bar (mobile/tablet) ──
        var bottom = document.createElement('nav');
        bottom.className = 'ugn-bottom';
        bottom.setAttribute('aria-label', 'Navegación principal');
        bottom.innerHTML = buildItemsHTML(active);
        document.body.appendChild(bottom);

        // ── Desktop hamburger FAB ──
        var fab = document.createElement('button');
        fab.type = 'button';
        fab.className = 'ugn-fab';
        fab.setAttribute('aria-label', 'Abrir menú');
        fab.innerHTML = '<span></span><span></span><span></span>';
        document.body.appendChild(fab);

        var overlay = document.createElement('div');
        overlay.className = 'ugn-panel-overlay';
        document.body.appendChild(overlay);

        var panel = document.createElement('div');
        panel.className = 'ugn-panel';
        panel.innerHTML = buildItemsHTML(active);
        document.body.appendChild(panel);

        function closePanel() {
            fab.classList.remove('ugn-open');
            panel.classList.remove('ugn-open');
            overlay.classList.remove('ugn-open');
        }
        function togglePanel() {
            var open = panel.classList.toggle('ugn-open');
            fab.classList.toggle('ugn-open', open);
            overlay.classList.toggle('ugn-open', open);
        }

        fab.addEventListener('click', togglePanel);
        overlay.addEventListener('click', closePanel);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closePanel();
        });

        [bottom, panel].forEach(function (container) {
            container.querySelectorAll('.ugn-item').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    ripple(btn);
                    var item = ITEMS.find(function (i) { return i.key === btn.dataset.key; });
                    if (item) goTo(item);
                    closePanel();
                });
            });
        });

        // Keep body content clear of the floating bottom bar on small screens
        var style = document.createElement('style');
        style.textContent = '@media (max-width: 1023px){ body{ padding-bottom: 96px !important; } }';
        document.head.appendChild(style);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
