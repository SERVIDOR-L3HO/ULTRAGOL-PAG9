
(function() {
    function hasActivePromo() {
        try {
            const stored = localStorage.getItem('ultragol_promo_status');
            if (stored) {
                const status = JSON.parse(stored);
                return status.expiresAt && new Date().getTime() < status.expiresAt;
            }
        } catch(e) {}
        return false;
    }

    function init() {
        if (hasActivePromo()) return;

        const overlay = document.createElement('div');
        overlay.id = 'adblock-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.98); z-index: 999999;
            display: none; flex-direction: column; align-items: center;
            justify-content: center; color: white; text-align: center;
            font-family: 'Segoe UI', sans-serif; padding: 20px;
            backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
        `;

        overlay.innerHTML = `
            <div style="max-width: 500px; background: #111; padding: 40px; border-radius: 20px; border: 2px solid #ff4d4d; box-shadow: 0 0 50px rgba(255, 77, 77, 0.4);">
                <div style="font-size: 70px; margin-bottom: 25px; animation: pulse-red 2s infinite;">🚫</div>
                <h2 style="color: #ff4d4d; margin-bottom: 20px; font-size: 28px; font-weight: 800; letter-spacing: 1px;">SISTEMA BLOQUEADO</h2>
                <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px; color: #eee;">Detectamos <b>Brave Shields</b>, <b>AdGuard</b> o un bloqueo activo.</p>
                <p style="font-size: 15px; line-height: 1.5; margin-bottom: 30px; color: #aaa;">Para seguir usando ULTRAGOL gratis, desactiva el bloqueo de anuncios (Shields) y recarga la página.</p>
                <button onclick="window.location.reload()" style="background: #ff4d4d; color: white; border: none; padding: 15px 40px; font-size: 18px; font-weight: bold; border-radius: 50px; cursor: pointer; transition: 0.3s; box-shadow: 0 5px 15px rgba(255, 77, 77, 0.4);">
                    RECARGAR PÁGINA
                </button>
                <style>
                    @keyframes pulse-red { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
                </style>
            </div>
        `;

        document.body.appendChild(overlay);

        async function checkBlocking() {
            if (hasActivePromo()) {
                overlay.style.display = 'none';
                document.body.style.overflow = 'auto';
                return;
            }

            let isBlocked = false;

            // 1. Detección específica para Brave (Shields) y Bloqueadores agresivos
            // Brave bloquea peticiones a dominios de trackers y ads incluso con 'no-cors'
            const trapUrls = [
                'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
                'https://googleads.g.doubleclick.net/pagead/ads',
                'https://adservice.google.com/adsid/google/ui',
                'https://analytics.google.com/analytics/collect',
                'https://stats.g.doubleclick.net/g/collect'
            ];

            try {
                // Si Brave Shields está activo, estas peticiones fallarán inmediatamente
                await Promise.any(trapUrls.map(url => 
                    fetch(url, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(2000) })
                ));
            } catch (e) {
                isBlocked = true;
            }

            // 2. Verificación de Brave Browser Object
            if (!isBlocked && navigator.brave && await navigator.brave.isBrave()) {
                // Si es Brave, forzamos una verificación extra de un elemento que Brave SIEMPRE oculta
                const braveTest = document.createElement('div');
                braveTest.className = 'ad-provider ads-container google-ads-container';
                braveTest.style.cssText = 'position: absolute; left: -9999px; width: 10px; height: 10px; display: block !important;';
                document.body.appendChild(braveTest);
                if (window.getComputedStyle(braveTest).display === 'none' || braveTest.offsetHeight === 0) {
                    isBlocked = true;
                }
                document.body.removeChild(braveTest);
            }

            // 3. Honeypot Genérico (CSS)
            if (!isBlocked) {
                const honeyPot = document.createElement('div');
                honeyPot.className = 'adsbox ad-unit doubleclick-ad ads-google test-ad';
                honeyPot.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px; display: block !important;';
                document.body.appendChild(honeyPot);
                if (honeyPot.offsetHeight === 0 || window.getComputedStyle(honeyPot).display === 'none') {
                    isBlocked = true;
                }
                document.body.removeChild(honeyPot);
            }

            if (isBlocked) {
                overlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            } else {
                overlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }

        // Ejecución inmediata y recurrente
        checkBlocking();
        setInterval(checkBlocking, 3000);
        
        // Anti-manipulación
        const observer = new MutationObserver(() => {
            if (!document.getElementById('adblock-overlay') && !hasActivePromo()) window.location.reload();
        });
        observer.observe(document.body, { childList: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
