// Live Scoreboard Module
class LiveScoreboard {
    constructor() {
        this.apiUrl = 'https://ultragol-api-3-six.vercel.app/transmisiones3';
        this.currentFilter = 'live'; // live, upcoming, all
        this.matches = [];
        this.lastUpdated = null;
        this.init();
    }

    async init() {
        await this.fetchMatches();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    async fetchMatches() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Error al obtener los datos');
            
            const data = await response.json();
            console.log('✅ Transmisiones cargadas:', data);
            this.matches = data.transmisiones || [];
            this.lastUpdated = data.actualizado || new Date().toLocaleString('es-MX');
            
            console.log('📡 Total de transmisiones:', this.matches.length);
            if (this.matches.length > 0) {
                console.log('📋 Primera transmisión:', this.matches[0]);
                console.log('🔍 Estados encontrados:', this.matches.map(m => m.estado));
            }
            
            this.renderMatches();
            this.updateLastUpdatedTime();
        } catch (error) {
            console.error('Error fetching transmisiones:', error);
            this.showError();
        }
    }

    setupEventListeners() {
        const tabs = document.querySelectorAll('.scoreboard-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        document.querySelectorAll('.scoreboard-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });
        
        this.renderMatches();
    }

    getFilteredMatches() {
        let filtered;
        switch (this.currentFilter) {
            case 'live':
                filtered = this.matches.filter(match => {
                    const estado = (match.estado || '').toLowerCase();
                    return estado === 'en vivo' || estado === 'live';
                });
                console.log(`🔴 Filtro EN VIVO: ${filtered.length} de ${this.matches.length} transmisiones`);
                return filtered;
            case 'upcoming':
                filtered = this.matches.filter(match => {
                    const estado = (match.estado || '').toLowerCase();
                    return estado === 'próximo' || estado === 'proximo' || estado === 'upcoming';
                });
                console.log(`⏰ Filtro PRÓXIMOS: ${filtered.length} de ${this.matches.length} transmisiones`);
                return filtered;
            case 'all':
            default:
                console.log(`📋 Filtro TODOS: ${this.matches.length} transmisiones`);
                return this.matches;
        }
    }

    renderMatches() {
        const container = document.getElementById('scoreboard-grid');
        console.log('🎬 renderMatches() llamado, container:', container);
        
        if (!container) {
            console.error('❌ Container #scoreboard-grid no encontrado');
            return;
        }

        const filteredMatches = this.getFilteredMatches();
        console.log('📝 Partidos filtrados:', filteredMatches.length);

        if (filteredMatches.length === 0) {
            console.log('⚠️ No hay partidos para mostrar');
            container.innerHTML = this.renderEmptyState();
            return;
        }

        try {
            const html = filteredMatches.map((match, index) => {
                console.log(`🏗️ Generando tarjeta ${index + 1} de ${filteredMatches.length}`);
                return this.renderMatchCard(match);
            }).join('');
            console.log(`✨ HTML generado, longitud: ${html.length} caracteres`);
            container.innerHTML = html;
            console.log('✅ Tarjetas renderizadas exitosamente');
        } catch (error) {
            console.error('❌ Error al renderizar tarjetas:', error);
        }
    }

    renderMatchCard(match) {
        const isLive = (match.estado || '').toLowerCase().includes('vivo') || (match.estado || '').toLowerCase() === 'live';
        const isUpcoming = (match.estado || '').toLowerCase().includes('próximo') || (match.estado || '').toLowerCase().includes('proximo');
        
        const partidoNombre = match.evento || match.titulo || match.equipo || 'Partido';
        const equipos = partidoNombre.split(' vs ');
        const team1 = equipos[0] || 'Equipo 1';
        const team2 = equipos[1] || 'Equipo 2';
        
        return `
            <div class="match-card ${isLive ? 'live' : ''}" data-match-id="${match.id || ''}">
                ${isLive ? '<div class="live-indicator"></div>' : ''}
                
                <div class="match-header">
                    <div class="match-league">
                        <div class="league-icon">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <span>${match.liga || 'Liga'}</span>
                    </div>
                    <div class="match-status">
                        ${isLive ? `
                            <span class="status-badge live">
                                <span class="live-dot"></span>
                                EN VIVO
                            </span>
                        ` : isUpcoming ? `
                            <span class="status-badge scheduled">
                                <i class="far fa-clock"></i>
                                ${match.hora || 'Próximamente'}
                            </span>
                        ` : `
                            <span class="status-badge">${match.estado || 'Programado'}</span>
                        `}
                    </div>
                </div>

                <div class="match-content">
                    <div class="teams-container">
                        <div class="team">
                            <div class="team-logo-container">
                                <div class="team-logo-bg"></div>
                                <div class="team-shield">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                            </div>
                            <div class="team-name">${team1}</div>
                        </div>

                        <div class="score-section">
                            <div class="vs-container">
                                <span class="vs-text">VS</span>
                            </div>
                        </div>

                        <div class="team">
                            <div class="team-logo-container">
                                <div class="team-logo-bg"></div>
                                <div class="team-shield">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                            </div>
                            <div class="team-name">${team2}</div>
                        </div>
                    </div>
                </div>

                <div class="match-footer">
                    ${match.hora ? `
                        <div class="match-info">
                            <i class="far fa-clock"></i>
                            <span>${match.hora}</span>
                        </div>
                    ` : ''}
                    ${match.deporte ? `
                        <div class="match-info">
                            <i class="fas fa-futbol"></i>
                            <span>${match.deporte}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        const messages = {
            live: {
                icon: 'fa-futbol',
                title: 'No hay partidos en vivo',
                message: 'En este momento no hay partidos en vivo. Revisa los próximos partidos.'
            },
            upcoming: {
                icon: 'fa-calendar-alt',
                title: 'No hay partidos próximos',
                message: 'No se encontraron partidos programados en este momento.'
            },
            all: {
                icon: 'fa-trophy',
                title: 'No hay partidos disponibles',
                message: 'No se encontraron partidos en este momento.'
            }
        };

        const msg = messages[this.currentFilter] || messages.all;

        return `
            <div class="empty-state">
                <i class="fas ${msg.icon}"></i>
                <h3>${msg.title}</h3>
                <p>${msg.message}</p>
            </div>
        `;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString.replace(/(\d{2})\/(\d{2})\/(\d{2})/, '20$3-$2-$1'));
            const options = { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric'
            };
            return date.toLocaleDateString('es-MX', options);
        } catch (error) {
            return dateString.split(',')[0];
        }
    }

    formatTime(dateString) {
        try {
            const timeMatch = dateString.match(/(\d{1,2}:\d{2}\s*[ap]\.?\s*m\.?)/i);
            return timeMatch ? timeMatch[1] : 'Por confirmar';
        } catch (error) {
            return 'Por confirmar';
        }
    }

    updateLastUpdatedTime() {
        const element = document.getElementById('last-updated-time');
        if (element) {
            element.textContent = this.lastUpdated;
        }
    }

    showError() {
        const container = document.getElementById('scoreboard-grid');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar los partidos</h3>
                    <p>Por favor, intenta de nuevo más tarde.</p>
                </div>
            `;
        }
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        setInterval(() => {
            this.fetchMatches();
        }, 30000);
    }
}

// Initialize when DOM is ready
function initLiveScoreboard() {
    const container = document.getElementById('scoreboard-grid');
    if (container) {
        console.log('🎬 Inicializando LiveScoreboard...');
        new LiveScoreboard();
    } else {
        console.log('⏳ Esperando a que el DOM esté listo...');
    }
}

// Try to initialize immediately or wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLiveScoreboard);
} else {
    // DOM already loaded
    initLiveScoreboard();
}
