// Live Scoreboard Module
class LiveScoreboard {
    constructor() {
        this.apiUrl = 'https://ultragol-api3.onrender.com/transmisiones3';
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
        switch (this.currentFilter) {
            case 'live':
                return this.matches.filter(match => {
                    const estado = (match.estado || '').toLowerCase();
                    return estado === 'en vivo' || estado === 'live';
                });
            case 'upcoming':
                return this.matches.filter(match => {
                    const estado = (match.estado || '').toLowerCase();
                    return estado === 'próximo' || estado === 'proximo' || estado === 'upcoming';
                });
            case 'all':
            default:
                return this.matches;
        }
    }

    renderMatches() {
        const container = document.getElementById('scoreboard-grid');
        if (!container) return;

        const filteredMatches = this.getFilteredMatches();

        if (filteredMatches.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = filteredMatches.map(match => this.renderMatchCard(match)).join('');
    }

    renderMatchCard(match) {
        const isLive = (match.estado || '').toLowerCase().includes('vivo') || (match.estado || '').toLowerCase() === 'live';
        const isUpcoming = (match.estado || '').toLowerCase().includes('próximo') || (match.estado || '').toLowerCase().includes('proximo');
        
        // Extraer equipos del campo 'equipo' (formato: "Team1 vs Team2")
        const equipos = (match.equipo || 'Partido').split(' vs ');
        const team1 = equipos[0] || 'Equipo 1';
        const team2 = equipos[1] || 'Equipo 2';
        
        return `
            <div class="match-card ${isLive ? 'live' : ''}" data-match-id="${match.id || ''}">
                <div class="match-header">
                    <div class="match-date">
                        <i class="fas fa-trophy"></i> ${match.liga || 'Liga'}
                    </div>
                    <div class="match-status">
                        ${isLive ? `
                            <span class="status-badge live">EN VIVO</span>
                        ` : isUpcoming ? `
                            <span class="status-badge scheduled">${match.hora || 'Próximamente'}</span>
                        ` : `
                            <span class="status-badge">${match.estado || 'Programado'}</span>
                        `}
                    </div>
                </div>

                <div class="match-content">
                    <div class="teams-container">
                        <!-- Team 1 -->
                        <div class="team">
                            <div class="team-logo-container">
                                <i class="fas fa-shield-alt" style="font-size: 2rem; color: var(--primary);"></i>
                            </div>
                            <div class="team-name">${team1}</div>
                        </div>

                        <!-- VS Section -->
                        <div class="score-section">
                            <div class="vs-text">VS</div>
                        </div>

                        <!-- Team 2 -->
                        <div class="team">
                            <div class="team-logo-container">
                                <i class="fas fa-shield-alt" style="font-size: 2rem; color: var(--primary);"></i>
                            </div>
                            <div class="team-name">${team2}</div>
                        </div>
                    </div>
                </div>

                ${match.hora ? `
                    <div class="match-details">
                        <div class="match-venue">
                            <i class="far fa-clock"></i>
                            <span>${match.hora}</span>
                        </div>
                        ${match.deporte ? `
                            <div class="match-venue">
                                <i class="fas fa-futbol"></i>
                                <span>${match.deporte}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
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
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('scoreboard-grid')) {
        new LiveScoreboard();
    }
});
