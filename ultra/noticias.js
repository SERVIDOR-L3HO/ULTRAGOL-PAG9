let currentLeague = 'Liga MX';
const API_BASE = 'https://ultragol-api-3.vercel.app';

const leaguesConfig = {
    'Liga MX': {
        noticias: '/noticias'
    },
    'Premier League': {
        noticias: '/premier/noticias'
    },
    'La Liga': {
        noticias: '/laliga/noticias'
    },
    'Serie A': {
        noticias: '/seriea/noticias'
    },
    'Bundesliga': {
        noticias: '/bundesliga/noticias'
    },
    'Ligue 1': {
        noticias: '/ligue1/noticias'
    }
};

function selectLeague(leagueName, element) {
    document.querySelectorAll('.league-btn').forEach(btn => btn.classList.remove('active'));
    
    if (element) {
        element.classList.add('active');
    }
    
    currentLeague = leagueName;
    
    const newsTitle = document.getElementById('newsLeagueName');
    if (newsTitle) {
        newsTitle.textContent = `NOTICIAS Y RESÚMENES - ${leagueName}`;
    }
    
    loadNews();
    showToast(`Mostrando noticias de ${leagueName}`);
}

async function loadNews() {
    const newsGrid = document.getElementById('newsGrid');
    const featuredSection = document.getElementById('featuredNews');
    
    if (newsGrid) {
        newsGrid.innerHTML = '<div class="news-loading"><i class="fas fa-spinner fa-spin"></i> Cargando noticias...</div>';
    }
    if (featuredSection) {
        featuredSection.innerHTML = '';
    }
    
    try {
        const leagueConfig = leaguesConfig[currentLeague];
        const endpoint = leagueConfig ? leagueConfig.noticias : '/noticias';
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();
        
        if (!newsGrid) return;
        
        if (!data.noticias || data.noticias.length === 0) {
            newsGrid.innerHTML = '<div class="news-loading"><i class="fas fa-newspaper"></i> No hay noticias disponibles</div>';
            return;
        }
        
        const featuredNews = data.noticias[0];
        const otherNews = data.noticias.slice(1);
        
        if (featuredSection && featuredNews) {
            featuredSection.innerHTML = `
                <div class="featured-card" onclick='openNewsModal(${JSON.stringify({
                    titulo: featuredNews.titulo,
                    descripcion: featuredNews.descripcion || '',
                    resumen: featuredNews.resumen || '',
                    contenido: featuredNews.contenido || featuredNews.descripcion || '',
                    imagen: featuredNews.imagen || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
                    fecha: featuredNews.fecha || '',
                    hora: featuredNews.hora || '',
                    fuente: featuredNews.fuente || '',
                    url: featuredNews.url || ''
                }).replace(/'/g, "\\'").replace(/\n/g, "\\n")})'> 
                    <div class="featured-image">
                        <img src="${featuredNews.imagen || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'}" alt="${featuredNews.titulo}">
                        <div class="featured-badge">
                            <i class="fas fa-fire"></i> DESTACADO
                        </div>
                    </div>
                    <div class="featured-content">
                        <div class="featured-meta">
                            <span class="featured-source"><i class="fas fa-newspaper"></i> ${featuredNews.fuente || 'Fuente'}</span>
                            <span class="featured-date"><i class="far fa-clock"></i> ${featuredNews.fecha || ''} ${featuredNews.hora || ''}</span>
                        </div>
                        <h2>${featuredNews.titulo}</h2>
                        <p class="featured-desc">${featuredNews.descripcion || featuredNews.resumen || ''}</p>
                        <button class="read-more-btn"><i class="fas fa-arrow-right"></i> Leer más</button>
                    </div>
                </div>
            `;
        }
        
        newsGrid.innerHTML = otherNews.map((noticia, index) => `
            <div class="news-card" onclick='openNewsModal(${JSON.stringify({
                titulo: noticia.titulo,
                descripcion: noticia.descripcion || '',
                resumen: noticia.resumen || '',
                contenido: noticia.contenido || noticia.descripcion || '',
                imagen: noticia.imagen || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
                fecha: noticia.fecha || '',
                hora: noticia.hora || '',
                fuente: noticia.fuente || '',
                url: noticia.url || ''
            }).replace(/'/g, "\\'").replace(/\n/g, "\\n")})'> 
                <div class="news-image">
                    <img src="${noticia.imagen || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600'}" alt="${noticia.titulo}" loading="lazy">
                    ${noticia.fuente ? `<span class="news-source-badge">${noticia.fuente}</span>` : ''}
                </div>
                <div class="news-content">
                    <div class="news-meta">
                        <span><i class="far fa-clock"></i> ${noticia.fecha || ''}</span>
                    </div>
                    <h4>${noticia.titulo}</h4>
                    <p>${(noticia.descripcion || noticia.resumen || '').substring(0, 120)}...</p>
                </div>
            </div>
        `).join('');
        
        const updateInfo = document.getElementById('updateInfo');
        if (updateInfo && data.actualizado) {
            updateInfo.innerHTML = `<i class="fas fa-sync-alt"></i> Actualizado: ${data.actualizado}`;
        }
        
    } catch (error) {
        console.error('Error loading news:', error);
        if (newsGrid) {
            newsGrid.innerHTML = '<div class="news-loading"><i class="fas fa-exclamation-triangle"></i> Error al cargar noticias. Intenta de nuevo.</div>';
        }
    }
}

function openNewsModal(noticia) {
    const modal = document.getElementById('newsModal');
    const title = document.getElementById('newsModalTitle');
    const image = document.getElementById('newsModalImage');
    const text = document.getElementById('newsModalText');
    const source = document.getElementById('newsModalSource');
    const date = document.getElementById('newsModalDate');
    const originalLink = document.getElementById('newsOriginalLink');
    
    if (title) title.textContent = noticia.titulo;
    if (image) image.src = noticia.imagen;
    
    if (source) {
        source.innerHTML = `<i class="fas fa-newspaper"></i> ${noticia.fuente || 'Fuente'}`;
    }
    
    if (date) {
        date.innerHTML = `<i class="far fa-calendar-alt"></i> ${noticia.fecha || ''} ${noticia.hora || ''}`;
    }
    
    if (originalLink && noticia.url) {
        originalLink.href = noticia.url;
        originalLink.style.display = 'inline-flex';
    } else if (originalLink) {
        originalLink.style.display = 'none';
    }
    
    if (text) {
        const contenido = noticia.contenido || noticia.descripcion || '';
        const formattedContent = formatArticleContent(contenido);
        text.innerHTML = formattedContent;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function formatArticleContent(content) {
    if (!content) return '';
    
    let formatted = content
        .split('\n\n')
        .filter(p => p.trim())
        .map(p => {
            if (p.includes('pic.twitter.com') || p.includes('????')) {
                return `<div class="article-tweet">${p}</div>`;
            }
            return `<p>${p}</p>`;
        })
        .join('');
    
    return formatted;
}

function closeNewsModal() {
    const modal = document.getElementById('newsModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'ULTRAGOL - Noticias',
            text: 'Las mejores noticias de fútbol en ULTRAGOL',
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('Enlace copiado al portapapeles');
        });
    }
}

function shareNews(noticia) {
    if (navigator.share) {
        navigator.share({
            title: noticia.titulo,
            text: noticia.descripcion,
            url: noticia.url || window.location.href
        }).catch(err => console.log('Error sharing:', err));
    }
}

function showToast(message) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeNewsModal();
    }
});

document.getElementById('newsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'newsModal') {
        closeNewsModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadNews();
});
