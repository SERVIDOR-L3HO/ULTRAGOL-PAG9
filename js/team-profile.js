// Team Profile page JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeTeamProfile();
});

let currentTeam = null;
let teamMatches = [];
let currentSection = 'overview';

function initializeTeamProfile() {
    setupTeamProfileEventListeners();
    loadTeamProfile();
}

function setupTeamProfileEventListeners() {
    // Team navigation
    document.querySelectorAll('.team-nav-link').forEach(link => {
        link.addEventListener('click', handleSectionNavigation);
    });

    // Match tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleMatchTabClick);
    });

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
}

async function loadTeamProfile() {
    try {
        // Get team ID from URL parameters or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const teamId = urlParams.get('team') || localStorage.getItem('selectedTeam');
        
        if (!teamId) {
            showErrorMessage('No se ha seleccionado ningún equipo');
            setTimeout(() => {
                window.location.href = 'teams.html';
            }, 2000);
            return;
        }

        // Load team data
        const teams = await loadTeamsData();
        currentTeam = teams.find(t => t.id === teamId);
        
        if (!currentTeam) {
            showErrorMessage('Equipo no encontrado');
            setTimeout(() => {
                window.location.href = 'teams.html';
            }, 2000);
            return;
        }

        // Load additional data
        const [standings, fixtures] = await Promise.all([
            loadStandingsData(),
            loadFixturesData()
        ]);

        // Filter matches for this team
        teamMatches = fixtures.filter(match => 
            match.homeTeam === currentTeam.name || match.awayTeam === currentTeam.name
        );

        // Apply team theme
        applyTeamTheme();

        // Render team profile
        renderTeamHeader();
        renderOverviewSection();
        renderStatisticsSection();
        renderMatchesSection();
        renderHistorySection();

    } catch (error) {
        console.error('Error loading team profile:', error);
        showErrorMessage('Error al cargar el perfil del equipo');
    }
}

async function loadTeamsData() {
    if (window.ligaMXApp && window.ligaMXApp.teamsData().length > 0) {
        return window.ligaMXApp.teamsData();
    }
    const response = await fetch('data/teams.json');
    return await response.json();
}

async function loadStandingsData() {
    if (window.ligaMXApp && window.ligaMXApp.standingsData().length > 0) {
        return window.ligaMXApp.standingsData();
    }
    const response = await fetch('data/standings.json');
    return await response.json();
}

async function loadFixturesData() {
    if (window.ligaMXApp && window.ligaMXApp.fixturesData().length > 0) {
        return window.ligaMXApp.fixturesData();
    }
    const response = await fetch('data/fixtures.json');
    return await response.json();
}

function applyTeamTheme() {
    if (!currentTeam) return;

    const root = document.documentElement;
    root.style.setProperty('--team-primary', currentTeam.colors.primary);
    root.style.setProperty('--team-secondary', currentTeam.colors.secondary);
    
    // Update body class
    document.body.className = document.body.className.replace(/team-\w+/g, '');
    document.body.classList.add(`team-${currentTeam.id}`);

    // Update page title
    document.title = `Liga MX - ${currentTeam.name}`;
}

function renderTeamHeader() {
    if (!currentTeam) return;

    const teamName = document.getElementById('teamName');
    const teamNickname = document.getElementById('teamNickname');
    const teamFounded = document.getElementById('teamFounded');
    const teamCity = document.getElementById('teamCity');
    const teamStadium = document.getElementById('teamStadium');
    const teamLogoLarge = document.getElementById('teamLogoLarge');

    if (teamName) teamName.textContent = currentTeam.name;
    if (teamNickname) teamNickname.textContent = `"${currentTeam.nickname}"`;
    if (teamFounded) teamFounded.textContent = `Fundado: ${currentTeam.founded}`;
    if (teamCity) teamCity.textContent = `Ciudad: ${currentTeam.city}, ${currentTeam.state}`;
    if (teamStadium) teamStadium.textContent = `Estadio: ${currentTeam.stadium}`;
    
    if (teamLogoLarge) {
        teamLogoLarge.innerHTML = `
            <div style="width: 100%; height: 100%; background: ${currentTeam.colors.primary}; color: ${currentTeam.colors.secondary}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 3rem; border-radius: 50%;">
                ${currentTeam.shortName || currentTeam.name.substring(0, 3).toUpperCase()}
            </div>
        `;
    }
}

function renderOverviewSection() {
    if (!currentTeam) return;

    const standings = window.ligaMXApp ? window.ligaMXApp.standingsData() : [];
    const teamStats = standings.find(t => t.id === currentTeam.id);

    // Current position
    const currentPosition = document.getElementById('currentPosition');
    const positionStats = document.getElementById('positionStats');
    
    if (currentPosition && teamStats) {
        currentPosition.innerHTML = `
            <span class="position-number">${teamStats.position}</span>
            <span class="position-suffix">°</span>
        `;
    }

    if (positionStats && teamStats) {
        positionStats.innerHTML = `
            <div class="position-stat">
                <div class="position-stat-value">${teamStats.points}</div>
                <div class="position-stat-label">PTS</div>
            </div>
            <div class="position-stat">
                <div class="position-stat-value">${teamStats.played}</div>
                <div class="position-stat-label">PJ</div>
            </div>
            <div class="position-stat">
                <div class="position-stat-value">${teamStats.wins}</div>
                <div class="position-stat-label">G</div>
            </div>
        `;
    }

    // Recent form
    const recentForm = document.getElementById('recentForm');
    if (recentForm && teamMatches.length > 0) {
        const recentMatches = teamMatches
            .filter(m => m.status === 'completed')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        recentForm.innerHTML = recentMatches.map(match => {
            const isHome = match.homeTeam === currentTeam.name;
            const teamScore = isHome ? match.homeScore : match.awayScore;
            const opponentScore = isHome ? match.awayScore : match.homeScore;
            
            let result = 'draw';
            if (teamScore > opponentScore) result = 'win';
            else if (teamScore < opponentScore) result = 'loss';

            const letter = result === 'win' ? 'G' : result === 'loss' ? 'P' : 'E';
            
            return `<div class="form-result ${result}" title="${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}">${letter}</div>`;
        }).join('');
    }

    // Top scorer
    const topScorer = document.getElementById('topScorer');
    if (topScorer) {
        topScorer.innerHTML = `
            <div class="player-info">
                <div class="player-avatar"></div>
                <div class="player-details">
                    <div class="player-name">${currentTeam.topScorer || 'N/A'}</div>
                    <div class="player-goals">${currentTeam.topScorerGoals || 0} goles</div>
                </div>
            </div>
        `;
    }

    // Stadium info
    const stadiumInfo = document.getElementById('stadiumInfo');
    if (stadiumInfo) {
        stadiumInfo.innerHTML = `
            <div class="stadium-details">
                <h4>${currentTeam.stadium}</h4>
                <p><i class="fas fa-users"></i> Capacidad: ${currentTeam.capacity} espectadores</p>
                <p><i class="fas fa-map-marker-alt"></i> ${currentTeam.city}, ${currentTeam.state}</p>
                <p><i class="fas fa-calendar"></i> Inaugurado: ${currentTeam.stadiumYear || 'N/A'}</p>
            </div>
        `;
    }
}

function renderStatisticsSection() {
    if (!currentTeam) return;

    const standings = window.ligaMXApp ? window.ligaMXApp.standingsData() : [];
    const teamStats = standings.find(t => t.id === currentTeam.id);
    
    if (!teamStats) return;

    // Attack stats
    const attackStats = document.getElementById('attackStats');
    if (attackStats) {
        attackStats.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">Goles a Favor</div>
                <div class="stat-value">${teamStats.goalsFor}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Promedio por Partido</div>
                <div class="stat-value">${(teamStats.goalsFor / teamStats.played).toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Mejor Racha Goleadora</div>
                <div class="stat-value">${teamStats.bestScoringStreak || 'N/A'}</div>
            </div>
        `;
    }

    // Defense stats
    const defenseStats = document.getElementById('defenseStats');
    if (defenseStats) {
        defenseStats.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">Goles en Contra</div>
                <div class="stat-value">${teamStats.goalsAgainst}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Promedio por Partido</div>
                <div class="stat-value">${(teamStats.goalsAgainst / teamStats.played).toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Partidos sin Conceder</div>
                <div class="stat-value">${teamStats.cleanSheets || 0}</div>
            </div>
        `;
    }

    // General stats
    const generalStats = document.getElementById('generalStats');
    if (generalStats) {
        const winPercentage = ((teamStats.wins / teamStats.played) * 100).toFixed(1);
        const goalDifference = teamStats.goalsFor - teamStats.goalsAgainst;
        
        generalStats.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">% de Victorias</div>
                <div class="stat-value">${winPercentage}%</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Diferencia de Goles</div>
                <div class="stat-value ${goalDifference >= 0 ? 'positive' : 'negative'}">
                    ${goalDifference > 0 ? '+' : ''}${goalDifference}
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Puntos por Partido</div>
                <div class="stat-value">${(teamStats.points / teamStats.played).toFixed(2)}</div>
            </div>
        `;
    }
}

function renderMatchesSection() {
    if (!currentTeam || !teamMatches.length) return;

    // Recent matches
    renderMatchTab('recent', teamMatches.filter(m => m.status === 'completed'));
    
    // Upcoming matches
    renderMatchTab('upcoming', teamMatches.filter(m => m.status === 'scheduled'));
    
    // All matches
    renderMatchTab('all', teamMatches);
}

function renderMatchTab(tabId, matches) {
    const tabContent = document.getElementById(`${tabId}Matches`);
    if (!tabContent) return;

    if (matches.length === 0) {
        tabContent.innerHTML = `
            <div class="no-matches">
                <i class="fas fa-calendar-times"></i>
                <p>No hay partidos disponibles</p>
            </div>
        `;
        return;
    }

    // Sort matches by date
    const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));

    tabContent.innerHTML = sortedMatches.map(match => {
        const isHome = match.homeTeam === currentTeam.name;
        const opponent = isHome ? match.awayTeam : match.homeTeam;
        
        return `
            <div class="match-item">
                <div class="match-date">
                    ${formatMatchDate(match.date)}
                </div>
                <div class="match-info">
                    <div class="match-teams">
                        <span class="team ${isHome ? 'home' : 'away'}">${currentTeam.name}</span>
                        <span class="vs">vs</span>
                        <span class="team ${!isHome ? 'home' : 'away'}">${opponent}</span>
                    </div>
                    ${match.status === 'completed' ? `
                        <div class="match-score">
                            ${match.homeScore} - ${match.awayScore}
                        </div>
                    ` : `
                        <div class="match-time">
                            ${formatMatchTime(match.date)}
                        </div>
                    `}
                </div>
                <div class="match-venue">
                    <i class="fas fa-map-marker-alt"></i>
                    ${isHome ? currentTeam.stadium : `vs ${opponent}`}
                </div>
            </div>
        `;
    }).join('');
}

function renderHistorySection() {
    if (!currentTeam) return;

    const timeline = document.getElementById('teamTimeline');
    const achievements = document.getElementById('teamAchievements');

    if (timeline) {
        const historyEvents = [
            { year: currentTeam.founded, event: `Fundación del club en ${currentTeam.city}` },
            { year: currentTeam.firstTitle || 'N/A', event: 'Primer título de liga' },
            { year: currentTeam.stadiumYear || 'N/A', event: `Inauguración del ${currentTeam.stadium}` }
        ].filter(event => event.year !== 'N/A');

        timeline.innerHTML = historyEvents.map(event => `
            <div class="timeline-item">
                <div class="timeline-year">${event.year}</div>
                <div class="timeline-event">${event.event}</div>
            </div>
        `).join('');
    }

    if (achievements) {
        achievements.innerHTML = `
            <div class="achievements-grid">
                <div class="achievement-item">
                    <div class="achievement-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="achievement-details">
                        <div class="achievement-count">${currentTeam.titles || 0}</div>
                        <div class="achievement-label">Títulos de Liga</div>
                    </div>
                </div>
                <div class="achievement-item">
                    <div class="achievement-icon">
                        <i class="fas fa-medal"></i>
                    </div>
                    <div class="achievement-details">
                        <div class="achievement-count">${currentTeam.cups || 0}</div>
                        <div class="achievement-label">Copas</div>
                    </div>
                </div>
                <div class="achievement-item">
                    <div class="achievement-icon">
                        <i class="fas fa-globe-americas"></i>
                    </div>
                    <div class="achievement-details">
                        <div class="achievement-count">${currentTeam.international || 0}</div>
                        <div class="achievement-label">Títulos Internacionales</div>
                    </div>
                </div>
            </div>
        `;
    }
}

function handleSectionNavigation(event) {
    event.preventDefault();
    
    const targetSection = event.target.getAttribute('data-section');
    if (!targetSection) return;

    // Update active nav link
    document.querySelectorAll('.team-nav-link').forEach(link => 
        link.classList.remove('active')
    );
    event.target.classList.add('active');

    // Show target section
    document.querySelectorAll('.team-section').forEach(section => 
        section.classList.remove('active')
    );
    
    const targetElement = document.getElementById(targetSection);
    if (targetElement) {
        targetElement.classList.add('active');
        currentSection = targetSection;
    }
}

function handleMatchTabClick(event) {
    const targetTab = event.target.getAttribute('data-tab');
    if (!targetTab) return;

    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => 
        btn.classList.remove('active')
    );
    event.target.classList.add('active');

    // Show target tab content
    document.querySelectorAll('.tab-content').forEach(content => 
        content.classList.remove('active')
    );
    
    const targetContent = document.getElementById(`${targetTab}Matches`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerOffset = 140; // Account for fixed headers
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

function formatMatchDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatMatchTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Utility functions
function showErrorMessage(message) {
    if (window.ligaMXApp && window.ligaMXApp.showErrorMessage) {
        window.ligaMXApp.showErrorMessage(message);
    } else {
        alert(message);
    }
}

// Add team profile specific styles
function addTeamProfileStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid #f0f0f0;
        }

        .stat-item:last-child {
            border-bottom: none;
        }

        .stat-label {
            color: #666;
            font-weight: 500;
        }

        .stat-value {
            font-weight: 700;
            color: #333;
            font-size: 1.1rem;
        }

        .stat-value.positive {
            color: #28a745;
        }

        .stat-value.negative {
            color: #dc3545;
        }

        .match-item {
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid var(--team-primary);
            transition: all 0.3s ease;
        }

        .match-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }

        .match-date {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 0.5rem;
        }

        .match-teams {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.5rem;
        }

        .match-teams .team.home {
            font-weight: 700;
            color: var(--team-primary);
        }

        .vs {
            color: #666;
            font-weight: 500;
        }

        .match-score {
            font-size: 1.5rem;
            font-weight: 700;
            color: #333;
        }

        .match-time {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--team-primary);
        }

        .match-venue {
            font-size: 0.9rem;
            color: #666;
        }

        .no-matches {
            text-align: center;
            padding: 3rem;
            color: #666;
        }

        .no-matches i {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: #ddd;
        }

        .timeline-item {
            display: flex;
            gap: 2rem;
            padding: 1rem 0;
            border-bottom: 1px solid #f0f0f0;
        }

        .timeline-year {
            font-weight: 700;
            color: var(--team-primary);
            min-width: 80px;
        }

        .timeline-event {
            color: #333;
        }

        .achievements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
        }

        .achievement-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .achievement-icon {
            width: 50px;
            height: 50px;
            background: var(--team-primary);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }

        .achievement-count {
            font-size: 2rem;
            font-weight: 700;
            color: #333;
        }

        .achievement-label {
            color: #666;
            font-size: 0.9rem;
        }

        .player-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .player-avatar {
            width: 50px;
            height: 50px;
            background: #f0f0f0;
            border-radius: 50%;
        }

        .player-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 0.25rem;
        }

        .player-goals {
            color: #666;
            font-size: 0.9rem;
        }

        .stadium-details h4 {
            color: var(--team-primary);
            margin-bottom: 1rem;
        }

        .stadium-details p {
            margin-bottom: 0.5rem;
            color: #666;
        }

        .stadium-details i {
            margin-right: 0.5rem;
            color: var(--team-primary);
        }

        @media (max-width: 768px) {
            .match-teams {
                flex-direction: column;
                gap: 0.5rem;
                text-align: center;
            }

            .timeline-item {
                flex-direction: column;
                gap: 0.5rem;
            }

            .achievements-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize styles
addTeamProfileStyles();
