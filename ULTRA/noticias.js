let currentLeague = 'Liga MX';

const leaguesConfig = {
    'Liga MX': {
        noticias: '/Noticias'
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
    try {
        const leagueConfig = leaguesConfig[currentLeague];
        const endpoint = leagueConfig ? leagueConfig.noticias : '/noticias';
        const response = await fetch(`https://ultragol-api3.onrender.com${endpoint}`);
        const data = await response.json();
        
        const newsGrid = document.getElementById('newsGrid');
        if (!newsGrid) return;
        
        if (!data.noticias || data.noticias.length === 0) {
            newsGrid.innerHTML = '<div class="news-loading">No hay noticias disponibles</div>';
            return;
        }
        
        newsGrid.innerHTML = data.noticias.map((noticia, index) => `
            <div class="news-card" onclick='openNewsModal(${JSON.stringify({
                titulo: noticia.titulo,
                descripcion: noticia.descripcion || noticia.contenido || '',
                imagen: noticia.imagen || noticia.urlImagen || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
                fecha: noticia.fecha || ''
            }).replace(/'/g, "\\'")})'> 
                <div class="news-image">
                    <img src="${noticia.imagen || noticia.urlImagen || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600'}" alt="${noticia.titulo}">
                </div>
                <div class="news-content">
                    <h4>${noticia.titulo}</h4>
                    <p>${(noticia.descripcion || noticia.contenido || '').substring(0, 100)}...</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading news:', error);
        const newsGrid = document.getElementById('newsGrid');
        if (newsGrid) {
            newsGrid.innerHTML = '<div class="news-loading">Error al cargar noticias</div>';
        }
    }
}

function openNewsModal(noticia) {
    const modal = document.getElementById('newsModal');
    const title = document.getElementById('newsModalTitle');
    const image = document.getElementById('newsModalImage');
    const text = document.getElementById('newsModalText');
    
    title.textContent = noticia.titulo;
    image.src = noticia.imagen;
    text.innerHTML = `
        ${noticia.fecha ? `<p class="news-date"><i class="far fa-calendar"></i> ${noticia.fecha}</p>` : ''}
        <p>${noticia.descripcion}</p>
    `;
    
    modal.classList.add('active');
}

function closeNewsModal() {
    const modal = document.getElementById('newsModal');
    modal.classList.remove('active');
}

function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'ULTRAGOL - Noticias',
            text: 'Noticias de fútbol en ULTRAGOL',
            url: window.location.href
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

document.addEventListener('DOMContentLoaded', () => {
    loadNews();
});
