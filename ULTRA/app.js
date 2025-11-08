let currentStreamUrl = '';
let activeTab = 'live';
let currentLeague = 'Liga MX';
let marcadoresData = null;
let transmisionesData = null;
let transmisionesAPI1 = null;
let transmisionesAPI2 = null;
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
    await loadLineups();
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
        
        // Guardar datos separados de cada API
        transmisionesAPI1 = data1;
        transmisionesAPI2 = data2;
        
        // Combinar las transmisiones de ambas APIs para compatibilidad
        const transmisionesCombinadas = [
            ...(data1.transmisiones || []),
            ...(data2.transmisiones || [])
        ];
        
        // Crear el objeto combinado
        transmisionesData = {
            transmisiones: transmisionesCombinadas
        };
        
        console.log('✅ Transmisiones cargadas desde API 1 (golazolvhd):', data1.transmisiones?.length || 0);
        console.log('✅ Transmisiones cargadas desde API 2 (ellink):', data2.transmisiones?.length || 0);
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
    
    // Función auxiliar para normalizar nombres de equipos
    const normalizarNombre = (nombre) => {
        return nombre
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .trim();
    };
    
    // Función auxiliar para extraer palabras clave del nombre
    const extraerPalabrasClaves = (nombre) => {
        return normalizarNombre(nombre)
            .replace(/^(fc|cf|cd|club|atletico|atletico|deportivo|sporting|de|del|la|los|las)\s+/gi, '')
            .replace(/\s+(fc|cf|cd|club|deportivo)$/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    };
    
    const nombreLocal = normalizarNombre(partido.local.nombre);
    const nombreVisitante = normalizarNombre(partido.visitante.nombre);
    const nombreCortoLocal = normalizarNombre(partido.local.nombreCorto);
    const nombreCortoVisitante = normalizarNombre(partido.visitante.nombreCorto);
    const palabrasLocal = extraerPalabrasClaves(partido.local.nombre);
    const palabrasVisitante = extraerPalabrasClaves(partido.visitante.nombre);
    
    console.log(`🔍 Buscando transmisión para:`);
    console.log(`   Local: "${nombreLocal}" → palabras: "${palabrasLocal}"`);
    console.log(`   Visitante: "${nombreVisitante}" → palabras: "${palabrasVisitante}"`);
    
    // Función para buscar transmisión en una lista
    const buscarTransmision = (transmisiones) => {
        if (!transmisiones || transmisiones.length === 0) return null;
        
        return transmisiones.find(t => {
            const evento = normalizarNombre(t.evento || t.titulo || '');
            
            console.log(`  Comparando con: "${evento}"`);
            
            // Buscar coincidencias con múltiples variaciones
            const tieneLocal = 
                evento.includes(nombreLocal) || 
                evento.includes(nombreCortoLocal) ||
                evento.includes(palabrasLocal) ||
                (palabrasLocal.length > 3 && evento.includes(palabrasLocal.split(' ')[0]));
                
            const tieneVisitante = 
                evento.includes(nombreVisitante) || 
                evento.includes(nombreCortoVisitante) ||
                evento.includes(palabrasVisitante) ||
                (palabrasVisitante.length > 3 && evento.includes(palabrasVisitante.split(' ')[0]));
            
            if (tieneLocal && tieneVisitante) {
                console.log(`  ✅ Match encontrado: "${evento}"`);
            }
            
            return tieneLocal && tieneVisitante;
        });
    };
    
    // Buscar en ambas APIs
    const transmisionAPI1 = transmisionesAPI1 ? buscarTransmision(transmisionesAPI1.transmisiones) : null;
    const transmisionAPI2 = transmisionesAPI2 ? buscarTransmision(transmisionesAPI2.transmisiones) : null;
    
    // Combinar canales de ambas APIs
    let canalesCombinados = [];
    let eventoNombre = '';
    
    if (transmisionAPI1) {
        eventoNombre = transmisionAPI1.evento || transmisionAPI1.titulo;
        const canalesAPI1 = (transmisionAPI1.canales || []).map(canal => ({
            ...canal,
            fuente: 'golazolvhd'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI1];
        console.log(`✅ Encontrados ${canalesAPI1.length} canales en API 1 (golazolvhd)`);
    }
    
    if (transmisionAPI2) {
        if (!eventoNombre) eventoNombre = transmisionAPI2.evento || transmisionAPI2.titulo;
        const canalesAPI2 = (transmisionAPI2.canales || []).map(canal => ({
            ...canal,
            fuente: 'ellink'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI2];
        console.log(`✅ Encontrados ${canalesAPI2.length} canales en API 2 (ellink)`);
    }
    
    if (canalesCombinados.length === 0) {
        showToast('No hay transmisión disponible para este partido');
        console.log(`❌ No se encontró transmisión para: ${partido.local.nombre} vs ${partido.visitante.nombre}`);
        return;
    }
    
    console.log(`📺 Total canales combinados: ${canalesCombinados.length}`);
    
    const partidoNombre = `${partido.local.nombreCorto} vs ${partido.visitante.nombreCorto}`;
    
    // Crear transmisión combinada
    const transmisionCombinada = {
        evento: eventoNombre,
        titulo: eventoNombre,
        canales: canalesCombinados
    };
    
    showChannelSelector(transmisionCombinada, partidoNombre);
}

function showChannelSelector(transmision, partidoNombre) {
    const modal = document.getElementById('channelSelectorModal');
    const body = document.getElementById('channelSelectorBody');
    const title = document.getElementById('channelSelectorTitle');
    
    title.textContent = `${partidoNombre} - Seleccionar Canal`;
    
    body.innerHTML = transmision.canales.map((canal, index) => {
        const streamTypes = [];
        if (canal.links?.hoca) streamTypes.push({ name: 'Hoca', url: canal.links.hoca });
        if (canal.links?.caster) streamTypes.push({ name: 'Caster', url: canal.links.caster });
        if (canal.links?.wigi) streamTypes.push({ name: 'Wigi', url: canal.links.wigi });
        
        const fuenteBadge = canal.fuente ? `<span class="fuente-badge" style="background: ${canal.fuente === 'golazolvhd' ? '#ff6b35' : '#4ecdc4'}; font-size: 9px; padding: 2px 6px; border-radius: 3px; margin-left: 6px;">${canal.fuente === 'golazolvhd' ? 'API 1' : 'API 2'}</span>` : '';
        
        return `
            <div class="channel-option">
                <div class="channel-info">
                    <div class="channel-number">${canal.numero}</div>
                    <div class="channel-name">${canal.nombre}${fuenteBadge}</div>
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

// ==================== FUNCIONES DE BÚSQUEDA ====================

function showSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.classList.add('active');
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 300);
        }
    }
}

function closeSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.classList.remove('active');
        clearSearch();
    }
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        showSearchWelcome();
        document.querySelector('.clear-search-btn').style.display = 'none';
    }
}

function quickSearch(term) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = term;
        performSearch(term);
    }
}

function showSearchWelcome() {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = `
        <div class="search-welcome">
            <div class="search-welcome-icon">
                <i class="fas fa-search"></i>
            </div>
            <h3>Busca en UltraGol</h3>
            <p>Encuentra ligas, equipos, partidos en vivo y mucho más</p>
            <div class="search-suggestions">
                <span class="search-tag" onclick="quickSearch('Liga MX')">
                    <i class="fas fa-futbol"></i> Liga MX
                </span>
                <span class="search-tag" onclick="quickSearch('América')">
                    <i class="fas fa-shield-alt"></i> América
                </span>
                <span class="search-tag" onclick="quickSearch('Chivas')">
                    <i class="fas fa-shield-alt"></i> Chivas
                </span>
                <span class="search-tag" onclick="quickSearch('en vivo')">
                    <i class="fas fa-circle"></i> En Vivo
                </span>
            </div>
        </div>
    `;
}

async function performSearch(query) {
    if (!query || query.trim() === '') {
        showSearchWelcome();
        return;
    }
    
    const resultsContainer = document.getElementById('searchResults');
    const clearBtn = document.querySelector('.clear-search-btn');
    
    if (clearBtn) {
        clearBtn.style.display = query.length > 0 ? 'block' : 'none';
    }
    
    resultsContainer.innerHTML = '<div class="search-loading"><div class="spinner"></div><p>Buscando en todo UltraGol...</p></div>';
    
    const searchTerm = query.toLowerCase().trim();
    const results = {
        matches: [],
        teams: [],
        leagues: [],
        importantMatches: [],
        liveMatches: []
    };
    
    // Buscar en partidos de marcadores
    if (marcadoresData && marcadoresData.partidos) {
        results.matches = marcadoresData.partidos.filter(partido => {
            const localName = partido.local?.nombreCorto?.toLowerCase() || '';
            const visitanteName = partido.visitante?.nombreCorto?.toLowerCase() || '';
            const localFullName = partido.local?.nombre?.toLowerCase() || '';
            const visitanteFullName = partido.visitante?.nombre?.toLowerCase() || '';
            
            return localName.includes(searchTerm) || 
                   visitanteName.includes(searchTerm) ||
                   localFullName.includes(searchTerm) ||
                   visitanteFullName.includes(searchTerm);
        });
        
        // Separar partidos en vivo
        results.liveMatches = results.matches.filter(p => p.estado?.enVivo);
    }
    
    // Buscar en partidos importantes (transmisiones) y combinar canales de ambas APIs
    if (transmisionesData && transmisionesData.transmisiones) {
        const matchedTransmisiones = transmisionesData.transmisiones.filter(transmision => {
            const titulo = transmision.titulo?.toLowerCase() || '';
            const liga = transmision.liga?.toLowerCase() || '';
            const estado = transmision.estado?.toLowerCase() || '';
            const evento = transmision.evento?.toLowerCase() || '';
            
            return titulo.includes(searchTerm) || 
                   evento.includes(searchTerm) ||
                   liga.includes(searchTerm) ||
                   (searchTerm === 'vivo' && (estado.includes('vivo') || estado.includes('live'))) ||
                   (searchTerm === 'en vivo' && (estado.includes('vivo') || estado.includes('live')));
        });
        
        // Combinar canales de ambas APIs para cada transmisión encontrada
        const transmisionesConCanalesCombinados = matchedTransmisiones.map(transmision => {
            const eventoNombre = (transmision.evento || transmision.titulo || '').toLowerCase();
            let canalesCombinados = [];
            let tituloDisplay = transmision.titulo || transmision.evento || 'Partido';
            
            // Buscar en API 1
            if (transmisionesAPI1 && transmisionesAPI1.transmisiones) {
                const transAPI1 = transmisionesAPI1.transmisiones.find(t => {
                    const evento = (t.evento || t.titulo || '').toLowerCase();
                    return evento === eventoNombre || evento.includes(eventoNombre) || eventoNombre.includes(evento);
                });
                
                if (transAPI1) {
                    // Actualizar título si es mejor que el actual
                    if (transAPI1.titulo && !tituloDisplay) {
                        tituloDisplay = transAPI1.titulo;
                    }
                    if (transAPI1.evento && !tituloDisplay) {
                        tituloDisplay = transAPI1.evento;
                    }
                    
                    if (transAPI1.canales) {
                        const canalesAPI1 = transAPI1.canales.map(canal => ({
                            ...canal,
                            fuente: 'golazolvhd'
                        }));
                        canalesCombinados = [...canalesCombinados, ...canalesAPI1];
                    }
                }
            }
            
            // Buscar en API 2
            if (transmisionesAPI2 && transmisionesAPI2.transmisiones) {
                const transAPI2 = transmisionesAPI2.transmisiones.find(t => {
                    const evento = (t.evento || t.titulo || '').toLowerCase();
                    return evento === eventoNombre || evento.includes(eventoNombre) || eventoNombre.includes(evento);
                });
                
                if (transAPI2) {
                    // Actualizar título si es mejor que el actual
                    if (transAPI2.titulo && !tituloDisplay) {
                        tituloDisplay = transAPI2.titulo;
                    }
                    if (transAPI2.evento && !tituloDisplay) {
                        tituloDisplay = transAPI2.evento;
                    }
                    
                    if (transAPI2.canales) {
                        const canalesAPI2 = transAPI2.canales.map(canal => ({
                            ...canal,
                            fuente: 'ellink'
                        }));
                        canalesCombinados = [...canalesCombinados, ...canalesAPI2];
                    }
                }
            }
            
            // Retornar transmisión con canales combinados y título garantizado
            return {
                ...transmision,
                titulo: tituloDisplay,
                evento: tituloDisplay,
                canales: canalesCombinados
            };
        });
        
        results.importantMatches = transmisionesConCanalesCombinados.slice(0, 10);
    }
    
    // Buscar equipos únicos
    if (marcadoresData && marcadoresData.partidos) {
        const teamsSet = new Set();
        marcadoresData.partidos.forEach(partido => {
            const localName = partido.local?.nombreCorto?.toLowerCase() || '';
            const visitanteName = partido.visitante?.nombreCorto?.toLowerCase() || '';
            
            if (localName.includes(searchTerm)) {
                teamsSet.add(JSON.stringify({
                    nombre: partido.local.nombreCorto,
                    nombreCompleto: partido.local.nombre,
                    logo: partido.local.logo
                }));
            }
            if (visitanteName.includes(searchTerm)) {
                teamsSet.add(JSON.stringify({
                    nombre: partido.visitante.nombreCorto,
                    nombreCompleto: partido.visitante.nombre,
                    logo: partido.visitante.logo
                }));
            }
        });
        results.teams = Array.from(teamsSet).map(t => JSON.parse(t)).slice(0, 6);
    }
    
    // Buscar ligas
    const leagues = ['Liga MX', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League', 'Copa Libertadores'];
    results.leagues = leagues.filter(league => league.toLowerCase().includes(searchTerm));
    
    // Mostrar resultados
    displaySearchResults(results, searchTerm);
}

function displaySearchResults(results, query) {
    const resultsContainer = document.getElementById('searchResults');
    let html = '';
    
    const totalResults = results.matches.length + results.teams.length + results.leagues.length + results.importantMatches.length;
    
    if (totalResults === 0) {
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <div class="no-results-icon">
                    <i class="fas fa-search-minus"></i>
                </div>
                <h3>No se encontraron resultados</h3>
                <p>No encontramos resultados para "<strong>${query}</strong>"</p>
                <p class="no-results-suggestion">Intenta buscar:</p>
                <div class="search-suggestions">
                    <span class="search-tag" onclick="quickSearch('Liga MX')">
                        <i class="fas fa-futbol"></i> Liga MX
                    </span>
                    <span class="search-tag" onclick="quickSearch('América')">
                        <i class="fas fa-shield-alt"></i> América
                    </span>
                    <span class="search-tag" onclick="quickSearch('Chivas')">
                        <i class="fas fa-shield-alt"></i> Chivas
                    </span>
                    <span class="search-tag" onclick="quickSearch('en vivo')">
                        <i class="fas fa-circle"></i> En Vivo
                    </span>
                </div>
            </div>
        `;
        return;
    }
    
    html += `<div class="search-results-header">
        <div class="search-results-icon">
            <i class="fas fa-trophy"></i>
        </div>
        <div class="search-results-text">
            <div class="search-results-title">${totalResults} Resultado${totalResults !== 1 ? 's' : ''} Encontrado${totalResults !== 1 ? 's' : ''}</div>
            <div class="search-results-subtitle">Búsqueda: "${query}"</div>
        </div>
    </div>`;
    
    // Mostrar partidos en vivo primero (destacados)
    if (results.liveMatches && results.liveMatches.length > 0) {
        html += `<div class="search-section search-section-featured">
            <div class="search-section-title">
                <div class="search-section-icon live-pulse">
                    <i class="fas fa-circle"></i>
                </div>
                <span>EN VIVO AHORA</span>
                <span class="search-section-badge">${results.liveMatches.length}</span>
            </div>`;
        
        results.liveMatches.forEach(partido => {
            const hora = formatearHora(partido.fecha);
            html += `
                <div class="search-match-card search-match-live" onclick="selectMatchFromSearch('${partido.id}')">
                    <div class="search-match-live-indicator">
                        <span class="live-dot-pulse"></span>
                        <span>EN VIVO</span>
                    </div>
                    <div class="search-match-teams">
                        <div class="search-match-team">
                            <img src="${partido.local.logo}" alt="${partido.local.nombreCorto}" onerror="this.src='https://via.placeholder.com/40'">
                            <span>${partido.local.nombreCorto}</span>
                        </div>
                        <div class="search-match-score-big">
                            <span class="score-num">${partido.local.marcador}</span>
                            <span class="score-sep">-</span>
                            <span class="score-num">${partido.visitante.marcador}</span>
                        </div>
                        <div class="search-match-team">
                            <span>${partido.visitante.nombreCorto}</span>
                            <img src="${partido.visitante.logo}" alt="${partido.visitante.nombreCorto}" onerror="this.src='https://via.placeholder.com/40'">
                        </div>
                    </div>
                    <div class="search-match-time">${partido.reloj || 'EN VIVO'}</div>
                </div>`;
        });
        
        html += `</div>`;
    }
    
    // Mostrar partidos importantes/transmisiones
    if (results.importantMatches.length > 0) {
        html += `<div class="search-section">
            <div class="search-section-title">
                <div class="search-section-icon">
                    <i class="fas fa-star"></i>
                </div>
                <span>Partidos Importantes</span>
                <span class="search-section-badge">${results.importantMatches.length}</span>
            </div>`;
        
        results.importantMatches.forEach((transmision, index) => {
            const isLive = transmision.estado?.toLowerCase().includes('vivo') || transmision.estado?.toLowerCase().includes('live');
            const canalesCount = transmision.canales?.length || 0;
            const liga = transmision.liga || 'Liga MX';
            const hasChannels = canalesCount > 0;
            
            // Obtener el primer canal para mostrar
            const firstChannel = hasChannels ? transmision.canales[0].nombre : '';
            
            html += `
                <div class="search-match-important-card">
                    <div class="search-match-bg"></div>
                    <div class="search-match-content">
                        <div class="search-match-badges">
                            <span class="search-badge-liga">${liga}</span>
                            ${isLive ? '<span class="search-badge-live"><i class="fas fa-circle"></i> EN VIVO</span>' : '<span class="search-badge-scheduled"><i class="far fa-clock"></i> PRÓXIMO</span>'}
                        </div>
                        <div class="search-match-title">${transmision.titulo}</div>
                        ${hasChannels ? `
                            <div class="search-match-info">
                                <div class="search-match-channel">
                                    <i class="fas fa-tv"></i> ${firstChannel}${canalesCount > 1 ? ` +${canalesCount - 1}` : ''}
                                </div>
                                <button class="search-match-btn" onclick='event.stopPropagation(); selectImportantMatchByName("${(transmision.evento || transmision.titulo || '').replace(/"/g, '&quot;')}")'>
                                    <i class="fas fa-play"></i> Ver
                                </button>
                            </div>
                        ` : `
                            <div class="search-match-no-channels">
                                Sin canales disponibles
                            </div>
                        `}
                    </div>
                </div>`;
        });
        
        html += `</div>`;
    }
    
    // Mostrar equipos
    if (results.teams.length > 0) {
        html += `<div class="search-section">
            <div class="search-section-title">
                <div class="search-section-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <span>Equipos</span>
                <span class="search-section-badge">${results.teams.length}</span>
            </div>
            <div class="search-teams-grid">`;
        
        results.teams.forEach(team => {
            html += `
                <div class="search-team-card" onclick="closeSearchModal()">
                    <div class="search-team-logo">
                        <img src="${team.logo}" alt="${team.nombre}" onerror="this.src='https://via.placeholder.com/60'">
                    </div>
                    <div class="search-team-info">
                        <div class="search-team-name">${team.nombre}</div>
                        <div class="search-team-full">${team.nombreCompleto}</div>
                    </div>
                </div>`;
        });
        
        html += `</div></div>`;
    }
    
    // Mostrar partidos
    if (results.matches.length > 0) {
        html += `<div class="search-section">
            <div class="search-section-title">
                <i class="fas fa-futbol"></i>
                <span>Partidos (${results.matches.length})</span>
            </div>`;
        
        results.matches.forEach(partido => {
            const hora = formatearHora(partido.fecha);
            const isLive = partido.estado?.enVivo;
            const isProgramado = partido.estado?.programado;
            const isFinalizado = partido.estado?.finalizado;
            const matchTitle = `${partido.local.nombreCorto} vs ${partido.visitante.nombreCorto}`;
            
            let statusBadge = '';
            if (isLive) {
                statusBadge = '<span class="search-badge-live"><i class="fas fa-circle"></i> EN VIVO</span>';
            } else if (isProgramado) {
                statusBadge = `<span class="search-badge-scheduled"><i class="far fa-clock"></i> PRÓXIMO</span>`;
            } else if (isFinalizado) {
                statusBadge = '<span class="search-badge-finished"><i class="fas fa-check"></i> FINALIZADO</span>';
            }
            
            html += `
                <div class="search-match-important-card">
                    <div class="search-match-bg"></div>
                    <div class="search-match-content">
                        <div class="search-match-badges">
                            <span class="search-badge-liga">Liga MX</span>
                            ${statusBadge}
                        </div>
                        <div class="search-match-title">${matchTitle}</div>
                        ${isLive ? `
                            <div class="search-match-info">
                                <div class="search-match-score-display">
                                    <span class="score-number">${partido.local.marcador}</span>
                                    <span class="score-separator">-</span>
                                    <span class="score-number">${partido.visitante.marcador}</span>
                                </div>
                                <button class="search-match-btn" onclick="event.stopPropagation(); selectMatchFromSearch('${partido.id}')">
                                    <i class="fas fa-play"></i> Ver
                                </button>
                            </div>
                        ` : isProgramado ? `
                            <div class="search-match-info">
                                <div class="search-match-time-display">
                                    <i class="far fa-clock"></i> ${hora}
                                </div>
                                <button class="search-match-btn disabled" onclick="event.stopPropagation(); showToast('Este partido aún no está disponible')">
                                    <i class="fas fa-lock"></i> Próximo
                                </button>
                            </div>
                        ` : `
                            <div class="search-match-no-channels">
                                Finalizado: ${partido.local.marcador} - ${partido.visitante.marcador}
                            </div>
                        `}
                    </div>
                </div>`;
        });
        
        html += `</div>`;
    }
    
    // Mostrar ligas
    if (results.leagues.length > 0) {
        html += `<div class="search-section">
            <div class="search-section-title">
                <i class="fas fa-trophy"></i>
                <span>Ligas (${results.leagues.length})</span>
            </div>`;
        
        results.leagues.forEach(league => {
            const isLigaMX = league === 'Liga MX';
            html += `
                <div class="search-league-card" onclick="${isLigaMX ? 'selectLeague(\'Liga MX\'); closeSearchModal();' : 'showLockedLeagueMessage(\'' + league + '\'); closeSearchModal();'}">
                    <div class="search-league-icon ${isLigaMX ? 'active' : 'locked'}">
                        <i class="fas ${isLigaMX ? 'fa-futbol' : 'fa-lock'}"></i>
                    </div>
                    <div class="search-league-info">
                        <div class="search-league-name">${league}</div>
                        <div class="search-league-status">${isLigaMX ? 'Disponible' : 'Próximamente'}</div>
                    </div>
                    ${!isLigaMX ? '<i class="fas fa-crown search-league-premium"></i>' : ''}
                </div>`;
        });
        
        html += `</div>`;
    }
    
    resultsContainer.innerHTML = html;
}

function selectMatchFromSearch(matchId) {
    closeSearchModal();
    const partido = marcadoresData?.partidos?.find(p => p.id === matchId);
    if (partido && partido.estado?.enVivo) {
        selectMatch(matchId);
    } else {
        showToast('Este partido aún no está disponible para transmisión');
    }
}

function selectImportantMatch(index) {
    closeSearchModal();
    if (!transmisionesData || !transmisionesData.transmisiones) return;
    
    const transmision = transmisionesData.transmisiones[index];
    if (!transmision) return;
    
    // Buscar esta transmisión en ambas APIs para combinar canales
    const eventoNombre = (transmision.evento || transmision.titulo || '').toLowerCase();
    
    let canalesCombinados = [];
    let tituloMostrar = transmision.titulo || transmision.evento;
    
    // Buscar en API 1
    if (transmisionesAPI1 && transmisionesAPI1.transmisiones) {
        const transAPI1 = transmisionesAPI1.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === eventoNombre || evento.includes(eventoNombre) || eventoNombre.includes(evento);
        });
        
        if (transAPI1 && transAPI1.canales) {
            const canalesAPI1 = transAPI1.canales.map(canal => ({
                ...canal,
                fuente: 'golazolvhd'
            }));
            canalesCombinados = [...canalesCombinados, ...canalesAPI1];
            console.log(`✅ Encontrados ${canalesAPI1.length} canales en API 1 (golazolvhd)`);
        }
    }
    
    // Buscar en API 2
    if (transmisionesAPI2 && transmisionesAPI2.transmisiones) {
        const transAPI2 = transmisionesAPI2.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === eventoNombre || evento.includes(eventoNombre) || eventoNombre.includes(evento);
        });
        
        if (transAPI2 && transAPI2.canales) {
            const canalesAPI2 = transAPI2.canales.map(canal => ({
                ...canal,
                fuente: 'ellink'
            }));
            canalesCombinados = [...canalesCombinados, ...canalesAPI2];
            console.log(`✅ Encontrados ${canalesAPI2.length} canales en API 2 (ellink)`);
        }
    }
    
    if (canalesCombinados.length === 0) {
        showToast('No hay canales disponibles para este partido');
        return;
    }
    
    console.log(`📺 Total canales combinados: ${canalesCombinados.length}`);
    
    // Crear transmisión combinada
    const transmisionCombinada = {
        evento: tituloMostrar,
        titulo: tituloMostrar,
        canales: canalesCombinados
    };
    
    showChannelSelector(transmisionCombinada, tituloMostrar);
}

// Event listener para búsqueda en tiempo real
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(e.target.value);
            }
        });
    }
});

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
        
        let totalLinks = 0;
        if (transmision.canales && transmision.canales.length > 0) {
            transmision.canales.forEach(canal => {
                if (canal.links) {
                    if (canal.links.hoca) totalLinks++;
                    if (canal.links.caster) totalLinks++;
                    if (canal.links.wigi) totalLinks++;
                }
            });
        }
        
        const isLive = transmision.estado?.toLowerCase().includes('vivo') || transmision.estado?.toLowerCase().includes('live');
        const isUpcoming = transmision.estado?.toLowerCase().includes('próximo') || transmision.estado?.toLowerCase().includes('programado');
        const isFinished = transmision.estado?.toLowerCase().includes('finalizado') || transmision.estado?.toLowerCase().includes('finished');
        
        let statusBadge = '';
        if (isLive) {
            statusBadge = `<span class="status-badge status-live"><span class="live-dot"></span> EN VIVO</span>`;
        } else if (isFinished) {
            statusBadge = `<span class="status-badge status-finished"><i class="fas fa-check-circle"></i> Finalizado</span>`;
        } else {
            statusBadge = `<span class="status-badge status-upcoming">⏰ PRÓXIMO</span>`;
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
            <div class="important-match-card-new" onclick='selectImportantMatchByTransmision(${index})'>
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
                    
                    ${fecha ? `
                        <div class="match-date">
                            <i class="far fa-clock"></i> ${fecha}
                        </div>
                    ` : ''}
                    
                    ${canalesCount > 0 ? `
                        <div class="match-channel">
                            <i class="fas fa-tv"></i> Canal ${transmision.canales[0]?.numero || transmision.canales[0]?.nombre || transmision.canales[0]?.nombre || ''}
                        </div>
                    ` : `
                        <div class="match-channel">
                            <i class="fas fa-list"></i> Opciones ${totalLinks > 0 ? `#${totalLinks} links` : 'disponibles'}
                        </div>
                    `}
                    
                    <div class="match-footer">
                        <button class="btn-ver">
                            <i class="fas fa-play"></i> Ver
                        </button>
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
    
    if (!transmision) {
        showToast('No se pudo encontrar la transmisión');
        return;
    }
    
    if (!transmision.canales || transmision.canales.length === 0) {
        transmision.canales = [];
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

// ===========================
// LINEUPS FUNCTIONALITY
// ===========================

let lineupsData = null;
let selectedMatchIndex = 0;

// Cargar alineaciones desde la API
async function loadLineups() {
    try {
        const response = await fetch('https://ultragol-api3.onrender.com/alineaciones');
        const data = await response.json();
        lineupsData = data;
        
        console.log('✅ Alineaciones cargadas:', data);
        
        renderMatchSelector();
        
        if (data.partidos && data.partidos.length > 0) {
            renderLineup(0);
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error cargando alineaciones:', error);
        const selectorContainer = document.getElementById('lineupsMatchSelector');
        const lineupsContainer = document.getElementById('lineupsContainer');
        
        if (selectorContainer) {
            selectorContainer.innerHTML = '<div class="standings-loading">Error al cargar partidos</div>';
        }
        if (lineupsContainer) {
            lineupsContainer.innerHTML = '<div class="lineups-loading">Error al cargar alineaciones</div>';
        }
        return null;
    }
}

// Renderizar selector de partidos
function renderMatchSelector() {
    const container = document.getElementById('lineupsMatchSelector');
    if (!container || !lineupsData || !lineupsData.partidos || lineupsData.partidos.length === 0) {
        if (container) {
            container.innerHTML = '<div class="standings-loading">No hay partidos disponibles</div>';
        }
        return;
    }
    
    const tabsHTML = lineupsData.partidos.map((partido, index) => {
        const isActive = index === selectedMatchIndex ? 'active' : '';
        const isPending = !partido.alineacionDisponible ? 'pending' : '';
        const badgeClass = partido.alineacionDisponible ? 'available' : 'pending';
        const badgeText = partido.alineacionDisponible ? 'Disponible' : 'Pendiente';
        
        return `
            <div class="lineup-match-tab ${isActive} ${isPending}" onclick="selectLineupMatch(${index})">
                <div class="lineup-match-tab-teams">
                    <img src="${partido.local.equipo.logo}" alt="${partido.local.equipo.nombreCorto}" onerror="this.src='https://via.placeholder.com/24'">
                    <span>${partido.local.equipo.nombreCorto} vs ${partido.visitante.equipo.nombreCorto}</span>
                    <img src="${partido.visitante.equipo.logo}" alt="${partido.visitante.equipo.nombreCorto}" onerror="this.src='https://via.placeholder.com/24'">
                </div>
                <div class="lineup-match-tab-info">
                    <i class="far fa-clock"></i>
                    <span>${partido.partido.hora}</span>
                </div>
                <span class="lineup-match-tab-badge ${badgeClass}">${badgeText}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="lineups-match-tabs">${tabsHTML}</div>`;
}

// Seleccionar un partido
function selectLineupMatch(index) {
    selectedMatchIndex = index;
    renderMatchSelector();
    renderLineup(index);
}

// Renderizar alineación del partido seleccionado
function renderLineup(index) {
    const container = document.getElementById('lineupsContainer');
    if (!container || !lineupsData || !lineupsData.partidos || !lineupsData.partidos[index]) {
        return;
    }
    
    const partido = lineupsData.partidos[index];
    
    if (!partido.alineacionDisponible) {
        container.innerHTML = `
            <div class="lineup-not-available">
                <i class="fas fa-clock"></i>
                <h4>Alineación no disponible</h4>
                <p>${partido.mensaje || 'La alineación se publicará aproximadamente 1 hora antes del partido.'}</p>
                <div class="lineup-match-meta" style="margin-top: 20px;">
                    <div class="lineup-match-meta-item">
                        <i class="far fa-calendar"></i>
                        <span>${partido.partido.hora}</span>
                    </div>
                    <div class="lineup-match-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${partido.partido.estadio || 'Estadio por confirmar'}</span>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    // Renderizar alineaciones disponibles
    const headerHTML = `
        <div class="lineup-match-header">
            <h3 class="lineup-match-title">${partido.partido.nombre}</h3>
            <div class="lineup-match-meta">
                <div class="lineup-match-meta-item">
                    <i class="far fa-calendar"></i>
                    <span>${partido.partido.hora}</span>
                </div>
                <div class="lineup-match-meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${partido.partido.estadio}</span>
                </div>
                <div class="lineup-match-meta-item">
                    <i class="fas fa-info-circle"></i>
                    <span>${partido.partido.estado}</span>
                </div>
            </div>
        </div>
    `;
    
    const localLineupHTML = renderTeamLineup(partido.local, 'local');
    const visitanteLineupHTML = renderTeamLineup(partido.visitante, 'visitante');
    
    container.innerHTML = `
        ${headerHTML}
        <div class="lineups-display">
            ${localLineupHTML}
            ${visitanteLineupHTML}
        </div>
    `;
}

// Renderizar alineación de un equipo
function renderTeamLineup(teamData, side) {
    if (!teamData.alineacion || !teamData.alineacion.titulares) {
        return `
            <div class="lineup-team">
                <div class="lineup-team-header">
                    <img src="${teamData.equipo.logo}" alt="${teamData.equipo.nombre}" class="lineup-team-logo" onerror="this.src='https://via.placeholder.com/48'">
                    <div class="lineup-team-name">${teamData.equipo.nombre}</div>
                </div>
                <div class="lineup-not-available">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Alineación no disponible</p>
                </div>
            </div>
        `;
    }
    
    const formacion = teamData.alineacion.formacion || '4-4-2';
    const titulares = teamData.alineacion.titulares || [];
    
    return `
        <div class="lineup-team">
            <div class="lineup-team-header">
                <img src="${teamData.equipo.logo}" alt="${teamData.equipo.nombre}" class="lineup-team-logo" onerror="this.src='https://via.placeholder.com/48'">
                <div class="lineup-team-name">${teamData.equipo.nombre}</div>
                <div class="lineup-team-formation">${formacion}</div>
            </div>
            ${renderFootballField(titulares, formacion, side)}
        </div>
    `;
}

// Renderizar campo de fútbol con jugadores
function renderFootballField(jugadores, formacion, side) {
    const formacionArray = parseFormacion(formacion);
    const jugadoresPorLinea = distribuirJugadores(jugadores, formacionArray);
    
    const lineasHTML = jugadoresPorLinea.map((linea, lineaIndex) => {
        const jugadoresHTML = linea.map(jugador => {
            const isGoalkeeper = lineaIndex === 0;
            const numero = jugador.numero || jugador.dorsal || '?';
            const nombre = jugador.nombre || jugador.apellido || 'Jugador';
            const nombreCorto = nombre.split(' ').slice(-1)[0]; // Último apellido
            
            return `
                <div class="player-marker ${isGoalkeeper ? 'goalkeeper' : ''}">
                    <div class="player-avatar">${numero}</div>
                    <div class="player-name">${nombreCorto}</div>
                </div>
            `;
        }).join('');
        
        return `<div class="field-row">${jugadoresHTML}</div>`;
    }).join('');
    
    const formacionClass = formacion.replace(/[^0-9-]/g, '');
    
    return `
        <div class="football-field formation-${formacionClass}">
            <div class="field-players">
                ${lineasHTML}
            </div>
        </div>
    `;
}

// Parsear formación (ejemplo: "4-4-2" -> [1, 4, 4, 2])
function parseFormacion(formacion) {
    if (!formacion) return [1, 4, 4, 2];
    
    const numeros = formacion.split('-').map(n => parseInt(n)).filter(n => !isNaN(n));
    
    // Agregar portero al inicio si no está
    if (numeros.length > 0 && numeros.reduce((a, b) => a + b, 0) === 10) {
        numeros.unshift(1);
    }
    
    return numeros.length > 0 ? numeros : [1, 4, 4, 2];
}

// Distribuir jugadores en líneas según formación
function distribuirJugadores(jugadores, formacionArray) {
    const lineas = [];
    let jugadorIndex = 0;
    
    for (let i = 0; i < formacionArray.length; i++) {
        const jugadoresPorLinea = formacionArray[i];
        const lineaJugadores = [];
        
        for (let j = 0; j < jugadoresPorLinea && jugadorIndex < jugadores.length; j++) {
            lineaJugadores.push(jugadores[jugadorIndex]);
            jugadorIndex++;
        }
        
        lineas.push(lineaJugadores);
    }
    
    return lineas;
}
