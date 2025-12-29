
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

        const target = document.body || document.documentElement;
        if (target) target.appendChild(overlay);
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

        // TÉCNICA 1: Petición de red silenciosa
        const trapUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        try {
            await fetch(trapUrl, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(2500) });
        } catch (e) {
            isBlocked = true;
        }

        // TÉCNICA 2: Elemento fantasma
        if (!isBlocked) {
            const b = document.createElement('div');
            b.className = 'ad-label ad-slot ads-google pub_300x250 ad-container ads-box';
            b.style.cssText = 'position:fixed; top:-1000px; left:-1000px; width:10px; height:10px; opacity:0; pointer-events:none;';
            (document.body || document.documentElement).appendChild(b);
            
            await new Promise(r => setTimeout(r, 100));
            
            const style = window.getComputedStyle(b);
            if (style.display === 'none' || style.visibility === 'hidden' || b.offsetHeight === 0) {
                isBlocked = true;
            }
            (document.body || document.documentElement).removeChild(b);
        }

        const overlay = document.getElementById(overlayId);
        if (overlay) {
            if (isBlocked) {
                overlay.style.display = 'flex';
                document.documentElement.style.overflow = 'hidden';
                if (document.body) document.body.style.overflow = 'hidden';
            } else {
                overlay.style.display = 'none';
                document.documentElement.style.overflow = 'auto';
                if (document.body) document.body.style.overflow = 'auto';
            }
        }
    }

    // Iniciar con seguridad
    function start() {
        createOverlay();
        setTimeout(checkAdBlock, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
    
    setInterval(checkAdBlock, 10000);

    const observer = new MutationObserver(() => {
        if (!document.getElementById(overlayId) && !hasActivePromo()) {
            location.reload();
        }
    });
    observer.observe(document.documentElement, { childList: true });
})();
