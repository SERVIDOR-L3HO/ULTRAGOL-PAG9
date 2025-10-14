// Enhanced News JavaScript for Liga MX Website by L3HO
document.addEventListener('DOMContentLoaded', function() {
    initializeNews();
});

// Variables globales
let newsData = [];
let filteredNews = [];
let currentCategory = 'all';

// Inicializar sistema de noticias
function initializeNews() {
    loadNewsData();
    setupNewsControls();
    setupSearchFunctionality();
    displayNews();
}

// Cargar datos de noticias
async function loadNewsData() {
    try {
        // Cargar noticias desde la API
        const apiNews = await ultraGolAPI.getNoticias();
        
        // Mapear noticias de API al formato esperado
        newsData = apiNews.map((noticia, index) => ({
            id: `news-api-${index}`,
            title: noticia.titulo,
            excerpt: noticia.descripcion,
            category: 'general',
            author: 'UltraGol',
            date: noticia.fecha,
            image: noticia.imagen,
            url: noticia.url,
            featured: index === 0
        }));
        
        console.log('✅ Noticias cargadas desde API:', newsData.length, 'artículos');
        filteredNews = [...newsData];
        displayNews();
    } catch (error) {
        console.error('Error cargando noticias desde API:', error);
        // Fallback a noticias de ejemplo
        newsData = getFallbackNews();
        filteredNews = [...newsData];
        displayNews();
    }
}

function getFallbackNews() {
    return [
        {
            id: 'news-1',
            title: 'América refuerza su plantilla con nuevo delantero internacional',
            excerpt: 'Las Águilas del América confirman la llegada de un nuevo delantero que promete dar muchas alegrías a la afición azulcrema en esta temporada.',
            category: 'transfers',
            author: 'Juan Carlos Pérez',
            date: '2025-09-02T14:30:00Z',
            image: 'america-transfer.jpg',
            featured: false
        },
        {
            id: 'news-2',
            title: 'Tigres UANL prepara gran remontada en la tabla general',
            excerpt: 'Los felinos buscan escalar posiciones en la tabla general después de un inicio complicado, confiando en su experiencia y calidad de plantel.',
            category: 'teams',
            author: 'María González',
            date: '2025-09-02T12:15:00Z',
            image: 'tigres-comeback.jpg',
            featured: false
        }
    ];
}

// Configurar controles de noticias
function setupNewsControls() {
    const filterButtons = document.querySelectorAll('.filter-tag');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            filterNewsByCategory(category);
            updateActiveFilter(button);
        });
    });
}

// Configurar funcionalidad de búsqueda
function setupSearchFunctionality() {
    const searchInput = document.getElementById('newsSearch');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            searchNews(query);
        });
    }
}

// Filtrar noticias por categoría
function filterNewsByCategory(category) {
    currentCategory = category;
    
    if (category === 'all') {
        filteredNews = [...newsData];
    } else {
        filteredNews = newsData.filter(news => news.category === category);
    }
    
    displayNews();
}

// Buscar noticias
function searchNews(query) {
    if (!query) {
        filterNewsByCategory(currentCategory);
        return;
    }
    
    filteredNews = newsData.filter(news => {
        const matchesCategory = currentCategory === 'all' || news.category === currentCategory;
        const matchesQuery = news.title.toLowerCase().includes(query) ||
                           news.excerpt.toLowerCase().includes(query) ||
                           news.author.toLowerCase().includes(query);
        
        return matchesCategory && matchesQuery;
    });
    
    displayNews();
}

// Actualizar filtro activo
function updateActiveFilter(activeButton) {
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.classList.remove('active');
    });
    activeButton.classList.add('active');
}

// Mostrar noticias
function displayNews() {
    const newsGrid = document.getElementById('newsGrid');
    if (!newsGrid) return;
    
    if (filteredNews.length === 0) {
        newsGrid.innerHTML = `
            <div class="no-news">
                <i class="fas fa-newspaper" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">No se encontraron noticias</h3>
                <p style="color: #999;">Intenta con otros términos de búsqueda o categorías</p>
            </div>
        `;
        
        // Estilos para el mensaje de no noticias
        const style = document.createElement('style');
        style.textContent = `
            .no-news {
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            }
        `;
        if (!document.getElementById('no-news-styles')) {
            style.id = 'no-news-styles';
            document.head.appendChild(style);
        }
        
        return;
    }
    
    newsGrid.innerHTML = filteredNews.map((news, index) => 
        createNewsCard(news, index)
    ).join('');
    
    // Animar las tarjetas
    animateNewsCards();
}

// Crear tarjeta de noticia
function createNewsCard(news, index) {
    const categoryIcons = {
        transfers: 'fas fa-exchange-alt',
        matches: 'fas fa-futbol',
        teams: 'fas fa-shield-alt',
        players: 'fas fa-user',
        league: 'fas fa-trophy'
    };
    
    const categoryNames = {
        transfers: 'TRASPASOS',
        matches: 'PARTIDOS',
        teams: 'EQUIPOS',
        players: 'JUGADORES',
        league: 'LIGA'
    };
    
    const timeAgo = calculateTimeAgo(news.date);
    
    return `
        <div class="news-card stagger-item" style="animation-delay: ${index * 0.1}s" onclick="openNewsDetail('${news.id}')">
            <div class="news-image">
                <i class="${categoryIcons[news.category] || 'fas fa-newspaper'}"></i>
                <div class="news-category">${categoryNames[news.category] || 'NOTICIAS'}</div>
            </div>
            <div class="news-content">
                <h3 class="news-title">${news.title}</h3>
                <p class="news-excerpt">${news.excerpt}</p>
                <div class="news-meta">
                    <div class="news-date">
                        <i class="fas fa-clock"></i>
                        ${timeAgo}
                    </div>
                    <div class="news-author">${news.author}</div>
                </div>
            </div>
        </div>
    `;
}

// Animar tarjetas de noticias
function animateNewsCards() {
    const cards = document.querySelectorAll('.news-card.stagger-item');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Calcular tiempo transcurrido
function calculateTimeAgo(dateString) {
    const now = new Date();
    const newsDate = new Date(dateString);
    const diffInMs = now - newsDate;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 0) {
        return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    } else if (diffInHours > 0) {
        return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    }
}

// Abrir detalle de noticia
function openNewsDetail(newsId) {
    const news = newsData.find(n => n.id === newsId) || getTrendingNews(newsId);
    
    if (!news) {
        showNewsMessage('Noticia no encontrada', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'news-modal';
    modal.innerHTML = `
        <div class="news-modal-content">
            <div class="news-modal-header">
                <button class="close-news-modal">&times;</button>
            </div>
            <div class="news-modal-body">
                <div class="news-modal-category">${getCategoryName(news.category)}</div>
                <h2 class="news-modal-title">${news.title}</h2>
                <div class="news-modal-meta">
                    <span class="news-modal-author">Por ${news.author}</span>
                    <span class="news-modal-date">${formatDate(news.date)}</span>
                </div>
                <div class="news-modal-image">
                    <i class="fas fa-newspaper"></i>
                </div>
                <div class="news-modal-content-text">
                    <p>${news.excerpt}</p>
                    <p>Esta es una noticia de ejemplo que muestra cómo se vería el contenido completo de una noticia en el sistema de UltraGol. El contenido real vendría de una base de datos o sistema de gestión de contenidos.</p>
                    <p>La plataforma está diseñada para mostrar noticias de manera profesional y atractiva, con todas las funcionalidades necesarias para una experiencia de usuario óptima.</p>
                    
                    <h3>Aspectos Destacados:</h3>
                    <ul>
                        <li>Sistema de categorización avanzado</li>
                        <li>Búsqueda en tiempo real</li>
                        <li>Diseño responsivo y profesional</li>
                        <li>Integración con redes sociales</li>
                    </ul>
                    
                    <div class="news-modal-share">
                        <h4>Compartir esta noticia:</h4>
                        <div class="share-buttons">
                            <button class="share-btn facebook"><i class="fab fa-facebook"></i> Facebook</button>
                            <button class="share-btn twitter"><i class="fab fa-twitter"></i> Twitter</button>
                            <button class="share-btn whatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</button>
                        </div>
                    </div>
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
        overflow-y: auto;
        padding: 20px;
    `;
    
    const modalContent = modal.querySelector('.news-modal-content');
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        max-width: 800px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
    `;
    
    // Agregar estilos del modal
    if (!document.getElementById('news-modal-styles')) {
        addNewsModalStyles();
    }
    
    // Cerrar modal
    const closeButton = modal.querySelector('.close-news-modal');
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

// Obtener noticias de tendencias
function getTrendingNews(trendingId) {
    const trendingNews = {
        'trending-1': {
            id: 'trending-1',
            title: 'América presenta a su nuevo delantero',
            excerpt: 'Las Águilas del América han hecho oficial la contratación de su nuevo delantero estrella.',
            category: 'transfers',
            author: 'Redacción UltraGol',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        'trending-2': {
            id: 'trending-2',
            title: 'Tigres busca reforzar su defensa',
            excerpt: 'Los felinos están en búsqueda activa de un defensor central para completar su plantilla.',
            category: 'transfers',
            author: 'Redacción UltraGol',
            date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        'featured-1': {
            id: 'featured-1',
            title: 'Nuevo refuerzo estrella llega a la Liga MX',
            excerpt: 'El mercado de traspasos sigue movido en la Liga MX con la llegada de una nueva estrella internacional.',
            category: 'transfers',
            author: 'Editor Principal',
            date: new Date().toISOString()
        }
    };
    
    return trendingNews[trendingId];
}

// Obtener nombre de categoría
function getCategoryName(category) {
    const names = {
        transfers: 'TRASPASOS',
        matches: 'PARTIDOS',
        teams: 'EQUIPOS',
        players: 'JUGADORES',
        league: 'LIGA'
    };
    return names[category] || 'NOTICIAS';
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
}

// Agregar estilos del modal
function addNewsModalStyles() {
    const style = document.createElement('style');
    style.id = 'news-modal-styles';
    style.textContent = `
        .news-modal-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
        }
        
        .close-news-modal {
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            font-size: 1.5rem;
            transition: all 0.3s ease;
        }
        
        .close-news-modal:hover {
            background: #c82333;
            transform: scale(1.1);
        }
        
        .news-modal-body {
            padding: 30px;
        }
        
        .news-modal-category {
            background: #ff9933;
            color: white;
            padding: 5px 15px;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 15px;
        }
        
        .news-modal-title {
            font-size: 2rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 15px;
            line-height: 1.3;
        }
        
        .news-modal-meta {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
            font-size: 0.9rem;
            color: #666;
        }
        
        .news-modal-author {
            font-weight: 600;
            color: #ff9933;
        }
        
        .news-modal-image {
            height: 200px;
            background: linear-gradient(45deg, #ff9933, #ffaa44);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 3rem;
            margin-bottom: 25px;
        }
        
        .news-modal-content-text {
            line-height: 1.6;
            color: #333;
        }
        
        .news-modal-content-text p {
            margin-bottom: 15px;
        }
        
        .news-modal-content-text h3 {
            color: #ff9933;
            margin: 25px 0 15px 0;
        }
        
        .news-modal-content-text ul {
            margin-bottom: 25px;
            padding-left: 20px;
        }
        
        .news-modal-content-text li {
            margin-bottom: 8px;
        }
        
        .news-modal-share {
            background: #f8f8f8;
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
        }
        
        .news-modal-share h4 {
            color: #333;
            margin-bottom: 15px;
        }
        
        .share-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .share-btn {
            padding: 8px 15px;
            border: none;
            border-radius: 5px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .share-btn.facebook {
            background: #1877f2;
        }
        
        .share-btn.twitter {
            background: #1da1f2;
        }
        
        .share-btn.whatsapp {
            background: #25d366;
        }
        
        .share-btn:hover {
            transform: translateY(-2px);
            opacity: 0.9;
        }
        
        @media (max-width: 768px) {
            .news-modal-title {
                font-size: 1.5rem;
            }
            
            .news-modal-body {
                padding: 20px;
            }
            
            .share-buttons {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(style);
}

// Mostrar mensaje
function showNewsMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `news-message news-message-${type}`;
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
        if (document.body.contains(messageDiv)) {
            document.body.removeChild(messageDiv);
        }
    }, 3000);
}

// Exportar funciones
window.newsApp = {
    filterNewsByCategory,
    searchNews,
    openNewsDetail,
    displayNews
};