// Notifications System for Liga MX UltraGol
import { messaging, db } from './firebase-config.js';
import { getCurrentUser } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    where, 
    limit,
    updateDoc,
    doc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

// Initialize notifications system
export function initNotifications() {
    setupNotificationInterface();
    setupPushNotifications();
    loadUserNotifications();
    setupNotificationPreferences();
}

// Setup notification interface
function setupNotificationInterface() {
    addNotificationBell();
    createNotificationPanel();
}

// Add notification bell to navbar
function addNotificationBell() {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;
    
    const notificationBell = document.createElement('div');
    notificationBell.className = 'notification-bell';
    notificationBell.innerHTML = `
        <button class="notification-btn" id="notificationBtn">
            <i class="fas fa-bell"></i>
            <span class="notification-count" id="notificationCount">0</span>
        </button>
    `;
    
    // Insert before user menu
    userMenu.insertBefore(notificationBell, userMenu.firstChild);
    
    // Add click handler
    document.getElementById('notificationBtn').addEventListener('click', toggleNotificationPanel);
}

// Create notification panel
function createNotificationPanel() {
    const notificationPanel = document.createElement('div');
    notificationPanel.id = 'notificationPanel';
    notificationPanel.className = 'notification-panel';
    notificationPanel.innerHTML = `
        <div class="notification-header">
            <h3>Notificaciones</h3>
            <div class="notification-actions">
                <button class="mark-all-read" onclick="markAllAsRead()">
                    <i class="fas fa-check-double"></i>
                </button>
                <button class="notification-settings" onclick="openNotificationSettings()">
                    <i class="fas fa-cog"></i>
                </button>
                <button class="close-notifications" onclick="closeNotificationPanel()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="notification-content" id="notificationContent">
            <div class="loading-notifications">
                <i class="fas fa-bell"></i>
                <p>Cargando notificaciones...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notificationPanel);
}

// Toggle notification panel
function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel.classList.contains('show')) {
        closeNotificationPanel();
    } else {
        openNotificationPanel();
    }
}

// Open notification panel
function openNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    panel.classList.add('show');
    loadUserNotifications();
}

// Close notification panel
window.closeNotificationPanel = function() {
    const panel = document.getElementById('notificationPanel');
    panel.classList.remove('show');
};

// Setup push notifications
async function setupPushNotifications() {
    if (!messaging) {
        console.log('Push messaging not supported');
        return;
    }
    
    try {
        // Request permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('Notification permission granted');
            
            // Get FCM token
            const token = await getToken(messaging, {
                vapidKey: 'BK7V8Z...' // You'll need to generate this from Firebase Console
            });
            
            if (token) {
                console.log('FCM Token:', token);
                await saveFCMToken(token);
            }
            
            // Handle foreground messages
            onMessage(messaging, (payload) => {
                console.log('Foreground message received:', payload);
                showInAppNotification(payload);
            });
            
        } else {
            console.log('Notification permission denied');
        }
        
    } catch (error) {
        console.error('Error setting up push notifications:', error);
    }
}

// Save FCM token to user profile
async function saveFCMToken(token) {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            fcmToken: token,
            notificationsEnabled: true
        });
    } catch (error) {
        console.error('Error saving FCM token:', error);
    }
}

// Show in-app notification
function showInAppNotification(payload) {
    const notification = document.createElement('div');
    notification.className = 'in-app-notification';
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-bell"></i>
        </div>
        <div class="notification-content">
            <h4>${payload.notification.title}</h4>
            <p>${payload.notification.body}</p>
        </div>
        <button class="close-notification" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    
    // Update notification count
    updateNotificationCount();
}

// Load user notifications
export async function loadUserNotifications() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
        
        const querySnapshot = await getDocs(notificationsQuery);
        const notifications = [];
        
        querySnapshot.forEach((doc) => {
            notifications.push({ id: doc.id, ...doc.data() });
        });
        
        displayNotifications(notifications);
        updateNotificationCount(notifications);
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        displayErrorMessage();
    }
}

// Display notifications in panel
function displayNotifications(notifications) {
    const container = document.getElementById('notificationContent');
    if (!container) return;
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="no-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>No tienes notificaciones</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
            <div class="notification-icon">
                <i class="fas ${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-body">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <span class="notification-time">${formatTimeAgo(notification.createdAt?.toDate())}</span>
            </div>
            <div class="notification-actions">
                ${!notification.read ? `
                    <button class="mark-read-btn" onclick="markAsRead('${notification.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
                <button class="delete-notification" onclick="deleteNotification('${notification.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Get notification icon based on type
function getNotificationIcon(type) {
    const icons = {
        'match_start': 'fa-futbol',
        'goal_scored': 'fa-bullseye',
        'match_end': 'fa-flag-checkered',
        'link_shared': 'fa-link',
        'comment_reply': 'fa-reply',
        'prediction_result': 'fa-trophy',
        'achievement_unlocked': 'fa-medal',
        'system': 'fa-info-circle',
        'default': 'fa-bell'
    };
    
    return icons[type] || icons.default;
}

// Update notification count
function updateNotificationCount(notifications = null) {
    if (!notifications) {
        // Count will be updated when notifications are loaded
        return;
    }
    
    const unreadCount = notifications.filter(n => !n.read).length;
    const countElement = document.getElementById('notificationCount');
    
    if (countElement) {
        countElement.textContent = unreadCount;
        countElement.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

// Mark notification as read
window.markAsRead = async function(notificationId) {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            read: true,
            readAt: serverTimestamp()
        });
        
        loadUserNotifications();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

// Mark all notifications as read
window.markAllAsRead = async function() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            where('read', '==', false)
        );
        
        const querySnapshot = await getDocs(notificationsQuery);
        
        const promises = [];
        querySnapshot.forEach((doc) => {
            promises.push(updateDoc(doc.ref, {
                read: true,
                readAt: serverTimestamp()
            }));
        });
        
        await Promise.all(promises);
        loadUserNotifications();
        
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
};

// Delete notification
window.deleteNotification = async function(notificationId) {
    try {
        await updateDoc(doc(db, 'notifications', notificationId), {
            deleted: true
        });
        
        loadUserNotifications();
        
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
};

// Send notification to user
export async function sendNotification(userId, title, message, type = 'system', data = {}) {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            title,
            message,
            type,
            data,
            read: false,
            deleted: false,
            createdAt: serverTimestamp()
        });
        
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// Setup notification preferences
function setupNotificationPreferences() {
    // This would be called when opening settings
    // For now, just create the modal structure
}

// Open notification settings
window.openNotificationSettings = function() {
    createNotificationSettingsModal();
};

// Create notification settings modal
function createNotificationSettingsModal() {
    const modal = document.createElement('div');
    modal.id = 'notificationSettingsModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Configuración de Notificaciones</h2>
                <button class="close-modal" onclick="closeModal('notificationSettingsModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="setting-group">
                    <label class="switch-label">
                        <input type="checkbox" id="pushNotifications" checked>
                        <span class="switch-slider"></span>
                        Notificaciones Push
                    </label>
                    <p class="setting-description">Recibe notificaciones en tu dispositivo</p>
                </div>
                
                <div class="setting-group">
                    <label class="switch-label">
                        <input type="checkbox" id="matchNotifications" checked>
                        <span class="switch-slider"></span>
                        Inicio de Partidos
                    </label>
                    <p class="setting-description">Notificaciones cuando comience un partido</p>
                </div>
                
                <div class="setting-group">
                    <label class="switch-label">
                        <input type="checkbox" id="goalNotifications" checked>
                        <span class="switch-slider"></span>
                        Goles y Eventos
                    </label>
                    <p class="setting-description">Notificaciones de goles y eventos importantes</p>
                </div>
                
                <div class="setting-group">
                    <label class="switch-label">
                        <input type="checkbox" id="linkNotifications" checked>
                        <span class="switch-slider"></span>
                        Nuevos Links
                    </label>
                    <p class="setting-description">Notificaciones de nuevos links compartidos</p>
                </div>
                
                <div class="setting-group">
                    <label class="switch-label">
                        <input type="checkbox" id="achievementNotifications" checked>
                        <span class="switch-slider"></span>
                        Logros y Puntos
                    </label>
                    <p class="setting-description">Notificaciones de logros desbloqueados</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="saveNotificationSettings()">
                    Guardar Configuración
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Save notification settings
window.saveNotificationSettings = async function() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const settings = {
            pushNotifications: document.getElementById('pushNotifications').checked,
            matchNotifications: document.getElementById('matchNotifications').checked,
            goalNotifications: document.getElementById('goalNotifications').checked,
            linkNotifications: document.getElementById('linkNotifications').checked,
            achievementNotifications: document.getElementById('achievementNotifications').checked
        };
        
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            notificationSettings: settings,
            updatedAt: serverTimestamp()
        });
        
        showSuccessMessage('Configuración guardada');
        closeModal('notificationSettingsModal');
        
    } catch (error) {
        console.error('Error saving notification settings:', error);
        showErrorMessage('Error al guardar configuración');
    }
};

// Display error message
function displayErrorMessage() {
    const container = document.getElementById('notificationContent');
    if (container) {
        container.innerHTML = `
            <div class="error-notifications">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar notificaciones</p>
                <button onclick="loadUserNotifications()" class="retry-btn">Reintentar</button>
            </div>
        `;
    }
}

// Utility function
function formatTimeAgo(date) {
    if (!date) return 'Hace un momento';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    
    return date.toLocaleDateString('es-ES');
}

// Global utility functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

function showSuccessMessage(message) {
    if (window.showSuccessMessage) {
        window.showSuccessMessage(message);
    }
}

function showErrorMessage(message) {
    if (window.showErrorMessage) {
        window.showErrorMessage(message);
    }
}