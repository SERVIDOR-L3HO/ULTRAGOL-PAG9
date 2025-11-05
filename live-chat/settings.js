// ======================================
// SETTINGS MODAL SYSTEM V2
// Professional & Creative Configuration
// ======================================

const defaultSettings = {
    fontSize: 14,
    fontFamily: "Inter, 'Segoe UI', sans-serif",
    fontWeight: 400,
    textColor: '#f3f0ff',
    accentColor: '#9d4edd',
    bgColor: '#1a1625',
    bgGradient: null,
    theme: 'default'
};

let currentSettings = { ...defaultSettings };

// 5 Temas Profesionales Principales
const themes = {
    default: {
        name: 'UltraGol Original',
        accentColor: '#9d4edd',
        bgColor: '#1a1625',
        bgDarker: '#0f0b16',
        bgCard: '#241b2f',
        textColor: '#f3f0ff',
        textSecondary: '#b4a5d8',
        bgGradient: null
    },
    dark: {
        name: 'Oscuro Puro',
        accentColor: '#ffffff',
        bgColor: '#000000',
        bgDarker: '#0a0a0a',
        bgCard: '#1a1a1a',
        textColor: '#ffffff',
        textSecondary: '#a3a3a3',
        bgGradient: null
    },
    ocean: {
        name: 'Océano Profundo',
        accentColor: '#0ea5e9',
        bgColor: '#0c4a6e',
        bgDarker: '#082f49',
        bgCard: '#164e63',
        textColor: '#e0f2fe',
        textSecondary: '#7dd3fc',
        bgGradient: null
    },
    forest: {
        name: 'Bosque Natural',
        accentColor: '#10b981',
        bgColor: '#064e3b',
        bgDarker: '#022c22',
        bgCard: '#065f46',
        textColor: '#d1fae5',
        textSecondary: '#6ee7b7',
        bgGradient: null
    },
    sunset: {
        name: 'Atardecer Cálido',
        accentColor: '#f59e0b',
        bgColor: '#78350f',
        bgDarker: '#451a03',
        bgCard: '#92400e',
        textColor: '#fef3c7',
        textSecondary: '#fcd34d',
        bgGradient: null
    }
};

// Load saved settings on page load
function loadSavedSettings() {
    const saved = localStorage.getItem('chatSettings');
    if (saved) {
        try {
            currentSettings = { ...defaultSettings, ...JSON.parse(saved) };
            applyAllSettings();
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('chatSettings', JSON.stringify(currentSettings));
}

// Apply all settings to the page
function applyAllSettings() {
    // Typography
    document.body.style.fontSize = currentSettings.fontSize + 'px';
    document.body.style.fontFamily = currentSettings.fontFamily;
    document.body.style.fontWeight = currentSettings.fontWeight;
    
    // Colors - Apply to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--text-primary', currentSettings.textColor);
    root.style.setProperty('--primary-color', currentSettings.accentColor);
    root.style.setProperty('--secondary-color', currentSettings.accentColor);
    
    // Background
    if (currentSettings.bgGradient) {
        document.body.style.background = currentSettings.bgGradient;
        root.style.setProperty('--bg-dark', 'transparent');
        root.style.setProperty('--bg-darker', 'transparent');
        
        // Apply gradient to chat section too
        const chatSection = document.querySelector('.chat-section');
        if (chatSection) {
            chatSection.style.background = currentSettings.bgGradient;
        }
    } else {
        document.body.style.background = currentSettings.bgColor;
        root.style.setProperty('--bg-dark', currentSettings.bgColor);
        
        // Apply theme colors if using a predefined theme
        if (themes[currentSettings.theme]) {
            const theme = themes[currentSettings.theme];
            root.style.setProperty('--bg-darker', theme.bgDarker);
            root.style.setProperty('--bg-card', theme.bgCard);
            root.style.setProperty('--text-secondary', theme.textSecondary);
            root.style.setProperty('--accent-purple', theme.accentColor);
        }
    }
    
    // Update other accent-dependent properties
    updateAccentColors();
}

// Update all accent color dependent elements
function updateAccentColors() {
    const root = document.documentElement;
    const accentColor = currentSettings.accentColor;
    
    // Update various accent uses throughout the app
    root.style.setProperty('--hover-color', adjustColorBrightness(accentColor, -20));
    root.style.setProperty('--accent-red', '#ff4655'); // Keep red for certain elements
    root.style.setProperty('--accent-gold', '#ffd700'); // Keep gold for VIP badges
}

// Helper function to adjust color brightness
function adjustColorBrightness(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
           (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
           .toString(16).slice(1);
}

// Open Settings Modal
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'flex';
        updateSettingsUI();
    }
}

// Close Settings Modal
function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Update UI to reflect current settings
function updateSettingsUI() {
    // Font size
    const fontSizeRange = document.getElementById('fontSizeRange');
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (fontSizeRange && fontSizeValue) {
        fontSizeRange.value = currentSettings.fontSize;
        fontSizeValue.textContent = currentSettings.fontSize + 'px';
    }

    // Font family
    document.querySelectorAll('.font-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.font === currentSettings.fontFamily);
    });

    // Color pickers
    const accentColorPicker = document.getElementById('accentColorPicker');
    const bgColorPicker = document.getElementById('bgColorPicker');
    
    if (accentColorPicker) accentColorPicker.value = currentSettings.accentColor;
    if (bgColorPicker) bgColorPicker.value = currentSettings.bgColor;

    // Theme cards - both popular and all themes
    document.querySelectorAll('[data-theme]').forEach(card => {
        card.classList.toggle('active', card.dataset.theme === currentSettings.theme);
    });
}

// Apply a predefined theme
function applyTheme(themeName) {
    if (themes[themeName]) {
        const theme = themes[themeName];
        currentSettings.theme = themeName;
        currentSettings.accentColor = theme.accentColor;
        currentSettings.bgColor = theme.bgColor;
        currentSettings.textColor = theme.textColor;
        currentSettings.bgGradient = theme.bgGradient;
        
        applyAllSettings();
        updateSettingsUI();
        saveSettings();
        
        // Visual feedback
        showToast(`Tema "${theme.name}" aplicado`);
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 14px;
        box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Initialize Settings System
function initializeSettings() {
    // Load saved settings
    loadSavedSettings();

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettingsModal);
    }

    // Settings tabs V2
    const settingsTabs = document.querySelectorAll('.settings-tab-v2');
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update tabs
            settingsTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update content
            document.querySelectorAll('.settings-tab-content-v2').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(targetTab + '-tab')?.classList.add('active');
        });
    });

    // Font size range
    const fontSizeRange = document.getElementById('fontSizeRange');
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (fontSizeRange) {
        fontSizeRange.addEventListener('input', (e) => {
            const size = e.target.value;
            fontSizeValue.textContent = size + 'px';
            currentSettings.fontSize = parseInt(size);
            document.body.style.fontSize = size + 'px';
            saveSettings();
        });
    }

    // Font family buttons
    document.querySelectorAll('.font-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentSettings.fontFamily = btn.dataset.font;
            document.body.style.fontFamily = btn.dataset.font;
            saveSettings();
        });
    });

    // Accent color picker
    const accentColorPicker = document.getElementById('accentColorPicker');
    if (accentColorPicker) {
        accentColorPicker.addEventListener('input', (e) => {
            currentSettings.accentColor = e.target.value;
            currentSettings.theme = 'custom';
            applyAllSettings();
            saveSettings();
        });
    }

    // Accent color presets
    document.querySelectorAll('.color-control-modern:first-child .color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const color = dot.dataset.color;
            currentSettings.accentColor = color;
            currentSettings.theme = 'custom';
            if (accentColorPicker) accentColorPicker.value = color;
            applyAllSettings();
            saveSettings();
        });
    });

    // Background color picker
    const bgColorPicker = document.getElementById('bgColorPicker');
    if (bgColorPicker) {
        bgColorPicker.addEventListener('input', (e) => {
            currentSettings.bgColor = e.target.value;
            currentSettings.bgGradient = null;
            currentSettings.theme = 'custom';
            applyAllSettings();
            saveSettings();
        });
    }

    // Background color presets
    document.querySelectorAll('.color-control-modern:nth-child(2) .color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const color = dot.dataset.color;
            currentSettings.bgColor = color;
            currentSettings.bgGradient = null;
            currentSettings.theme = 'custom';
            if (bgColorPicker) bgColorPicker.value = color;
            applyAllSettings();
            saveSettings();
        });
    });

    // Gradient quick buttons
    document.querySelectorAll('.gradient-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const gradient = btn.dataset.gradient;
            currentSettings.bgGradient = gradient;
            currentSettings.theme = 'custom';
            applyAllSettings();
            saveSettings();
            showToast('Degradado aplicado');
        });
    });

    // Theme cards - both popular and regular
    document.querySelectorAll('[data-theme]').forEach(card => {
        card.addEventListener('click', () => {
            const themeName = card.dataset.theme;
            applyTheme(themeName);
        });
    });

    // Reset settings
    const resetBtn = document.getElementById('resetSettings');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres restaurar la configuración predeterminada?')) {
                currentSettings = { ...defaultSettings };
                applyAllSettings();
                updateSettingsUI();
                saveSettings();
                showToast('Configuración restaurada');
            }
        });
    }

    // Close modal when clicking overlay
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        const overlay = settingsModal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeSettingsModal);
        }
    }
    
    // Add CSS animations
    addAnimationStyles();
}

// Add animation styles dynamically
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSettings);
} else {
    initializeSettings();
}

// Expose functions globally
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
