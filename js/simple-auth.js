console.log('UltraGol Simple Auth loading...');

let currentUser = null;
let isAuthenticated = false;

document.addEventListener('DOMContentLoaded', function() {
    setupAuthentication();
});

function setupAuthentication() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (typeof window.authService !== 'undefined') {
        window.authService.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                isAuthenticated = true;
                showUserInfo(user);
                console.log('✅ Usuario autenticado:', user.username);
            } else {
                currentUser = null;
                isAuthenticated = false;
                hideUserInfo();
                console.log('❌ Usuario no autenticado');
            }
        });
    } else {
        console.warn('⚠️ AuthService no disponible');
    }
}

async function handleLogin() {
    if (typeof window.authService === 'undefined') {
        alert('Sistema de autenticación no disponible');
        return;
    }
    
    const username = prompt('Usuario:');
    if (!username) return;
    
    const password = prompt('Contraseña:');
    if (!password) return;
    
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
    }
    
    try {
        const result = await window.authService.login(username, password);
        if (result.success) {
            currentUser = result.user;
            isAuthenticated = true;
            console.log('✅ Login exitoso:', currentUser.username);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('❌ Error de autenticación:', error);
        alert('Error al iniciar sesión: ' + error.message);
        
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
        }
    }
}

async function handleLogout() {
    if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        return;
    }
    
    if (typeof window.authService === 'undefined') {
        currentUser = null;
        isAuthenticated = false;
        hideUserInfo();
        return;
    }
    
    try {
        await window.authService.logout();
        currentUser = null;
        isAuthenticated = false;
        console.log('✅ Sesión cerrada');
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
    }
}

function showUserInfo(user) {
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userName = document.getElementById('user-name');
    
    if (userInfo) userInfo.style.display = 'flex';
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (userName) userName.textContent = user.username || 'Usuario';
}

function hideUserInfo() {
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (userInfo) userInfo.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
}

// Exportar funciones globales
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.getCurrentUser = () => currentUser;
window.isUserAuthenticated = () => isAuthenticated;

console.log('✅ Sistema de autenticación simple cargado');
