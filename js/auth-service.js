class AuthService {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authListeners = [];
        this.checkSession();
    }

    async checkSession() {
        try {
            const response = await fetch('/api/auth/session', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.authenticated && data.user) {
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.notifyListeners(data.user);
            } else {
                this.currentUser = null;
                this.isAuthenticated = false;
                this.notifyListeners(null);
            }
        } catch (error) {
            console.error('Error checking session:', error);
            this.currentUser = null;
            this.isAuthenticated = false;
            this.notifyListeners(null);
        }
    }

    onAuthStateChanged(callback) {
        this.authListeners.push(callback);
        if (this.currentUser !== undefined) {
            callback(this.currentUser);
        }
        return () => {
            this.authListeners = this.authListeners.filter(cb => cb !== callback);
        };
    }

    notifyListeners(user) {
        this.authListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Error in auth listener:', error);
            }
        });
    }

    async register(username, password, email = null) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password, email })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.notifyListeners(data.user);
                return { 
                    success: true, 
                    user: data.user,
                    message: data.message 
                };
            } else {
                return { 
                    success: false, 
                    error: data.error || 'Error al registrar usuario'
                };
            }
        } catch (error) {
            console.error('Error en registro:', error);
            return { 
                success: false, 
                error: 'Error de conexión. Por favor intenta de nuevo.' 
            };
        }
    }

    async login(username, password) {
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
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.notifyListeners(data.user);
                return { 
                    success: true, 
                    user: data.user,
                    message: data.message 
                };
            } else {
                return { 
                    success: false, 
                    error: data.error || 'Credenciales incorrectas'
                };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { 
                success: false, 
                error: 'Error de conexión. Por favor intenta de nuevo.' 
            };
        }
    }

    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            this.currentUser = null;
            this.isAuthenticated = false;
            this.notifyListeners(null);

            return { success: true, message: 'Sesión cerrada exitosamente' };
        } catch (error) {
            console.error('Error en logout:', error);
            this.currentUser = null;
            this.isAuthenticated = false;
            this.notifyListeners(null);
            return { success: true, message: 'Sesión cerrada' };
        }
    }

    async getProfile() {
        try {
            const response = await fetch('/api/auth/perfil', {
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            return { success: false, error: 'Error al obtener perfil' };
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}

const authService = new AuthService();

if (typeof window !== 'undefined') {
    window.authService = authService;
}

console.log('✅ AuthService initialized');
