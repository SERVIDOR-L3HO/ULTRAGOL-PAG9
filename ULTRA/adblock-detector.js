// Anti-AdBlock Detector and Manager
(function() {
    'use strict';

    // Detectar AdBlock
    function detectAdBlock() {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.id = 'ads-google';
            
            iframe.onload = function() {
                resolve(false); // Sin adblock
            };
            
            iframe.onerror = function() {
                resolve(true); // Con adblock
            };
            
            // Intentar cargar un elemento de Google Ads
            iframe.src = 'data:text/html,<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-3612607805789879" data-ad-slot="0000000000"></ins>';
            document.body.appendChild(iframe);
            
            // Timeout como medida adicional
            setTimeout(() => {
                resolve(false);
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 3000);
        });
    }

    // Función alternativa: detectar por request bloqueado
    function checkGoogleAdsLoaded() {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Verificar si Google Ads cargó correctamente
                if (window.adsbygoogle !== undefined) {
                    resolve(false); // Sin adblock
                } else {
                    resolve(true); // Probablemente con adblock
                }
            }, 2000);
        });
    }

    // Inicializar detección
    async function init() {
        try {
            const hasAdblock = await Promise.race([
                detectAdBlock(),
                checkGoogleAdsLoaded().then(result => result)
            ]);

            if (hasAdblock) {
                console.warn('⚠️ Se ha detectado un bloqueador de anuncios activo');
                document.documentElement.classList.add('adblock-detected');
                
                // Notificar al usuario (opcional)
                if (window.notifyAdblock) {
                    window.notifyAdblock();
                }
            } else {
                console.log('✅ Anuncios permitidos - sin bloqueador detectado');
                document.documentElement.classList.add('ads-enabled');
                
                // Forzar que Google Ads procese los anuncios
                if (window.adsbygoogle) {
                    try {
                        window.adsbygoogle.push({});
                    } catch (e) {
                        console.error('Error al procesar anuncios:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error en detección de adblock:', error);
            // Por defecto, permitir anuncios
            document.documentElement.classList.add('ads-enabled');
        }
    }

    // Iniciar después de que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Exponer función global para forzar reprocesamiento de anuncios
    window.retryGoogleAds = function() {
        if (window.adsbygoogle) {
            try {
                window.adsbygoogle.push({});
                console.log('🔄 Anuncios reprocesados');
            } catch (e) {
                console.error('Error al reprocesar anuncios:', e);
            }
        }
    };

    // Monitoreo periódico de anuncios
    setInterval(() => {
        if (window.adsbygoogle && document.querySelectorAll('.adsbygoogle').length > 0) {
            try {
                window.adsbygoogle.push({});
            } catch (e) {
                // Error silencioso
            }
        }
    }, 5000);
})();
