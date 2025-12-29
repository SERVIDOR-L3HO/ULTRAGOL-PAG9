
(function() {
    // Función para verificar si hay un código promocional activo
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

    // Crear el overlay de bloqueo
    const overlay = document.createElement('div');
    overlay.id = 'adblock-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 999999;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        text-align: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        padding: 20px;
    `;

    overlay.innerHTML = `
        <div style="max-width: 500px; background: #1a1a1a; padding: 40px; border-radius: 15px; border: 2px solid #ff4d4d; box-shadow: 0 0 30px rgba(255, 77, 77, 0.2);">
            <div style="font-size: 60px; margin-bottom: 20px;">🚫</div>
            <h2 style="color: #ff4d4d; margin-bottom: 15px; font-size: 24px;">¡BLOQUEADOR DETECTADO!</h2>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">Detectamos que estás usando un bloqueador de anuncios, DNS filtrada o VPN. Para seguir disfrutando de <strong>ULTRAGOL</strong> gratis, por favor desactívalo y recarga la página.</p>
            <button onclick="window.location.reload()" style="background: #ff4d4d; color: white; border: none; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 5px; cursor: pointer; transition: transform 0.2s;">
                RECARGAR PÁGINA
            </button>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">Nuestra plataforma se mantiene gracias a la publicidad. ¡Gracias por tu apoyo!</p>
        </div>
    `;

    document.body.appendChild(overlay);

    async function checkAdBlock() {
        if (hasActivePromo()) {
            overlay.style.display = 'none';
            return;
        }

        let isBlocked = false;

        // Prueba 1: Cargar un script falso de publicidad
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox ads google-ads ad-unit';
        testAd.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px;';
        document.body.appendChild(testAd);
        
        if (testAd.offsetHeight === 0) {
            isBlocked = true;
        }
        document.body.removeChild(testAd);

        // Prueba 2: Fetch a un dominio de anuncios común
        if (!isBlocked) {
            try {
                const response = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-store'
                });
            } catch (e) {
                isBlocked = true;
            }
        }

        // Prueba 3: Verificar DNS/VPN mediante latencia a trackers (opcional, pero potente)
        if (!isBlocked) {
            try {
                await fetch('https://google-analytics.com/analytics.js', { mode: 'no-cors' });
            } catch (e) {
                isBlocked = true;
            }
        }

        if (isBlocked) {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else {
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Ejecutar verificación inicial y periódica
    setTimeout(checkAdBlock, 2000);
    setInterval(checkAdBlock, 5000);
})();
