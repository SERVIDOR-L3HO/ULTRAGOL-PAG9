console.log('🚀 UltraGol Live Chat initializing...');

// Verificar que Firebase esté disponible
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase no está cargado');
}

// Variables globales
let auth = null;
let db = null;
let messagesRef = null;
let unsubscribe = null;
let currentUser = null;

let soundEnabled = localStorage.getItem('chatSound') !== 'false';
let messageCount = 0;
let replyingTo = null;

const emojis = ['⚽', '🔥', '👏', '😂', '😍', '🎉', '💪', '👀', '🤔', '😱', 
                '🙌', '💯', '❤️', '⚡', '🏆', '🎯', '👑', '💥', '🌟', '✨',
                '😎', '🤩', '😤', '🥳', '🔴', '🟢', '🔵', '🟡', '⭐', '💚'];

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
});

function initializeChat() {
    console.log('Initializing chat system...');
    
    // Verificar Firebase
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase no está cargado');
        return;
    }
    
    auth = firebase.auth();
    db = firebase.firestore();
    messagesRef = db.collection('liveChatMessages');
    
    console.log('✅ Firebase conectado');
    
    // Escuchar cambios de autenticación
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Usuario autenticado con Firebase
            currentUser = {
                uid: user.uid,
                name: user.displayName || 'Usuario',
                email: user.email,
                avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Usuario')}&background=9d4edd&color=fff`,
                isAnonymous: false,
                isAuthenticated: true
            };
            
            console.log('✅ Usuario autenticado:', currentUser.name);
            updateAuthUI();
        } else {
            // No hay usuario autenticado - mostrar botón de login
            currentUser = null;
            console.log('⚠️ No hay usuario autenticado');
            updateAuthUI();
        }
        
        // Inicializar todo (solo la primera vez)
        if (!window.chatInitialized) {
            setupEventListeners();
            setupEmojiPicker();
            setupQuickReactions();
            loadMessages();
            updateViewerCount();
            setInterval(updateViewerCount, 30000);
            window.chatInitialized = true;
            console.log('✅ Chat initialized successfully');
        }
    });
}

function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    if (currentUser && currentUser.isAuthenticated) {
        // Usuario autenticado - mostrar info
        if (authBtn) authBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userAvatar) userAvatar.src = currentUser.avatar;
        if (userName) userName.textContent = currentUser.name;
    } else {
        // No autenticado - mostrar botón de login
        if (authBtn) authBtn.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
    }
}

function setupEventListeners() {
    // Botones de autenticación
    document.getElementById('authBtn')?.addEventListener('click', handleGoogleSignIn);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // Botones de configuración
    document.getElementById('changeNameBtn')?.addEventListener('click', handleChangeName);
    document.getElementById('anonymousBtn')?.addEventListener('click', toggleAnonymous);
    document.getElementById('soundBtn')?.addEventListener('click', toggleSound);
    document.getElementById('searchBtn')?.addEventListener('click', toggleSearch);
    
    // Botón de grupos - redirigir a la página de grupos
    document.getElementById('groupsBtn')?.addEventListener('click', () => {
        window.location.href = 'groups-page.html';
    });
    
    // Enviar mensaje
    document.getElementById('sendBtn')?.addEventListener('click', () => sendMessage());
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

async function handleChangeName() {
    const newName = await customPrompt('Ingresa tu nuevo nombre:', 'Cambiar Nombre', currentUser.name);
    if (newName && newName.trim()) {
        try {
            const trimmedName = newName.trim();
            const newAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=9d4edd&color=fff`;
            
            // Actualizar localmente y guardar en localStorage
            currentUser.name = trimmedName;
            currentUser.avatar = newAvatar;
            localStorage.setItem('chatUsername', trimmedName);
            localStorage.setItem('chatAvatar', newAvatar);
            
            // Actualizar UI
            const userAvatar = document.getElementById('userAvatar');
            const userName = document.getElementById('userName');
            if (userAvatar) userAvatar.src = newAvatar;
            if (userName) userName.textContent = trimmedName;
            
            showToast('Éxito', `Tu nombre ahora es: ${currentUser.name}`, 'success');
        } catch (error) {
            console.error('❌ Error actualizando nombre:', error);
            showToast('Error', 'No se pudo actualizar el nombre', 'error');
        }
    }
}

async function handleGoogleSignIn() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        await auth.signInWithPopup(provider);
        showToast('¡Bienvenido!', 'Has iniciado sesión correctamente', 'success');
    } catch (error) {
        console.error('❌ Error en login:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            showToast('Cancelado', 'Inicio de sesión cancelado', 'info');
        } else {
            showToast('Error', 'No se pudo iniciar sesión: ' + error.message, 'error');
        }
    }
}

async function handleLogout() {
    const confirmed = await customConfirm('¿Deseas cerrar sesión?', 'Cerrar Sesión');
    if (confirmed) {
        try {
            await auth.signOut();
            showToast('Éxito', 'Sesión cerrada correctamente', 'success');
        } catch (error) {
            console.error('❌ Error:', error);
            showToast('Error', 'Ocurrió un error al cerrar sesión', 'error');
        }
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
    
    // Verificar autenticación
    if (!currentUser.isAuthenticated && !localStorage.getItem('chatUsername')) {
        showToast('Error', 'Debes ingresar un nombre primero. Toca el ícono de usuario.', 'error');
        e.target.value = '';
        return;
    }
    
    // Límite de 2MB para el archivo original (resultará en ~500-700KB después de compresión)
    if (file.size > 2 * 1024 * 1024) {
        showToast('Error', 'La imagen es muy grande (máx 2MB)', 'error');
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
            
            // Reducir dimensiones para mantener bajo 700KB en Firestore
            const maxDimension = 1200;
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
            
            // Convertir a JPEG con buena calidad pero optimizada para Firestore (límite 1MB)
            let compressedData = canvas.toDataURL('image/jpeg', 0.85);
            
            // Si aún es muy grande, reducir calidad
            if (compressedData.length > 700000) {
                compressedData = canvas.toDataURL('image/jpeg', 0.7);
            }
            
            // Verificar que no exceda 700KB
            if (compressedData.length > 700000) {
                showToast('Error', 'La imagen es demasiado compleja. Intenta con una más simple.', 'error');
                e.target.value = '';
                return;
            }
            sendMessage(null, compressedData);
            e.target.value = '';
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

async function sendMessage(text = null, imageData = null) {
    const messageInput = document.getElementById('messageInput');
    const messageText = text || messageInput?.value.trim();
    
    if (!messageText && !imageData) return;
    
    // Verificar que el usuario esté autenticado
    if (!currentUser || !currentUser.isAuthenticated) {
        showToast('Error', 'Debes iniciar sesión para enviar mensajes', 'error');
        return;
    }
    
    const message = {
        text: messageText || '',
        image: imageData || null,
        username: currentUser.isAnonymous ? 'Anónimo' : currentUser.name,
        avatar: currentUser.isAnonymous ? 'https://ui-avatars.com/api/?name=?&background=6c757d&color=fff' : currentUser.avatar,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        isAnonymous: currentUser.isAnonymous,
        userId: currentUser.uid,
        reactions: {},
        replyTo: replyingTo ? {
            id: replyingTo.id,
            username: replyingTo.username,
            text: replyingTo.text,
            image: replyingTo.image || null
        } : null
    };
    
    // Guardar en Firestore
    if (messagesRef) {
        try {
            await messagesRef.add(message);
            console.log('✅ Mensaje enviado a Firestore');
            
            if (messageInput) {
                messageInput.value = '';
                document.getElementById('charCount').textContent = '0/200';
            }
            
            // Limpiar el reply
            if (replyingTo) {
                cancelReply();
            }
            
            document.getElementById('emojiPicker').style.display = 'none';
            
            if (soundEnabled) {
                playSound(600, 80);
            }
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            
            // Mensajes de error más específicos
            if (error.code === 'permission-denied') {
                showToast('Error de Permisos', 'Firestore no está configurado correctamente. Configura las reglas de seguridad en Firebase Console.', 'error');
                console.error('⚠️ SOLUCIÓN: Ve a Firebase Console → Firestore Database → Reglas');
                console.error('⚠️ Sigue las instrucciones del archivo INSTRUCCIONES_CONFIGURACION.md en la carpeta live-chat');
            } else if (error.code === 'unavailable') {
                showToast('Error de Conexión', 'No hay conexión a internet o Firestore no está disponible', 'error');
            } else {
                showToast('Error', 'No se pudo enviar el mensaje: ' + error.message, 'error');
            }
        }
    } else {
        showToast('Error', 'Chat no disponible - Firestore no inicializado', 'error');
        console.error('❌ messagesRef es null - Firebase no está inicializado correctamente');
    }
}

function loadMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    
    if (!messagesRef) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Chat no disponible</h2>
                <p>Firebase no está configurado</p>
            </div>
        `;
        return;
    }
    
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <i class="fas fa-comments"></i>
            <h2>¡Bienvenido al chat en vivo!</h2>
            <p>Los mensajes aparecerán aquí en tiempo real</p>
        </div>
    `;
    
    // Escuchar mensajes en tiempo real
    // Cargar últimos 100 mensajes ordenados por tiempo
    unsubscribe = messagesRef
        .orderBy('timestamp', 'desc')
        .limit(100)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const message = change.doc.data();
                message.id = change.doc.id;
                
                if (change.type === 'added') {
                    // Solo animar si es un mensaje nuevo (no carga inicial)
                    const isNewMessage = snapshot.docChanges().length === 1;
                    addMessageToUI(message, isNewMessage);
                    if (isNewMessage && soundEnabled) {
                        playSound(600, 80);
                    }
                } else if (change.type === 'modified') {
                    // Actualizar mensaje existente
                    updateMessageInUI(message);
                }
            });
            
            // Actualizar contador
            messageCount = snapshot.size;
            updateMessageCount();
        }, (error) => {
            console.error('Error cargando mensajes:', error);
            showToast('Error', 'No se pudieron cargar los mensajes', 'error');
        });
}

// Generar color único para cada usuario basado en su nombre
function getUsernameColor(username) {
    // Colores vibrantes estilo Kick.com
    const colors = [
        '#FF1744', // Rojo vibrante
        '#FF9100', // Naranja
        '#FFEA00', // Amarillo
        '#00E676', // Verde lima
        '#00E5FF', // Cyan
        '#2979FF', // Azul
        '#D500F9', // Magenta
        '#FF4081', // Rosa
        '#00BFA5', // Turquesa
        '#FF6E40', // Naranja rojizo
        '#76FF03', // Verde brillante
        '#18FFFF', // Cyan claro
        '#E040FB', // Púrpura
        '#69F0AE', // Verde menta
        '#FFD740', // Ámbar
        '#FF5252', // Rojo claro
        '#448AFF', // Azul índigo
        '#EEFF41', // Lima
        '#40C4FF', // Azul claro
        '#B388FF'  // Púrpura claro
    ];
    
    // Crear hash del nombre
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    
    // Usar el hash para seleccionar un color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

function addMessageToUI(message, animate = true) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    // Validar que el mensaje tenga la estructura correcta
    if (!message || typeof message !== 'object' || !message.username) {
        console.warn('Mensaje inválido ignorado:', message);
        return;
    }
    
    // Remover mensaje de bienvenida si existe
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();
    
    // Verificar si el mensaje ya existe
    if (message.id && document.querySelector(`[data-id="${message.id}"]`)) {
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-item';
    if (animate) {
        messageDiv.style.animation = 'messageSlideIn 0.3s ease';
    }
    messageDiv.dataset.id = message.id || Date.now();
    
    // Formatear timestamp
    let timestamp = 'Ahora';
    if (message.timestamp && message.timestamp.toDate) {
        timestamp = message.timestamp.toDate().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // Validar que text sea string
    const messageText = typeof message.text === 'string' ? message.text : '';
    
    const imageHTML = message.image ? `
        <img src="${message.image}" class="message-image" alt="Imagen enviada" onclick="openImageModal('${message.image}')">
    ` : '';
    
    // Reply HTML
    const replyHTML = message.replyTo ? `
        <div class="message-reply">
            <i class="fas fa-reply"></i>
            <div class="reply-content-display">
                <span class="reply-username">${escapeHtml(message.replyTo.username)}</span>
                <span class="reply-message">${message.replyTo.text ? escapeHtml(message.replyTo.text.substring(0, 50)) + (message.replyTo.text.length > 50 ? '...' : '') : '[Imagen]'}</span>
            </div>
        </div>
    ` : '';
    
    // Reacciones HTML
    const reactionsHTML = message.reactions && Object.keys(message.reactions).length > 0 ? `
        <div class="message-reactions">
            ${Object.entries(message.reactions).map(([emoji, data]) => {
                const isActive = data.users && data.users.includes(currentUser.uid);
                return `<button class="reaction-btn ${isActive ? 'active' : ''}" onclick="toggleReaction('${message.id}', '${emoji}')">
                    ${emoji} <span class="reaction-count">${data.count || 0}</span>
                </button>`;
            }).join('')}
        </div>
    ` : '';
    
    // Botones de acción (solo si el mensaje es del usuario actual)
    const isOwnMessage = message.userId === currentUser.uid;
    const actionsHTML = `
        <div class="message-actions">
            <button class="action-btn" onclick="replyToMessage({id: '${message.id}', username: '${escapeHtml(message.username)}', text: '${escapeHtml(messageText)}', image: ${message.image ? `'${message.image}'` : 'null'}})" title="Responder">
                <i class="fas fa-reply"></i>
            </button>
            ${isOwnMessage ? `
                <button class="action-btn" onclick="editMessage('${message.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteMessage('${message.id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            ` : ''}
            <button class="action-btn" onclick="showReactionPicker('${message.id}')" title="Reaccionar">
                <i class="fas fa-smile"></i>
            </button>
        </div>
    `;
    
    const editedBadge = message.edited ? '<span class="edited-badge">(editado)</span>' : '';
    
    // Generar color único para el usuario
    const userColor = getUsernameColor(message.username);
    
    messageDiv.innerHTML = `
        <img class="message-avatar" src="${message.avatar || 'https://ui-avatars.com/api/?name=User&background=9d4edd&color=fff'}" alt="${message.username}">
        <div class="message-content">
            <div class="message-header">
                <span class="message-username" style="color: ${userColor}; font-weight: 600;">${escapeHtml(message.username)}</span>
                ${message.isAnonymous ? '<span class="message-badge" style="background: #6c757d; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">ANÓNIMO</span>' : ''}
                <span class="message-timestamp">${timestamp} ${editedBadge}</span>
            </div>
            ${replyHTML}
            ${messageText ? `<div class="message-text">${escapeHtml(messageText)}</div>` : ''}
            ${imageHTML}
            ${actionsHTML}
            ${reactionsHTML}
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

function updateMessageInUI(message) {
    const messageElement = document.querySelector(`[data-id="${message.id}"]`);
    if (!messageElement) return;
    
    // Actualizar texto si fue editado
    const messageTextEl = messageElement.querySelector('.message-text');
    if (messageTextEl && message.text) {
        messageTextEl.textContent = message.text;
    }
    
    // Actualizar badge de editado
    const timestampEl = messageElement.querySelector('.message-timestamp');
    if (timestampEl && message.edited) {
        if (!timestampEl.querySelector('.edited-badge')) {
            const editedBadge = document.createElement('span');
            editedBadge.className = 'edited-badge';
            editedBadge.textContent = '(editado)';
            timestampEl.appendChild(document.createTextNode(' '));
            timestampEl.appendChild(editedBadge);
        }
    }
    
    // Actualizar reacciones
    const reactionsContainer = messageElement.querySelector('.message-reactions');
    if (message.reactions && Object.keys(message.reactions).length > 0) {
        const reactionsHTML = Object.entries(message.reactions).map(([emoji, data]) => {
            const isActive = data.users && data.users.includes(currentUser.uid);
            return `<button class="reaction-btn ${isActive ? 'active' : ''}" onclick="toggleReaction('${message.id}', '${emoji}')">
                ${emoji} <span class="reaction-count">${data.count || 0}</span>
            </button>`;
        }).join('');
        
        if (reactionsContainer) {
            reactionsContainer.innerHTML = reactionsHTML;
        } else {
            // Crear contenedor de reacciones si no existe
            const messageContent = messageElement.querySelector('.message-content');
            const newReactionsContainer = document.createElement('div');
            newReactionsContainer.className = 'message-reactions';
            newReactionsContainer.innerHTML = reactionsHTML;
            messageContent.appendChild(newReactionsContainer);
        }
    } else if (reactionsContainer) {
        reactionsContainer.remove();
    }
}

function updateAuthUI() {
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    // Marcar como autenticado si tiene nombre
    if (localStorage.getItem('chatUsername')) {
        currentUser.isAuthenticated = true;
    }
    
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

// IMPORTANTE: SEGURIDAD - Firebase Authentication implementado
// Reglas de Firestore configuradas en Firebase Console
// Ver archivo INSTRUCCIONES_CONFIGURACION.md para configurar las reglas correctamente
// Reglas recomendadas permiten:
// - Lectura: Todos (chat público)
// - Creación: Solo usuarios autenticados
// - Edición/Eliminación: Solo el autor del mensaje
// - Reacciones: Solo usuarios autenticados

// Funciones para editar, eliminar, responder y reaccionar mensajes
async function editMessage(messageId) {
    const messageElement = document.querySelector(`[data-id="${messageId}"]`);
    if (!messageElement) return;
    
    // Verificación básica del mensaje
    try {
        const doc = await messagesRef.doc(messageId).get();
        if (!doc.exists) {
            showToast('Error', 'Mensaje no encontrado', 'error');
            return;
        }
        
        const messageData = doc.data();
        if (messageData.userId !== currentUser.uid) {
            showToast('Error', 'No tienes permiso para editar este mensaje', 'error');
            return;
        }
    } catch (error) {
        console.error('Error verificando permisos:', error);
        if (error.code === 'permission-denied') {
            showToast('Error de Permisos', 'Las reglas de Firestore no están configuradas. Configura en Firebase Console.', 'error');
        } else {
            showToast('Error', 'No se pudo verificar permisos: ' + error.message, 'error');
        }
        return;
    }
    
    const messageTextEl = messageElement.querySelector('.message-text');
    const currentText = messageTextEl ? messageTextEl.textContent : '';
    
    const newText = prompt('Editar mensaje:', currentText);
    if (newText === null || newText.trim() === '') return;
    
    try {
        await messagesRef.doc(messageId).update({
            text: newText.trim(),
            edited: true,
            editedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Éxito', 'Mensaje editado correctamente', 'success');
        
        if (soundEnabled) {
            playSound(500, 60);
        }
    } catch (error) {
        console.error('Error editando mensaje:', error);
        if (error.code === 'permission-denied') {
            showToast('Error de Permisos', 'Las reglas de Firestore bloquean esta acción. Configura las reglas en Firebase Console.', 'error');
            console.error('⚠️ SOLUCIÓN: Ve a Firebase Console → Firestore Database → Reglas');
            console.error('⚠️ Sigue las instrucciones del archivo INSTRUCCIONES_CONFIGURACION.md en la carpeta live-chat');
        } else {
            showToast('Error', 'No se pudo editar el mensaje: ' + error.message, 'error');
        }
    }
}

async function deleteMessage(messageId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este mensaje?')) return;
    
    // Verificación básica del mensaje
    try {
        const doc = await messagesRef.doc(messageId).get();
        if (!doc.exists) {
            showToast('Error', 'Mensaje no encontrado', 'error');
            return;
        }
        
        const messageData = doc.data();
        if (messageData.userId !== currentUser.uid) {
            showToast('Error', 'No tienes permiso para eliminar este mensaje', 'error');
            return;
        }
    } catch (error) {
        console.error('Error verificando permisos:', error);
        if (error.code === 'permission-denied') {
            showToast('Error de Permisos', 'Las reglas de Firestore no están configuradas. Configura en Firebase Console.', 'error');
        } else {
            showToast('Error', 'No se pudo verificar permisos: ' + error.message, 'error');
        }
        return;
    }
    
    try {
        await messagesRef.doc(messageId).delete();
        
        // Remover del UI
        const messageElement = document.querySelector(`[data-id="${messageId}"]`);
        if (messageElement) {
            messageElement.style.animation = 'messageSlideOut 0.3s ease';
            setTimeout(() => messageElement.remove(), 300);
        }
        
        showToast('Eliminado', 'Mensaje eliminado correctamente', 'success');
        
        if (soundEnabled) {
            playSound(400, 60);
        }
    } catch (error) {
        console.error('Error eliminando mensaje:', error);
        if (error.code === 'permission-denied') {
            showToast('Error de Permisos', 'Las reglas de Firestore bloquean esta acción. Configura las reglas en Firebase Console.', 'error');
            console.error('⚠️ SOLUCIÓN: Ve a Firebase Console → Firestore Database → Reglas');
            console.error('⚠️ Sigue las instrucciones del archivo INSTRUCCIONES_CONFIGURACION.md en la carpeta live-chat');
        } else {
            showToast('Error', 'No se pudo eliminar el mensaje: ' + error.message, 'error');
        }
    }
}

function replyToMessage(message) {
    replyingTo = message;
    
    // Mostrar indicador de reply
    const messageInput = document.getElementById('messageInput');
    const inputContainer = document.querySelector('.input-wrapper');
    
    // Remover reply anterior si existe
    const existingReply = document.querySelector('.reply-indicator');
    if (existingReply) existingReply.remove();
    
    // Crear indicador de reply
    const replyIndicator = document.createElement('div');
    replyIndicator.className = 'reply-indicator';
    replyIndicator.innerHTML = `
        <div class="reply-content">
            <i class="fas fa-reply"></i>
            <div class="reply-info">
                <span class="reply-to">Respondiendo a ${escapeHtml(message.username)}</span>
                <span class="reply-text">${message.text ? escapeHtml(message.text.substring(0, 50)) + (message.text.length > 50 ? '...' : '') : '[Imagen]'}</span>
            </div>
        </div>
        <button class="reply-cancel" onclick="cancelReply()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    inputContainer.parentNode.insertBefore(replyIndicator, inputContainer);
    messageInput.focus();
    
    showToast('Responder', `Respondiendo a ${message.username}`, 'success');
}

function cancelReply() {
    replyingTo = null;
    const replyIndicator = document.querySelector('.reply-indicator');
    if (replyIndicator) {
        replyIndicator.remove();
    }
}

async function toggleReaction(messageId, emoji) {
    const messageDoc = messagesRef.doc(messageId);
    
    try {
        const doc = await messageDoc.get();
        if (!doc.exists) {
            showToast('Error', 'Mensaje no encontrado', 'error');
            return;
        }
        
        const message = doc.data();
        const reactions = message.reactions || {};
        const reactionKey = emoji;
        
        // Inicializar reacción si no existe
        if (!reactions[reactionKey]) {
            reactions[reactionKey] = {
                count: 0,
                users: []
            };
        }
        
        // Verificar si el usuario ya reaccionó
        const userIndex = reactions[reactionKey].users.indexOf(currentUser.uid);
        
        if (userIndex > -1) {
            // Remover reacción
            reactions[reactionKey].users.splice(userIndex, 1);
            reactions[reactionKey].count--;
            
            // Si no hay más usuarios con esta reacción, eliminar el emoji
            if (reactions[reactionKey].count <= 0) {
                delete reactions[reactionKey];
            }
        } else {
            // Agregar reacción
            reactions[reactionKey].users.push(currentUser.uid);
            reactions[reactionKey].count++;
        }
        
        await messageDoc.update({ reactions });
        
        if (soundEnabled) {
            playSound(700, 50);
        }
    } catch (error) {
        console.error('Error toggling reaction:', error);
        if (error.code === 'permission-denied') {
            showToast('Error de Permisos', 'Las reglas de Firestore bloquean esta acción. Configura las reglas en Firebase Console.', 'error');
            console.error('⚠️ SOLUCIÓN: Ve a Firebase Console → Firestore Database → Reglas');
            console.error('⚠️ Sigue las instrucciones del archivo INSTRUCCIONES_CONFIGURACION.md en la carpeta live-chat');
        } else {
            showToast('Error', 'No se pudo agregar la reacción: ' + error.message, 'error');
        }
    }
}

function showReactionPicker(messageId) {
    // Remover picker anterior si existe
    const existingPicker = document.querySelector('.reaction-picker');
    if (existingPicker) existingPicker.remove();
    
    const messageElement = document.querySelector(`[data-id="${messageId}"]`);
    if (!messageElement) return;
    
    const picker = document.createElement('div');
    picker.className = 'reaction-picker';
    
    const quickReactions = ['⚽', '🔥', '👏', '😂', '❤️', '👍', '🎉', '💪'];
    
    picker.innerHTML = quickReactions.map(emoji => 
        `<button class="reaction-emoji" onclick="toggleReaction('${messageId}', '${emoji}')">${emoji}</button>`
    ).join('');
    
    messageElement.appendChild(picker);
    
    // Cerrar al hacer clic fuera
    setTimeout(() => {
        const closePickerOnClick = (e) => {
            if (!picker.contains(e.target)) {
                picker.remove();
                document.removeEventListener('click', closePickerOnClick);
            }
        };
        document.addEventListener('click', closePickerOnClick);
    }, 100);
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
    
    @keyframes messageSlideIn {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

console.log('✅ UltraGol Live Chat ready!');

// ==========================================
// CUSTOM DIALOG FUNCTIONS
// ==========================================

function showCustomDialog(options) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('customDialog');
        const iconEl = document.getElementById('dialogIcon');
        const titleEl = document.getElementById('dialogTitle');
        const messageEl = document.getElementById('dialogMessage');
        const inputEl = document.getElementById('dialogInput');
        const cancelBtn = document.getElementById('dialogCancel');
        const confirmBtn = document.getElementById('dialogConfirm');
        
        // Configure dialog
        titleEl.textContent = options.title || '';
        messageEl.textContent = options.message || '';
        
        // Set icon with appropriate emoji
        const iconMap = {
            'confirm': '❓',
            'prompt': '✏️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        iconEl.textContent = iconMap[options.type] || '💬';
        
        // Handle input for prompt
        if (options.type === 'prompt') {
            inputEl.style.display = 'block';
            inputEl.value = options.defaultValue || '';
            setTimeout(() => {
                inputEl.focus();
                inputEl.select();
            }, 100);
        } else {
            inputEl.style.display = 'none';
        }
        
        // Show dialog
        overlay.classList.add('active');
        
        // Handle confirm
        const handleConfirm = () => {
            overlay.classList.remove('active');
            if (options.type === 'prompt') {
                resolve(inputEl.value.trim() || null);
            } else {
                resolve(true);
            }
            cleanup();
        };
        
        // Handle cancel
        const handleCancel = () => {
            overlay.classList.remove('active');
            resolve(false);
            cleanup();
        };
        
        // Handle Enter key for input
        const handleEnterKey = (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        // Attach event listeners
        confirmBtn.onclick = handleConfirm;
        cancelBtn.onclick = handleCancel;
        inputEl.onkeydown = handleEnterKey;
        
        // Cleanup function
        function cleanup() {
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            inputEl.onkeydown = null;
        }
    });
}

function customConfirm(message, title = 'Confirmación') {
    return showCustomDialog({
        type: 'confirm',
        title: title,
        message: message
    });
}

function customPrompt(message, title = 'Ingresa información', defaultValue = '') {
    return showCustomDialog({
        type: 'prompt',
        title: title,
        message: message,
        defaultValue: defaultValue
    });
}

