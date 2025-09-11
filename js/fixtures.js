// Fixtures page JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeFixtures();
});

let allFixtures = [];
let filteredFixtures = [];
let currentView = 'list';
let currentDate = new Date();

function initializeFixtures() {
    setupFixturesEventListeners();
    loadFixturesData();
    populateJornadaSelector();
    populateTeamFilter();
    setDefaultDate();
}

function setupFixturesEventListeners() {
    // Date selector
    const dateInput = document.getElementById('fixtureDate');
    if (dateInput) {
        dateInput.addEventListener('change', handleDateChange);
    }

    // Jornada selector
    const jornadaSelect = document.getElementById('jornadaSelect');
    if (jornadaSelect) {
        jornadaSelect.addEventListener('change', handleJornadaChange);
    }

    // Team filter
    const teamFilter = document.getElementById('teamFilter');
    if (teamFilter) {
        teamFilter.addEventListener('change', handleTeamFilter);
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', handleStatusFilter);
    }

    // View toggles
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', handleViewToggle);
    });

    // Calendar navigation
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    if (prevMonth) prevMonth.addEventListener('click', () => navigateMonth(-1));
    if (nextMonth) nextMonth.addEventListener('click', () => navigateMonth(1));

    // Modal event listeners
    setupModalEventListeners();
}

function setupModalEventListeners() {
    const modal = document.getElementById('matchModal');
    const modalClose = document.getElementById('modalClose');
    const modalOverlay = document.querySelector('.modal-overlay');

    if (modalClose) {
        modalClose.addEventListener('click', closeMatchModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeMatchModal);
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeMatchModal();
        }
    });
}

async function loadFixturesData() {
    try {
        const fixtures = await getFixturesData();
        allFixtures = fixtures;
        filteredFixtures = [...fixtures];
        
        renderFixturesList();
        renderCalendarView();
        checkForLiveMatches();
        
    } catch (error) {
        console.error('Error loading fixtures:', error);
        showErrorMessage('Error al cargar los partidos');
    }
}

async function getFixturesData() {
    if (window.ligaMXApp && window.ligaMXApp.fixturesData().length > 0) {
        return window.ligaMXApp.fixturesData();
    }

    const response = await fetch('data/fixtures.json');
    if (!response.ok) {
        throw new Error('Failed to load fixtures data');
    }
    return await response.json();
}

function populateJornadaSelector() {
    const jornadaSelect = document.getElementById('jornadaSelect');
    if (!jornadaSelect || !allFixtures.length) return;

    const jornadas = [...new Set(allFixtures.map(f => f.jornada))].sort((a, b) => a - b);
    
    jornadaSelect.innerHTML = '<option value="">Todas las jornadas</option>' +
        jornadas.map(j => `<option value="${j}">Jornada ${j}</option>`).join('');
}

async function populateTeamFilter() {
    const teamFilter = document.getElementById('teamFilter');
    if (!teamFilter) return;

    try {
        const teams = await getTeamsData();
        teamFilter.innerHTML = '<option value="">Todos los equipos</option>' +
            teams.map(team => `<option value="${team.name}">${team.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading teams for filter:', error);
    }
}

async function getTeamsData() {
    if (window.ligaMXApp && window.ligaMXApp.teamsData().length > 0) {
        return window.ligaMXApp.teamsData();
    }

    const response = await fetch('data/teams.json');
    return await response.json();
}

function setDefaultDate() {
    const dateInput = document.getElementById('fixtureDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

function handleDateChange(event) {
    const selectedDate = event.target.value;
    if (!selectedDate) {
        filteredFixtures = [...allFixtures];
    } else {
        const filterDate = new Date(selectedDate);
        filteredFixtures = allFixtures.filter(fixture => {
            const fixtureDate = new Date(fixture.date);
            return fixtureDate.toDateString() === filterDate.toDateString();
        });
    }
    renderCurrentView();
}

function handleJornadaChange(event) {
    const selectedJornada = event.target.value;
    if (!selectedJornada) {
        filteredFixtures = [...allFixtures];
    } else {
        filteredFixtures = allFixtures.filter(fixture => 
            fixture.jornada.toString() === selectedJornada
        );
    }
    renderCurrentView();
}

function handleTeamFilter(event) {
    const selectedTeam = event.target.value;
    if (!selectedTeam) {
        filteredFixtures = [...allFixtures];
    } else {
        filteredFixtures = allFixtures.filter(fixture => 
            fixture.homeTeam === selectedTeam || fixture.awayTeam === selectedTeam
        );
    }
    renderCurrentView();
}

function handleStatusFilter(event) {
    const selectedStatus = event.target.value;
    if (!selectedStatus) {
        filteredFixtures = [...allFixtures];
    } else {
        filteredFixtures = allFixtures.filter(fixture => 
            fixture.status === selectedStatus
        );
    }
    renderCurrentView();
}

function handleViewToggle(event) {
    // Update active button
    document.querySelectorAll('.toggle-btn').forEach(btn => 
        btn.classList.remove('active')
    );
    event.target.classList.add('active');

    // Switch view
    const view = event.target.getAttribute('data-view');
    currentView = view;

    document.querySelectorAll('.fixtures-view').forEach(viewEl => 
        viewEl.classList.remove('active')
    );

    const targetView = document.getElementById(`${view}View`);
    if (targetView) {
        targetView.classList.add('active');
    }

    if (view === 'calendar') {
        renderCalendarView();
    }
}

function renderCurrentView() {
    if (currentView === 'list') {
        renderFixturesList();
    } else {
        renderCalendarView();
    }
}

function renderFixturesList() {
    const fixturesList = document.getElementById('fixturesList');
    if (!fixturesList) return;

    if (filteredFixtures.length === 0) {
        fixturesList.innerHTML = `
            <div class="no-fixtures">
                <i class="fas fa-calendar-times"></i>
                <h3>No hay partidos</h3>
                <p>No se encontraron partidos para los filtros seleccionados.</p>
            </div>
        `;
        return;
    }

    // Group fixtures by date
    const groupedFixtures = groupFixturesByDate(filteredFixtures);
    
    fixturesList.innerHTML = Object.entries(groupedFixtures).map(([date, fixtures]) => `
        <div class="fixtures-date-group">
            <h3 class="date-header">${formatDateHeader(date)}</h3>
            <div class="fixtures-day">
                ${fixtures.map((fixture, index) => renderFixtureCard(fixture, index)).join('')}
            </div>
        </div>
    `).join('');

    // Add click handlers for fixture cards
    document.querySelectorAll('.fixture-card').forEach(card => {
        card.addEventListener('click', function() {
            const fixtureId = this.getAttribute('data-fixture-id');
            openMatchModal(fixtureId);
        });
    });
}

function groupFixturesByDate(fixtures) {
    return fixtures.reduce((groups, fixture) => {
        const date = new Date(fixture.date).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(fixture);
        return groups;
    }, {});
}

function formatDateHeader(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Mañana';
    } else {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

function renderFixtureCard(fixture, index) {
    const statusClass = getStatusClass(fixture.status);
    const statusText = getStatusText(fixture.status);
    
    return `
        <div class="fixture-card stagger-item ${statusClass}" 
             data-fixture-id="${fixture.id}" 
             style="animation-delay: ${index * 0.1}s">
            <div class="fixture-header">
                <span class="fixture-time">${formatTime(fixture.date)}</span>
                <span class="fixture-status ${fixture.status}">${statusText}</span>
                ${fixture.jornada ? `<span class="fixture-jornada">J${fixture.jornada}</span>` : ''}
            </div>
            <div class="fixture-teams">
                <div class="team-section home">
                    <div class="team-logo"></div>
                    <span class="team-name">${fixture.homeTeam}</span>
                </div>
                <div class="fixture-score">
                    ${fixture.status === 'completed' || fixture.status === 'live' ? 
                        `<span class="score">${fixture.homeScore || 0} - ${fixture.awayScore || 0}</span>` :
                        `<span class="vs">VS</span>`
                    }
                </div>
                <div class="team-section away">
                    <span class="team-name">${fixture.awayTeam}</span>
                    <div class="team-logo"></div>
                </div>
            </div>
            ${fixture.stadium ? `
                <div class="fixture-venue">
                    <i class="fas fa-map-marker-alt"></i>
                    ${fixture.stadium}
                </div>
            ` : ''}
        </div>
    `;
}

function getStatusClass(status) {
    switch (status) {
        case 'live': return 'live';
        case 'completed': return 'completed';
        case 'scheduled': return 'scheduled';
        case 'postponed': return 'postponed';
        default: return '';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'live': return 'En Vivo';
        case 'completed': return 'Finalizado';
        case 'scheduled': return 'Por Jugar';
        case 'postponed': return 'Pospuesto';
        default: return '';
    }
}

function renderCalendarView() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarTitle = document.getElementById('calendarTitle');
    
    if (!calendarGrid || !calendarTitle) return;

    // Update calendar title
    calendarTitle.textContent = currentDate.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric'
    });

    // Generate calendar
    const calendar = generateCalendar(currentDate);
    calendarGrid.innerHTML = calendar;
}

function generateCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    let calendar = `
        <div class="calendar-weekdays">
            <div class="weekday">Dom</div>
            <div class="weekday">Lun</div>
            <div class="weekday">Mar</div>
            <div class="weekday">Mié</div>
            <div class="weekday">Jue</div>
            <div class="weekday">Vie</div>
            <div class="weekday">Sáb</div>
        </div>
        <div class="calendar-days">
    `;

    const current = new Date(startDate);
    
    // Generate 6 weeks
    for (let week = 0; week < 6; week++) {
        for (let day = 0; day < 7; day++) {
            const isCurrentMonth = current.getMonth() === month;
            const isToday = current.toDateString() === new Date().toDateString();
            
            // Get fixtures for this day
            const dayFixtures = allFixtures.filter(fixture => {
                const fixtureDate = new Date(fixture.date);
                return fixtureDate.toDateString() === current.toDateString();
            });

            calendar += `
                <div class="calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''}" 
                     data-date="${current.toISOString().split('T')[0]}">
                    <div class="day-number">${current.getDate()}</div>
                    ${dayFixtures.length > 0 ? `
                        <div class="day-fixtures">
                            ${dayFixtures.slice(0, 3).map(fixture => `
                                <div class="mini-fixture ${getStatusClass(fixture.status)}" 
                                     data-fixture-id="${fixture.id}"
                                     title="${fixture.homeTeam} vs ${fixture.awayTeam}">
                                    ${fixture.status === 'completed' ? 
                                        `${fixture.homeScore}-${fixture.awayScore}` : 
                                        formatTime(fixture.date)
                                    }
                                </div>
                            `).join('')}
                            ${dayFixtures.length > 3 ? `
                                <div class="more-fixtures">+${dayFixtures.length - 3}</div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
            
            current.setDate(current.getDate() + 1);
        }
    }

    calendar += '</div>';

    // Add click handlers after rendering
    setTimeout(() => {
        document.querySelectorAll('.mini-fixture').forEach(fixture => {
            fixture.addEventListener('click', function(e) {
                e.stopPropagation();
                const fixtureId = this.getAttribute('data-fixture-id');
                openMatchModal(fixtureId);
            });
        });
    }, 100);

    return calendar;
}

function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendarView();
}

function checkForLiveMatches() {
    const liveMatches = allFixtures.filter(f => f.status === 'live');
    const liveBanner = document.getElementById('liveMatchesBanner');
    const liveGrid = document.getElementById('liveMatchesGrid');

    if (liveMatches.length > 0 && liveBanner && liveGrid) {
        liveGrid.innerHTML = liveMatches.map(match => `
            <div class="live-match-card" data-fixture-id="${match.id}">
                <div class="live-indicator">
                    <i class="fas fa-circle"></i>
                    EN VIVO
                </div>
                <div class="live-teams">
                    <span>${match.homeTeam}</span>
                    <span class="live-score">${match.homeScore || 0} - ${match.awayScore || 0}</span>
                    <span>${match.awayTeam}</span>
                </div>
                <div class="live-time">${match.minute || 90}'</div>
            </div>
        `).join('');

        liveBanner.style.display = 'block';

        // Add click handlers
        document.querySelectorAll('.live-match-card').forEach(card => {
            card.addEventListener('click', function() {
                const fixtureId = this.getAttribute('data-fixture-id');
                openMatchModal(fixtureId);
            });
        });
    }
}

function openMatchModal(fixtureId) {
    const fixture = allFixtures.find(f => f.id === fixtureId);
    if (!fixture) return;

    const modal = document.getElementById('matchModal');
    const modalBody = document.getElementById('matchModalBody');
    
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
        <div class="match-details">
            <div class="match-header-modal">
                <div class="match-date-time">
                    ${formatFullDate(fixture.date)} - ${formatTime(fixture.date)}
                </div>
                <div class="match-jornada">Jornada ${fixture.jornada}</div>
            </div>
            
            <div class="match-teams-modal">
                <div class="team-modal home">
                    <div class="team-logo-modal"></div>
                    <h3>${fixture.homeTeam}</h3>
                    ${fixture.status === 'completed' || fixture.status === 'live' ? 
                        `<div class="team-score">${fixture.homeScore || 0}</div>` : 
                        ''
                    }
                </div>
                
                <div class="vs-section">
                    ${fixture.status === 'live' ? 
                        `<div class="live-indicator-large">
                            <i class="fas fa-circle"></i>
                            EN VIVO - ${fixture.minute || 90}'
                        </div>` :
                        fixture.status === 'completed' ?
                        '<div class="final-score">FINAL</div>' :
                        '<div class="vs-large">VS</div>'
                    }
                </div>
                
                <div class="team-modal away">
                    <div class="team-logo-modal"></div>
                    <h3>${fixture.awayTeam}</h3>
                    ${fixture.status === 'completed' || fixture.status === 'live' ? 
                        `<div class="team-score">${fixture.awayScore || 0}</div>` : 
                        ''
                    }
                </div>
            </div>
            
            <div class="match-info-modal">
                ${fixture.stadium ? `
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${fixture.stadium}</span>
                    </div>
                ` : ''}
                ${fixture.referee ? `
                    <div class="info-item">
                        <i class="fas fa-user-tie"></i>
                        <span>Árbitro: ${fixture.referee}</span>
                    </div>
                ` : ''}
                ${fixture.attendance ? `
                    <div class="info-item">
                        <i class="fas fa-users"></i>
                        <span>Asistencia: ${fixture.attendance}</span>
                    </div>
                ` : ''}
            </div>

            ${fixture.events && fixture.events.length > 0 ? `
                <div class="match-events">
                    <h4>Eventos del Partido</h4>
                    <div class="events-list">
                        ${fixture.events.map(event => `
                            <div class="event-item">
                                <div class="event-minute">${event.minute}'</div>
                                <div class="event-icon">
                                    <i class="fas fa-${getEventIcon(event.type)}"></i>
                                </div>
                                <div class="event-description">
                                    ${event.player} - ${event.description}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    modal.classList.add('active');
    modal.classList.add('modal-fade-in');
}

function closeMatchModal() {
    const modal = document.getElementById('matchModal');
    if (modal) {
        modal.classList.remove('active', 'modal-fade-in');
    }
}

function getEventIcon(eventType) {
    switch (eventType) {
        case 'goal': return 'futbol';
        case 'yellow_card': return 'square';
        case 'red_card': return 'square';
        case 'substitution': return 'exchange-alt';
        default: return 'info-circle';
    }
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Add fixtures specific styles
function addFixturesStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .fixtures-date-group {
            margin-bottom: 3rem;
        }

        .date-header {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e3c72;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #f0f0f0;
        }

        .fixtures-day {
            display: grid;
            gap: 1rem;
        }

        .fixture-card {
            background: white;
            border-radius: 15px;
            padding: 1.5rem;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #1e3c72;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .fixture-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .fixture-card.live {
            border-left-color: #dc3545;
            background: linear-gradient(135deg, #fff, #ffebee);
        }

        .fixture-card.completed {
            border-left-color: #28a745;
        }

        .fixture-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .fixture-time {
            font-weight: 600;
            color: #1e3c72;
        }

        .fixture-status {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .fixture-status.live {
            background: #dc3545;
            color: white;
            animation: pulse 2s infinite;
        }

        .fixture-status.completed {
            background: #d4edda;
            color: #155724;
        }

        .fixture-status.scheduled {
            background: #e2e3e5;
            color: #495057;
        }

        .fixture-jornada {
            background: #1e3c72;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 10px;
            font-size: 0.8rem;
        }

        .fixture-teams {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .team-section {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex: 1;
        }

        .team-section.away {
            flex-direction: row-reverse;
            text-align: right;
        }

        .team-logo {
            width: 40px;
            height: 40px;
            background: #f0f0f0;
            border-radius: 50%;
        }

        .team-name {
            font-weight: 600;
            color: #333;
        }

        .fixture-score {
            text-align: center;
            margin: 0 1rem;
        }

        .score {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1e3c72;
        }

        .vs {
            font-size: 1.2rem;
            font-weight: 600;
            color: #666;
        }

        .fixture-venue {
            color: #666;
            font-size: 0.9rem;
            text-align: center;
        }

        .fixture-venue i {
            margin-right: 0.5rem;
        }

        .no-fixtures {
            text-align: center;
            padding: 4rem 2rem;
            color: #666;
        }

        .no-fixtures i {
            font-size: 4rem;
            margin-bottom: 1rem;
            color: #ddd;
        }

        /* Calendar View Styles */
        .calendar-container {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
        }

        .calendar-nav {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .calendar-nav:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .calendar-title {
            font-size: 1.5rem;
            font-weight: 600;
            text-transform: capitalize;
        }

        .calendar-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            background: #f8f9fa;
        }

        .weekday {
            padding: 1rem;
            text-align: center;
            font-weight: 600;
            color: #666;
            border-right: 1px solid #e0e0e0;
        }

        .weekday:last-child {
            border-right: none;
        }

        .calendar-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }

        .calendar-day {
            min-height: 120px;
            padding: 0.5rem;
            border-right: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
            position: relative;
        }

        .calendar-day:last-child {
            border-right: none;
        }

        .calendar-day.today {
            background: rgba(30, 60, 114, 0.1);
        }

        .calendar-day.other-month {
            opacity: 0.3;
        }

        .day-number {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .day-fixtures {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .mini-fixture {
            background: #1e3c72;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 5px;
            font-size: 0.7rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .mini-fixture:hover {
            background: #2a5298;
        }

        .mini-fixture.live {
            background: #dc3545;
            animation: pulse 2s infinite;
        }

        .mini-fixture.completed {
            background: #28a745;
        }

        .more-fixtures {
            color: #666;
            font-size: 0.7rem;
            text-align: center;
        }

        /* Live Matches Banner */
        .live-matches {
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            padding: 2rem 0;
        }

        .live-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
        }

        .live-indicator {
            animation: pulse 2s infinite;
        }

        .live-matches-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }

        .live-match-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .live-match-card:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .live-teams {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0.5rem 0;
        }

        .live-score {
            font-size: 1.5rem;
            font-weight: 700;
        }

        .live-time {
            text-align: center;
            font-weight: 600;
        }

        /* Modal Styles */
        .match-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 2000;
            display: none;
        }

        .match-modal.active {
            display: block;
        }

        .match-details {
            padding: 1rem;
        }

        .match-header-modal {
            text-align: center;
            margin-bottom: 2rem;
        }

        .match-date-time {
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 0.5rem;
        }

        .match-jornada {
            background: #1e3c72;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            display: inline-block;
        }

        .match-teams-modal {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .team-modal {
            text-align: center;
            flex: 1;
        }

        .team-logo-modal {
            width: 80px;
            height: 80px;
            background: #f0f0f0;
            border-radius: 50%;
            margin: 0 auto 1rem;
        }

        .team-modal h3 {
            margin-bottom: 1rem;
        }

        .team-score {
            font-size: 3rem;
            font-weight: 700;
            color: #1e3c72;
        }

        .vs-section {
            margin: 0 2rem;
            text-align: center;
        }

        .vs-large {
            font-size: 2rem;
            font-weight: 700;
            color: #666;
        }

        .final-score {
            background: #28a745;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
        }

        .live-indicator-large {
            background: #dc3545;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            animation: pulse 2s infinite;
        }

        .match-info-modal {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-bottom: 2rem;
        }

        .info-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: #666;
        }

        .info-item i {
            color: #1e3c72;
            width: 20px;
        }

        .match-events {
            border-top: 2px solid #f0f0f0;
            padding-top: 1.5rem;
        }

        .match-events h4 {
            margin-bottom: 1rem;
            color: #333;
        }

        .events-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .event-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem;
            background: #f8f9fa;
            border-radius: 10px;
        }

        .event-minute {
            font-weight: 700;
            color: #1e3c72;
            min-width: 40px;
        }

        .event-icon {
            width: 30px;
            height: 30px;
            background: #1e3c72;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .event-description {
            color: #333;
        }

        @media (max-width: 768px) {
            .fixture-teams {
                flex-direction: column;
                gap: 1rem;
            }

            .team-section.away {
                flex-direction: row;
            }

            .fixture-score {
                margin: 0;
                order: -1;
            }

            .calendar-day {
                min-height: 80px;
            }

            .match-teams-modal {
                flex-direction: column;
                gap: 2rem;
            }

            .vs-section {
                margin: 0;
            }

            .team-score {
                font-size: 2rem;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize styles
addFixturesStyles();
