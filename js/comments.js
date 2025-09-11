// Comments and Social Features System
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

// Initialize comments system
export function initComments() {
    setupCommentsInterface();
    setupSocialFeatures();
}

// Setup comments interface on existing pages
function setupCommentsInterface() {
    // Add comments section to match pages
    const existingFooter = document.querySelector('.footer');
    if (existingFooter) {
        const commentsSection = createCommentsSection();
        existingFooter.insertAdjacentElement('beforebegin', commentsSection);
    }
}

// Create comments section
function createCommentsSection() {
    const section = document.createElement('section');
    section.className = 'comments-section';
    section.innerHTML = `
        <div class="container">
            <h2 class="section-title">
                <i class="fas fa-comments"></i>
                Comentarios de la Comunidad
                <span class="comments-count" id="commentsCount">0</span>
            </h2>
            
            <!-- Comment Form -->
            <div class="comment-form-container" id="commentFormContainer">
                <div class="comment-form">
                    <div class="form-header">
                        <h3>Únete a la conversación</h3>
                        <div class="user-info" id="commentUserInfo">
                            <span>Inicia sesión para comentar</span>
                        </div>
                    </div>
                    <form id="commentForm">
                        <div class="form-group">
                            <textarea id="commentText" placeholder="¿Qué opinas sobre este partido? Comparte tu análisis..." maxlength="500" disabled></textarea>
                            <div class="comment-tools">
                                <span class="char-count"><span id="commentCharCount">0</span>/500</span>
                                <div class="comment-emotions">
                                    <button type="button" class="emotion-btn" data-emotion="⚽">⚽</button>
                                    <button type="button" class="emotion-btn" data-emotion="🔥">🔥</button>
                                    <button type="button" class="emotion-btn" data-emotion="👏">👏</button>
                                    <button type="button" class="emotion-btn" data-emotion="😱">😱</button>
                                    <button type="button" class="emotion-btn" data-emotion="⭐">⭐</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-actions">
                            <select id="commentCategory">
                                <option value="general">General</option>
                                <option value="analysis">Análisis Técnico</option>
                                <option value="prediction">Predicción</option>
                                <option value="celebration">Celebración</option>
                                <option value="complaint">Queja/Crítica</option>
                            </select>
                            <button type="submit" class="btn btn-primary" disabled>
                                <i class="fas fa-paper-plane"></i>
                                Publicar Comentario
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Comments Display -->
            <div class="comments-container" id="commentsContainer">
                <div class="comments-filters">
                    <button class="filter-btn active" data-filter="recent">Más Recientes</button>
                    <button class="filter-btn" data-filter="popular">Más Populares</button>
                    <button class="filter-btn" data-filter="analysis">Análisis</button>
                    <button class="filter-btn" data-filter="predictions">Predicciones</button>
                </div>
                
                <div class="comments-list" id="commentsList">
                    <div class="loading-comments">
                        <i class="fas fa-comments"></i>
                        <p>Cargando comentarios...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return section;
}

// Setup comment form functionality
export function setupCommentForm() {
    const commentForm = document.getElementById('commentForm');
    const commentText = document.getElementById('commentText');
    const charCount = document.getElementById('commentCharCount');
    const submitBtn = commentForm?.querySelector('button[type="submit"]');
    
    // Check if user is logged in
    const user = getCurrentUser();
    updateCommentFormState(user);
    
    // Character counter
    if (commentText && charCount) {
        commentText.addEventListener('input', () => {
            const count = commentText.value.length;
            charCount.textContent = count;
            
            if (submitBtn) {
                submitBtn.disabled = count === 0 || count > 500 || !user;
            }
        });
    }
    
    // Emotion buttons
    const emotionBtns = document.querySelectorAll('.emotion-btn');
    emotionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (commentText) {
                commentText.value += btn.dataset.emotion;
                commentText.dispatchEvent(new Event('input'));
            }
        });
    });
    
    // Form submission
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmission);
    }
    
    // Setup filters
    const filterBtns = document.querySelectorAll('.comments-filters .filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterComments(e.target.dataset.filter);
        });
    });
    
    // Load initial comments
    loadComments();
}

// Update comment form state based on authentication
function updateCommentFormState(user) {
    const commentText = document.getElementById('commentText');
    const submitBtn = document.querySelector('#commentForm button[type="submit"]');
    const userInfo = document.getElementById('commentUserInfo');
    
    if (user) {
        if (commentText) commentText.disabled = false;
        if (submitBtn) submitBtn.disabled = false;
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="user-avatar-small">
                    ${user.photoURL ? 
                        `<img src="${user.photoURL}" alt="Avatar">` : 
                        '<i class="fas fa-user"></i>'
                    }
                </div>
                <span>Comentando como <strong>${user.displayName || 'Usuario'}</strong></span>
            `;
        }
    } else {
        if (commentText) {
            commentText.disabled = true;
            commentText.placeholder = 'Inicia sesión para comentar...';
        }
        if (submitBtn) submitBtn.disabled = true;
        if (userInfo) {
            userInfo.innerHTML = `
                <span>Inicia sesión para comentar</span>
                <button class="btn btn-small" onclick="openAuthModal()">Iniciar Sesión</button>
            `;
        }
    }
}

// Handle comment submission
async function handleCommentSubmission(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        showAuthRequired();
        return;
    }
    
    const commentText = document.getElementById('commentText').value;
    const category = document.getElementById('commentCategory').value;
    
    if (!commentText.trim()) {
        showErrorMessage('Por favor escribe un comentario');
        return;
    }
    
    try {
        showLoading('Publicando comentario...');
        
        // Add comment to Firestore
        await addDoc(collection(db, 'comments'), {
            userId: user.uid,
            userDisplayName: user.displayName || 'Usuario',
            userPhotoURL: user.photoURL || '',
            text: commentText.trim(),
            category,
            likes: 0,
            replies: 0,
            reported: false,
            verified: false,
            page: window.location.pathname,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        // Update user stats
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            'stats.commentsPosted': increment(1),
            points: increment(5),
            experience: increment(10)
        });
        
        // Check achievements
        await checkCommentAchievements(user.uid);
        
        hideLoading();
        showSuccessMessage('¡Comentario publicado! +5 puntos');
        
        // Reset form
        e.target.reset();
        document.getElementById('commentCharCount').textContent = '0';
        
        // Reload comments
        loadComments();
        
    } catch (error) {
        hideLoading();
        console.error('Error posting comment:', error);
        showErrorMessage('Error al publicar el comentario');
    }
}

// Load and display comments
export async function loadComments(filter = 'recent') {
    try {
        let commentsQuery;
        
        switch(filter) {
            case 'popular':
                commentsQuery = query(
                    collection(db, 'comments'),
                    where('page', '==', window.location.pathname),
                    orderBy('likes', 'desc'),
                    limit(20)
                );
                break;
            case 'analysis':
                commentsQuery = query(
                    collection(db, 'comments'),
                    where('page', '==', window.location.pathname),
                    where('category', '==', 'analysis'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
                break;
            case 'predictions':
                commentsQuery = query(
                    collection(db, 'comments'),
                    where('page', '==', window.location.pathname),
                    where('category', '==', 'prediction'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
                break;
            default:
                commentsQuery = query(
                    collection(db, 'comments'),
                    where('page', '==', window.location.pathname),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
        }
        
        const querySnapshot = await getDocs(commentsQuery);
        const comments = [];
        
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() });
        });
        
        displayComments(comments);
        updateCommentsCount(comments.length);
        
    } catch (error) {
        console.error('Error loading comments:', error);
        displayCommentsError();
    }
}

// Display comments
function displayComments(comments) {
    const container = document.getElementById('commentsList');
    if (!container) return;
    
    if (comments.length === 0) {
        container.innerHTML = `
            <div class="no-comments">
                <i class="fas fa-comments"></i>
                <p>No hay comentarios aún</p>
                <p class="small">¡Sé el primero en comentar!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = comments.map(comment => `
        <div class="comment-item" data-comment-id="${comment.id}">
            <div class="comment-header">
                <div class="comment-user">
                    <div class="user-avatar-small">
                        ${comment.userPhotoURL ? 
                            `<img src="${comment.userPhotoURL}" alt="Avatar">` : 
                            '<i class="fas fa-user"></i>'
                        }
                    </div>
                    <div class="user-info">
                        <span class="username">${comment.userDisplayName}</span>
                        ${comment.verified ? '<i class="fas fa-check-circle verified" title="Verificado"></i>' : ''}
                        <span class="comment-category">${getCategoryLabel(comment.category)}</span>
                    </div>
                </div>
                <div class="comment-meta">
                    <span class="comment-time">${formatTimeAgo(comment.createdAt?.toDate())}</span>
                </div>
            </div>
            
            <div class="comment-content">
                <p>${comment.text}</p>
            </div>
            
            <div class="comment-actions">
                <button class="action-btn like-btn" onclick="likeComment('${comment.id}')" 
                        title="Me gusta" ${!getCurrentUser() ? 'disabled' : ''}>
                    <i class="fas fa-heart"></i>
                    <span>${comment.likes || 0}</span>
                </button>
                <button class="action-btn reply-btn" onclick="replyToComment('${comment.id}')" 
                        title="Responder" ${!getCurrentUser() ? 'disabled' : ''}>
                    <i class="fas fa-reply"></i>
                    <span>Responder</span>
                </button>
                <button class="action-btn report-btn" onclick="reportComment('${comment.id}')" 
                        title="Reportar" ${!getCurrentUser() ? 'disabled' : ''}>
                    <i class="fas fa-flag"></i>
                </button>
                ${getCurrentUser()?.uid === comment.userId ? 
                    `<button class="action-btn delete-btn" onclick="deleteComment('${comment.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>` : ''
                }
            </div>
        </div>
    `).join('');
}

// Get category label in Spanish
function getCategoryLabel(category) {
    const labels = {
        'general': 'General',
        'analysis': 'Análisis',
        'prediction': 'Predicción',
        'celebration': 'Celebración',
        'complaint': 'Crítica'
    };
    return labels[category] || 'General';
}

// Like a comment
window.likeComment = async function(commentId) {
    const user = getCurrentUser();
    if (!user) {
        showAuthRequired();
        return;
    }
    
    try {
        const commentRef = doc(db, 'comments', commentId);
        await updateDoc(commentRef, {
            likes: increment(1)
        });
        
        showSuccessMessage('¡Like agregado!');
        loadComments();
        
    } catch (error) {
        console.error('Error liking comment:', error);
        showErrorMessage('Error al dar like');
    }
};

// Reply to comment
window.replyToComment = function(commentId) {
    const user = getCurrentUser();
    if (!user) {
        showAuthRequired();
        return;
    }
    
    // Create reply form
    createReplyForm(commentId);
};

// Create reply form
function createReplyForm(commentId) {
    const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!commentItem) return;
    
    // Check if reply form already exists
    const existingForm = commentItem.querySelector('.reply-form');
    if (existingForm) {
        existingForm.remove();
        return;
    }
    
    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form';
    replyForm.innerHTML = `
        <div class="reply-container">
            <textarea placeholder="Escribe tu respuesta..." maxlength="300"></textarea>
            <div class="reply-actions">
                <span class="reply-char-count">0/300</span>
                <button class="btn btn-small btn-primary" onclick="submitReply('${commentId}', this)">
                    Responder
                </button>
                <button class="btn btn-small" onclick="cancelReply(this)">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    commentItem.appendChild(replyForm);
    
    // Setup character counter
    const textarea = replyForm.querySelector('textarea');
    const charCount = replyForm.querySelector('.reply-char-count');
    
    textarea.addEventListener('input', () => {
        charCount.textContent = `${textarea.value.length}/300`;
    });
    
    textarea.focus();
}

// Submit reply
window.submitReply = async function(commentId, button) {
    const user = getCurrentUser();
    if (!user) return;
    
    const replyForm = button.closest('.reply-form');
    const textarea = replyForm.querySelector('textarea');
    const replyText = textarea.value.trim();
    
    if (!replyText) {
        showErrorMessage('Por favor escribe una respuesta');
        return;
    }
    
    try {
        showLoading('Enviando respuesta...');
        
        await addDoc(collection(db, 'replies'), {
            commentId,
            userId: user.uid,
            userDisplayName: user.displayName || 'Usuario',
            userPhotoURL: user.photoURL || '',
            text: replyText,
            likes: 0,
            reported: false,
            createdAt: serverTimestamp()
        });
        
        // Update reply count
        const commentRef = doc(db, 'comments', commentId);
        await updateDoc(commentRef, {
            replies: increment(1)
        });
        
        // Update user stats
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            'stats.commentsPosted': increment(1),
            points: increment(3),
            experience: increment(6)
        });
        
        hideLoading();
        showSuccessMessage('¡Respuesta enviada! +3 puntos');
        
        replyForm.remove();
        loadComments();
        
    } catch (error) {
        hideLoading();
        console.error('Error submitting reply:', error);
        showErrorMessage('Error al enviar la respuesta');
    }
};

// Cancel reply
window.cancelReply = function(button) {
    const replyForm = button.closest('.reply-form');
    replyForm.remove();
};

// Report comment
window.reportComment = async function(commentId) {
    const user = getCurrentUser();
    if (!user) {
        showAuthRequired();
        return;
    }
    
    const reason = prompt('¿Por qué reportas este comentario?\n\n1. Spam\n2. Contenido ofensivo\n3. Información falsa\n4. Fuera de tema\n5. Otro');
    
    if (!reason) return;
    
    try {
        await addDoc(collection(db, 'commentReports'), {
            commentId,
            userId: user.uid,
            reason,
            createdAt: serverTimestamp()
        });
        
        showSuccessMessage('Reporte enviado. Gracias por ayudar a mantener la comunidad');
        
    } catch (error) {
        console.error('Error reporting comment:', error);
        showErrorMessage('Error al enviar reporte');
    }
};

// Delete comment (only for comment author)
window.deleteComment = async function(commentId) {
    const user = getCurrentUser();
    if (!user) return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
        return;
    }
    
    try {
        showLoading('Eliminando comentario...');
        
        await deleteDoc(doc(db, 'comments', commentId));
        
        // Update user stats
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            'stats.commentsPosted': increment(-1)
        });
        
        hideLoading();
        showSuccessMessage('Comentario eliminado');
        
        loadComments();
        
    } catch (error) {
        hideLoading();
        console.error('Error deleting comment:', error);
        showErrorMessage('Error al eliminar el comentario');
    }
};

// Filter comments
function filterComments(filter) {
    loadComments(filter);
}

// Update comments count
function updateCommentsCount(count) {
    const countElement = document.getElementById('commentsCount');
    if (countElement) {
        countElement.textContent = count;
    }
}

// Display comments error
function displayCommentsError() {
    const container = document.getElementById('commentsList');
    if (container) {
        container.innerHTML = `
            <div class="error-comments">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar comentarios</p>
                <button onclick="loadComments()" class="btn btn-small">Reintentar</button>
            </div>
        `;
    }
}

// Check comment achievements
async function checkCommentAchievements(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const stats = userSnap.data().stats || {};
            const commentsPosted = stats.commentsPosted || 0;
            
            // Social butterfly achievement (50 comments)
            if (commentsPosted >= 50 && !userSnap.data().achievements?.socialButterfly) {
                await updateDoc(userRef, {
                    'achievements.socialButterfly': true,
                    points: increment(40),
                    experience: increment(80)
                });
                
                await unlockAchievement(userId, 'social_butterfly', 'Mariposa Social', '50 comentarios publicados');
                showSuccessMessage('¡Logro desbloqueado: Mariposa Social! +40 puntos');
            }
        }
    } catch (error) {
        console.error('Error checking comment achievements:', error);
    }
}

// Setup social features
function setupSocialFeatures() {
    // Add social sharing buttons to match pages
    addSocialSharingButtons();
    
    // Setup favorite teams functionality
    setupFavoriteTeams();
}

// Add social sharing buttons
function addSocialSharingButtons() {
    const heroSection = document.querySelector('.hero-carousel');
    if (heroSection) {
        const socialButtons = document.createElement('div');
        socialButtons.className = 'social-sharing';
        socialButtons.innerHTML = `
            <div class="social-share-container">
                <h4>Comparte UltraGol</h4>
                <div class="social-buttons">
                    <button class="social-btn facebook" onclick="shareOnFacebook()">
                        <i class="fab fa-facebook-f"></i>
                        Facebook
                    </button>
                    <button class="social-btn twitter" onclick="shareOnTwitter()">
                        <i class="fab fa-twitter"></i>
                        Twitter
                    </button>
                    <button class="social-btn whatsapp" onclick="shareOnWhatsApp()">
                        <i class="fab fa-whatsapp"></i>
                        WhatsApp
                    </button>
                    <button class="social-btn copy-link" onclick="copyPageLink()">
                        <i class="fas fa-link"></i>
                        Copiar Link
                    </button>
                </div>
            </div>
        `;
        
        heroSection.appendChild(socialButtons);
    }
}

// Social sharing functions
window.shareOnFacebook = function() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent('UltraGol - Liga MX');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
};

window.shareOnTwitter = function() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('¡Descubre UltraGol, la mejor plataforma de Liga MX! 🔥⚽');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
};

window.shareOnWhatsApp = function() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('¡Mira UltraGol, la mejor plataforma de Liga MX! ⚽🔥 ' + window.location.href);
    window.open(`https://wa.me/?text=${text}`, '_blank');
};

window.copyPageLink = function() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showSuccessMessage('¡Link copiado al portapapeles!');
    }).catch(() => {
        showErrorMessage('No se pudo copiar el link');
    });
};

// Setup favorite teams functionality
function setupFavoriteTeams() {
    // Add favorite button to team cards when they exist
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('favorite-team-btn')) {
            toggleFavoriteTeam(e.target.dataset.teamId);
        }
    });
}

// Toggle favorite team
async function toggleFavoriteTeam(teamId) {
    const user = getCurrentUser();
    if (!user) {
        showAuthRequired();
        return;
    }
    
    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const favoriteTeams = userData.favoriteTeams || [];
            
            let updatedFavorites;
            if (favoriteTeams.includes(teamId)) {
                updatedFavorites = favoriteTeams.filter(id => id !== teamId);
                showSuccessMessage('Equipo removido de favoritos');
            } else {
                updatedFavorites = [...favoriteTeams, teamId];
                showSuccessMessage('¡Equipo agregado a favoritos!');
            }
            
            await updateDoc(userRef, {
                favoriteTeams: updatedFavorites
            });
        }
        
    } catch (error) {
        console.error('Error toggling favorite team:', error);
        showErrorMessage('Error al actualizar favoritos');
    }
}

// Utility functions
function formatTimeAgo(date) {
    if (!date) return 'Hace un momento';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    
    return date.toLocaleDateString('es-ES');
}

function showAuthRequired() {
    showErrorMessage('Necesitas iniciar sesión para usar esta función');
    // Open auth modal if it exists
    if (window.openAuthModal) {
        window.openAuthModal();
    }
}

// Global utility functions
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

async function unlockAchievement(userId, achievementId, title, description) {
    // This function should be imported from user-profiles.js
    if (window.unlockAchievement) {
        return window.unlockAchievement(userId, achievementId, title, description);
    }
}