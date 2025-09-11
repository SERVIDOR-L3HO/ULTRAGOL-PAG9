// Enhanced Calendar JavaScript for Liga MX Website by L3HO
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
});

// Variables globales
let currentJornada = 1;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentView = 'jornada'; // 'jornada' or 'month'
let jornadasData = [];
let calendarTeamsData = [];
let allMatches = [];
let filteredMatches = [];
let selectedTeam = '';
let selectedMatchType = '';

const months = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

// Inicializar sistema de calendario
async function initializeCalendar() {
    try {
        // Cargar jornadas primero, luego el resto
        await loadJornadasData();
        await Promise.all([
            loadTeamsData(),
            loadFixturesData()
        ]);
        
        setupCalendarControls();
        setupViewControls();
        setupFilters();
        populateTeamFilter();
        generateJornadasSelector();
        displayJornada(currentJornada);
    } catch (error) {
        console.error('Error inicializando calendario:', error);
        showErrorMessage('Error al cargar el calendario');
    }
}

// Cargar datos de jornadas
async function loadJornadasData() {
    try {
        const response = await fetch('data/jornadas.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        jornadasData = data.jornadas;
        return jornadasData;
    } catch (error) {
        console.error('Error cargando datos de jornadas:', error);
        // Datos de fallback si no se puede cargar el JSON
        jornadasData = generateFallbackJornadas();
        return jornadasData;
    }
}

// Cargar datos de equipos
async function loadTeamsData() {
    try {
        const response = await fetch('data/teams.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        calendarTeamsData = await response.json();
        return calendarTeamsData;
    } catch (error) {
        console.error('Error cargando datos de equipos:', error);
        calendarTeamsData = [];
        return [];
    }
}

// Cargar datos de partidos
async function loadFixturesData() {
    try {
        const response = await fetch('data/fixtures.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const fixtures = await response.json();
        
        // Combinar partidos de jornadas y fixtures
        allMatches = [];
        
        // Agregar partidos de jornadas
        jornadasData.forEach(jornada => {
            jornada.partidos?.forEach(partido => {
                allMatches.push({
                    ...partido,
                    jornada: jornada.numero,
                    date: parseMatchDate(partido.dia, partido.hora)
                });
            });
        });
        
        // Agregar fixtures si existen
        if (fixtures && Array.isArray(fixtures)) {
            fixtures.forEach(match => {
                allMatches.push({
                    ...match,
                    date: new Date(match.date)
                });
            });
        }
        
        filteredMatches = [...allMatches];
        return allMatches;
    } catch (error) {
        console.error('Error cargando datos de partidos:', error);
        allMatches = [];
        filteredMatches = [];
        return [];
    }
}

// Generar jornadas de fallback
function generateFallbackJornadas() {
    const fallbackJornadas = [];
    for (let i = 1; i <= 17; i++) {
        fallbackJornadas.push({
            numero: i,
            fechas: `Jornada ${i}`,
            partidos: []
        });
    }
    return fallbackJornadas;
}

// Configurar controles de calendario
function setupCalendarControls() {
    // Controles de jornadas
    const prevButton = document.getElementById('prevJornada');
    const nextButton = document.getElementById('nextJornada');
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (currentJornada > 1) {
                currentJornada--;
                displayJornada(currentJornada);
                updateNavButtons();
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (currentJornada < jornadasData.length) {
                currentJornada++;
                displayJornada(currentJornada);
                updateNavButtons();
            }
        });
    }
    
    // Controles de mes
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    
    if (prevMonthButton) {
        prevMonthButton.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            displayMonthView();
        });
    }
    
    if (nextMonthButton) {
        nextMonthButton.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            displayMonthView();
        });
    }
}

// Configurar controles de vista
function setupViewControls() {
    const jornadaViewBtn = document.getElementById('jornadaView');
    const monthViewBtn = document.getElementById('monthView');
    
    if (jornadaViewBtn) {
        jornadaViewBtn.addEventListener('click', () => {
            switchView('jornada');
        });
    }
    
    if (monthViewBtn) {
        monthViewBtn.addEventListener('click', () => {
            switchView('month');
        });
    }
}

// Configurar filtros
function setupFilters() {
    const teamFilter = document.getElementById('teamFilter');
    const matchTypeFilter = document.getElementById('matchTypeFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    if (teamFilter) {
        teamFilter.addEventListener('change', (e) => {
            selectedTeam = e.target.value;
            applyFilters();
        });
    }
    
    if (matchTypeFilter) {
        matchTypeFilter.addEventListener('change', (e) => {
            selectedMatchType = e.target.value;
            applyFilters();
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            clearAllFilters();
        });
    }
}

// Generar selector de jornadas
function generateJornadasSelector() {
    const selector = document.getElementById('jornadasSelector');
    if (!selector || !jornadasData.length) return;
    
    selector.innerHTML = '';
    
    jornadasData.forEach((jornada, index) => {
        const button = document.createElement('button');
        button.className = 'jornada-btn';
        if (index + 1 === currentJornada) {
            button.classList.add('active');
        }
        
        // Manejar jornadas especiales (dobles)
        if (jornada.tipo === 'DOBLE') {
            button.textContent = `J${jornada.numero} DOBLE`;
        } else {
            button.textContent = `J${jornada.numero}`;
        }
        
        button.addEventListener('click', () => {
            currentJornada = index + 1;
            displayJornada(currentJornada);
            updateJornadaSelector();
            updateNavButtons();
        });
        
        selector.appendChild(button);
    });
}

// Mostrar jornada específica
function displayJornada(jornadaNum) {
    console.log('🏟️ DisplayJornada llamado con jornada:', jornadaNum);
    const jornada = jornadasData[jornadaNum - 1];
    if (!jornada) {
        console.error('❌ Jornada no encontrada:', jornadaNum, 'Total jornadas:', jornadasData.length);
        return;
    }
    console.log('✅ Jornada encontrada:', jornada.numero, 'con', jornada.partidos?.length || 0, 'partidos');
    
    // Actualizar título
    const currentJornadaElement = document.getElementById('currentJornada');
    if (currentJornadaElement) {
        if (jornada.tipo === 'DOBLE') {
            currentJornadaElement.textContent = `JORNADA ${jornada.numero} DOBLE`;
        } else {
            currentJornadaElement.textContent = `JORNADA ${jornada.numero}`;
        }
    }
    
    // Actualizar fechas
    const jornadaDatesElement = document.getElementById('jornadaDates');
    if (jornadaDatesElement) {
        jornadaDatesElement.textContent = jornada.fechas;
    }
    
    // Mostrar partidos
    console.log('🎯 Llamando displayPartidos con:', jornada.partidos?.length || 0, 'partidos');
    displayPartidos(jornada.partidos || []);
    
    // Actualizar controles
    updateJornadaSelector();
    updateNavButtons();
}

// Mostrar partidos de la jornada
function displayPartidos(partidos) {
    console.log('📅 DisplayPartidos llamado con:', partidos?.length || 0, 'partidos');
    const matchesGrid = document.getElementById('matchesGrid');
    if (!matchesGrid) {
        console.error('❌ Elemento matchesGrid no encontrado');
        return;
    }
    
    console.log('✅ matchesGrid encontrado, limpiando contenido');
    matchesGrid.innerHTML = '';
    
    // Filtrar partidos si hay filtros aplicados
    let partidosToShow = partidos;
    if (selectedTeam || selectedMatchType) {
        partidosToShow = partidos.filter(partido => {
            let includeMatch = true;
            
            if (selectedTeam) {
                const teamMatch = partido.local === selectedTeam || partido.visitante === selectedTeam;
                includeMatch = includeMatch && teamMatch;
            }
            
            if (selectedMatchType && selectedTeam) {
                if (selectedMatchType === 'local') {
                    includeMatch = includeMatch && partido.local === selectedTeam;
                } else if (selectedMatchType === 'visitante') {
                    includeMatch = includeMatch && partido.visitante === selectedTeam;
                }
            }
            
            return includeMatch;
        });
    }
    
    if (partidosToShow.length === 0) {
        const noMatches = document.createElement('div');
        noMatches.className = 'no-matches';
        noMatches.innerHTML = `
            <div class="no-matches-content">
                <i class="fas fa-calendar-times"></i>
                <h3>No hay partidos</h3>
                <p>No se encontraron partidos con los filtros aplicados</p>
            </div>
        `;
        noMatches.style.cssText = `
            text-align: center;
            padding: 60px 20px;
            color: #666;
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        `;
        matchesGrid.appendChild(noMatches);
        return;
    }
    
    partidosToShow.forEach(partido => {
        const partidoCard = createPartidoCard(partido);
        matchesGrid.appendChild(partidoCard);
    });
}

// Crear tarjeta de partido
function createPartidoCard(partido) {
    const card = document.createElement('div');
    card.className = 'partido-card';
    
    card.innerHTML = `
        <div class="partido-header">
            <div class="partido-dia">${partido.dia}</div>
            <div class="partido-hora">${partido.hora}</div>
        </div>
        <div class="partido-teams">
            <div class="team-partido">
                <div class="team-logo-small">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="team-name-small">${partido.local}</div>
            </div>
            <div class="vs-small">VS</div>
            <div class="team-partido">
                <div class="team-logo-small">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="team-name-small">${partido.visitante}</div>
            </div>
        </div>
        <div class="partido-estadio">
            <i class="fas fa-map-marker-alt"></i>
            ${partido.estadio}
        </div>
    `;
    
    // Agregar evento click para mostrar detalles
    card.addEventListener('click', () => {
        showPartidoDetails(partido);
    });
    
    return card;
}

// Actualizar selector de jornadas
function updateJornadaSelector() {
    const buttons = document.querySelectorAll('.jornada-btn');
    buttons.forEach((button, index) => {
        if (index + 1 === currentJornada) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Cambiar vista
function switchView(viewType) {
    currentView = viewType;
    
    const jornadaViewBtn = document.getElementById('jornadaView');
    const monthViewBtn = document.getElementById('monthView');
    const jornadaSection = document.getElementById('jornadaSection');
    const monthSection = document.getElementById('monthSection');
    const matchesSection = document.querySelector('.jornada-matches');
    
    // Actualizar botones
    if (jornadaViewBtn && jornadaViewBtn.classList && monthViewBtn && monthViewBtn.classList) {
        jornadaViewBtn.classList.toggle('active', viewType === 'jornada');
        monthViewBtn.classList.toggle('active', viewType === 'month');
    }
    
    // Mostrar/ocultar secciones
    if (jornadaSection && monthSection && matchesSection) {
        if (viewType === 'jornada') {
            jornadaSection.style.display = 'block';
            monthSection.style.display = 'none';
            matchesSection.style.display = 'block';
            displayJornada(currentJornada);
        } else {
            jornadaSection.style.display = 'none';
            monthSection.style.display = 'block';
            matchesSection.style.display = 'none';
            displayMonthView();
        }
    }
}

// Poblar filtro de equipos
function populateTeamFilter() {
    const teamFilter = document.getElementById('teamFilter');
    if (!teamFilter || !calendarTeamsData.length) return;
    
    // Limpiar opciones existentes (excepto la primera)
    teamFilter.innerHTML = '<option value="">Todos los equipos</option>';
    
    // Agregar equipos
    calendarTeamsData.forEach(team => {
        const option = document.createElement('option');
        option.value = team.name;
        option.textContent = team.name;
        teamFilter.appendChild(option);
    });
}

// Aplicar filtros
function applyFilters() {
    filteredMatches = allMatches.filter(match => {
        let includeMatch = true;
        
        // Filtro por equipo
        if (selectedTeam) {
            const teamMatch = match.local === selectedTeam || 
                             match.visitante === selectedTeam ||
                             match.homeTeam === selectedTeam ||
                             match.awayTeam === selectedTeam;
            includeMatch = includeMatch && teamMatch;
        }
        
        // Filtro por tipo de partido
        if (selectedMatchType && selectedTeam) {
            if (selectedMatchType === 'local') {
                includeMatch = includeMatch && 
                              (match.local === selectedTeam || match.homeTeam === selectedTeam);
            } else if (selectedMatchType === 'visitante') {
                includeMatch = includeMatch && 
                              (match.visitante === selectedTeam || match.awayTeam === selectedTeam);
            }
        }
        
        return includeMatch;
    });
    
    // Actualizar vista actual
    if (currentView === 'jornada') {
        displayJornada(currentJornada);
    } else {
        displayMonthView();
    }
}

// Limpiar filtros
function clearAllFilters() {
    selectedTeam = '';
    selectedMatchType = '';
    
    const teamFilter = document.getElementById('teamFilter');
    const matchTypeFilter = document.getElementById('matchTypeFilter');
    
    if (teamFilter) teamFilter.value = '';
    if (matchTypeFilter) matchTypeFilter.value = '';
    
    filteredMatches = [...allMatches];
    
    // Actualizar vista actual
    if (currentView === 'jornada') {
        displayJornada(currentJornada);
    } else {
        displayMonthView();
    }
}

// Actualizar botones de navegación
function updateNavButtons() {
    const prevButton = document.getElementById('prevJornada');
    const nextButton = document.getElementById('nextJornada');
    
    if (prevButton) {
        prevButton.disabled = currentJornada <= 1;
    }
    
    if (nextButton) {
        nextButton.disabled = currentJornada >= jornadasData.length;
    }
}

// Mostrar detalles del partido
function showPartidoDetails(partido) {
    const modal = document.createElement('div');
    modal.className = 'partido-modal';
    modal.innerHTML = `
        <div class="partido-modal-content">
            <div class="modal-header">
                <h3>Detalles del Partido</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="partido-teams-detail">
                    <div class="team-detail">
                        <div class="team-logo-large">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h4>${partido.local}</h4>
                        <span class="team-type">Local</span>
                    </div>
                    <div class="vs-large">VS</div>
                    <div class="team-detail">
                        <div class="team-logo-large">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h4>${partido.visitante}</h4>
                        <span class="team-type">Visitante</span>
                    </div>
                </div>
                <div class="partido-details">
                    <p><i class="fas fa-calendar-alt"></i> <strong>Día:</strong> ${partido.dia}</p>
                    <p><i class="fas fa-clock"></i> <strong>Hora:</strong> ${partido.hora}</p>
                    <p><i class="fas fa-map-marker-alt"></i> <strong>Estadio:</strong> ${partido.estadio}</p>
                </div>
            </div>
        </div>
    `;
    
    // Estilos del modal
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    const modalContent = modal.querySelector('.partido-modal-content');
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        position: relative;
    `;
    
    // Estilos adicionales para el contenido
    const style = document.createElement('style');
    style.textContent = `
        .partido-teams-detail {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .team-detail {
            flex: 1;
        }
        
        .team-logo-large {
            width: 80px;
            height: 80px;
            background: #f8f9fa;
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            color: #2c5aa0;
        }
        
        .team-detail h4 {
            color: #2c5aa0;
            margin-bottom: 5px;
            font-size: 1.3rem;
        }
        
        .team-type {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .vs-large {
            font-size: 2rem;
            font-weight: 700;
            color: #666;
            padding: 0 30px;
        }
        
        .partido-details {
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        
        .partido-details p {
            margin: 10px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .close-modal {
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: #999;
        }
        
        .close-modal:hover {
            color: #666;
        }
        
        .modal-header {
            text-align: center;
            margin-bottom: 20px;
            color: #2c5aa0;
        }
    `;
    
    document.head.appendChild(style);
    
    // Cerrar modal
    const closeButton = modal.querySelector('.close-modal');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        }
    });
    
    document.body.appendChild(modal);
}

// Ir a jornada específica (función de utilidad)
function goToJornada(jornadaNum) {
    if (jornadaNum >= 1 && jornadaNum <= jornadasData.length) {
        currentJornada = jornadaNum;
        displayJornada(currentJornada);
        updateJornadaSelector();
        updateNavButtons();
    }
}

// Obtener jornada actual (función de utilidad)
function getCurrentJornada() {
    return currentJornada;
}

// Mostrar vista mensual
function displayMonthView() {
    const currentMonthElement = document.getElementById('currentMonth');
    const calendarGrid = document.getElementById('calendarGrid');
    
    if (currentMonthElement) {
        currentMonthElement.textContent = `${months[currentMonth]} ${currentYear}`;
    }
    
    if (calendarGrid) {
        generateCalendarGrid();
    }
}

// Generar grilla del calendario
function generateCalendarGrid() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    // Agregar encabezados de días
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // Obtener primer día del mes y días en el mes
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();
    
    // Días del mes anterior
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = startDate - 1; i >= 0; i--) {
        const dayElement = createCalendarDay(
            prevMonthLastDay - i, 
            prevMonth, 
            prevYear, 
            true
        );
        calendarGrid.appendChild(dayElement);
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createCalendarDay(day, currentMonth, currentYear, false);
        calendarGrid.appendChild(dayElement);
    }
    
    // Días del siguiente mes
    const totalCells = calendarGrid.children.length - 7; // -7 por los headers
    const remainingCells = 42 - totalCells; // 6 semanas * 7 días
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createCalendarDay(day, nextMonth, nextYear, true);
        calendarGrid.appendChild(dayElement);
    }
}

// Crear elemento de día del calendario
function createCalendarDay(day, month, year, otherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (otherMonth) {
        dayElement.classList.add('other-month');
    }
    
    // Verificar si es hoy
    const today = new Date();
    const dayDate = new Date(year, month, day);
    if (dayDate.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    }
    
    // Número del día
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    // Partidos del día
    const dayMatches = document.createElement('div');
    dayMatches.className = 'day-matches';
    
    // Buscar partidos para este día
    const dayMatchesData = filteredMatches.filter(match => {
        const matchDate = match.date || parseMatchDate(match.dia, match.hora);
        if (!matchDate) return false;
        
        return matchDate.getDate() === day &&
               matchDate.getMonth() === month &&
               matchDate.getFullYear() === year;
    });
    
    dayMatchesData.forEach(match => {
        const matchElement = document.createElement('div');
        matchElement.className = 'day-match';
        
        const homeTeam = match.local || match.homeTeam || 'TBD';
        const awayTeam = match.visitante || match.awayTeam || 'TBD';
        
        matchElement.textContent = `${homeTeam.substring(0, 3)} vs ${awayTeam.substring(0, 3)}`;
        matchElement.addEventListener('click', (e) => {
            e.stopPropagation();
            showMatchDetails(match);
        });
        
        dayMatches.appendChild(matchElement);
    });
    
    dayElement.appendChild(dayMatches);
    
    return dayElement;
}

// Parsear fecha de partido
function parseMatchDate(dia, hora) {
    if (!dia || !hora) return null;
    
    try {
        // Asumiendo formato básico - esto debería mejorarse con datos reales
        const currentDate = new Date();
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(dia));
    } catch (error) {
        return null;
    }
}

// Mostrar detalles del partido
function showMatchDetails(match) {
    const modal = document.createElement('div');
    modal.className = 'match-details-modal';
    
    const homeTeam = match.local || match.homeTeam || 'TBD';
    const awayTeam = match.visitante || match.awayTeam || 'TBD';
    const stadium = match.estadio || match.stadium || 'Estadio por confirmar';
    const time = match.hora || match.time || 'Hora por confirmar';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Detalles del Partido</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="match-teams-detail">
                    <div class="team-detail">
                        <div class="team-logo-large">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h4>${homeTeam}</h4>
                        <span class="team-type">Local</span>
                    </div>
                    <div class="vs-large">VS</div>
                    <div class="team-detail">
                        <div class="team-logo-large">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h4>${awayTeam}</h4>
                        <span class="team-type">Visitante</span>
                    </div>
                </div>
                <div class="match-details">
                    <p><i class="fas fa-clock"></i> <strong>Hora:</strong> ${time}</p>
                    <p><i class="fas fa-map-marker-alt"></i> <strong>Estadio:</strong> ${stadium}</p>
                    ${match.jornada ? `<p><i class="fas fa-calendar-alt"></i> <strong>Jornada:</strong> ${match.jornada}</p>` : ''}
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        position: relative;
    `;
    
    // Cerrar modal
    const closeButton = modal.querySelector('.close-modal');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    document.body.appendChild(modal);
}

// Mostrar mensaje de error
function showErrorMessage(message) {
    console.error(message);
    // Implementar notificación visual si es necesario
}

// Exportar funciones para uso global
window.calendarApp = {
    switchView,
    goToJornada,
    getCurrentJornada,
    displayJornada,
    displayMonthView,
    applyFilters,
    clearAllFilters,
    jornadasData: () => jornadasData,
    teamsData: () => calendarTeamsData,
    allMatches: () => allMatches
};