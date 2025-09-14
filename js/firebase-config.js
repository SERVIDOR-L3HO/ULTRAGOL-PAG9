// Firebase Configuration for UltraGol by L3HO - REAL MODE
console.log('UltraGol loaded with Firebase features');

// Firebase configuration with real credentials
const firebaseConfig = {
    apiKey: "AIzaSyAneyRjnZzvhIFLzykATmW4ShN3IVuf5E0",
    authDomain: "ligamx-daf3d.firebaseapp.com",
    projectId: "ligamx-daf3d",
    storageBucket: "ligamx-daf3d.appspot.com",
    messagingSenderId: "437421248316",
    appId: "1:437421248316:web:38e9f436a57389d2c49839",
    measurementId: "G-LKVTFN2463"
};

// Check if Firebase is loaded and initialize
if (typeof firebase !== 'undefined') {
    try {
        // Initialize Firebase with real configuration
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        // Initialize services
        const auth = firebase.auth();
        const db = firebase.firestore();
        const storage = firebase.storage();
        
        console.log('🔥 Firebase initialized successfully with REAL configuration');
        console.log('✅ Authentication, Firestore, and Storage ready');
        
        // Auth state observer
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ User authenticated:', user.displayName || user.email);
                // Update UI for authenticated user
                updateAuthUI(user);
                // Create/update user document
                createUserDocument(user);
            } else {
                console.log('❌ User not authenticated');
                updateAuthUI(null);
            }
        });
        
        // Real authentication functions
        window.signInWithEmail = async function(email, password) {
            try {
                const result = await auth.signInWithEmailAndPassword(email, password);
                return { success: true, user: result.user };
            } catch (error) {
                console.error('Login error:', error);
                return { success: false, error: error.message };
            }
        };
        
        window.signUpWithEmail = async function(email, password, displayName, favoriteTeam) {
            try {
                const result = await auth.createUserWithEmailAndPassword(email, password);
                
                // Update user profile
                await result.user.updateProfile({ displayName });
                
                // Create user document
                await createUserDocument(result.user, { favoriteTeam });
                
                return { success: true, user: result.user };
            } catch (error) {
                console.error('Registration error:', error);
                return { success: false, error: error.message };
            }
        };
        
        window.signInWithGoogle = async function() {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await auth.signInWithPopup(provider);
                return { success: true, user: result.user };
            } catch (error) {
                console.error('Google sign-in error:', error);
                
                // Specific domain error handling
                if (error.code === 'auth/unauthorized-domain') {
                    console.error('❌ Domain not authorized for Google Sign-In');
                    return { 
                        success: false, 
                        error: 'Este dominio necesita ser autorizado en Firebase Console para usar Google Sign-In.' 
                    };
                }
                
                return { success: false, error: error.message };
            }
        };
        
        window.signOutUser = async function() {
            try {
                await auth.signOut();
                return { success: true };
            } catch (error) {
                console.error('Sign out error:', error);
                return { success: false, error: error.message };
            }
        };
        
        // User document management
        async function createUserDocument(user, additionalData = {}) {
            if (!user) return;
            
            const userRef = db.collection('users').doc(user.uid);
            const snapshot = await userRef.get();
            
            if (!snapshot.exists) {
                try {
                    await userRef.set({
                        displayName: user.displayName || 'Usuario',
                        email: user.email,
                        photoURL: user.photoURL || '',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        level: 1,
                        points: 0,
                        favoriteTeam: additionalData.favoriteTeam || '',
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
                    console.log('✅ User document created successfully');
                } catch (error) {
                    console.error('❌ Error creating user document:', error);
                }
            }
        }
        
        // Update UI based on auth state
        function updateAuthUI(user) {
            const authButtons = document.getElementById('authButtons');
            const userMenu = document.getElementById('userMenu');
            const userDisplayName = document.getElementById('userDisplayName');
            const userLevel = document.getElementById('userLevel');
            const userPoints = document.getElementById('userPoints');
            
            if (user) {
                // User is signed in
                if (authButtons) authButtons.style.display = 'none';
                if (userMenu) userMenu.style.display = 'flex';
                if (userDisplayName) userDisplayName.textContent = user.displayName || 'Usuario';
                
                // Load user stats from Firestore
                loadUserStats(user.uid);
            } else {
                // User is signed out
                if (authButtons) authButtons.style.display = 'flex';
                if (userMenu) userMenu.style.display = 'none';
            }
        }
        
        // Load user statistics
        async function loadUserStats(uid) {
            try {
                const userDoc = await db.collection('users').doc(uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const userLevel = document.getElementById('userLevel');
                    const userPoints = document.getElementById('userPoints');
                    
                    if (userLevel) userLevel.textContent = userData.level || 1;
                    if (userPoints) userPoints.textContent = userData.points || 0;
                }
            } catch (error) {
                console.error('Error loading user stats:', error);
            }
        }
        
        // Make Firebase services globally available
        window.auth = auth;
        window.db = db;
        window.storage = storage;
        window.updateAuthUI = updateAuthUI;
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        console.log('🔄 Firebase failed to initialize with real config');
    }
} else {
    console.log('⚠️ Firebase libraries not loaded, waiting...');
    
    // Wait for Firebase to load
    setTimeout(() => {
        if (typeof firebase !== 'undefined') {
            console.log('🔄 Firebase loaded, reinitializing...');
            // Reinitialize Firebase
            location.reload();
        } else {
            console.log('❌ Firebase libraries failed to load');
        }
    }, 2000);
}

console.log('🔥 Firebase configuration script loaded');