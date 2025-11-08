// UltraGol Notifications System - API Integration
// Sistema de notificaciones personalizado que se conecta a la API de notificaciones

class NotificationManager {
    constructor() {
        this.notificationPermission = localStorage.getItem('notificationPermission') || 'default';
        this.favoriteTeam = localStorage.getItem('selectedTeam') || null;
        this.lastNotificationId = localStorage.getItem('lastNotificationId') || null;
        this.checkInterval = null;
        this.modalShown = localStorage.getItem('notificationModalShown') === 'true';
    }

    async init() {
        console.log('🔔 Initializing Notification System...');
        
        // Show modal after 3 seconds if not shown before
        if (!this.modalShown) {
            setTimeout(() => this.showPermissionModal(), 3000);
        } else if (this.notificationPermission === 'granted' && this.favoriteTeam) {
            // Start polling if already configured
            this.startNotificationPolling();
        }
    }

    showPermissionModal() {
        // Marcar como mostrado inmediatamente para que no aparezca en otras páginas
        localStorage.setItem('notificationModalShown', 'true');
        this.modalShown = true;
        
        const modal = document.createElement('div');
        modal.className = 'notification-permission-modal';
        modal.innerHTML = `
            <div class="notification-modal-overlay"></div>
            <div class="notification-modal-content">
                <div class="notification-modal-header">
                    <i class="fas fa-bell notification-icon"></i>
                    <h2>¡Mantente al día con tu equipo!</h2>
                </div>
                <div class="notification-modal-body">
                    <p>Recibe notificaciones en tiempo real sobre:</p>
                    <ul>
                        <li><i class="fas fa-futbol"></i> Partidos de tu equipo</li>
                        <li><i class="fas fa-trophy"></i> Goles y resultados</li>
                        <li><i class="fas fa-newspaper"></i> Noticias importantes</li>
                        <li><i class="fas fa-calendar"></i> Próximos encuentros</li>
                    </ul>
                    <div class="notification-privacy">Solo recibirás notificaciones del equipo que elijas</div>
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
                this.showTeamSelector();
            } else {
                this.notificationPermission = 'denied';
                localStorage.setItem('notificationPermission', 'denied');
                localStorage.setItem('notificationModalShown', 'true');
                this.closeModal(modal);
                this.showMessage('Notificaciones desactivadas', 'info');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            this.closeModal(modal);
        }
    }

    denyNotifications(modal) {
        this.notificationPermission = 'denied';
        localStorage.setItem('notificationPermission', 'denied');
        localStorage.setItem('notificationModalShown', 'true');
        this.closeModal(modal);
        this.showMessage('Puedes activar las notificaciones más tarde desde la configuración', 'info');
    }

    closeModal(modal) {
        modal.querySelector('.notification-modal-content').classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    async showTeamSelector() {
        const modal = document.createElement('div');
        modal.className = 'notification-permission-modal';
        
        const teams = await this.getTeams();
        
        const teamOptions = teams.map(team => `
            <div class="team-option" data-team-id="${team.id}">
                <img src="${team.logo}" alt="${team.name}" onerror="this.style.display='none'">
                <span>${team.name}</span>
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="notification-modal-overlay"></div>
            <div class="notification-modal-content team-selector">
                <div class="notification-modal-header">
                    <i class="fas fa-heart notification-icon"></i>
                    <h2>Elige tu equipo favorito</h2>
                </div>
                <div class="notification-modal-body">
                    <p>Selecciona el equipo del cual quieres recibir notificaciones:</p>
                    <div class="teams-grid">
                        ${teamOptions}
                    </div>
                </div>
                <div class="notification-modal-footer">
                    <button class="btn-secondary" id="teamSelectorCancel">
                        Cancelar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        setTimeout(() => {
            modal.querySelector('.notification-modal-content').classList.add('show');
        }, 100);

        modal.querySelectorAll('.team-option').forEach(option => {
            option.addEventListener('click', () => {
                const teamId = option.dataset.teamId;
                this.selectTeam(teamId, modal);
            });
        });

        document.getElementById('teamSelectorCancel').addEventListener('click', () => {
            this.closeModal(modal);
            localStorage.setItem('notificationModalShown', 'true');
        });
    }

    selectTeam(teamId, modal) {
        this.favoriteTeam = teamId;
        localStorage.setItem('selectedTeam', teamId);
        localStorage.setItem('notificationModalShown', 'true');
        
        this.closeModal(modal);
        
        this.showMessage(`¡Notificaciones activadas para tu equipo!`, 'success');
        
        // Start checking for notifications
        this.startNotificationPolling();
        
        // Send welcome notification
        this.sendWelcomeNotification();
    }

    async getTeams() {
        try {
            // Llamar directamente a la API externa
            const response = await fetch('https://ultragol-api3.onrender.com/Equipos');
            if (response.ok) {
                return await response.json();
            }
            
            // Fallback to local data
            const fallbackResponse = await fetch('data/teams.json');
            return await fallbackResponse.json();
        } catch (error) {
            console.error('Error loading teams:', error);
            // Try local fallback
            try {
                const fallbackResponse = await fetch('data/teams.json');
                return await fallbackResponse.json();
            } catch (fallbackError) {
                console.error('Error loading fallback teams:', fallbackError);
                return [];
            }
        }
    }

    sendWelcomeNotification() {
        if (this.notificationPermission === 'granted') {
            new Notification('¡Bienvenido a UltraGol!', {
                body: 'Recibirás notificaciones de tu equipo favorito',
                icon: '/assets/logo.png',
                badge: '/assets/badge.png',
                tag: 'welcome'
            });
        }
    }

    async startNotificationPolling() {
        if (!this.favoriteTeam || this.notificationPermission !== 'granted') {
            return;
        }

        console.log(`🔔 Starting notifications for team: ${this.favoriteTeam}`);
        
        // Check immediately
        this.checkForNotifications();
        
        // Then check every minute
        this.checkInterval = setInterval(() => {
            this.checkForNotifications();
        }, 60000); // 60 seconds
    }

    async checkForNotifications() {
        try {
            // Llamar directamente a la API externa
            const response = await fetch('https://ultragol-api3.onrender.com/notificaciones');
            if (!response.ok) {
                console.error('Error fetching notifications:', response.status);
                return;
            }

            const data = await response.json();
            const notifications = data.notificaciones || [];
            
            // Filter notifications for selected team
            const teamNotifications = notifications.filter(notif => {
                return this.isRelevantNotification(notif);
            });

            // Show new notifications
            teamNotifications.forEach(notif => {
                if (notif.id && notif.id !== this.lastNotificationId) {
                    this.showNotification(notif);
                    this.lastNotificationId = notif.id;
                    localStorage.setItem('lastNotificationId', notif.id);
                }
            });

        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    isRelevantNotification(notification) {
        // Check if notification is relevant to the selected team
        if (!notification.equipos || !Array.isArray(notification.equipos)) {
            return false;
        }
        
        // Normalize team names and check if selected team is in the list
        return notification.equipos.some(equipo => {
            const equipoId = this.normalizeTeamId(equipo);
            return equipoId === this.favoriteTeam;
        });
    }

    normalizeTeamId(teamName) {
        // Normalize team name to match ID format
        return teamName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    showNotification(notificationData) {
        if (this.notificationPermission !== 'granted') {
            return;
        }

        const options = {
            body: notificationData.mensaje || notificationData.body || 'Nueva actualización de tu equipo',
            icon: notificationData.icon || '/assets/logo.png',
            badge: '/assets/badge.png',
            tag: notificationData.id || `notif-${Date.now()}`,
            data: {
                url: notificationData.url || '/',
                ...notificationData
            },
            requireInteraction: false,
            vibrate: [200, 100, 200]
        };

        const notification = new Notification(
            notificationData.titulo || 'UltraGol',
            options
        );

        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            if (notificationData.url) {
                window.location.href = notificationData.url;
            }
            notification.close();
        };

        console.log('🔔 Notification shown:', notificationData.titulo);
    }

    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    stopNotificationPolling() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // Public methods for configuration
    enableNotifications() {
        if (!this.modalShown) {
            this.showPermissionModal();
        } else if (this.notificationPermission === 'denied') {
            alert('Las notificaciones están bloqueadas. Por favor, actívalas desde la configuración de tu navegador.');
        } else if (!this.favoriteTeam) {
            this.showTeamSelector();
        }
    }

    disableNotifications() {
        this.stopNotificationPolling();
        this.notificationPermission = 'denied';
        localStorage.setItem('notificationPermission', 'denied');
        this.showMessage('Notificaciones desactivadas', 'info');
    }

    changeTeam() {
        this.showTeamSelector();
    }
}

// Initialize notification manager globally
if (typeof window !== 'undefined') {
    window.notificationManager = new NotificationManager();
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.notificationManager.init();
        });
    } else {
        window.notificationManager.init();
    }
}

console.log('✅ Notification Manager loaded');
