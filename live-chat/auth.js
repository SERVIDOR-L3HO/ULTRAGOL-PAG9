console.log('🔐 Auth system loading...');

let auth = null;
let db = null;

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

function initAuth() {
    if (typeof firebase === 'undefined') {
        showToast('Error: Firebase no está cargado', 'error');
        return;
    }

    auth = firebase.auth();
    db = firebase.firestore();

    if (!auth || !db) {
        showToast('Error: Servicios de Firebase no disponibles', 'error');
        return;
    }

    console.log('✅ Firebase Auth initialized');
    setupEventListeners();
    checkAuthState();
}

function setupEventListeners() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('emailLoginForm').addEventListener('submit', handleEmailLogin);
    document.getElementById('emailRegisterForm').addEventListener('submit', handleEmailRegister);
    
    document.getElementById('googleLoginBtn').addEventListener('click', handleGoogleLogin);
    document.getElementById('googleRegisterBtn').addEventListener('click', handleGoogleLogin);
    
    document.getElementById('forgotPasswordLink').addEventListener('click', handleForgotPassword);

    const registerPassword = document.getElementById('registerPassword');
    registerPassword.addEventListener('input', () => {
        updatePasswordStrength(registerPassword.value);
    });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });

    const activeTab = document.querySelector(`[data-tab="${tab}"]`);
    const activeForm = document.getElementById(`${tab}-form`);
    
    if (activeTab && activeForm) {
        activeTab.classList.add('active');
        activeForm.classList.add('active');
    }
}

function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('✅ Usuario autenticado:', user.email);
            redirectToChat();
        } else {
            console.log('⚠️ Usuario no autenticado');
        }
    });
}

async function handleEmailLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!email || !password) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }

    showLoading(true);

    try {
        if (rememberMe) {
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } else {
            await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }

        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log('✅ Login exitoso:', user.email);
        showToast('¡Bienvenido de nuevo!', 'success');

        setTimeout(() => {
            redirectToChat();
        }, 1000);

    } catch (error) {
        console.error('❌ Error en login:', error);
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
}

async function handleEmailRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const acceptTerms = document.getElementById('acceptTerms').checked;

    if (!name || !email || !password || !passwordConfirm) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }

    if (password !== passwordConfirm) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    if (!acceptTerms) {
        showToast('Debes aceptar los términos y condiciones', 'error');
        return;
    }

    showLoading(true);

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        await user.updateProfile({
            displayName: name
        });

        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            name: name,
            email: email,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=9d4edd&color=fff`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isAnonymous: false
        });

        console.log('✅ Registro exitoso:', user.email);
        showToast('¡Cuenta creada exitosamente!', 'success');

        setTimeout(() => {
            redirectToChat();
        }, 1000);

    } catch (error) {
        console.error('❌ Error en registro:', error);
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
}

async function handleGoogleLogin() {
    showLoading(true);

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=9d4edd&color=fff`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isAnonymous: false
            });
        }

        console.log('✅ Login con Google exitoso:', user.email);
        showToast('¡Bienvenido!', 'success');

        setTimeout(() => {
            redirectToChat();
        }, 1000);

    } catch (error) {
        console.error('❌ Error en login con Google:', error);
        
        if (error.code === 'auth/popup-closed-by-user') {
            showToast('Login cancelado', 'error');
        } else if (error.code === 'auth/unauthorized-domain') {
            showToast('Dominio no autorizado. Contacta al administrador.', 'error');
        } else {
            handleAuthError(error);
        }
    } finally {
        showLoading(false);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    
    if (!email) {
        showToast('Por favor ingresa tu email primero', 'error');
        document.getElementById('loginEmail').focus();
        return;
    }

    showLoading(true);

    try {
        await auth.sendPasswordResetEmail(email);
        showToast('Email de recuperación enviado. Revisa tu bandeja de entrada.', 'success');
    } catch (error) {
        console.error('❌ Error al enviar email de recuperación:', error);
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
}

function updatePasswordStrength(password) {
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (!password) {
        strengthIndicator.classList.remove('visible', 'weak', 'medium', 'strong');
        return;
    }

    strengthIndicator.classList.add('visible');
    strengthIndicator.classList.remove('weak', 'medium', 'strong');

    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) {
        strengthIndicator.classList.add('weak');
    } else if (strength <= 3) {
        strengthIndicator.classList.add('medium');
    } else {
        strengthIndicator.classList.add('strong');
    }
}

function handleAuthError(error) {
    let message = 'Ocurrió un error. Intenta de nuevo.';

    switch (error.code) {
        case 'auth/email-already-in-use':
            message = 'Este email ya está registrado';
            break;
        case 'auth/invalid-email':
            message = 'Email inválido';
            break;
        case 'auth/weak-password':
            message = 'La contraseña es muy débil';
            break;
        case 'auth/user-not-found':
            message = 'Usuario no encontrado';
            break;
        case 'auth/wrong-password':
            message = 'Contraseña incorrecta';
            break;
        case 'auth/too-many-requests':
            message = 'Demasiados intentos. Intenta más tarde.';
            break;
        case 'auth/network-request-failed':
            message = 'Error de conexión. Verifica tu internet.';
            break;
        default:
            message = error.message || message;
    }

    showToast(message, 'error');
}

function redirectToChat() {
    window.location.href = 'index.html';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('authToast');
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('i');

    toast.classList.remove('success', 'error');
    toast.classList.add(type);

    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle';
    } else {
        toastIcon.className = 'fas fa-exclamation-circle';
    }

    toastMessage.textContent = message;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (show) {
        loadingOverlay.classList.add('show');
    } else {
        loadingOverlay.classList.remove('show');
    }
}

console.log('✅ Auth system ready');
