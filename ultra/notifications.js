// UltraGol Notifications System
class NotificationManager {
    constructor() {
        this.checkInterval = null;
        this.shownIds = new Set(
            JSON.parse(localStorage.getItem('shownNotifIds') || '[]')
        );
        this.lastChecked = parseInt(localStorage.getItem('notifLastChecked') || '0');
    }

    get permission() {
        // Always read the real browser state, never stale localStorage
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission;
    }

    async init() {
        console.log('🔔 Initializing Notification System...');

        const modalShown = localStorage.getItem('notificationModalShown') === 'true';

        if (this.permission === 'granted') {
            this.startPolling();
        } else if (this.permission === 'default' && !modalShown) {
            setTimeout(() => this.showPermissionModal(), 3000);
        }
        // If denied: do nothing (respect user choice)
    }

    showPermissionModal() {
        // Don't stack modals
        if (document.querySelector('.notification-permission-modal')) return;

        localStorage.setItem('notificationModalShown', 'true');

        const modal = document.createElement('div');
        modal.className = 'notification-permission-modal';
        modal.innerHTML = `
            <div class="notification-modal-overlay"></div>
            <div class="notification-modal-content">
                <div class="notification-modal-header">
                    <i class="fas fa-bell notification-icon"></i>
                    <h2>¡Activa las notificaciones!</h2>
                </div>
                <div class="notification-modal-body">
                    <p>Recibe alertas en tiempo real sobre:</p>
                    <ul>
                        <li><i class="fas fa-futbol"></i> Partidos en vivo</li>
                        <li><i class="fas fa-trophy"></i> Goles y resultados</li>
                        <li><i class="fas fa-newspaper"></i> Noticias del fútbol</li>
                        <li><i class="fas fa-calendar"></i> Próximos encuentros</li>
                    </ul>
                    <div class="notification-privacy">Recibirás notificaciones de todos los partidos y eventos importantes</div>
                </div>
                <div class="notification-modal-footer">
                    <button class="btn-secondary" id="notificationDeny">
                        <i class="fas fa-times"></i> No, gracias
                    </button>
                    <button class="btn-primary" id="notificationAllow">
                        <i class="fas fa-check"></i> Activar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.querySelector('.notification-modal-content').classList.add('show');
        }, 100);

        document.getElementById('notificationDeny').addEventListener('click', () => {
            this.closeModal(modal);
            this.showMessage('Puedes activarlas más tarde desde la configuración', 'info');
        });

        document.getElementById('notificationAllow').addEventListener('click', () => {
            this.requestPermission(modal);
        });
    }

    async requestPermission(modal) {
        if (!('Notification' in window)) {
            this.showMessage('Tu navegador no soporta notificaciones', 'error');
            this.closeModal(modal);
            return;
        }

        try {
            const result = await Notification.requestPermission();

            this.closeModal(modal);

            if (result === 'granted') {
                this.showMessage('¡Notificaciones activadas! ✅', 'success');
                this.startPolling();
                await this._subscribePush();
                // Send a welcome notification
                setTimeout(() => this._fire('¡Bienvenido a UltraGol! ⚽', {
                    body: 'Recibirás alertas de partidos en vivo y resultados',
                    tag: 'welcome',
                    icon: '/app-icon.png',
                    badge: '/favicon.png'
                }), 1000);
            } else {
                this.showMessage('Notificaciones desactivadas', 'info');
            }
        } catch (err) {
            console.error('❌ Error requesting permission:', err);
            if (modal) this.closeModal(modal);
        }
    }

    async _subscribePush() {
        if (!('PushManager' in window)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            // Check if already subscribed
            const existing = await reg.pushManager.getSubscription();
            if (existing) {
                console.log('📲 Ya suscrito a Web Push');
                return;
            }
            // Get public VAPID key from server
            const { publicKey } = await fetch('/api/vapid-key').then(r => r.json());
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this._urlBase64ToUint8Array(publicKey)
            });
            // Send subscription to server
            await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub)
            });
            console.log('✅ Suscripción Web Push guardada en servidor');
        } catch (err) {
            console.warn('⚠️ Web Push no disponible:', err.message);
        }
    }

    _urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw = atob(base64);
        return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
    }

    closeModal(modal) {
        if (!modal) return;
        const content = modal.querySelector('.notification-modal-content');
        if (content) content.classList.remove('show');
        setTimeout(() => { if (modal.parentNode) modal.remove(); }, 300);
    }

    startPolling() {
        if (this.checkInterval) return; // already running
        console.log('🔔 Starting notifications polling...');
        this._check();
        this.checkInterval = setInterval(() => this._check(), 60000);
        this._connectSSE();
        // Ensure push subscription is active (re-subscribes if needed)
        this._subscribePush().catch(() => {});
    }

    stopPolling() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        if (this.sse) {
            this.sse.close();
            this.sse = null;
        }
    }

    _connectSSE() {
        if (!('EventSource' in window)) return;
        if (this.sse) return; // already connected
        try {
            this.sse = new EventSource('/api/notifications/stream');
            this.sse.onmessage = (e) => {
                try {
                    const n = JSON.parse(e.data);
                    if (n.type === 'connected') {
                        console.log('📡 SSE canal en tiempo real conectado');
                        return;
                    }
                    if (n.id && !this.shownIds.has(n.id) && this.permission === 'granted') {
                        this._fire(n.titulo || 'UltraGol', {
                            body: n.mensaje || '',
                            icon: n.icono || '/app-icon.png',
                            badge: '/favicon.png',
                            tag: n.id,
                            data: { url: n.url || '/' },
                            vibrate: [200, 100, 200]
                        });
                        this.shownIds.add(n.id);
                        localStorage.setItem('shownNotifIds', JSON.stringify([...this.shownIds]));
                        console.log(`📣 Notificación en tiempo real: "${n.titulo}"`);
                    }
                } catch (_) {}
            };
            this.sse.onerror = () => {
                // EventSource auto-reconnects on error — no action needed
                console.warn('📡 SSE reconectando…');
            };
        } catch (err) {
            console.warn('📡 SSE no disponible:', err.message);
        }
    }

    async _check() {
        if (this.permission !== 'granted') {
            this.stopPolling();
            return;
        }

        try {
            const url = `/api/notifications?since=${this.lastChecked}`;
            const res = await fetch(url);
            if (!res.ok) return;

            const data = await res.json();
            const list = data.notificaciones || [];

            console.log(`🔔 Notifications check: ${list.length} new`);

            list.forEach(n => {
                if (!this.shownIds.has(n.id)) {
                    this._fire(n.titulo || 'UltraGol', {
                        body: n.mensaje || '',
                        icon: n.icono || '/app-icon.png',
                        badge: '/favicon.png',
                        tag: n.id,
                        data: { url: n.url || '/' },
                        vibrate: [150, 80, 150]
                    });
                    this.shownIds.add(n.id);
                    // Cap stored IDs at 100
                    if (this.shownIds.size > 100) {
                        this.shownIds.delete(this.shownIds.values().next().value);
                    }
                }
            });

            // Persist shown IDs
            localStorage.setItem('shownNotifIds', JSON.stringify([...this.shownIds]));
            this.lastChecked = Date.now();
            localStorage.setItem('notifLastChecked', this.lastChecked);
        } catch (err) {
            console.error('❌ Notification check error:', err);
        }
    }

    async _fire(title, options = {}) {
        try {
            if ('serviceWorker' in navigator) {
                const reg = await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise((_, rej) => setTimeout(() => rej(), 5000))
                ]).catch(() => navigator.serviceWorker.getRegistration());

                if (reg) {
                    await reg.showNotification(title, options);
                    return;
                }
            }
            // Fallback to direct Notification
            const n = new Notification(title, options);
            if (options.data?.url) {
                n.onclick = (e) => {
                    e.preventDefault();
                    window.focus();
                    window.location.href = options.data.url;
                    n.close();
                };
            }
        } catch (err) {
            console.error('❌ Error firing notification:', err);
        }
    }

    showMessage(message, type = 'info') {
        try {
            if (!document.body) return;
            const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
            const toast = document.createElement('div');
            toast.className = `notification-toast ${type}`;
            toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
            document.body.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 50);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
            }, 3500);
        } catch (_) {}
    }

    // Public helpers for manual control
    enable() {
        if (this.permission === 'granted') {
            this.showMessage('Las notificaciones ya están activas ✅', 'info');
            if (!this.checkInterval) this.startPolling();
        } else if (this.permission === 'denied') {
            this.showMessage('Notificaciones bloqueadas. Actívalas desde la configuración del navegador (ícono 🔒 en la barra de dirección)', 'error');
        } else {
            localStorage.removeItem('notificationModalShown');
            this.showPermissionModal();
        }
    }

    disable() {
        this.stopPolling();
        this.showMessage('Notificaciones desactivadas', 'info');
    }

    status() {
        console.log('📊 Estado notificaciones:');
        console.log('  Permiso real:', this.permission);
        console.log('  Polling activo:', !!this.checkInterval);
        console.log('  IDs mostrados:', this.shownIds.size);
        console.log('  Último chequeo:', this.lastChecked ? new Date(this.lastChecked).toLocaleString('es-MX') : 'Nunca');
        console.log('\n💡 Comandos: activarNotificaciones() | desactivarNotificaciones() | estadoNotificaciones()');
    }
}

if (typeof window !== 'undefined') {
    window.notificationManager = new NotificationManager();

    // Global helper functions
    window.activarNotificaciones  = () => window.notificationManager.enable();
    window.desactivarNotificaciones = () => window.notificationManager.disable();
    window.estadoNotificaciones   = () => window.notificationManager.status();
    window.limpiarNotificaciones  = () => {
        localStorage.removeItem('shownNotifIds');
        localStorage.removeItem('notifLastChecked');
        localStorage.removeItem('notificationModalShown');
        console.log('✅ Cache de notificaciones limpiado. Recarga la página.');
    };

    const go = () => {
        window.notificationManager.init();
        console.log('\n💡 Sistema de notificaciones listo. Usa estadoNotificaciones() para ver el estado.');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', go);
    } else {
        go();
    }
}

console.log('✅ Notification Manager loaded');
