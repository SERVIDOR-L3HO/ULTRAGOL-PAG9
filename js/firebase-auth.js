console.log('🔥 Firebase Authentication loading...');

let currentUser = null;
let isAuthenticated = false;

document.addEventListener('DOMContentLoaded', function() {
    setupFirebaseAuth();
});

function setupFirebaseAuth() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleGoogleLogin);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (typeof window.auth !== 'undefined') {
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                isAuthenticated = true;
                showUserInfo(user);
                console.log('✅ Usuario autenticado con Firebase:', user.displayName || user.email);
            } else {
                currentUser = null;
                isAuthenticated = false;
                hideUserInfo();
                console.log('❌ Usuario no autenticado');
            }
        });
        console.log('✅ Firebase Auth listener configured');
    } else {
        console.warn('⚠️ Firebase Auth no disponible, esperando...');
        setTimeout(setupFirebaseAuth, 1000);
    }
}

async function handleGoogleLogin() {
    if (typeof window.signInWithGoogle === 'undefined') {
        alert('Firebase no está disponible. Por favor recarga la página.');
        return;
    }
    
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
    }
    
    try {
        const result = await window.signInWithGoogle();
        if (result.success) {
            currentUser = result.user;
            isAuthenticated = true;
            console.log('✅ Login exitoso con Google:', currentUser.displayName);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('❌ Error de autenticación:', error);
        
        let errorMessage = 'Error al iniciar sesión con Google';
        if (error.message && error.message.includes('dominio')) {
            errorMessage = 'Este dominio necesita ser autorizado en Firebase Console';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        alert(errorMessage);
        
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fab fa-google"></i> Iniciar Sesión';
        }
    }
}

async function handleLogout() {
    if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        return;
    }
    
    if (typeof window.signOutUser === 'undefined') {
        currentUser = null;
        isAuthenticated = false;
        hideUserInfo();
        return;
    }
    
    try {
        await window.signOutUser();
        currentUser = null;
        isAuthenticated = false;
        console.log('✅ Sesión cerrada con Firebase');
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
    const userAvatar = document.getElementById('user-avatar');
    
    if (userInfo) userInfo.style.display = 'flex';
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (userName) userName.textContent = user.displayName || user.email || 'Usuario';
    if (userAvatar && user.photoURL) {
        userAvatar.src = user.photoURL;
        userAvatar.style.display = 'block';
    }
}

function hideUserInfo() {
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (userInfo) userInfo.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
}

window.handleGoogleLogin = handleGoogleLogin;
window.handleLogout = handleLogout;
window.getCurrentUser = () => currentUser;
window.isUserAuthenticated = () => isAuthenticated;

console.log('✅ Firebase Authentication UI ready');
