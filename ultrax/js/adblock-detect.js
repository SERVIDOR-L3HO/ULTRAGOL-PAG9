/* ── ULTRAGOL ADBLOCK DETECT ─────────────────────────────────────────────── */
(function () {
    'use strict';

    var overlayMounted = false;

    // ── MÉTODO 1: fetch no-cors (detecta Brave móvil y DNS blockers) ──────────
    // KEY INSIGHT: fetch con mode:'no-cors' RESUELVE aunque el servidor devuelva
    // 403/400 (el servidor es alcanzable). Solo RECHAZA cuando la red bloquea
    // la conexión por completo (Brave Shields, AdGuard DNS, Pi-hole, etc.).
    // Esto elimina los falsos positivos de Chrome sin bloqueador.
    function fetchBaitCheck() {
        return new Promise(function (resolve) {
            if (typeof fetch !== 'function') { resolve(false); return; }

            var done  = false;
            var timer = setTimeout(function () {
                if (!done) { done = true; resolve(false); } // timeout = no conclusive
            }, 5000);

            // Probar dos dominios de ad-networks bloqueados por Brave/uBlock
            var urls = [
                'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
                'https://static.doubleclick.net/instream/ad_status.js'
            ];

            // Basta con que UNO cargue para saber que no hay bloqueador de red
            var loaded = 0;
            var errors = 0;

            urls.forEach(function (url) {
                fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store' })
                    .then(function () {
                        // Servidor alcanzable (incluso si devuelve 403) → sin bloqueador
                        loaded++;
                        if (!done) { done = true; clearTimeout(timer); resolve(false); }
                    })
                    .catch(function () {
                        // Red bloqueada → bloqueador detectado
                        errors++;
                        if (errors === urls.length && !done) {
                            done = true;
                            clearTimeout(timer);
                            resolve(true);
                        }
                    });
            });
        });
    }

    // ── MÉTODO 2: Elemento <ins> cebo (detecta extensiones CSS) ──────────────
    // Brave desktop, uBlock, ABP, AdGuard extensión ocultan <ins class="adsbygoogle">
    // con data-ad-client/slot — firma exacta de Google AdSense.
    function baitInsCheck() {
        return new Promise(function (resolve) {
            var ins = document.createElement('ins');
            ins.className = 'adsbygoogle';
            ins.setAttribute('data-ad-client', 'ca-pub-0000000000000000');
            ins.setAttribute('data-ad-slot',   '0000000000');
            ins.setAttribute('data-ad-format', 'auto');
            ins.style.cssText = 'display:block;width:300px;height:250px;position:fixed;top:-99999px;left:-99999px;';
            document.body.appendChild(ins);

            var tries = 0;
            function poll() {
                tries++;
                var cs = window.getComputedStyle(ins);
                var blocked = (
                    cs.display       === 'none'  ||
                    cs.visibility    === 'hidden' ||
                    parseFloat(cs.opacity) < 0.05 ||
                    ins.offsetHeight === 0         ||
                    ins.offsetWidth  === 0         ||
                    !document.body.contains(ins)
                );
                if (blocked) {
                    try { ins.remove(); } catch (e) {}
                    resolve(true);
                    return;
                }
                if (tries < 6) { setTimeout(poll, 350); }
                else { try { ins.remove(); } catch (e) {} resolve(false); }
            }
            setTimeout(poll, 350);
        });
    }

    // ── OVERLAY ───────────────────────────────────────────────────────────────
    function showOverlay() {
        if (overlayMounted) return;
        overlayMounted = true;

        var overlay = document.createElement('div');
        overlay.id = 'adblock-overlay';
        overlay.innerHTML = [
            '<div class="adb-card">',
            '  <span class="adb-icon">🛡️</span>',
            '  <div class="adb-logo">UltraGol</div>',
            '  <h2 class="adb-title">Bloqueador de anuncios detectado</h2>',
            '  <p class="adb-desc">UltraGol es completamente gratuito gracias a los anuncios.',
            '  Por favor desactiva tu bloqueador para acceder al contenido.</p>',
            '  <div class="adb-steps">',
            '    <div class="adb-step">',
            '      <span class="adb-step-icon">🦁</span>',
            '      <div>',
            '        <strong>Brave</strong>',
            '        <span>Toca el ícono del León en la barra → desactiva Escudos para este sitio</span>',
            '      </div>',
            '    </div>',
            '    <div class="adb-step">',
            '      <span class="adb-step-icon">🛡</span>',
            '      <div>',
            '        <strong>AdGuard DNS / NextDNS / Pi-hole</strong>',
            '        <span>Agrega este sitio a la lista blanca en tu configuración de DNS</span>',
            '      </div>',
            '    </div>',
            '    <div class="adb-step">',
            '      <span class="adb-step-icon">🔧</span>',
            '      <div>',
            '        <strong>uBlock Origin / Adblock Plus</strong>',
            '        <span>Haz clic en el ícono de la extensión → pausa en este sitio</span>',
            '      </div>',
            '    </div>',
            '  </div>',
            '  <button class="adb-btn" id="adbCheck">',
            '    <i class="fas fa-rotate-right"></i> Ya lo desactivé, continuar',
            '  </button>',
            '  <p class="adb-note">Nunca mostramos anuncios con malware. Tu experiencia siempre es segura.</p>',
            '</div>'
        ].join('');

        document.body.appendChild(overlay);
        document.getElementById('adbCheck').addEventListener('click', function () {
            window.location.reload();
        });
    }

    // ── INIT ──────────────────────────────────────────────────────────────────
    function run() {
        var shown = false;
        function check(blocked) {
            if (blocked && !shown) { shown = true; showOverlay(); }
        }
        // Ambos métodos corren en paralelo. El primero que detecte bloqueo
        // muestra el overlay sin esperar al otro.
        fetchBaitCheck().then(check);
        baitInsCheck().then(check);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
