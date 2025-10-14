// Main JavaScript file for UltraGol website by L3HO
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Global variables
let teamsData = [];
let standingsData = [];
let fixturesData = [];

// Initialize the application
function initializeApp() {
    setupNavigation();
    setupCarousel();
    setupScrollAnimations();
    loadInitialData();
    setupCounterAnimations();
    setupThemeSystem();
    setupAdvancedFeatures();
    setupAuthIntegration();
    // Initialize user interface after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupUserInterface);
    } else {
        setupUserInterface();
    }
}

// Navigation functionality
function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

// Scroll animations using Intersection Observer
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                
                // Trigger counter animations
                if (entry.target.classList.contains('stats-section')) {
                    animateCounters();
                }
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations
    document.querySelectorAll('.scroll-reveal, .stats-section, .team-card').forEach(el => {
        observer.observe(el);
    });
}

// Counter animations for statistics
function setupCounterAnimations() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
        counter.textContent = '0';
    });
}

function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60 FPS
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            counter.textContent = Math.floor(current);
            
            if (current >= target) {
                counter.textContent = target;
                clearInterval(timer);
            }
        }, 16);
    });
}

// Theme system for team colors
function setupThemeSystem() {
    const selectedTeam = localStorage.getItem('selectedTeam');
    if (selectedTeam) {
        applyTeamTheme(selectedTeam);
    }
}

function applyTeamTheme(teamId) {
    const team = teamsData.find(t => t.id === teamId);
    if (!team) return;

    const root = document.documentElement;
    root.style.setProperty('--team-primary', team.colors.primary);
    root.style.setProperty('--team-secondary', team.colors.secondary);
    
    // Add team class to body
    document.body.className = document.body.className.replace(/team-\w+/g, '');
    document.body.classList.add(`team-${team.id}`);
}

// Data loading functions
async function loadInitialData() {
    try {
        await Promise.all([
            loadTeamsData(),
            loadStandingsData(),
            loadFixturesData()
        ]);

        // Load page-specific content
        if (document.getElementById('topTeamsPreview')) {
            loadTopTeamsPreview();
        }
        if (document.getElementById('recentMatches')) {
            loadRecentMatches();
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
        showErrorMessage('Error al cargar los datos. Por favor, recarga la página.');
    }
}

async function loadTeamsData() {
    try {
        // Usar API de UltraGol
        teamsData = await ultraGolAPI.getEquipos();
        console.log('✅ Teams data loaded from API:', teamsData.length, 'teams');
        return teamsData;
    } catch (error) {
        console.error('Error loading teams data from API:', error);
        // Fallback a JSON local si la API falla
        try {
            const response = await fetch('data/teams.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            teamsData = await response.json();
            console.log('⚠️ Teams data loaded from local JSON fallback');
            return teamsData;
        } catch (fallbackError) {
            console.error('Error in fallback:', fallbackError);
            return [];
        }
    }
}

async function loadStandingsData() {
    try {
        // Usar API de UltraGol
        standingsData = await ultraGolAPI.getTabla();
        console.log('✅ Standings data loaded from API:', standingsData.length, 'teams');
        return standingsData;
    } catch (error) {
        console.error('Error loading standings data from API:', error);
        // Fallback a JSON local si la API falla
        try {
            const response = await fetch('data/standings.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            standingsData = await response.json();
            console.log('⚠️ Standings data loaded from local JSON fallback');
            return standingsData;
        } catch (fallbackError) {
            console.error('Error in fallback:', fallbackError);
            return [];
        }
    }
}

async function loadFixturesData() {
    try {
        const response = await fetch('data/fixtures.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        fixturesData = await response.json();
        console.log('✅ Fixtures data loaded:', fixturesData.length, 'fixtures');
        return fixturesData;
    } catch (error) {
        console.error('Error loading fixtures data:', error);
        return [];
    }
}

// Homepage content loaders
function loadTopTeamsPreview() {
    const container = document.getElementById('topTeamsPreview');
    if (!container || !standingsData.length) return;

    const topTeams = standingsData.slice(0, 3);
    
    container.innerHTML = topTeams.map((team, index) => `
        <div class="team-preview-card stagger-item" style="animation-delay: ${index * 0.2}s">
            <div class="team-position">${team.position}° Lugar</div>
            <div class="team-name">${team.name}</div>
            <div class="team-points">${team.points} pts</div>
            <div class="team-stats">
                <span>PJ: ${team.played}</span>
                <span>G: ${team.wins}</span>
                <span>E: ${team.draws}</span>
                <span>P: ${team.losses}</span>
            </div>
        </div>
    `).join('');
}

function loadRecentMatches() {
    const container = document.getElementById('recentMatches');
    if (!container || !fixturesData.length) return;

    const recentMatches = fixturesData
        .filter(match => match.status === 'completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    container.innerHTML = recentMatches.map((match, index) => `
        <div class="match-card stagger-item" style="animation-delay: ${index * 0.1}s">
            <div class="match-header">
                <span class="match-date">${formatDate(match.date)}</span>
                <span class="match-status completed">Finalizado</span>
            </div>
            <div class="match-teams">
                <div class="team-info">
                    <div class="team-logo"></div>
                    <span>${match.homeTeam}</span>
                </div>
                <div class="match-score">
                    ${match.homeScore} - ${match.awayScore}
                </div>
                <div class="team-info">
                    <span>${match.awayTeam}</span>
                    <div class="team-logo"></div>
                </div>
            </div>
        </div>
    `).join('');
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('es-ES', options);
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideLeft 0.3s ease-out;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.style.animation = 'slideRight 0.3s ease-out forwards';
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 300);
    }, 5000);
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideLeft 0.3s ease-out;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideRight 0.3s ease-out forwards';
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 300);
    }, 3000);
}

// Loading state management
function showLoading(container) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-spinner"></div>
        <p class="loading-text">Cargando<span class="loading-dots"></span></p>
    `;
}

function hideLoading() {
    document.querySelectorAll('.loading-spinner, .loading-text').forEach(el => {
        el.remove();
    });
}

// Local storage helpers
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

// Search and filter utilities
function searchTeams(query, teams = teamsData) {
    if (!query) return teams;
    
    const lowerQuery = query.toLowerCase();
    return teams.filter(team => 
        team.name.toLowerCase().includes(lowerQuery) ||
        team.nickname.toLowerCase().includes(lowerQuery) ||
        team.city.toLowerCase().includes(lowerQuery)
    );
}

function filterTeamsByRegion(region, teams = teamsData) {
    if (!region || region === 'all') return teams;
    
    return teams.filter(team => team.region === region);
}

// Advanced Carousel System
function setupCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    
    let currentSlide = 0;
    let isTransitioning = false;
    let autoSlideInterval;
    
    // Auto-slide functionality
    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            nextSlide();
        }, 5000); // Change slide every 5 seconds
    }
    
    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }
    
    function showSlide(index) {
        if (isTransitioning) return;
        isTransitioning = true;
        
        // Remove active class from all slides and indicators
        slides.forEach(slide => {
            slide.classList.remove('active', 'prev');
        });
        indicators.forEach(indicator => {
            indicator.classList.remove('active');
        });
        
        // Set previous slide
        if (slides[currentSlide]) {
            slides[currentSlide].classList.add('prev');
        }
        
        // Update current slide
        currentSlide = index;
        
        // Show new slide
        setTimeout(() => {
            slides[currentSlide].classList.add('active');
            indicators[currentSlide].classList.add('active');
            isTransitioning = false;
        }, 100);
    }
    
    function nextSlide() {
        const nextIndex = (currentSlide + 1) % slides.length;
        showSlide(nextIndex);
    }
    
    function prevSlide() {
        const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prevIndex);
    }
    
    // Event listeners removed - buttons no longer exist
    
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => showSlide(index));
    });
    
    // Pause auto-slide on hover
    const carousel = document.querySelector('.hero-carousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', stopAutoSlide);
        carousel.addEventListener('mouseleave', startAutoSlide);
        
        // Touch/swipe support for mobile
        let startX = 0;
        let endX = 0;
        let startY = 0;
        let endY = 0;
        
        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        carousel.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            handleSwipe();
        });
        
        function handleSwipe() {
            const threshold = 50;
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Solo tratar como swipe horizontal si el movimiento horizontal es mayor que el vertical
            if (Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
            // Si el movimiento vertical es mayor, no hacer nada (permitir scroll normal)
        }
    }
    
    // Start auto-slide
    startAutoSlide();
}

// Advanced Features Setup
function setupAdvancedFeatures() {
    setupSearchFunctionality();
    setupFilterSystem();
    setupRealTimeUpdates();
    setupDataVisualization();
    setupTeamComparison();
    setupInteractiveStats();
}

// Real-time updates placeholder (for static website)
function setupRealTimeUpdates() {
    // Placeholder for real-time updates functionality
    // In a static website, this would typically involve periodic data refreshing
    console.log('Real-time updates system initialized (static mode)');
}

// Data visualization placeholder
function setupDataVisualization() {
    // Placeholder for data visualization features
    // Could be expanded with chart libraries in the future
    console.log('Data visualization system initialized');
}

// User Interface Setup
function setupUserInterface() {
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('profileDropdown');
        
        if (userMenu && !userMenu.contains(event.target)) {
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }
    });
    
    // Setup authentication forms
    setupAuthForms();
}

// Toggle profile dropdown
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const icon = document.getElementById('dropdownIcon');
    
    if (dropdown) {
        if (dropdown.style.display === 'none' || !dropdown.style.display) {
            dropdown.style.display = 'block';
            if (icon) icon.style.transform = 'rotate(180deg)';
        } else {
            dropdown.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    }
}

// User profile functions
function openUserProfile() {
    window.location.href = 'user-profile.html';
}

function openUserPreferences() {
    console.log('Opening preferences...');
}

function openUserFavorites() {
    console.log('Opening favorites...');
}

function openUserStats() {
    console.log('Opening user stats...');
}

// Authentication modal functions
function openAuthModal(mode) {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        showAuthTab(mode);
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const modalTitle = document.getElementById('authModalTitle');
    
    if (tab === 'login') {
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
        if (modalTitle) modalTitle.textContent = 'Iniciar Sesión';
    } else {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (loginTab) loginTab.classList.remove('active');
        if (registerTab) registerTab.classList.add('active');
        if (modalTitle) modalTitle.textContent = 'Crear Cuenta';
    }
}

// Setup authentication forms
function setupAuthForms() {
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (window.signInWithEmail) {
                const result = await window.signInWithEmail(email, password);
                if (result.success) {
                    closeAuthModal();
                } else {
                    alert('Error: ' + result.error);
                }
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const favoriteTeam = document.getElementById('registerFavoriteTeam').value;
            
            if (window.signUpWithEmail) {
                const result = await window.signUpWithEmail(email, password, name, favoriteTeam);
                if (result.success) {
                    closeAuthModal();
                } else {
                    alert('Error: ' + result.error);
                }
            }
        });
    }
}

// Global logout function
window.logoutUser = async function() {
    if (window.signOutUser) {
        const result = await window.signOutUser();
        if (result.success) {
            window.location.href = 'index.html';
        }
    }
};

// Make functions globally available
window.toggleProfileDropdown = toggleProfileDropdown;
window.openUserProfile = openUserProfile;
window.openUserPreferences = openUserPreferences;
window.openUserFavorites = openUserFavorites;
window.openUserStats = openUserStats;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.showAuthTab = showAuthTab;

// Enhanced Search Functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('globalSearch');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performGlobalSearch(e.target.value);
        }, 300);
    });
}

function performGlobalSearch(query) {
    if (!query) {
        hideSearchResults();
        return;
    }
    
    const results = {
        teams: searchTeams(query),
        matches: searchMatches(query),
        players: searchPlayers(query)
    };
    
    displaySearchResults(results);
}

// Display Search Results
function displaySearchResults(results) {
    let existingResults = document.getElementById('searchResults');
    
    if (!existingResults) {
        existingResults = document.createElement('div');
        existingResults.id = 'searchResults';
        existingResults.className = 'search-results';
        
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.appendChild(existingResults);
        }
    }
    
    const totalResults = results.teams.length + results.matches.length;
    
    if (totalResults === 0) {
        existingResults.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <p>No se encontraron resultados</p>
            </div>
        `;
        return;
    }
    
    let resultsHTML = '<div class="search-results-container">';
    
    if (results.teams.length > 0) {
        resultsHTML += '<div class="search-section">';
        resultsHTML += '<h4><i class="fas fa-shield-alt"></i> Equipos</h4>';
        results.teams.slice(0, 5).forEach(team => {
            resultsHTML += `
                <div class="search-result-item" onclick="goToTeam('${team.id}')">
                    <div class="result-icon"><i class="fas fa-shield-alt"></i></div>
                    <div class="result-info">
                        <span class="result-title">${team.name}</span>
                        <span class="result-subtitle">${team.nickname} - ${team.city}</span>
                    </div>
                </div>
            `;
        });
        resultsHTML += '</div>';
    }
    
    if (results.matches.length > 0) {
        resultsHTML += '<div class="search-section">';
        resultsHTML += '<h4><i class="fas fa-futbol"></i> Partidos</h4>';
        results.matches.slice(0, 5).forEach(match => {
            resultsHTML += `
                <div class="search-result-item">
                    <div class="result-icon"><i class="fas fa-futbol"></i></div>
                    <div class="result-info">
                        <span class="result-title">${match.homeTeam} vs ${match.awayTeam}</span>
                        <span class="result-subtitle">${formatDate(match.date)}</span>
                    </div>
                </div>
            `;
        });
        resultsHTML += '</div>';
    }
    
    resultsHTML += '</div>';
    existingResults.innerHTML = resultsHTML;
    
    // Add search results styles
    if (!document.getElementById('search-results-styles')) {
        addSearchResultsStyles();
    }
}

// Hide Search Results
function hideSearchResults() {
    const existingResults = document.getElementById('searchResults');
    if (existingResults) {
        existingResults.innerHTML = '';
    }
}

// Go to Team
function goToTeam(teamId) {
    window.location.href = `team-profile.html?team=${teamId}`;
}

// Add Search Results Styles
function addSearchResultsStyles() {
    const style = document.createElement('style');
    style.id = 'search-results-styles';
    style.textContent = `
        .search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .search-results-container {
            padding: 15px;
        }
        
        .search-section {
            margin-bottom: 15px;
        }
        
        .search-section h4 {
            color: #ff9933;
            font-size: 0.9rem;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .search-result-item {
            display: flex;
            align-items: center;
            padding: 8px;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.2s ease;
            gap: 10px;
        }
        
        .search-result-item:hover {
            background: rgba(255, 153, 51, 0.1);
        }
        
        .result-icon {
            width: 30px;
            height: 30px;
            background: rgba(255, 153, 51, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ff9933;
            font-size: 0.8rem;
        }
        
        .result-info {
            flex: 1;
        }
        
        .result-title {
            display: block;
            color: #333;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .result-subtitle {
            display: block;
            color: #666;
            font-size: 0.8rem;
        }
        
        .search-no-results {
            text-align: center;
            padding: 30px;
            color: #666;
        }
        
        .search-no-results i {
            font-size: 2rem;
            color: #ccc;
            margin-bottom: 10px;
        }
    `;
    document.head.appendChild(style);
}

function searchMatches(query) {
    return fixturesData.filter(match => 
        match.homeTeam.toLowerCase().includes(query.toLowerCase()) ||
        match.awayTeam.toLowerCase().includes(query.toLowerCase())
    );
}

function searchPlayers(query) {
    // This would search through player data when available
    return [];
}

// Advanced Filter System
function setupFilterSystem() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filterType = e.target.dataset.filter;
            const filterValue = e.target.dataset.value;
            applyFilter(filterType, filterValue);
        });
    });
}

function applyFilter(type, value) {
    let filteredData;
    
    switch(type) {
        case 'region':
            filteredData = filterTeamsByRegion(value);
            break;
        case 'status':
            filteredData = filterMatchesByStatus(value);
            break;
        default:
            return;
    }
    
    updateDisplayedData(filteredData, type);
}

// Enhanced Team Comparison
function compareTeams(team1Id, team2Id) {
    const team1 = standingsData.find(t => t.id === team1Id || t.name === team1Id);
    const team2 = standingsData.find(t => t.id === team2Id || t.name === team2Id);
    
    if (!team1 || !team2) return null;
    
    return {
        team1: team1,
        team2: team2,
        comparison: {
            pointsDiff: team1.points - team2.points,
            winsDiff: team1.wins - team2.wins,
            goalsDiff: (team1.goalsFor - team1.goalsAgainst) - (team2.goalsFor - team2.goalsAgainst),
            positionDiff: team2.position - team1.position
        }
    };
}

// Setup Team Comparison
function setupTeamComparison() {
    const team1Select = document.getElementById('team1Select');
    const team2Select = document.getElementById('team2Select');
    const compareBtn = document.getElementById('compareBtn');
    const comparisonResults = document.getElementById('comparisonResults');
    
    if (!team1Select || !team2Select || !compareBtn) return;
    
    // Populate team selectors
    populateTeamSelectors();
    
    compareBtn.addEventListener('click', () => {
        const team1 = team1Select.value;
        const team2 = team2Select.value;
        
        if (team1 && team2 && team1 !== team2) {
            const comparison = compareTeams(team1, team2);
            if (comparison && comparisonResults) {
                displayComparisonResults(comparison, comparisonResults);
            }
        } else {
            showErrorMessage('Por favor selecciona dos equipos diferentes');
        }
    });
}

// Populate Team Selectors
function populateTeamSelectors() {
    const team1Select = document.getElementById('team1Select');
    const team2Select = document.getElementById('team2Select');
    
    if (!team1Select || !team2Select || !standingsData.length) return;
    
    standingsData.forEach(team => {
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

// Display Comparison Results
function displayComparisonResults(comparison, container) {
    const { team1, team2, comparison: stats } = comparison;
    
    container.innerHTML = `
        <div class="comparison-result">
            <div class="team-comparison-card">
                <div class="team-comparison-header">
                    <h3>Comparación de Equipos</h3>
                    <button class="close-comparison" onclick="this.parentElement.parentElement.parentElement.innerHTML = ''">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="teams-comparison">
                    <div class="team-comparison-side">
                        <div class="team-logo-comparison">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h4>${team1.name}</h4>
                        <div class="team-stats">
                            <div class="stat-item">
                                <span class="stat-label">Posición</span>
                                <span class="stat-value ${stats.positionDiff > 0 ? 'better' : stats.positionDiff < 0 ? 'worse' : 'equal'}">${team1.position}°</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Puntos</span>
                                <span class="stat-value ${stats.pointsDiff > 0 ? 'better' : stats.pointsDiff < 0 ? 'worse' : 'equal'}">${team1.points}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Victorias</span>
                                <span class="stat-value ${stats.winsDiff > 0 ? 'better' : stats.winsDiff < 0 ? 'worse' : 'equal'}">${team1.wins}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Dif. Goles</span>
                                <span class="stat-value ${stats.goalsDiff > 0 ? 'better' : stats.goalsDiff < 0 ? 'worse' : 'equal'}">${team1.goalsFor - team1.goalsAgainst > 0 ? '+' : ''}${team1.goalsFor - team1.goalsAgainst}</span>
                            </div>
                        </div>
                    </div>
                    <div class="vs-comparison">
                        <div class="vs-circle">
                            <span>VS</span>
                        </div>
                        <div class="comparison-summary">
                            ${stats.pointsDiff > 0 ? 
                                `<p><i class="fas fa-trophy text-success"></i> ${team1.name} está ${Math.abs(stats.pointsDiff)} puntos arriba</p>` :
                                stats.pointsDiff < 0 ?
                                `<p><i class="fas fa-trophy text-success"></i> ${team2.name} está ${Math.abs(stats.pointsDiff)} puntos arriba</p>` :
                                '<p><i class="fas fa-equals"></i> Empatados en puntos</p>'
                            }
                        </div>
                    </div>
                    <div class="team-comparison-side">
                        <div class="team-logo-comparison">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h4>${team2.name}</h4>
                        <div class="team-stats">
                            <div class="stat-item">
                                <span class="stat-label">Posición</span>
                                <span class="stat-value ${stats.positionDiff < 0 ? 'better' : stats.positionDiff > 0 ? 'worse' : 'equal'}">${team2.position}°</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Puntos</span>
                                <span class="stat-value ${stats.pointsDiff < 0 ? 'better' : stats.pointsDiff > 0 ? 'worse' : 'equal'}">${team2.points}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Victorias</span>
                                <span class="stat-value ${stats.winsDiff < 0 ? 'better' : stats.winsDiff > 0 ? 'worse' : 'equal'}">${team2.wins}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Dif. Goles</span>
                                <span class="stat-value ${stats.goalsDiff < 0 ? 'better' : stats.goalsDiff > 0 ? 'worse' : 'equal'}">${team2.goalsFor - team2.goalsAgainst > 0 ? '+' : ''}${team2.goalsFor - team2.goalsAgainst}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add styles for comparison
    if (!document.getElementById('comparison-styles')) {
        addComparisonStyles();
    }
}

// Add Comparison Styles
function addComparisonStyles() {
    const style = document.createElement('style');
    style.id = 'comparison-styles';
    style.textContent = `
        .comparison-result {
            margin-top: 20px;
            animation: slideDown 0.3s ease-out;
        }
        
        .team-comparison-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 2px solid #ff9933;
        }
        
        .team-comparison-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #ff9933;
        }
        
        .team-comparison-header h3 {
            color: #ff9933;
            font-size: 1.3rem;
            font-weight: 700;
        }
        
        .close-comparison {
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .close-comparison:hover {
            background: #c82333;
            transform: scale(1.1);
        }
        
        .teams-comparison {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 20px;
            align-items: center;
        }
        
        .team-comparison-side {
            text-align: center;
        }
        
        .team-logo-comparison {
            width: 60px;
            height: 60px;
            background: rgba(255, 153, 51, 0.1);
            border-radius: 50%;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: #ff9933;
        }
        
        .team-comparison-side h4 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        
        .team-stats {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 5px;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #666;
            font-weight: 500;
        }
        
        .stat-value {
            font-weight: 700;
            font-size: 0.9rem;
        }
        
        .stat-value.better {
            color: #28a745;
        }
        
        .stat-value.worse {
            color: #dc3545;
        }
        
        .stat-value.equal {
            color: #6c757d;
        }
        
        .vs-comparison {
            text-align: center;
        }
        
        .vs-circle {
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
            margin: 0 auto 10px;
        }
        
        .comparison-summary {
            font-size: 0.9rem;
            color: #666;
        }
        
        .text-success {
            color: #28a745;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @media (max-width: 768px) {
            .teams-comparison {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .vs-comparison {
                order: -1;
            }
        }
    `;
    document.head.appendChild(style);
}

// Setup Interactive Statistics
function setupInteractiveStats() {
    // Animate counters when in view
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(statsSection);
    }
    
    // Add click-to-refresh functionality
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = '';
                const counter = card.querySelector('[data-count]');
                if (counter) {
                    animateSingleCounter(counter);
                }
            }, 150);
        });
        
        // Add tooltip
        card.setAttribute('title', 'Haz clic para actualizar');
    });
}

// Animate Single Counter
function animateSingleCounter(counter) {
    const target = parseInt(counter.getAttribute('data-count'));
    const duration = 1000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        counter.textContent = Math.floor(current);
        
        if (current >= target) {
            counter.textContent = target;
            clearInterval(timer);
        }
    }, 16);
}

// Enhanced Filter System
function applyAdvancedFilter(type, value) {
    let filteredData;
    
    switch(type) {
        case 'region':
            filteredData = filterTeamsByRegion(value);
            updateTeamsDisplay(filteredData);
            break;
        case 'status':
            filteredData = filterMatchesByStatus(value);
            updateMatchesDisplay(filteredData);
            break;
        case 'team-performance':
            filteredData = filterTeamsByPerformance(value);
            updateTeamsDisplay(filteredData);
            break;
        default:
            return;
    }
    
    // Update filter buttons
    updateFilterButtons(type, value);
}

// Filter Teams by Performance
function filterTeamsByPerformance(performance) {
    if (!performance || performance === 'all') return standingsData;
    
    switch(performance) {
        case 'top':
            return standingsData.slice(0, 6);
        case 'middle':
            return standingsData.slice(6, 12);
        case 'bottom':
            return standingsData.slice(12);
        default:
            return standingsData;
    }
}

// Update Teams Display
function updateTeamsDisplay(teams) {
    const container = document.getElementById('topTeamsPreview');
    if (!container) return;
    
    container.innerHTML = teams.slice(0, 3).map((team, index) => `
        <div class="team-preview-card stagger-item" style="animation-delay: ${index * 0.2}s">
            <div class="team-position">${team.position}° Lugar</div>
            <div class="team-name">${team.name}</div>
            <div class="team-points">${team.points} pts</div>
            <div class="team-stats">
                <span>PJ: ${team.played}</span>
                <span>G: ${team.wins}</span>
                <span>E: ${team.draws}</span>
                <span>P: ${team.losses}</span>
            </div>
            <button class="team-details-btn" onclick="goToTeam('${team.id}')">
                <i class="fas fa-eye"></i> Ver Detalles
            </button>
        </div>
    `).join('');
}

// Update Filter Buttons
function updateFilterButtons(type, value) {
    const filterButtons = document.querySelectorAll(`[data-filter="${type}"]`);
    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === value);
    });
}

// Authentication Integration System
function setupAuthIntegration() {
    // Wait for Firebase to be available
    const waitForFirebase = () => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            initializeAuthSystem();
        } else {
            setTimeout(waitForFirebase, 500);
        }
    };
    waitForFirebase();
}

function initializeAuthSystem() {
    // Listen for authentication state changes
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            console.log('✅ Usuario autenticado:', user.displayName || user.email);
            showUserInterface(user);
            enableAuthenticatedFeatures(user);
            loadUserProfile(user);
        } else {
            // User is signed out
            console.log('❌ Usuario no autenticado');
            showAuthInterface();
            disableAuthenticatedFeatures();
        }
    });
    
    setupAuthModals();
}

// Show user interface when logged in
function showUserInterface(user) {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userDisplayName = document.getElementById('userDisplayName');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userDisplayName) userDisplayName.textContent = user.displayName || 'Usuario';
    
    updateUserStats(user);
}

// Show auth interface when logged out
function showAuthInterface() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
}

// Enable features that require authentication
function enableAuthenticatedFeatures(user) {
    // Enable comments
    enableCommentsSystem(user);
    
    // Enable match links sharing
    enableMatchLinksSystem(user);
    
    // Enable notifications
    enableNotificationSystem(user);
    
    // Show authenticated content
    showAuthenticatedContent();
}

// Disable features when not authenticated
function disableAuthenticatedFeatures() {
    // Disable comments
    disableCommentsSystem();
    
    // Disable match links sharing
    disableMatchLinksSystem();
    
    // Disable notifications
    disableNotificationSystem();
    
    // Show login prompts
    showLoginPrompts();
}

// Enable comments system
function enableCommentsSystem(user) {
    // Update existing comments section
    const commentsSection = document.querySelector('.comments-section');
    if (commentsSection) {
        const commentForm = `
            <div class="comment-form-active" style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(45deg, #ff9933, #ffaa44); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <strong>${user.displayName || 'Usuario'}</strong>
                        <div style="font-size: 12px; color: #666;">Conectado y listo para comentar</div>
                    </div>
                </div>
                <form id="quickCommentForm">
                    <textarea id="quickCommentText" placeholder="¿Qué opinas sobre este partido? Comparte tu análisis..." 
                              style="width: 100%; padding: 15px; border: 2px solid #e9ecef; border-radius: 8px; resize: vertical; min-height: 100px; font-family: inherit;" 
                              maxlength="500"></textarea>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                        <div style="display: flex; gap: 10px;">
                            <button type="button" onclick="addEmoji('⚽')" style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 8px 12px; border-radius: 6px; cursor: pointer;">⚽</button>
                            <button type="button" onclick="addEmoji('🔥')" style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 8px 12px; border-radius: 6px; cursor: pointer;">🔥</button>
                            <button type="button" onclick="addEmoji('👏')" style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 8px 12px; border-radius: 6px; cursor: pointer;">👏</button>
                            <button type="button" onclick="addEmoji('⭐')" style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 8px 12px; border-radius: 6px; cursor: pointer;">⭐</button>
                        </div>
                        <button type="submit" style="background: linear-gradient(45deg, #ff9933, #ffaa44); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            <i class="fas fa-paper-plane"></i> Comentar (+5 puntos)
                        </button>
                    </div>
                </form>
            </div>
            <div style="background: white; border-radius: 10px; padding: 20px; margin-top: 20px;">
                <h3 style="margin-bottom: 20px; color: #333;">Comentarios Recientes</h3>
                <div id="commentsList">
                    <p style="text-align: center; color: #666; padding: 40px;">Los comentarios aparecerán aquí...</p>
                </div>
            </div>
        `;
        
        const container = commentsSection.querySelector('.container > div');
        if (container) {
            container.innerHTML = commentForm;
        }
        
        setupCommentForm(user);
    }
}

// Disable comments system
function disableCommentsSystem() {
    const commentsSection = document.querySelector('.comments-section');
    if (commentsSection) {
        const container = commentsSection.querySelector('.container > div');
        if (container) {
            container.innerHTML = `
                <p style="text-align: center; color: #666; margin: 20px 0;">
                    <i class="fas fa-lock" style="font-size: 24px; color: #ccc; display: block; margin-bottom: 10px;"></i>
                    Inicia sesión para comentar y participar en la comunidad
                </p>
                <div style="text-align: center;">
                    <button onclick="openAuthModal('login')" style="background: linear-gradient(45deg, #ff9933, #ffaa44); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; margin-right: 10px;">
                        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                    </button>
                    <button onclick="openAuthModal('register')" style="background: #2c5aa0; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-user-plus"></i> Registrarse
                    </button>
                </div>
            `;
        }
    }
}

// Enable match links system
function enableMatchLinksSystem(user) {
    const linksSection = document.querySelector('[style*="background: linear-gradient(135deg, #1a1a1a"]');
    if (linksSection) {
        const container = linksSection.querySelector('.container > div');
        if (container) {
            container.innerHTML = `
                <div style="background: rgba(255,255,255,0.1); border-radius: 10px; padding: 20px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(45deg, #ff9933, #ffaa44); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <strong style="color: white;">${user.displayName || 'Usuario'}</strong>
                            <div style="font-size: 12px; color: #ccc;">¡Ya puedes compartir links!</div>
                        </div>
                    </div>
                    <form id="linkSharingForm" style="display: flex; gap: 15px; flex-wrap: wrap; align-items: end;">
                        <div style="flex: 1; min-width: 200px;">
                            <label style="display: block; color: #ccc; margin-bottom: 5px; font-size: 14px;">URL del Stream</label>
                            <input type="url" id="streamUrl" placeholder="https://..." 
                                   style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; background: rgba(255,255,255,0.1); color: white;" required>
                        </div>
                        <div>
                            <label style="display: block; color: #ccc; margin-bottom: 5px; font-size: 14px;">Calidad</label>
                            <select id="streamQuality" style="padding: 12px; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; background: rgba(255,255,255,0.1); color: white;">
                                <option value="HD">HD</option>
                                <option value="SD">SD</option>
                                <option value="4K">4K</option>
                            </select>
                        </div>
                        <button type="submit" style="background: linear-gradient(45deg, #ff9933, #ffaa44); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            <i class="fas fa-share-alt"></i> Compartir (+10 puntos)
                        </button>
                    </form>
                </div>
                <div style="margin-top: 30px;">
                    <h3 style="color: white; margin-bottom: 20px;">Links Recientes</h3>
                    <div id="linksList">
                        <p style="text-align: center; color: #ccc; padding: 20px;">Los links compartidos aparecerán aquí...</p>
                    </div>
                </div>
            `;
        }
        
        setupLinkSharingForm(user);
    }
}

// Disable match links system
function disableMatchLinksSystem() {
    const linksSection = document.querySelector('[style*="background: linear-gradient(135deg, #1a1a1a"]');
    if (linksSection) {
        const container = linksSection.querySelector('.container > div');
        if (container) {
            container.innerHTML = `
                <div style="background: rgba(255,255,255,0.1); border-radius: 10px; padding: 20px; text-align: center;">
                    <p style="margin: 20px 0; color: #ccc;">
                        <i class="fas fa-tv" style="font-size: 24px; color: #ff9933; display: block; margin-bottom: 10px;"></i>
                        Comparte y descubre enlaces de transmisión de partidos
                    </p>
                    <button onclick="openAuthModal('register')" style="background: linear-gradient(45deg, #ff9933, #ffaa44); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-share-alt"></i> Compartir Link
                    </button>
                </div>
            `;
        }
    }
}

// Enable notification system
function enableNotificationSystem(user) {
    // Add notification bell to user menu
    const userMenu = document.getElementById('userMenu');
    if (userMenu && !document.getElementById('notificationBell')) {
        const notificationBell = document.createElement('div');
        notificationBell.id = 'notificationBell';
        notificationBell.innerHTML = `
            <button style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; position: relative; margin-right: 15px;" title="Notificaciones">
                <i class="fas fa-bell"></i>
                <span id="notificationCount" style="position: absolute; top: -8px; right: -8px; background: #ff4444; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 12px; display: none; align-items: center; justify-content: center;">0</span>
            </button>
        `;
        userMenu.insertBefore(notificationBell, userMenu.firstChild);
    }
}

// Disable notification system
function disableNotificationSystem() {
    const notificationBell = document.getElementById('notificationBell');
    if (notificationBell) {
        notificationBell.remove();
    }
}

// Load user profile data
async function loadUserProfile(user) {
    if (window.db && user) {
        try {
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Update UI with user data
                const userLevel = document.getElementById('userLevel');
                const userPoints = document.getElementById('userPoints');
                
                if (userLevel) userLevel.textContent = userData.level || 1;
                if (userPoints) userPoints.textContent = userData.points || 0;
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }
}

// Update user stats in UI
function updateUserStats(user) {
    // This will be called when user data is loaded
}

// Setup comment form functionality
function setupCommentForm(user) {
    const form = document.getElementById('quickCommentForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const textarea = document.getElementById('quickCommentText');
            const comment = textarea.value.trim();
            
            if (comment) {
                showSuccessMessage('¡Comentario publicado! +5 puntos');
                textarea.value = '';
                
                // Add comment to display
                const commentsList = document.getElementById('commentsList');
                if (commentsList) {
                    const commentHTML = `
                        <div style="border-bottom: 1px solid #eee; padding: 15px 0; display: flex; gap: 15px;">
                            <div style="width: 32px; height: 32px; background: linear-gradient(45deg, #ff9933, #ffaa44); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                                <i class="fas fa-user"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #333; margin-bottom: 5px;">${user.displayName || 'Usuario'}</div>
                                <p style="color: #666; margin: 0; line-height: 1.5;">${comment}</p>
                                <div style="color: #999; font-size: 12px; margin-top: 8px;">Hace un momento</div>
                            </div>
                        </div>
                    `;
                    
                    if (commentsList.innerHTML.includes('Los comentarios aparecerán aquí')) {
                        commentsList.innerHTML = commentHTML;
                    } else {
                        commentsList.insertAdjacentHTML('afterbegin', commentHTML);
                    }
                }
            }
        });
    }
}

// Setup link sharing form functionality
function setupLinkSharingForm(user) {
    const form = document.getElementById('linkSharingForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const urlInput = document.getElementById('streamUrl');
            const qualitySelect = document.getElementById('streamQuality');
            
            const url = urlInput.value.trim();
            const quality = qualitySelect.value;
            
            if (url) {
                showSuccessMessage('¡Link compartido exitosamente! +10 puntos');
                urlInput.value = '';
                
                // Add link to display
                const linksList = document.getElementById('linksList');
                if (linksList) {
                    const linkHTML = `
                        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 24px; height: 24px; background: linear-gradient(45deg, #ff9933, #ffaa44); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <span style="color: white; font-weight: 600;">${user.displayName || 'Usuario'}</span>
                                    <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${quality}</span>
                                </div>
                                <span style="color: #ccc; font-size: 12px;">Hace un momento</span>
                            </div>
                            <a href="${url}" target="_blank" style="color: #fff; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(45deg, #ff9933, #ffaa44); padding: 8px 16px; border-radius: 6px; font-size: 14px;">
                                <i class="fas fa-play"></i> Ver Stream
                            </a>
                        </div>
                    `;
                    
                    if (linksList.innerHTML.includes('Los links compartidos aparecerán aquí')) {
                        linksList.innerHTML = linkHTML;
                    } else {
                        linksList.insertAdjacentHTML('afterbegin', linkHTML);
                    }
                }
            }
        });
    }
}

// Setup authentication modals
function setupAuthModals() {
    // Login form handler
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (window.signInWithEmail) {
                const result = await window.signInWithEmail(email, password);
                if (result.success) {
                    showSuccessMessage('¡Bienvenido de vuelta!');
                    closeModal('authModal');
                }
            }
        });
    }
    
    // Register form handler
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const favoriteTeam = document.getElementById('registerFavoriteTeam').value;
            
            if (window.signUpWithEmail) {
                const result = await window.signUpWithEmail(email, password, name, favoriteTeam);
                if (result.success) {
                    showSuccessMessage('¡Cuenta creada exitosamente!');
                    closeModal('authModal');
                }
            }
        });
    }
}

// Helper functions
function showAuthenticatedContent() {
    // Show content that's only available to authenticated users
}

function showLoginPrompts() {
    // Show prompts to login for protected features
}

// Utility function to add emoji to comment
window.addEmoji = function(emoji) {
    const textarea = document.getElementById('quickCommentText');
    if (textarea) {
        textarea.value += emoji;
        textarea.focus();
    }
};

// Profile menu functions
window.toggleProfileDropdown = function() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
};

window.openUserProfile = function() {
    window.location.href = 'user-profile.html';
};

window.logoutUser = async function() {
    if (window.signOutUser) {
        await window.signOutUser();
        showSuccessMessage('Sesión cerrada correctamente');
    }
};

// Modal functions
window.openAuthModal = function(type) {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        showAuthTab(type);
    }
};

window.closeAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.showAuthTab = function(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const modalTitle = document.getElementById('authModalTitle');
    
    if (tab === 'login') {
        loginTab?.classList.add('active');
        registerTab?.classList.remove('active');
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (modalTitle) modalTitle.textContent = 'Iniciar Sesión';
    } else {
        registerTab?.classList.add('active');
        loginTab?.classList.remove('active');
        if (registerForm) registerForm.style.display = 'block';
        if (loginForm) loginForm.style.display = 'none';
        if (modalTitle) modalTitle.textContent = 'Registrarse';
    }
};

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ====== ENHANCED COMMENT AND STREAM SHARING FUNCTIONALITY ======

// Quick Share Modal Function
window.openQuickShareModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'quickShareModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-plus-circle"></i> ➕ Compartir Link de Transmisión</h2>
                <button class="close-modal" onclick="closeModal('quickShareModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="quick-share-form">
                    <div class="form-group">
                        <label>🏆 Partido</label>
                        <input type="text" id="quickMatchName" placeholder="Ej: América vs Chivas - Clásico Nacional">
                    </div>
                    <div class="form-group">
                        <label>🔗 URL de Transmisión</label>
                        <input type="url" id="quickStreamUrl" placeholder="https://ejemplo.com/stream">
                    </div>
                    <div class="form-group">
                        <label>⭐ Calidad de Transmisión</label>
                        <select id="quickStreamQuality">
                            <option value="5">⭐⭐⭐⭐⭐ Excelente (HD/4K)</option>
                            <option value="4">⭐⭐⭐⭐ Muy buena (HD)</option>
                            <option value="3">⭐⭐⭐ Buena (SD)</option>
                            <option value="2">⭐⭐ Regular</option>
                            <option value="1">⭐ Baja calidad</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>🌐 Idioma</label>
                        <select id="quickStreamLanguage">
                            <option value="español">🇲🇽 Español</option>
                            <option value="english">🇺🇸 English</option>
                            <option value="portugues">🇧🇷 Português</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>💬 Comentarios adicionales (opcional)</label>
                        <textarea id="quickStreamComments" placeholder="Información adicional sobre este stream (estabilidad, popups, etc.)..." rows="3"></textarea>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary btn-large" onclick="submitQuickShare()">
                            <i class="fas fa-share-alt"></i>
                            🚀 Compartir Link (+10 puntos)
                        </button>
                        <button class="btn btn-outline" onclick="closeModal('quickShareModal')">
                            <i class="fas fa-times"></i>
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
};

// Submit Quick Share
window.submitQuickShare = async function() {
    const matchName = document.getElementById('quickMatchName').value;
    const streamUrl = document.getElementById('quickStreamUrl').value;
    const quality = document.getElementById('quickStreamQuality').value;
    const language = document.getElementById('quickStreamLanguage').value;
    const comments = document.getElementById('quickStreamComments').value;
    
    if (!matchName || !streamUrl) {
        alert('Por favor completa al menos el partido y la URL del stream');
        return;
    }
    
    try {
        new URL(streamUrl);
    } catch (e) {
        alert('Por favor ingresa una URL válida');
        return;
    }
    
    try {
        const linkData = {
            matchName: matchName.trim(),
            streamUrl: streamUrl.trim(),
            quality: parseInt(quality),
            language: language,
            comments: comments.trim(),
            sharedBy: getCurrentUserName() || 'Usuario Anónimo',
            sharedAt: new Date().toISOString(),
            upvotes: 0,
            downvotes: 0,
            id: Date.now().toString()
        };
        
        const savedLinks = JSON.parse(localStorage.getItem('streamLinks') || '[]');
        savedLinks.unshift(linkData);
        localStorage.setItem('streamLinks', JSON.stringify(savedLinks));
        
        alert('¡Link compartido exitosamente! 🎉\\n+10 puntos ganados');
        closeModal('quickShareModal');
        updateStreamStats();
        
    } catch (error) {
        console.error('Error sharing link:', error);
        alert('Error al compartir el link. Inténtalo de nuevo.');
    }
};

// View Shared Links
window.viewSharedLinks = function() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'viewLinksModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h2><i class="fas fa-list"></i> 📋 Links Compartidos</h2>
                <button class="close-modal" onclick="closeModal('viewLinksModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="shared-links-container" id="sharedLinksContainer">
                    <!-- Links will be loaded here -->
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    loadSharedLinks();
};

// Load shared links
function loadSharedLinks() {
    const container = document.getElementById('sharedLinksContainer');
    if (!container) return;
    
    const links = JSON.parse(localStorage.getItem('streamLinks') || '[]');
    
    if (links.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-link fa-3x" style="color: #ccc; margin-bottom: 20px;"></i>
                <h3>No hay links compartidos aún</h3>
                <p>¡Sé el primero en compartir un link de transmisión!</p>
                <button class="btn btn-primary" onclick="closeModal('viewLinksModal'); openQuickShareModal();">
                    <i class="fas fa-plus"></i> Compartir Primer Link
                </button>
            </div>
        `;
        return;
    }
    
    links.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt));
    container.innerHTML = links.map(link => createLinkCard(link)).join('');
}

// Create link card
function createLinkCard(link) {
    const qualityStars = '⭐'.repeat(link.quality);
    const timeAgo = getTimeAgo(link.sharedAt);
    const languageFlag = link.language === 'español' ? '🇲🇽' : link.language === 'english' ? '🇺🇸' : '🇧🇷';
    
    return `
        <div style="background: white; border-radius: 15px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9ecef; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0; color: #2c5aa0; font-size: 1.1rem;">${link.matchName}</h4>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span style="color: #FFD700;">${qualityStars}</span>
                    <span style="background: rgba(255,153,51,0.2); color: #ff9933; padding: 3px 8px; border-radius: 12px; font-size: 11px;">${languageFlag} ${link.language}</span>
                </div>
            </div>
            ${link.comments ? `<p style="color: #666; margin-bottom: 10px;">${link.comments}</p>` : ''}
            <div style="display: flex; gap: 20px; font-size: 0.9rem; color: #999; margin-bottom: 15px;">
                <span>📤 Por: ${link.sharedBy}</span>
                <span>🕐 ${timeAgo}</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <a href="${link.streamUrl}" target="_blank" style="background: linear-gradient(45deg, #ff9933, #ffaa44); color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600;">
                    <i class="fas fa-play"></i> 📺 Ver Stream
                </a>
                <button style="border: 1px solid #e1e1e1; background: none; color: #666; padding: 8px 15px; border-radius: 8px; cursor: pointer;">
                    👍 ${link.upvotes || 0}
                </button>
            </div>
        </div>
    `;
}

// Setup community comments
function setupCommunityComments() {
    const commentForm = document.getElementById('communityCommentForm');
    const commentText = document.getElementById('commentText');
    const commentCharCount = document.getElementById('commentCharCount');
    
    if (commentText && commentCharCount) {
        commentText.addEventListener('input', function() {
            commentCharCount.textContent = this.value.length;
            if (this.value.length > 450) {
                commentCharCount.style.color = '#dc3545';
            } else {
                commentCharCount.style.color = '#666';
            }
        });
    }
    
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitCommunityComment();
        });
    }
}

// Submit community comment
async function submitCommunityComment() {
    const commentText = document.getElementById('commentText').value.trim();
    
    if (!commentText) {
        alert('Por favor escribe un comentario');
        return;
    }
    
    const commentData = {
        text: commentText,
        author: getCurrentUserName() || 'Usuario Anónimo',
        timestamp: new Date().toISOString(),
        likes: 0,
        id: Date.now().toString()
    };
    
    const savedComments = JSON.parse(localStorage.getItem('communityComments') || '[]');
    savedComments.unshift(commentData);
    localStorage.setItem('communityComments', JSON.stringify(savedComments));
    
    document.getElementById('commentText').value = '';
    document.getElementById('commentCharCount').textContent = '0';
    
    alert('¡Comentario publicado! 🎉\\n+5 puntos ganados');
    loadCommunityComments();
}

// Clear comment form
window.clearCommentForm = function() {
    document.getElementById('commentText').value = '';
    document.getElementById('commentCharCount').textContent = '0';
};

// Enhanced utility functions
function getCurrentUserName() {
    if (window.auth && window.auth.currentUser) {
        return window.auth.currentUser.displayName || window.auth.currentUser.email;
    }
    return localStorage.getItem('currentUserName') || null;
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - commentTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
}

function updateStreamStats() {
    const links = JSON.parse(localStorage.getItem('streamLinks') || '[]');
    const userLinks = links.filter(link => link.sharedBy === getCurrentUserName());
    
    const totalLinksElement = document.getElementById('totalSharedLinks');
    if (totalLinksElement) totalLinksElement.textContent = userLinks.length;
    
    const communityHelpedElement = document.getElementById('communityHelped');
    if (communityHelpedElement) {
        const totalHelped = userLinks.reduce((sum, link) => sum + (link.upvotes || 0), 0);
        communityHelpedElement.textContent = totalHelped;
    }
}

function loadCommunityComments() {
    const commentsFeed = document.getElementById('commentsFeed');
    if (!commentsFeed) return;
    
    const comments = JSON.parse(localStorage.getItem('communityComments') || '[]');
    if (comments.length === 0) return;
    
    comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const commentsHTML = comments.slice(0, 10).map(comment => {
        const timeAgo = getTimeAgo(comment.timestamp);
        return `
            <div class="comment-item">
                <div class="comment-user">
                    <div class="user-avatar">${comment.author.charAt(0).toUpperCase()}</div>
                    <div class="user-info">
                        <span class="username">${comment.author}</span>
                        <span class="comment-time">${timeAgo}</span>
                    </div>
                </div>
                <div class="comment-content">${comment.text}</div>
                <div class="comment-actions">
                    <button class="comment-action-btn">
                        <i class="fas fa-thumbs-up"></i> 👍 ${comment.likes || 0}
                    </button>
                    <button class="comment-action-btn">
                        <i class="fas fa-reply"></i> 💬 Responder
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    commentsFeed.innerHTML = commentsHTML;
}

// Initialize enhanced functionality on load
setTimeout(() => {
    setupCommunityComments();
    updateStreamStats();
}, 1000);

// Export functions for use in other files
window.ultraGolApp = {
    teamsData: () => teamsData,
    standingsData: () => standingsData,
    fixturesData: () => fixturesData,
    formatDate,
    formatTime,
    showErrorMessage,
    showSuccessMessage,
    showLoading,
    hideLoading,
    saveToLocalStorage,
    getFromLocalStorage,
    searchTeams,
    filterTeamsByRegion,
    applyTeamTheme,
    compareTeams,
    performGlobalSearch,
    setupCarousel,
    setupTeamComparison,
    displaySearchResults,
    goToTeam,
    applyAdvancedFilter
};

console.log('🎯 Enhanced main functionality loaded successfully');
