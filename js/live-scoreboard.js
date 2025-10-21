// Live Scoreboard Module
class LiveScoreboard {
    constructor() {
        this.apiUrl = 'https://ultragol-api3.onrender.com/marcadores';
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
            this.matches = data.partidos || [];
            this.lastUpdated = data.actualizado || new Date().toLocaleString('es-MX');
            
            this.renderMatches();
            this.updateLastUpdatedTime();
        } catch (error) {
            console.error('Error fetching matches:', error);
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
                return this.matches.filter(match => match.estado.enVivo);
            case 'upcoming':
                return this.matches.filter(match => match.estado.programado && !match.estado.enVivo);
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
        const isLive = match.estado.enVivo;
        const isFinished = match.estado.finalizado;
        const localWinner = match.local.ganador;
        const visitanteWinner = match.visitante.ganador;

        return `
            <div class="match-card ${isLive ? 'live' : ''}" data-match-id="${match.id}">
                <div class="match-header">
                    <div class="match-date">
                        <i class="far fa-calendar"></i> ${this.formatDate(match.fecha)}
                    </div>
                    <div class="match-status">
                        ${isLive ? `
                            <span class="status-badge live">LIVE</span>
                            <span class="match-clock">${match.reloj}</span>
                        ` : isFinished ? `
                            <span class="status-badge finished">Finalizado</span>
                        ` : `
                            <span class="status-badge scheduled">${this.formatTime(match.fecha)}</span>
                        `}
                    </div>
                </div>

                <div class="match-content">
                    <div class="teams-container">
                        <!-- Local Team -->
                        <div class="team ${localWinner ? 'winner' : ''}">
                            <div class="team-logo-container">
                                <img src="${match.local.logo}" alt="${match.local.nombre}" class="team-logo" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%%22 y=%2250%%22 font-size=%2240%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23666%22>?</text></svg>'">
                            </div>
                            <div class="team-name">${match.local.nombreCorto || match.local.nombre}</div>
                        </div>

                        <!-- Score Section -->
                        <div class="score-section">
                            ${isLive || isFinished ? `
                                <div class="score-display">
                                    <span class="score">${match.local.marcador}</span>
                                    <span class="score-separator">-</span>
                                    <span class="score">${match.visitante.marcador}</span>
                                </div>
                            ` : `
                                <div class="vs-text">VS</div>
                            `}
                        </div>

                        <!-- Visitante Team -->
                        <div class="team ${visitanteWinner ? 'winner' : ''}">
                            <div class="team-logo-container">
                                <img src="${match.visitante.logo}" alt="${match.visitante.nombre}" class="team-logo" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%%22 y=%2250%%22 font-size=%2240%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23666%22>?</text></svg>'">
                            </div>
                            <div class="team-name">${match.visitante.nombreCorto || match.visitante.nombre}</div>
                        </div>
                    </div>
                </div>

                ${match.detalles ? `
                    <div class="match-details">
                        <div class="match-venue">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${match.detalles.estadio || 'Estadio por confirmar'}</span>
                        </div>
                        ${match.detalles.ciudad ? `
                            <div class="match-venue">
                                <i class="fas fa-city"></i>
                                <span>${match.detalles.ciudad}</span>
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
