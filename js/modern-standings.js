// Modern Standings JavaScript for UltraGol
document.addEventListener('DOMContentLoaded', function() {
    initializeModernStandings();
});

let currentView = 'cards';
let currentFilter = 'general';
let modernStandingsData = [];

function initializeModernStandings() {
    setupEventListeners();
    loadStandingsData();
    updateLastUpdateTime();
}

function setupEventListeners() {
    // View toggle buttons
    const cardsView = document.getElementById('cardsView');
    const tableView = document.getElementById('tableView');
    
    if (cardsView && tableView) {
        cardsView.addEventListener('click', () => switchView('cards'));
        tableView.addEventListener('click', () => switchView('table'));
    }
    
    // Filter select
    const seasonFilter = document.getElementById('seasonFilter');
    if (seasonFilter) {
        seasonFilter.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            renderStandings();
        });
    }
    
    // Setup navigation
    setupNavigation();
}

function switchView(view) {
    currentView = view;
    
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = view === 'cards' ? document.getElementById('cardsView') : document.getElementById('tableView');
    if (activeBtn) activeBtn.classList.add('active');
    
    // Show/hide views
    const cardsContainer = document.getElementById('standingsCards');
    const tableContainer = document.getElementById('standingsTableView');
    
    if (cardsContainer && tableContainer) {
        if (view === 'cards') {
            cardsContainer.style.display = 'block';
            tableContainer.style.display = 'none';
        } else {
            cardsContainer.style.display = 'none';
            tableContainer.style.display = 'block';
        }
    }
    
    renderStandings();
}

async function loadStandingsData() {
    try {
        // Usar API de UltraGol
        modernStandingsData = await ultraGolAPI.getTabla();
        console.log('✅ Standings data loaded from API:', modernStandingsData.length, 'teams');
        renderStandings();
    } catch (error) {
        console.error('Error loading standings from API:', error);
        // Fallback a JSON local si la API falla
        try {
            const response = await fetch('data/standings.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            modernStandingsData = await response.json();
            console.log('⚠️ Standings data loaded from local JSON fallback');
            renderStandings();
        } catch (fallbackError) {
            console.error('Error in fallback:', fallbackError);
            showErrorState();
        }
    }
}

function renderStandings() {
    if (currentView === 'cards') {
        renderCardsView();
    } else {
        renderTableView();
    }
}

function renderCardsView() {
    const cardsGrid = document.getElementById('cardsGrid');
    if (!cardsGrid || !modernStandingsData.length) return;
    
    const filteredData = getFilteredData();
    
    cardsGrid.innerHTML = filteredData.map((team, index) => {
        const position = index + 1;
        const classificationClass = getClassificationClass(position);
        const form = generateRandomForm(); // Simulated form data
        
        return `
            <div class="team-card ${classificationClass}" data-team="${team.name}">
                <div class="card-header">
                    <div class="position-badge ${classificationClass}">
                        ${position}
                    </div>
                    <div class="points-display">
                        <div class="points-number">${team.points}</div>
                        <div class="points-label">Puntos</div>
                    </div>
                </div>
                
                <div class="team-info">
                    <div class="team-logo">
                        ${team.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div class="team-name">
                        <h3>${team.name}</h3>
                        <p>Liga MX</p>
                    </div>
                </div>
                
                <div class="team-stats">
                    <div class="stat-item">
                        <span class="stat-value">${team.played}</span>
                        <span class="stat-label">PJ</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${team.wins}</span>
                        <span class="stat-label">G</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${team.draws}</span>
                        <span class="stat-label">E</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${team.losses}</span>
                        <span class="stat-label">P</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${team.goalsFor}</span>
                        <span class="stat-label">GF</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${(team.goalsFor - team.goalsAgainst) > 0 ? '+' : ''}${team.goalsFor - team.goalsAgainst}</span>
                        <span class="stat-label">DIF</span>
                    </div>
                </div>
                
                <div class="form-display">
                    <div class="form-title">Últimos 5 partidos</div>
                    <div class="form-results">
                        ${form.map(result => `
                            <div class="result-indicator ${result}">
                                ${result === 'win' ? 'G' : result === 'draw' ? 'E' : 'P'}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add stagger animation
    const cards = cardsGrid.querySelectorAll('.team-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
}

function renderTableView() {
    const tableBody = document.getElementById('standingsBody');
    if (!tableBody || !modernStandingsData.length) return;
    
    const filteredData = getFilteredData();
    
    tableBody.innerHTML = filteredData.map((team, index) => {
        const position = index + 1;
        const classificationClass = getClassificationClass(position);
        const goalDiff = team.goalsFor - team.goalsAgainst;
        
        return `
            <tr class="table-row ${classificationClass}" data-team="${team.name}">
                <td class="pos-col">
                    <span class="position-indicator ${classificationClass}">${position}</span>
                </td>
                <td class="team-col">
                    <div class="team-cell">
                        <div class="team-logo-small">
                            ${team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span class="team-name-text">${team.name}</span>
                    </div>
                </td>
                <td class="stat-col">${team.played}</td>
                <td class="stat-col">${team.wins}</td>
                <td class="stat-col">${team.draws}</td>
                <td class="stat-col">${team.losses}</td>
                <td class="stat-col">${team.goalsFor}</td>
                <td class="stat-col">${team.goalsAgainst}</td>
                <td class="stat-col ${goalDiff > 0 ? 'positive' : goalDiff < 0 ? 'negative' : ''}">
                    ${goalDiff > 0 ? '+' : ''}${goalDiff}
                </td>
                <td class="pts-col"><strong>${team.points}</strong></td>
            </tr>
        `;
    }).join('');
}

function getFilteredData() {
    // For now, return all data sorted by points
    // In a real app, you would apply home/away filters
    return [...modernStandingsData].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const goalDiffA = a.goalsFor - a.goalsAgainst;
        const goalDiffB = b.goalsFor - b.goalsAgainst;
        if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
        return b.goalsFor - a.goalsFor;
    });
}

function getClassificationClass(position) {
    if (position <= 6) return 'liguilla';
    if (position <= 10) return 'play-in';
    return 'eliminado';
}

function generateRandomForm() {
    // Generate random form for demonstration
    const results = ['win', 'draw', 'loss'];
    return Array.from({length: 5}, () => results[Math.floor(Math.random() * results.length)]);
}

function updateLastUpdateTime() {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
        lastUpdateElement.textContent = `${timeString}`;
    }
}

function showErrorState() {
    const cardsGrid = document.getElementById('cardsGrid');
    if (cardsGrid) {
        cardsGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle fa-2x" style="color: #ef4444; margin-bottom: 1rem;"></i>
                <p>Error al cargar los datos de la tabla de posiciones</p>
                <button onclick="loadStandingsData()" class="btn btn-outline" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Intentar de nuevo
                </button>
            </div>
        `;
    }
}

function setupNavigation() {
    // Mobile navigation toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
        });
    });
}

// Add CSS for table enhancements
const tableStyles = document.createElement('style');
tableStyles.textContent = `
    .team-cell {
        display: flex;
        align-items: center;
        gap: 0.8rem;
    }
    
    .team-logo-small {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: linear-gradient(45deg, #ff9933, #ff6633);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        font-size: 0.8rem;
    }
    
    .team-name-text {
        font-weight: 600;
        color: #fff;
    }
    
    .position-indicator {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: #fff;
        background: linear-gradient(45deg, #666, #888);
    }
    
    .position-indicator.liguilla {
        background: linear-gradient(45deg, #22c55e, #16a34a);
    }
    
    .position-indicator.play-in {
        background: linear-gradient(45deg, #fbbf24, #f59e0b);
    }
    
    .position-indicator.eliminado {
        background: linear-gradient(45deg, #ef4444, #dc2626);
    }
    
    .positive {
        color: #22c55e !important;
        font-weight: 600;
    }
    
    .negative {
        color: #ef4444 !important;
        font-weight: 600;
    }
    
    .error-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        color: #ccc;
    }
    
    .fade-in {
        animation: fadeInUp 0.6s ease-out forwards;
        opacity: 0;
        transform: translateY(20px);
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(tableStyles);

console.log('🏆 Modern Standings system loaded successfully');