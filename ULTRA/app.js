let currentStreamUrl = '';
let activeTab = 'live';
let currentLeague = 'Liga MX';

function switchTab(tab, element) {
    activeTab = tab;
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    const button = element.closest('.tab') || element;
    button.classList.add('active');
    document.getElementById(tab + 'Content').classList.add('active');
    
    if (tab === 'upcoming') {
        loadUpcomingMatches();
    } else if (tab === 'replays') {
        loadReplays();
    }
}

function watchMatch(matchId, videoUrl = null, videoTitle = null) {
    const modal = document.getElementById('playerModal');
    const modalBody = modal.querySelector('.modal-body');
    const modalTitle = document.getElementById('modalTitle');
    const loader = document.getElementById('modalLoader');
    
    // Si se proporciona una URL de video
    if (videoUrl) {
        modalTitle.textContent = videoTitle || 'Video';
        modal.classList.add('active');
        loader.style.display = 'flex';
        
        // Para videos de YouTube/externos, usar iframe
        // Convertir URLs de YouTube normales a embed si es necesario
        let embedUrl = videoUrl;
        if (videoUrl.includes('youtube.com/watch')) {
            const videoId = videoUrl.split('v=')[1]?.split('&')[0];
            if (videoId) {
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }
        }
        
        modalBody.innerHTML = `
            <div class="loading-spinner" id="modalLoader" style="display: flex;">
                <div class="spinner"></div>
            </div>
            <iframe id="modalIframe" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width: 100%; height: 100%;"></iframe>
        `;
        
        const iframe = document.getElementById('modalIframe');
        iframe.onload = () => {
            setTimeout(() => {
                const loaderEl = document.getElementById('modalLoader');
                if (loaderEl) loaderEl.style.display = 'none';
            }, 500);
        };
    } else {
        // Modo de transmisión en vivo (iframe)
        currentStreamUrl = 'https://servidor-l3ho.github.io/ULTRACANALES.2/index.html';
        
        modalTitle.textContent = 'Transmisión en Vivo - ' + matchId.toUpperCase();
        modal.classList.add('active');
        loader.style.display = 'flex';
        
        modalBody.innerHTML = `
            <div class="loading-spinner" id="modalLoader" style="display: flex;">
                <div class="spinner"></div>
            </div>
            <iframe id="modalIframe" src="${currentStreamUrl}" frameborder="0" allowfullscreen style="width: 100%; height: 100%;"></iframe>
        `;
        
        const iframe = document.getElementById('modalIframe');
        iframe.onload = () => {
            setTimeout(() => {
                const loaderEl = document.getElementById('modalLoader');
                if (loaderEl) loaderEl.style.display = 'none';
            }, 500);
        };
    }
}

function closeModal() {
    const modal = document.getElementById('playerModal');
    const modalBody = modal.querySelector('.modal-body');
    
    modal.classList.remove('active');
    
    // Limpiar iframe si existe
    const iframe = document.getElementById('modalIframe');
    if (iframe) {
        iframe.src = '';
    }
    
    currentStreamUrl = '';
    
    // Restaurar estructura original del modal
    setTimeout(() => {
        modalBody.innerHTML = `
            <div class="loading-spinner" id="modalLoader">
                <div class="spinner"></div>
            </div>
            <iframe id="modalIframe" frameborder="0" allowfullscreen></iframe>
        `;
    }, 300);
}

function refreshStream() {
    const iframe = document.getElementById('modalIframe');
    const loader = document.getElementById('modalLoader');
    
    loader.style.display = 'flex';
    iframe.src = currentStreamUrl;
    
    iframe.onload = () => {
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    };
}

function fullscreenStream() {
    const iframe = document.getElementById('modalIframe');
    
    if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) {
        iframe.webkitRequestFullscreen();
    } else if (iframe.mozRequestFullScreen) {
        iframe.mozRequestFullScreen();
    }
}

function openStream(url) {
    currentStreamUrl = url;
    const modal = document.getElementById('playerModal');
    const iframe = document.getElementById('modalIframe');
    const modalTitle = document.getElementById('modalTitle');
    const loader = document.getElementById('modalLoader');
    
    const streamName = url.includes('ULTRACANALES') ? 'ULTRACANALES' : 'PANEL PREMIUM';
    modalTitle.textContent = 'Transmisión en Vivo - ' + streamName;
    
    modal.classList.add('active');
    loader.style.display = 'flex';
    
    iframe.src = url;
    
    iframe.onload = () => {
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    };
}

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('active');
}

function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'ULTRAGOL',
            text: 'Mira partidos en vivo con ULTRAGOL',
            url: window.location.href
        }).catch(() => {});
    } else {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            showToast('Link copiado al portapapeles');
        });
    }
}

function navTo(section, element) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const button = element.closest('.nav-btn') || element;
    button.classList.add('active');
    
    if (section === 'search') {
        showSearchModal();
    } else if (section === 'calendar') {
        window.location.href = '../calendario.html';
    } else if (section === 'profile') {
        window.location.href = '../index.html';
    }
}

function showSearchModal() {
    showToast('Función de búsqueda próximamente');
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 69, 0, 0.95);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 14px;
        z-index: 10000;
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}

async function loadUpcomingMatches() {
    const container = document.getElementById('upcomingMatches');
    container.innerHTML = '<div class="loading-spinner">Cargando partidos...</div>';
    
    try {
        const partidos = await ULTRAGOL_API.getPartidosProximos(currentLeague);
        
        if (partidos.length === 0) {
            container.innerHTML = '<div class="no-matches">No hay partidos próximos disponibles</div>';
            return;
        }
        
        container.innerHTML = partidos.slice(0, 6).map(partido => `
            <div class="match-card">
                <div class="match-card-bg">
                    <img src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600" alt="Match">
                </div>
                <div class="match-card-content">
                    <div class="teams">
                        <div class="team">
                            <img src="${ULTRAGOL_API.getTeamLogo(partido.equipoLocal, currentLeague)}" alt="${partido.equipoLocal}" class="team-badge" onerror="this.src='https://via.placeholder.com/50'">
                            <span>${partido.equipoLocal || 'TBD'}</span>
                        </div>
                        <div class="team">
                            <img src="${ULTRAGOL_API.getTeamLogo(partido.equipoVisitante, currentLeague)}" alt="${partido.equipoVisitante}" class="team-badge" onerror="this.src='https://via.placeholder.com/50'">
                            <span>${partido.equipoVisitante || 'TBD'}</span>
                        </div>
                    </div>
                    <div class="match-score-mini">
                        <span class="match-time">${partido.hora || 'TBD'}</span>
                    </div>
                    <button class="watch-btn" onclick="showToast('Este partido aún no ha comenzado')">
                        <span>PRÓXIMAMENTE</span>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading upcoming matches:', error);
        container.innerHTML = '<div class="error-message">Error al cargar partidos próximos</div>';
    }
}

async function loadReplays() {
    const container = document.getElementById('replayMatches');
    container.innerHTML = '<div class="loading-spinner">Cargando mejores momentos de Liga MX...</div>';
    
    try {
        // Cargar videos desde la API
        const response = await fetch('/api/ultragol/videos');
        const data = await response.json();
        
        // La API puede devolver un array directamente o un objeto con un array dentro
        let videosArray = Array.isArray(data) ? data : (data.videos || data.data || []);
        
        // Si hay videos de la API, usarlos
        if (videosArray && videosArray.length > 0) {
            // Aplanar las categorías si existen
            let allVideos = [];
            if (videosArray.mejoresMomentos) {
                allVideos = allVideos.concat(videosArray.mejoresMomentos || []);
            }
            if (videosArray.resumenes) {
                allVideos = allVideos.concat(videosArray.resumenes || []);
            }
            if (videosArray.goles) {
                allVideos = allVideos.concat(videosArray.goles || []);
            }
            // Si no hay categorías, usar el array directamente
            if (allVideos.length === 0 && Array.isArray(videosArray)) {
                allVideos = videosArray;
            }
            
            container.innerHTML = allVideos.slice(0, 4).map((video, index) => {
                const videoUrl = video.urlEmbed || video.url || video.videoUrl || video.link || '';
                const videoTitle = video.titulo || video.title || 'Video sin título';
                const videoTitleEscaped = videoTitle.replace(/'/g, "\\'");
                const videoUrlEscaped = videoUrl.replace(/'/g, "\\'");
                
                return `
                <div class="match-card">
                    <div class="match-card-bg">
                        <img src="${video.thumbnail || video.imagen || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600'}" alt="${videoTitle}">
                    </div>
                    <div class="match-card-content">
                        <div class="teams">
                            <h4 style="font-size: 13px; margin-bottom: 8px; color: var(--text);">${videoTitle}</h4>
                        </div>
                        <div class="match-score-mini">
                            <span class="match-time">Liga MX</span>
                        </div>
                        <button class="watch-btn" onclick="watchMatch('${video.id || 'video-' + index}', '${videoUrlEscaped}', '${videoTitleEscaped}')">
                            <span>VER VIDEO</span>
                        </button>
                    </div>
                </div>
                `;
            }).join('');
        } else {
            // Usar videos de muestra si no hay datos de la API
            const videos = [
                {
                    titulo: 'Resumen Jornada 7 - Liga MX',
                    equipos: 'AMÉRICA vs CRUZ AZUL',
                    imagen: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600'
                },
                {
                    titulo: 'Mejores Goles Jornada 7',
                    equipos: 'TIGRES vs MONTERREY',
                    imagen: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600'
                },
                {
                    titulo: 'Highlights Liga MX',
                    equipos: 'CHIVAS vs PUMAS',
                    imagen: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600'
                },
                {
                    titulo: 'Resumen de la Semana',
                    equipos: 'SANTOS vs ATLAS',
                    imagen: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600'
                }
            ];
            
            container.innerHTML = videos.map((video, index) => `
                <div class="match-card">
                    <div class="match-card-bg">
                        <img src="${video.imagen}" alt="${video.titulo}">
                    </div>
                    <div class="match-card-content">
                        <div class="teams">
                            <h4 style="font-size: 13px; margin-bottom: 8px; color: var(--text);">${video.titulo}</h4>
                        </div>
                        <div class="match-score-mini">
                            <span class="match-time">Liga MX</span>
                        </div>
                        <button class="watch-btn" onclick="watchMatch('ligamx-video-${index}')">
                            <span>VER VIDEO</span>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading replays:', error);
        container.innerHTML = '<div class="error-message">Error al cargar los mejores momentos</div>';
    }
}

async function loadLiveMatches() {
    const container = document.getElementById('liveMatches');
    if (!container) return;
    
    try {
        const partidos = await ULTRAGOL_API.getPartidosEnVivo(currentLeague);
        
        if (partidos.length === 0) {
            container.innerHTML = '<div class="no-matches">No hay partidos en vivo en este momento</div>';
            return;
        }
        
        container.innerHTML = partidos.map(partido => `
            <div class="match-card">
                <div class="match-card-bg">
                    <img src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600" alt="Match">
                </div>
                <div class="match-card-content">
                    <div class="teams">
                        <div class="team">
                            <img src="${ULTRAGOL_API.getTeamLogo(partido.equipoLocal, currentLeague)}" alt="${partido.equipoLocal}" class="team-badge" onerror="this.src='https://via.placeholder.com/50'">
                            <span>${partido.equipoLocal || 'TBD'}</span>
                        </div>
                        <div class="team">
                            <img src="${ULTRAGOL_API.getTeamLogo(partido.equipoVisitante, currentLeague)}" alt="${partido.equipoVisitante}" class="team-badge" onerror="this.src='https://via.placeholder.com/50'">
                            <span>${partido.equipoVisitante || 'TBD'}</span>
                        </div>
                    </div>
                    <div class="match-score-mini">
                        ${partido.marcador || '0 - 0'}
                        <span class="match-time live-indicator">LIVE</span>
                    </div>
                    <button class="watch-btn" onclick="watchMatch('${partido.id || 'live-match'}')">
                        <span>WATCH NOW</span>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading live matches:', error);
    }
}

async function loadLeagues() {
    try {
        const ligas = await ULTRAGOL_API.getLigas();
        console.log('Ligas disponibles:', ligas);
        
        const leagueBtns = document.querySelectorAll('.league-btn');
        leagueBtns.forEach(btn => {
            btn.addEventListener('click', async function() {
                leagueBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const leagueName = this.querySelector('span').textContent;
                await loadMatchesByLeague(leagueName);
            });
        });
    } catch (error) {
        console.error('Error loading leagues:', error);
    }
}

async function loadMatchesByLeague(leagueName) {
    currentLeague = leagueName;
    showToast(`Cargando datos de ${leagueName}...`);
    console.log(`Loading data for ${leagueName}`);
    
    // Actualizar el título de la tabla
    const standingsTitle = document.getElementById('standingsLeagueName');
    if (standingsTitle) {
        standingsTitle.textContent = `TABLA DE ${leagueName.toUpperCase()}`;
    }
    
    // Reload matches for current tab
    if (activeTab === 'live') {
        await loadLiveMatches();
    } else if (activeTab === 'upcoming') {
        await loadUpcomingMatches();
    }
    
    try {
        const [tabla, goleadores, noticias] = await Promise.all([
            ULTRAGOL_API.getTablaPorLiga(leagueName),
            ULTRAGOL_API.getGoleadoresPorLiga(leagueName),
            ULTRAGOL_API.getNoticiasPorLiga(leagueName)
        ]);
        
        console.log(`Datos de ${leagueName}:`, { tabla, goleadores, noticias });
        
        // Actualizar tabla de posiciones
        if (tabla && tabla.length > 0) {
            displayStandings(tabla, leagueName);
        } else {
            const standingsTable = document.getElementById('standingsTable');
            if (standingsTable) {
                standingsTable.innerHTML = '<div class="standings-loading">No hay datos de tabla disponibles</div>';
            }
        }
        
        // Actualizar noticias
        if (noticias.length > 0) {
            const newsGrid = document.querySelector('.news-grid');
            if (newsGrid) {
                newsGrid.innerHTML = noticias.slice(0, 6).map(noticia => `
                    <div class="news-card">
                        <img src="${noticia.imagen || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600'}" alt="${noticia.titulo}" onerror="this.src='https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600'">
                        <div class="news-content">
                            <h4>${noticia.titulo || noticia.headline || 'Noticia sin título'}</h4>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error(`Error loading data for ${leagueName}:`, error);
    }
}

function displayStandings(tabla, leagueName) {
    const standingsTable = document.getElementById('standingsTable');
    if (!standingsTable) return;
    
    const standingsHTML = `
        <div class="standings-row standings-header">
            <div class="standings-pos">#</div>
            <div class="standings-team">EQUIPO</div>
            <div class="standings-stat">PJ</div>
            <div class="standings-stat">DG</div>
            <div class="standings-stat">GD</div>
            <div class="standings-pts">PTS</div>
        </div>
        ${tabla.slice(0, 10).map((team, index) => `
            <div class="standings-row">
                <div class="standings-pos">${team.posicion || index + 1}</div>
                <div class="standings-team">
                    <img src="${ULTRAGOL_API.getTeamLogo(team.equipo, leagueName)}" alt="${team.equipo}" class="standings-team-logo" onerror="this.style.display='none'">
                    <span class="standings-team-name">${team.equipo}</span>
                </div>
                <div class="standings-stat">${team.estadisticas?.pj || team.pj || 0}</div>
                <div class="standings-stat">${team.estadisticas?.dif || team.dif || 0}</div>
                <div class="standings-stat">${team.estadisticas?.gd || team.gd || 0}</div>
                <div class="standings-pts">${team.estadisticas?.pts || team.pts || 0}</div>
            </div>
        `).join('')}
    `;
    
    standingsTable.innerHTML = standingsHTML;
}

async function loadNews() {
    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) return;
    
    try {
        const noticias = await ULTRAGOL_API.getAllNoticias();
        
        if (noticias.length === 0) {
            console.log('No hay noticias disponibles');
            return;
        }
        
        newsGrid.innerHTML = noticias.slice(0, 6).map(noticia => `
            <div class="news-card">
                <img src="${noticia.imagen || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600'}" alt="${noticia.titulo}" onerror="this.src='https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600'">
                <div class="news-content">
                    <h4>${noticia.titulo || noticia.headline || 'Noticia sin título'}</h4>
                    ${noticia.liga ? `<span class="news-league">${noticia.liga}</span>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes slideDown {
            from { opacity: 1; transform: translateX(-50%) translateY(0); }
            to { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }
        .loading-spinner {
            text-align: center;
            padding: 40px;
            color: #fff;
        }
        .no-matches, .error-message {
            text-align: center;
            padding: 40px;
            color: rgba(255,255,255,0.7);
        }
        .live-indicator {
            background: #ff4500;
            padding: 2px 8px;
            border-radius: 4px;
            margin-left: 8px;
        }
    `;
    document.head.appendChild(style);
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = true;
    }
    
    await loadLeagues();
    await loadLiveMatches();
    await loadLigaMXNews();
    await loadMatchesByLeague('Liga MX'); // Cargar tabla de Liga MX por defecto
});

document.addEventListener('click', (e) => {
    if (e.target.id === 'playerModal') {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel.classList.contains('active')) {
            toggleSettings();
        }
    }
});        
function showLockedLeagueMessage(leagueName) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <i class="fas fa-lock"></i> ${leagueName} solo está disponible en la aplicación móvil de UltraGol
    `;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 69, 0, 0.95);
        color: white;
        padding: 15px 24px;
        border-radius: 25px;
        font-size: 14px;
        z-index: 10000;
        animation: slideUp 0.3s ease;
        max-width: 90%;
        text-align: center;
        box-shadow: 0 4px 15px rgba(255, 69, 0, 0.4);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Función para seleccionar Liga MX
function selectLeague(leagueName, element) {
    const leagueBtns = document.querySelectorAll('.league-btn');
    leagueBtns.forEach(b => b.classList.remove('active'));
    element.classList.add('active');
    currentLeague = leagueName;
    loadMatchesByLeague(leagueName);
}

// Función para abrir modal de noticia
function openNewsModal(noticia) {
    const modal = document.getElementById('newsModal');
    const modalTitle = document.getElementById('newsModalTitle');
    const modalBody = modal.querySelector('.news-modal-body');
    
    modalTitle.textContent = noticia.titulo || noticia.headline || 'Noticia';
    
    // Si la noticia tiene un link externo, mostrarlo en un iframe
    if (noticia.link || noticia.url || noticia.enlace) {
        const newsUrl = noticia.link || noticia.url || noticia.enlace;
        modalBody.innerHTML = `
            <div style="position: relative; width: 100%; height: 70vh;">
                <div class="loading-spinner" style="display: flex; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10;">
                    <div class="spinner"></div>
                </div>
                <iframe src="${newsUrl}" frameborder="0" style="width: 100%; height: 100%; border: none;" onload="this.previousElementSibling.style.display='none'"></iframe>
            </div>
            ${noticia.fecha ? `<p style="color: #999; font-size: 12px; margin-top: 15px; padding: 10px;"><i class="fas fa-calendar"></i> ${noticia.fecha}</p>` : ''}
        `;
    } else {
        // Si no hay link, mostrar la información completa de la noticia
        modalBody.innerHTML = `
            <img id="newsModalImage" src="${noticia.imagen || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600'}" alt="Noticia" style="width: 100%; border-radius: 8px; margin-bottom: 15px;">
            <div id="newsModalText" class="news-modal-text">
                <h3 style="margin-bottom: 15px;">${noticia.titulo || noticia.headline || ''}</h3>
                ${noticia.descripcion ? `<p style="margin-bottom: 10px;">${noticia.descripcion}</p>` : ''}
                ${noticia.contenido ? `<p style="margin-bottom: 10px;">${noticia.contenido}</p>` : ''}
                ${noticia.texto ? `<p style="margin-bottom: 10px;">${noticia.texto}</p>` : ''}
                ${noticia.cuerpo ? `<div style="margin-bottom: 10px;">${noticia.cuerpo}</div>` : ''}
                ${noticia.autor ? `<p style="color: #999; font-size: 12px; margin-top: 15px;"><i class="fas fa-user"></i> ${noticia.autor}</p>` : ''}
                ${noticia.fecha ? `<p style="color: #999; font-size: 12px; margin-top: 15px;"><i class="fas fa-calendar"></i> ${noticia.fecha}</p>` : ''}
            </div>
        `;
    }
    
    modal.classList.add('active');
}

// Función para cerrar modal de noticia
function closeNewsModal() {
    const modal = document.getElementById('newsModal');
    modal.classList.remove('active');
}

// Cargar noticias de Liga MX desde la API
async function loadLigaMXNews() {
    const newsGrid = document.getElementById('newsGrid');
    if (!newsGrid) return;
    
    try {
        newsGrid.innerHTML = '<div class="news-loading">Cargando noticias de Liga MX...</div>';
        
        const response = await fetch('/api/ultragol/noticias');
        const data = await response.json();
        
        // La API puede devolver un array directamente o un objeto con un array dentro
        let noticiasArray = Array.isArray(data) ? data : (data.noticias || data.data || []);
        
        if (!noticiasArray || noticiasArray.length === 0) {
            // Mostrar noticias de fallback si no hay datos de la API
            newsGrid.innerHTML = `
                <div class="news-card" onclick="showToast('Visita nuestra página principal para más noticias de Liga MX')">
                    <img src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600" alt="News">
                    <div class="news-content">
                        <h4>Últimas noticias de Liga MX</h4>
                    </div>
                </div>
                <div class="news-card" onclick="showToast('Visita nuestra página principal para más noticias de Liga MX')">
                    <img src="https://images.unsplash.com/photo-1614632537239-fa46907f6e44?w=600" alt="News">
                    <div class="news-content">
                        <h4>Análisis de la jornada</h4>
                    </div>
                </div>
                <div class="news-card" onclick="showToast('Visita nuestra página principal para más noticias de Liga MX')">
                    <img src="https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600" alt="News">
                    <div class="news-content">
                        <h4>Mejores jugadas</h4>
                    </div>
                </div>
                <div class="news-card" onclick="showToast('Visita nuestra página principal para más noticias de Liga MX')">
                    <img src="https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600" alt="News">
                    <div class="news-content">
                        <h4>Tabla de posiciones actualizada</h4>
                    </div>
                </div>
            `;
            return;
        }
        
        // Mostrar solo las primeras 4 noticias
        const noticiasLimitadas = noticiasArray.slice(0, 4);
        
        newsGrid.innerHTML = noticiasLimitadas.map((noticia, index) => {
            const noticiaStr = JSON.stringify(noticia).replace(/'/g, "\\'");
            return `
            <div class="news-card" onclick='openNewsModal(${noticiaStr})'>
                <img src="${noticia.imagen || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600'}" 
                     alt="${noticia.titulo || 'Noticia'}" 
                     onerror="this.src='https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600'">
                <div class="news-content">
                    <h4>${noticia.titulo || noticia.headline || 'Noticia sin título'}</h4>
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading Liga MX news:', error);
        newsGrid.innerHTML = `
            <div class="news-card" onclick="showToast('Visita nuestra página principal para más noticias de Liga MX')">
                <img src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600" alt="News">
                <div class="news-content">
                    <h4>Últimas noticias de Liga MX</h4>
                </div>
            </div>
            <div class="news-card" onclick="showToast('Visita nuestra página principal para más noticias de Liga MX')">
                <img src="https://images.unsplash.com/photo-1614632537239-fa46907f6e44?w=600" alt="News">
                <div class="news-content">
                    <h4>Análisis de la jornada</h4>
                </div>
            </div>
            <div class="news-card" onclick="showToast('Visita nuestra página principal para más noticias de Liga MX')">
                <img src="https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600" alt="News">
                <div class="news-content">
                    <h4>Mejores jugadas</h4>
                </div>
            </div>
            <div class="news-card" onclick="showToast('Visita nuestra página principal para más noticias de Liga MX')">
                <img src="https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600" alt="News">
                <div class="news-content">
                    <h4>Tabla de posiciones actualizada</h4>
                </div>
            </div>
        `;
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    if (e.target.id === 'newsModal') {
        closeNewsModal();
    }
});
