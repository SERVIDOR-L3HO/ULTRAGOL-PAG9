// Enhanced Statistics JavaScript for Liga MX Website by L3HO
document.addEventListener('DOMContentLoaded', function() {
    initializeStats();
});

// Variables globales
let currentTab = 'general';
let statsData = {
    general: {},
    teams: {},
    players: {},
    advanced: {}
};

// Inicializar estadísticas
async function initializeStats() {
    try {
        await loadStatsData();
        setupTabs();
        setupAdvancedComparison();
        loadTabContent(currentTab);
        
        // Mostrar animaciones
        animateStatsOnLoad();
    } catch (error) {
        console.error('Error inicializando estadísticas:', error);
    }
}

// Cargar datos de estadísticas
async function loadStatsData() {
    try {
        // Cargar datos desde la API de UltraGol
        const [standings, teams, fixtures, goleadores] = await Promise.all([
            ultraGolAPI.getTabla().catch(() => fetch('data/standings.json').then(r => r.json())),
            ultraGolAPI.getEquipos().catch(() => fetch('data/teams.json').then(r => r.json())),
            fetch('data/fixtures.json').then(r => r.json()),
            ultraGolAPI.getGoleadores().catch(() => [])
        ]);

        // Procesar datos para estadísticas
        statsData.general = calculateGeneralStats(standings, fixtures);
        statsData.teams = calculateTeamStats(standings, teams);
        statsData.players = calculatePlayerStats(standings, teams, goleadores);
        statsData.advanced = calculateAdvancedStats(standings, fixtures);

    } catch (error) {
        console.error('Error cargando datos de estadísticas:', error);
        // Datos de fallback
        statsData = generateFallbackStats();
    }
}

// Configurar pestañas
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

// Cambiar pestaña
function switchTab(tabId) {
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    
    currentTab = tabId;
    loadTabContent(tabId);
}

// Cargar contenido de pestaña
function loadTabContent(tabId) {
    switch(tabId) {
        case 'general':
            updateGeneralStats();
            break;
        case 'teams':
            updateTeamStats();
            break;
        case 'players':
            updatePlayerStats();
            break;
        case 'advanced':
            updateAdvancedStats();
            populateAdvancedSelectors();
            break;
    }
}

// Actualizar estadísticas generales
async function updateGeneralStats() {
    // Cargar y mostrar goleadores
    await loadTopScorers();
}

// Actualizar estadísticas de equipos
function updateTeamStats() {
    const data = statsData.teams;
    
    // Actualizar rankings de ataque y defensa
    if (data.bestAttack) {
        updateLeaderboard('best-attack', data.bestAttack);
    }
    
    if (data.bestDefense) {
        updateLeaderboard('best-defense', data.bestDefense);
    }
}

// Actualizar estadísticas de jugadores
function updatePlayerStats() {
    const data = statsData.players;
    
    // Actualizar rankings de jugadores
    if (data.topAssists) {
        updateLeaderboard('top-assists', data.topAssists);
    }
    
    if (data.bestGoalkeepers) {
        updateLeaderboard('best-goalkeepers', data.bestGoalkeepers);
    }
}

// Actualizar estadísticas avanzadas
function updateAdvancedStats() {
    const data = statsData.advanced;
    
    // Actualizar métricas avanzadas
    updateStatValue('xg-average', data.xgAverage || '1.85');
    updateStatValue('pass-accuracy', data.passAccuracy || '82.3%');
    updateStatValue('duels-won', data.duelsWon || '54.7%');
    updateStatValue('possession', data.possession || '58.2%');
    
    // Actualizar análisis táctico
    updateStatValue('formation', data.topFormation || '4-3-3');
    updateStatValue('wing-attacks', data.wingAttacks || '67%');
    updateStatValue('high-press', data.highPress || '41%');
    updateStatValue('counter-attacks', data.counterAttacks || '29%');
}

// Configurar comparación avanzada
function setupAdvancedComparison() {
    const compareBtn = document.getElementById('advancedCompareBtn');
    
    if (compareBtn) {
        compareBtn.addEventListener('click', () => {
            const team1 = document.getElementById('advancedTeam1').value;
            const team2 = document.getElementById('advancedTeam2').value;
            
            if (team1 && team2 && team1 !== team2) {
                performAdvancedComparison(team1, team2);
            } else {
                showMessage('Por favor selecciona dos equipos diferentes', 'error');
            }
        });
    }
}

// Poblar selectores avanzados
function populateAdvancedSelectors() {
    const team1Select = document.getElementById('advancedTeam1');
    const team2Select = document.getElementById('advancedTeam2');
    
    if (!team1Select || !team2Select) return;
    
    // Limpiar opciones existentes
    team1Select.innerHTML = '<option value="">Selecciona Equipo 1</option>';
    team2Select.innerHTML = '<option value="">Selecciona Equipo 2</option>';
    
    // Obtener datos de equipos
    if (window.ultraGolApp && window.ultraGolApp.standingsData) {
        const standings = window.ultraGolApp.standingsData();
        
        standings.forEach(team => {
            const option1 = document.createElement('option');
            option1.value = team.name;
            option1.textContent = team.name;
            team1Select.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = team.name;
            option2.textContent = team.name;
            team2Select.appendChild(option2);
        });
    }
}

// Realizar comparación avanzada
function performAdvancedComparison(team1, team2) {
    const resultsContainer = document.getElementById('advancedComparisonResults');
    if (!resultsContainer) return;
    
    // Mostrar loader
    resultsContainer.innerHTML = `
        <div class="comparison-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Analizando equipos...</p>
        </div>
    `;
    
    // Simular análisis
    setTimeout(() => {
        const comparison = generateAdvancedComparison(team1, team2);
        displayAdvancedComparison(comparison, resultsContainer);
    }, 1500);
}

// Generar comparación avanzada
function generateAdvancedComparison(team1, team2) {
    // Obtener datos de equipos
    const standings = window.ultraGolApp ? window.ultraGolApp.standingsData() : [];
    const team1Data = standings.find(t => t.name === team1);
    const team2Data = standings.find(t => t.name === team2);
    
    return {
        team1: {
            name: team1,
            data: team1Data,
            metrics: generateTeamMetrics(team1Data)
        },
        team2: {
            name: team2,
            data: team2Data,
            metrics: generateTeamMetrics(team2Data)
        }
    };
}

// Generar métricas de equipo
function generateTeamMetrics(teamData) {
    if (!teamData) return {};
    
    return {
        attackEfficiency: Math.round((teamData.wins / teamData.played) * 100),
        defenseRating: Math.round(((teamData.played - teamData.losses) / teamData.played) * 100),
        consistency: Math.round((teamData.wins + teamData.draws) / teamData.played * 100),
        homeForm: Math.round(Math.random() * 30 + 70), // Simulated
        awayForm: Math.round(Math.random() * 30 + 60), // Simulated
        recentForm: Math.round(Math.random() * 40 + 60) // Simulated
    };
}

// Mostrar comparación avanzada
function displayAdvancedComparison(comparison, container) {
    const { team1, team2 } = comparison;
    
    container.innerHTML = `
        <div class="advanced-comparison-result">
            <div class="comparison-header">
                <h4>Análisis Comparativo Avanzado</h4>
                <button class="close-advanced-comparison" onclick="this.parentElement.parentElement.innerHTML = ''">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="teams-advanced-comparison">
                <div class="team-advanced-side">
                    <h5>${team1.name}</h5>
                    <div class="advanced-metrics">
                        <div class="metric-item">
                            <span class="metric-label">Eficiencia Atacante</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${team1.metrics.attackEfficiency}%"></div>
                            </div>
                            <span class="metric-value">${team1.metrics.attackEfficiency}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Rating Defensivo</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${team1.metrics.defenseRating}%"></div>
                            </div>
                            <span class="metric-value">${team1.metrics.defenseRating}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Consistencia</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${team1.metrics.consistency}%"></div>
                            </div>
                            <span class="metric-value">${team1.metrics.consistency}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Forma como Local</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${team1.metrics.homeForm}%"></div>
                            </div>
                            <span class="metric-value">${team1.metrics.homeForm}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Forma como Visitante</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${team1.metrics.awayForm}%"></div>
                            </div>
                            <span class="metric-value">${team1.metrics.awayForm}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Forma Reciente</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${team1.metrics.recentForm}%"></div>
                            </div>
                            <span class="metric-value">${team1.metrics.recentForm}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="vs-advanced">
                    <div class="vs-circle-advanced">VS</div>
                    <div class="overall-comparison">
                        ${generateOverallComparison(team1.metrics, team2.metrics)}
                    </div>
                </div>
                
                <div class="team-advanced-side">
                    <h5>${team2.name}</h5>
                    <div class="advanced-metrics">
                        <div class="metric-item">
                            <span class="metric-label">Eficiencia Atacante</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${team2.metrics.attackEfficiency}%"></div>
                            </div>
                            <span class="metric-value">${team2.metrics.attackEfficiency}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Rating Defensivo</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${team2.metrics.defenseRating}%"></div>
                            </div>
                            <span class="metric-value">${team2.metrics.defenseRating}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Consistencia</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${team2.metrics.consistency}%"></div>
                            </div>
                            <span class="metric-value">${team2.metrics.consistency}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Forma como Local</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${team2.metrics.homeForm}%"></div>
                            </div>
                            <span class="metric-value">${team2.metrics.homeForm}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Forma como Visitante</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${team2.metrics.awayForm}%"></div>
                            </div>
                            <span class="metric-value">${team2.metrics.awayForm}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Forma Reciente</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${team2.metrics.recentForm}%"></div>
                            </div>
                            <span class="metric-value">${team2.metrics.recentForm}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar estilos para la comparación avanzada
    if (!document.getElementById('advanced-comparison-styles')) {
        addAdvancedComparisonStyles();
    }
}

// Generar comparación general
function generateOverallComparison(metrics1, metrics2) {
    const avg1 = Object.values(metrics1).reduce((a, b) => a + b, 0) / Object.values(metrics1).length;
    const avg2 = Object.values(metrics2).reduce((a, b) => a + b, 0) / Object.values(metrics2).length;
    
    if (avg1 > avg2) {
        return `<p><i class="fas fa-trophy text-success"></i> Ventaja general: ${Math.round(avg1 - avg2)}%</p>`;
    } else if (avg2 > avg1) {
        return `<p><i class="fas fa-trophy text-success"></i> Ventaja general: ${Math.round(avg2 - avg1)}%</p>`;
    } else {
        return '<p><i class="fas fa-equals"></i> Equipos muy parejos</p>';
    }
}

// Agregar estilos para comparación avanzada
function addAdvancedComparisonStyles() {
    const style = document.createElement('style');
    style.id = 'advanced-comparison-styles';
    style.textContent = `
        .advanced-comparison-result {
            background: linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%);
            border-radius: 15px;
            padding: 25px;
            margin-top: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 2px solid #ff9933;
            animation: slideDown 0.3s ease-out;
        }
        
        .comparison-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #ff9933;
        }
        
        .comparison-header h4 {
            color: #ff9933;
            font-size: 1.3rem;
            font-weight: 700;
        }
        
        .close-advanced-comparison {
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .teams-advanced-comparison {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 30px;
            align-items: start;
        }
        
        .team-advanced-side h5 {
            text-align: center;
            color: #333;
            margin-bottom: 20px;
            font-size: 1.2rem;
        }
        
        .advanced-metrics {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .metric-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .metric-label {
            font-size: 0.9rem;
            color: #666;
            font-weight: 500;
        }
        
        .metric-bar {
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        }
        
        .metric-fill {
            height: 100%;
            background: linear-gradient(45deg, #ff9933, #ffaa44);
            border-radius: 4px;
            transition: width 1s ease-out;
        }
        
        .metric-value {
            font-weight: 700;
            color: #ff9933;
            font-size: 0.9rem;
            text-align: right;
        }
        
        .vs-advanced {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }
        
        .vs-circle-advanced {
            width: 60px;
            height: 60px;
            background: linear-gradient(45deg, #ff9933, #ffaa44);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.2rem;
        }
        
        .overall-comparison {
            font-size: 0.9rem;
            color: #666;
            text-align: center;
        }
        
        .comparison-loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .comparison-loading i {
            font-size: 2rem;
            color: #ff9933;
            margin-bottom: 10px;
        }
        
        @media (max-width: 768px) {
            .teams-advanced-comparison {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .vs-advanced {
                order: -1;
            }
        }
    `;
    document.head.appendChild(style);
}

// Funciones de utilidad
function updateStatValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function updateLeaderboard(id, data) {
    const element = document.getElementById(id);
    if (element && data) {
        // Implementar actualización de leaderboard
        console.log('Updating leaderboard:', id, data);
    }
}

function animateCounters(selector) {
    const counters = document.querySelectorAll(selector);
    
    counters.forEach(counter => {
        const value = counter.textContent;
        const numericValue = parseFloat(value);
        
        if (!isNaN(numericValue)) {
            let current = 0;
            const increment = numericValue / 30;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= numericValue) {
                    counter.textContent = value;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current);
                }
            }, 50);
        }
    });
}

function animateStatsOnLoad() {
    // Animar widgets al cargar
    const widgets = document.querySelectorAll('.stat-widget');
    widgets.forEach((widget, index) => {
        widget.style.opacity = '0';
        widget.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            widget.style.transition = 'all 0.5s ease-out';
            widget.style.opacity = '1';
            widget.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        background: ${type === 'error' ? '#dc3545' : '#28a745'};
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}

// Calcular estadísticas (funciones de fallback)
function calculateGeneralStats(standings, fixtures) {
    return {
        avgGoals: '2.8',
        highScoring: '68%',
        avgCards: '4.2'
    };
}

function calculateTeamStats(standings, teams) {
    return {
        bestAttack: [],
        bestDefense: []
    };
}

function calculatePlayerStats(standings, teams, goleadores = []) {
    return {
        topScorers: goleadores,
        topAssists: [],
        bestGoalkeepers: []
    };
}

// Cargar y mostrar goleadores desde API
async function loadTopScorers() {
    const container = document.getElementById('topScorers');
    if (!container) return;

    try {
        // Mostrar loading
        container.innerHTML = `
            <div class="leader-item">
                <div class="leader-info" style="justify-content: center; width: 100%;">
                    <div class="leader-name" style="text-align: center;">
                        <i class="fas fa-spinner fa-spin"></i> Cargando goleadores...
                    </div>
                </div>
            </div>
        `;

        // Obtener goleadores de la API
        const goleadores = await ultraGolAPI.getGoleadores();
        
        if (!goleadores || goleadores.length === 0) {
            container.innerHTML = `
                <div class="leader-item">
                    <div class="leader-info" style="justify-content: center; width: 100%;">
                        <div class="leader-name" style="text-align: center; color: #999;">
                            <i class="fas fa-info-circle"></i> No hay datos de goleadores disponibles
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // Mostrar top 10 goleadores
        const topScorers = goleadores.slice(0, 10);
        
        container.innerHTML = topScorers.map((scorer, index) => `
            <div class="leader-item" style="animation: fadeInUp ${index * 0.1}s ease-out;">
                <div class="leader-rank">${index + 1}</div>
                <div class="leader-info">
                    <div class="leader-name">${scorer.jugador}</div>
                    <div class="leader-team">${scorer.equipo}</div>
                </div>
                <div class="leader-stat">${scorer.goles}</div>
            </div>
        `).join('');

        console.log('✅ Top goleadores mostrados:', topScorers.length);
    } catch (error) {
        console.error('❌ Error cargando goleadores:', error);
        container.innerHTML = `
            <div class="leader-item">
                <div class="leader-info" style="justify-content: center; width: 100%;">
                    <div class="leader-name" style="text-align: center; color: #dc3545;">
                        <i class="fas fa-exclamation-triangle"></i> Error al cargar goleadores
                    </div>
                </div>
            </div>
        `;
    }
}

function calculateAdvancedStats(standings, fixtures) {
    return {
        xgAverage: '1.85',
        passAccuracy: '82.3%',
        duelsWon: '54.7%',
        possession: '58.2%',
        topFormation: '4-3-3',
        wingAttacks: '67%',
        highPress: '41%',
        counterAttacks: '29%'
    };
}

function generateFallbackStats() {
    return {
        general: calculateGeneralStats([], []),
        teams: calculateTeamStats([], []),
        players: calculatePlayerStats([], []),
        advanced: calculateAdvancedStats([], [])
    };
}

// Exportar funciones
window.statsApp = {
    switchTab,
    performAdvancedComparison,
    animateCounters
};