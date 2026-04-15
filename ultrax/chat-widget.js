// Chat Widget Estilo Messenger - UltraGol
// Sistema de chat flotante con funcionalidad drag & drop y resize optimizado

const chatBubble = document.getElementById('chatBubble');
const chatModal = document.getElementById('chatModal');
const chatModalHeader = document.getElementById('chatModalHeader');
const closeChatBtn = document.getElementById('closeChatBtn');
const closeBubbleBtn = document.getElementById('closeBubbleBtn');
const chatBadge = document.getElementById('chatBadge');

let isDraggingBubble = false;
let isDraggingModal = false;
let isResizing = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

// Variables para resize
let startWidth;
let startHeight;
let startX;
let startY;

// Toggle del modal de chat
function toggleChat() {
    chatModal.classList.toggle('active');
    
    // Ocultar badge cuando se abre el chat
    if (chatModal.classList.contains('active')) {
        chatBadge.style.display = 'none';
    } else {
        setTimeout(() => {
            chatBadge.style.display = 'flex';
        }, 300);
    }
}

// Cerrar el chat
function closeChat() {
    chatModal.classList.remove('active');
    setTimeout(() => {
        chatBadge.style.display = 'flex';
    }, 300);
}

// Cerrar completamente la burbuja
function closeBubble() {
    chatBubble.style.display = 'none';
    closeBubbleBtn.style.display = 'none';
    chatModal.classList.remove('active');
    
    // Guardar preferencia en localStorage
    localStorage.setItem('chatBubbleHidden', 'true');
}

// Verificar si la burbuja debe estar oculta
function checkBubbleVisibility() {
    const isHidden = localStorage.getItem('chatBubbleHidden');
    if (isHidden === 'true') {
        chatBubble.style.display = 'none';
        closeBubbleBtn.style.display = 'none';
    }
}

// Drag & Drop para la burbuja
chatBubble.addEventListener('mousedown', dragStart);
chatBubble.addEventListener('touchstart', dragStart);

function dragStart(e) {
    if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
    } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
    }

    if (e.target === chatBubble || chatBubble.contains(e.target)) {
        isDraggingBubble = true;
    }
}

// Drag & Drop para el modal
chatModalHeader.addEventListener('mousedown', dragStartModal);
chatModalHeader.addEventListener('touchstart', dragStartModal);

function dragStartModal(e) {
    if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
    } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
    }

    isDraggingModal = true;
}

// Optimizado con requestAnimationFrame para mejor rendimiento
let rafId = null;

document.addEventListener('mousemove', drag, { passive: false });
document.addEventListener('touchmove', drag, { passive: false });

function drag(e) {
    if (!isDraggingBubble && !isDraggingModal && !isResizing) return;

    if (rafId) {
        cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
        if (isDraggingBubble) {
            e.preventDefault();

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, chatBubble);
        }

        if (isDraggingModal) {
            e.preventDefault();

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, chatModal);
        }

        if (isResizing) {
            e.preventDefault();
            
            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            
            const width = startWidth + (clientX - startX);
            const height = startHeight + (clientY - startY);
            
            // Límites mínimos y máximos
            const minWidth = 320;
            const maxWidth = window.innerWidth - 40;
            const minHeight = 400;
            const maxHeight = window.innerHeight - 120;
            
            chatModal.style.width = Math.min(Math.max(width, minWidth), maxWidth) + 'px';
            chatModal.style.height = Math.min(Math.max(height, minHeight), maxHeight) + 'px';
        }
    });
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    el.style.willChange = 'transform';
}

document.addEventListener('mouseup', dragEnd);
document.addEventListener('touchend', dragEnd);

function dragEnd(e) {
    // Si no se movió mucho, considerarlo como un click
    const movedDistance = Math.abs(xOffset) + Math.abs(yOffset);
    
    if (isDraggingBubble && movedDistance < 10) {
        toggleChat();
    }

    initialX = currentX;
    initialY = currentY;

    // Limpiar willChange para mejor rendimiento
    if (chatBubble.style.willChange) {
        chatBubble.style.willChange = 'auto';
    }
    if (chatModal.style.willChange) {
        chatModal.style.willChange = 'auto';
    }

    isDraggingBubble = false;
    isDraggingModal = false;
    isResizing = false;
    
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}

// Funcionalidad de resize
function initResize() {
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'chat-resize-handle';
    resizeHandle.innerHTML = '<i class="fas fa-grip-lines-vertical"></i>';
    chatModal.appendChild(resizeHandle);
    
    resizeHandle.addEventListener('mousedown', startResize);
    resizeHandle.addEventListener('touchstart', startResize);
}

function startResize(e) {
    e.stopPropagation();
    isResizing = true;
    
    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    startWidth = chatModal.offsetWidth;
    startHeight = chatModal.offsetHeight;
}

// Inicializar resize cuando se carga
setTimeout(initResize, 100);

// Event listeners para botones
closeChatBtn.addEventListener('click', closeChat);
closeBubbleBtn.addEventListener('click', closeBubble);

// Detectar scroll para mostrar botón de cerrar burbuja
let scrollTimeout;
let hasScrolled = false;

window.addEventListener('scroll', () => {
    // Mostrar botón de cerrar al hacer scroll
    if (!hasScrolled && window.scrollY > 200) {
        closeBubbleBtn.style.display = 'flex';
        hasScrolled = true;
    }

    // Ocultar después de 3 segundos sin scroll
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        if (hasScrolled && window.scrollY < 200) {
            closeBubbleBtn.style.display = 'none';
            hasScrolled = false;
        }
    }, 3000);
});

// Inicialización
checkBubbleVisibility();

// Simular notificaciones (opcional)
function simulateNotification() {
    chatBadge.textContent = parseInt(chatBadge.textContent) + 1;
    chatBadge.style.display = 'flex';
    
    // Efecto de shake
    chatBubble.style.animation = 'none';
    setTimeout(() => {
        chatBubble.style.animation = '';
    }, 10);
}

// Exportar funciones para uso externo
window.chatWidget = {
    open: () => {
        chatModal.classList.add('active');
        chatBadge.style.display = 'none';
    },
    close: closeChat,
    hide: closeBubble,
    show: () => {
        chatBubble.style.display = 'flex';
        localStorage.removeItem('chatBubbleHidden');
    },
    notify: simulateNotification
};

console.log('💬 Chat Widget loaded successfully');
