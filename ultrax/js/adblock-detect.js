/* ── ULTRAGOL ADBLOCK DETECT ─────────────────────────────────────────────── */
(function () {
    'use strict';

    var overlayMounted = false;

    // ── MÉTODO 1: Elemento cebo CSS ───────────────────────────────────────────
    // Brave Shields, uBlock, Adblock Plus ocultan elementos con clases de anuncios.
    // Usamos 800ms para que Brave tenga tiempo de aplicar sus filtros cosméticos.
    function baitCheck() {
        return new Promise(function (resolve) {
            var el = document.createElement('div');
            // Clases que están en EasyList y bloquean Brave, uBlock, ABP
            el.className = 'adsbox pub_300x250 banner_ad advertisement textads';
            el.style.cssText = [
                'width:1px',
                'height:1px',
                'position:fixed',
                'top:-9999px',
                'left:-9999px',
                'opacity:1',
                'pointer-events:none',
                'display:block'
            ].join(';');
            el.innerHTML = '&nbsp;';
            document.body.appendChild(el);

            // 800ms: tiempo suficiente para que Brave aplique filtros cosméticos
            setTimeout(function () {
                var cs = window.getComputedStyle(el);
                var blocked = (
                    cs.display      === 'none'   ||
                    cs.visibility   === 'hidden'  ||
                    parseFloat(cs.opacity) < 0.1  ||
                    el.offsetHeight === 0          ||
                    el.offsetWidth  === 0
                );
                try { el.remove(); } catch (e) {}
                resolve(blocked);
            }, 800);
        });
    }

    // ── MÉTODO 2: Script cebo con verificación de variable ────────────────────
    // El archivo /ultrax/js/adsbygoogle.js EXISTE y setea window.__ugAdsOk = true.
    // Brave/uBlock bloquean el request (onerror) o devuelven respuesta vacía (onload
    // pero sin ejecutar el script). Verificamos la variable para capturar ambos casos.
    function scriptBaitCheck() {
        return new Promise(function (resolve) {
            window.__ugAdsOk = false;

            var timer = setTimeout(function () {
                // El script tardó demasiado → probablemente bloqueado a nivel DNS
                resolve(true);
            }, 3500);

            var el = document.createElement('script');
            el.src = '/ultrax/js/adsbygoogle.js?t=' + Date.now();

            el.onload = function () {
                clearTimeout(timer);
                // Si el script corrió de verdad, __ugAdsOk será true.
                // Si Brave devolvió respuesta vacía, __ugAdsOk seguirá false → bloqueado.
                resolve(!window.__ugAdsOk);
                el.remove();
            };

            el.onerror = function () {
                clearTimeout(timer);
                // El request fue rechazado por el bloqueador → bloqueado
                resolve(true);
                el.remove();
            };

            document.head.appendChild(el);
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
            '        <span>Toca el ícono del León en la barra de dirección → desactiva los Escudos para este sitio</span>',
            '      </div>',
            '    </div>',
            '    <div class="adb-step">',
            '      <span class="adb-step-icon">🛡</span>',
            '      <div>',
            '        <strong>AdGuard DNS / NextDNS / Pi-hole</strong>',
            '        <span>Agrega este sitio a la lista blanca (whitelist) en tu configuración de DNS</span>',
            '      </div>',
            '    </div>',
            '    <div class="adb-step">',
            '      <span class="adb-step-icon">🔧</span>',
            '      <div>',
            '        <strong>uBlock Origin / Adblock Plus</strong>',
            '        <span>Haz clic en el ícono de la extensión → pausa o desactiva en este sitio</span>',
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
        // Ambos métodos corren en paralelo. Cualquiera que detecte bloqueador
        // muestra el overlay. scriptBaitCheck resolverá primero si hay bloqueo
        // de red; baitCheck resolverá a los 800ms con el chequeo CSS.
        Promise.all([baitCheck(), scriptBaitCheck()]).then(function (results) {
            if (results[0] || results[1]) {
                showOverlay();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
