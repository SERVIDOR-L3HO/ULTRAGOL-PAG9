import { 
    getFirestore, 
    doc, 
    getDoc,
    updateDoc,
    increment,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyAneyRjnZzvhIFLzykATmW4ShN3IVuf5E0",
    authDomain: "ligamx-daf3d.firebaseapp.com",
    projectId: "ligamx-daf3d",
    storageBucket: "ligamx-daf3d.appspot.com",
    messagingSenderId: "437421248316",
    appId: "1:437421248316:web:38e9f436a57389d2c49839",
    measurementId: "G-LKVTFN2463"
};

let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

const PROMO_STORAGE_KEY = 'ultragol_promo_status';
let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        await syncPromoStatusFromFirestore(user.uid);
    }
    updatePromoUI();
});

async function syncPromoStatusFromFirestore(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.promoExpiresAt) {
                const expiresAt = userData.promoExpiresAt.toDate().getTime();
                const now = new Date().getTime();
                
                if (now < expiresAt) {
                    const status = {
                        code: userData.lastPromoCode || 'PROMO',
                        redeemedAt: userData.promoRedeemedAt?.toDate()?.getTime() || now,
                        expiresAt: expiresAt,
                        durationDays: userData.promoDurationDays || 14,
                        synced: true
                    };
                    localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(status));
                    return status;
                } else {
                    localStorage.removeItem(PROMO_STORAGE_KEY);
                }
            }
        }
    } catch (e) {
        console.error('Error syncing promo status from Firestore:', e);
    }
    return null;
}

function getPromoStatus() {
    try {
        const stored = localStorage.getItem(PROMO_STORAGE_KEY);
        if (!stored) return null;
        
        const status = JSON.parse(stored);
        const now = new Date().getTime();
        
        if (status.expiresAt && now > status.expiresAt) {
            localStorage.removeItem(PROMO_STORAGE_KEY);
            return null;
        }
        
        return status;
    } catch (e) {
        console.error('Error reading promo status:', e);
        return null;
    }
}

function savePromoStatusLocal(code, durationDays, expiresAt) {
    const now = new Date().getTime();
    
    const status = {
        code: code,
        redeemedAt: now,
        expiresAt: expiresAt,
        durationDays: durationDays
    };
    
    localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(status));
    return status;
}

function updatePromoUI() {
    const statusDiv = document.getElementById('promoCodeStatus');
    const inputWrapper = document.querySelector('.promo-code-input-wrapper');
    const hint = document.querySelector('.promo-code-hint');
    
    if (!statusDiv) return;
    
    const status = getPromoStatus();
    
    if (status) {
        const daysLeft = Math.ceil((status.expiresAt - new Date().getTime()) / (24 * 60 * 60 * 1000));
        
        statusDiv.innerHTML = `
            <div class="promo-active">
                <i class="fas fa-check-circle"></i>
                <span>Sin anuncios activo</span>
            </div>
            <div class="promo-expires">
                <i class="fas fa-clock"></i>
                <span>Expira en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}</span>
            </div>
        `;
        statusDiv.classList.add('active');
        
        if (inputWrapper) inputWrapper.style.display = 'none';
        if (hint) hint.style.display = 'none';
        
        hideAds();
    } else {
        statusDiv.innerHTML = '<span class="promo-status-text">Sin código activo</span>';
        statusDiv.classList.remove('active');
        
        if (inputWrapper) inputWrapper.style.display = 'flex';
        if (hint) {
            hint.style.display = 'block';
            if (!currentUser) {
                hint.innerHTML = '<i class="fas fa-info-circle"></i> Inicia sesión para canjear códigos';
            } else {
                hint.textContent = 'Ingresa un código válido para disfrutar sin anuncios';
            }
        }
        
        showAds();
    }
}

function hideAds() {
    document.body.classList.add('ads-hidden');
    
    const adElements = document.querySelectorAll('.adsbygoogle, [data-ad-slot], ins.adsbygoogle');
    adElements.forEach(ad => {
        ad.style.display = 'none';
    });
    
    console.log('🎉 Anuncios ocultos - Código promocional activo');
}

function showAds() {
    document.body.classList.remove('ads-hidden');
    
    const adElements = document.querySelectorAll('.adsbygoogle, [data-ad-slot], ins.adsbygoogle');
    adElements.forEach(ad => {
        ad.style.display = '';
    });
}

async function redeemPromoCode() {
    const input = document.getElementById('promoCodeInput');
    const btn = document.getElementById('promoCodeBtn');
    
    if (!input || !btn) return;
    
    const code = input.value.trim().toUpperCase();
    
    if (!code) {
        showPromoNotification('Por favor ingresa un código', 'error');
        return;
    }
    
    if (!currentUser) {
        showPromoNotification('Debes iniciar sesión para canjear códigos', 'error');
        if (window.openLoginModal) {
            setTimeout(() => window.openLoginModal(), 1500);
        }
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        const codeRef = doc(db, 'promoCodes', code);
        const codeDoc = await getDoc(codeRef);
        
        if (!codeDoc.exists()) {
            showPromoNotification('Código no válido', 'error');
            return;
        }
        
        const codeData = codeDoc.data();
        
        if (!codeData.isActive) {
            showPromoNotification('Este código ya no está activo', 'error');
            return;
        }
        
        const now = new Date();
        if (codeData.expiresAt && codeData.expiresAt.toDate() < now) {
            showPromoNotification('Este código ha expirado', 'error');
            return;
        }
        
        if (codeData.maxUses && codeData.maxUses > 0 && codeData.currentUses >= codeData.maxUses) {
            showPromoNotification('Este código ha alcanzado el límite de usos', 'error');
            return;
        }
        
        const durationDays = codeData.durationDays || 14;
        const expiresAt = now.getTime() + (durationDays * 24 * 60 * 60 * 1000);
        
        try {
            await updateDoc(codeRef, {
                currentUses: increment(1),
                lastUsedAt: serverTimestamp()
            });
        } catch (writeError) {
            console.warn('No se pudo actualizar el contador de usos:', writeError);
        }
        
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                promoExpiresAt: new Date(expiresAt),
                promoRedeemedAt: serverTimestamp(),
                lastPromoCode: code,
                promoDurationDays: durationDays
            });
        } catch (userWriteError) {
            console.warn('No se pudo guardar en perfil de usuario:', userWriteError);
        }
        
        savePromoStatusLocal(code, durationDays, expiresAt);
        
        updatePromoUI();
        input.value = '';
        
        showPromoNotification(`¡Código activado! Sin anuncios por ${durationDays} días`, 'success');
        
    } catch (error) {
        console.error('Error redeeming promo code:', error);
        showPromoNotification('Error al validar el código. Intenta de nuevo.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i>';
    }
}

function showPromoNotification(message, type) {
    const existing = document.querySelector('.promo-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `promo-notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function isAdFree() {
    return getPromoStatus() !== null;
}

document.addEventListener('DOMContentLoaded', () => {
    updatePromoUI();
});

window.redeemPromoCode = redeemPromoCode;
window.isAdFree = isAdFree;
window.getPromoStatus = getPromoStatus;

console.log('🎫 Sistema de códigos promocionales inicializado');
