// Admin Dashboard for Liga MX UltraGol
import { db } from './firebase-config.js';
import { getCurrentUser } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    where, 
    limit,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Admin users list (in production, this should be stored in Firestore)
const ADMIN_USERS = [
    'admin@ultragol.com',
    'l3ho@admin.com'
];

// Initialize admin dashboard
export function initAdminDashboard() {
    const user = getCurrentUser();
    if (!user || !isAdmin(user.email)) {
        return; // Not an admin
    }
    
    addAdminButton();
}

// Check if user is admin
function isAdmin(email) {
    return ADMIN_USERS.includes(email?.toLowerCase());
}

// Add admin button to navbar
function addAdminButton() {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;
    
    const adminButton = document.createElement('button');
    adminButton.className = 'admin-access-btn';
    adminButton.innerHTML = '<i class="fas fa-cog"></i> Admin';
    adminButton.onclick = openAdminDashboard;
    
    userMenu.appendChild(adminButton);
}

// Open admin dashboard
window.openAdminDashboard = function() {
    const user = getCurrentUser();
    if (!user || !isAdmin(user.email)) {
        showErrorMessage('Acceso denegado');
        return;
    }
    
    createAdminModal();
};

// Create admin modal
function createAdminModal() {
    const modal = document.createElement('div');
    modal.id = 'adminModal';
    modal.className = 'modal admin-modal';
    modal.innerHTML = `
        <div class="modal-content admin-content">
            <div class="modal-header">
                <h2><i class="fas fa-shield-alt"></i> Panel de Administración</h2>
                <button class="close-modal" onclick="closeModal('adminModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="admin-tabs">
                    <button class="admin-tab active" onclick="showAdminTab('users')">
                        <i class="fas fa-users"></i> Usuarios
                    </button>
                    <button class="admin-tab" onclick="showAdminTab('comments')">
                        <i class="fas fa-comments"></i> Comentarios
                    </button>
                    <button class="admin-tab" onclick="showAdminTab('links')">
                        <i class="fas fa-link"></i> Links
                    </button>
                    <button class="admin-tab" onclick="showAdminTab('reports')">
                        <i class="fas fa-flag"></i> Reportes
                    </button>
                    <button class="admin-tab" onclick="showAdminTab('analytics')">
                        <i class="fas fa-chart-bar"></i> Análisis
                    </button>
                </div>
                
                <div class="admin-content-area" id="adminContentArea">
                    <div class="loading">Cargando datos...</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Load initial tab
    showAdminTab('users');
}

// Show admin tab
window.showAdminTab = function(tab) {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    const contentArea = document.getElementById('adminContentArea');
    contentArea.innerHTML = '<div class="loading">Cargando...</div>';
    
    switch(tab) {
        case 'users':
            loadUsersManagement();
            break;
        case 'comments':
            loadCommentsManagement();
            break;
        case 'links':
            loadLinksManagement();
            break;
        case 'reports':
            loadReportsManagement();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
};

// Load users management
async function loadUsersManagement() {
    try {
        const usersQuery = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        
        const querySnapshot = await getDocs(usersQuery);
        const users = [];
        
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        displayUsersManagement(users);
        
    } catch (error) {
        console.error('Error loading users:', error);
        displayError('Error al cargar usuarios');
    }
}

// Display users management
function displayUsersManagement(users) {
    const contentArea = document.getElementById('adminContentArea');
    
    contentArea.innerHTML = `
        <div class="admin-section">
            <div class="section-header">
                <h3>Gestión de Usuarios (${users.length})</h3>
                <div class="admin-actions">
                    <input type="text" placeholder="Buscar usuarios..." id="userSearch" class="admin-search">
                    <button class="btn btn-primary" onclick="exportUsers()">
                        <i class="fas fa-download"></i> Exportar
                    </button>
                </div>
            </div>
            
            <div class="admin-stats-grid">
                <div class="admin-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-number">${users.length}</span>
                        <span class="stat-label">Total Usuarios</span>
                    </div>
                </div>
                <div class="admin-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-number">${users.filter(u => u.emailVerified).length}</span>
                        <span class="stat-label">Verificados</span>
                    </div>
                </div>
                <div class="admin-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-number">${users.reduce((sum, u) => sum + (u.points || 0), 0)}</span>
                        <span class="stat-label">Total Puntos</span>
                    </div>
                </div>
                <div class="admin-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-number">${users.filter(u => isActiveUser(u)).length}</span>
                        <span class="stat-label">Activos</span>
                    </div>
                </div>
            </div>
            
            <div class="users-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Registro</th>
                            <th>Puntos</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr data-user-id="${user.id}">
                                <td>
                                    <div class="user-cell">
                                        <div class="user-avatar-tiny">
                                            ${user.profilePicture ? 
                                                `<img src="${user.profilePicture}" alt="Avatar">` : 
                                                '<i class="fas fa-user"></i>'
                                            }
                                        </div>
                                        <div class="user-info-tiny">
                                            <span class="user-name">${user.displayName || 'Sin nombre'}</span>
                                            <span class="user-level">Nivel ${user.level || 1}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>${user.email}</td>
                                <td>${formatDate(user.createdAt?.toDate())}</td>
                                <td>
                                    <span class="points-badge">${user.points || 0}</span>
                                </td>
                                <td>
                                    <span class="status-badge ${user.banned ? 'banned' : 'active'}">
                                        ${user.banned ? 'Baneado' : 'Activo'}
                                    </span>
                                </td>
                                <td>
                                    <div class="admin-actions-cell">
                                        <button class="action-btn view" onclick="viewUser('${user.id}')" title="Ver">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="action-btn edit" onclick="editUser('${user.id}')" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="action-btn ${user.banned ? 'unban' : 'ban'}" 
                                                onclick="toggleUserBan('${user.id}', ${!user.banned})" 
                                                title="${user.banned ? 'Desbanear' : 'Banear'}">
                                            <i class="fas fa-${user.banned ? 'unlock' : 'ban'}"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Setup search functionality
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterUsersTable(e.target.value);
        });
    }
}

// Load comments management
async function loadCommentsManagement() {
    try {
        const commentsQuery = query(
            collection(db, 'comments'),
            orderBy('createdAt', 'desc'),
            limit(100)
        );
        
        const querySnapshot = await getDocs(commentsQuery);
        const comments = [];
        
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() });
        });
        
        displayCommentsManagement(comments);
        
    } catch (error) {
        console.error('Error loading comments:', error);
        displayError('Error al cargar comentarios');
    }
}

// Display comments management
function displayCommentsManagement(comments) {
    const contentArea = document.getElementById('adminContentArea');
    
    contentArea.innerHTML = `
        <div class="admin-section">
            <div class="section-header">
                <h3>Gestión de Comentarios (${comments.length})</h3>
                <div class="admin-actions">
                    <select id="commentFilter" class="admin-filter">
                        <option value="all">Todos</option>
                        <option value="reported">Reportados</option>
                        <option value="flagged">Marcados</option>
                    </select>
                    <button class="btn btn-danger" onclick="moderateComments()">
                        <i class="fas fa-gavel"></i> Moderar
                    </button>
                </div>
            </div>
            
            <div class="comments-management-grid">
                ${comments.map(comment => `
                    <div class="comment-admin-card" data-comment-id="${comment.id}">
                        <div class="comment-admin-header">
                            <div class="comment-user">
                                <span class="comment-author">${comment.userDisplayName}</span>
                                <span class="comment-date">${formatDate(comment.createdAt?.toDate())}</span>
                            </div>
                            <div class="comment-status">
                                ${comment.reported ? '<span class="status-badge reported">Reportado</span>' : ''}
                                ${comment.flagged ? '<span class="status-badge flagged">Marcado</span>' : ''}
                            </div>
                        </div>
                        
                        <div class="comment-content-admin">
                            <p>${comment.text}</p>
                            <div class="comment-meta">
                                <span class="category-badge">${comment.category}</span>
                                <span class="likes-count"><i class="fas fa-heart"></i> ${comment.likes || 0}</span>
                            </div>
                        </div>
                        
                        <div class="comment-admin-actions">
                            <button class="action-btn approve" onclick="approveComment('${comment.id}')" title="Aprobar">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn flag" onclick="flagComment('${comment.id}')" title="Marcar">
                                <i class="fas fa-flag"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteComment('${comment.id}')" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Load analytics
async function loadAnalytics() {
    const contentArea = document.getElementById('adminContentArea');
    
    try {
        // Get basic stats
        const [users, comments, links, predictions] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'comments')),
            getDocs(collection(db, 'matchLinks')),
            getDocs(collection(db, 'predictions'))
        ]);
        
        const analytics = {
            totalUsers: users.size,
            totalComments: comments.size,
            totalLinks: links.size,
            totalPredictions: predictions.size,
            activeUsers: 0,
            newUsersToday: 0,
            commentsToday: 0,
            linksToday: 0
        };
        
        // Calculate additional metrics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        users.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate();
            const lastLogin = data.lastLogin?.toDate();
            
            if (createdAt && createdAt >= today) {
                analytics.newUsersToday++;
            }
            
            if (lastLogin && lastLogin >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
                analytics.activeUsers++;
            }
        });
        
        comments.forEach((doc) => {
            const createdAt = doc.data().createdAt?.toDate();
            if (createdAt && createdAt >= today) {
                analytics.commentsToday++;
            }
        });
        
        links.forEach((doc) => {
            const createdAt = doc.data().createdAt?.toDate();
            if (createdAt && createdAt >= today) {
                analytics.linksToday++;
            }
        });
        
        displayAnalytics(analytics);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        displayError('Error al cargar análisis');
    }
}

// Display analytics
function displayAnalytics(analytics) {
    const contentArea = document.getElementById('adminContentArea');
    
    contentArea.innerHTML = `
        <div class="admin-section">
            <div class="section-header">
                <h3>Análisis de la Plataforma</h3>
                <div class="admin-actions">
                    <select id="analyticsRange" class="admin-filter">
                        <option value="today">Hoy</option>
                        <option value="week">Esta Semana</option>
                        <option value="month">Este Mes</option>
                        <option value="all">Todo el Tiempo</option>
                    </select>
                    <button class="btn btn-primary" onclick="exportAnalytics()">
                        <i class="fas fa-download"></i> Exportar
                    </button>
                </div>
            </div>
            
            <div class="analytics-overview">
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <div class="analytics-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="analytics-data">
                            <span class="analytics-number">${analytics.totalUsers}</span>
                            <span class="analytics-label">Total Usuarios</span>
                            <span class="analytics-change">+${analytics.newUsersToday} hoy</span>
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <div class="analytics-icon">
                            <i class="fas fa-comments"></i>
                        </div>
                        <div class="analytics-data">
                            <span class="analytics-number">${analytics.totalComments}</span>
                            <span class="analytics-label">Comentarios</span>
                            <span class="analytics-change">+${analytics.commentsToday} hoy</span>
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <div class="analytics-icon">
                            <i class="fas fa-link"></i>
                        </div>
                        <div class="analytics-data">
                            <span class="analytics-number">${analytics.totalLinks}</span>
                            <span class="analytics-label">Links Compartidos</span>
                            <span class="analytics-change">+${analytics.linksToday} hoy</span>
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <div class="analytics-icon">
                            <i class="fas fa-crystal-ball"></i>
                        </div>
                        <div class="analytics-data">
                            <span class="analytics-number">${analytics.totalPredictions}</span>
                            <span class="analytics-label">Predicciones</span>
                            <span class="analytics-change">Total</span>
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <div class="analytics-icon">
                            <i class="fas fa-user-check"></i>
                        </div>
                        <div class="analytics-data">
                            <span class="analytics-number">${analytics.activeUsers}</span>
                            <span class="analytics-label">Usuarios Activos</span>
                            <span class="analytics-change">Última semana</span>
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <div class="analytics-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="analytics-data">
                            <span class="analytics-number">${Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}%</span>
                            <span class="analytics-label">Tasa de Actividad</span>
                            <span class="analytics-change">Semanal</span>
                        </div>
                    </div>
                </div>
                
                <div class="analytics-charts">
                    <div class="chart-container">
                        <h4>Actividad de Usuarios</h4>
                        <div class="chart-placeholder">
                            <i class="fas fa-chart-line"></i>
                            <p>Gráfico de actividad de usuarios por día</p>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <h4>Engagement de Contenido</h4>
                        <div class="chart-placeholder">
                            <i class="fas fa-chart-pie"></i>
                            <p>Distribución de interacciones</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Admin action functions
window.toggleUserBan = async function(userId, banned) {
    if (!confirm(`¿Estás seguro de que quieres ${banned ? 'banear' : 'desbanear'} este usuario?`)) {
        return;
    }
    
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            banned,
            bannedAt: banned ? serverTimestamp() : null,
            updatedAt: serverTimestamp()
        });
        
        showSuccessMessage(`Usuario ${banned ? 'baneado' : 'desbaneado'} correctamente`);
        loadUsersManagement(); // Reload
        
    } catch (error) {
        console.error('Error updating user ban status:', error);
        showErrorMessage('Error al actualizar el usuario');
    }
};

window.deleteAdminComment = async function(commentId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, 'comments', commentId));
        showSuccessMessage('Comentario eliminado correctamente');
        loadCommentsManagement(); // Reload
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        showErrorMessage('Error al eliminar el comentario');
    }
};

window.flagComment = async function(commentId) {
    try {
        const commentRef = doc(db, 'comments', commentId);
        await updateDoc(commentRef, {
            flagged: true,
            flaggedAt: serverTimestamp()
        });
        
        showSuccessMessage('Comentario marcado correctamente');
        loadCommentsManagement(); // Reload
        
    } catch (error) {
        console.error('Error flagging comment:', error);
        showErrorMessage('Error al marcar el comentario');
    }
};

window.approveComment = async function(commentId) {
    try {
        const commentRef = doc(db, 'comments', commentId);
        await updateDoc(commentRef, {
            approved: true,
            approvedAt: serverTimestamp(),
            flagged: false,
            reported: false
        });
        
        showSuccessMessage('Comentario aprobado correctamente');
        loadCommentsManagement(); // Reload
        
    } catch (error) {
        console.error('Error approving comment:', error);
        showErrorMessage('Error al aprobar el comentario');
    }
};

// Utility functions
function isActiveUser(user) {
    const lastLogin = user.lastLogin?.toDate();
    if (!lastLogin) return false;
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return lastLogin > oneWeekAgo;
}

function formatDate(date) {
    if (!date) return 'N/A';
    
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function filterUsersTable(searchTerm) {
    const rows = document.querySelectorAll('.admin-table tbody tr');
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

function displayError(message) {
    const contentArea = document.getElementById('adminContentArea');
    contentArea.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
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