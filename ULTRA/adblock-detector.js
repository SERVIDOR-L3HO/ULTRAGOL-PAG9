
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
                <p style="font-size: 19px; line-height: 1.6; margin-bottom: 30px; color: #fff; font-weight: 600;">Detectamos un <b>Bloqueador de Anuncios</b> o <b>Brave Shields</b> activo.</p>
                <p style="font-size: 15px; line-height: 1.5; margin-bottom: 30px; color: #ccc;">Para acceder a <b>ULTRAGOL</b>, debes desactivar tu bloqueador o los escudos de Brave y recargar la página.</p>
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
            if (overlay) {
                overlay.style.display = 'none';
                document.documentElement.style.overflow = 'auto';
                document.body.style.overflow = 'auto';
            }
            return;
        }

        let isBlocked = false;

        // TÉCNICA 1: Petición de red silenciosa (Detecta DNS/Brave)
        const trapUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        try {
            await fetch(trapUrl, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(2500) });
        } catch (e) {
            isBlocked = true;
        }

        // TÉCNICA 2: Elemento fantasma (Detecta uBlock/AdBlock/Brave Shields)
        if (!isBlocked) {
            const b = document.createElement('div');
            // Usamos nombres de clase que los bloqueadores SIEMPRE ocultan
            b.className = 'ad-label ad-slot ads-google pub_300x250 ad-container ads-box';
            b.style.cssText = 'position:fixed; top:-1000px; left:-1000px; width:10px; height:10px; opacity:0; pointer-events:none;';
            document.documentElement.appendChild(b);
            
            // Damos un milisegundo al navegador para aplicar las reglas de bloqueo cosmético
            await new Promise(r => setTimeout(r, 50));
            
            const style = window.getComputedStyle(b);
            if (style.display === 'none' || style.visibility === 'hidden' || b.offsetHeight === 0) {
                isBlocked = true;
            }
            document.documentElement.removeChild(b);
        }

        const overlay = document.getElementById(overlayId);
        if (overlay) {
            if (isBlocked) {
                overlay.style.display = 'flex';
                document.documentElement.style.overflow = 'hidden';
                document.body.style.overflow = 'hidden';
            } else {
                overlay.style.display = 'none';
                document.documentElement.style.overflow = 'auto';
                document.body.style.overflow = 'auto';
            }
        }
    }

    // Iniciar con un retraso para no interferir con la carga inicial de los anuncios reales
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            createOverlay();
            setTimeout(checkAdBlock, 2000);
        });
    } else {
        createOverlay();
        setTimeout(checkAdBlock, 2000);
    }
    
    // Verificación periódica menos frecuente para ahorrar recursos
    setInterval(checkAdBlock, 8000);

    // Anti-tamper
    const observer = new MutationObserver((mutations) => {
        if (!document.getElementById(overlayId) && !hasActivePromo()) {
            location.reload();
        }
    });
    observer.observe(document.documentElement, { childList: true });
})();
