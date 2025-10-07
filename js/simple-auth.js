// Sistema de autenticación simple - Compatible con ULTRA
// Usa Firebase compat ya cargado en index.html

let currentUser = null;
let isAuthenticated = false;

// Configurar proveedor de Google
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Iniciar autenticación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setupAuthentication();
});

// Configurar autenticación
function setupAuthentication() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Event listeners para autenticación
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Monitorear cambios en el estado de autenticación
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                isAuthenticated = true;
                showUserInfo(user);
                console.log('✅ Usuario autenticado:', user.displayName || user.email);
            } else {
                currentUser = null;
                isAuthenticated = false;
                hideUserInfo();
                console.log('❌ Usuario no autenticado');
            }
        });
    } else {
        console.warn('⚠️ Firebase no disponible');
    }
}

// Manejar inicio de sesión
async function handleLogin() {
    const loginBtn = document.getElementById('login-btn');
    if (!loginBtn) return;
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
    
    try {
        const result = await firebase.auth().signInWithPopup(googleProvider);
        currentUser = result.user;
        isAuthenticated = true;
        console.log('✅ Login exitoso:', currentUser.displayName);
    } catch (error) {
        console.error('❌ Error de autenticación:', error);
        
        if (error.code === 'auth/unauthorized-domain') {
            alert('Dominio no autorizado. El administrador debe agregar este dominio en Firebase Console.');
        } else if (error.code === 'auth/popup-closed-by-user') {
            console.log('Usuario cerró la ventana de autenticación');
        } else {
            alert('Error al iniciar sesión: ' + error.message);
        }
        
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fab fa-google"></i> Iniciar Sesión';
    }
}

// Manejar cierre de sesión
async function handleLogout() {
    if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        return;
    }
    
    try {
        await firebase.auth().signOut();
        currentUser = null;
        isAuthenticated = false;
        console.log('✅ Sesión cerrada');
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
    }
}

// Mostrar información del usuario
function showUserInfo(user) {
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    if (userInfo) userInfo.style.display = 'flex';
    if (loginBtn) loginBtn.style.display = 'none';
    if (userAvatar) userAvatar.src = user.photoURL || 'https://via.placeholder.com/40';
    if (userName) userName.textContent = user.displayName || user.email;
}

// Ocultar información del usuario
function hideUserInfo() {
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    
    if (userInfo) userInfo.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'block';
}

// Exportar funciones globales
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.getCurrentUser = () => currentUser;
window.isUserAuthenticated = () => isAuthenticated;

console.log('✅ Sistema de autenticación simple cargado');
