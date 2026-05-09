/* ── ULTRAGOL ADBLOCK DETECT ─────────────────────────────────────────────── */
(function () {
    'use strict';

    var overlayMounted = false;

    // ── MÉTODO 1: Elemento <ins> cebo (Google Ads fingerprint) ────────────────
    // Brave, uBlock, ABP filtran exactamente <ins class="adsbygoogle"> con
    // data-ad-client / data-ad-slot — es la firma real de Google Ads.
    // Hacemos polling cada 350ms hasta 2.1 segundos para dar tiempo a los filtros.
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
                    cs.display          === 'none'   ||
                    cs.visibility       === 'hidden'  ||
                    parseFloat(cs.opacity) < 0.05     ||
                    ins.offsetHeight    === 0          ||
                    ins.offsetWidth     === 0          ||
                    !document.body.contains(ins)
                );
                if (blocked) {
                    try { ins.remove(); } catch (e) {}
                    resolve(true);
                    return;
                }
                if (tries < 6) {
                    setTimeout(poll, 350);
                } else {
                    try { ins.remove(); } catch (e) {}
                    resolve(false);
                }
            }
            setTimeout(poll, 350);
        });
    }

    // ── MÉTODO 2: Elemento div cebo con clases EasyList ──────────────────────
    // Segunda línea: clases que EasyList esconde con CSS cosmético.
    function baitDivCheck() {
        return new Promise(function (resolve) {
            var el = document.createElement('div');
            el.className = 'adsbox pub_300x250 banner_ad advertisement textads';
            el.style.cssText = 'width:300px;height:250px;position:fixed;top:-99998px;left:-99998px;';
            el.innerHTML = '&nbsp;';
            document.body.appendChild(el);

            var tries = 0;
            function poll() {
                tries++;
                var cs = window.getComputedStyle(el);
                var blocked = (
                    cs.display          === 'none'   ||
                    cs.visibility       === 'hidden'  ||
                    parseFloat(cs.opacity) < 0.05     ||
                    el.offsetHeight     === 0          ||
                    el.offsetWidth      === 0          ||
                    !document.body.contains(el)
                );
                if (blocked) {
                    try { el.remove(); } catch (e) {}
                    resolve(true);
                    return;
                }
                if (tries < 6) {
                    setTimeout(poll, 350);
                } else {
                    try { el.remove(); } catch (e) {}
                    resolve(false);
                }
            }
            setTimeout(poll, 350);
        });
    }

    // ── MÉTODO 3: Script cebo con verificación de variable ────────────────────
    // Funciona para extensiones de navegador (uBlock, ABP, AdGuard extensión)
    // que bloquean por nombre de archivo. No funciona bien en Brave móvil (bloquea
    // por dominio), pero sirve como capa extra para extensiones en desktop.
    function scriptBaitCheck() {
        return new Promise(function (resolve) {
            window.__ugAdsOk = false;
            var done = false;

            var timer = setTimeout(function () {
                if (!done) { done = true; resolve(true); }
            }, 4000);

            var el = document.createElement('script');
            el.src = '/ultrax/js/adsbygoogle.js?t=' + Date.now();

            el.onload = function () {
                if (done) return;
                done = true;
                clearTimeout(timer);
                // Si el script corrió, __ugAdsOk = true. Si Brave devolvió vacío, sigue false.
                resolve(!window.__ugAdsOk);
                el.remove();
            };
            el.onerror = function () {
                if (done) return;
                done = true;
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
    // Los tres métodos corren en paralelo. El primero que detecte bloqueo
    // muestra el overlay inmediatamente sin esperar a los demás.
    function run() {
        var shown = false;
        function check(blocked) {
            if (blocked && !shown) {
                shown = true;
                showOverlay();
            }
        }
        baitInsCheck().then(check);
        baitDivCheck().then(check);
        scriptBaitCheck().then(check);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
