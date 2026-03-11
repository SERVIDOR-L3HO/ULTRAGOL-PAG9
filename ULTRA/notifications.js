// UltraGol Notifications System
class NotificationManager {
    constructor() {
        this.notificationPermission = localStorage.getItem('notificationPermission') || 'default';
        this.lastNotificationId = localStorage.getItem('lastNotificationId') || null;
        this.checkInterval = null;
        this.modalShown = localStorage.getItem('notificationModalShown') === 'true';
    }

    async init() {
        console.log('🔔 Initializing Notification System...');

        if (!this.modalShown) {
            setTimeout(() => this.showPermissionModal(), 3000);
        } else if (this.notificationPermission === 'granted') {
            this.startNotificationPolling();
        }
    }

    showPermissionModal() {
        localStorage.setItem('notificationModalShown', 'true');
        this.modalShown = true;

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
            this.denyNotifications(modal);
        });

        document.getElementById('notificationAllow').addEventListener('click', () => {
            this.requestNotificationPermission(modal);
        });
    }

    async requestNotificationPermission(modal) {
        if (!('Notification' in window)) {
            alert('Tu navegador no soporta notificaciones');
            this.closeModal(modal);
            return;
        }

        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                this.notificationPermission = 'granted';
                localStorage.setItem('notificationPermission', 'granted');
                this.closeModal(modal);
                this.showMessage('¡Notificaciones activadas!', 'success');
                this.startNotificationPolling();
                this.sendWelcomeNotification();
            } else {
                this.notificationPermission = 'denied';
                localStorage.setItem('notificationPermission', 'denied');
                this.closeModal(modal);
                this.showMessage('Notificaciones desactivadas', 'info');
            }
        } catch (error) {
            console.error('❌ Error requesting notification permission:', error);
            this.closeModal(modal);
        }
    }

    denyNotifications(modal) {
        this.notificationPermission = 'denied';
        localStorage.setItem('notificationPermission', 'denied');
        this.closeModal(modal);
        this.showMessage('Puedes activar las notificaciones más tarde desde la configuración', 'info');
    }

    closeModal(modal) {
        modal.querySelector('.notification-modal-content').classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }

    async sendWelcomeNotification() {
        if (this.notificationPermission === 'granted') {
            await this.showNotificationSafe('¡Bienvenido a UltraGol!', {
                body: 'Recibirás notificaciones de partidos y eventos en vivo',
                icon: '/app-icon.png',
                badge: '/favicon.png',
                tag: 'welcome'
            });
        }
    }

    async startNotificationPolling() {
        if (this.notificationPermission !== 'granted') return;

        console.log('🔔 Starting general notifications polling...');
        this.checkForNotifications();
        this.checkInterval = setInterval(() => this.checkForNotifications(), 60000);
    }

    async checkForNotifications() {
        try {
            const response = await fetch('https://ultragol-api-3.vercel.app/notificaciones/ligamx');

            if (!response.ok) {
                const fallback = await fetch('https://ultragol-api-3.vercel.app/notificaciones');
                if (!fallback.ok) return;
                const data = await fallback.json();
                this.processNotifications(data.notificaciones || []);
                return;
            }

            const data = await response.json();
            console.log('✅ Notifications loaded:', data.total);
            this.processNotifications(data.notificaciones || []);
        } catch (error) {
            console.error('❌ Error checking notifications:', error);
        }
    }

    processNotifications(notifications) {
        notifications.forEach(notif => {
            if (notif.id && notif.id !== this.lastNotificationId) {
                this.showNotification(notif);
                this.lastNotificationId = notif.id;
                localStorage.setItem('lastNotificationId', notif.id);
            }
        });
    }

    async showNotificationSafe(title, options) {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('SW timeout')), 10000)
                    )
                ]).catch(async () => {
                    return await navigator.serviceWorker.getRegistration() || null;
                });

                if (registration) {
                    await registration.showNotification(title, {
                        body: options.body,
                        icon: options.icon,
                        badge: options.badge,
                        tag: options.tag,
                        vibrate: options.vibrate,
                        requireInteraction: options.requireInteraction,
                        data: options.data || {}
                    });
                    return true;
                }
            }

            const notification = new Notification(title, options);
            if (options.data && options.data.url) {
                notification.onclick = (e) => {
                    e.preventDefault();
                    window.focus();
                    window.location.href = options.data.url;
                    notification.close();
                };
            }
            return true;
        } catch (error) {
            console.error('❌ Error showing notification:', error);
            return false;
        }
    }

    async showNotification(notificationData) {
        if (this.notificationPermission !== 'granted') return;

        await this.showNotificationSafe(
            notificationData.titulo || 'UltraGol',
            {
                body: notificationData.mensaje || notificationData.body || 'Nueva actualización',
                icon: notificationData.icono || notificationData.icon || '/app-icon.png',
                badge: '/favicon.png',
                tag: notificationData.id || `notif-${Date.now()}`,
                data: { url: notificationData.url || '/', ...notificationData },
                requireInteraction: false,
                vibrate: [200, 100, 200]
            }
        );
    }

    showMessage(message, type = 'info') {
        try {
            if (!document.body) return;

            const toast = document.createElement('div');
            toast.className = `notification-toast ${type}`;
            toast.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;

            document.body.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
            }, 3000);
        } catch (error) {
            console.error('❌ Error showing message:', error);
        }
    }

    stopNotificationPolling() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    enableNotifications() {
        if (!this.modalShown) {
            this.showPermissionModal();
        } else if (this.notificationPermission === 'denied') {
            alert('Las notificaciones están bloqueadas. Por favor, actívalas desde la configuración de tu navegador.');
        } else if (this.notificationPermission === 'granted') {
            this.showMessage('Las notificaciones ya están activas', 'info');
        }
    }

    disableNotifications() {
        this.stopNotificationPolling();
        this.notificationPermission = 'denied';
        localStorage.setItem('notificationPermission', 'denied');
        this.showMessage('Notificaciones desactivadas', 'info');
    }
}

if (typeof window !== 'undefined') {
    window.notificationManager = new NotificationManager();

    window.activarNotificaciones = function() {
        window.notificationManager.showPermissionModal();
    };

    window.limpiarNotificaciones = function() {
        localStorage.removeItem('notificationPermission');
        localStorage.removeItem('lastNotificationId');
        localStorage.removeItem('notificationModalShown');
        console.log('✅ Limpiado. Recarga la página para reiniciar.');
    };

    window.estadoNotificaciones = function() {
        console.log('📊 Estado de notificaciones:');
        console.log('  - Permiso:', Notification.permission);
        console.log('  - Guardado:', localStorage.getItem('notificationPermission'));
        console.log('  - Modal mostrado:', localStorage.getItem('notificationModalShown'));
        console.log('  - Última notificación:', localStorage.getItem('lastNotificationId') || 'Ninguna');
        console.log('\n💡 Funciones: activarNotificaciones() | limpiarNotificaciones() | estadoNotificaciones()');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.notificationManager.init();
            console.log('\n💡 Sistema de notificaciones cargado. Escribe estadoNotificaciones() para ver el estado.');
        });
    } else {
        window.notificationManager.init();
        console.log('\n💡 Sistema de notificaciones cargado. Escribe estadoNotificaciones() para ver el estado.');
    }
}

console.log('✅ Notification Manager loaded');
