/* ── ULTRAGOL ADBLOCK DETECT ─────────────────────────────────────────────── */
(function () {
    'use strict';

    var overlayMounted = false;

    // ── MÉTODO 1: Script real de Google AdSense ────────────────────────────────
    // COMPORTAMIENTO CONFIRMADO:
    //   • Brave Shields ACTIVO  → cancela el request del <script> → onerror
    //   • Chrome sin bloqueador → script carga (200 OK) → onload → window.adsbygoogle definido
    //   • NOTA: En localhost/dev el CSP de Replit bloquea scripts externos (falso positivo)
    //           por eso este método solo corre en producción (hostname != localhost).
    function scriptExecCheck() {
        return new Promise(function (resolve) {
            try { delete window.adsbygoogle; } catch (e) {}
            window.adsbygoogle = undefined;

            var done  = false;
            var timer = setTimeout(function () {
                if (!done) { done = true; resolve(true); } // timeout = bloqueado
            }, 7000);

            var el = document.createElement('script');
            el.src   = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?t=' + Date.now();
            el.async = true;
            // Sin crossOrigin: carga estándar, sin restricciones CORS extra

            el.onload = function () {
                if (done) return;
                done = true;
                clearTimeout(timer);
                try { el.remove(); } catch (e) {}
                // Si el script corrió de verdad, Google define window.adsbygoogle.
                // Si Brave devolvió respuesta vacía/sintética, sigue undefined.
                resolve(typeof window.adsbygoogle === 'undefined');
            };

            el.onerror = function () {
                if (done) return;
                done = true;
                clearTimeout(timer);
                try { el.remove(); } catch (e) {}
                resolve(true); // Brave (u otro) canceló el request → bloqueado
            };

            document.head.appendChild(el);
        });
    }

    // ── MÉTODO 2: fetch no-cors (detecta AdGuard DNS / Pi-hole) ───────────────
    // AdGuard DNS bloquea a nivel de DNS → la conexión TCP nunca se establece
    // → fetch rechaza con TypeError. Brave Shields, en cambio, devuelve una
    // respuesta sintética opaca → fetch RESUELVE (por eso no detecta Brave).
    // Probamos dos dominios: si AMBOS fallan = DNS blocker activo.
    function fetchBaitCheck() {
        return new Promise(function (resolve) {
            if (typeof fetch !== 'function') { resolve(false); return; }

            var done  = false;
            var timer = setTimeout(function () {
                if (!done) { done = true; resolve(false); }
            }, 5000);

            var urls = [
                'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
                'https://static.doubleclick.net/instream/ad_status.js'
            ];
            var errors = 0;

            urls.forEach(function (url) {
                fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store' })
                    .then(function () {
                        // Servidor alcanzable (incluso si devuelve 403) → sin DNS blocker
                        if (!done) { done = true; clearTimeout(timer); resolve(false); }
                    })
                    .catch(function () {
                        errors++;
                        if (errors === urls.length && !done) {
                            done = true;
                            clearTimeout(timer);
                            resolve(true); // Ambos dominios bloqueados → DNS blocker
                        }
                    });
            });
        });
    }

    // ── MÉTODO 3: Elemento <ins> cebo CSS (detecta extensiones) ───────────────
    // uBlock Origin, AdGuard extensión, Adblock Plus aplican la regla cosmética
    // "display:none !important" a <ins class="adsbygoogle"> con data-ad-client/slot.
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
                    cs.display       === 'none'   ||
                    cs.visibility    === 'hidden'  ||
                    parseFloat(cs.opacity) < 0.05  ||
                    ins.offsetHeight === 0          ||
                    ins.offsetWidth  === 0          ||
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

        // Método 2: AdGuard DNS / Pi-hole (funciona en todos los entornos)
        fetchBaitCheck().then(check);

        // Método 3: Extensiones CSS (uBlock, ABP, AdGuard extensión)
        baitInsCheck().then(check);

        // Método 1: Brave Shields — solo en producción.
        // En localhost el CSP de Replit bloquea scripts externos (falso positivo).
        var isLocalDev = (
            location.hostname === 'localhost'   ||
            location.hostname === '127.0.0.1'   ||
            location.hostname.indexOf('.replit.') !== -1 ||
            location.hostname.indexOf('.repl.co') !== -1
        );
        if (!isLocalDev) {
            scriptExecCheck().then(check);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
