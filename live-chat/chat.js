console.log('🚀 UltraGol Live Chat initializing...');

let currentUser = null;
let messagesListener = null;
let messageCount = 0;
let activeUsers = new Set();
let soundEnabled = true;
let typingTimeout = null;
let allMessages = [];

const emojis = ['⚽', '🔥', '👏', '😂', '😍', '🎉', '💪', '👀', '🤔', '😱', 
                '🙌', '💯', '❤️', '⚡', '🏆', '🎯', '👑', '💥', '🌟', '✨',
                '😎', '🤩', '😤', '🥳', '🔴', '🟢', '🔵', '🟡', '⭐', '💚'];

const notificationSounds = {
    message: () => playSound(800, 100),
    send: () => playSound(600, 80),
    reaction: () => playSound(1000, 60)
};

document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
});

function initializeChat() {
    console.log('Initializing chat system...');
    
    setTimeout(() => {
        if (typeof window.auth !== 'undefined' && typeof window.db !== 'undefined') {
            console.log('✅ Firebase loaded, setting up chat');
            setupFirebaseChat();
        } else {
            console.warn('⚠️ Firebase not available, retrying...');
            initializeChat();
        }
    }, 500);
    
    setupEventListeners();
    setupEmojiPicker();
    setupQuickReactions();
    updateViewerCount();
    setInterval(updateViewerCount, 30000);
}

function setupFirebaseChat() {
    window.auth.onAuthStateChanged((user) => {
        currentUser = user;
        updateAuthUI(user);
        
        if (user) {
            console.log('✅ User authenticated:', user.displayName);
            enableChat();
            listenToMessages();
            updateUserPresence(true);
        } else {
            console.log('❌ User not authenticated');
            disableChat();
            if (messagesListener) {
                messagesListener();
                messagesListener = null;
            }
        }
    });
}

function setupEventListeners() {
    const authBtn = document.getElementById('authBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    const emojiBtn = document.getElementById('emojiBtn');
    const searchBtn = document.getElementById('searchBtn');
    const soundBtn = document.getElementById('soundBtn');
    const searchInput = document.getElementById('searchInput');
    const searchClose = document.getElementById('searchClose');
    
    if (authBtn) {
        authBtn.addEventListener('click', handleLogin);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        messageInput.addEventListener('input', (e) => {
            const charCount = document.getElementById('charCount');
            if (charCount) {
                charCount.textContent = `${e.target.value.length}/200`;
            }
            
            if (currentUser && e.target.value.length > 0) {
                handleTyping();
            }
        });
    }
    
    if (emojiBtn) {
        emojiBtn.addEventListener('click', toggleEmojiPicker);
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', toggleSearch);
    }
    
    if (soundBtn) {
        soundBtn.addEventListener('click', toggleSound);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterMessages(e.target.value);
        });
    }
    
    if (searchClose) {
        searchClose.addEventListener('click', () => {
            document.getElementById('searchContainer').style.display = 'none';
            document.getElementById('searchBtn').classList.remove('active');
            document.getElementById('searchInput').value = '';
            filterMessages('');
        });
    }
}

function setupEmojiPicker() {
    const emojiGrid = document.getElementById('emojiGrid');
    const emojiClose = document.getElementById('emojiClose');
    
    if (emojiGrid) {
        emojis.forEach(emoji => {
            const emojiItem = document.createElement('div');
            emojiItem.className = 'emoji-item';
            emojiItem.textContent = emoji;
            emojiItem.addEventListener('click', () => {
                insertEmoji(emoji);
            });
            emojiGrid.appendChild(emojiItem);
        });
    }
    
    if (emojiClose) {
        emojiClose.addEventListener('click', () => {
            document.getElementById('emojiPicker').style.display = 'none';
        });
    }
}

function setupQuickReactions() {
    const quickReactions = document.querySelectorAll('.quick-reaction');
    quickReactions.forEach(btn => {
        btn.addEventListener('click', () => {
            const reaction = btn.dataset.reaction;
            insertEmoji(reaction);
        });
    });
}

function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    if (emojiPicker) {
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleSearch() {
    const searchContainer = document.getElementById('searchContainer');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchContainer.style.display === 'none') {
        searchContainer.style.display = 'block';
        searchBtn.classList.add('active');
        document.getElementById('searchInput').focus();
    } else {
        searchContainer.style.display = 'none';
        searchBtn.classList.remove('active');
        document.getElementById('searchInput').value = '';
        filterMessages('');
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundBtn = document.getElementById('soundBtn');
    if (soundEnabled) {
        soundBtn.classList.remove('active');
        soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        showToast('Sonido', 'Notificaciones de sonido activadas', 'success');
    } else {
        soundBtn.classList.add('active');
        soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        showToast('Silencio', 'Notificaciones de sonido desactivadas', 'success');
    }
}

function filterMessages(searchText) {
    const messages = document.querySelectorAll('.message-item');
    const searchLower = searchText.toLowerCase();
    
    messages.forEach(msg => {
        const text = msg.querySelector('.message-text')?.textContent.toLowerCase() || '';
        const username = msg.querySelector('.message-username')?.textContent.toLowerCase() || '';
        
        if (text.includes(searchLower) || username.includes(searchLower) || !searchText) {
            msg.style.display = 'flex';
        } else {
            msg.style.display = 'none';
        }
    });
}

function insertEmoji(emoji) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value += emoji;
        messageInput.focus();
        document.getElementById('charCount').textContent = `${messageInput.value.length}/200`;
    }
}

function handleTyping() {
    if (!currentUser || !window.db) return;
    
    clearTimeout(typingTimeout);
    
    window.db.collection('typing').doc(currentUser.uid).set({
        username: currentUser.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    typingTimeout = setTimeout(() => {
        if (currentUser && window.db) {
            window.db.collection('typing').doc(currentUser.uid).delete();
        }
    }, 3000);
}

async function handleLogin() {
    if (typeof window.signInWithGoogle === 'undefined') {
        showToast('Error', 'Firebase no está disponible', 'error');
        return;
    }
    
    const authBtn = document.getElementById('authBtn');
    authBtn.disabled = true;
    authBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
    
    try {
        const result = await window.signInWithGoogle();
        if (result.success) {
            showToast('¡Bienvenido!', `Hola ${result.user.displayName}`, 'success');
            playSound(600, 100);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Error', 'No se pudo iniciar sesión', 'error');
        authBtn.disabled = false;
        authBtn.innerHTML = '<i class="fab fa-google"></i> Iniciar Sesión';
    }
}

async function handleLogout() {
    if (!confirm('¿Cerrar sesión?')) return;
    
    try {
        await updateUserPresence(false);
        
        if (window.db && currentUser) {
            await window.db.collection('typing').doc(currentUser.uid).delete();
        }
        
        await window.signOutUser();
        showToast('Adiós', 'Sesión cerrada correctamente', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error', 'No se pudo cerrar sesión', 'error');
    }
}

function updateAuthUI(user) {
    const authBtn = document.getElementById('authBtn');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (user) {
        authBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = user.displayName || 'Usuario';
        if (userAvatar && user.photoURL) {
            userAvatar.src = user.photoURL;
        }
    } else {
        authBtn.style.display = 'flex';
        userInfo.style.display = 'none';
        authBtn.innerHTML = '<i class="fab fa-google"></i> Iniciar Sesión';
        authBtn.disabled = false;
    }
}

function enableChat() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const gifBtn = document.getElementById('gifBtn');
    
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = 'Enviar un mensaje...';
    }
    if (sendBtn) sendBtn.disabled = false;
    if (gifBtn) gifBtn.disabled = false;
    
    const hint = document.querySelector('.input-hint');
    if (hint) hint.style.display = 'none';
}

function disableChat() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const gifBtn = document.getElementById('gifBtn');
    
    if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = 'Inicia sesión para chatear...';
    }
    if (sendBtn) sendBtn.disabled = true;
    if (gifBtn) gifBtn.disabled = true;
    
    const hint = document.querySelector('.input-hint');
    if (hint) hint.style.display = 'flex';
}

function listenToMessages() {
    if (!window.db) return;
    
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Cargando mensajes...</div>
        </div>
    `;
    
    const messagesRef = window.db.collection('liveChat')
        .orderBy('timestamp', 'desc')
        .limit(100);
    
    messagesListener = messagesRef.onSnapshot((snapshot) => {
        const loadingContainer = messagesContainer.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.remove();
        }
        
        const welcomeMsg = messagesContainer.querySelector('.welcome-message');
        if (welcomeMsg && !snapshot.empty) {
            welcomeMsg.remove();
        }
        
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const message = { id: change.doc.id, ...change.doc.data() };
                allMessages.push(message);
                addMessageToUI(message);
                messageCount++;
                
                if (soundEnabled && message.userId !== currentUser?.uid) {
                    notificationSounds.message();
                }
            }
        });
        
        updateMessageCount();
    }, (error) => {
        console.error('Error listening to messages:', error);
        showToast('Error', 'No se pueden cargar los mensajes', 'error');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Error al cargar mensajes</h2>
                <p>Por favor, recarga la página</p>
            </div>
        `;
    });
    
    listenToTyping();
}

function listenToTyping() {
    if (!window.db) return;
    
    window.db.collection('typing').onSnapshot((snapshot) => {
        const typingIndicator = document.getElementById('typingIndicator');
        const typingUsers = document.getElementById('typingUsers');
        
        const users = [];
        snapshot.forEach((doc) => {
            if (doc.id !== currentUser?.uid) {
                users.push(doc.data().username);
            }
        });
        
        if (users.length > 0) {
            typingUsers.textContent = users.length === 1 ? users[0] : `${users.length} personas`;
            typingIndicator.style.display = 'block';
        } else {
            typingIndicator.style.display = 'none';
        }
    });
}

function addMessageToUI(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-item';
    messageDiv.dataset.id = message.id;
    
    const isVIP = message.userId && message.userId.includes('vip');
    const timestamp = message.timestamp ? 
        new Date(message.timestamp.toDate()).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }) : '';
    
    messageDiv.innerHTML = `
        <img class="message-avatar" src="${message.photoURL || 'https://via.placeholder.com/36'}" alt="">
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${escapeHtml(message.username)}</span>
                ${isVIP ? '<span class="message-badge badge-vip">⭐ VIP</span>' : ''}
                ${message.verified ? '<span class="message-badge badge-verified"><i class="fas fa-check-circle"></i></span>' : ''}
                <span class="message-timestamp">${timestamp}</span>
            </div>
            <div class="message-text">${escapeHtml(message.text)}</div>
            <div class="message-actions">
                <button class="reaction-btn" data-reaction="👍" onclick="addReaction('${message.id}', '👍')">
                    👍
                </button>
                <button class="reaction-btn" data-reaction="❤️" onclick="addReaction('${message.id}', '❤️')">
                    ❤️
                </button>
                <button class="reaction-btn" data-reaction="🔥" onclick="addReaction('${message.id}', '🔥')">
                    🔥
                </button>
                <button class="reaction-btn" data-reaction="😂" onclick="addReaction('${message.id}', '😂')">
                    😂
                </button>
            </div>
            <div class="message-reactions" id="reactions-${message.id}"></div>
        </div>
    `;
    
    if (messagesContainer.firstChild) {
        messagesContainer.insertBefore(messageDiv, messagesContainer.firstChild);
    } else {
        messagesContainer.appendChild(messageDiv);
    }
    
    if (messagesContainer.children.length > 100) {
        messagesContainer.lastChild.remove();
    }
}

window.addReaction = async function(messageId, reaction) {
    if (!currentUser || !window.db) {
        showToast('Error', 'Debes iniciar sesión para reaccionar', 'error');
        return;
    }
    
    try {
        const reactionRef = window.db.collection('liveChat').doc(messageId)
            .collection('reactions').doc(currentUser.uid);
        
        await reactionRef.set({
            reaction: reaction,
            username: currentUser.displayName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (soundEnabled) {
            notificationSounds.reaction();
        }
    } catch (error) {
        console.error('Error adding reaction:', error);
    }
};

async function sendMessage() {
    if (!currentUser || !window.db) return;
    
    const messageInput = document.getElementById('messageInput');
    const text = messageInput.value.trim();
    
    if (!text) return;
    
    try {
        await window.db.collection('liveChat').add({
            text: text,
            username: currentUser.displayName || 'Usuario',
            userId: currentUser.uid,
            photoURL: currentUser.photoURL || '',
            verified: currentUser.emailVerified,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (window.db.collection('typing').doc(currentUser.uid)) {
            await window.db.collection('typing').doc(currentUser.uid).delete();
        }
        
        messageInput.value = '';
        document.getElementById('charCount').textContent = '0/200';
        document.getElementById('emojiPicker').style.display = 'none';
        
        if (soundEnabled) {
            notificationSounds.send();
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Error', 'No se pudo enviar el mensaje', 'error');
    }
}

async function updateUserPresence(online) {
    if (!currentUser || !window.db) return;
    
    try {
        const userRef = window.db.collection('presence').doc(currentUser.uid);
        
        if (online) {
            await userRef.set({
                username: currentUser.displayName,
                online: true,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            activeUsers.add(currentUser.uid);
        } else {
            await userRef.delete();
            activeUsers.delete(currentUser.uid);
        }
        
        updateActiveUsers();
    } catch (error) {
        console.error('Error updating presence:', error);
    }
}

function updateViewerCount() {
    const viewerCount = document.getElementById('viewerCount');
    if (viewerCount) {
        const count = Math.floor(Math.random() * 500) + 100;
        viewerCount.textContent = count.toLocaleString();
    }
}

function updateMessageCount() {
    const messageCountEl = document.getElementById('messageCount');
    if (messageCountEl) {
        messageCountEl.textContent = messageCount.toLocaleString();
    }
}

function updateActiveUsers() {
    const activeUsersEl = document.getElementById('activeUsers');
    if (activeUsersEl) {
        activeUsersEl.textContent = activeUsers.size;
    }
}

function showToast(title, message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function playSound(frequency, duration) {
    if (!soundEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
        console.error('Sound playback error:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.addEventListener('beforeunload', () => {
    if (currentUser && window.db) {
        updateUserPresence(false);
        window.db.collection('typing').doc(currentUser.uid).delete().catch(() => {});
    }
});

console.log('✅ Live Chat system ready with enhanced features');
console.log('🎨 New features: Typing indicator, search, sounds, reactions, quick emojis');
