// ==================== ULTRAGOL MODALS LOGIC ====================
// Lógica compartida para modales en todo el sitio

class UltraGolModals {
    constructor() {
        this.transmisionesData = null;
        this.currentStream = null;
        this.init();
    }

    init() {
        this.loadTransmisiones();
        this.createModals();
        this.setupEventListeners();
    }

    createModals() {
        if (document.getElementById('ultraGolPlayerModal')) return;

        const modalsHTML = `
            <!-- Modal de Reproducción -->
            <div id="ultraGolPlayerModal" class="ultragol-player-modal">
                <div class="ultragol-modal-content">
                    <div class="ultragol-modal-header">
                        <h3 id="ultraGolModalTitle">Transmisión en Vivo</h3>
                        <button class="ultragol-close-modal" onclick="ultraGolModals.closePlayerModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="ultragol-modal-body">
                        <div class="ultragol-loading-spinner" id="ultraGolModalLoader">
                            <div class="ultragol-spinner"></div>
                            <p>Cargando transmisión...</p>
                        </div>
                        <iframe id="ultraGolModalIframe" frameborder="0" allowfullscreen></iframe>
                    </div>
                    <div class="ultragol-modal-footer">
                        <button class="ultragol-modal-btn" onclick="ultraGolModals.refreshStream()">
                            <i class="fas fa-sync-alt"></i> Recargar
                        </button>
                        <button class="ultragol-modal-btn" onclick="ultraGolModals.fullscreenStream()">
                            <i class="fas fa-expand"></i> Pantalla Completa
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal de Selección de Canales -->
            <div id="ultraGolChannelSelector" class="ultragol-channel-selector-modal">
                <div class="ultragol-channel-selector-content">
                    <div class="ultragol-channel-selector-header">
                        <h3 id="ultraGolChannelSelectorTitle">Seleccionar Canal</h3>
                        <button class="ultragol-close-modal" onclick="ultraGolModals.closeChannelSelector()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="ultragol-channel-selector-body" id="ultraGolChannelSelectorBody">
                    </div>
                </div>
            </div>

            <!-- Modal de Partidos Importantes -->
            <div id="ultraGolImportantMatchesModal" class="ultragol-important-matches-modal">
                <div class="ultragol-important-modal-overlay" onclick="ultraGolModals.closeImportantMatchesModal()"></div>
                <div class="ultragol-important-modal-container">
                    <div class="ultragol-important-modal-header">
                        <div class="ultragol-important-modal-header-content">
                            <div class="ultragol-important-modal-title-wrapper">
                                <i class="fas fa-star" style="color: #FFD700;"></i>
                                <h3 class="ultragol-important-modal-title">PARTIDOS IMPORTANTES</h3>
                            </div>
                            <p class="ultragol-important-modal-subtitle">Selecciona un partido para ver los canales disponibles</p>
                        </div>
                        <button class="ultragol-close-important-modal" onclick="ultraGolModals.closeImportantMatchesModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="ultragol-important-modal-body" id="ultraGolImportantMatchesBody">
                        <div class="ultragol-loading-matches">
                            <div class="ultragol-spinner"></div>
                            <p>Cargando partidos...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalsHTML);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    async loadTransmisiones() {
        try {
            const [response1, response2] = await Promise.all([
                fetch('https://ultragol-api3.onrender.com/transmisiones'),
                fetch('https://ultragol-api3.onrender.com/transmisiones3')
            ]);
            
            const data1 = await response1.json();
            const data2 = await response2.json();
            
            const transmisionesCombinadas = [
                ...(data1.transmisiones || []),
                ...(data2.transmisiones || [])
            ];
            
            this.transmisionesData = {
                transmisiones: transmisionesCombinadas
            };
            
            console.log('✅ Transmisiones cargadas:', transmisionesCombinadas.length);
            return this.transmisionesData;
        } catch (error) {
            console.error('❌ Error cargando transmisiones:', error);
            return null;
        }
    }

    openImportantMatchesModal() {
        const modal = document.getElementById('ultraGolImportantMatchesModal');
        const body = document.getElementById('ultraGolImportantMatchesBody');
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        body.innerHTML = `
            <div class="ultragol-loading-matches">
                <div class="ultragol-spinner"></div>
                <p>Cargando partidos...</p>
            </div>
        `;
        
        this.loadImportantMatches();
    }

    closeImportantMatchesModal() {
        const modal = document.getElementById('ultraGolImportantMatchesModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    async loadImportantMatches() {
        try {
            if (!this.transmisionesData || !this.transmisionesData.transmisiones) {
                await this.loadTransmisiones();
            }
            
            this.renderImportantMatches();
        } catch (error) {
            console.error('Error cargando partidos importantes:', error);
            this.showNoMatchesMessage();
        }
    }

    renderImportantMatches() {
        const body = document.getElementById('ultraGolImportantMatchesBody');
        
        if (!this.transmisionesData || !this.transmisionesData.transmisiones || this.transmisionesData.transmisiones.length === 0) {
            this.showNoMatchesMessage();
            return;
        }

        const deporteBackgrounds = {
            'futbol': 'ULTRA/futbol-bg.jpg',
            'basketball': 'ULTRA/basquet-bg.jpg',
            'basquet': 'ULTRA/basquet-bg.jpg',
            'motos': 'ULTRA/motos-bg.jpg'
        };

        const matchesHTML = this.transmisionesData.transmisiones.map((transmision, index) => {
            const canalesCount = transmision.canales?.length || 0;
            const deporte = transmision.deporte?.toLowerCase() || 'futbol';
            const backgroundImage = deporteBackgrounds[deporte] || deporteBackgrounds['futbol'];
            
            const liga = transmision.liga || '';
            const fecha = transmision.fecha || '';
            
            let statusBadge = '';
            if (transmision.enVivo) {
                statusBadge = '<span class="ultragol-status-badge live"><span class="live-dot"></span> EN VIVO</span>';
            } else {
                statusBadge = '<span class="ultragol-status-badge upcoming"><i class="far fa-clock"></i> PRÓXIMO</span>';
            }

            return `
                <div class="ultragol-important-match-card" onclick='${canalesCount > 0 ? `ultraGolModals.selectImportantMatchByTransmision(${index})` : `ultraGolModals.showToast("No hay canales disponibles para este partido")`}'>
                    <div class="ultragol-match-image-container">
                        <img src="${backgroundImage}" alt="${deporte}" class="ultragol-match-bg-image">
                        <div class="ultragol-match-image-overlay"></div>
                    </div>
                    
                    <div class="ultragol-match-info-container">
                        <div class="ultragol-match-badges">
                            ${liga ? `<span class="ultragol-league-badge">${liga.toUpperCase()}</span>` : ''}
                            ${statusBadge}
                        </div>
                        
                        <h3 class="ultragol-match-title">${transmision.evento}</h3>
                        
                        ${fecha ? `<div class="ultragol-match-date"><i class="far fa-clock"></i> ${fecha}</div>` : ''}
                        
                        <div class="ultragol-match-footer">
                            ${canalesCount > 0 ? `
                                <div class="ultragol-channel-info">
                                    <i class="fas fa-tv"></i>
                                    <span>Canal ${transmision.canales[0]?.numero || transmision.canales[0]?.nombre || ''}</span>
                                </div>
                                <button class="ultragol-btn-ver">
                                    <i class="fas fa-play"></i> Ver
                                </button>
                            ` : `
                                <div class="ultragol-no-channels-text">Sin canales disponibles</div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        body.innerHTML = matchesHTML || '<div class="ultragol-loading-matches"><p>No hay partidos disponibles</p></div>';
    }

    showNoMatchesMessage() {
        const body = document.getElementById('ultraGolImportantMatchesBody');
        body.innerHTML = `
            <div class="ultragol-loading-matches">
                <i class="fas fa-info-circle" style="font-size: 48px; color: var(--primary);"></i>
                <p>No hay partidos disponibles en este momento</p>
            </div>
        `;
    }

    selectImportantMatchByTransmision(index) {
        if (!this.transmisionesData || !this.transmisionesData.transmisiones[index]) {
            this.showToast('No se pudo encontrar la transmisión');
            return;
        }

        const transmision = this.transmisionesData.transmisiones[index];
        this.showChannelSelector(transmision, transmision.evento);
    }

    showChannelSelector(transmision, partidoNombre) {
        const modal = document.getElementById('ultraGolChannelSelector');
        const body = document.getElementById('ultraGolChannelSelectorBody');
        const title = document.getElementById('ultraGolChannelSelectorTitle');
        
        title.textContent = partidoNombre;
        
        if (!transmision.canales || transmision.canales.length === 0) {
            body.innerHTML = '<div class="ultragol-loading-matches"><p>No hay canales disponibles</p></div>';
            modal.classList.add('active');
            return;
        }

        body.innerHTML = transmision.canales.map((canal, index) => {
            const streamTypes = [];
            if (canal.links?.hoca) streamTypes.push({ name: 'Hoca', url: canal.links.hoca });
            if (canal.links?.caster) streamTypes.push({ name: 'Caster', url: canal.links.caster });
            if (canal.links?.wigi) streamTypes.push({ name: 'Wigi', url: canal.links.wigi });
            
            return `
                <div class="ultragol-channel-option">
                    <div class="ultragol-channel-info">
                        <div class="ultragol-channel-number">${canal.numero || (index + 1)}</div>
                        <div class="ultragol-channel-name">${canal.nombre || 'Canal ' + (index + 1)}</div>
                    </div>
                    <div class="ultragol-stream-options">
                        ${streamTypes.map(type => `
                            <button class="ultragol-stream-option-btn" onclick='ultraGolModals.selectStream("${type.url}", "${partidoNombre} - ${canal.nombre} (${type.name})")'>
                                <i class="fas fa-play-circle"></i>
                                ${type.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
        
        this.closeImportantMatchesModal();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeChannelSelector() {
        const modal = document.getElementById('ultraGolChannelSelector');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    selectStream(streamUrl, streamTitle) {
        this.closeChannelSelector();
        this.playStreamInModal(streamUrl, streamTitle);
    }

    playStreamInModal(streamUrl, title) {
        const modal = document.getElementById('ultraGolPlayerModal');
        const iframe = document.getElementById('ultraGolModalIframe');
        const titleEl = document.getElementById('ultraGolModalTitle');
        const loader = document.getElementById('ultraGolModalLoader');
        
        this.currentStream = streamUrl;
        titleEl.textContent = title;
        
        loader.style.display = 'flex';
        iframe.style.display = 'none';
        
        iframe.onload = () => {
            setTimeout(() => {
                loader.style.display = 'none';
                iframe.style.display = 'block';
            }, 1000);
        };
        
        iframe.src = streamUrl;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closePlayerModal() {
        const modal = document.getElementById('ultraGolPlayerModal');
        const iframe = document.getElementById('ultraGolModalIframe');
        
        iframe.src = '';
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentStream = null;
    }

    refreshStream() {
        if (this.currentStream) {
            const iframe = document.getElementById('ultraGolModalIframe');
            const loader = document.getElementById('ultraGolModalLoader');
            
            loader.style.display = 'flex';
            iframe.style.display = 'none';
            
            setTimeout(() => {
                iframe.src = this.currentStream;
                setTimeout(() => {
                    loader.style.display = 'none';
                    iframe.style.display = 'block';
                }, 1000);
            }, 100);
        }
    }

    fullscreenStream() {
        const iframe = document.getElementById('ultraGolModalIframe');
        
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
            iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) {
            iframe.msRequestFullscreen();
        }
    }

    closeAllModals() {
        this.closePlayerModal();
        this.closeChannelSelector();
        this.closeImportantMatchesModal();
    }

    showToast(message) {
        const existingToast = document.querySelector('.ultragol-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'ultragol-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(26, 26, 26, 0.95);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10001;
            animation: slideUpToast 0.3s ease;
            border: 1px solid rgba(255, 69, 0, 0.5);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUpToast {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDownToast 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    addImportantMatchesButton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const button = document.createElement('div');
        button.className = 'ultragol-important-matches-btn-container';
        button.innerHTML = `
            <button class="ultragol-important-matches-btn" onclick="ultraGolModals.openImportantMatchesModal()">
                <div class="ultragol-btn-icon-wrapper">
                    <i class="fas fa-star"></i>
                    <i class="fas fa-futbol"></i>
                </div>
                <div class="ultragol-btn-text-wrapper">
                    <span class="ultragol-btn-title">PARTIDOS IMPORTANTES</span>
                    <span class="ultragol-btn-subtitle">Ver todos los partidos y canales</span>
                </div>
                <i class="fas fa-chevron-right ultragol-btn-arrow"></i>
            </button>
        `;

        container.insertBefore(button, container.firstChild);
    }
}

const ultraGolModals = new UltraGolModals();

if (typeof window !== 'undefined') {
    window.ultraGolModals = ultraGolModals;
}
