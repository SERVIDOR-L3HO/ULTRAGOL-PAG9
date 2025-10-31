console.log('🔥 Firebase Configuration loading...');

const firebaseConfig = {
  apiKey: "AIzaSyAneyRjnZzvhIFLzykATmW4ShN3IVuf5E0",
  authDomain: "ligamx-daf3d.firebaseapp.com",
  projectId: "ligamx-daf3d",
  storageBucket: "ligamx-daf3d.appspot.com", 
  messagingSenderId: "437421248316",
  appId: "1:437421248316:web:38e9f436a57389d2c49839",
  measurementId: "G-LKVTFN2463"
};

if (typeof firebase !== 'undefined') {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase initialized successfully');
        } else {
            console.log('✅ Firebase already initialized');
        }
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        const storage = firebase.storage();
        
        window.auth = auth;
        window.db = db;
        window.storage = storage;
        
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        googleProvider.setCustomParameters({
            prompt: 'select_account'
        });
        window.googleProvider = googleProvider;
        
        window.signInWithGoogle = async function() {
            try {
                const result = await auth.signInWithPopup(googleProvider);
                console.log('✅ Logged in successfully:', result.user.displayName);
                return { success: true, user: result.user };
            } catch (error) {
                console.error('❌ Google sign-in error:', error);
                
                if (error.code === 'auth/unauthorized-domain') {
                    console.warn('⚠️ Dominio no autorizado. Configurar en Firebase Console:', window.location.hostname);
                    return { 
                        success: false, 
                        error: 'Para usar autenticación, el administrador debe agregar este dominio en Firebase Console.' 
                    };
                }
                
                return { success: false, error: error.message };
            }
        };
        
        window.signOutUser = async function() {
            try {
                await auth.signOut();
                console.log('✅ Logged out successfully');
                return { success: true };
            } catch (error) {
                console.error('❌ Sign out error:', error);
                return { success: false, error: error.message };
            }
        };
        
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ User authenticated:', user.displayName || user.email);
            } else {
                console.log('❌ User not authenticated');
            }
        });
        
        console.log('🔥 Firebase services ready');
        console.log('📱 Auth, Firestore, and Storage are available');
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
    }
} else {
    console.warn('⚠️ Firebase libraries not loaded. Make sure Firebase CDN scripts are included in HTML.');
}
