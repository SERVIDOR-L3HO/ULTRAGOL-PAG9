
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

    const overlayId = 'ultragol-security-overlay';
    let isBlockedGlobal = false;

    function createOverlay() {
        if (document.getElementById(overlayId)) return;
        
        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.style.cssText = `
            position: fixed !important; top: 0 !important; left: 0 !important; 
            width: 100% !important; height: 100% !important;
            background: rgba(0, 0, 0, 0.99) !important; z-index: 2147483647 !important;
            display: none; flex-direction: column !important; align-items: center !important;
            justify-content: center !important; color: white !important; text-align: center !important;
            font-family: 'Segoe UI', Tahoma, sans-serif !important; padding: 20px !important;
            backdrop-filter: blur(20px) !important; -webkit-backdrop-filter: blur(20px) !important;
        `;

        overlay.innerHTML = `
            <div style="max-width: 500px; background: #000; padding: 40px; border-radius: 20px; border: 2px solid #ff4d4d; box-shadow: 0 0 100px rgba(255, 77, 77, 0.5);">
                <div style="font-size: 80px; margin-bottom: 25px; filter: drop-shadow(0 0 10px #ff4d4d);">🚨</div>
                <h2 style="color: #ff4d4d; margin-bottom: 20px; font-size: 32px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">Acceso Denegado</h2>
                <p style="font-size: 19px; line-height: 1.6; margin-bottom: 30px; color: #fff; font-weight: 600;">Detectamos <b>AdGuard DNS</b>, <b>Brave Shields</b> o un bloqueo de red activo.</p>
                <p style="font-size: 15px; line-height: 1.5; margin-bottom: 30px; color: #ccc;">Para acceder a <b>ULTRAGOL</b>, debes desactivar tu bloqueador o DNS filtrada y recargar la página.</p>
                <button onclick="location.reload()" style="background: #ff4d4d; color: white; border: none; padding: 18px 45px; font-size: 20px; font-weight: 900; border-radius: 50px; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 25px rgba(255, 77, 77, 0.5); text-transform: uppercase;">
                    Reintentar Acceso
                </button>
            </div>
        `;

        document.documentElement.appendChild(overlay);
    }

    async function checkAdBlock() {
        if (hasActivePromo()) {
            const overlay = document.getElementById(overlayId);
            if (overlay) overlay.style.display = 'none';
            return;
        }

        let isBlocked = false;

        // 1. Detección de DNS (AdGuard) - Verificando dominios bloqueados conocidos
        const trapUrls = [
            'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
            'https://googleads.g.doubleclick.net/pagead/ads',
            'https://static.ads-twitter.com/uwt.js',
            'https://connect.facebook.net/en_US/fbevents.js'
        ];

        try {
            await Promise.any(trapUrls.map(url => 
                fetch(url, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(2000) })
            ));
        } catch (e) {
            isBlocked = true;
        }

        // 2. Verificación de Brave o Bloqueo Cosmético (Shadow DOM/Ocultamiento)
        if (!isBlocked) {
            const b = document.createElement('div');
            b.className = 'ad-label ad-slot ads-google pub_300x250 ad-container';
            b.style.cssText = 'position:fixed; top:-100px; left:-100px; width:10px; height:10px; display:block !important;';
            document.documentElement.appendChild(b);
            const style = window.getComputedStyle(b);
            if (style.display === 'none' || style.visibility === 'hidden' || b.offsetHeight === 0) {
                isBlocked = true;
            }
            document.documentElement.removeChild(b);
        }

        // 3. Persistencia del estado de bloqueo
        if (isBlocked) isBlockedGlobal = true;

        const overlay = document.getElementById(overlayId);
        if (isBlockedGlobal && overlay) {
            overlay.style.display = 'flex';
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            
            // Si el bloqueo fue detectado, nos aseguramos de que el overlay no se quite
            // Incluso si una petición posterior parece "pasar" (falso negativo)
        }
    }

    // Ejecución ultra-rápida
    createOverlay();
    checkAdBlock();
    
    // Verificación constante (cada segundo para AdGuard que a veces tarda en responder)
    setInterval(checkAdBlock, 1000);

    // Anti-tamper persistente
    const observer = new MutationObserver(() => {
        if (!document.getElementById(overlayId) && !hasActivePromo()) {
            location.reload();
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
