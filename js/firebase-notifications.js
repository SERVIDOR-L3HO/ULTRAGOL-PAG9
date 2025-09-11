// Firebase Notifications and Advanced Features
console.log('Firebase notifications system loading...');

// Notifications System
class NotificationsSystem {
    constructor() {
        this.currentUser = null;
        this.notifications = [];
        this.init();
    }

    init() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    this.loadNotifications();
                    this.setupNotificationListener();
                }
            });
        }
    }

    // Load user notifications
    async loadNotifications() {
        if (!this.currentUser || !window.db) return;

        try {
            const notificationsQuery = await window.db
                .collection('notifications')
                .where('userId', '==', this.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();

            this.notifications = [];
            notificationsQuery.forEach(doc => {
                this.notifications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.updateNotificationBadge();
        } catch (error) {
            console.error('❌ Error loading notifications:', error);
        }
    }

    // Create notification
    async createNotification(userId, type, title, message, data = {}) {
        if (!window.db) return;

        try {
            await window.db.collection('notifications').add({
                userId: userId,
                type: type, // 'match', 'comment', 'like', 'system'
                title: title,
                message: message,
                data: data,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('❌ Error creating notification:', error);
        }
    }

    // Update notification badge
    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationBadge');
        
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Setup real-time listener
    setupNotificationListener() {
        if (!this.currentUser || !window.db) return;

        window.db.collection('notifications')
            .where('userId', '==', this.currentUser.uid)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const notification = { id: change.doc.id, ...change.doc.data() };
                        this.showToastNotification(notification);
                    }
                });
                this.loadNotifications();
            });
    }

    // Show toast notification
    showToastNotification(notification) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    // Get notification icon
    getNotificationIcon(type) {
        const icons = {
            'match': 'fa-futbol',
            'comment': 'fa-comment',
            'like': 'fa-heart',
            'system': 'fa-bell'
        };
        return icons[type] || 'fa-bell';
    }
}

// Favorites System
class FavoritesSystem {
    constructor() {
        this.currentUser = null;
        this.favorites = {
            teams: [],
            players: [],
            matches: []
        };
        this.init();
    }

    init() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    this.loadFavorites();
                }
            });
        }
    }

    // Add to favorites
    async addFavorite(type, itemId, itemData) {
        if (!this.currentUser || !window.db) return false;

        try {
            const favoriteData = {
                userId: this.currentUser.uid,
                type: type, // 'team', 'player', 'match'
                itemId: itemId,
                itemData: itemData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await window.db.collection('favorites').add(favoriteData);
            
            // Update user points
            const userRef = window.db.collection('users').doc(this.currentUser.uid);
            await userRef.update({
                points: firebase.firestore.FieldValue.increment(2)
            });

            this.loadFavorites();
            return true;
        } catch (error) {
            console.error('❌ Error adding favorite:', error);
            return false;
        }
    }

    // Remove from favorites
    async removeFavorite(type, itemId) {
        if (!this.currentUser || !window.db) return false;

        try {
            const favoritesQuery = await window.db
                .collection('favorites')
                .where('userId', '==', this.currentUser.uid)
                .where('type', '==', type)
                .where('itemId', '==', itemId)
                .get();

            const batch = window.db.batch();
            favoritesQuery.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            this.loadFavorites();
            return true;
        } catch (error) {
            console.error('❌ Error removing favorite:', error);
            return false;
        }
    }

    // Load user favorites
    async loadFavorites() {
        if (!this.currentUser || !window.db) return;

        try {
            const favoritesQuery = await window.db
                .collection('favorites')
                .where('userId', '==', this.currentUser.uid)
                .get();

            this.favorites = { teams: [], players: [], matches: [] };
            
            favoritesQuery.forEach(doc => {
                const favorite = doc.data();
                this.favorites[favorite.type + 's'].push({
                    id: doc.id,
                    ...favorite
                });
            });

            this.updateFavoriteButtons();
        } catch (error) {
            console.error('❌ Error loading favorites:', error);
        }
    }

    // Check if item is favorited
    isFavorite(type, itemId) {
        return this.favorites[type + 's'].some(fav => fav.itemId === itemId);
    }

    // Update favorite buttons
    updateFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(btn => {
            const type = btn.dataset.type;
            const itemId = btn.dataset.itemId;
            
            if (this.isFavorite(type, itemId)) {
                btn.classList.add('favorited');
                btn.innerHTML = '<i class="fas fa-heart"></i>';
            } else {
                btn.classList.remove('favorited');
                btn.innerHTML = '<i class="far fa-heart"></i>';
            }
        });
    }

    // Toggle favorite
    async toggleFavorite(type, itemId, itemData) {
        if (!this.currentUser) {
            alert('Debes iniciar sesión para agregar favoritos');
            return;
        }

        if (this.isFavorite(type, itemId)) {
            await this.removeFavorite(type, itemId);
        } else {
            await this.addFavorite(type, itemId, itemData);
        }
    }
}

// Initialize systems
const notificationsSystem = new NotificationsSystem();
const favoritesSystem = new FavoritesSystem();

// Make globally available
window.notificationsSystem = notificationsSystem;
window.favoritesSystem = favoritesSystem;

// Global function to toggle favorites
window.toggleFavorite = function(type, itemId, itemData) {
    favoritesSystem.toggleFavorite(type, itemId, itemData);
};

console.log('✅ Firebase notifications and favorites system loaded');