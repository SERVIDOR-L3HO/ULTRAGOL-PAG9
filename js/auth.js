// Authentication System for Liga MX UltraGol - REAL MODE
console.log('Real-time authentication system loading...');

// Current user state
export let currentUser = null;

// Initialize auth system
export function initAuth() {
    console.log('Real-time updates system initialized (static mode)');
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.log('⚠️ Firebase not loaded, using static mode');
        showAuthInterface();
        return;
    }

    // Real Firebase auth state observer
    firebase.auth().onAuthStateChanged(async (user) => {
        currentUser = user;
        if (user) {
            console.log('✅ User authenticated:', user.displayName || user.email);
            await createOrUpdateUserProfile(user);
            showUserInterface();
            loadUserProfile();
        } else {
            console.log('❌ User not authenticated');
            showAuthInterface();
        }
        updateNavbarAuth();
    });
}

// Register new user with Firebase
export async function registerUser(email, password, displayName, favoriteTeam) {
    try {
        showLoading('Creando cuenta...');
        
        // Use global Firebase functions from firebase-config.js
        const result = await window.signUpWithEmail(email, password, displayName, favoriteTeam);
        
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

// Login user with Firebase
export async function loginUser(email, password) {
    try {
        showLoading('Iniciando sesión...');
        
        // Use global Firebase functions from firebase-config.js
        const result = await window.signInWithEmail(email, password);
        
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

// Google Sign In
export async function signInWithGoogle() {
    try {
        showLoading('Conectando con Google...');
        
        // Use global Firebase functions from firebase-config.js
        const result = await window.signInWithGoogle();
        
        if (result.success) {
            hideLoading();
            showSuccessMessage('¡Conectado con Google exitosamente!');
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

// Logout user
export async function logoutUser() {
    try {
        showLoading('Cerrando sesión...');
        
        // Use global Firebase functions from firebase-config.js
        const result = await window.signOutUser();
        
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

// Reset password
export async function resetPassword(email) {
    try {
        showLoading('Enviando email de recuperación...');
        
        if (typeof firebase === 'undefined' || !firebase.auth) {
            throw new Error('Firebase no está disponible');
        }

        await firebase.auth().sendPasswordResetEmail(email);
        
        hideLoading();
        showSuccessMessage('Email de recuperación enviado. Revisa tu bandeja de entrada.');
        closeModal('authModal');
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

// Create or update user profile in Firestore
async function createOrUpdateUserProfile(user) {
    if (!window.db || !user) return;
    
    try {
        const userRef = window.db.collection('users').doc(user.uid);
        const snapshot = await userRef.get();
        
        if (!snapshot.exists) {
            // Create new user profile
            await userRef.set({
                displayName: user.displayName || 'Usuario',
                email: user.email,
                photoURL: user.photoURL || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                level: 1,
                points: 0,
                favoriteTeam: '',
                badges: [],
                preferences: {
                    notifications: true,
                    theme: 'auto',
                    language: 'es'
                },
                stats: {
                    predictionsCorrect: 0,
                    predictionsTotal: 0,
                    commentsCount: 0,
                    articlesRead: 0
                }
            });
            console.log('✅ User profile created');
        } else {
            // Update existing profile
            await userRef.update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                displayName: user.displayName || snapshot.data().displayName
            });
            console.log('✅ User profile updated');
        }
    } catch (error) {
        console.error('❌ Error managing user profile:', error);
    }
}

// Load user profile data
async function loadUserProfile() {
    if (!window.db || !currentUser) return;
    
    try {
        const userDoc = await window.db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Update UI with user data
            const userLevel = document.getElementById('userLevel');
            const userPoints = document.getElementById('userPoints');
            const userDisplayName = document.getElementById('userDisplayName');
            
            if (userLevel) userLevel.textContent = userData.level || 1;
            if (userPoints) userPoints.textContent = userData.points || 0;
            if (userDisplayName) userDisplayName.textContent = userData.displayName || 'Usuario';
            
            console.log('✅ User profile loaded');
        }
    } catch (error) {
        console.error('❌ Error loading user profile:', error);
    }
}

// Enhanced UI Functions
function showUserInterface() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    // Hide auth buttons and show user menu
    if (authButtons) {
        authButtons.style.display = 'none';
        authButtons.style.visibility = 'hidden';
    }
    if (userMenu) {
        userMenu.style.display = 'flex';
        userMenu.style.visibility = 'visible';
    }
    
    // Enable authenticated features
    enableAuthenticatedFeatures();
    
    console.log('✅ User interface updated - authenticated mode');
}

function showAuthInterface() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    // Show auth buttons and hide user menu
    if (authButtons) {
        authButtons.style.display = 'flex';
        authButtons.style.visibility = 'visible';
    }
    if (userMenu) {
        userMenu.style.display = 'none';
        userMenu.style.visibility = 'hidden';
    }
    
    // Disable authenticated features
    disableAuthenticatedFeatures();
    
    console.log('❌ User interface updated - unauthenticated mode');
}

function updateNavbarAuth() {
    // Update navigation based on auth state
    const navLinks = document.querySelectorAll('.nav-link');
    if (currentUser) {
        // User is logged in - enable all features
        navLinks.forEach(link => {
            link.style.opacity = '1';
            link.style.pointerEvents = 'auto';
        });
        enableAuthenticatedFeatures();
    } else {
        // User is logged out - show limited features
        disableAuthenticatedFeatures();
    }
}

// Error handling
function handleAuthError(error) {
    console.error('Authentication error:', error);
    
    let message = 'Error de autenticación';
    
    if (error.code) {
        switch (error.code) {
            case 'auth/invalid-email':
                message = 'Email inválido';
                break;
            case 'auth/user-disabled':
                message = 'Usuario deshabilitado';
                break;
            case 'auth/user-not-found':
                message = 'Usuario no encontrado';
                break;
            case 'auth/wrong-password':
                message = 'Contraseña incorrecta';
                break;
            case 'auth/email-already-in-use':
                message = 'Este email ya está en uso';
                break;
            case 'auth/weak-password':
                message = 'La contraseña debe tener al menos 6 caracteres';
                break;
            case 'auth/network-request-failed':
                message = 'Error de conexión. Verifica tu internet.';
                break;
            case 'auth/unauthorized-domain':
                message = 'Dominio no autorizado para autenticación';
                break;
            default:
                message = error.message || 'Error desconocido';
        }
    }
    
    showErrorMessage(message);
}

// Loading functions
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

// Message functions
function showSuccessMessage(message) {
    console.log('✅ Success:', message);
    // Add visual success notification here
}

function showErrorMessage(message) {
    console.error('❌ Error:', message);
    alert(message); // Simple alert for now
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Enable authenticated features
function enableAuthenticatedFeatures() {
    // Enable comments sections
    const commentSections = document.querySelectorAll('.comments-section, .comment-form');
    commentSections.forEach(section => {
        section.style.display = 'block';
        section.classList.remove('auth-required');
    });
    
    // Enable stream links sharing
    const linkShareSections = document.querySelectorAll('.link-sharing-section, .share-link-btn');
    linkShareSections.forEach(section => {
        section.style.display = 'block';
        section.classList.remove('auth-required');
    });
    
    // Remove auth required messages
    const authMessages = document.querySelectorAll('.auth-required-message');
    authMessages.forEach(message => {
        message.style.display = 'none';
    });
    
    // Show authenticated content
    const authContent = document.querySelectorAll('.auth-only-content');
    authContent.forEach(content => {
        content.style.display = 'block';
        content.classList.add('visible');
    });
    
    // Enable profile-related features
    const profileButtons = document.querySelectorAll('.profile-required');
    profileButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('disabled');
    });
    
    console.log('✅ Authenticated features enabled');
}

// Disable authenticated features
function disableAuthenticatedFeatures() {
    // Hide comments sections and show auth required message
    const commentSections = document.querySelectorAll('.comments-section, .comment-form');
    commentSections.forEach(section => {
        section.style.display = 'none';
        section.classList.add('auth-required');
    });
    
    // Hide stream links sharing
    const linkShareSections = document.querySelectorAll('.link-sharing-section, .share-link-btn');
    linkShareSections.forEach(section => {
        section.style.display = 'none';
        section.classList.add('auth-required');
    });
    
    // Show auth required messages
    const authMessages = document.querySelectorAll('.auth-required-message');
    authMessages.forEach(message => {
        message.style.display = 'block';
    });
    
    // Hide authenticated content
    const authContent = document.querySelectorAll('.auth-only-content');
    authContent.forEach(content => {
        content.style.display = 'none';
        content.classList.remove('visible');
    });
    
    // Disable profile-related features
    const profileButtons = document.querySelectorAll('.profile-required');
    profileButtons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('disabled');
    });
    
    console.log('❌ Authenticated features disabled');
}

// Global functions for modal management
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
            loginTab.classList.remove('active');
            registerTab.classList.add('active');
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            modalTitle.textContent = 'Crear Cuenta';
        } else {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            modalTitle.textContent = 'Iniciar Sesión';
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
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        modalTitle.textContent = 'Crear Cuenta';
    } else {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        modalTitle.textContent = 'Iniciar Sesión';
    }
};

// Profile management functions
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
        await signOutUser();
    }
};

// Form handlers
function setupAuthForms() {
    // Login form
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await loginUser(email, password);
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const favoriteTeam = document.getElementById('registerFavoriteTeam').value;
            await registerUser(email, password, name, favoriteTeam);
        });
    }
}

// Initialize auth forms when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    setupAuthForms();
});

console.log('✅ Enhanced authentication system loaded');