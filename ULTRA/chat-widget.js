// Chat Widget Estilo Messenger - UltraGol
// Sistema de chat flotante con funcionalidad drag & drop

const chatBubble = document.getElementById('chatBubble');
const chatModal = document.getElementById('chatModal');
const chatModalHeader = document.getElementById('chatModalHeader');
const closeChatBtn = document.getElementById('closeChatBtn');
const closeBubbleBtn = document.getElementById('closeBubbleBtn');
const chatBadge = document.getElementById('chatBadge');

let isDraggingBubble = false;
let isDraggingModal = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

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

document.addEventListener('mousemove', drag);
document.addEventListener('touchmove', drag);

function drag(e) {
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
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
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

    isDraggingBubble = false;
    isDraggingModal = false;
}

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
