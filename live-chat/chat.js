console.log('🚀 UltraGol Live Chat initializing...');

let currentUser = null;
let messagesListener = null;
let messageCount = 0;
let activeUsers = new Set();

const emojis = ['⚽', '🔥', '👏', '😂', '😍', '🎉', '💪', '👀', '🤔', '😱', 
                '🙌', '💯', '❤️', '⚡', '🏆', '🎯', '👑', '💥', '🌟', '✨',
                '😎', '🤩', '😤', '🥳', '🔴', '🟢', '🔵', '🟡', '⭐', '💚'];

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
        });
    }
    
    if (emojiBtn) {
        emojiBtn.addEventListener('click', toggleEmojiPicker);
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

function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    if (emojiPicker) {
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
    }
}

function insertEmoji(emoji) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value += emoji;
        messageInput.focus();
        document.getElementById('charCount').textContent = `${messageInput.value.length}/200`;
    }
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
    }
}

function enableChat() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = 'Enviar un mensaje...';
    }
    if (sendBtn) sendBtn.disabled = false;
    
    const hint = document.querySelector('.input-hint');
    if (hint) hint.style.display = 'none';
}

function disableChat() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = 'Inicia sesión para chatear...';
    }
    if (sendBtn) sendBtn.disabled = true;
    
    const hint = document.querySelector('.input-hint');
    if (hint) hint.style.display = 'flex';
}

function listenToMessages() {
    if (!window.db) return;
    
    const messagesRef = window.db.collection('liveChat')
        .orderBy('timestamp', 'desc')
        .limit(100);
    
    messagesListener = messagesRef.onSnapshot((snapshot) => {
        const messagesContainer = document.getElementById('messagesContainer');
        const welcomeMsg = messagesContainer.querySelector('.welcome-message');
        
        if (welcomeMsg && !snapshot.empty) {
            welcomeMsg.remove();
        }
        
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const message = { id: change.doc.id, ...change.doc.data() };
                addMessageToUI(message);
                messageCount++;
            }
        });
        
        updateMessageCount();
    }, (error) => {
        console.error('Error listening to messages:', error);
        showToast('Error', 'No se pueden cargar los mensajes', 'error');
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
        
        messageInput.value = '';
        document.getElementById('charCount').textContent = '0/200';
        document.getElementById('emojiPicker').style.display = 'none';
        
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.addEventListener('beforeunload', () => {
    if (currentUser) {
        updateUserPresence(false);
    }
});

console.log('✅ Live Chat system ready');
