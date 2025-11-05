// ======================================
// SETTINGS MODAL SYSTEM
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
    document.body.style.fontSize = currentSettings.fontSize + 'px';
    document.body.style.fontFamily = currentSettings.fontFamily;
    document.body.style.fontWeight = currentSettings.fontWeight;
    
    // Apply colors
    document.documentElement.style.setProperty('--text-primary', currentSettings.textColor);
    document.documentElement.style.setProperty('--primary-color', currentSettings.accentColor);
    
    // Apply background
    if (currentSettings.bgGradient) {
        document.body.style.background = currentSettings.bgGradient;
        document.documentElement.style.setProperty('--bg-dark', 'transparent');
    } else {
        document.body.style.background = currentSettings.bgColor;
        document.documentElement.style.setProperty('--bg-dark', currentSettings.bgColor);
    }
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
        fontSizeValue.textContent = currentSettings.fontSize;
    }

    // Font family
    document.querySelectorAll('.font-option').forEach(option => {
        option.classList.toggle('active', option.dataset.font === currentSettings.fontFamily);
    });

    // Font weight
    document.querySelectorAll('.weight-option').forEach(option => {
        option.classList.toggle('active', option.dataset.weight == currentSettings.fontWeight);
    });

    // Color pickers
    const textColorPicker = document.getElementById('textColorPicker');
    const accentColorPicker = document.getElementById('accentColorPicker');
    const bgColorPicker = document.getElementById('bgColorPicker');
    
    if (textColorPicker) textColorPicker.value = currentSettings.textColor;
    if (accentColorPicker) accentColorPicker.value = currentSettings.accentColor;
    if (bgColorPicker) bgColorPicker.value = currentSettings.bgColor;

    // Theme cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('active', card.dataset.theme === currentSettings.theme);
    });
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

    // Settings tabs
    const settingsTabs = document.querySelectorAll('.settings-tab');
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update tabs
            settingsTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update content
            document.querySelectorAll('.settings-tab-content').forEach(content => {
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
            fontSizeValue.textContent = size;
            currentSettings.fontSize = parseInt(size);
            document.body.style.fontSize = size + 'px';
            saveSettings();
        });
    }

    // Font family options
    document.querySelectorAll('.font-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.font-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            currentSettings.fontFamily = option.dataset.font;
            document.body.style.fontFamily = option.dataset.font;
            saveSettings();
        });
    });

    // Font weight options
    document.querySelectorAll('.weight-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.weight-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            currentSettings.fontWeight = parseInt(option.dataset.weight);
            document.body.style.fontWeight = option.dataset.weight;
            saveSettings();
        });
    });

    // Text color picker
    const textColorPicker = document.getElementById('textColorPicker');
    if (textColorPicker) {
        textColorPicker.addEventListener('input', (e) => {
            currentSettings.textColor = e.target.value;
            document.documentElement.style.setProperty('--text-primary', e.target.value);
            saveSettings();
        });
    }

    // Text color presets
    document.querySelectorAll('#colors-tab .color-picker-container:first-child .color-preset').forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.dataset.color;
            document.querySelectorAll('#colors-tab .color-picker-container:first-child .color-preset').forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            
            currentSettings.textColor = color;
            textColorPicker.value = color;
            document.documentElement.style.setProperty('--text-primary', color);
            saveSettings();
        });
    });

    // Accent color picker
    const accentColorPicker = document.getElementById('accentColorPicker');
    if (accentColorPicker) {
        accentColorPicker.addEventListener('input', (e) => {
            currentSettings.accentColor = e.target.value;
            document.documentElement.style.setProperty('--primary-color', e.target.value);
            saveSettings();
        });
    }

    // Accent color presets
    document.querySelectorAll('#colors-tab .color-picker-container:nth-child(2) .color-preset').forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.dataset.color;
            document.querySelectorAll('#colors-tab .color-picker-container:nth-child(2) .color-preset').forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            
            currentSettings.accentColor = color;
            accentColorPicker.value = color;
            document.documentElement.style.setProperty('--primary-color', color);
            saveSettings();
        });
    });

    // Background color picker
    const bgColorPicker = document.getElementById('bgColorPicker');
    if (bgColorPicker) {
        bgColorPicker.addEventListener('input', (e) => {
            currentSettings.bgColor = e.target.value;
            currentSettings.bgGradient = null;
            document.body.style.background = e.target.value;
            document.documentElement.style.setProperty('--bg-dark', e.target.value);
            saveSettings();
        });
    }

    // Background color presets
    document.querySelectorAll('#background-tab .color-picker-container .color-preset').forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.dataset.color;
            document.querySelectorAll('#background-tab .color-picker-container .color-preset').forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            
            currentSettings.bgColor = color;
            currentSettings.bgGradient = null;
            bgColorPicker.value = color;
            document.body.style.background = color;
            document.documentElement.style.setProperty('--bg-dark', color);
            saveSettings();
        });
    });

    // Gradient options
    document.querySelectorAll('.gradient-option').forEach(option => {
        option.addEventListener('click', () => {
            const gradient = option.dataset.gradient;
            currentSettings.bgGradient = gradient;
            document.body.style.background = gradient;
            document.documentElement.style.setProperty('--bg-dark', 'transparent');
            saveSettings();
        });
    });

    // Custom gradient
    const applyCustomGradient = document.getElementById('applyCustomGradient');
    if (applyCustomGradient) {
        applyCustomGradient.addEventListener('click', () => {
            const color1 = document.getElementById('gradientColor1').value;
            const color2 = document.getElementById('gradientColor2').value;
            const angle = document.getElementById('gradientAngle').value;
            
            const gradient = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
            currentSettings.bgGradient = gradient;
            document.body.style.background = gradient;
            document.documentElement.style.setProperty('--bg-dark', 'transparent');
            saveSettings();
        });
    }

    // Theme cards
    const themeConfigs = {
        default: {
            accentColor: '#9d4edd',
            bgColor: '#1a1625',
            textColor: '#f3f0ff',
            bgGradient: null
        },
        dark: {
            accentColor: '#ffffff',
            bgColor: '#000000',
            textColor: '#ffffff',
            bgGradient: null
        },
        ocean: {
            accentColor: '#0ea5e9',
            bgColor: '#0c4a6e',
            textColor: '#e0f2fe',
            bgGradient: null
        },
        forest: {
            accentColor: '#10b981',
            bgColor: '#064e3b',
            textColor: '#d1fae5',
            bgGradient: null
        },
        sunset: {
            accentColor: '#f59e0b',
            bgColor: '#78350f',
            textColor: '#fef3c7',
            bgGradient: null
        },
        rose: {
            accentColor: '#ec4899',
            bgColor: '#831843',
            textColor: '#fce7f3',
            bgGradient: null
        },
        minimal: {
            accentColor: '#6b7280',
            bgColor: '#f3f4f6',
            textColor: '#111827',
            bgGradient: null
        },
        neon: {
            accentColor: '#22d3ee',
            bgColor: '#0f172a',
            textColor: '#67e8f9',
            bgGradient: null
        }
    };

    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            const themeName = card.dataset.theme;
            const theme = themeConfigs[themeName];
            
            if (theme) {
                document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                currentSettings.theme = themeName;
                currentSettings.accentColor = theme.accentColor;
                currentSettings.bgColor = theme.bgColor;
                currentSettings.textColor = theme.textColor;
                currentSettings.bgGradient = theme.bgGradient;
                
                applyAllSettings();
                updateSettingsUI();
                saveSettings();
            }
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
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSettings);
} else {
    initializeSettings();
}
