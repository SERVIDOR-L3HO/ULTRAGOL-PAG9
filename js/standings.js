// Standings page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeStandings();
});

let currentFilter = 'general';

function initializeStandings() {
    setupStandingsEventListeners();
    loadStandingsTable();
    loadTeamSelectors();
    updateLastUpdateTime();
}

function setupStandingsEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update filter and reload table
            currentFilter = this.getAttribute('data-filter');
            loadStandingsTable();
        });
    });

    // Team comparison selectors
    const team1Select = document.getElementById('team1Select');
    const team2Select = document.getElementById('team2Select');
    
    if (team1Select && team2Select) {
        team1Select.addEventListener('change', updateComparison);
        team2Select.addEventListener('change', updateComparison);
    }
}

async function loadStandingsTable() {
    const tableBody = document.getElementById('standingsBody');
    if (!tableBody) return;

    showLoading(tableBody);

    try {
        const standings = await getStandingsData();
        renderStandingsTable(standings);
    } catch (error) {
        console.error('Error loading standings:', error);
        showErrorMessage('Error al cargar la tabla de posiciones');
    }
}

async function getStandingsData() {
    // If data is already loaded, use it
    if (window.ligaMXApp && window.ligaMXApp.standingsData().length > 0) {
        return filterStandingsByType(window.ligaMXApp.standingsData());
    }

    // Otherwise, load from JSON
    try {
        const response = await fetch('data/standings.json');
        const data = await response.json();
        return filterStandingsByType(data);
    } catch (error) {
        throw new Error('Failed to load standings data');
    }
}

function filterStandingsByType(standings) {
    // For now, return general standings
    // In a real app, you would filter by home/away if available
    switch (currentFilter) {
        case 'home':
            return standings.map(team => ({
                ...team,
                played: team.homeGames || Math.floor(team.played / 2),
                wins: team.homeWins || Math.floor(team.wins / 2),
                draws: team.homeDraws || Math.floor(team.draws / 2),
                losses: team.homeLosses || Math.floor(team.losses / 2),
                goalsFor: team.homeGoalsFor || Math.floor(team.goalsFor / 2),
                goalsAgainst: team.homeGoalsAgainst || Math.floor(team.goalsAgainst / 2),
                points: (team.homeWins || Math.floor(team.wins / 2)) * 3 + (team.homeDraws || Math.floor(team.draws / 2))
            }));
        case 'away':
            return standings.map(team => ({
                ...team,
                played: team.awayGames || Math.ceil(team.played / 2),
                wins: team.awayWins || Math.ceil(team.wins / 2),
                draws: team.awayDraws || Math.ceil(team.draws / 2),
                losses: team.awayLosses || Math.ceil(team.losses / 2),
                goalsFor: team.awayGoalsFor || Math.ceil(team.goalsFor / 2),
                goalsAgainst: team.awayGoalsAgainst || Math.ceil(team.goalsAgainst / 2),
                points: (team.awayWins || Math.ceil(team.wins / 2)) * 3 + (team.awayDraws || Math.ceil(team.draws / 2))
            }));
        default:
            return standings;
    }
}

function renderStandingsTable(standings) {
    const tableBody = document.getElementById('standingsBody');
    if (!tableBody) return;

    tableBody.innerHTML = standings.map((team, index) => {
        const positionClass = getPositionClass(index + 1);
        const goalDifference = team.goalsFor - team.goalsAgainst;
        const goalDiffClass = goalDifference > 0 ? 'positive' : goalDifference < 0 ? 'negative' : 'neutral';

        return `
            <tr class="team-row ${positionClass} stagger-item" data-team-id="${team.id}" style="animation-delay: ${index * 0.05}s">
                <td class="position">
                    <span class="position-number">${index + 1}</span>
                    <span class="position-indicator"></span>
                </td>
                <td class="team-info">
                    <div class="team-logo-small"></div>
                    <span class="team-name">${team.name}</span>
                </td>
                <td class="games">${team.played}</td>
                <td class="wins">${team.wins}</td>
                <td class="draws">${team.draws}</td>
                <td class="losses">${team.losses}</td>
                <td class="goals-for">${team.goalsFor}</td>
                <td class="goals-against">${team.goalsAgainst}</td>
                <td class="goal-difference ${goalDiffClass}">
                    ${goalDifference > 0 ? '+' : ''}${goalDifference}
                </td>
                <td class="points">
                    <span class="points-number">${team.points}</span>
                </td>
            </tr>
        `;
    }).join('');

    // Add click handlers for team rows
    document.querySelectorAll('.team-row').forEach(row => {
        row.addEventListener('click', function() {
            const teamId = this.getAttribute('data-team-id');
            if (teamId) {
                localStorage.setItem('selectedTeam', teamId);
                window.location.href = 'team-profile.html';
            }
        });
    });

    // Add CSS classes for animations
    setTimeout(() => {
        document.querySelectorAll('.stagger-item').forEach(item => {
            item.classList.add('revealed');
        });
    }, 100);
}

function getPositionClass(position) {
    if (position <= 4) {
        return 'liguilla';
    } else if (position <= 12) {
        return 'play-in';
    } else {
        return 'descenso';
    }
}

async function loadTeamSelectors() {
    const team1Select = document.getElementById('team1Select');
    const team2Select = document.getElementById('team2Select');
    
    if (!team1Select || !team2Select) return;

    try {
        const teams = window.ligaMXApp ? window.ligaMXApp.teamsData() : await loadTeamsFromJSON();
        
        const options = teams.map(team => 
            `<option value="${team.id}">${team.name}</option>`
        ).join('');

        team1Select.innerHTML = '<option value="">Seleccionar equipo 1</option>' + options;
        team2Select.innerHTML = '<option value="">Seleccionar equipo 2</option>' + options;
    } catch (error) {
        console.error('Error loading teams for comparison:', error);
    }
}

async function loadTeamsFromJSON() {
    const response = await fetch('data/teams.json');
    return await response.json();
}

function updateComparison() {
    const team1Id = document.getElementById('team1Select').value;
    const team2Id = document.getElementById('team2Select').value;
    const comparisonResult = document.getElementById('comparisonResult');

    if (!team1Id || !team2Id || !comparisonResult) return;

    if (team1Id === team2Id) {
        comparisonResult.innerHTML = `
            <div class="comparison-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Por favor selecciona dos equipos diferentes</p>
            </div>
        `;
        return;
    }

    const standings = window.ligaMXApp ? window.ligaMXApp.standingsData() : [];
    const team1 = standings.find(t => t.id === team1Id);
    const team2 = standings.find(t => t.id === team2Id);

    if (!team1 || !team2) {
        comparisonResult.innerHTML = `
            <div class="comparison-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar los datos de los equipos</p>
            </div>
        `;
        return;
    }

    renderComparison(team1, team2);
}

function renderComparison(team1, team2) {
    const comparisonResult = document.getElementById('comparisonResult');
    
    const stats = [
        { label: 'Posición', key: 'position', suffix: '°' },
        { label: 'Puntos', key: 'points', suffix: '' },
        { label: 'Partidos Jugados', key: 'played', suffix: '' },
        { label: 'Victorias', key: 'wins', suffix: '' },
        { label: 'Empates', key: 'draws', suffix: '' },
        { label: 'Derrotas', key: 'losses', suffix: '' },
        { label: 'Goles a Favor', key: 'goalsFor', suffix: '' },
        { label: 'Goles en Contra', key: 'goalsAgainst', suffix: '' },
        { label: 'Diferencia de Goles', key: 'goalDifference', suffix: '' }
    ];

    // Calculate goal difference
    team1.goalDifference = team1.goalsFor - team1.goalsAgainst;
    team2.goalDifference = team2.goalsFor - team2.goalsAgainst;

    comparisonResult.innerHTML = `
        <div class="comparison-container fade-in">
            <div class="comparison-header">
                <div class="comparison-team">
                    <div class="team-logo-comparison"></div>
                    <h3>${team1.name}</h3>
                </div>
                <div class="vs-divider">VS</div>
                <div class="comparison-team">
                    <div class="team-logo-comparison"></div>
                    <h3>${team2.name}</h3>
                </div>
            </div>
            <div class="comparison-stats">
                ${stats.map(stat => {
                    const value1 = team1[stat.key];
                    const value2 = team2[stat.key];
                    const better1 = stat.key === 'position' || stat.key === 'losses' || stat.key === 'goalsAgainst' 
                        ? value1 < value2 : value1 > value2;
                    
                    return `
                        <div class="stat-comparison">
                            <div class="stat-value ${better1 ? 'better' : ''}">${value1}${stat.suffix}</div>
                            <div class="stat-label">${stat.label}</div>
                            <div class="stat-value ${!better1 ? 'better' : ''}">${value2}${stat.suffix}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function updateLastUpdateTime() {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        const now = new Date();
        lastUpdateElement.textContent = now.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Add styles for the standings table
function addStandingsStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .standings-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .standings-table th {
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
            padding: 1rem 0.75rem;
            text-align: center;
            font-weight: 600;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .team-row {
            border-bottom: 1px solid #f0f0f0;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .team-row:hover {
            background: #f8f9fa;
            transform: scale(1.01);
        }

        .team-row td {
            padding: 1rem 0.75rem;
            text-align: center;
            vertical-align: middle;
        }

        .position {
            position: relative;
            font-weight: 700;
            font-size: 1.1rem;
        }

        .position-indicator {
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 100%;
            border-radius: 2px;
        }

        .liguilla .position-indicator {
            background: #28a745;
        }

        .play-in .position-indicator {
            background: #ffc107;
        }

        .descenso .position-indicator {
            background: #dc3545;
        }

        .team-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-align: left !important;
        }

        .team-logo-small {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #f0f0f0;
        }

        .team-name {
            font-weight: 600;
            color: #333;
        }

        .points {
            font-weight: 700;
            font-size: 1.2rem;
            color: #1e3c72;
        }

        .goal-difference.positive {
            color: #28a745;
            font-weight: 600;
        }

        .goal-difference.negative {
            color: #dc3545;
            font-weight: 600;
        }

        .goal-difference.neutral {
            color: #6c757d;
        }

        .table-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .table-filters {
            display: flex;
            gap: 0.5rem;
        }

        .last-update {
            color: #666;
            font-size: 0.9rem;
        }

        .standings-legend {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-top: 2rem;
            flex-wrap: wrap;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 3px;
        }

        .legend-color.liguilla {
            background: #28a745;
        }

        .legend-color.play-in {
            background: #ffc107;
        }

        .legend-color.descenso {
            background: #dc3545;
        }

        .legend-text {
            font-size: 0.9rem;
            color: #666;
        }

        .comparison-container {
            background: white;
            border-radius: 15px;
            padding: 2rem;
            margin-top: 2rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .comparison-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .comparison-team {
            text-align: center;
            flex: 1;
        }

        .team-logo-comparison {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #f0f0f0;
            margin: 0 auto 1rem;
        }

        .vs-divider {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e3c72;
            margin: 0 2rem;
        }

        .comparison-stats {
            display: grid;
            gap: 1rem;
        }

        .stat-comparison {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 0;
            border-bottom: 1px solid #f0f0f0;
        }

        .stat-comparison:last-child {
            border-bottom: none;
        }

        .stat-value {
            font-size: 1.2rem;
            font-weight: 600;
            text-align: center;
        }

        .stat-value.better {
            color: #28a745;
            background: rgba(40, 167, 69, 0.1);
            padding: 0.25rem 0.5rem;
            border-radius: 5px;
        }

        .stat-label {
            font-weight: 500;
            color: #666;
            text-align: center;
        }

        .comparison-error {
            text-align: center;
            padding: 2rem;
            color: #666;
        }

        .comparison-error i {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #ffc107;
        }

        @media (max-width: 768px) {
            .standings-table {
                font-size: 0.8rem;
            }

            .standings-table th,
            .standings-table td {
                padding: 0.5rem 0.25rem;
            }

            .team-info {
                gap: 0.5rem;
            }

            .team-logo-small {
                width: 25px;
                height: 25px;
            }

            .table-controls {
                flex-direction: column;
                align-items: stretch;
            }

            .standings-legend {
                gap: 1rem;
            }

            .comparison-header {
                flex-direction: column;
                gap: 1rem;
            }

            .vs-divider {
                margin: 0;
            }

            .stat-comparison {
                grid-template-columns: 1fr;
                text-align: center;
                gap: 0.5rem;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize styles
addStandingsStyles();
