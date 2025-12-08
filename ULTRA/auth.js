let currentUser = null;
let isAuthenticated = false;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthSession();
});

async function checkAuthSession() {
    try {
        const response = await fetch('/api/auth/session', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.authenticated && data.user) {
            currentUser = data.user;
            isAuthenticated = true;
            updateUserUI();
        }
    } catch (error) {
        console.log('No hay sesión activa');
    }
}

function updateUserUI() {
    const userBtn = document.getElementById('userBtn');
    const userDisplayName = document.getElementById('userDisplayName');
    const userStatus = document.getElementById('userStatus');
    const userMenuBody = document.getElementById('userMenuBody');
    const userMenuLogged = document.getElementById('userMenuLogged');
    const userAvatar = document.querySelector('.user-avatar');
    
    if (isAuthenticated && currentUser) {
        userBtn.classList.add('logged-in');
        userDisplayName.textContent = currentUser.username;
        userStatus.textContent = currentUser.email || 'Usuario verificado';
        userMenuBody.style.display = 'none';
        userMenuLogged.style.display = 'block';
        
        if (userAvatar) {
            userAvatar.innerHTML = `<span class="avatar-initial">${currentUser.username.charAt(0).toUpperCase()}</span>`;
            userAvatar.classList.add('has-user');
        }
    } else {
        userBtn.classList.remove('logged-in');
        userDisplayName.textContent = 'Invitado';
        userStatus.textContent = 'No has iniciado sesión';
        userMenuBody.style.display = 'block';
        userMenuLogged.style.display = 'none';
        
        if (userAvatar) {
            userAvatar.innerHTML = '<i class="fas fa-user"></i>';
            userAvatar.classList.remove('has-user');
        }
    }
}

function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    userMenu.classList.toggle('active');
}

function closeUserMenu() {
    const userMenu = document.getElementById('userMenu');
    userMenu.classList.remove('active');
}

function openLoginModal() {
    closeUserMenu();
    const loginModal = document.getElementById('loginModal');
    loginModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginForm').reset();
}

function closeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    loginModal.classList.remove('active');
    document.body.style.overflow = '';
}

function openRegisterModal() {
    closeUserMenu();
    closeLoginModal();
    const registerModal = document.getElementById('registerModal');
    registerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerForm').reset();
}

function closeRegisterModal() {
    const registerModal = document.getElementById('registerModal');
    registerModal.classList.remove('active');
    document.body.style.overflow = '';
}

function switchToRegister() {
    closeLoginModal();
    setTimeout(() => openRegisterModal(), 100);
}

function switchToLogin() {
    closeRegisterModal();
    setTimeout(() => openLoginModal(), 100);
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.classList.remove('fa-eye');
        button.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        button.classList.remove('fa-eye-slash');
        button.classList.add('fa-eye');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginSubmitBtn');
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Iniciando sesión...</span> <i class="fas fa-spinner fa-spin"></i>';
    errorDiv.style.display = 'none';
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            isAuthenticated = true;
            updateUserUI();
            closeLoginModal();
            showNotification('¡Bienvenido ' + currentUser.username + '!', 'success');
        } else {
            errorText.textContent = data.error || 'Usuario o contraseña incorrectos';
            errorDiv.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error en login:', error);
        errorText.textContent = 'Error de conexión. Intenta más tarde.';
        errorDiv.style.display = 'flex';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Iniciar Sesión</span> <i class="fas fa-arrow-right"></i>';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const favoriteTeam = document.getElementById('registerTeam').value;
    const submitBtn = document.getElementById('registerSubmitBtn');
    const errorDiv = document.getElementById('registerError');
    const errorText = document.getElementById('registerErrorText');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Creando cuenta...</span> <i class="fas fa-spinner fa-spin"></i>';
    errorDiv.style.display = 'none';
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password, email, favoriteTeam })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            isAuthenticated = true;
            updateUserUI();
            closeRegisterModal();
            showNotification('¡Cuenta creada exitosamente! Bienvenido ' + currentUser.username, 'success');
        } else {
            errorText.textContent = data.error || 'Error al crear la cuenta';
            errorDiv.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error en registro:', error);
        errorText.textContent = 'Error de conexión. Intenta más tarde.';
        errorDiv.style.display = 'flex';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Crear Cuenta</span> <i class="fas fa-user-plus"></i>';
    }
}

async function logoutUser() {
    closeUserMenu();
    
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Error en logout:', error);
    }
    
    currentUser = null;
    isAuthenticated = false;
    updateUserUI();
    showNotification('Sesión cerrada', 'info');
}

function viewProfile() {
    closeUserMenu();
    showNotification('Perfil de usuario - Próximamente', 'info');
}

function viewFavorites() {
    closeUserMenu();
    showNotification('Mis favoritos - Próximamente', 'info');
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.auth-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
