/* ── ULTRAGOL ADBLOCK DETECT ─────────────────────────────────────────────── */
(function () {
    'use strict';

    var overlayMounted = false;

    // ── MÉTODO 1: Elemento cebo ───────────────────────────────────────────────
    // Brave Shields, uBlock Origin, Adblock Plus ocultan elementos con nombres
    // de clase típicos de anuncios. Si el elemento termina invisible = bloqueador.
    function baitCheck() {
        return new Promise(function (resolve) {
            var el = document.createElement('div');
            el.className = 'adsbox ad-placement pub_300x250 banner_ad advertisement';
            el.style.cssText = [
                'width:1px',
                'height:1px',
                'position:fixed',
                'top:-9999px',
                'left:-9999px',
                'opacity:1',
                'pointer-events:none'
            ].join(';');
            el.innerHTML = '&nbsp;';
            document.body.appendChild(el);

            setTimeout(function () {
                var cs = window.getComputedStyle(el);
                var blocked = (
                    cs.display     === 'none'   ||
                    cs.visibility  === 'hidden'  ||
                    cs.opacity     === '0'       ||
                    el.offsetHeight === 0         ||
                    el.offsetWidth  === 0
                );
                try { el.remove(); } catch (e) {}
                resolve(blocked);
            }, 250);
        });
    }

    // ── MÉTODO 2: Script cebo con nombre de dominio conocido ─────────────────
    // El archivo /ultrax/js/adsbygoogle.js EXISTE en el servidor (placeholder).
    // Brave Shields y uBlock lo bloquean por el nombre "adsbygoogle.js" antes
    // de que llegue la respuesta → onerror. Sin bloqueador → onload normal.
    // Cero falsos positivos porque el archivo realmente existe en nuestro servidor.
    function scriptBaitCheck() {
        return new Promise(function (resolve) {
            var timer = setTimeout(function () { resolve(false); }, 3500);
            var el = document.createElement('script');
            el.src = '/ultrax/js/adsbygoogle.js?t=' + Date.now();
            el.onload = function () {
                clearTimeout(timer);
                resolve(false);
                el.remove();
            };
            el.onerror = function () {
                clearTimeout(timer);
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
            '        <span>Toca el ícono del León (🦁) en la barra de dirección → desactiva los Escudos para este sitio</span>',
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
