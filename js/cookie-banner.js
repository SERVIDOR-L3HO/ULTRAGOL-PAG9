/**
 * Sistema de Banner de Consentimiento de Cookies para UltraGol
 * Conforme a GDPR 2025
 */

class CookieBanner {
    constructor() {
        this.apiEndpoint = '/api/cookie-consent';
        this.bannerElement = null;
        this.preferences = {
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false
        };
        
        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        this.checkExistingConsent();
        this.createBanner();
        this.bindEvents();
        this.showBannerIfNeeded();
    }
    
    checkExistingConsent() {
        const consent = this.getCookie('cookieConsent');
        if (consent) {
            try {
                this.preferences = JSON.parse(consent);
                this.applyConsentSettings();
                return true;
            } catch (e) {
                console.warn('Error parsing cookie consent:', e);
                return false;
            }
        }
        return false;
    }
    
    createBanner() {
        // Verificar si ya existe el banner
        if (document.getElementById('cookie-banner')) {
            this.bannerElement = document.getElementById('cookie-banner');
            return;
        }
        
        const bannerHTML = `
            <div id="cookie-banner" class="cookie-banner">
                <div class="cookie-banner-content">
                    <h3>🔒 Uso de Cookies</h3>
                    <p>
                        Utilizamos cookies para mejorar tu experiencia en UltraGol, personalizar contenido y analizar el tráfico. 
                        Las cookies esenciales son necesarias para el funcionamiento del sitio. Puedes gestionar tus preferencias a continuación.
                    </p>
                    
                    <div class="cookie-categories">
                        <div class="cookie-category">
                            <label>
                                <input type="checkbox" id="necessary-consent" checked disabled>
                                <span>Cookies Necesarias</span>
                            </label>
                            <div class="cookie-category-description">
                                Esenciales para el funcionamiento del sitio web, autenticación y seguridad.
                            </div>
                        </div>
                        
                        <div class="cookie-category">
                            <label>
                                <input type="checkbox" id="analytics-consent">
                                <span>Cookies de Análisis</span>
                            </label>
                            <div class="cookie-category-description">
                                Nos ayudan a entender cómo los usuarios interactúan con el sitio web.
                            </div>
                        </div>
                        
                        <div class="cookie-category">
                            <label>
                                <input type="checkbox" id="marketing-consent">
                                <span>Cookies de Marketing</span>
                            </label>
                            <div class="cookie-category-description">
                                Utilizadas para personalizar anuncios y mostrar contenido relevante.
                            </div>
                        </div>
                        
                        <div class="cookie-category">
                            <label>
                                <input type="checkbox" id="preferences-consent">
                                <span>Cookies de Preferencias</span>
                            </label>
                            <div class="cookie-category-description">
                                Recuerdan tus preferencias y configuraciones personalizadas.
                            </div>
                        </div>
                    </div>
                    
                    <div class="cookie-actions">
                        <button type="button" id="accept-selected" class="cookie-btn cookie-btn-primary">
                            Aceptar Seleccionadas
                        </button>
                        <button type="button" id="accept-all" class="cookie-btn cookie-btn-secondary">
                            Aceptar Todas
                        </button>
                        <button type="button" id="reject-all" class="cookie-btn cookie-btn-outline">
                            Solo Esenciales
                        </button>
                    </div>
                    
                    <div class="cookie-links">
                        <a href="/privacy-policy" target="_blank">Política de Privacidad</a>
                        <span>|</span>
                        <a href="/cookie-policy" target="_blank">Política de Cookies</a>
                        <span>|</span>
                        <a href="#" id="manage-cookies">Gestionar Cookies</a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', bannerHTML);
        this.bannerElement = document.getElementById('cookie-banner');
    }
    
    bindEvents() {
        // Botones principales
        document.getElementById('accept-selected')?.addEventListener('click', () => this.acceptSelected());
        document.getElementById('accept-all')?.addEventListener('click', () => this.acceptAll());
        document.getElementById('reject-all')?.addEventListener('click', () => this.rejectAll());
        document.getElementById('manage-cookies')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showBanner();
        });
        
        // Checkboxes
        document.getElementById('analytics-consent')?.addEventListener('change', (e) => {
            this.preferences.analytics = e.target.checked;
        });
        document.getElementById('marketing-consent')?.addEventListener('change', (e) => {
            this.preferences.marketing = e.target.checked;
        });
        document.getElementById('preferences-consent')?.addEventListener('change', (e) => {
            this.preferences.preferences = e.target.checked;
        });
    }
    
    showBannerIfNeeded() {
        if (!this.checkExistingConsent()) {
            setTimeout(() => this.showBanner(), 1000); // Mostrar después de 1 segundo
        }
    }
    
    showBanner() {
        if (!this.bannerElement) return;
        
        // Actualizar checkboxes con preferencias actuales
        const analyticsCheckbox = document.getElementById('analytics-consent');
        const marketingCheckbox = document.getElementById('marketing-consent');
        const preferencesCheckbox = document.getElementById('preferences-consent');
        
        if (analyticsCheckbox) analyticsCheckbox.checked = this.preferences.analytics;
        if (marketingCheckbox) marketingCheckbox.checked = this.preferences.marketing;
        if (preferencesCheckbox) preferencesCheckbox.checked = this.preferences.preferences;
        
        this.bannerElement.classList.add('show');
        
        // Enfocar en el banner para accesibilidad
        this.bannerElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    
    hideBanner() {
        if (!this.bannerElement) return;
        
        this.bannerElement.classList.remove('show');
    }
    
    async acceptSelected() {
        const preferences = {
            necessary: true,
            analytics: document.getElementById('analytics-consent')?.checked || false,
            marketing: document.getElementById('marketing-consent')?.checked || false,
            preferences: document.getElementById('preferences-consent')?.checked || false
        };
        
        await this.saveConsent(preferences);
    }
    
    async acceptAll() {
        const preferences = {
            necessary: true,
            analytics: true,
            marketing: true,
            preferences: true
        };
        
        await this.saveConsent(preferences);
    }
    
    async rejectAll() {
        const preferences = {
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false
        };
        
        await this.saveConsent(preferences);
    }
    
    async saveConsent(preferences) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferences)
            });
            
            if (response.ok) {
                const result = await response.json();
                this.preferences = result.consent;
                this.applyConsentSettings();
                this.hideBanner();
                this.showConsentStatus('Preferencias de cookies guardadas exitosamente');
                
                // Recargar la página para aplicar los cambios de cookies
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                throw new Error('Error al guardar preferencias');
            }
        } catch (error) {
            console.error('Error saving consent:', error);
            this.showConsentStatus('Error al guardar las preferencias', 'error');
        }
    }
    
    async withdrawConsent() {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.preferences = { necessary: true, analytics: false, marketing: false, preferences: false };
                this.showConsentStatus('Consentimiento retirado exitosamente');
                
                // Recargar para limpiar cookies
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            console.error('Error withdrawing consent:', error);
            this.showConsentStatus('Error al retirar consentimiento', 'error');
        }
    }
    
    applyConsentSettings() {
        // Aplicar configuraciones basadas en el consentimiento
        if (this.preferences.analytics) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }
        
        if (this.preferences.marketing) {
            this.enableMarketing();
        } else {
            this.disableMarketing();
        }
        
        if (this.preferences.preferences) {
            this.enablePreferences();
        }
        
        // Disparar evento personalizado para otras partes de la aplicación
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
            detail: this.preferences
        }));
    }
    
    enableAnalytics() {
        // Habilitar Google Analytics si está configurado
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
        
        console.log('📊 Analytics cookies enabled');
    }
    
    disableAnalytics() {
        // Deshabilitar analytics
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }
        
        // Limpiar cookies de analytics existentes
        this.deleteCookie('_ga');
        this.deleteCookie('_gid');
        this.deleteCookie('_gat');
        
        console.log('📊 Analytics cookies disabled');
    }
    
    enableMarketing() {
        console.log('📢 Marketing cookies enabled');
    }
    
    disableMarketing() {
        // Limpiar cookies de marketing
        this.deleteCookie('_fbp');
        this.deleteCookie('_fbc');
        
        console.log('📢 Marketing cookies disabled');
    }
    
    enablePreferences() {
        console.log('⚙️ Preferences cookies enabled');
    }
    
    showConsentStatus(message, type = 'success') {
        // Crear o actualizar indicador de estado
        let statusElement = document.getElementById('consent-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'consent-status';
            statusElement.className = 'consent-status';
            document.body.appendChild(statusElement);
        }
        
        statusElement.textContent = message;
        statusElement.className = `consent-status show ${type}`;
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            statusElement.classList.remove('show');
        }, 3000);
    }
    
    // Utilidades para cookies
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }
    
    deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    }
    
    // Métodos públicos para gestión externa
    static getInstance() {
        if (!window.cookieBannerInstance) {
            window.cookieBannerInstance = new CookieBanner();
        }
        return window.cookieBannerInstance;
    }
    
    static showManagement() {
        const instance = CookieBanner.getInstance();
        instance.showBanner();
    }
    
    static withdraw() {
        const instance = CookieBanner.getInstance();
        instance.withdrawConsent();
    }
}

// Inicializar automáticamente
new CookieBanner();

// Exponer métodos globales para uso externo
window.CookieBanner = CookieBanner;