import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAneyRjnZzvhIFLzykATmW4ShN3IVuf5E0",
    authDomain: "ligamx-daf3d.firebaseapp.com",
    projectId: "ligamx-daf3d",
    storageBucket: "ligamx-daf3d.appspot.com",
    messagingSenderId: "437421248316",
    appId: "1:437421248316:web:38e9f436a57389d2c49839",
    measurementId: "G-LKVTFN2463"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = {
            uid: user.uid,
            username: user.displayName || user.email?.split('@')[0] || 'Usuario',
            email: user.email,
            photoURL: user.photoURL
        };
        updateUserUI();
        console.log('✅ Usuario autenticado:', currentUser.username);
    } else {
        currentUser = null;
        updateUserUI();
        console.log('👤 Usuario no autenticado');
    }
});

function updateUserUI() {
    const userBtn = document.getElementById('userBtn');
    const userDisplayName = document.getElementById('userDisplayName');
    const userStatus = document.getElementById('userStatus');
    const userMenuBody = document.getElementById('userMenuBody');
    const userMenuLogged = document.getElementById('userMenuLogged');
    const userAvatar = document.querySelector('.user-avatar');
    
    if (currentUser) {
        if (userBtn) userBtn.classList.add('logged-in');
        if (userDisplayName) userDisplayName.textContent = currentUser.username;
        if (userStatus) userStatus.textContent = currentUser.email || 'Usuario verificado';
        if (userMenuBody) userMenuBody.style.display = 'none';
        if (userMenuLogged) userMenuLogged.style.display = 'block';
        
        if (userAvatar) {
            if (currentUser.photoURL) {
                userAvatar.innerHTML = `<img src="${currentUser.photoURL}" alt="${currentUser.username}" class="avatar-img">`;
            } else {
                userAvatar.innerHTML = `<span class="avatar-initial">${currentUser.username.charAt(0).toUpperCase()}</span>`;
            }
            userAvatar.classList.add('has-user');
        }
    } else {
        if (userBtn) userBtn.classList.remove('logged-in');
        if (userDisplayName) userDisplayName.textContent = 'Invitado';
        if (userStatus) userStatus.textContent = 'No has iniciado sesión';
        if (userMenuBody) userMenuBody.style.display = 'block';
        if (userMenuLogged) userMenuLogged.style.display = 'none';
        
        if (userAvatar) {
            userAvatar.innerHTML = '<i class="fas fa-user"></i>';
            userAvatar.classList.remove('has-user');
        }
    }
}

window.toggleUserMenu = function() {
    const userMenu = document.getElementById('userMenu');
    userMenu.classList.toggle('active');
}

window.closeUserMenu = function() {
    const userMenu = document.getElementById('userMenu');
    userMenu.classList.remove('active');
}

window.openLoginModal = function() {
    closeUserMenu();
    const loginModal = document.getElementById('loginModal');
    loginModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginForm').reset();
}

window.closeLoginModal = function() {
    const loginModal = document.getElementById('loginModal');
    loginModal.classList.remove('active');
    document.body.style.overflow = '';
}

window.openRegisterModal = function() {
    closeUserMenu();
    closeLoginModal();
    const registerModal = document.getElementById('registerModal');
    registerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerForm').reset();
}

window.closeRegisterModal = function() {
    const registerModal = document.getElementById('registerModal');
    registerModal.classList.remove('active');
    document.body.style.overflow = '';
}

window.switchToRegister = function() {
    closeLoginModal();
    setTimeout(() => openRegisterModal(), 100);
}

window.switchToLogin = function() {
    closeRegisterModal();
    setTimeout(() => openLoginModal(), 100);
}

window.togglePasswordVisibility = function(inputId) {
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

window.handleLogin = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginSubmitBtn');
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Iniciando sesión...</span> <i class="fas fa-spinner fa-spin"></i>';
    errorDiv.style.display = 'none';
    
    try {
        const emailToUse = email.includes('@') ? email : `${email}@ultragol.app`;
        
        await signInWithEmailAndPassword(auth, emailToUse, password);
        closeLoginModal();
        showNotification('¡Bienvenido de vuelta!', 'success');
    } catch (error) {
        console.error('Error en login:', error);
        let errorMessage = 'Error al iniciar sesión';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Usuario no encontrado';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido';
                break;
            case 'auth/invalid-credential':
                errorMessage = 'Usuario o contraseña incorrectos';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Demasiados intentos. Intenta más tarde';
                break;
            default:
                errorMessage = error.message;
        }
        
        errorText.textContent = errorMessage;
        errorDiv.style.display = 'flex';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Iniciar Sesión</span> <i class="fas fa-arrow-right"></i>';
    }
}

window.handleRegister = async function(event) {
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
        const emailToUse = email || `${username.toLowerCase().replace(/\s/g, '')}@ultragol.app`;
        
        const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, password);
        const user = userCredential.user;
        
        await updateProfile(user, {
            displayName: username
        });
        
        await setDoc(doc(db, 'users', user.uid), {
            username: username,
            email: emailToUse,
            favoriteTeam: favoriteTeam || null,
            createdAt: serverTimestamp(),
            role: 'user'
        });
        
        closeRegisterModal();
        showNotification('¡Cuenta creada exitosamente! Bienvenido ' + username, 'success');
    } catch (error) {
        console.error('Error en registro:', error);
        let errorMessage = 'Error al crear la cuenta';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este usuario ya existe';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido';
                break;
            case 'auth/weak-password':
                errorMessage = 'La contraseña debe tener al menos 6 caracteres';
                break;
            default:
                errorMessage = error.message;
        }
        
        errorText.textContent = errorMessage;
        errorDiv.style.display = 'flex';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Crear Cuenta</span> <i class="fas fa-user-plus"></i>';
    }
}

window.signInWithGoogle = async function() {
    closeUserMenu();
    
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                username: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                role: 'user'
            });
        }
        
        showNotification('¡Bienvenido ' + user.displayName + '!', 'success');
    } catch (error) {
        console.error('Error con Google Sign-In:', error);
        
        if (error.code === 'auth/unauthorized-domain') {
            showNotification('Dominio no autorizado. Contacta al administrador.', 'error');
        } else if (error.code !== 'auth/popup-closed-by-user') {
            showNotification('Error al iniciar sesión con Google', 'error');
        }
    }
}

window.logoutUser = async function() {
    closeUserMenu();
    
    try {
        await signOut(auth);
        showNotification('Sesión cerrada', 'info');
    } catch (error) {
        console.error('Error en logout:', error);
        showNotification('Error al cerrar sesión', 'error');
    }
}

window.viewProfile = function() {
    closeUserMenu();
    if (currentUser) {
        showNotification('Perfil: ' + currentUser.username + ' (' + currentUser.email + ')', 'info');
    }
}

window.viewFavorites = function() {
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

window.getCurrentUser = function() {
    return currentUser;
}

window.isUserLoggedIn = function() {
    return currentUser !== null;
}

console.log('🔐 Firebase Auth inicializado');
