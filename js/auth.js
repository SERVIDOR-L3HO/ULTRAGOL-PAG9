console.log('UltraGol Authentication System loading...');

export let currentUser = null;

export function initAuth() {
    console.log('✅ Authentication system initialized');
    
    if (typeof window.authService === 'undefined') {
        console.error('❌ AuthService not loaded');
        showAuthInterface();
        return;
    }

    window.authService.onAuthStateChanged(async (user) => {
        currentUser = user;
        if (user) {
            console.log('✅ User authenticated:', user.username);
            showUserInterface();
            loadUserProfile();
        } else {
            console.log('❌ User not authenticated');
            showAuthInterface();
        }
        updateNavbarAuth();
    });
}

export async function registerUser(username, password, email = null, favoriteTeam = null) {
    try {
        showLoading('Creando cuenta...');
        
        const result = await window.authService.register(username, password, email);
        
        if (result.success) {
            hideLoading();
            showSuccessMessage('¡Cuenta creada exitosamente!');
            closeModal('authModal');
            return result.user;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

export async function loginUser(username, password) {
    try {
        showLoading('Iniciando sesión...');
        
        const result = await window.authService.login(username, password);
        
        if (result.success) {
            hideLoading();
            showSuccessMessage('¡Bienvenido de vuelta!');
            closeModal('authModal');
            return result.user;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

export async function logoutUser() {
    try {
        showLoading('Cerrando sesión...');
        
        const result = await window.authService.logout();
        
        if (result.success) {
            hideLoading();
            showSuccessMessage('Sesión cerrada correctamente');
            currentUser = null;
            showAuthInterface();
            updateNavbarAuth();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const result = await window.authService.getProfile();
        if (result.success && result.user) {
            const userData = result.user;
            
            const userDisplayName = document.getElementById('userDisplayName');
            const userInfo = document.getElementById('userInfo');
            
            if (userDisplayName) {
                userDisplayName.textContent = userData.username || 'Usuario';
            }
            if (userInfo) {
                userInfo.textContent = userData.username || 'Usuario';
            }
            
            console.log('✅ User profile loaded');
        }
    } catch (error) {
        console.error('❌ Error loading user profile:', error);
    }
}

function showUserInterface() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (authButtons) {
        authButtons.style.display = 'none';
        authButtons.style.visibility = 'hidden';
    }
    if (userMenu) {
        userMenu.style.display = 'flex';
        userMenu.style.visibility = 'visible';
    }
    
    enableAuthenticatedFeatures();
    
    console.log('✅ User interface updated - authenticated mode');
}

function showAuthInterface() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (authButtons) {
        authButtons.style.display = 'flex';
        authButtons.style.visibility = 'visible';
    }
    if (userMenu) {
        userMenu.style.display = 'none';
        userMenu.style.visibility = 'hidden';
    }
    
    disableAuthenticatedFeatures();
    
    console.log('❌ User interface updated - unauthenticated mode');
}

function updateNavbarAuth() {
    const navLinks = document.querySelectorAll('.nav-link');
    if (currentUser) {
        navLinks.forEach(link => {
            link.style.opacity = '1';
            link.style.pointerEvents = 'auto';
        });
        enableAuthenticatedFeatures();
    } else {
        disableAuthenticatedFeatures();
    }
}

function handleAuthError(error) {
    console.error('Authentication error:', error);
    
    let message = error.message || 'Error de autenticación';
    
    if (message.includes('incorrectas') || message.includes('incorrect')) {
        message = 'Usuario o contraseña incorrectos';
    } else if (message.includes('existe') || message.includes('already')) {
        message = 'Este usuario ya existe';
    } else if (message.includes('faltantes') || message.includes('required')) {
        message = 'Por favor completa todos los campos';
    } else if (message.includes('conexión') || message.includes('connection')) {
        message = 'Error de conexión. Por favor intenta de nuevo.';
    }
    
    showErrorMessage(message);
}

function showLoading(message) {
    const loadingEl = document.getElementById('loadingMessage');
    if (loadingEl) {
        loadingEl.textContent = message;
        loadingEl.style.display = 'block';
    }
}

function hideLoading() {
    const loadingEl = document.getElementById('loadingMessage');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

function showSuccessMessage(message) {
    console.log('✅ Success:', message);
    alert(message);
}

function showErrorMessage(message) {
    console.error('❌ Error:', message);
    alert(message);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function enableAuthenticatedFeatures() {
    const commentSections = document.querySelectorAll('.comments-section, .comment-form');
    commentSections.forEach(section => {
        section.style.display = 'block';
        section.classList.remove('auth-required');
    });
    
    const linkShareSections = document.querySelectorAll('.link-sharing-section, .share-link-btn');
    linkShareSections.forEach(section => {
        section.style.display = 'block';
        section.classList.remove('auth-required');
    });
    
    const authMessages = document.querySelectorAll('.auth-required-message');
    authMessages.forEach(message => {
        message.style.display = 'none';
    });
    
    const authContent = document.querySelectorAll('.auth-only-content');
    authContent.forEach(content => {
        content.style.display = 'block';
        content.classList.add('visible');
    });
    
    const profileButtons = document.querySelectorAll('.profile-required');
    profileButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('disabled');
    });
    
    console.log('✅ Authenticated features enabled');
}

function disableAuthenticatedFeatures() {
    const commentSections = document.querySelectorAll('.comments-section, .comment-form');
    commentSections.forEach(section => {
        section.style.display = 'none';
        section.classList.add('auth-required');
    });
    
    const linkShareSections = document.querySelectorAll('.link-sharing-section, .share-link-btn');
    linkShareSections.forEach(section => {
        section.style.display = 'none';
        section.classList.add('auth-required');
    });
    
    const authMessages = document.querySelectorAll('.auth-required-message');
    authMessages.forEach(message => {
        message.style.display = 'block';
    });
    
    const authContent = document.querySelectorAll('.auth-only-content');
    authContent.forEach(content => {
        content.style.display = 'none';
        content.classList.remove('visible');
    });
    
    const profileButtons = document.querySelectorAll('.profile-required');
    profileButtons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('disabled');
    });
    
    console.log('❌ Authenticated features disabled');
}

window.openAuthModal = function(mode) {
    const modal = document.getElementById('authModal');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const modalTitle = document.getElementById('authModalTitle');
    
    if (modal) {
        modal.style.display = 'flex';
        
        if (mode === 'register') {
            if (loginTab) loginTab.classList.remove('active');
            if (registerTab) registerTab.classList.add('active');
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
            if (modalTitle) modalTitle.textContent = 'Crear Cuenta';
        } else {
            if (loginTab) loginTab.classList.add('active');
            if (registerTab) registerTab.classList.remove('active');
            if (loginForm) loginForm.style.display = 'block';
            if (registerForm) registerForm.style.display = 'none';
            if (modalTitle) modalTitle.textContent = 'Iniciar Sesión';
        }
    }
};

window.closeAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.showAuthTab = function(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const modalTitle = document.getElementById('authModalTitle');
    
    if (tab === 'register') {
        if (loginTab) loginTab.classList.remove('active');
        if (registerTab) registerTab.classList.add('active');
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (modalTitle) modalTitle.textContent = 'Crear Cuenta';
    } else {
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (modalTitle) modalTitle.textContent = 'Iniciar Sesión';
    }
};

window.toggleProfileDropdown = function() {
    const dropdown = document.getElementById('profileDropdown');
    const icon = document.getElementById('dropdownIcon');
    
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        if (icon) {
            icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }
};

window.openUserProfile = function() {
    window.location.href = 'user-profile.html';
};

window.openUserPreferences = function() {
    window.location.href = 'user-profile.html#preferences';
};

window.openUserFavorites = function() {
    window.location.href = 'user-profile.html#activity';
};

window.openUserStats = function() {
    window.location.href = 'user-profile.html#stats';
};

window.logoutUser = async function() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        await logoutUser();
    }
};

function setupAuthForms() {
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('loginEmail')?.value || document.getElementById('loginUsername')?.value;
            const password = document.getElementById('loginPassword').value;
            await loginUser(username, password);
        });
    }
    
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('registerName')?.value || document.getElementById('registerUsername')?.value;
            const password = document.getElementById('registerPassword').value;
            const email = document.getElementById('registerEmail')?.value;
            const favoriteTeam = document.getElementById('registerFavoriteTeam')?.value;
            await registerUser(username, password, email, favoriteTeam);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    setupAuthForms();
});

console.log('✅ UltraGol Authentication System loaded');
