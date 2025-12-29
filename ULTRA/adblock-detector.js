
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

    if (hasActivePromo()) return;

    const overlay = document.createElement('div');
    overlay.id = 'adblock-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.98); z-index: 999999;
        display: none; flex-direction: column; align-items: center;
        justify-content: center; color: white; text-align: center;
        font-family: 'Segoe UI', sans-serif; padding: 20px;
        backdrop-filter: blur(10px);
    `;

    overlay.innerHTML = `
        <div style="max-width: 500px; background: #111; padding: 40px; border-radius: 20px; border: 2px solid #ff4d4d; box-shadow: 0 0 50px rgba(255, 77, 77, 0.3);">
            <div style="font-size: 70px; margin-bottom: 25px; animation: shake 0.5s infinite;">🚫</div>
            <h2 style="color: #ff4d4d; margin-bottom: 20px; font-size: 28px; font-weight: 800; letter-spacing: 1px;">ACCESO BLOQUEADO</h2>
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px; color: #eee;">Detectamos un <b>Bloqueador de Anuncios, DNS Filtrada (AdGuard/NextDNS) o VPN</b> activa.</p>
            <p style="font-size: 15px; line-height: 1.5; margin-bottom: 30px; color: #aaa;">ULTRAGOL es gratuito gracias a la publicidad. Por favor, desactiva cualquier filtro y recarga la página para continuar.</p>
            <button onclick="window.location.reload()" style="background: #ff4d4d; color: white; border: none; padding: 15px 40px; font-size: 18px; font-weight: bold; border-radius: 50px; cursor: pointer; transition: 0.3s; box-shadow: 0 5px 15px rgba(255, 77, 77, 0.4);">
                YA LO DESACTIVÉ, RECARGAR
            </button>
            <style>
                @keyframes shake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(5deg); } 75% { transform: rotate(-5deg); } }
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

        // Prueba 1: Detección por Honey-pot (Clases CSS)
        const honeyPot = document.createElement('div');
        honeyPot.className = 'adsbox ad-unit doubleclick-ad ads-google test-ad';
        honeyPot.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px;';
        document.body.appendChild(honeyPot);
        if (honeyPot.offsetHeight === 0 || window.getComputedStyle(honeyPot).display === 'none') {
            isBlocked = true;
        }
        document.body.removeChild(honeyPot);

        // Prueba 2: Detección de DNS/VPN (La más potente para AdGuard/DNS)
        if (!isBlocked) {
            const trapUrls = [
                'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
                'https://googleads.g.doubleclick.net/pagead/ads',
                'https://static.ads-twitter.com/uwt.js',
                'https://connect.facebook.net/en_US/fbevents.js'
            ];

            const checks = trapUrls.map(url => 
                fetch(url, { mode: 'no-cors', cache: 'no-store' })
                .catch(() => { throw new Error('Blocked'); })
            );

            try {
                await Promise.all(checks);
            } catch (e) {
                isBlocked = true;
            }
        }

        // Prueba 3: Verificación de variables globales (Inyectado por extensiones)
        if (!isBlocked && (window.adblock || window.adblocker || window.canRunAds === false)) {
            isBlocked = true;
        }

        if (isBlocked) {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // Bloqueo agresivo: si intentan borrar el overlay, recargar
            const observer = new MutationObserver(() => {
                if (!document.getElementById('adblock-overlay')) window.location.reload();
            });
            observer.observe(document.body, { childList: true });
        } else {
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Ejecución inmediata y recurrente
    checkBlocking();
    setInterval(checkBlocking, 3000);
})();
