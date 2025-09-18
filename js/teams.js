// Teams page JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeTeamsPage();
});

let allTeams = [];
let filteredTeams = [];
let selectedTeamData = null;

function initializeTeamsPage() {
    setupTeamEventListeners();
    loadTeamsGrid();
    checkSelectedTeam();
}

function setupTeamEventListeners() {
    // Search input
    const searchInput = document.getElementById('teamSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleTeamSearch);
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });

    // Modal event listeners
    setupModalEventListeners();

    // Team actions
    const changeTeamBtn = document.getElementById('changeTeam');
    if (changeTeamBtn) {
        changeTeamBtn.addEventListener('click', () => {
            clearSelectedTeam();
            hideSelectedTeamSection();
        });
    }

    const viewProfileBtn = document.getElementById('viewTeamProfile');
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', () => {
            const selectedTeam = localStorage.getItem('selectedTeam');
            if (selectedTeam) {
                window.location.href = `team-profile.html?team=${selectedTeam}`;
            }
        });
    }
}

function setupModalEventListeners() {
    const modal = document.getElementById('teamModal');
    const modalClose = document.getElementById('modalClose');
    const cancelSelection = document.getElementById('cancelSelection');
    const confirmSelection = document.getElementById('confirmSelection');
    const modalOverlay = document.querySelector('.modal-overlay');

    if (modalClose) {
        modalClose.addEventListener('click', closeTeamModal);
    }

    if (cancelSelection) {
        cancelSelection.addEventListener('click', closeTeamModal);
    }

    if (confirmSelection) {
        confirmSelection.addEventListener('click', confirmTeamSelection);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeTeamModal);
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeTeamModal();
        }
    });
}

async function loadTeamsGrid() {
    const teamsGrid = document.getElementById('teamsGrid');
    if (!teamsGrid) return;

    showLoading(teamsGrid);

    try {
        allTeams = await getTeamsData();
        filteredTeams = [...allTeams];
        renderTeamsGrid();
    } catch (error) {
        console.error('Error loading teams:', error);
        showErrorMessage('Error al cargar los equipos');
        teamsGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar los equipos</h3>
                <p>Por favor, recarga la página e inténtalo de nuevo.</p>
            </div>
        `;
    }
}

async function getTeamsData() {
    if (window.ligaMXApp && window.ligaMXApp.teamsData().length > 0) {
        return window.ligaMXApp.teamsData();
    }

    const response = await fetch('data/teams.json');
    if (!response.ok) {
        throw new Error('Failed to load teams data');
    }
    return await response.json();
}

function renderTeamsGrid() {
    const teamsGrid = document.getElementById('teamsGrid');
    if (!teamsGrid || !filteredTeams.length) return;

    teamsGrid.innerHTML = filteredTeams.map((team, index) => {
        const teamStats = getTeamStats(team);
        return `
            <div class="team-card stagger-item" 
                 data-team-id="${team.id}" 
                 data-region="${team.region}"
                 style="--team-primary: ${team.colors.primary}; --team-secondary: ${team.colors.secondary}; animation-delay: ${index * 0.1}s">
                <div class="team-logo-container">
                    <div class="team-logo">
                        <img src="${team.logo}" alt="${team.name} logo" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="logo-fallback" style="display: none; background: ${team.colors.primary}; color: ${team.colors.secondary}; width: 100%; height: 100%; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; border-radius: 50%;">
                            ${team.shortName || team.name.substring(0, 3).toUpperCase()}
                        </div>
                    </div>
                </div>
                <h3 class="team-card-name">${team.name}</h3>
                <p class="team-card-nickname">"${team.nickname}"</p>
                <div class="team-card-info">
                    <span><i class="fas fa-map-marker-alt"></i> ${team.city}</span>
                    <span><i class="fas fa-calendar"></i> ${team.founded}</span>
                </div>
                <div class="team-card-stats">
                    <div class="stat-item">
                        <div class="stat-value">${teamStats.position}°</div>
                        <div class="stat-label">Posición</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${teamStats.points}</div>
                        <div class="stat-label">Puntos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${team.titles || 0}</div>
                        <div class="stat-label">Títulos</div>
                    </div>
                </div>
                <button class="team-select-btn" data-team-id="${team.id}">
                    <i class="fas fa-heart"></i> Seleccionar Equipo
                </button>
            </div>
        `;
    }).join('');

    // Add event listeners to team select buttons
    setTimeout(() => {
        document.querySelectorAll('.team-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const teamId = btn.getAttribute('data-team-id');
                openTeamModal(teamId);
            });
        });
        
        // Trigger stagger animation
        document.querySelectorAll('.team-card').forEach(card => {
            card.classList.add('revealed');
        });
    }, 100);
}

function getTeamStats(team) {
    // Get team stats from standings data
    const standings = window.ligaMXApp ? window.ligaMXApp.standingsData() : [];
    const teamStats = standings.find(t => t.id === team.id);
    
    return {
        position: teamStats ? teamStats.position : '--',
        points: teamStats ? teamStats.points : '--',
        played: teamStats ? teamStats.played : '--'
    };
}

function handleTeamSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    
    if (!query) {
        filteredTeams = [...allTeams];
    } else {
        filteredTeams = allTeams.filter(team => 
            team.name.toLowerCase().includes(query) ||
            team.nickname.toLowerCase().includes(query) ||
            team.city.toLowerCase().includes(query) ||
            team.stadium.toLowerCase().includes(query)
        );
    }
    
    renderTeamsGrid();
}

function handleFilterClick(event) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => 
        btn.classList.remove('active')
    );
    event.target.classList.add('active');

    // Filter teams
    const filter = event.target.getAttribute('data-filter');
    
    if (filter === 'all') {
        filteredTeams = [...allTeams];
    } else {
        filteredTeams = allTeams.filter(team => team.region === filter);
    }

    renderTeamsGrid();
}

function openTeamModal(teamId) {
    const team = allTeams.find(t => t.id === teamId);
    if (!team) return;

    selectedTeamData = team;
    
    const modal = document.getElementById('teamModal');
    const confirmContent = document.getElementById('teamConfirm');
    
    if (!modal || !confirmContent) return;

    confirmContent.innerHTML = `
        <div class="confirm-team-logo">
            <img src="${team.logo}" alt="${team.name} logo" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="logo-fallback" style="display: none; background: ${team.colors.primary}; color: ${team.colors.secondary}; width: 100%; height: 100%; align-items: center; justify-content: center; font-weight: bold; font-size: 2rem; border-radius: 50%;">
                ${team.shortName || team.name.substring(0, 3).toUpperCase()}
            </div>
        </div>
        <h3 class="confirm-team-name" style="color: ${team.colors.primary}">${team.name}</h3>
        <p class="confirm-team-description">
            <strong>"${team.nickname}"</strong><br>
            Fundado en ${team.founded} en ${team.city}, ${team.state}.<br>
            Estadio: ${team.stadium} (${team.capacity} espectadores)<br><br>
            ${team.description || 'Uno de los equipos más emblemáticos del fútbol mexicano.'}
        </p>
    `;

    modal.classList.add('active');
    modal.classList.add('modal-fade-in');
}

function closeTeamModal() {
    const modal = document.getElementById('teamModal');
    if (modal) {
        modal.classList.remove('active', 'modal-fade-in');
        selectedTeamData = null;
    }
}

function confirmTeamSelection() {
    if (!selectedTeamData) return;

    // Save selected team
    localStorage.setItem('selectedTeam', selectedTeamData.id);
    
    // Apply team theme
    if (window.ligaMXApp && window.ligaMXApp.applyTeamTheme) {
        window.ligaMXApp.applyTeamTheme(selectedTeamData.id);
    }

    // Show success message
    showSuccessMessage(`¡${selectedTeamData.name} ha sido seleccionado como tu equipo!`);

    // Close modal and show selected team section
    closeTeamModal();
    showSelectedTeam();
}

function showSelectedTeam() {
    const selectedTeam = localStorage.getItem('selectedTeam');
    if (!selectedTeam) return;

    const team = allTeams.find(t => t.id === selectedTeam);
    if (!team) return;

    const selectedTeamSection = document.getElementById('selectedTeamSection');
    const selectedTeamCard = document.getElementById('selectedTeamCard');
    
    if (!selectedTeamSection || !selectedTeamCard) return;

    // Update team theme
    selectedTeamSection.style.background = `linear-gradient(135deg, ${team.colors.primary} 0%, ${team.colors.secondary} 100%)`;

    const teamStats = getTeamStats(team);

    selectedTeamCard.innerHTML = `
        <div class="selected-team-logo">
            <img src="${team.logo}" alt="${team.name} logo" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="logo-fallback" style="display: none; background: ${team.colors.primary}; color: ${team.colors.secondary}; width: 100%; height: 100%; align-items: center; justify-content: center; font-weight: bold; font-size: 2.5rem; border-radius: 50%;">
                ${team.shortName || team.name.substring(0, 3).toUpperCase()}
            </div>
        </div>
        <h2 class="selected-team-name">${team.name}</h2>
        <p class="selected-team-motto">"${team.nickname}"</p>
        <div class="team-quick-stats">
            <div class="quick-stat">
                <div class="quick-stat-value">${teamStats.position}°</div>
                <div class="quick-stat-label">Posición</div>
            </div>
            <div class="quick-stat">
                <div class="quick-stat-value">${teamStats.points}</div>
                <div class="quick-stat-label">Puntos</div>
            </div>
            <div class="quick-stat">
                <div class="quick-stat-value">${team.titles || 0}</div>
                <div class="quick-stat-label">Títulos</div>
            </div>
            <div class="quick-stat">
                <div class="quick-stat-value">${team.founded}</div>
                <div class="quick-stat-label">Fundado</div>
            </div>
        </div>
    `;

    selectedTeamSection.style.display = 'block';
    selectedTeamSection.scrollIntoView({ behavior: 'smooth' });
}

function hideSelectedTeamSection() {
    const selectedTeamSection = document.getElementById('selectedTeamSection');
    if (selectedTeamSection) {
        selectedTeamSection.style.display = 'none';
    }
}

function clearSelectedTeam() {
    localStorage.removeItem('selectedTeam');
    
    // Reset theme
    const root = document.documentElement;
    root.style.removeProperty('--team-primary');
    root.style.removeProperty('--team-secondary');
    document.body.className = document.body.className.replace(/team-\w+/g, '');
}

function checkSelectedTeam() {
    const selectedTeam = localStorage.getItem('selectedTeam');
    if (selectedTeam) {
        // Wait for teams data to load
        setTimeout(() => {
            if (allTeams.length > 0) {
                showSelectedTeam();
            }
        }, 500);
    }
}

// Add utility functions for team management
window.teamUtils = {
    openTeamModal,
    closeTeamModal,
    confirmTeamSelection,
    clearSelectedTeam,
    getSelectedTeam: () => localStorage.getItem('selectedTeam'),
    getTeamById: (id) => allTeams.find(t => t.id === id)
};

// Expose openTeamModal globally for onclick handlers
window.openTeamModal = openTeamModal;

// Add CSS for error states
function addTeamsStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .error-state {
            grid-column: 1 / -1;
            text-align: center;
            padding: 4rem 2rem;
            color: #666;
        }

        .error-state i {
            font-size: 4rem;
            margin-bottom: 1rem;
            color: #dc3545;
        }

        .error-state h3 {
            margin-bottom: 1rem;
            color: #333;
        }

        .team-card.revealed {
            opacity: 1;
            transform: translateY(0);
        }

        @media (max-width: 768px) {
            .team-card-info {
                flex-direction: column;
                gap: 0.5rem;
            }

            .team-card-stats {
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize styles
addTeamsStyles();
