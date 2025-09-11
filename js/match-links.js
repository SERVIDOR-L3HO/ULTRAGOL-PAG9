// Match Links System - Share and discover match streaming links
import { db } from './firebase-config.js';
import { getCurrentUser } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    where, 
    limit,
    updateDoc,
    doc,
    deleteDoc,
    serverTimestamp,
    increment 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize match links system
export function initMatchLinks() {
    setupMatchLinksInterface();
    loadMatchLinks();
    setupLinkSubmissionForm();
}

// Setup the match links interface
function setupMatchLinksInterface() {
    // Add match links section to existing pages
    const linksSection = createMatchLinksSection();
    
    // Insert after recent matches section
    const recentMatchesSection = document.querySelector('.recent-matches');
    if (recentMatchesSection) {
        recentMatchesSection.insertAdjacentElement('afterend', linksSection);
    }
}

// Create match links section HTML
function createMatchLinksSection() {
    const section = document.createElement('section');
    section.className = 'match-links-section';
    section.innerHTML = `
        <div class="container">
            <h2 class="section-title">
                <i class="fas fa-link"></i>
                Links de Partidos
                <span class="live-indicator">LIVE</span>
            </h2>
            
            <!-- Submit Link Form -->
            <div class="link-submission" id="linkSubmission">
                <div class="submission-form">
                    <h3>Compartir Link de Partido</h3>
                    <form id="linkForm">
                        <div class="form-group">
                            <select id="matchSelect" required>
                                <option value="">Selecciona un partido</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <input type="url" id="streamUrl" placeholder="URL del stream (ej: https://...)" required>
                        </div>
                        <div class="form-group">
                            <select id="linkQuality">
                                <option value="HD">HD</option>
                                <option value="SD">SD</option>
                                <option value="4K">4K</option>
                            </select>
                            <select id="linkLanguage">
                                <option value="Español">Español</option>
                                <option value="Inglés">Inglés</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <textarea id="linkDescription" placeholder="Descripción opcional (comentarios, calidad, etc.)" maxlength="200"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-share"></i>
                            Compartir Link
                        </button>
                    </form>
                </div>
            </div>

            <!-- Match Links Display -->
            <div class="match-links-container" id="matchLinksContainer">
                <div class="links-filters">
                    <button class="filter-btn active" data-filter="all">Todos</button>
                    <button class="filter-btn" data-filter="live">En Vivo</button>
                    <button class="filter-btn" data-filter="upcoming">Próximos</button>
                    <button class="filter-btn" data-filter="popular">Populares</button>
                </div>
                <div class="links-grid" id="linksGrid">
                    <!-- Dynamic content -->
                </div>
            </div>
        </div>
    `;
    
    return section;
}

// Setup link submission form
function setupLinkSubmissionForm() {
    const linkForm = document.getElementById('linkForm');
    if (linkForm) {
        linkForm.addEventListener('submit', handleLinkSubmission);
    }
    
    // Load matches for selection
    loadMatchesForSelection();
    
    // Setup filters
    const filterBtns = document.querySelectorAll('.links-filters .filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterLinks(e.target.dataset.filter);
        });
    });
}

// Handle link submission
async function handleLinkSubmission(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        showAuthRequired();
        return;
    }
    
    const formData = new FormData(e.target);
    const matchId = document.getElementById('matchSelect').value;
    const streamUrl = document.getElementById('streamUrl').value;
    const quality = document.getElementById('linkQuality').value;
    const language = document.getElementById('linkLanguage').value;
    const description = document.getElementById('linkDescription').value;
    
    if (!matchId || !streamUrl) {
        showErrorMessage('Por favor completa todos los campos obligatorios');
        return;
    }
    
    try {
        showLoading('Compartiendo link...');
        
        // Add link to Firestore
        await addDoc(collection(db, 'matchLinks'), {
            matchId,
            streamUrl,
            quality,
            language,
            description,
            userId: user.uid,
            userDisplayName: user.displayName || 'Usuario',
            votes: 0,
            reports: 0,
            verified: false,
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        // Update user stats
        await updateUserStats(user.uid, { linksShared: 1 });
        
        // Award points
        await awardPoints(user.uid, 10, 'link_shared');
        
        hideLoading();
        showSuccessMessage('¡Link compartido exitosamente! +10 puntos');
        
        // Reset form
        e.target.reset();
        
        // Reload links
        loadMatchLinks();
        
    } catch (error) {
        hideLoading();
        console.error('Error sharing link:', error);
        showErrorMessage('Error al compartir el link');
    }
}

// Load matches for selection dropdown
async function loadMatchesForSelection() {
    try {
        // Get upcoming and live matches from fixtures data
        const response = await fetch('/data/fixtures.json');
        const fixtures = await response.json();
        
        const upcomingMatches = fixtures.filter(match => 
            match.status === 'scheduled' || match.status === 'live'
        ).slice(0, 20);
        
        const matchSelect = document.getElementById('matchSelect');
        if (matchSelect) {
            matchSelect.innerHTML = '<option value="">Selecciona un partido</option>';
            
            upcomingMatches.forEach(match => {
                const option = document.createElement('option');
                option.value = match.id || `${match.homeTeam}-${match.awayTeam}`;
                option.textContent = `${match.homeTeam} vs ${match.awayTeam} - ${formatMatchDate(match.date)}`;
                matchSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading matches for selection:', error);
    }
}

// Load and display match links
export async function loadMatchLinks() {
    try {
        const linksQuery = query(
            collection(db, 'matchLinks'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        
        const querySnapshot = await getDocs(linksQuery);
        const links = [];
        
        querySnapshot.forEach((doc) => {
            links.push({ id: doc.id, ...doc.data() });
        });
        
        displayMatchLinks(links);
        
    } catch (error) {
        console.error('Error loading match links:', error);
    }
}

// Display match links
function displayMatchLinks(links) {
    const container = document.getElementById('linksGrid');
    if (!container) return;
    
    if (links.length === 0) {
        container.innerHTML = `
            <div class="no-links">
                <i class="fas fa-link"></i>
                <p>No hay links compartidos aún</p>
                <p class="small">¡Sé el primero en compartir un link!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = links.map(link => `
        <div class="link-card" data-link-id="${link.id}">
            <div class="link-header">
                <div class="match-info">
                    <h4>${link.matchId}</h4>
                    <span class="link-time">${formatTimeAgo(link.createdAt?.toDate())}</span>
                </div>
                <div class="link-quality">
                    <span class="quality-badge ${link.quality.toLowerCase()}">${link.quality}</span>
                    <span class="language-badge">${link.language}</span>
                </div>
            </div>
            
            <div class="link-content">
                ${link.description ? `<p class="link-description">${link.description}</p>` : ''}
                <div class="link-url">
                    <a href="${link.streamUrl}" target="_blank" rel="noopener noreferrer" class="stream-btn">
                        <i class="fas fa-play"></i>
                        Ver Stream
                    </a>
                </div>
            </div>
            
            <div class="link-footer">
                <div class="link-user">
                    <i class="fas fa-user"></i>
                    <span>${link.userDisplayName}</span>
                    ${link.verified ? '<i class="fas fa-check-circle verified" title="Verificado"></i>' : ''}
                </div>
                <div class="link-actions">
                    <button class="vote-btn" onclick="voteLink('${link.id}', 'up')" title="Votar positivo">
                        <i class="fas fa-thumbs-up"></i>
                        <span>${link.votes || 0}</span>
                    </button>
                    <button class="report-btn" onclick="reportLink('${link.id}')" title="Reportar">
                        <i class="fas fa-flag"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Vote on a link
window.voteLink = async function(linkId, voteType) {
    const user = getCurrentUser();
    if (!user) {
        showAuthRequired();
        return;
    }
    
    try {
        const linkRef = doc(db, 'matchLinks', linkId);
        
        if (voteType === 'up') {
            await updateDoc(linkRef, {
                votes: increment(1)
            });
        }
        
        showSuccessMessage('¡Voto registrado!');
        loadMatchLinks();
        
    } catch (error) {
        console.error('Error voting on link:', error);
        showErrorMessage('Error al votar');
    }
};

// Report a link
window.reportLink = async function(linkId) {
    const user = getCurrentUser();
    if (!user) {
        showAuthRequired();
        return;
    }
    
    const reason = prompt('¿Por qué reportas este link?\n\n1. No funciona\n2. Contenido inapropiado\n3. Spam\n4. Otro');
    
    if (!reason) return;
    
    try {
        await addDoc(collection(db, 'linkReports'), {
            linkId,
            userId: user.uid,
            reason,
            createdAt: serverTimestamp()
        });
        
        await updateDoc(doc(db, 'matchLinks', linkId), {
            reports: increment(1)
        });
        
        showSuccessMessage('Reporte enviado. Gracias por ayudar a mantener la calidad.');
        
    } catch (error) {
        console.error('Error reporting link:', error);
        showErrorMessage('Error al enviar reporte');
    }
};

// Filter links
function filterLinks(filter) {
    const linkCards = document.querySelectorAll('.link-card');
    
    linkCards.forEach(card => {
        let show = true;
        
        switch(filter) {
            case 'live':
                // Show only live match links
                show = card.querySelector('.match-info h4').textContent.includes('vs');
                break;
            case 'upcoming':
                // Show only upcoming matches
                show = true; // For now, show all
                break;
            case 'popular':
                // Show only popular links (with votes > 5)
                const votes = parseInt(card.querySelector('.vote-btn span').textContent);
                show = votes > 5;
                break;
            default:
                show = true;
        }
        
        card.style.display = show ? 'block' : 'none';
    });
}

// Utility functions
function formatMatchDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
        return `Hoy ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTimeAgo(date) {
    if (!date) return 'Hace un momento';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    
    return date.toLocaleDateString('es-ES');
}

// Update user statistics
async function updateUserStats(userId, stats) {
    try {
        const userRef = doc(db, 'users', userId);
        const updates = {};
        
        Object.keys(stats).forEach(key => {
            updates[`stats.${key}`] = increment(stats[key]);
        });
        
        await updateDoc(userRef, updates);
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
}

// Award points to user
async function awardPoints(userId, points, reason) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            points: increment(points),
            experience: increment(points * 2)
        });
        
        // Log the point award
        await addDoc(collection(db, 'pointsHistory'), {
            userId,
            points,
            reason,
            createdAt: serverTimestamp()
        });
        
    } catch (error) {
        console.error('Error awarding points:', error);
    }
}

function showAuthRequired() {
    showErrorMessage('Necesitas iniciar sesión para compartir links');
    // Open auth modal if exists
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.style.display = 'flex';
    }
}

// Global functions for utility
function showLoading(message) {
    if (window.showLoading) {
        window.showLoading(message);
    }
}

function hideLoading() {
    if (window.hideLoading) {
        window.hideLoading();
    }
}

function showSuccessMessage(message) {
    if (window.showSuccessMessage) {
        window.showSuccessMessage(message);
    }
}

function showErrorMessage(message) {
    if (window.showErrorMessage) {
        window.showErrorMessage(message);
    }
}