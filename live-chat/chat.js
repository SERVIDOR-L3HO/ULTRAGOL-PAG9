console.log('🚀 UltraGol Live Chat initializing...');

// Estado del chat
let currentUser = {
    name: localStorage.getItem('chatUsername') || 'Usuario' + Math.floor(Math.random() * 1000),
    avatar: localStorage.getItem('chatAvatar') || `https://ui-avatars.com/api/?name=${localStorage.getItem('chatUsername') || 'User'}&background=9d4edd&color=fff`,
    isAnonymous: localStorage.getItem('chatAnonymous') === 'true'
};

// Validar y cargar mensajes del localStorage
let messages = [];
try {
    const storedMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    // Validar que cada mensaje tenga la estructura correcta
    messages = storedMessages.filter(msg => {
        return msg && 
               typeof msg === 'object' && 
               typeof msg.id !== 'undefined' &&
               typeof msg.username !== 'undefined';
    });
    // Si se filtraron mensajes inválidos, actualizar localStorage
    if (messages.length !== storedMessages.length) {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
        console.log('✅ Mensajes inválidos eliminados del localStorage');
    }
} catch (error) {
    console.error('Error cargando mensajes:', error);
    messages = [];
    localStorage.removeItem('chatMessages');
}

let soundEnabled = localStorage.getItem('chatSound') !== 'false';
let messageCount = 0;

const emojis = ['⚽', '🔥', '👏', '😂', '😍', '🎉', '💪', '👀', '🤔', '😱', 
                '🙌', '💯', '❤️', '⚡', '🏆', '🎯', '👑', '💥', '🌟', '✨',
                '😎', '🤩', '😤', '🥳', '🔴', '🟢', '🔵', '🟡', '⭐', '💚'];

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
});

function initializeChat() {
    console.log('Initializing chat system...');
    
    setupEventListeners();
    setupEmojiPicker();
    setupQuickReactions();
    updateAuthUI();
    loadMessages();
    updateViewerCount();
    
    setInterval(updateViewerCount, 30000);
    console.log('✅ Chat initialized successfully');
}

function setupEventListeners() {
    // Botones de configuración
    document.getElementById('changeNameBtn')?.addEventListener('click', handleChangeName);
    document.getElementById('anonymousBtn')?.addEventListener('click', toggleAnonymous);
    document.getElementById('soundBtn')?.addEventListener('click', toggleSound);
    document.getElementById('searchBtn')?.addEventListener('click', toggleSearch);
    
    // Enviar mensaje
    document.getElementById('sendBtn')?.addEventListener('click', sendMessage);
    document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Contador de caracteres
    document.getElementById('messageInput')?.addEventListener('input', (e) => {
        document.getElementById('charCount').textContent = `${e.target.value.length}/200`;
    });
    
    // Subir imagen
    document.getElementById('imageInput')?.addEventListener('change', handleImageUpload);
    
    // Emoji picker
    document.getElementById('emojiBtn')?.addEventListener('click', toggleEmojiPicker);
    document.getElementById('emojiClose')?.addEventListener('click', () => {
        document.getElementById('emojiPicker').style.display = 'none';
    });
    
    // Búsqueda
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        filterMessages(e.target.value);
    });
    
    document.getElementById('searchClose')?.addEventListener('click', () => {
        document.getElementById('searchContainer').style.display = 'none';
        document.getElementById('searchBtn').classList.remove('active');
        document.getElementById('searchInput').value = '';
        filterMessages('');
    });
}

function setupEmojiPicker() {
    const emojiGrid = document.getElementById('emojiGrid');
    if (emojiGrid) {
        emojis.forEach(emoji => {
            const emojiItem = document.createElement('div');
            emojiItem.className = 'emoji-item';
            emojiItem.textContent = emoji;
            emojiItem.addEventListener('click', () => insertEmoji(emoji));
            emojiGrid.appendChild(emojiItem);
        });
    }
}

function setupQuickReactions() {
    document.querySelectorAll('.quick-reaction').forEach(btn => {
        btn.addEventListener('click', () => {
            insertEmoji(btn.dataset.reaction);
        });
    });
}

function handleChangeName() {
    const newName = prompt('Ingresa tu nuevo nombre:', currentUser.name);
    if (newName && newName.trim()) {
        currentUser.name = newName.trim();
        currentUser.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=9d4edd&color=fff`;
        localStorage.setItem('chatUsername', currentUser.name);
        localStorage.setItem('chatAvatar', currentUser.avatar);
        updateAuthUI();
        showToast('Éxito', `Tu nombre ahora es: ${currentUser.name}`, 'success');
    }
}

function toggleAnonymous() {
    currentUser.isAnonymous = !currentUser.isAnonymous;
    localStorage.setItem('chatAnonymous', currentUser.isAnonymous);
    updateAuthUI();
    
    const btn = document.getElementById('anonymousBtn');
    if (currentUser.isAnonymous) {
        btn.classList.add('active');
        showToast('Modo Anónimo', 'Ahora apareces como anónimo', 'success');
    } else {
        btn.classList.remove('active');
        showToast('Modo Público', 'Ahora apareces con tu nombre', 'success');
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('chatSound', soundEnabled);
    const soundBtn = document.getElementById('soundBtn');
    
    if (soundEnabled) {
        soundBtn.classList.remove('active');
        soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        showToast('Sonido', 'Sonidos activados', 'success');
    } else {
        soundBtn.classList.add('active');
        soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        showToast('Silencio', 'Sonidos desactivados', 'success');
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

function filterMessages(searchText) {
    const messageItems = document.querySelectorAll('.message-item');
    const searchLower = searchText.toLowerCase();
    
    messageItems.forEach(msg => {
        const text = msg.querySelector('.message-text')?.textContent.toLowerCase() || '';
        const username = msg.querySelector('.message-username')?.textContent.toLowerCase() || '';
        
        if (text.includes(searchLower) || username.includes(searchLower) || !searchText) {
            msg.style.display = 'flex';
        } else {
            msg.style.display = 'none';
        }
    });
}

async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 1 * 1024 * 1024) {
        showToast('Error', 'La imagen es muy grande (máx 1MB)', 'error');
        e.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Comprimir imagen
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Reducir dimensiones si es muy grande
            const maxDimension = 800;
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = (height / width) * maxDimension;
                    width = maxDimension;
                } else {
                    width = (width / height) * maxDimension;
                    height = maxDimension;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a JPEG con calidad reducida para comprimir
            const compressedData = canvas.toDataURL('image/jpeg', 0.7);
            sendMessage(null, compressedData);
            e.target.value = '';
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function sendMessage(text = null, imageData = null) {
    const messageInput = document.getElementById('messageInput');
    const messageText = text || messageInput?.value.trim();
    
    if (!messageText && !imageData) return;
    
    const message = {
        id: Date.now() + '_' + Math.random(),
        text: messageText || '',
        image: imageData || null,
        username: currentUser.isAnonymous ? 'Anónimo' : currentUser.name,
        avatar: currentUser.isAnonymous ? 'https://ui-avatars.com/api/?name=?&background=6c757d&color=fff' : currentUser.avatar,
        timestamp: new Date().toISOString(),
        isAnonymous: currentUser.isAnonymous
    };
    
    messages.unshift(message);
    
    // Guardar solo últimos 50 mensajes para evitar exceder localStorage
    if (messages.length > 50) {
        messages = messages.slice(0, 50);
    }
    
    try {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        
        // Si falla, limpiar mensajes antiguos y reintentar
        messages = messages.slice(0, 20);
        try {
            localStorage.setItem('chatMessages', JSON.stringify(messages));
            showToast('Advertencia', 'Espacio limitado. Se guardaron solo los mensajes recientes.', 'error');
        } catch (retryError) {
            showToast('Error', 'No se pudo guardar el mensaje. Storage lleno.', 'error');
            console.error('Failed to save even after cleanup:', retryError);
        }
    }
    
    addMessageToUI(message);
    
    if (messageInput) {
        messageInput.value = '';
        document.getElementById('charCount').textContent = '0/200';
    }
    
    document.getElementById('emojiPicker').style.display = 'none';
    
    if (soundEnabled) {
        playSound(600, 80);
    }
    
    messageCount++;
    updateMessageCount();
}

function loadMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-comments"></i>
                <h2>¡Bienvenido al chat en vivo!</h2>
                <p>Sé el primero en enviar un mensaje</p>
            </div>
        `;
        return;
    }
    
    messages.forEach(message => {
        addMessageToUI(message, false);
    });
    
    messageCount = messages.length;
    updateMessageCount();
}

function addMessageToUI(message, animate = true) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    // Remover mensaje de bienvenida si existe
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-item';
    if (animate) {
        messageDiv.style.animation = 'messageSlideIn 0.3s ease';
    }
    messageDiv.dataset.id = message.id;
    
    const timestamp = new Date(message.timestamp).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const imageHTML = message.image ? `
        <img src="${message.image}" class="message-image" alt="Imagen enviada" onclick="openImageModal('${message.image}')">
    ` : '';
    
    messageDiv.innerHTML = `
        <img class="message-avatar" src="${message.avatar}" alt="${message.username}">
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${escapeHtml(message.username)}</span>
                ${message.isAnonymous ? '<span class="message-badge" style="background: #6c757d; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">ANÓNIMO</span>' : ''}
                <span class="message-timestamp">${timestamp}</span>
            </div>
            ${message.text ? `<div class="message-text">${escapeHtml(message.text)}</div>` : ''}
            ${imageHTML}
        </div>
    `;
    
    if (messagesContainer.firstChild) {
        messagesContainer.insertBefore(messageDiv, messagesContainer.firstChild);
    } else {
        messagesContainer.appendChild(messageDiv);
    }
    
    // Limitar mensajes en UI
    while (messagesContainer.children.length > 100) {
        messagesContainer.lastChild.remove();
    }
}

function updateAuthUI() {
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userInfo && userName && userAvatar) {
        userInfo.style.display = 'flex';
        userName.textContent = currentUser.isAnonymous ? 'Anónimo' : currentUser.name;
        userAvatar.src = currentUser.avatar;
    }
    
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        authBtn.style.display = 'none';
    }
}

function updateMessageCount() {
    const countEl = document.getElementById('messageCount');
    if (countEl) {
        countEl.textContent = messageCount;
    }
}

function updateViewerCount() {
    const viewerCount = document.getElementById('viewerCount');
    if (viewerCount) {
        // Simulación de espectadores
        const count = Math.floor(50 + Math.random() * 200);
        viewerCount.textContent = count;
    }
    
    const activeUsers = document.getElementById('activeUsers');
    if (activeUsers) {
        const count = Math.floor(5 + Math.random() * 20);
        activeUsers.textContent = count;
    }
}

function showToast(title, message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function playSound(frequency = 800, duration = 100) {
    if (!soundEnabled) return;
    
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
        console.log('Sound playback not supported');
    }
}

// Funciones para el modal de imágenes
function openImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const downloadBtn = document.getElementById('downloadImageBtn');
    
    if (modal && modalImage) {
        modalImage.src = imageSrc;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Configurar botón de descarga
        if (downloadBtn) {
            downloadBtn.onclick = () => downloadImage(imageSrc);
        }
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function downloadImage(imageSrc) {
    try {
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = `ultragol-chat-image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Descarga', 'Imagen descargada correctamente', 'success');
    } catch (error) {
        console.error('Error descargando imagen:', error);
        showToast('Error', 'No se pudo descargar la imagen', 'error');
    }
}

// Cerrar modal al hacer clic fuera de la imagen
window.addEventListener('click', function(event) {
    const modal = document.getElementById('imageModal');
    if (event.target === modal) {
        closeImageModal();
    }
});

// Animación de toast slide out
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

console.log('✅ UltraGol Live Chat ready!');
