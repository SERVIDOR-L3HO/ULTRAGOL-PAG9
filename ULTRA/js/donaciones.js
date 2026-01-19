function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Crear un toast o aviso visual temporal
        const originalAlert = window.alert;
        window.alert = function() {}; // Silenciar alert si es necesario o usar toast personalizado
        
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '100px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = '#ff4500';
        toast.style.color = '#fff';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '30px';
        toast.style.zIndex = '10000';
        toast.style.fontWeight = 'bold';
        toast.style.fontSize = '14px';
        toast.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
        toast.textContent = '¡Número copiado correctamente!';
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s ease';
            setTimeout(() => document.body.removeChild(toast), 500);
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}

function initPayPalSettings() {
    // PayPal deshabilitado por el usuario
    return;
}

document.addEventListener('DOMContentLoaded', function() {
    // initPayPalSettings() ya no es necesario llamar si está deshabilitado
});