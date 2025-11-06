let deferredPrompt;
let installBannerDismissed = false;

const PWA_BANNER_STORAGE_KEY = 'pwa-banner-dismissed';
const PWA_BANNER_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

function isBannerDismissed() {
    const dismissedTime = localStorage.getItem(PWA_BANNER_STORAGE_KEY);
    if (!dismissedTime) return false;
    
    const currentTime = new Date().getTime();
    const timePassed = currentTime - parseInt(dismissedTime);
    
    return timePassed < PWA_BANNER_DISMISS_DURATION;
}

function dismissBanner() {
    const currentTime = new Date().getTime();
    localStorage.setItem(PWA_BANNER_STORAGE_KEY, currentTime.toString());
}

function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if (!isStandalone() && !isBannerDismissed()) {
        setTimeout(() => {
            showInstallBanner();
        }, 3000);
    }
});

function showInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner && !installBannerDismissed) {
        banner.classList.add('show');
    }
}

function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.classList.remove('show');
    }
}

async function installPWA() {
    if (!deferredPrompt) {
        return;
    }
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('✅ PWA instalada con éxito');
    } else {
        console.log('❌ Usuario rechazó la instalación');
    }
    
    deferredPrompt = null;
    hideInstallBanner();
    dismissBanner();
}

function closePWABanner() {
    installBannerDismissed = true;
    hideInstallBanner();
    dismissBanner();
}

window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalada exitosamente');
    hideInstallBanner();
    deferredPrompt = null;
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registrado:', registration.scope);
            })
            .catch((error) => {
                console.log('❌ Error al registrar Service Worker:', error);
            });
    });
}
