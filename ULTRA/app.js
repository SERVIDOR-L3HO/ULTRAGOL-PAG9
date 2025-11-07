let currentStreamUrl = '';
let activeTab = 'live';
let currentLeague = 'Liga MX';
let marcadoresData = null;
let transmisionesData = null;
let updateInterval = null;
let currentFeaturedIndex = 0;
let featuredMatches = [];
let touchStartX = 0;
let touchEndX = 0;

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
    await loadMarcadores();
    await loadTransmisiones();
    startAutoUpdate();
    await loadStandings();
    await loadNews();
});

// Función principal para cargar marcadores desde la API
async function loadMarcadores() {
    try {
        const response = await fetch('https://ultragol-api3.onrender.com/marcadores');
        const data = await response.json();
        marcadoresData = data;
        
        console.log('✅ Marcadores cargados:', data);
        
        // Actualizar featured match
        updateFeaturedMatch(data);
        
        // Actualizar partidos según la pestaña activa
        if (activeTab === 'live') {
            updateLiveMatches(data);
        } else if (activeTab === 'upcoming') {
            updateUpcomingMatches(data);
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error cargando marcadores:', error);
        return null;
    }
}

// Función para cargar transmisiones desde ambas APIs
async function loadTransmisiones() {
    try {
        // Cargar ambas APIs en paralelo
        const [response1, response2] = await Promise.all([
            fetch('https://ultragol-api3.onrender.com/transmisiones'),
            fetch('https://ultragol-api3.onrender.com/transmisiones3')
        ]);
        
        const data1 = await response1.json();
        const data2 = await response2.json();
        
        // Combinar las transmisiones de ambas APIs
        const transmisionesCombinadas = [
            ...(data1.transmisiones || []),
            ...(data2.transmisiones || [])
        ];
        
        // Crear el objeto combinado
        transmisionesData = {
            transmisiones: transmisionesCombinadas
        };
        
        console.log('✅ Transmisiones cargadas desde API 1:', data1.transmisiones?.length || 0);
        console.log('✅ Transmisiones cargadas desde API 2 (transmisiones3):', data2.transmisiones?.length || 0);
        console.log('✅ Total transmisiones combinadas:', transmisionesCombinadas.length);
        
        return transmisionesData;
    } catch (error) {
        console.error('❌ Error cargando transmisiones:', error);
        return null;
    }
}

// Actualizar el carrusel del partido destacado con TODOS los partidos
function updateFeaturedMatch(data) {
    if (!data || !data.partidos || data.partidos.length === 0) return;
    
    const carousel = document.getElementById('featuredCarousel');
    if (!carousel) return;
    
    // Preservar la posición actual del usuario
    const previousMatchId = featuredMatches[currentFeaturedIndex]?.id;
    
    // Guardar todos los partidos para el carrusel
    featuredMatches = data.partidos;
    
    // Intentar mantener el mismo partido que el usuario estaba viendo
    if (previousMatchId) {
        const matchIndex = featuredMatches.findIndex(p => p.id === previousMatchId);
        if (matchIndex !== -1) {
            // El partido todavía existe, mantener la posición
            currentFeaturedIndex = matchIndex;
        } else {
            // El partido ya no existe, resetear a 0
            currentFeaturedIndex = 0;
        }
    } else {
        // Primera carga, empezar en 0
        currentFeaturedIndex = 0;
    }
    
    // Crear un slide para cada partido
    carousel.innerHTML = featuredMatches.map((partido, index) => {
        const hora = formatearHora(partido.fecha);
        const isActive = index === currentFeaturedIndex ? 'active' : '';
        
        // Determinar el badge apropiado
        let liveBadgeHTML = '';
        if (partido.estado?.enVivo) {
            liveBadgeHTML = `
                <div class="live-badge">
                    <span class="live-dot"></span>
                    <span>EN VIVO - ${partido.reloj}</span>
                </div>
            `;
        } else if (partido.estado?.programado) {
            liveBadgeHTML = `
                <div class="live-badge" style="background: rgba(255, 165, 0, 0.95);">
                    <span class="live-dot" style="background: #ffa500;"></span>
                    <span>${hora}</span>
                </div>
            `;
        } else if (partido.estado?.finalizado) {
            liveBadgeHTML = `
                <div class="live-badge" style="background: rgba(128, 128, 128, 0.95);">
                    <i class="fas fa-check-circle"></i>
                    <span>FINALIZADO</span>
                </div>
            `;
        }
        
        return `
            <div class="featured-match ${isActive}" data-index="${index}">
                <div class="match-overlay"></div>
                <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800" alt="Stadium" class="match-bg">

                <div class="match-score">
                    <div class="team-logo">
                        <img src="${partido.local.logo}" alt="${partido.local.nombreCorto}" onerror="this.src='https://via.placeholder.com/50'">
                    </div>
                    <div class="score-display">
                        <span class="score">${partido.local.marcador} - ${partido.visitante.marcador}</span>
                    </div>
                    <div class="team-logo">
                        <img src="${partido.visitante.logo}" alt="${partido.visitante.nombreCorto}" onerror="this.src='https://via.placeholder.com/50'">
                    </div>
                </div>

                <div class="match-info">
                    <div class="match-time-display">
                        <i class="far fa-clock"></i> ${hora}
                    </div>
                    <h2 class="match-title">${partido.local.nombreCorto} vs. ${partido.visitante.nombreCorto}</h2>
                    <div class="match-badges">
                        <span class="badge-icon" title="Marcador"><i class="fas fa-circle"></i></span>
                        <span class="badge-icon" title="Estadio: ${partido.estadio || 'TBD'}"><i class="fas fa-users"></i></span>
                        <span class="badge-icon" title="Transmisión"><i class="fas fa-wifi"></i></span>
                    </div>
                </div>

                ${liveBadgeHTML}
            </div>
        `;
    }).join('');
    
    // Actualizar indicadores
    updateCarouselIndicators();
    
    // Mostrar/ocultar botones de navegación según cantidad de partidos
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    
    if (featuredMatches.length > 1) {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    } else {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
    
    // Agregar soporte para swipe táctil
    initTouchSupport();
}

// Actualizar indicadores del carrusel
function updateCarouselIndicators() {
    const indicatorsContainer = document.getElementById('carouselIndicators');
    if (!indicatorsContainer) return;
    
    if (featuredMatches.length <= 1) {
        indicatorsContainer.innerHTML = '';
        return;
    }
    
    indicatorsContainer.innerHTML = featuredMatches.map((_, index) => {
        const isActive = index === currentFeaturedIndex ? 'active' : '';
        return `<span class="indicator ${isActive}" onclick="goToFeaturedMatch(${index})"></span>`;
    }).join('');
}

// Navegar al siguiente partido
function nextFeaturedMatch() {
    if (currentFeaturedIndex < featuredMatches.length - 1) {
        currentFeaturedIndex++;
        updateCarouselPosition();
    }
}

// Navegar al partido anterior
function prevFeaturedMatch() {
    if (currentFeaturedIndex > 0) {
        currentFeaturedIndex--;
        updateCarouselPosition();
    }
}

// Ir a un partido específico
function goToFeaturedMatch(index) {
    if (index >= 0 && index < featuredMatches.length) {
        currentFeaturedIndex = index;
        updateCarouselPosition();
    }
}

// Actualizar posición del carrusel
function updateCarouselPosition() {
    const slides = document.querySelectorAll('.featured-match');
    slides.forEach((slide, index) => {
        slide.classList.remove('active');
        if (index === currentFeaturedIndex) {
            slide.classList.add('active');
        }
    });
    
    updateCarouselIndicators();
}

// Inicializar soporte táctil para swipe
function initTouchSupport() {
    const carousel = document.getElementById('featuredCarousel');
    if (!carousel) return;
    
    // Remover listeners anteriores si existen
    carousel.removeEventListener('touchstart', handleTouchStart);
    carousel.removeEventListener('touchend', handleTouchEnd);
    
    // Agregar nuevos listeners
    carousel.addEventListener('touchstart', handleTouchStart, { passive: true });
    carousel.addEventListener('touchend', handleTouchEnd, { passive: true });
}

// Manejar inicio de touch
function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
}

// Manejar fin de touch
function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
}

// Detectar gesto de swipe
function handleSwipeGesture() {
    const swipeThreshold = 50; // Mínimo de píxeles para considerar swipe
    
    if (touchEndX < touchStartX - swipeThreshold) {
        // Swipe izquierda - siguiente partido
        nextFeaturedMatch();
    }
    
    if (touchEndX > touchStartX + swipeThreshold) {
        // Swipe derecha - partido anterior
        prevFeaturedMatch();
    }
}

// Actualizar partidos en vivo
function updateLiveMatches(data) {
    const container = document.getElementById('liveMatches');
    if (!container) return;
    
    const partidosEnVivo = data.partidos.filter(p => {
        return p.estado?.enVivo || 
               (!p.estado?.finalizado && !p.estado?.programado && p.reloj && p.reloj !== '0\'');
    });
    
    if (partidosEnVivo.length === 0) {
        container.innerHTML = `
            <div class="no-matches" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 16px;">⚽</div>
                <div style="color: rgba(255,255,255,0.8); font-size: 18px; margin-bottom: 8px;">No hay partidos de Liga MX en vivo</div>
                <div style="color: rgba(255,255,255,0.5); font-size: 14px;">Revisa la sección UPCOMING para próximos partidos</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = partidosEnVivo.map(partido => renderLiveMatchCard(partido)).join('');
}

// Renderizar tarjeta de partido en vivo
function renderLiveMatchCard(partido) {
    const golesInfo = renderGolesInfo(partido);
    
    return `
        <div class="match-card live-match-card">
            <div class="live-badge-corner">
                <span class="live-dot"></span>
                EN VIVO
            </div>
            <div class="match-card-bg">
                <img src="ultragol-vs-stadium.jpg" alt="Match">
            </div>
            <div class="match-card-content">
                <div class="match-clock">${partido.reloj}</div>
                <div class="teams">
                    <div class="team">
                        <img src="${partido.local.logo}" alt="${partido.local.nombreCorto}" class="team-badge" onerror="this.src='https://via.placeholder.com/50'">
                        <span>${partido.local.nombreCorto}</span>
                    </div>
                    <div class="team">
                        <img src="${partido.visitante.logo}" alt="${partido.visitante.nombreCorto}" class="team-badge" onerror="this.src='https://via.placeholder.com/50'">
                        <span>${partido.visitante.nombreCorto}</span>
                    </div>
                </div>
                <div class="match-score-mini">
                    ${partido.local.marcador} - ${partido.visitante.marcador}
                    <span class="match-time">${partido.reloj}</span>
                </div>
                ${golesInfo}
                <button class="watch-btn" onclick="watchMatch('${partido.id}')">
                    <span>VER AHORA</span>
                </button>
            </div>
        </div>
    `;
}

// Renderizar información de goles
function renderGolesInfo(partido) {
    if (!partido.goles || partido.goles.length === 0) {
        return '';
    }
    
    // Agrupar goles por equipo
    const golesLocal = partido.goles.filter(g => g.equipoId === partido.local.id);
    const golesVisitante = partido.goles.filter(g => g.equipoId === partido.visitante.id);
    
    let html = '<div class="goles-info">';
    
    // Goles del local
    if (golesLocal.length > 0) {
        html += '<div class="goles-equipo">';
        html += `<div class="goles-equipo-nombre">${partido.local.nombreCorto}</div>`;
        golesLocal.forEach(gol => {
            html += `
                <div class="gol-item">
                    <i class="fas fa-futbol"></i>
                    <span class="gol-jugador">${gol.jugador || 'Jugador'}</span>
                    <span class="gol-minuto">${gol.minuto}'</span>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Goles del visitante
    if (golesVisitante.length > 0) {
        html += '<div class="goles-equipo">';
        html += `<div class="goles-equipo-nombre">${partido.visitante.nombreCorto}</div>`;
        golesVisitante.forEach(gol => {
            html += `
                <div class="gol-item">
                    <i class="fas fa-futbol"></i>
                    <span class="gol-jugador">${gol.jugador || 'Jugador'}</span>
                    <span class="gol-minuto">${gol.minuto}'</span>
                </div>
            `;
        });
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// Actualizar partidos próximos
function updateUpcomingMatches(data) {
    const container = document.getElementById('upcomingMatches');
    if (!container) return;
    
    const partidosProgramados = data.partidos.filter(p => p.estado?.programado && !p.estado?.enVivo);
    
    if (partidosProgramados.length === 0) {
        container.innerHTML = '<div class="no-matches" style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">No hay partidos próximos disponibles</div>';
        return;
    }
    
    container.innerHTML = partidosProgramados.map(partido => {
        const hora = formatearHora(partido.fecha);
        
        return `
        <div class="match-card">
            <div class="match-card-bg">
                <img src="ultragol-vs-stadium.jpg" alt="Match">
            </div>
            <div class="match-card-content">
                <div class="match-time-badge">
                    <i class="far fa-clock"></i> ${hora}
                </div>
                <div class="teams">
                    <div class="team">
                        <img src="${partido.local.logo}" alt="${partido.local.nombreCorto}" class="team-badge" onerror="this.src='https://via.placeholder.com/50'">
                        <span>${partido.local.nombreCorto}</span>
                    </div>
                    <div class="team">
                        <img src="${partido.visitante.logo}" alt="${partido.visitante.nombreCorto}" class="team-badge" onerror="this.src='https://via.placeholder.com/50'">
                        <span>${partido.visitante.nombreCorto}</span>
                    </div>
                </div>
                <div class="match-score-mini">
                    <span class="vs-text">VS</span>
                </div>
                ${partido.detalles?.estadio ? `
                    <div class="match-venue">
                        <i class="fas fa-map-marker-alt"></i>
                        ${partido.detalles.estadio}
                    </div>
                ` : ''}
                <button class="watch-btn secondary" onclick="showToast('Este partido aún no ha comenzado')">
                    <span>PRÓXIMAMENTE</span>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Formatear hora del partido
function formatearHora(fechaStr) {
    try {
        // La fecha viene en formato "22/10/25, 7:00 p.m."
        const match = fechaStr.match(/(\d{1,2}:\d{2}\s*[ap]\.?\s*m\.?)/i);
        if (match) {
            return match[1];
        }
        return fechaStr;
    } catch (e) {
        return fechaStr;
    }
}

// Cambiar de pestaña
function switchTab(tab, element) {
    activeTab = tab;
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    const button = element.closest('.tab') || element;
    button.classList.add('active');
    document.getElementById(tab + 'Content').classList.add('active');
    
    if (tab === 'upcoming') {
        if (marcadoresData) {
            updateUpcomingMatches(marcadoresData);
        } else {
            loadMarcadores();
        }
    } else if (tab === 'replays') {
        loadReplays();
    } else if (tab === 'live') {
        if (marcadoresData) {
            updateLiveMatches(marcadoresData);
        } else {
            loadMarcadores();
        }
    }
}

// Iniciar actualización automática cada 30 segundos
function startAutoUpdate() {
    // Limpiar intervalo anterior si existe
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    // Actualizar cada 30 segundos
    updateInterval = setInterval(async () => {
        console.log('🔄 Actualizando marcadores...');
        await loadMarcadores();
    }, 30000);
}

function watchMatch(matchId, videoUrl = null, videoTitle = null) {
    if (videoUrl) {
        playStreamInModal(videoUrl, videoTitle || 'Video', true);
        return;
    }
    
    let partido = null;
    
    if (marcadoresData && marcadoresData.partidos) {
        partido = marcadoresData.partidos.find(p => p.id === matchId);
    }
    
    if (!partido) {
        showToast('No se pudo encontrar el partido');
        return;
    }
    
    if (!transmisionesData || !transmisionesData.transmisiones) {
        showToast('No hay transmisiones disponibles');
        return;
    }
    
    const nombreLocal = partido.local.nombre.toLowerCase();
    const nombreVisitante = partido.visitante.nombre.toLowerCase();
    const nombreCortoLocal = partido.local.nombreCorto.toLowerCase();
    const nombreCortoVisitante = partido.visitante.nombreCorto.toLowerCase();
    
    // Función auxiliar para extraer palabras clave del nombre
    const extraerPalabrasClaves = (nombre) => {
        // Remover todos los prefijos comunes en un solo paso
        return nombre
            .replace(/^(fc|cf|cd|club|atletico|atlético|deportivo|sporting|de|del|la|los|las)\s+/gi, '')
            .replace(/^(fc|cf|cd|club|atletico|atlético|deportivo|sporting|de|del|la|los|las)\s+/gi, '')
            .replace(/\s+(fc|cf|cd|club)$/gi, '')
            .trim();
    };
    
    const palabrasLocal = extraerPalabrasClaves(nombreLocal);
    const palabrasVisitante = extraerPalabrasClaves(nombreVisitante);
    
    console.log(`🔍 Buscando transmisión para:`);
    console.log(`   Local: "${nombreLocal}" → palabras clave: "${palabrasLocal}"`);
    console.log(`   Visitante: "${nombreVisitante}" → palabras clave: "${palabrasVisitante}"`);
    
    const transmision = transmisionesData.transmisiones.find(t => {
        const evento = t.evento.toLowerCase();
        
        // Buscar coincidencias usando múltiples estrategias
        const tieneLocal = 
            evento.includes(nombreLocal) || 
            evento.includes(nombreCortoLocal) ||
            evento.includes(palabrasLocal);
            
        const tieneVisitante = 
            evento.includes(nombreVisitante) || 
            evento.includes(nombreCortoVisitante) ||
            evento.includes(palabrasVisitante);
        
        return tieneLocal && tieneVisitante;
    });
    
    if (!transmision) {
        showToast('No hay transmisión disponible para este partido');
        console.log(`❌ No se encontró transmisión para: ${partido.local.nombre} vs ${partido.visitante.nombre}`);
        return;
    }
    
    console.log(`✅ Transmisión encontrada: ${transmision.evento}`);
    console.log(`📺 Total canales: ${transmision.canales?.length || 0}`);
    
    if (!transmision.canales || transmision.canales.length === 0) {
        showToast('No hay canales disponibles para esta transmisión');
        return;
    }
    
    const partidoNombre = `${partido.local.nombreCorto} vs ${partido.visitante.nombreCorto}`;
    
    showChannelSelector(transmision, partidoNombre);
}

function showChannelSelector(transmision, partidoNombre) {
    const modal = document.getElementById('channelSelectorModal');
    const body = document.getElementById('channelSelectorBody');
    const title = document.getElementById('channelSelectorTitle');
    
    title.textContent = `${partidoNombre} - Seleccionar Canal`;
    
    body.innerHTML = transmision.canales.map((canal, index) => {
        const streamTypes = [];
        if (canal.links.hoca) streamTypes.push({ name: 'Hoca', url: canal.links.hoca });
        if (canal.links.caster) streamTypes.push({ name: 'Caster', url: canal.links.caster });
        if (canal.links.wigi) streamTypes.push({ name: 'Wigi', url: canal.links.wigi });
        
        return `
            <div class="channel-option">
                <div class="channel-info">
                    <div class="channel-number">${canal.numero}</div>
                    <div class="channel-name">${canal.nombre}</div>
                </div>
                <div class="stream-options">
                    ${streamTypes.map(type => `
                        <button class="stream-option-btn" onclick='selectStream("${type.url}", "${partidoNombre} - ${canal.nombre} (${type.name})")'>
                            <i class="fas fa-play-circle"></i>
                            ${type.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    modal.classList.add('active');
}

function closeChannelSelector() {
    const modal = document.getElementById('channelSelectorModal');
    modal.classList.remove('active');
}

function selectStream(streamUrl, streamTitle) {
    closeChannelSelector();
    playStreamInModal(streamUrl, streamTitle, false);
}

function playStreamInModal(streamUrl, title, isYouTube = false) {
    const modal = document.getElementById('playerModal');
    const modalBody = modal.querySelector('.modal-body');
    const modalTitle = document.getElementById('modalTitle');
    const loader = document.getElementById('modalLoader');
    
    let embedUrl = streamUrl;
    
    if (isYouTube && streamUrl.includes('youtube.com/watch')) {
        const videoId = streamUrl.split('v=')[1]?.split('&')[0];
        if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
    }
    
    currentStreamUrl = embedUrl;
    modalTitle.textContent = title;
    modal.classList.add('active');
    loader.style.display = 'flex';
    
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
}

function closeModal() {
    const modal = document.getElementById('playerModal');
    const modalBody = modal.querySelector('.modal-body');
    
    modal.classList.remove('active');
    
    const iframe = document.getElementById('modalIframe');
    if (iframe) {
        iframe.src = '';
    }
    
    currentStreamUrl = '';
    
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

async function loadReplays() {
    const container = document.getElementById('replayMatches');
    container.innerHTML = '<div class="loading-spinner">Cargando mejores momentos de Liga MX...</div>';
    
    try {
        const response = await fetch('https://ultragol-api3.onrender.com/videos');
        const data = await response.json();
        
        let allVideos = [];
        if (data.categorias) {
            if (data.categorias.mejoresMomentos) {
                allVideos = allVideos.concat(data.categorias.mejoresMomentos);
            }
            if (data.categorias.resumenes) {
                allVideos = allVideos.concat(data.categorias.resumenes);
            }
            if (data.categorias.goles) {
                allVideos = allVideos.concat(data.categorias.goles);
            }
        }
        
        if (allVideos && allVideos.length > 0) {
            container.innerHTML = allVideos.slice(0, 6).map((video, index) => {
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
            container.innerHTML = '<div class="no-matches" style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">No hay videos disponibles</div>';
        }
    } catch (error) {
        console.error('Error loading replays:', error);
        container.innerHTML = '<div class="error-message">Error al cargar los mejores momentos</div>';
    }
}

async function loadStandings() {
    try {
        const response = await fetch('https://ultragol-api3.onrender.com/tabla');
        const data = await response.json();
        
        const standingsTable = document.getElementById('standingsTable');
        if (!standingsTable) return;
        
        if (!data.equipos || data.equipos.length === 0) {
            standingsTable.innerHTML = '<div class="standings-loading">No hay datos de tabla disponibles</div>';
            return;
        }
        
        const equipos = data.equipos.sort((a, b) => a.posicion - b.posicion);
        
        standingsTable.innerHTML = `
            <div class="standings-header">
                <div class="standings-row header-row">
                    <div class="pos">#</div>
                    <div class="team-cell">Equipo</div>
                    <div class="stat">PJ</div>
                    <div class="stat">G</div>
                    <div class="stat">E</div>
                    <div class="stat">P</div>
                    <div class="stat points">PTS</div>
                </div>
            </div>
            <div class="standings-body">
                ${equipos.map((equipo, index) => `
                    <div class="standings-row ${index < 4 ? 'playoff-zone' : index >= equipos.length - 4 ? 'relegation-zone' : ''}">
                        <div class="pos">${equipo.posicion}</div>
                        <div class="team-cell">
                            <img src="${equipo.logo}" alt="${equipo.nombre}" class="team-logo-small" onerror="this.src='https://via.placeholder.com/30'">
                            <span class="team-name-standings">${equipo.nombreCorto || equipo.nombre}</span>
                        </div>
                        <div class="stat">${equipo.partidosJugados || 0}</div>
                        <div class="stat">${equipo.ganados || 0}</div>
                        <div class="stat">${equipo.empatados || 0}</div>
                        <div class="stat">${equipo.perdidos || 0}</div>
                        <div class="stat points">${equipo.puntos || 0}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading standings:', error);
        const standingsTable = document.getElementById('standingsTable');
        if (standingsTable) {
            standingsTable.innerHTML = '<div class="standings-loading">Error al cargar la tabla</div>';
        }
    }
}

async function loadNews() {
    try {
        const response = await fetch('https://ultragol-api3.onrender.com/Noticias');
        const data = await response.json();
        
        const newsGrid = document.getElementById('newsGrid');
        if (!newsGrid) return;
        
        if (!data.noticias || data.noticias.length === 0) {
            newsGrid.innerHTML = '<div class="news-loading">No hay noticias disponibles</div>';
            return;
        }
        
        newsGrid.innerHTML = data.noticias.slice(0, 6).map((noticia, index) => `
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

function selectLeague(leagueName, element) {
    if (leagueName !== 'Liga MX') {
        showLockedLeagueMessage(leagueName);
        return;
    }
    
    document.querySelectorAll('.league-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    currentLeague = leagueName;
}

function showLockedLeagueMessage(leagueName) {
    showToast(`${leagueName} estará disponible próximamente`);
}

// Modo oscuro
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }
}

// Inicializar modo oscuro cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
});

// ==================== PARTIDOS IMPORTANTES MODAL ====================

function openImportantMatchesModal() {
    const modal = document.getElementById('importantMatchesModal');
    const body = document.getElementById('importantMatchesBody');
    
    modal.classList.add('active');
    
    body.innerHTML = `
        <div class="loading-matches">
            <div class="spinner"></div>
            <p>Cargando partidos...</p>
        </div>
    `;
    
    loadImportantMatches();
}

function closeImportantMatchesModal() {
    const modal = document.getElementById('importantMatchesModal');
    modal.classList.remove('active');
}

async function loadImportantMatches() {
    try {
        if (!transmisionesData || !transmisionesData.transmisiones) {
            await loadTransmisiones();
        }
        
        renderImportantMatches();
    } catch (error) {
        console.error('Error cargando partidos importantes:', error);
        showNoMatchesMessage();
    }
}

function renderImportantMatches() {
    const body = document.getElementById('importantMatchesBody');
    
    if (!transmisionesData || !transmisionesData.transmisiones || transmisionesData.transmisiones.length === 0) {
        showNoMatchesMessage();
        return;
    }
    
    const transmisionesSorted = [...transmisionesData.transmisiones].sort((a, b) => {
        const aLive = a.estado?.toLowerCase().includes('vivo') || a.estado?.toLowerCase().includes('live');
        const bLive = b.estado?.toLowerCase().includes('vivo') || b.estado?.toLowerCase().includes('live');
        
        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;
        
        const aCanales = a.canales?.length || 0;
        const bCanales = b.canales?.length || 0;
        
        return bCanales - aCanales;
    });
    
    body.innerHTML = transmisionesSorted.map((transmision, index) => {
        const equipos = transmision.evento.split(' vs ');
        const equipoLocal = equipos[0]?.trim() || 'Equipo 1';
        const equipoVisitante = equipos[1]?.trim() || 'Equipo 2';
        const canalesCount = transmision.canales?.length || 0;
        
        const isLive = transmision.estado?.toLowerCase().includes('vivo') || transmision.estado?.toLowerCase().includes('live');
        const isUpcoming = transmision.estado?.toLowerCase().includes('próximo') || transmision.estado?.toLowerCase().includes('programado');
        const isFinished = transmision.estado?.toLowerCase().includes('finalizado') || transmision.estado?.toLowerCase().includes('finished');
        
        let statusBadge = '';
        if (isLive) {
            statusBadge = `<span class="status-badge status-live">EN VIVO</span>`;
        } else if (isFinished) {
            statusBadge = `<span class="status-badge status-finished">Finalizado</span>`;
        } else {
            statusBadge = `<span class="status-badge status-upcoming"><i class="far fa-clock"></i> PRÓXIMO</span>`;
        }
        
        const deporte = transmision.deporte || 'Fútbol';
        const liga = transmision.liga || '';
        
        let backgroundImage = 'futbol-bg.jpg';
        if (deporte.toLowerCase().includes('basket') || deporte.toLowerCase().includes('nba')) {
            backgroundImage = 'basquet-bg.jpg';
        } else if (deporte.toLowerCase().includes('moto') || deporte.toLowerCase().includes('motogp')) {
            backgroundImage = 'motos-bg.jpg';
        }
        
        const fecha = transmision.fecha ? new Date(transmision.fecha).toLocaleDateString('es-MX', { 
            day: 'numeric', 
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }) : '';
        
        const inicialLocal = equipoLocal.substring(0, 2).toUpperCase();
        const inicialVisitante = equipoVisitante.substring(0, 2).toUpperCase();
        
        return `
            <div class="important-match-card-new" onclick='${canalesCount > 0 ? `selectImportantMatchByTransmision(${index})` : `showToast("No hay canales disponibles para este partido")`}'>
                <div class="match-image-container">
                    <img src="${backgroundImage}" alt="${deporte}" class="match-bg-image">
                    <div class="match-image-overlay"></div>
                </div>
                
                <div class="match-info-container">
                    <div class="match-badges">
                        ${liga ? `<span class="league-badge">${liga.toUpperCase()}</span>` : ''}
                        ${statusBadge}
                    </div>
                    
                    <h3 class="match-title">${transmision.evento}</h3>
                    
                    ${fecha ? `<div class="match-date"><i class="far fa-clock"></i> ${fecha}</div>` : ''}
                    
                    <div class="match-footer">
                        ${canalesCount > 0 ? `
                            <div class="channel-info">
                                <i class="fas fa-tv"></i>
                                <span>Canal ${transmision.canales[0]?.numero || transmision.canales[0]?.nombre || ''}</span>
                            </div>
                            <button class="btn-ver">
                                <i class="fas fa-play"></i> Ver
                            </button>
                        ` : `
                            <div class="no-channels-text">Sin canales disponibles</div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function findTransmisionForMatch(partido) {
    if (!transmisionesData || !transmisionesData.transmisiones) {
        return null;
    }
    
    const nombreLocal = partido.local.nombre.toLowerCase();
    const nombreVisitante = partido.visitante.nombre.toLowerCase();
    const nombreCortoLocal = partido.local.nombreCorto.toLowerCase();
    const nombreCortoVisitante = partido.visitante.nombreCorto.toLowerCase();
    
    const extraerPalabrasClaves = (nombre) => {
        return nombre
            .replace(/^(fc|cf|cd|club|atletico|atlético|deportivo|sporting|de|del|la|los|las)\s+/gi, '')
            .replace(/^(fc|cf|cd|club|atletico|atlético|deportivo|sporting|de|del|la|los|las)\s+/gi, '')
            .replace(/\s+(fc|cf|cd|club)$/gi, '')
            .trim();
    };
    
    const palabrasLocal = extraerPalabrasClaves(nombreLocal);
    const palabrasVisitante = extraerPalabrasClaves(nombreVisitante);
    
    const transmision = transmisionesData.transmisiones.find(t => {
        const evento = t.evento.toLowerCase();
        
        const tieneLocal = 
            evento.includes(nombreLocal) || 
            evento.includes(nombreCortoLocal) ||
            evento.includes(palabrasLocal);
            
        const tieneVisitante = 
            evento.includes(nombreVisitante) || 
            evento.includes(nombreCortoVisitante) ||
            evento.includes(palabrasVisitante);
        
        return tieneLocal && tieneVisitante;
    });
    
    return transmision;
}

function selectImportantMatchByTransmision(transmisionIndex) {
    if (!transmisionesData || !transmisionesData.transmisiones) {
        showToast('No se pudo encontrar la transmisión');
        return;
    }
    
    const transmision = transmisionesData.transmisiones[transmisionIndex];
    
    if (!transmision || !transmision.canales || transmision.canales.length === 0) {
        showToast('No hay canales disponibles para este partido');
        return;
    }
    
    closeImportantMatchesModal();
    
    showChannelSelector(transmision, transmision.evento);
}

function showNoMatchesMessage() {
    const body = document.getElementById('importantMatchesBody');
    body.innerHTML = `
        <div class="important-no-matches">
            <i class="fas fa-futbol"></i>
            <p>No hay partidos disponibles en este momento.<br>Por favor, intenta más tarde.</p>
        </div>
    `;
}
