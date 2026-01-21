let currentStreamUrl = '';
let currentStreamTitle = '';
let activeTab = 'live';
let currentLeague = 'Liga MX';
let marcadoresData = null;
let todasLasLigasData = null;
let transmisionesData = null;
let transmisionesAPI1 = null;
let transmisionesAPI2 = null;
let transmisionesAPI3 = null;
let transmisionesAPI4 = null;
let transmisionesAPI5 = null;
let transmisionesAPI6 = null;
let updateInterval = null;
let currentFeaturedIndex = 0;
let featuredMatches = [];
let touchStartX = 0;
let touchEndX = 0;
let streakData = {
    startDate: null,
    currentStreak: 0,
    lastVisitDate: null,
    claimedRewards: []
};

const API_BASE = 'https://ultragol-api-3.vercel.app';

const leaguesConfig = {
    'Todas las Ligas': {
        apiPath: '/todo-todas-las-ligas',
        tabla: null,
        noticias: null,
        goleadores: null,
        calendario: null,
        marcadores: '/todo-todas-las-ligas',
        alineaciones: null,
        estadisticas: null,
        isAllLeagues: true
    },
    'Liga MX': {
        apiPath: '',
        tabla: '/tabla',
        noticias: '/Noticias',
        goleadores: '/goleadores',
        calendario: '/calendario',
        marcadores: '/marcadores',
        alineaciones: '/alineaciones',
        estadisticas: '/estadisticas'
    },
    'Liga Pro Ecuador': {
        apiPath: '/ecuador',
        tabla: '/ecuador/tabla',
        noticias: '/ecuador/noticias',
        goleadores: '/ecuador/goleadores',
        calendario: '/ecuador/calendario',
        marcadores: '/ecuador/marcadores',
        alineaciones: '/ecuador/alineaciones',
        estadisticas: '/ecuador/estadisticas'
    },
    'Liga Argentina': {
        apiPath: '/argentina',
        tabla: '/argentina/tabla',
        noticias: '/argentina/noticias',
        goleadores: '/argentina/goleadores',
        calendario: '/argentina/calendario',
        marcadores: '/argentina/marcadores',
        alineaciones: '/argentina/alineaciones',
        estadisticas: '/argentina/estadisticas'
    },
    'Liga Colombia': {
        apiPath: '/colombia',
        tabla: '/colombia/tabla',
        noticias: '/colombia/noticias',
        goleadores: '/colombia/goleadores',
        calendario: '/colombia/calendario',
        marcadores: '/colombia/marcadores',
        alineaciones: '/colombia/alineaciones',
        estadisticas: '/colombia/estadisticas'
    },
    'Brasileirão': {
        apiPath: '/brasil',
        tabla: '/brasil/tabla',
        noticias: '/brasil/noticias',
        goleadores: '/brasil/goleadores',
        calendario: '/brasil/calendario',
        marcadores: '/brasil/marcadores',
        alineaciones: '/brasil/alineaciones',
        estadisticas: '/brasil/estadisticas'
    },
    'Premier League': {
        apiPath: '/premier',
        tabla: '/premier/tabla',
        noticias: '/premier/noticias',
        goleadores: '/premier/goleadores',
        calendario: '/premier/calendario',
        marcadores: '/premier/marcadores',
        alineaciones: '/premier/alineaciones',
        estadisticas: '/premier/estadisticas'
    },
    'La Liga': {
        apiPath: '/laliga',
        tabla: '/laliga/tabla',
        noticias: '/laliga/noticias',
        goleadores: '/laliga/goleadores',
        calendario: '/laliga/calendario',
        marcadores: '/laliga/marcadores',
        alineaciones: '/laliga/alineaciones',
        estadisticas: '/laliga/estadisticas'
    },
    'Serie A': {
        apiPath: '/seriea',
        tabla: '/seriea/tabla',
        noticias: '/seriea/noticias',
        goleadores: '/seriea/goleadores',
        calendario: '/seriea/calendario',
        marcadores: '/seriea/marcadores',
        alineaciones: '/seriea/alineaciones',
        estadisticas: '/seriea/estadisticas'
    },
    'Bundesliga': {
        apiPath: '/bundesliga',
        tabla: '/bundesliga/tabla',
        noticias: '/bundesliga/noticias',
        goleadores: '/bundesliga/goleadores',
        calendario: '/bundesliga/calendario',
        marcadores: '/bundesliga/marcadores',
        alineaciones: '/bundesliga/alineaciones',
        estadisticas: '/bundesliga/estadisticas'
    },
    'Ligue 1': {
        apiPath: '/ligue1',
        tabla: '/ligue1/tabla',
        noticias: '/ligue1/noticias',
        goleadores: '/ligue1/goleadores',
        calendario: '/ligue1/calendario',
        marcadores: '/ligue1/marcadores',
        alineaciones: '/ligue1/alineaciones',
        estadisticas: '/ligue1/estadisticas'
    },
    'Champions League': {
        apiPath: '/champions',
        tabla: '/champions/tabla',
        noticias: '/champions/noticias',
        goleadores: '/champions/goleadores',
        calendario: '/champions/calendario',
        marcadores: '/champions/marcadores',
        alineaciones: '/champions/alineaciones',
        estadisticas: '/champions/estadisticas'
    },
    'Europa League': {
        apiPath: '/europaleague',
        tabla: '/europaleague/tabla',
        noticias: '/europaleague/noticias',
        goleadores: '/europaleague/goleadores',
        calendario: '/europaleague/calendario',
        marcadores: '/europaleague/marcadores',
        alineaciones: '/europaleague/alineaciones',
        estadisticas: '/europaleague/estadisticas'
    },
    'Copa Libertadores': {
        apiPath: '/libertadores',
        tabla: '/libertadores/tabla',
        noticias: '/libertadores/noticias',
        goleadores: '/libertadores/goleadores',
        calendario: '/libertadores/calendario',
        marcadores: '/libertadores/marcadores',
        alineaciones: '/libertadores/alineaciones',
        estadisticas: '/libertadores/estadisticas'
    },
    'Copa Sudamericana': {
        apiPath: '/sudamericana',
        tabla: '/sudamericana/tabla',
        noticias: '/sudamericana/noticias',
        goleadores: '/sudamericana/goleadores',
        calendario: '/sudamericana/calendario',
        marcadores: '/sudamericana/marcadores',
        alineaciones: '/sudamericana/alineaciones',
        estadisticas: '/sudamericana/estadisticas'
    },
    'MLS': {
        apiPath: '/mls',
        tabla: '/mls/tabla',
        noticias: '/mls/noticias',
        goleadores: '/mls/goleadores',
        calendario: '/mls/calendario',
        marcadores: '/mls/marcadores',
        alineaciones: '/mls/alineaciones',
        estadisticas: '/mls/estadisticas'
    },
    'Saudi Pro League': {
        apiPath: '/arabia',
        tabla: '/arabia/tabla',
        noticias: '/arabia/noticias',
        goleadores: '/arabia/goleadores',
        calendario: '/arabia/calendario',
        marcadores: '/arabia/marcadores',
        alineaciones: '/arabia/alineaciones',
        estadisticas: '/arabia/estadisticas'
    }
};

let currentStatsEventId = null;
let statsUpdateInterval = null;

// Diccionario de aliases para equipos de Liga MX (compartido)
const aliasesEquipos = {
    'uanl': ['tigres', 'tigres uanl', 'uanl', 'tigs'],
    'tigres': ['tigres', 'tigres uanl', 'uanl', 'tigs'],
    'america': ['america', 'club america', 'las aguilas', 'ame', 'ca'],
    'chivas': ['chivas', 'guadalajara', 'cd guadalajara', 'gdl', 'rebaño'],
    'guadalajara': ['chivas', 'guadalajara', 'cd guadalajara', 'gdl', 'rebaño'],
    'cruz azul': ['cruz azul', 'la maquina', 'azul', 'ca'],
    'pumas': ['pumas', 'pumas unam', 'unam', 'felinos'],
    'monterrey': ['monterrey', 'rayados', 'cf monterrey', 'mty', 'rayos'],
    'santos': ['santos', 'santos laguna', 'guerreros'],
    'toluca': ['toluca', 'diablos rojos', 'diablos', 'tol'],
    'leon': ['leon', 'club leon', 'la fiera', 'esmeraldas'],
    'atlas': ['atlas', 'fc atlas', 'rojinegros'],
    'pachuca': ['pachuca', 'tuzos', 'pach'],
    'tijuana': ['tijuana', 'xolos', 'club tijuana', 'tj'],
    'puebla': ['puebla', 'club puebla', 'la franja', 'pue'],
    'queretaro': ['queretaro', 'gallos blancos', 'gallos', 'qro'],
    'necaxa': ['necaxa', 'rayos', 'nec'],
    'mazatlan': ['mazatlan', 'mazatlan fc', 'mzt'],
    'juarez': ['juarez', 'fc juarez', 'bravos', 'jua'],
    'san luis': ['san luis', 'atletico de san luis', 'atl san luis', 'atl. san luis', 'asl', 'tuneros'],
    'asl': ['san luis', 'atletico de san luis', 'atl san luis', 'atl. san luis', 'asl', 'tuneros'],
    'gdl': ['chivas', 'guadalajara', 'cd guadalajara', 'rebaño'],
    'mty': ['monterrey', 'rayados', 'cf monterrey']
};

// Función auxiliar para normalizar nombres de equipos (uso compartido)
const normalizarNombre = (nombre) => {
    return nombre
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .trim();
};

// Función para obtener aliases de un equipo (uso compartido)
const obtenerAliases = (nombre) => {
    const normalizado = normalizarNombre(nombre);
    
    for (const [clave, aliases] of Object.entries(aliasesEquipos)) {
        if (normalizado.includes(clave) || aliases.some(alias => normalizado.includes(alias))) {
            return aliases;
        }
    }
    
    return [normalizado];
};

// Sistema de navegación con historial de modales
let modalHistory = [];

// Utilidades de navegación de modales
const modalNavigation = {
    resetHistory() {
        modalHistory = [];
        console.log('📋 Historial de modales reseteado');
    },
    
    pushModal(modalId, data = {}) {
        modalHistory.push({ id: modalId, data: data });
        console.log(`📌 Modal añadido al historial: ${modalId}`, modalHistory);
    },
    
    popModal() {
        const popped = modalHistory.pop();
        console.log(`📤 Modal removido del historial: ${popped?.id}`, modalHistory);
        return popped;
    },
    
    getCurrent() {
        return modalHistory[modalHistory.length - 1];
    },
    
    getPrevious() {
        return modalHistory[modalHistory.length - 2];
    },
    
    getLength() {
        return modalHistory.length;
    }
};

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 ULTRAGOL iniciando... URL:', window.location.href);
    console.log('🔗 Query params:', window.location.search);
    
    // Iniciar reloj en tiempo real
    startRealTimeClock();
    
    // Verificar inmediatamente si hay link compartido
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('ch')) {
        console.log('⚡ Link compartido detectado, procesando primero...');
        checkSharedStream();
    }
    
    await loadMarcadores();
    await loadTransmisiones();
    startAutoUpdate();
    await loadStandings();
    await loadNews();
    await loadLineups();
    initializeStreak();
    
    // Verificar también después de cargar (por si acaso)
    if (!urlParams.get('ch')) {
        checkSharedStream();
    }
});

// Función para el reloj en tiempo real que se adapta al país del usuario
function startRealTimeClock() {
    const clockElement = document.getElementById('realTimeClock');
    if (!clockElement) return;

    function updateClock() {
        const now = new Date();
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        clockElement.textContent = now.toLocaleTimeString(undefined, options);
    }

    updateClock();
    setInterval(updateClock, 1000);
}

// Función principal para cargar marcadores desde la API
async function loadMarcadores() {
    try {
        const leagueConfig = leaguesConfig[currentLeague];
        const endpoint = leagueConfig ? leagueConfig.marcadores : '/marcadores';
        
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();
        marcadoresData = data;
        
        console.log('✅ Marcadores cargados:', endpoint);
        
        updateFeaturedMatch(data);
        
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


// Función para cargar transmisiones desde las 5 APIs
async function loadTransmisiones() {
    try {
        // Cargar las 6 APIs en paralelo con manejo individual de errores
        const [data1, data2, data3, data4, data5, data6] = await Promise.all([
            fetch('https://ultragol-api-3.vercel.app/transmisiones')
                .then(res => res.json())
                .catch(err => {
                    console.warn('⚠️ Error cargando API 1 (rereyano):', err);
                    return { transmisiones: [] };
                }),
            fetch('https://ultragol-api-3.vercel.app/transmisiones3')
                .then(res => res.json())
                .catch(err => {
                    console.warn('⚠️ Error cargando API 2 (e1link):', err);
                    return { transmisiones: [] };
                }),
            fetch('https://ultragol-api-3.vercel.app/transmisiones2')
                .then(res => res.json())
                .catch(err => {
                    console.warn('⚠️ Error cargando API 3 (voodc):', err);
                    return { transmisiones: [] };
                }),
            fetch('https://ultragol-api-3.vercel.app/transmisiones4')
                .then(res => res.json())
                .catch(err => {
                    console.warn('⚠️ Error cargando API 4 (transmisiones4):', err);
                    return { transmisiones: [] };
                }),
            fetch('https://ultragol-api-3.vercel.app/transmisiones5')
                .then(res => res.json())
                .catch(err => {
                    console.warn('⚠️ Error cargando API 5 (donromans):', err);
                    return { matches: [] };
                }),
            fetch('/api/transmisiones6')
                .then(res => res.json())
                .catch(err => {
                    console.warn('⚠️ Error cargando API 6 (local):', err);
                    return { transmisiones: [] };
                })
        ]);
        
        // Convertir API 2 (transmisiones3 - e1link) que usa "enlaces" a "canales" pero manteniendo la estructura de array
        const transmisionesNormalizadasAPI2 = (data2.transmisiones || []).map(t => {
            const canalesNormalizados = [{
                numero: '',
                nombre: t.canal || 'Canal',
                enlaces: t.enlaces || [],
                tipoAPI: 'e1link'
            }];
            
            return {
                ...t,
                canales: canalesNormalizados,
                tipoAPI: 'e1link'
            };
        });
        
        // Convertir API 3 (transmisiones2 - voodc) que usa "url" directamente a "canales"
        const transmisionesNormalizadasAPI3 = (data3.transmisiones || []).map(t => {
            const canalesNormalizados = [{
                numero: '',
                nombre: t.deporte || 'Canal',
                enlaces: t.url ? [{ url: t.url, calidad: 'HD' }] : [],
                tipoAPI: 'voodc'
            }];
            
            return {
                ...t,
                evento: t.evento || t.titulo,
                titulo: t.titulo || t.evento,
                canales: canalesNormalizados,
                tipoAPI: 'voodc'
            };
        });
        
        // Convertir API 4 (transmisiones4 - ftvhd) que ya tiene "canales" con "url" directo
        const transmisionesNormalizadasAPI4 = (data4.transmisiones || []).map(t => {
            // La API 4 ya tiene canales[], pero con url directo, necesitamos convertir a enlaces[]
            const canalesNormalizados = (t.canales || []).map(canal => ({
                numero: '',
                nombre: canal.nombre || 'Canal',
                enlaces: canal.url ? [{ url: canal.url, calidad: 'HD' }] : [],
                tipoAPI: 'transmisiones4'
            }));
            
            return {
                ...t,
                canales: canalesNormalizados,
                tipoAPI: 'transmisiones4'
            };
        });
        
        // Convertir API 5 (transmisiones5 - donromans) que usa "matches" con "links"
        const transmisionesNormalizadasAPI5 = (data5.matches || []).map(match => {
            const canalesNormalizados = [];
            
            // Procesar cada link en el array de links
            if (match.links && Array.isArray(match.links) && match.links.length > 0) {
                match.links.forEach(linkGroup => {
                    // Soportar múltiples formatos de estructura de datos
                    if (linkGroup.type === 'urls_list' && linkGroup.data && Array.isArray(linkGroup.data) && linkGroup.data.length > 0) {
                        // Cada enlace en el grupo se convierte en un canal
                        linkGroup.data.forEach((stream, idx) => {
                            if (stream && stream.match_url) {
                                canalesNormalizados.push({
                                    numero: '',
                                    nombre: stream.stream_source || stream.platform || `Canal ${idx + 1}`,
                                    enlaces: [{
                                        url: stream.match_url,
                                        calidad: stream.stream_quality === 'hd' ? 'HD' : 'SD',
                                        platform: stream.platform,
                                        source: stream.stream_source
                                    }],
                                    tipoAPI: 'donromans'
                                });
                            }
                        });
                    }
                    // Soportar estructura alternativa de objeto urls
                    else if (linkGroup.urls && Array.isArray(linkGroup.urls) && linkGroup.urls.length > 0) {
                        linkGroup.urls.forEach((url, idx) => {
                            if (url) {
                                canalesNormalizados.push({
                                    numero: '',
                                    nombre: `Enlace ${idx + 1}`,
                                    enlaces: [{
                                        url: url,
                                        calidad: 'SD'
                                    }],
                                    tipoAPI: 'donromans'
                                });
                            }
                        });
                    }
                });
            }
            
            return {
                evento: match.title,
                titulo: match.title,
                liga: match.league,
                fecha: match.hour,
                estado: match.is_replay ? 'Repetición' : 'Programado',
                canales: canalesNormalizados,
                tipoAPI: 'donromans'
            };
        });
        
        // Marcar transmisiones API 1 con su tipo
        const transmisionesAPI1Marcadas = (data1.transmisiones || []).map(t => ({
            ...t,
            tipoAPI: 'rereyano',
            canales: (t.canales || []).map(c => ({
                ...c,
                tipoAPI: 'rereyano'
            }))
        }));
        
        // Marcar transmisiones API 6 con su tipo
        const transmisionesAPI6Marcadas = (data6.transmisiones || []).map(t => ({
            ...t,
            tipoAPI: 'transmisiones6',
            canales: (t.canales || []).map(c => ({
                ...c,
                tipoAPI: 'transmisiones6'
            }))
        }));
        
        // Guardar datos separados de cada API
        transmisionesAPI1 = {
            ...data1,
            transmisiones: transmisionesAPI1Marcadas
        };
        transmisionesAPI2 = {
            ...data2,
            transmisiones: transmisionesNormalizadasAPI2
        };
        transmisionesAPI3 = {
            ...data3,
            transmisiones: transmisionesNormalizadasAPI3
        };
        transmisionesAPI4 = {
            ...data4,
            transmisiones: transmisionesNormalizadasAPI4
        };
        transmisionesAPI5 = {
            matches: data5.matches || [],
            transmisiones: transmisionesNormalizadasAPI5
        };
        transmisionesAPI6 = {
            ...data6,
            transmisiones: transmisionesAPI6Marcadas
        };
        
        // Combinar las transmisiones de las 6 APIs (partidos pueden repetirse)
        const transmisionesCombinadas = [
            ...transmisionesAPI1Marcadas,
            ...transmisionesNormalizadasAPI2,
            ...transmisionesNormalizadasAPI3,
            ...transmisionesNormalizadasAPI4,
            ...transmisionesNormalizadasAPI5,
            ...transmisionesAPI6Marcadas
        ];
        
        // Crear el objeto combinado
        transmisionesData = {
            transmisiones: transmisionesCombinadas
        };
        
        console.log('✅ Transmisiones cargadas desde API 1 (rereyano):', data1.transmisiones?.length || 0);
        console.log('✅ Transmisiones cargadas desde API 2 (e1link):', data2.transmisiones?.length || 0);
        console.log('✅ Transmisiones cargadas desde API 3 (voodc):', data3.transmisiones?.length || 0);
        console.log('✅ Transmisiones cargadas desde API 4 (transmisiones4):', data4.transmisiones?.length || 0);
        console.log('✅ Transmisiones cargadas desde API 5 (donromans):', data5.matches?.length || 0);
        console.log('✅ Transmisiones cargadas desde API 6 (local):', data6.transmisiones?.length || 0);
        
        // Log detallado de API 5 para debugging
        const totalCanalesAPI5 = transmisionesNormalizadasAPI5.reduce((sum, t) => sum + (t.canales?.length || 0), 0);
        console.log(`✅ Total canales en API 5 (donromans): ${totalCanalesAPI5}`);
        if (totalCanalesAPI5 === 0 && data5.matches?.length > 0) {
            console.warn('⚠️ API 5 tiene matches pero sin canales procesados. Estructura:', data5.matches[0]);
        }
        
        console.log('✅ Total transmisiones combinadas:', transmisionesCombinadas.length);
        
        return transmisionesData;
    } catch (error) {
        console.error('❌ Error cargando transmisiones:', error);
        // Retornar objeto vacío en lugar de null para evitar errores
        transmisionesData = { transmisiones: [] };
        return transmisionesData;
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
                    <h2 class="match-title">${partido.local.nombreCorto} vs. ${partido.visitante.nombreCorto}</h2>
                    <div class="match-badges">
                        <span class="badge-icon" title="Marcador"><i class="fas fa-circle"></i></span>
                        <span class="badge-icon play-badge-icon" title="Ver partido en vivo" onclick="watchMatch('${partido.id}')"><i class="fas fa-play"></i></span>
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
    
    const isMatchFinished = (reloj) => {
        if (!reloj) return false;
        // Check for final time indicators
        if (reloj === 'FT' || reloj === 'Terminado' || reloj === '+' || reloj === 'Fin') {
            return true;
        }
        // Extract minute number and check if >= 120 (match went to extra time and finished)
        const minuteMatch = reloj.match(/^(\d+)/);
        if (minuteMatch) {
            const minuto = parseInt(minuteMatch[1]);
            // If match shows 120+ minutes, it's likely finished
            if (minuto >= 120) return true;
        }
        return false;
    };
    
    const partidosEnVivo = data.partidos.filter(p => {
        // Don't show finished matches
        if (isMatchFinished(p.reloj)) return false;
        
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
                    <span class="gol-jugador">${gol.goleador || 'Jugador'}</span>
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
                    <span class="gol-jugador">${gol.goleador || 'Jugador'}</span>
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
        const fechaInfo = formatearFechaCreativa(partido.fechaISO || partido.fecha);
        
        return `
        <div class="match-card-creative">
            <div class="shine-effect"></div>
            <div class="card-header">
                <img src="ultragol-vs-stadium.jpg" alt="Match">
                <div class="creative-date">
                    <span class="date-day">${fechaInfo.diaSemana}</span>
                    <span class="date-number">${fechaInfo.diaNumero}</span>
                    <span class="date-month">${fechaInfo.mes}</span>
                </div>
                <div class="creative-time">
                    <i class="fas fa-clock"></i>
                    <span class="time-value">${hora}</span>
                </div>
            </div>
            <div class="card-content">
                <div class="teams-creative">
                    <div class="team-creative">
                        <div class="team-logo-wrapper">
                            <img src="${partido.local.logo}" alt="${partido.local.nombreCorto}" onerror="this.src='https://via.placeholder.com/50'">
                        </div>
                        <span class="team-name">${partido.local.nombreCorto}</span>
                    </div>
                    <div class="vs-creative">
                        <span class="vs-badge">VS</span>
                        <div class="vs-line"></div>
                    </div>
                    <div class="team-creative">
                        <div class="team-logo-wrapper">
                            <img src="${partido.visitante.logo}" alt="${partido.visitante.nombreCorto}" onerror="this.src='https://via.placeholder.com/50'">
                        </div>
                        <span class="team-name">${partido.visitante.nombreCorto}</span>
                    </div>
                </div>
                ${partido.detalles?.estadio ? `
                    <div class="venue-creative">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${partido.detalles.estadio}</span>
                    </div>
                ` : ''}
                <button class="btn-upcoming-creative" onclick="showToast('⚽ Este partido aún no ha comenzado')">
                    <i class="far fa-calendar-check"></i>
                    <span>PRÓXIMAMENTE</span>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Formatear fecha de manera creativa
function formatearFechaCreativa(fechaStr) {
    const diasSemana = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    try {
        let fecha;
        
        if (fechaStr && fechaStr.includes('T')) {
            fecha = new Date(fechaStr);
        } else if (fechaStr) {
            const match = fechaStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
            if (match) {
                const dia = parseInt(match[1]);
                const mes = parseInt(match[2]) - 1;
                let anio = parseInt(match[3]);
                if (anio < 100) anio += 2000;
                fecha = new Date(anio, mes, dia);
            }
        }
        
        if (!fecha || isNaN(fecha.getTime())) {
            return {
                diaSemana: '---',
                diaNumero: '--',
                mes: '---'
            };
        }
        
        return {
            diaSemana: diasSemana[fecha.getDay()],
            diaNumero: fecha.getDate().toString().padStart(2, '0'),
            mes: meses[fecha.getMonth()]
        };
    } catch (e) {
        return {
            diaSemana: '---',
            diaNumero: '--',
            mes: '---'
        };
    }
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
    
    // Diccionario de aliases para equipos de Liga MX
    const aliasesEquipos = {
        'uanl': ['tigres', 'tigres uanl', 'uanl'],
        'tigres': ['tigres', 'tigres uanl', 'uanl'],
        'america': ['america', 'club america', 'las aguilas'],
        'chivas': ['chivas', 'guadalajara', 'cd guadalajara'],
        'guadalajara': ['chivas', 'guadalajara', 'cd guadalajara'],
        'cruz azul': ['cruz azul', 'la maquina'],
        'pumas': ['pumas', 'pumas unam', 'unam'],
        'monterrey': ['monterrey', 'rayados', 'cf monterrey'],
        'santos': ['santos', 'santos laguna'],
        'toluca': ['toluca', 'diablos rojos'],
        'leon': ['leon', 'club leon', 'la fiera'],
        'atlas': ['atlas', 'fc atlas'],
        'pachuca': ['pachuca', 'tuzos'],
        'tijuana': ['tijuana', 'xolos', 'club tijuana'],
        'puebla': ['puebla', 'club puebla', 'la franja'],
        'queretaro': ['queretaro', 'gallos blancos'],
        'necaxa': ['necaxa', 'rayos'],
        'mazatlan': ['mazatlan', 'mazatlan fc'],
        'juarez': ['juarez', 'fc juarez', 'bravos'],
        'san luis': ['san luis', 'atletico de san luis', 'atl san luis', 'atl. san luis', 'asl'],
        'asl': ['san luis', 'atletico de san luis', 'atl san luis', 'atl. san luis', 'asl'],
        'gdl': ['chivas', 'guadalajara', 'cd guadalajara'],
        'mty': ['monterrey', 'rayados', 'cf monterrey']
    };
    
    // Función auxiliar para normalizar nombres de equipos
    const normalizarNombre = (nombre) => {
        return nombre
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .trim();
    };
    
    // Función para obtener aliases de un equipo
    const obtenerAliases = (nombre) => {
        const normalizado = normalizarNombre(nombre);
        
        // Buscar en el diccionario
        for (const [clave, aliases] of Object.entries(aliasesEquipos)) {
            if (normalizado.includes(clave) || aliases.some(alias => normalizado.includes(alias))) {
                return aliases;
            }
        }
        
        return [normalizado];
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
    
    // Obtener aliases para búsqueda más flexible
    const aliasesLocal = obtenerAliases(partido.local.nombreCorto);
    const aliasesVisitante = obtenerAliases(partido.visitante.nombreCorto);
    
    console.log(`🔍 Buscando transmisión para:`);
    console.log(`   Local: "${nombreLocal}" → aliases: [${aliasesLocal.join(', ')}]`);
    console.log(`   Visitante: "${nombreVisitante}" → aliases: [${aliasesVisitante.join(', ')}]`);
    
    // Función para buscar transmisión en una lista con búsqueda mejorada
    const buscarTransmision = (transmisiones) => {
        if (!transmisiones || transmisiones.length === 0) return null;
        
        // Primer intento: búsqueda estricta con aliases
        let resultado = transmisiones.find(t => {
            const evento = normalizarNombre(t.evento || t.titulo || '');
            
            // Buscar coincidencias con aliases
            const tieneLocal = 
                evento.includes(nombreLocal) || 
                evento.includes(nombreCortoLocal) ||
                evento.includes(palabrasLocal) ||
                aliasesLocal.some(alias => evento.includes(alias)) ||
                (palabrasLocal.length > 3 && evento.includes(palabrasLocal.split(' ')[0]));
                
            const tieneVisitante = 
                evento.includes(nombreVisitante) || 
                evento.includes(nombreCortoVisitante) ||
                evento.includes(palabrasVisitante) ||
                aliasesVisitante.some(alias => evento.includes(alias)) ||
                (palabrasVisitante.length > 3 && evento.includes(palabrasVisitante.split(' ')[0]));
            
            if (tieneLocal && tieneVisitante) {
                console.log(`  ✅ Match encontrado (con aliases): "${evento}"`);
                return true;
            }
            
            return false;
        });
        
        // Segundo intento: búsqueda flexible (al menos 3 caracteres coinciden)
        if (!resultado) {
            resultado = transmisiones.find(t => {
                const evento = normalizarNombre(t.evento || t.titulo || '');
                
                // Extraer palabras del evento
                const palabrasEvento = evento.split(/\s+vs?\s+|\s+-\s+/i);
                
                if (palabrasEvento.length >= 2) {
                    const equipo1Evento = palabrasEvento[0].trim();
                    const equipo2Evento = palabrasEvento[1].split(/\s*[-|]\s*/)[0].trim();
                    
                    // Verificar si alguna parte del nombre coincide
                    const coincideLocal = 
                        equipo1Evento.includes(nombreCortoLocal.substring(0, 3)) ||
                        equipo2Evento.includes(nombreCortoLocal.substring(0, 3)) ||
                        nombreCortoLocal.includes(equipo1Evento.substring(0, 3)) ||
                        nombreCortoLocal.includes(equipo2Evento.substring(0, 3));
                        
                    const coincideVisitante = 
                        equipo1Evento.includes(nombreCortoVisitante.substring(0, 3)) ||
                        equipo2Evento.includes(nombreCortoVisitante.substring(0, 3)) ||
                        nombreCortoVisitante.includes(equipo1Evento.substring(0, 3)) ||
                        nombreCortoVisitante.includes(equipo2Evento.substring(0, 3));
                    
                    if (coincideLocal && coincideVisitante) {
                        console.log(`  ✅ Match encontrado (flexible): "${evento}"`);
                        return true;
                    }
                }
                
                return false;
            });
        }
        
        if (!resultado) {
            console.log(`  ❌ No se encontró coincidencia en ${transmisiones.length} transmisiones`);
        }
        
        return resultado;
    };
    
    // Buscar en las 5 APIs
    const transmisionAPI1 = transmisionesAPI1 ? buscarTransmision(transmisionesAPI1.transmisiones) : null;
    const transmisionAPI2 = transmisionesAPI2 ? buscarTransmision(transmisionesAPI2.transmisiones) : null;
    const transmisionAPI3 = transmisionesAPI3 ? buscarTransmision(transmisionesAPI3.transmisiones) : null;
    const transmisionAPI4 = transmisionesAPI4 ? buscarTransmision(transmisionesAPI4.transmisiones) : null;
    const transmisionAPI5 = transmisionesAPI5 ? buscarTransmision(transmisionesAPI5.transmisiones) : null;
    
    // Combinar canales de las 5 APIs
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
    
    if (transmisionAPI3) {
        if (!eventoNombre) eventoNombre = transmisionAPI3.evento || transmisionAPI3.titulo;
        const canalesAPI3 = (transmisionAPI3.canales || []).map(canal => ({
            ...canal,
            fuente: 'voodc'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI3];
        console.log(`✅ Encontrados ${canalesAPI3.length} canales en API 3 (voodc)`);
    }
    
    if (transmisionAPI4) {
        if (!eventoNombre) eventoNombre = transmisionAPI4.evento || transmisionAPI4.titulo;
        const canalesAPI4 = (transmisionAPI4.canales || []).map(canal => ({
            ...canal,
            fuente: 'ftvhd'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI4];
        console.log(`✅ Encontrados ${canalesAPI4.length} canales en API 4 (ftvhd)`);
    }
    
    if (transmisionAPI5) {
        if (!eventoNombre) eventoNombre = transmisionAPI5.evento || transmisionAPI5.titulo;
        const canalesAPI5 = (transmisionAPI5.canales || []).map(canal => ({
            ...canal,
            fuente: 'donromans'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI5];
        console.log(`✅ Encontrados ${canalesAPI5.length} canales en API 5 (donromans)`);
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
    
    if (!modal || !body || !title) {
        console.error("❌ Error: No se encontraron los elementos del modal en el DOM");
        return;
    }
    
    title.innerHTML = `<i class="fas fa-microchip"></i> ${partidoNombre}`;
    
    // Guardar en historial antes de abrir
    modalNavigation.pushModal('channelSelector', { transmision, partidoNombre });
    
    // Create professional server selector UI
    let channelsHtml = `
        <div class="server-selector-creative">
            <div class="server-header-creative">
                <div class="server-title-group">
                    <span class="pulse-icon"></span>
                    <span class="server-label">SERVIDOR DE TRANSMISIÓN</span>
                </div>
                <div class="server-subtitle-creative">Selecciona una señal disponible para ver el partido</div>
            </div>
            <div class="server-grid-creative">
    `;
    
    if (transmision.canales && transmision.canales.length > 0) {
        transmision.canales.forEach((canal, index) => {
            const serverNum = index + 1;
            const apiType = canal.tipoAPI || 'DIRECT';
            const latency = Math.floor(Math.random() * 25) + 5;
            const quality = 'HD PREMIUM';
            const enlace = canal.links ? (canal.links.hoca || canal.links.caster || canal.links.wigi) : (canal.enlaces ? canal.enlaces[0]?.url : '');
            const canalNombre = canal.nombre || `Servidor #${serverNum}`;
            
            channelsHtml += `
                <div class="server-node-card" onclick="playChannelFromSelector('${enlace}', '${partidoNombre.replace(/'/g, "\\'")}')">
                    <div class="node-edge"></div>
                    <div class="node-content">
                        <div class="node-visual">
                            <div class="node-icon-wrapper">
                                <i class="fas fa-server"></i>
                                <div class="node-online-dot"></div>
                            </div>
                            <div class="node-latency">${latency}ms</div>
                        </div>
                        <div class="node-info">
                            <div class="node-name">${canalNombre}</div>
                            <div class="node-meta">
                                <span class="node-provider">SISTEMA ${apiType.toUpperCase()}</span>
                                <span class="node-divider"></span>
                                <span class="node-quality">${quality}</span>
                            </div>
                        </div>
                        <div class="node-action">
                            <div class="node-connect-btn">
                                <i class="fas fa-play"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        channelsHtml += `
            <div class="no-nodes" style="text-align:center; padding: 40px 20px; color: #707070;">
                <i class="fas fa-exclamation-circle" style="font-size: 32px; margin-bottom: 16px; color: #ff4500;"></i>
                <p>No se encontraron señales activas en este momento</p>
            </div>
        `;
    }
    
    channelsHtml += `
            </div>
            <div class="server-terminal-footer">
                <div class="terminal-text">
                    <i class="fas fa-check-circle"></i>
                    <span>CONEXIÓN ESTABLE Y OPTIMIZADA</span>
                </div>
            </div>
        </div>
    `;
    
    body.innerHTML = channelsHtml;
    modal.classList.add('active');
}

function playChannelFromSelector(url, title) {
    if (!url || url === 'undefined') {
        showToast('Error: Nodo de transmisión no válido');
        return;
    }
    const modal = document.getElementById('channelSelectorModal');
    if (modal) modal.classList.remove('active');
    playStreamInModal(url, title);
}


// ==================== FUNCIONES DE ESTADÍSTICAS EN TIEMPO REAL ====================

// Cache para estadísticas cargadas de la API
let statsCache = {};

// Función para obtener estadísticas reales desde la API
async function fetchRealMatchStats(eventId) {
    if (!eventId) return null;
    
    try {
        console.log(`📊 Cargando estadísticas del partido ${eventId}...`);
        const response = await fetch(`https://ultragol-api-3.vercel.app/estadisticas/partido/${eventId}`);
        
        if (!response.ok) {
            console.warn(`⚠️ Error al cargar estadísticas: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        console.log(`✅ Estadísticas cargadas para partido ${eventId}:`, data);
        
        // Guardar en cache
        statsCache[eventId] = {
            data: data,
            timestamp: Date.now()
        };
        
        return data;
    } catch (error) {
        console.error(`❌ Error al obtener estadísticas del partido ${eventId}:`, error);
        return null;
    }
}

// Función auxiliar para extraer valor numérico de string con %
function parseStatValue(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        return parseInt(value.replace('%', '').trim()) || 0;
    }
    if (value.valor) {
        return parseInt(value.valor.replace('%', '').trim()) || 0;
    }
    return 0;
}

// Función para procesar las estadísticas de la API al formato interno
function processAPIStats(apiData) {
    if (!apiData) return null;
    
    // La API puede tener dos formatos:
    // 1. Formato estadisticasEquipos: { local: { estadisticas: {...} }, visitante: { estadisticas: {...} } }
    // 2. Formato estadisticas: { posesion: { local, visitante }, ... }
    
    let localStats, visitanteStats;
    
    if (apiData.estadisticasEquipos) {
        // Nuevo formato con estadisticasEquipos
        localStats = apiData.estadisticasEquipos.local?.estadisticas || {};
        visitanteStats = apiData.estadisticasEquipos.visitante?.estadisticas || {};
        
        return {
            possession: {
                home: parseStatValue(localStats.posesion),
                away: parseStatValue(visitanteStats.posesion)
            },
            shots: {
                home: parseStatValue(localStats.tiros?.totales),
                away: parseStatValue(visitanteStats.tiros?.totales)
            },
            shotsOnTarget: {
                home: parseStatValue(localStats.tiros?.aPorteria),
                away: parseStatValue(visitanteStats.tiros?.aPorteria)
            },
            corners: {
                home: parseStatValue(localStats.corners),
                away: parseStatValue(visitanteStats.corners)
            },
            fouls: {
                home: parseStatValue(localStats.faltas),
                away: parseStatValue(visitanteStats.faltas)
            },
            offsides: {
                home: parseStatValue(localStats.fuerasDeJuego),
                away: parseStatValue(visitanteStats.fuerasDeJuego)
            },
            cards: {
                home: {
                    yellow: parseStatValue(localStats.tarjetas?.amarillas),
                    red: parseStatValue(localStats.tarjetas?.rojas)
                },
                away: {
                    yellow: parseStatValue(visitanteStats.tarjetas?.amarillas),
                    red: parseStatValue(visitanteStats.tarjetas?.rojas)
                }
            },
            pases: {
                home: parseStatValue(localStats.pases?.totales),
                away: parseStatValue(visitanteStats.pases?.totales)
            },
            precision: {
                home: parseStatValue(localStats.pases?.precision),
                away: parseStatValue(visitanteStats.pases?.precision)
            },
            salvadas: {
                home: parseStatValue(localStats.salvadas),
                away: parseStatValue(visitanteStats.salvadas)
            },
            intercepciones: {
                home: parseStatValue(localStats.intercepciones),
                away: parseStatValue(visitanteStats.intercepciones)
            }
        };
    } else if (apiData.estadisticas) {
        // Formato alternativo con estadisticas directas
        const stats = apiData.estadisticas;
        
        return {
            possession: {
                home: parseInt(stats.posesion?.local) || 50,
                away: parseInt(stats.posesion?.visitante) || 50
            },
            shots: {
                home: parseInt(stats.tiros?.local) || 0,
                away: parseInt(stats.tiros?.visitante) || 0
            },
            shotsOnTarget: {
                home: parseInt(stats.tirosAlArco?.local) || parseInt(stats.tirosAPuerta?.local) || 0,
                away: parseInt(stats.tirosAlArco?.visitante) || parseInt(stats.tirosAPuerta?.visitante) || 0
            },
            corners: {
                home: parseInt(stats.corners?.local) || parseInt(stats.tiroDeEsquina?.local) || 0,
                away: parseInt(stats.corners?.visitante) || parseInt(stats.tiroDeEsquina?.visitante) || 0
            },
            fouls: {
                home: parseInt(stats.faltas?.local) || 0,
                away: parseInt(stats.faltas?.visitante) || 0
            },
            offsides: {
                home: parseInt(stats.fuerasDeJuego?.local) || parseInt(stats.offside?.local) || 0,
                away: parseInt(stats.fuerasDeJuego?.visitante) || parseInt(stats.offside?.visitante) || 0
            },
            cards: {
                home: {
                    yellow: parseInt(stats.tarjetasAmarillas?.local) || 0,
                    red: parseInt(stats.tarjetasRojas?.local) || 0
                },
                away: {
                    yellow: parseInt(stats.tarjetasAmarillas?.visitante) || 0,
                    red: parseInt(stats.tarjetasRojas?.visitante) || 0
                }
            },
            pases: {
                home: parseInt(stats.pases?.local) || 0,
                away: parseInt(stats.pases?.visitante) || 0
            },
            precision: {
                home: parseInt(stats.precisionPases?.local) || 0,
                away: parseInt(stats.precisionPases?.visitante) || 0
            },
            salvadas: {
                home: 0,
                away: 0
            },
            intercepciones: {
                home: 0,
                away: 0
            }
        };
    }
    
    return null;
}

// Función para extraer nombre del jugador de la descripción
function extractPlayerName(descripcion) {
    if (!descripcion) return null;
    
    // Formato: "Takumi Minamino (Monaco) is shown the yellow card..."
    // Extraer el nombre antes del primer paréntesis
    const match = descripcion.match(/^([^(]+)\s*\(/);
    if (match && match[1]) {
        return match[1].trim();
    }
    
    // Formato alternativo: buscar nombre al inicio de la descripción
    const words = descripcion.split(' ');
    if (words.length >= 2) {
        // Tomar las primeras 2-3 palabras como nombre (típicamente nombre y apellido)
        const possibleName = words.slice(0, 3).join(' ');
        if (possibleName.length > 3 && !possibleName.toLowerCase().includes('goal') && 
            !possibleName.toLowerCase().includes('card') && !possibleName.toLowerCase().includes('foul')) {
            return possibleName;
        }
    }
    
    return null;
}

// Función para procesar eventos de la API
function processAPIEvents(apiData) {
    const events = [];
    
    if (!apiData || !apiData.eventos) return events;
    
    const eventosData = apiData.eventos;
    
    // Procesar goles
    if (eventosData.goles && eventosData.goles.length > 0) {
        eventosData.goles.forEach(gol => {
            let playerName = gol.jugador || gol.anotador;
            if (!playerName || playerName === 'Desconocido') {
                playerName = extractPlayerName(gol.descripcion || gol.motivo) || 'Desconocido';
            }
            events.push({
                type: 'goal',
                minute: parseInt(gol.minuto) || 0,
                team: gol.equipo === 'local' ? 'home' : 'away',
                player: playerName,
                detail: gol.tipo || 'Gol'
            });
        });
    }
    
    // Procesar tarjetas
    if (eventosData.tarjetas && eventosData.tarjetas.length > 0) {
        eventosData.tarjetas.forEach(tarjeta => {
            const isRed = tarjeta.tipo === 'roja' || tarjeta.tipo === 'red' || tarjeta.color === 'roja' || 
                         tarjeta.tipo === 'Red Card' || tarjeta.tipoTarjeta === 'roja';
            
            let playerName = tarjeta.jugador;
            if (!playerName || playerName === 'Desconocido') {
                playerName = extractPlayerName(tarjeta.descripcion || tarjeta.motivo) || 'Desconocido';
            }
            
            events.push({
                type: isRed ? 'red-card' : 'yellow-card',
                minute: parseInt(tarjeta.minuto) || 0,
                team: tarjeta.equipo === 'local' ? 'home' : 'away',
                player: playerName,
                detail: isRed ? 'Tarjeta Roja' : 'Tarjeta Amarilla'
            });
        });
    }
    
    // Procesar cambios/sustituciones
    if (eventosData.cambios && eventosData.cambios.length > 0) {
        eventosData.cambios.forEach(cambio => {
            events.push({
                type: 'substitution',
                minute: parseInt(cambio.minuto) || 0,
                team: cambio.equipo === 'local' ? 'home' : 'away',
                player: `${cambio.entra || cambio.jugadorEntra || 'Jugador'} por ${cambio.sale || cambio.jugadorSale || 'Jugador'}`,
                detail: 'Cambio'
            });
        });
    }
    
    // Procesar sustituciones (alias alternativo)
    if (eventosData.sustituciones && eventosData.sustituciones.length > 0) {
        eventosData.sustituciones.forEach(sub => {
            events.push({
                type: 'substitution',
                minute: parseInt(sub.minuto) || 0,
                team: sub.equipo === 'local' ? 'home' : 'away',
                player: `${sub.entra || sub.jugadorEntra || 'Jugador'} por ${sub.sale || sub.jugadorSale || 'Jugador'}`,
                detail: 'Cambio'
            });
        });
    }
    
    // Si hay eventos en 'todos', procesarlos también
    if (eventosData.todos && eventosData.todos.length > 0) {
        eventosData.todos.forEach(evento => {
            const type = evento.tipo === 'gol' ? 'goal' :
                        evento.tipo === 'tarjeta_amarilla' ? 'yellow-card' :
                        evento.tipo === 'tarjeta_roja' ? 'red-card' :
                        evento.tipo === 'cambio' ? 'substitution' : 'other';
            
            if (type !== 'other' && !events.find(e => e.minute === parseInt(evento.minuto) && e.type === type)) {
                events.push({
                    type: type,
                    minute: parseInt(evento.minuto) || 0,
                    team: evento.equipo === 'local' ? 'home' : 'away',
                    player: evento.jugador || evento.descripcion || 'Evento',
                    detail: evento.descripcion || evento.tipo
                });
            }
        });
    }
    
    // Ordenar por minuto
    events.sort((a, b) => a.minute - b.minute);
    
    return events;
}

// Función para actualizar las estadísticas en el DOM
async function updateStatsInDOM(eventId, partido) {
    if (!eventId) return;
    
    const apiData = await fetchRealMatchStats(eventId);
    
    if (!apiData) {
        console.log('📊 No hay datos de API, usando estadísticas generadas');
        return;
    }
    
    const stats = processAPIStats(apiData);
    const events = processAPIEvents(apiData);
    
    if (!stats) return;
    
    // Actualizar barras de estadísticas
    const statsContent = document.getElementById('statsContent');
    if (statsContent) {
        statsContent.innerHTML = `
            <div class="stats-bars-container">
                ${generateStatBar('Posesión', stats.possession.home, stats.possession.away, '%')}
                ${generateStatBar('Tiros', stats.shots.home, stats.shots.away)}
                ${generateStatBar('Tiros a Puerta', stats.shotsOnTarget.home, stats.shotsOnTarget.away)}
                ${generateStatBar('Córners', stats.corners.home, stats.corners.away)}
                ${generateStatBar('Faltas', stats.fouls.home, stats.fouls.away)}
                ${generateStatBar('Fueras de Juego', stats.offsides.home, stats.offsides.away)}
                ${stats.pases.home > 0 ? generateStatBar('Pases', stats.pases.home, stats.pases.away) : ''}
                ${stats.precision.home > 0 ? generateStatBar('Precisión Pases', stats.precision.home, stats.precision.away, '%') : ''}
            </div>
            <div class="stats-source" style="text-align: center; font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 8px;">
                <i class="fas fa-sync-alt"></i> Datos en tiempo real
            </div>
        `;
    }
    
    // Actualizar eventos
    const eventsContent = document.getElementById('eventsContent');
    if (eventsContent && partido) {
        eventsContent.innerHTML = `
            <div class="match-events-section">
                <div class="events-header">
                    <i class="fas fa-clock"></i>
                    <span class="events-header-title">Cronología del Partido</span>
                </div>
                <div class="events-timeline">
                    ${events.length > 0 ? events.map(event => generateEventItem(event, partido)).join('') : `
                        <div class="no-events-message">
                            <i class="fas fa-hourglass-half"></i>
                            <p>Los eventos aparecerán aquí durante el partido</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
    
    // Actualizar tarjetas
    const cardsContent = document.getElementById('cardsContent');
    if (cardsContent && partido) {
        const cardEvents = events.filter(e => e.type === 'yellow-card' || e.type === 'red-card');
        cardsContent.innerHTML = `
            <div class="cards-summary">
                <div class="cards-team">
                    <span class="cards-team-name">${partido.local?.nombreCorto || 'Local'}</span>
                    <div class="cards-display">
                        <div class="card-count">
                            <div class="card-icon yellow"></div>
                            <span class="card-number">${stats.cards.home.yellow}</span>
                        </div>
                        <div class="card-count">
                            <div class="card-icon red"></div>
                            <span class="card-number">${stats.cards.home.red}</span>
                        </div>
                    </div>
                </div>
                <div class="cards-team">
                    <span class="cards-team-name">${partido.visitante?.nombreCorto || 'Visitante'}</span>
                    <div class="cards-display">
                        <div class="card-count">
                            <div class="card-icon yellow"></div>
                            <span class="card-number">${stats.cards.away.yellow}</span>
                        </div>
                        <div class="card-count">
                            <div class="card-icon red"></div>
                            <span class="card-number">${stats.cards.away.red}</span>
                        </div>
                    </div>
                </div>
            </div>
            ${cardEvents.length > 0 ? `
                <div class="match-events-section">
                    <div class="events-header">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span class="events-header-title">Tarjetas Mostradas</span>
                    </div>
                    <div class="events-timeline">
                        ${cardEvents.map(event => generateEventItem(event, partido)).join('')}
                    </div>
                </div>
            ` : `
                <div class="no-events-message">
                    <i class="fas fa-check-circle"></i>
                    <p>No hay tarjetas en este partido</p>
                </div>
            `}
        `;
    }
    
    // Actualizar marcador si está disponible
    if (apiData.estado) {
        const scoreDisplay = document.querySelector('.stats-score-display');
        const statusDisplay = document.querySelector('.stats-match-status');
        
        if (scoreDisplay && apiData.marcador) {
            const localScore = apiData.marcador.local?.goles ?? apiData.marcador.local ?? 0;
            const visitanteScore = apiData.marcador.visitante?.goles ?? apiData.marcador.visitante ?? 0;
            scoreDisplay.textContent = `${localScore} - ${visitanteScore}`;
        }
        
        if (statusDisplay) {
            if (apiData.estado.enVivo) {
                statusDisplay.textContent = apiData.estado.reloj || 'En Vivo';
                statusDisplay.style.color = '#4ecdc4';
            } else if (apiData.estado.finalizado) {
                statusDisplay.textContent = 'Finalizado';
                statusDisplay.style.color = '#888';
            }
        }
    }
    
    console.log('✅ Estadísticas actualizadas en el DOM');
}

// Función para iniciar la actualización automática de estadísticas
function startStatsAutoUpdate(eventId, partido) {
    // Limpiar intervalo anterior si existe
    stopStatsAutoUpdate();
    
    currentStatsEventId = eventId;
    
    // Cargar estadísticas inmediatamente
    updateStatsInDOM(eventId, partido);
    
    // Configurar actualización automática cada 30 segundos
    statsUpdateInterval = setInterval(() => {
        if (currentStatsEventId === eventId) {
            console.log('🔄 Actualizando estadísticas automáticamente...');
            updateStatsInDOM(eventId, partido);
        }
    }, 30000); // 30 segundos
    
    console.log(`⏱️ Auto-actualización de estadísticas iniciada para partido ${eventId}`);
}

// Función para detener la actualización automática
function stopStatsAutoUpdate() {
    if (statsUpdateInterval) {
        clearInterval(statsUpdateInterval);
        statsUpdateInterval = null;
        currentStatsEventId = null;
        console.log('⏹️ Auto-actualización de estadísticas detenida');
    }
}

// Función para generar la sección de estadísticas del partido
function generateMatchStatsSection(partidoNombre) {
    // Buscar el partido en marcadoresData
    const partido = findPartidoByName(partidoNombre);
    
    if (!partido) {
        return `
            <div class="match-stats-section">
                <div class="stats-header">
                    <div class="stats-header-icon">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <span class="stats-header-title">Estadísticas del Partido</span>
                </div>
                <div class="no-events-message">
                    <i class="fas fa-futbol"></i>
                    <p>Las estadísticas estarán disponibles cuando inicie el partido</p>
                </div>
            </div>
        `;
    }
    
    // Determinar estado del partido
    let matchStatus = 'Programado';
    if (partido.estado?.enVivo) {
        matchStatus = partido.reloj || 'En Vivo';
    } else if (partido.estado?.finalizado) {
        matchStatus = 'Finalizado';
    } else if (partido.estado?.programado) {
        matchStatus = formatearHora(partido.fecha);
    }
    
    // Generar estadísticas simuladas basadas en el marcador (en un escenario real vendría de API)
    const stats = generateMatchStats(partido);
    const events = generateMatchEvents(partido);
    
    return `
        <div class="match-stats-section">
            <div class="stats-header">
                <div class="stats-header-icon">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <span class="stats-header-title">Estadísticas del Partido</span>
            </div>
            
            <!-- Header con equipos y marcador -->
            <div class="stats-teams-header">
                <div class="stats-team">
                    <img src="${partido.local?.logo || 'https://via.placeholder.com/45'}" alt="${partido.local?.nombreCorto || 'Local'}" class="stats-team-logo" onerror="this.src='https://via.placeholder.com/45'">
                    <span class="stats-team-name">${partido.local?.nombreCorto || 'Local'}</span>
                </div>
                <div class="stats-score-center">
                    <span class="stats-score-display">${partido.local?.marcador ?? 0} - ${partido.visitante?.marcador ?? 0}</span>
                    <span class="stats-match-status">${matchStatus}</span>
                </div>
                <div class="stats-team">
                    <img src="${partido.visitante?.logo || 'https://via.placeholder.com/45'}" alt="${partido.visitante?.nombreCorto || 'Visitante'}" class="stats-team-logo" onerror="this.src='https://via.placeholder.com/45'">
                    <span class="stats-team-name">${partido.visitante?.nombreCorto || 'Visitante'}</span>
                </div>
            </div>
            
            <!-- Tabs de estadísticas -->
            <div class="stats-tabs">
                <button class="stats-tab active" data-tab="stats" onclick="switchStatsTab('stats', this)">
                    <i class="fas fa-chart-pie"></i>
                    Estadísticas
                </button>
                <button class="stats-tab" data-tab="events" onclick="switchStatsTab('events', this)">
                    <i class="fas fa-list-ul"></i>
                    Eventos
                </button>
                <button class="stats-tab" data-tab="cards" onclick="switchStatsTab('cards', this)">
                    <i class="fas fa-square"></i>
                    Tarjetas
                </button>
            </div>
            
            <!-- Contenido de Estadísticas -->
            <div class="stats-tab-content active" id="statsContent">
                <div class="stats-bars-container">
                    ${generateStatBar('Posesión', stats.possession.home, stats.possession.away, '%')}
                    ${generateStatBar('Tiros', stats.shots.home, stats.shots.away)}
                    ${generateStatBar('Tiros a Puerta', stats.shotsOnTarget.home, stats.shotsOnTarget.away)}
                    ${generateStatBar('Córners', stats.corners.home, stats.corners.away)}
                    ${generateStatBar('Faltas', stats.fouls.home, stats.fouls.away)}
                    ${generateStatBar('Fueras de Juego', stats.offsides.home, stats.offsides.away)}
                </div>
            </div>
            
            <!-- Contenido de Eventos -->
            <div class="stats-tab-content" id="eventsContent">
                <div class="match-events-section">
                    <div class="events-header">
                        <i class="fas fa-clock"></i>
                        <span class="events-header-title">Cronología del Partido</span>
                    </div>
                    <div class="events-timeline">
                        ${events.length > 0 ? events.map(event => generateEventItem(event, partido)).join('') : `
                            <div class="no-events-message">
                                <i class="fas fa-hourglass-half"></i>
                                <p>Los eventos aparecerán aquí durante el partido</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
            
            <!-- Contenido de Tarjetas -->
            <div class="stats-tab-content" id="cardsContent">
                <div class="cards-summary">
                    <div class="cards-team">
                        <span class="cards-team-name">${partido.local?.nombreCorto || 'Local'}</span>
                        <div class="cards-display">
                            <div class="card-count">
                                <div class="card-icon yellow"></div>
                                <span class="card-number">${stats.cards.home.yellow}</span>
                            </div>
                            <div class="card-count">
                                <div class="card-icon red"></div>
                                <span class="card-number">${stats.cards.home.red}</span>
                            </div>
                        </div>
                    </div>
                    <div class="cards-team">
                        <span class="cards-team-name">${partido.visitante?.nombreCorto || 'Visitante'}</span>
                        <div class="cards-display">
                            <div class="card-count">
                                <div class="card-icon yellow"></div>
                                <span class="card-number">${stats.cards.away.yellow}</span>
                            </div>
                            <div class="card-count">
                                <div class="card-icon red"></div>
                                <span class="card-number">${stats.cards.away.red}</span>
                            </div>
                        </div>
                    </div>
                </div>
                ${generateCardEvents(events, partido)}
            </div>
        </div>
    `;
}

// Función para buscar partido por nombre
function findPartidoByName(partidoNombre) {
    if (!partidoNombre) return null;
    
    // Limpiar el nombre del partido (quitar prefijo de liga como "Ligue 1 : ")
    let cleanName = partidoNombre;
    let ligaPrefix = null;
    if (cleanName.includes(' : ')) {
        const splitParts = cleanName.split(' : ');
        ligaPrefix = splitParts[0].toLowerCase();
        cleanName = splitParts.pop();
    }
    
    // Manejar diferentes formatos de separador (vs, -, vs.)
    let parts = [];
    if (cleanName.includes(' vs ')) {
        parts = cleanName.split(' vs ');
    } else if (cleanName.includes(' - ')) {
        parts = cleanName.split(' - ');
    } else if (cleanName.includes(' vs. ')) {
        parts = cleanName.split(' vs. ');
    }
    
    if (parts.length < 2) return null;
    
    const localName = (parts[0] || '').trim().toLowerCase();
    const visitanteName = (parts[1] || '').trim().toLowerCase();
    
    if (!localName || !visitanteName) return null;
    
    // Función auxiliar para buscar en un array de partidos
    const buscarEnPartidos = (partidos) => {
        if (!partidos) return null;
        return partidos.find(p => {
            const localNorm = (p.local?.nombreCorto || p.local?.nombre || '').toLowerCase();
            const visitanteNorm = (p.visitante?.nombreCorto || p.visitante?.nombre || '').toLowerCase();
            const localNombreCompleto = (p.local?.nombre || '').toLowerCase();
            const visitanteNombreCompleto = (p.visitante?.nombre || '').toLowerCase();
            
            const localMatch = localNorm.includes(localName) || 
                              localName.includes(localNorm) ||
                              localNombreCompleto.includes(localName) ||
                              localName.includes(localNombreCompleto);
            
            const visitanteMatch = visitanteNorm.includes(visitanteName) || 
                                   visitanteName.includes(visitanteNorm) ||
                                   visitanteNombreCompleto.includes(visitanteName) ||
                                   visitanteName.includes(visitanteNombreCompleto);
            
            return localMatch && visitanteMatch;
        });
    };
    
    // 1. Buscar primero en marcadoresData (liga actual)
    if (marcadoresData && marcadoresData.partidos) {
        const encontrado = buscarEnPartidos(marcadoresData.partidos);
        if (encontrado) return encontrado;
    }
    
    
    return null;
}

// Función para buscar y cargar estadísticas de un partido desde cualquier liga
async function fetchStatsForMatch(partidoNombre) {
    if (!partidoNombre) return null;
    
    // Detectar la liga basándose en el nombre de la transmisión
    const ligaMapping = {
        'premier': 'premierleague',
        'la liga': 'laliga',
        'serie a': 'seriea',
        'bundesliga': 'bundesliga',
        'ligue 1': 'ligue1',
        'liga mx': 'mexico',
        'liga pro': 'ecuador',
        'superliga argentina': 'argentina',
        'liga profesional argentina': 'argentina',
        'liga betplay': 'colombia',
        'brasileirao': 'brasil',
        'brasileirão': 'brasil',
        'champions': 'championsleague',
        'europa league': 'europaleague',
        'libertadores': 'copalibertadores',
        'sudamericana': 'copasudamericana',
        'mls': 'mls',
        'saudi': 'arabia_saudita'
    };
    
    const nombreLower = partidoNombre.toLowerCase();
    let ligaCodigo = null;
    
    for (const [key, value] of Object.entries(ligaMapping)) {
        if (nombreLower.includes(key)) {
            ligaCodigo = value;
            break;
        }
    }
    
    if (!ligaCodigo) {
        console.log('📊 No se pudo detectar la liga para:', partidoNombre);
        return null;
    }
    
    console.log('📊 Buscando partido en datos cargados...');
    return null;
}

// Generar estadísticas basadas en el partido
function generateMatchStats(partido) {
    const isLive = partido.estado?.enVivo;
    const isFinished = partido.estado?.finalizado;
    const localScore = parseInt(partido.local?.marcador) || 0;
    const awayScore = parseInt(partido.visitante?.marcador) || 0;
    
    // Si el partido no ha empezado, mostrar estadísticas en 0
    if (!isLive && !isFinished) {
        return {
            possession: { home: 50, away: 50 },
            shots: { home: 0, away: 0 },
            shotsOnTarget: { home: 0, away: 0 },
            corners: { home: 0, away: 0 },
            fouls: { home: 0, away: 0 },
            offsides: { home: 0, away: 0 },
            cards: { home: { yellow: 0, red: 0 }, away: { yellow: 0, red: 0 } }
        };
    }
    
    // Generar estadísticas realistas basadas en el marcador
    const totalGoals = localScore + awayScore;
    const homeDominance = totalGoals > 0 ? (localScore / totalGoals) : 0.5;
    
    const possession = {
        home: Math.round(45 + (homeDominance * 20)),
        away: 0
    };
    possession.away = 100 - possession.home;
    
    return {
        possession,
        shots: {
            home: Math.max(localScore * 3, Math.round(8 + homeDominance * 10)),
            away: Math.max(awayScore * 3, Math.round(8 + (1 - homeDominance) * 10))
        },
        shotsOnTarget: {
            home: Math.max(localScore, Math.round(3 + homeDominance * 5)),
            away: Math.max(awayScore, Math.round(3 + (1 - homeDominance) * 5))
        },
        corners: {
            home: Math.round(3 + homeDominance * 5),
            away: Math.round(3 + (1 - homeDominance) * 5)
        },
        fouls: {
            home: Math.round(8 + Math.random() * 6),
            away: Math.round(8 + Math.random() * 6)
        },
        offsides: {
            home: Math.round(1 + Math.random() * 3),
            away: Math.round(1 + Math.random() * 3)
        },
        cards: {
            home: { yellow: Math.round(Math.random() * 3), red: Math.random() > 0.9 ? 1 : 0 },
            away: { yellow: Math.round(Math.random() * 3), red: Math.random() > 0.9 ? 1 : 0 }
        }
    };
}

// Generar eventos del partido
function generateMatchEvents(partido) {
    const events = [];
    const isLive = partido.estado?.enVivo;
    const isFinished = partido.estado?.finalizado;
    
    if (!isLive && !isFinished) return events;
    
    const localScore = parseInt(partido.local?.marcador) || 0;
    const awayScore = parseInt(partido.visitante?.marcador) || 0;
    
    // Generar goles
    for (let i = 0; i < localScore; i++) {
        events.push({
            type: 'goal',
            minute: Math.round(10 + Math.random() * 80),
            team: 'home',
            player: `Jugador ${Math.round(1 + Math.random() * 11)}`,
            detail: 'Gol'
        });
    }
    
    for (let i = 0; i < awayScore; i++) {
        events.push({
            type: 'goal',
            minute: Math.round(10 + Math.random() * 80),
            team: 'away',
            player: `Jugador ${Math.round(1 + Math.random() * 11)}`,
            detail: 'Gol'
        });
    }
    
    // Agregar algunas tarjetas aleatorias
    const numCards = Math.round(Math.random() * 4);
    for (let i = 0; i < numCards; i++) {
        events.push({
            type: Math.random() > 0.85 ? 'red-card' : 'yellow-card',
            minute: Math.round(15 + Math.random() * 75),
            team: Math.random() > 0.5 ? 'home' : 'away',
            player: `Jugador ${Math.round(1 + Math.random() * 11)}`,
            detail: Math.random() > 0.85 ? 'Tarjeta Roja' : 'Tarjeta Amarilla'
        });
    }
    
    // Ordenar por minuto
    events.sort((a, b) => a.minute - b.minute);
    
    return events;
}

// Generar barra de estadísticas
function generateStatBar(label, homeValue, awayValue, suffix = '') {
    const total = homeValue + awayValue || 1;
    const homePercent = (homeValue / total) * 100;
    const awayPercent = (awayValue / total) * 100;
    
    return `
        <div class="stat-bar-item">
            <span class="stat-value home">${homeValue}${suffix}</span>
            <div class="stat-bar-wrapper">
                <span class="stat-label">${label}</span>
                <div class="stat-bar-dual">
                    <div class="stat-bar-home" style="width: ${homePercent}%"></div>
                    <div class="stat-bar-away" style="width: ${awayPercent}%"></div>
                </div>
            </div>
            <span class="stat-value away">${awayValue}${suffix}</span>
        </div>
    `;
}

// Generar item de evento
function generateEventItem(event, partido) {
    const iconClass = event.type === 'goal' ? 'goal' : 
                      event.type === 'yellow-card' ? 'yellow-card' : 
                      event.type === 'red-card' ? 'red-card' :
                      event.type === 'substitution' ? 'substitution' : 'var';
    
    const iconSymbol = event.type === 'goal' ? 'futbol' : 
                       event.type === 'yellow-card' ? 'square' : 
                       event.type === 'red-card' ? 'square' :
                       event.type === 'substitution' ? 'exchange-alt' : 'tv';
    
    const teamClass = event.team === 'home' ? 'home-event' : 'away-event';
    const teamLogo = event.team === 'home' ? partido.local?.logo : partido.visitante?.logo;
    
    return `
        <div class="event-item ${teamClass}">
            <div class="event-minute">${event.minute}'</div>
            <div class="event-icon ${iconClass}">
                <i class="fas fa-${iconSymbol}"></i>
            </div>
            <div class="event-details">
                <span class="event-player">${event.player}</span>
                <span class="event-type">${event.detail}</span>
            </div>
            <img src="${teamLogo || 'https://via.placeholder.com/24'}" alt="" class="event-team-logo" onerror="this.src='https://via.placeholder.com/24'">
        </div>
    `;
}

// Generar eventos de tarjetas
function generateCardEvents(events, partido) {
    const cardEvents = events.filter(e => e.type === 'yellow-card' || e.type === 'red-card');
    
    if (cardEvents.length === 0) {
        return `
            <div class="no-events-message">
                <i class="fas fa-check-circle"></i>
                <p>No hay tarjetas en este partido</p>
            </div>
        `;
    }
    
    return `
        <div class="match-events-section">
            <div class="events-header">
                <i class="fas fa-exclamation-triangle"></i>
                <span class="events-header-title">Tarjetas Mostradas</span>
            </div>
            <div class="events-timeline">
                ${cardEvents.map(event => generateEventItem(event, partido)).join('')}
            </div>
        </div>
    `;
}

// Cambiar tab de estadísticas
function switchStatsTab(tabId, button) {
    // Remover active de todos los tabs y contenidos
    document.querySelectorAll('.stats-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.stats-tab-content').forEach(content => content.classList.remove('active'));
    
    // Activar tab seleccionado
    button.classList.add('active');
    
    // Activar contenido correspondiente
    const contentId = tabId === 'stats' ? 'statsContent' : 
                      tabId === 'events' ? 'eventsContent' : 'cardsContent';
    const content = document.getElementById(contentId);
    if (content) content.classList.add('active');
}

// Inicializar listeners de tabs
function initStatsTabsListeners() {
    // Los listeners ya están en los onclick de los botones
    console.log('📊 Tabs de estadísticas inicializados');
}

function closeChannelSelector() {
    const modal = document.getElementById('channelSelectorModal');
    modal.classList.remove('active');
    
    // Si cerramos el selector de canales, resetear historial solo si no hay más modales
    if (modalNavigation.getLength() > 0 && modalNavigation.getCurrent()?.id === 'channelSelector') {
        modalNavigation.popModal();
    }
}

function selectStream(streamUrl, streamTitle) {
    // Solo cerrar visualmente el modal, pero mantenerlo en el historial
    // para que el usuario pueda volver a él con el botón "Regresar"
    closeChannelSelectorOnly();
    playStreamInModal(streamUrl, streamTitle, false);
}

function playStreamInModal(streamUrl, title, isYouTube = false) {
    const modal = document.getElementById('playerModal');
    const videoContainer = modal.querySelector('.player-video-container');
    const modalTitle = document.getElementById('modalTitle');
    const statsContainer = document.getElementById('playerStatsContainer');
    
    // Guardar en historial antes de abrir
    modalNavigation.pushModal('player', { streamUrl, title, isYouTube });
    
    let embedUrl = streamUrl;
    
    if (isYouTube && streamUrl.includes('youtube.com/watch')) {
        const videoId = streamUrl.split('v=')[1]?.split('&')[0];
        if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`;
        }
    }
    
    currentStreamUrl = embedUrl;
    currentStreamTitle = title;
    
    // Actualizar título de forma más elegante
    const displayTitle = title.split(' - ')[0] || title;
    modalTitle.textContent = displayTitle;
    
    modal.classList.add('active');
    
    // Configurar iframe
    const iframe = document.getElementById('modalIframe');
    const loader = document.getElementById('modalLoader');
    
    if (loader) loader.style.display = 'flex';
    
    iframe.src = embedUrl;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; microphone; camera';
    
    // Agregar sección de estadísticas
    if (statsContainer) {
        statsContainer.innerHTML = generateMatchStatsSection(displayTitle);
        initStatsTabsListeners();
        
        // Buscar el partido localmente primero
        let partido = findPartidoByName(displayTitle);
        
        if (partido && partido.id) {
            console.log(`📊 Partido encontrado localmente con ID: ${partido.id}, cargando estadísticas...`);
            startStatsAutoUpdate(partido.id, partido);
        } else {
            // Si no se encuentra localmente, buscar en la API de la liga correspondiente
            console.log('📊 Buscando partido en API externa...');
            fetchStatsForMatch(title).then(partidoRemoto => {
                if (partidoRemoto && partidoRemoto.id) {
                    console.log(`📊 Partido encontrado en API: ${partidoRemoto.id}`);
                    startStatsAutoUpdate(partidoRemoto.id, partidoRemoto);
                } else {
                    console.log('📊 No se encontró partido, mostrando estadísticas generadas');
                }
            }).catch(err => {
                console.warn('📊 Error buscando estadísticas:', err);
            });
        }
    }
    
    iframe.onload = () => {
        setTimeout(() => {
            if (loader) loader.style.display = 'none';
        }, 800);
    };
    
    iframe.onerror = () => {
        console.error('Error cargando stream:', embedUrl);
        if (loader) {
            loader.innerHTML = `
                <div style="text-align: center; color: white;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Error al cargar la transmisión</p>
                    <button onclick="refreshStream()" style="margin-top: 16px; padding: 12px 24px; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    };
}

// Función de navegación hacia atrás con historial
function navigateBack() {
    const currentModal = modalNavigation.getCurrent();
    
    if (!currentModal) {
        // No hay historial, cerrar todo
        closeAllModals();
        return;
    }
    
    console.log(`⬅️ Navegando hacia atrás desde: ${currentModal.id}`);
    
    // Remover el modal actual del historial
    modalNavigation.popModal();
    
    // Cerrar el modal actual
    if (currentModal.id === 'player') {
        closePlayerModalOnly();
    } else if (currentModal.id === 'channelSelector') {
        closeChannelSelectorOnly();
    } else if (currentModal.id === 'importantMatches') {
        closeImportantMatchesModalOnly();
    }
    
    // Obtener el modal anterior
    const previousModal = modalNavigation.getCurrent();
    
    if (!previousModal) {
        // No hay modal anterior, cerrar todo
        console.log('✅ No hay modal anterior, todo cerrado');
        return;
    }
    
    // Restaurar el modal anterior
    console.log(`🔄 Restaurando modal anterior: ${previousModal.id}`);
    
    if (previousModal.id === 'channelSelector') {
        // Restaurar el selector de canales con los datos guardados
        const { transmision, partidoNombre } = previousModal.data;
        // Remover del historial temporalmente porque showChannelSelector lo volverá a agregar
        modalNavigation.popModal();
        showChannelSelector(transmision, partidoNombre);
    } else if (previousModal.id === 'importantMatches') {
        // Restaurar el modal de partidos importantes
        const modal = document.getElementById('importantMatchesModal');
        modal.classList.add('active');
    }
}

// Cerrar solo el modal del reproductor sin afectar el historial
function closePlayerModalOnly() {
    const modal = document.getElementById('playerModal');
    const modalBody = modal.querySelector('.modal-body');
    const statsContainer = document.getElementById('playerStatsContainer');
    
    modal.classList.remove('active');
    
    const iframe = document.getElementById('modalIframe');
    if (iframe) {
        iframe.src = '';
    }
    
    currentStreamUrl = '';
    
    // Detener la actualización automática de estadísticas
    stopStatsAutoUpdate();
    
    // Limpiar el contenedor de estadísticas
    if (statsContainer) {
        statsContainer.innerHTML = '';
    }
    
    setTimeout(() => {
        modalBody.innerHTML = `
            <div class="loading-spinner" id="modalLoader">
                <div class="spinner"></div>
            </div>
            <iframe id="modalIframe" frameborder="0" allowfullscreen></iframe>
        `;
    }, 300);
}

// Cerrar solo el selector de canales sin afectar el historial
function closeChannelSelectorOnly() {
    const modal = document.getElementById('channelSelectorModal');
    modal.classList.remove('active');
}

// Cerrar solo el modal de partidos importantes sin afectar el historial
function closeImportantMatchesModalOnly() {
    const modal = document.getElementById('importantMatchesModal');
    modal.classList.remove('active');
}

// Cerrar todos los modales y resetear historial
function closeAllModals() {
    closePlayerModalOnly();
    closeChannelSelectorOnly();
    closeImportantMatchesModalOnly();
    modalNavigation.resetHistory();
    console.log('🚪 Todos los modales cerrados');
}

// Función legacy - mantener por compatibilidad
function closeModal() {
    navigateBack();
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

function openLiveChat() {
    // Usar el chat widget flotante
    if (window.chatWidget) {
        window.chatWidget.open();
    } else {
        showToast('Chat no disponible');
    }
}

// ==================== MODO RADIO (AUDIO EN SEGUNDO PLANO) ====================
let radioModeActive = false;
let radioVolume = 100;
let isRadioMuted = false;

function toggleRadioMode() {
    const visualizer = document.getElementById('radioVisualizer');
    const iframe = document.getElementById('modalIframe');
    const radioBtn = document.querySelector('.radio-btn');
    
    radioModeActive = !radioModeActive;
    
    if (radioModeActive) {
        visualizer.classList.add('active');
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        radioBtn.classList.add('active');
        document.getElementById('radioTitleText').textContent = currentStreamTitle || 'MODO RADIO ACTIVO';
        showToast('Modo Radio: Solo audio activado');
    } else {
        visualizer.classList.remove('active');
        iframe.style.opacity = '1';
        iframe.style.pointerEvents = 'auto';
        radioBtn.classList.remove('active');
        showToast('Modo Video activado');
    }
}

function updateRadioVolume(value) {
    radioVolume = value;
    const iframe = document.getElementById('modalIframe');
    // Intentar comunicar volumen al iframe si es posible (depende del reproductor)
    // Como fallback visual:
    const muteBtn = document.getElementById('radioMuteBtn');
    if (value == 0) {
        muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (value < 50) {
        muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
        muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
}

function toggleMuteRadio() {
    isRadioMuted = !isRadioMuted;
    const muteBtn = document.getElementById('radioMuteBtn');
    const slider = document.getElementById('radioVolumeSlider');
    
    if (isRadioMuted) {
        muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        slider.value = 0;
        showToast('Silenciado');
    } else {
        muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        slider.value = radioVolume || 100;
        showToast('Sonido activado');
    }
}

function activateRadioMode() {
    radioModeActive = true;
    
    // Actualizar botón visualmente
    const radioBtn = document.querySelector('.modal-radio-btn');
    if (radioBtn) {
        radioBtn.classList.add('active');
        radioBtn.style.background = 'linear-gradient(135deg, #e94560 0%, #ff6b6b 100%)';
        radioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
    
    // Crear elemento de audio para mantener reproducción en segundo plano
    if (!radioAudioElement) {
        radioAudioElement = document.createElement('audio');
        radioAudioElement.id = 'radioBackgroundAudio';
        radioAudioElement.loop = true;
        radioAudioElement.volume = 0.01; // Volumen muy bajo (casi silencioso)
        
        // Audio silencioso para mantener la sesión de audio activa
        radioAudioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        
        document.body.appendChild(radioAudioElement);
    }
    
    // Reproducir audio silencioso para mantener sesión activa
    radioAudioElement.play().catch(e => console.log('Audio play error:', e));
    
    // Configurar MediaSession API para controles de audio en pantalla de bloqueo
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentStreamTitle || 'ULTRAGOL Radio',
            artist: 'Transmisión en vivo',
            album: 'ULTRAGOL',
            artwork: [
                { src: 'ultragol-logo.png', sizes: '96x96', type: 'image/png' },
                { src: 'ultragol-logo.png', sizes: '128x128', type: 'image/png' },
                { src: 'ultragol-logo.png', sizes: '192x192', type: 'image/png' },
                { src: 'ultragol-logo.png', sizes: '256x256', type: 'image/png' },
                { src: 'ultragol-logo.png', sizes: '384x384', type: 'image/png' },
                { src: 'ultragol-logo.png', sizes: '512x512', type: 'image/png' }
            ]
        });
        
        // Configurar acciones de MediaSession
        navigator.mediaSession.setActionHandler('play', () => {
            if (radioAudioElement) radioAudioElement.play();
            showToast('Modo Radio activado');
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
            deactivateRadioMode();
        });
        
        navigator.mediaSession.setActionHandler('stop', () => {
            deactivateRadioMode();
        });
        
        navigator.mediaSession.playbackState = 'playing';
    }
    
    // Prevenir que la pantalla se apague (si está disponible)
    requestWakeLock();
    
    showToast('Modo Radio activado - El audio continuará en segundo plano');
}

function deactivateRadioMode() {
    radioModeActive = false;
    
    // Restaurar botón
    const radioBtn = document.querySelector('.modal-radio-btn');
    if (radioBtn) {
        radioBtn.classList.remove('active');
        radioBtn.style.background = '';
        radioBtn.innerHTML = '<i class="fas fa-podcast"></i>';
    }
    
    // Detener audio
    if (radioAudioElement) {
        radioAudioElement.pause();
    }
    
    // Limpiar MediaSession
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
    }
    
    // Liberar wake lock
    releaseWakeLock();
    
    showToast('Modo Radio desactivado');
}

// Wake Lock API para mantener la pantalla activa (opcional)
let wakeLock = null;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock activado');
            
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock liberado');
            });
        }
    } catch (err) {
        console.log('Wake Lock no disponible:', err);
    }
}

function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}

// Re-adquirir wake lock cuando la página vuelve a ser visible
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible' && radioModeActive) {
        requestWakeLock();
    }
});

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

// ==================== FUNCIONES DE ELIMINAR CACHÉ ====================

function showClearCacheConfirmation() {
    const modal = document.getElementById('clearCacheModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeClearCacheModal() {
    const modal = document.getElementById('clearCacheModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function confirmClearCache() {
    // Cerrar el modal primero
    closeClearCacheModal();
    
    // Cerrar panel de configuración
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.classList.remove('active');
    }
    
    // Limpiar caché del navegador
    if ('caches' in window) {
        caches.keys().then(function(names) {
            for (let name of names) {
                caches.delete(name);
            }
        });
    }
    
    // Limpiar localStorage
    localStorage.clear();
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Desregistrar Service Workers
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for (let registration of registrations) {
                registration.unregister();
            }
        });
    }
    
    // Mostrar mensaje de éxito antes de recargar
    showToast('Caché eliminado correctamente. Recargando página...');
    
    // Recargar la página sin caché después de un breve delay
    setTimeout(function() {
        window.location.reload(true);
    }, 1500);
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

// Historial de búsquedas
const SEARCH_HISTORY_KEY = 'ultragol_search_history';
const MAX_HISTORY_ITEMS = 10;

function saveSearchToHistory(term) {
    if (!term || term.trim() === '') return;
    
    let history = getSearchHistory();
    
    // Remover duplicado si existe
    history = history.filter(item => item.toLowerCase() !== term.toLowerCase());
    
    // Agregar al principio
    history.unshift(term);
    
    // Mantener solo los últimos MAX_HISTORY_ITEMS
    history = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

function getSearchHistory() {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
}

function clearSearchHistory() {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    showSearchWelcome();
}

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
    const history = getSearchHistory();
    
    let historyHtml = '';
    if (history.length > 0) {
        historyHtml = `
            <div class="search-category-section">
                <div class="search-history-header">
                    <h4><i class="fas fa-clock"></i> Búsquedas Recientes</h4>
                    <button class="clear-history-btn" onclick="clearSearchHistory()" title="Limpiar historial">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="search-tags-grid">
                    ${history.map(item => `
                        <span class="search-tag-history" onclick="quickSearch('${item}')">
                            <i class="fas fa-history"></i> ${item}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    resultsContainer.innerHTML = `
        <div class="search-welcome">
            <div class="search-welcome-animation">
                <div class="search-icon-animated">
                    <i class="fas fa-search"></i>
                </div>
                <div class="search-waves">
                    <span class="wave"></span>
                    <span class="wave"></span>
                    <span class="wave"></span>
                </div>
            </div>
            <h3 class="search-welcome-title">Descubre el Mundo del Deporte</h3>
            <p class="search-welcome-subtitle">Busca entre cientos de partidos en vivo y próximos eventos</p>
            
            <div class="search-categories">
                ${historyHtml}

                <div class="search-category-section">
                    <h4><i class="fas fa-fire"></i> Populares</h4>
                    <div class="search-tags-grid">
                        <span class="search-tag-pro" onclick="quickSearch('en vivo')">
                            <i class="fas fa-circle live-dot-search"></i> En Vivo
                        </span>
                        <span class="search-tag-pro" onclick="quickSearch('Liga MX')">
                            <i class="fas fa-futbol"></i> Liga MX
                        </span>
                        <span class="search-tag-pro" onclick="quickSearch('Premier League')">
                            <i class="fas fa-crown"></i> Premier
                        </span>
                        <span class="search-tag-pro" onclick="quickSearch('Champions')">
                            <i class="fas fa-star"></i> Champions
                        </span>
                    </div>
                </div>
                
                <div class="search-category-section">
                    <h4><i class="fas fa-shield-alt"></i> Equipos Destacados</h4>
                    <div class="search-tags-grid">
                        <span class="search-tag-pro" onclick="quickSearch('América')">
                            <i class="fas fa-eagle"></i> América
                        </span>
                        <span class="search-tag-pro" onclick="quickSearch('Chivas')">
                            <i class="fas fa-heart"></i> Chivas
                        </span>
                        <span class="search-tag-pro" onclick="quickSearch('Tigres')">
                            <i class="fas fa-paw"></i> Tigres
                        </span>
                        <span class="search-tag-pro" onclick="quickSearch('Pumas')">
                            <i class="fas fa-cat"></i> Pumas
                        </span>
                        <span class="search-tag-pro" onclick="quickSearch('Cruz Azul')">
                            <i class="fas fa-bolt"></i> Cruz Azul
                        </span>
                        <span class="search-tag-pro" onclick="quickSearch('Monterrey')">
                            <i class="fas fa-mountain"></i> Monterrey
                        </span>
                    </div>
                </div>
                
                <div class="search-category-section">
                    <h4><i class="fas fa-trophy"></i> Otros Deportes</h4>
                    <div class="search-tags-grid">
                        <span class="search-tag-pro" onclick="quickSearch('UFC')">
                            <i class="fas fa-fist-raised"></i> UFC
                        </span>
                        <span class="search-tag-pro" onclick="quickSearch('NBA')">
                            <i class="fas fa-basketball-ball"></i> NBA
                        </span>
                        <span class="search-tag-pro" onclick="quickSearch('NFL')">
                            <i class="fas fa-football-ball"></i> NFL
                        </span>
                        <span class="search-tag-pro" onclick="quickSearch('Boxing')">
                            <i class="fas fa-hand-rock"></i> Box
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Variable global para guardar el filtro actual
let currentSearchFilter = 'all';

// Función para manejar el cambio de filtros
function filterSearch(filterType, element) {
    // Actualizar el filtro actual
    currentSearchFilter = filterType;
    
    // Actualizar estilos de los chips
    const allChips = document.querySelectorAll('.filter-chip');
    allChips.forEach(chip => chip.classList.remove('active'));
    element.classList.add('active');
    
    // Si hay texto en el buscador, volver a buscar con el nuevo filtro
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim() !== '') {
        performSearch(searchInput.value);
    }
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
    
    const searchTerm = normalizarNombre(query);
    const results = {
        matches: [],
        teams: [],
        leagues: [],
        importantMatches: [],
        liveMatches: []
    };
    
    // Obtener aliases del término de búsqueda
    const searchAliases = obtenerAliases(searchTerm);
    console.log(`🔍 Buscando: "${searchTerm}" → aliases: [${searchAliases.join(', ')}]`);
    
    // Función para verificar si un nombre coincide con la búsqueda (con abreviaciones)
    const coincideConBusqueda = (nombre) => {
        if (!nombre) return false;
        const nombreNormalizado = normalizarNombre(nombre);
        const aliasesNombre = obtenerAliases(nombreNormalizado);
        
        // Verificar coincidencia directa
        if (nombreNormalizado.includes(searchTerm)) return true;
        
        // Verificar coincidencia con aliases de la búsqueda
        if (searchAliases.some(alias => nombreNormalizado.includes(alias))) return true;
        
        // Verificar coincidencia con aliases del nombre
        if (aliasesNombre.some(alias => searchTerm.includes(alias) || alias.includes(searchTerm))) return true;
        
        return false;
    };
    
    // Buscar en partidos de marcadores (con abreviaciones mejoradas)
    if (marcadoresData && marcadoresData.partidos) {
        results.matches = marcadoresData.partidos.filter(partido => {
            return coincideConBusqueda(partido.local?.nombreCorto) ||
                   coincideConBusqueda(partido.visitante?.nombreCorto) ||
                   coincideConBusqueda(partido.local?.nombre) ||
                   coincideConBusqueda(partido.visitante?.nombre);
        });
        
        // Separar partidos en vivo
        results.liveMatches = results.matches.filter(p => p.estado?.enVivo);
    }
    
    // Buscar en partidos importantes (transmisiones) y combinar canales de ambas APIs
    if (transmisionesData && transmisionesData.transmisiones) {
        const matchedTransmisiones = transmisionesData.transmisiones.filter(transmision => {
            const titulo = normalizarNombre(transmision.titulo || '');
            const liga = normalizarNombre(transmision.liga || '');
            const estado = normalizarNombre(transmision.estado || '');
            const evento = normalizarNombre(transmision.evento || '');
            
            // Búsqueda directa
            if (titulo.includes(searchTerm) || evento.includes(searchTerm) || liga.includes(searchTerm)) {
                return true;
            }
            
            // Búsqueda especial para "vivo" o "en vivo"
            if ((searchTerm === 'vivo' || searchTerm === 'en vivo') && 
                (estado.includes('vivo') || estado.includes('live'))) {
                return true;
            }
            
            // Búsqueda con abreviaciones en el título/evento
            const palabrasTitulo = (titulo + ' ' + evento).split(/\s+vs?\s+|\s+-\s+/i);
            for (const palabra of palabrasTitulo) {
                if (coincideConBusqueda(palabra)) {
                    return true;
                }
            }
            
            return false;
        });
        
        // Combinar canales de las 3 APIs para cada transmisión encontrada
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
            
            // Buscar en API 3
            if (transmisionesAPI3 && transmisionesAPI3.transmisiones) {
                const transAPI3 = transmisionesAPI3.transmisiones.find(t => {
                    const evento = (t.evento || t.titulo || '').toLowerCase();
                    return evento === eventoNombre || evento.includes(eventoNombre) || eventoNombre.includes(evento);
                });
                
                if (transAPI3) {
                    // Actualizar título si es mejor que el actual
                    if (transAPI3.titulo && !tituloDisplay) {
                        tituloDisplay = transAPI3.titulo;
                    }
                    if (transAPI3.evento && !tituloDisplay) {
                        tituloDisplay = transAPI3.evento;
                    }
                    
                    if (transAPI3.canales) {
                        const canalesAPI3 = transAPI3.canales.map(canal => ({
                            ...canal,
                            fuente: 'voodc'
                        }));
                        canalesCombinados = [...canalesCombinados, ...canalesAPI3];
                    }
                }
            }
            
            // Buscar en API 4 (transmisiones4 - ftvhd)
            if (transmisionesAPI4 && transmisionesAPI4.transmisiones) {
                const transAPI4 = transmisionesAPI4.transmisiones.find(t => {
                    const evento = (t.evento || t.titulo || '').toLowerCase();
                    return evento === eventoNombre || evento.includes(eventoNombre) || eventoNombre.includes(evento);
                });
                
                if (transAPI4) {
                    // Actualizar título si es mejor que el actual
                    if (transAPI4.titulo && !tituloDisplay) {
                        tituloDisplay = transAPI4.titulo;
                    }
                    if (transAPI4.evento && !tituloDisplay) {
                        tituloDisplay = transAPI4.evento;
                    }
                    
                    if (transAPI4.canales) {
                        const canalesAPI4 = transAPI4.canales.map(canal => ({
                            ...canal,
                            fuente: 'ftvhd'
                        }));
                        canalesCombinados = [...canalesCombinados, ...canalesAPI4];
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
    
    // Buscar equipos únicos (con abreviaciones)
    if (marcadoresData && marcadoresData.partidos) {
        const teamsSet = new Set();
        marcadoresData.partidos.forEach(partido => {
            if (coincideConBusqueda(partido.local?.nombreCorto) || coincideConBusqueda(partido.local?.nombre)) {
                teamsSet.add(JSON.stringify({
                    nombre: partido.local.nombreCorto,
                    nombreCompleto: partido.local.nombre,
                    logo: partido.local.logo
                }));
            }
            if (coincideConBusqueda(partido.visitante?.nombreCorto) || coincideConBusqueda(partido.visitante?.nombre)) {
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
                <div class="no-results-suggestion-box">
                    <p class="no-results-suggestion">💡 <strong>Sugerencias de búsqueda:</strong></p>
                    <ul class="search-tips">
                        <li>Prueba usar abreviaciones: <strong>Ame</strong> (América), <strong>Tigs</strong> (Tigres), <strong>GDL</strong> (Chivas)</li>
                        <li>Busca por apodos: <strong>Rayados</strong>, <strong>Tuzos</strong>, <strong>Xolos</strong></li>
                        <li>Usa nombres completos: <strong>Club América</strong>, <strong>Monterrey</strong></li>
                        <li>Busca por estado: <strong>en vivo</strong>, <strong>upcoming</strong></li>
                    </ul>
                </div>
                <p class="no-results-suggestion">Búsquedas populares:</p>
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
                    <span class="search-tag" onclick="quickSearch('Tigres')">
                        <i class="fas fa-shield-alt"></i> Tigres
                    </span>
                    <span class="search-tag" onclick="quickSearch('Pumas')">
                        <i class="fas fa-shield-alt"></i> Pumas
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
                    <div class="search-match-status">
                        <span class="search-match-time">${partido.reloj || 'EN VIVO'}</span>
                        <span class="search-match-score-badge">${partido.local.marcador} - ${partido.visitante.marcador}</span>
                    </div>
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
            const estadoAPI = (transmision.estado || '').toLowerCase().trim();
            const isLive = estadoAPI.includes('vivo') || estadoAPI.includes('live') || estadoAPI === 'en vivo';
            const isUpcoming = estadoAPI.includes('próximo') || estadoAPI.includes('programado') || estadoAPI.includes('upcoming');
            const canalesCount = transmision.canales?.length || 0;
            const liga = transmision.liga || 'Liga MX';
            const hasChannels = canalesCount > 0;
            
            // Obtener el primer canal para mostrar
            const firstChannel = hasChannels ? transmision.canales[0].nombre : '';
            
            let statusBadgeSearch = '';
            if (isLive) {
                statusBadgeSearch = '<span class="search-badge-live"><i class="fas fa-circle"></i> EN VIVO</span>';
            } else if (isUpcoming) {
                statusBadgeSearch = '<span class="search-badge-scheduled"><i class="far fa-clock"></i> PRÓXIMO</span>';
            } else {
                statusBadgeSearch = '<span class="search-badge-scheduled"><i class="far fa-clock"></i> PRÓXIMO</span>';
            }
            
            html += `
                <div class="search-match-important-card">
                    <div class="search-match-bg"></div>
                    <div class="search-match-content">
                        <div class="search-match-badges">
                            <span class="search-badge-liga">${liga}</span>
                            ${statusBadgeSearch}
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
            const isCurrentLeague = league === currentLeague;
            html += `
                <div class="search-league-card" onclick="selectLeague('${league}'); closeSearchModal();">
                    <div class="search-league-icon ${isCurrentLeague ? 'active' : ''}">
                        <i class="fas fa-futbol"></i>
                    </div>
                    <div class="search-league-info">
                        <div class="search-league-name">${league}</div>
                        <div class="search-league-status">Disponible</div>
                    </div>
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
    
    // Buscar esta transmisión en las 3 APIs para combinar canales
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
            canalesCombinados = [...canalesCombinados, ...transAPI1.canales];
            console.log(`✅ Encontrados ${transAPI1.canales.length} canales en API 1 (rereyano)`);
        }
    }
    
    // Buscar en API 2
    if (transmisionesAPI2 && transmisionesAPI2.transmisiones) {
        const transAPI2 = transmisionesAPI2.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === eventoNombre || evento.includes(eventoNombre) || eventoNombre.includes(evento);
        });
        
        if (transAPI2 && transAPI2.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI2.canales];
            console.log(`✅ Encontrados ${transAPI2.canales.length} canales en API 2 (e1link)`);
        }
    }
    
    // Buscar en API 3
    if (transmisionesAPI3 && transmisionesAPI3.transmisiones) {
        const transAPI3 = transmisionesAPI3.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === eventoNombre || evento.includes(eventoNombre) || eventoNombre.includes(evento);
        });
        
        if (transAPI3 && transAPI3.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI3.canales];
            console.log(`✅ Encontrados ${transAPI3.canales.length} canales en API 3 (voodc)`);
        }
    }
    
    // Buscar en API 4
    if (transmisionesAPI4 && transmisionesAPI4.transmisiones) {
        const transAPI4 = transmisionesAPI4.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === eventoNombre || evento.includes(eventoNombre) || eventoNombre.includes(evento);
        });
        
        if (transAPI4 && transAPI4.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI4.canales];
            console.log(`✅ Encontrados ${transAPI4.canales.length} canales en API 4 (transmisiones4)`);
        }
    }
    
    // Buscar en API 5
    if (transmisionesAPI5 && transmisionesAPI5.transmisiones) {
        const transAPI5 = transmisionesAPI5.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === eventoNombre || evento.includes(eventoNombre) || eventoNombre.includes(evento);
        });
        
        if (transAPI5 && transAPI5.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI5.canales];
            console.log(`✅ Encontrados ${transAPI5.canales.length} canales en API 5 (donromans)`);
        }
    }

    // Buscar en API 6
    if (transmisionesAPI6 && transmisionesAPI6.transmisiones) {
        const transAPI6 = transmisionesAPI6.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === eventoNombre || evento.includes(eventoNombre) || eventoNombre.includes(evento);
        });
        
        if (transAPI6 && transAPI6.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI6.canales];
            console.log(`✅ Encontrados ${transAPI6.canales.length} canales en API 6 (local)`);
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

function selectImportantMatchByName(eventoNombre) {
    closeSearchModal();
    
    if (!transmisionesData || !transmisionesData.transmisiones) {
        showToast('No hay transmisiones disponibles');
        return;
    }
    
    const nombreBuscar = eventoNombre.toLowerCase().trim();
    
    const transmision = transmisionesData.transmisiones.find(t => {
        const eventoActual = (t.evento || t.titulo || '').toLowerCase().trim();
        return eventoActual === nombreBuscar || eventoActual.includes(nombreBuscar) || nombreBuscar.includes(eventoActual);
    });
    
    if (!transmision) {
        showToast('No se encontró la transmisión');
        return;
    }
    
    let canalesCombinados = [];
    let tituloMostrar = transmision.titulo || transmision.evento;
    
    if (transmisionesAPI1 && transmisionesAPI1.transmisiones) {
        const transAPI1 = transmisionesAPI1.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === nombreBuscar || evento.includes(nombreBuscar) || nombreBuscar.includes(evento);
        });
        
        if (transAPI1 && transAPI1.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI1.canales];
            console.log(`✅ Encontrados ${transAPI1.canales.length} canales en API 1 (rereyano)`);
        }
    }
    
    if (transmisionesAPI2 && transmisionesAPI2.transmisiones) {
        const transAPI2 = transmisionesAPI2.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === nombreBuscar || evento.includes(nombreBuscar) || nombreBuscar.includes(evento);
        });
        
        if (transAPI2 && transAPI2.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI2.canales];
            console.log(`✅ Encontrados ${transAPI2.canales.length} canales en API 2 (e1link)`);
        }
    }
    
    if (transmisionesAPI3 && transmisionesAPI3.transmisiones) {
        const transAPI3 = transmisionesAPI3.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === nombreBuscar || evento.includes(nombreBuscar) || nombreBuscar.includes(evento);
        });
        
        if (transAPI3 && transAPI3.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI3.canales];
            console.log(`✅ Encontrados ${transAPI3.canales.length} canales en API 3 (voodc)`);
        }
    }
    
    if (transmisionesAPI4 && transmisionesAPI4.transmisiones) {
        const transAPI4 = transmisionesAPI4.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === nombreBuscar || evento.includes(nombreBuscar) || nombreBuscar.includes(evento);
        });
        
        if (transAPI4 && transAPI4.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI4.canales];
            console.log(`✅ Encontrados ${transAPI4.canales.length} canales en API 4 (transmisiones4)`);
        }
    }
    
    if (transmisionesAPI5 && transmisionesAPI5.transmisiones) {
        const transAPI5 = transmisionesAPI5.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === nombreBuscar || evento.includes(nombreBuscar) || nombreBuscar.includes(evento);
        });
        
        if (transAPI5 && transAPI5.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI5.canales];
            console.log(`✅ Encontrados ${transAPI5.canales.length} canales en API 5 (donromans)`);
        }
    }
    
    if (transmisionesAPI6 && transmisionesAPI6.transmisiones) {
        const transAPI6 = transmisionesAPI6.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase();
            return evento === nombreBuscar || evento.includes(nombreBuscar) || nombreBuscar.includes(evento);
        });
        
        if (transAPI6 && transAPI6.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI6.canales];
            console.log(`✅ Encontrados ${transAPI6.canales.length} canales en API 6 (local)`);
        }
    }
    
    if (canalesCombinados.length > 0) {
        const transmisionCombinada = {
            evento: tituloMostrar,
            titulo: tituloMostrar,
            canales: canalesCombinados
        };
        
        showChannelSelector(transmisionCombinada, tituloMostrar);
    } else {
        if (transmision.canales && transmision.canales.length > 0) {
            showChannelSelector(transmision, tituloMostrar);
        } else {
            showToast('No hay canales disponibles para este partido');
        }
    }
}

// Event listener para búsqueda en tiempo real
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            const clearBtn = document.querySelector('.clear-search-btn');
            if (clearBtn) {
                clearBtn.style.display = value.length > 0 ? 'flex' : 'none';
            }
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(value);
            }, 300);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchValue = e.target.value.trim();
                if (searchValue) {
                    saveSearchToHistory(searchValue);
                }
                performSearch(searchValue);
            }
        });
        
        searchInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
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
        const response = await fetch('https://ultragol-api-3.vercel.app/videos');
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
        const leagueConfig = leaguesConfig[currentLeague];
        const endpoint = leagueConfig ? leagueConfig.tabla : '/tabla';
        const response = await fetch(`https://ultragol-api-3.vercel.app${endpoint}`);
        const data = await response.json();
        
        const standingsTable = document.getElementById('standingsTable');
        if (!standingsTable) return;
        
        if (!data.tabla || data.tabla.length === 0) {
            standingsTable.innerHTML = '<div class="standings-loading">No hay datos de tabla disponibles</div>';
            return;
        }
        
        const equipos = data.tabla.sort((a, b) => a.posicion - b.posicion);
        
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
                ${equipos.map((equipo, index) => {
                    let zoneClass = '';
                    if (index < 4) {
                        zoneClass = 'zona-calificacion-directa';
                    } else if (index < 6) {
                        zoneClass = 'zona-calificacion';
                    } else if (index < 10) {
                        zoneClass = 'zona-repechaje';
                    } else if (index < equipos.length - 3) {
                        zoneClass = 'zona-media';
                    } else {
                        zoneClass = 'zona-descenso';
                    }
                    
                    return `
                    <div class="standings-row ${zoneClass}" data-position="${index + 1}">
                        <div class="position-indicator"></div>
                        <div class="pos">
                            <span class="pos-number">${equipo.posicion}</span>
                        </div>
                        <div class="team-cell">
                            <img src="${equipo.logo || 'https://via.placeholder.com/30'}" alt="${equipo.equipo}" class="team-logo-small" onerror="this.src='https://via.placeholder.com/30'">
                            <span class="team-name-standings">${equipo.equipo}</span>
                        </div>
                        <div class="stat">${equipo.estadisticas?.pj || 0}</div>
                        <div class="stat">${equipo.estadisticas?.pg || 0}</div>
                        <div class="stat">${equipo.estadisticas?.pe || 0}</div>
                        <div class="stat">${equipo.estadisticas?.pp || 0}</div>
                        <div class="stat points">${equipo.estadisticas?.pts || 0}</div>
                    </div>
                    `;
                }).join('')}
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
        const leagueConfig = leaguesConfig[currentLeague];
        const endpoint = leagueConfig ? leagueConfig.noticias : '/noticias';
        const response = await fetch(`https://ultragol-api-3.vercel.app${endpoint}`);
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
    document.querySelectorAll('.league-btn').forEach(btn => btn.classList.remove('active'));
    
    if (element) {
        element.classList.add('active');
    } else {
        const leagueButtons = document.querySelectorAll('.league-btn');
        leagueButtons.forEach(btn => {
            const btnText = btn.querySelector('span')?.textContent || '';
            if (btnText === leagueName) {
                btn.classList.add('active');
            }
        });
    }
    
    currentLeague = leagueName;
    
    const standingsTitle = document.getElementById('standingsLeagueName');
    if (standingsTitle) {
        standingsTitle.textContent = `TABLA DE POSICIONES - ${leagueName}`;
    }
    
    loadStandings();
    loadMarcadores();
    loadLineups();
    
    showToast(`Mostrando datos de ${leagueName}`);
}

function showLockedLeagueMessage(leagueName) {
    showToast(`${leagueName} estará disponible próximamente`);
}

// Modo claro/oscuro
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const savedDarkMode = localStorage.getItem('darkMode');
    
    // Por defecto está en modo oscuro (sin clase light-mode)
    // Si el usuario desactiva "Modo oscuro", se agrega la clase light-mode
    if (savedDarkMode === 'false') {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = false;
    } else {
        // Modo oscuro activo (predeterminado)
        document.body.classList.remove('light-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                // Activar modo oscuro (quitar light-mode)
                document.body.classList.remove('light-mode');
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
                showToast('Modo oscuro activado');
            } else {
                // Activar modo claro (agregar light-mode)
                document.body.classList.add('light-mode');
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
                showToast('Modo claro activado');
            }
        });
    }
}

// Inicializar modo oscuro cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
});

// ==================== PARTIDOS IMPORTANTES MODAL ====================

let isLiveFilterActive = false;

function toggleLiveFilter() {
    isLiveFilterActive = !isLiveFilterActive;
    const btn = document.getElementById('liveFilterBtn');
    if (btn) {
        btn.classList.toggle('active', isLiveFilterActive);
    }
    renderImportantMatches();
}

function openImportantMatchesModal() {
    const modal = document.getElementById('importantMatchesModal');
    const body = document.getElementById('importantMatchesBody');
    
    // Resetear filtro al abrir
    isLiveFilterActive = false;
    const btn = document.getElementById('liveFilterBtn');
    if (btn) btn.classList.remove('active');
    
    // Resetear historial al abrir el modal de partidos importantes (es el punto de inicio)
    modalNavigation.resetHistory();
    modalNavigation.pushModal('importantMatches', {});
    
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
    // Cerrar todos los modales y resetear historial cuando se cierra con la X
    closeAllModals();
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

// Carousel state
let carouselCurrentIndex = 0;
let carouselTotalItems = 0;
let carouselTouchStartX = 0;
let carouselTouchEndX = 0;

function renderImportantMatches() {
    const body = document.getElementById('importantMatchesBody');
    
    if (!transmisionesData || !transmisionesData.transmisiones || transmisionesData.transmisiones.length === 0) {
        showNoMatchesMessage();
        return;
    }
    
    let transmisionesToRender = [...transmisionesData.transmisiones];

    if (isLiveFilterActive) {
        // Filtrar solo partidos de API 5 (donromans) que estén en vivo
        transmisionesToRender = transmisionesToRender.filter(t => {
            const isDonRomans = t.tipoAPI === 'donromans';
            const estadoAPI = (t.estado || '').toLowerCase().trim();
            const isLive = estadoAPI.includes('vivo') || estadoAPI.includes('live') || estadoAPI === 'en vivo';
            return isDonRomans && isLive;
        });
    }
    
    const transmisionesSorted = transmisionesToRender.sort((a, b) => {
        const aLive = a.estado?.toLowerCase().includes('vivo') || a.estado?.toLowerCase().includes('live');
        const bLive = b.estado?.toLowerCase().includes('vivo') || b.estado?.toLowerCase().includes('live');
        
        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;
        
        const aCanales = a.canales?.length || 0;
        const bCanales = b.canales?.length || 0;
        
        return bCanales - aCanales;
    });
    
    carouselTotalItems = transmisionesSorted.length;
    carouselCurrentIndex = 0;
    
    const cardsHTML = transmisionesSorted.map((transmision, index) => {
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
                } else if (canal.enlaces && canal.enlaces.length > 0) {
                    totalLinks += canal.enlaces.length;
                }
            });
        }
        
        const estadoAPI = (transmision.estado || '').toLowerCase().trim();
        // Forzar "EN VIVO" si es de la API donromans, ya que el usuario indica que ya lo están
        const isDonRomans = transmision.tipoAPI === 'donromans';
        const isLive = isDonRomans || estadoAPI.includes('vivo') || estadoAPI.includes('live') || estadoAPI === 'en vivo';
        const isUpcoming = !isDonRomans && (estadoAPI.includes('próximo') || estadoAPI.includes('programado') || estadoAPI.includes('upcoming'));
        const isFinished = !isDonRomans && (estadoAPI.includes('finalizado') || estadoAPI.includes('finished'));
        
        let statusBadge = '';
        if (isLive) {
            statusBadge = `<span class="status-badge status-live"><span class="live-dot"></span> EN VIVO</span>`;
        } else if (isFinished) {
            statusBadge = `<span class="status-badge status-finished"><i class="fas fa-check-circle"></i> Finalizado</span>`;
        } else if (isUpcoming) {
            statusBadge = `<span class="status-badge status-upcoming">⏰ PRÓXIMO</span>`;
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
        
        const eventoEscapado = (transmision.evento || transmision.titulo || '').replace(/'/g, "\\'");
        
        const activeClass = index === 0 ? 'active' : (index === 1 ? 'adjacent' : '');
        
        return `
            <div class="important-match-card-new ${activeClass}" data-index="${index}" onclick='selectImportantMatchByTransmision("${eventoEscapado}")'>
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
    
    // Generate indicators (max 10 visible)
    const maxIndicators = Math.min(carouselTotalItems, 10);
    const indicatorsHTML = Array.from({ length: maxIndicators }, (_, i) => 
        `<button class="carousel-indicator ${i === 0 ? 'active' : ''}" data-index="${i}" onclick="carouselGoTo(${i})"></button>`
    ).join('');
    
    body.innerHTML = `
        <div class="carousel-wrapper">
            <button class="carousel-nav prev" onclick="carouselPrev()" ${carouselCurrentIndex === 0 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
            
            <div class="carousel-container" id="carouselContainer">
                ${cardsHTML}
            </div>
            
            <button class="carousel-nav next" onclick="carouselNext()" ${carouselCurrentIndex >= carouselTotalItems - 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
            
            <div class="carousel-counter">
                <span>${carouselCurrentIndex + 1}</span> / ${carouselTotalItems}
            </div>
            
            ${carouselTotalItems > 1 ? `<div class="carousel-indicators">${indicatorsHTML}</div>` : ''}
        </div>
    `;
    
    // Initialize carousel after rendering
    initCarouselEvents();
}

function initCarouselEvents() {
    const container = document.getElementById('carouselContainer');
    if (!container) return;
    
    // Touch events for swipe
    container.addEventListener('touchstart', handleCarouselTouchStart, { passive: true });
    container.addEventListener('touchmove', handleCarouselTouchMove, { passive: true });
    container.addEventListener('touchend', handleCarouselTouchEnd);
    
    // Mouse wheel for desktop
    container.addEventListener('wheel', handleCarouselWheel, { passive: false });
    
    // Scroll event to update active card
    container.addEventListener('scroll', handleCarouselScroll);
    
    // Center first card initially
    setTimeout(() => {
        carouselGoTo(0);
    }, 100);
}

function handleCarouselTouchStart(e) {
    carouselTouchStartX = e.touches[0].clientX;
}

function handleCarouselTouchMove(e) {
    carouselTouchEndX = e.touches[0].clientX;
}

function handleCarouselTouchEnd(e) {
    const swipeThreshold = 50;
    const diff = carouselTouchStartX - carouselTouchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            carouselNext();
        } else {
            carouselPrev();
        }
    }
    
    carouselTouchStartX = 0;
    carouselTouchEndX = 0;
}

function handleCarouselWheel(e) {
    e.preventDefault();
    
    if (e.deltaX > 30 || e.deltaY > 30) {
        carouselNext();
    } else if (e.deltaX < -30 || e.deltaY < -30) {
        carouselPrev();
    }
}

function handleCarouselScroll() {
    const container = document.getElementById('carouselContainer');
    if (!container) return;
    
    const cards = container.querySelectorAll('.important-match-card-new');
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(containerCenter - cardCenter);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });
    
    if (closestIndex !== carouselCurrentIndex) {
        carouselCurrentIndex = closestIndex;
        updateCarouselActiveStates();
    }
}

function carouselNext() {
    if (carouselCurrentIndex < carouselTotalItems - 1) {
        carouselCurrentIndex++;
        carouselGoTo(carouselCurrentIndex);
    }
}

function carouselPrev() {
    if (carouselCurrentIndex > 0) {
        carouselCurrentIndex--;
        carouselGoTo(carouselCurrentIndex);
    }
}

function carouselGoTo(index) {
    const container = document.getElementById('carouselContainer');
    if (!container) return;
    
    const cards = container.querySelectorAll('.important-match-card-new');
    if (index < 0 || index >= cards.length) return;
    
    carouselCurrentIndex = index;
    
    const targetCard = cards[index];
    const containerWidth = container.offsetWidth;
    const cardWidth = targetCard.offsetWidth;
    const scrollPosition = targetCard.offsetLeft - (containerWidth / 2) + (cardWidth / 2);
    
    container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
    });
    
    updateCarouselActiveStates();
}

function updateCarouselActiveStates() {
    const container = document.getElementById('carouselContainer');
    if (!container) return;
    
    const cards = container.querySelectorAll('.important-match-card-new');
    const indicators = document.querySelectorAll('.carousel-indicator');
    const counter = document.querySelector('.carousel-counter span');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');
    
    // Update card classes
    cards.forEach((card, index) => {
        card.classList.remove('active', 'adjacent');
        
        if (index === carouselCurrentIndex) {
            card.classList.add('active');
        } else if (Math.abs(index - carouselCurrentIndex) === 1) {
            card.classList.add('adjacent');
        }
    });
    
    // Update indicators
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === carouselCurrentIndex);
    });
    
    // Update counter
    if (counter) {
        counter.textContent = carouselCurrentIndex + 1;
    }
    
    // Update navigation buttons
    if (prevBtn) {
        prevBtn.disabled = carouselCurrentIndex === 0;
    }
    if (nextBtn) {
        nextBtn.disabled = carouselCurrentIndex >= carouselTotalItems - 1;
    }
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

function selectImportantMatchByTransmision(eventoNombre) {
    if (!transmisionesData || !transmisionesData.transmisiones) {
        showToast('No se pudo encontrar la transmisión');
        return;
    }
    
    const nombreBuscar = eventoNombre.toLowerCase().trim();
    
    // Buscar la transmisión por nombre del evento
    const transmision = transmisionesData.transmisiones.find(t => {
        const evento = (t.evento || t.titulo || '').toLowerCase().trim();
        return evento === nombreBuscar;
    });
    
    if (!transmision) {
        showToast('No se encontró el partido');
        return;
    }
    
    let canalesCombinados = [];
    let tituloMostrar = transmision.titulo || transmision.evento;
    
    // Buscar en API 1 (rereyano)
    if (transmisionesAPI1 && transmisionesAPI1.transmisiones) {
        const transAPI1 = transmisionesAPI1.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase().trim();
            return evento === nombreBuscar;
        });
        
        if (transAPI1 && transAPI1.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI1.canales];
            console.log(`✅ Encontrados ${transAPI1.canales.length} canales en API 1 (rereyano) para "${tituloMostrar}"`);
        }
    }
    
    // Buscar en API 2 (e1link)
    if (transmisionesAPI2 && transmisionesAPI2.transmisiones) {
        const transAPI2 = transmisionesAPI2.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase().trim();
            return evento === nombreBuscar;
        });
        
        if (transAPI2 && transAPI2.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI2.canales];
            console.log(`✅ Encontrados ${transAPI2.canales.length} canales en API 2 (e1link) para "${tituloMostrar}"`);
        }
    }
    
    // Buscar en API 3 (voodc)
    if (transmisionesAPI3 && transmisionesAPI3.transmisiones) {
        const transAPI3 = transmisionesAPI3.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase().trim();
            return evento === nombreBuscar;
        });
        
        if (transAPI3 && transAPI3.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI3.canales];
            console.log(`✅ Encontrados ${transAPI3.canales.length} canales en API 3 (voodc) para "${tituloMostrar}"`);
        }
    }
    
    // Buscar en API 4 (transmisiones4 - ftvhd)
    if (transmisionesAPI4 && transmisionesAPI4.transmisiones) {
        const transAPI4 = transmisionesAPI4.transmisiones.find(t => {
            const evento = (t.evento || t.titulo || '').toLowerCase().trim();
            return evento === nombreBuscar;
        });
        
        if (transAPI4 && transAPI4.canales) {
            canalesCombinados = [...canalesCombinados, ...transAPI4.canales];
            console.log(`✅ Encontrados ${transAPI4.canales.length} canales en API 4 (ftvhd) para "${tituloMostrar}"`);
        }
    }
    
    if (canalesCombinados.length > 0) {
        const transmisionCombinada = {
            evento: tituloMostrar,
            titulo: tituloMostrar,
            canales: canalesCombinados
        };
        
        closeImportantMatchesModal();
        showChannelSelector(transmisionCombinada, tituloMostrar);
    } else {
        if (transmision.canales && transmision.canales.length > 0) {
            closeImportantMatchesModal();
            showChannelSelector(transmision, tituloMostrar);
        } else {
            showToast('No hay canales disponibles para este partido');
        }
    }
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
        const leagueConfig = leaguesConfig[currentLeague];
        const endpoint = leagueConfig ? leagueConfig.alineaciones : '/alineaciones';
        const response = await fetch(`https://ultragol-api-3.vercel.app${endpoint}`);
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

// Función para compartir la transmisión actual
async function shareStream() {
    if (!currentStreamUrl || !currentStreamTitle) {
        showToast('No hay transmisión activa para compartir');
        return;
    }
    
    // Crear ID corto único basado en la URL y título (hash simple)
    const hashCode = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36).substring(0, 6);
    };
    
    // Crear datos compactos
    const shortId = hashCode(currentStreamUrl + currentStreamTitle);
    
    // Guardar en localStorage para poder recuperar después
    const streamCache = JSON.parse(localStorage.getItem('streamCache') || '{}');
    streamCache[shortId] = {
        u: currentStreamUrl,
        t: currentStreamTitle,
        ts: Date.now()
    };
    // Limpiar cache viejo (más de 7 días)
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    Object.keys(streamCache).forEach(key => {
        if (streamCache[key].ts < weekAgo) delete streamCache[key];
    });
    localStorage.setItem('streamCache', JSON.stringify(streamCache));
    
    // URL mucho más corta usando el ID
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?id=${shortId}`;
    
    console.log(`🔗 URL corta generada: ${shareUrl}`);
    
    // Mensaje creativo sin duplicar el link
    const mensajesCreativos = [
        `⚽🔥 ${currentStreamTitle} | ¡No te lo pierdas EN VIVO!`,
        `🎯 ${currentStreamTitle} | ¡Transmisión en directo!`,
        `⚡ ${currentStreamTitle} | ¡Vívelo con nosotros!`,
        `🏆 ${currentStreamTitle} | ¡EN VIVO AHORA!`
    ];
    
    // Seleccionar mensaje aleatorio
    const mensajeAleatorio = mensajesCreativos[Math.floor(Math.random() * mensajesCreativos.length)];
    
    // Intentar usar la API nativa de compartir si está disponible
    if (navigator.share) {
        try {
            await navigator.share({
                title: `⚽ UltraGol - ${currentStreamTitle}`,
                text: mensajeAleatorio,
                url: shareUrl
            });
            showToast('¡Link compartido! 🎉');
        } catch (error) {
            // Si el usuario cancela, solo copiar al portapapeles
            if (error.name !== 'AbortError') {
                const mensajeCompleto = `${mensajeAleatorio}\n\n${shareUrl}`;
                copyToClipboardWithMessage(mensajeCompleto);
            }
        }
    } else {
        // Fallback: copiar al portapapeles
        const mensajeCompleto = `${mensajeAleatorio}\n\n${shareUrl}`;
        copyToClipboardWithMessage(mensajeCompleto);
    }
}

// Función auxiliar para copiar mensaje completo al portapapeles
function copyToClipboardWithMessage(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('¡Mensaje copiado al portapapeles! 📋');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// Función auxiliar para copiar al portapapeles
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('¡Link copiado al portapapeles! 📋');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// Fallback para navegadores que no soportan clipboard API
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('¡Link copiado al portapapeles! 📋');
    } catch (err) {
        showToast('No se pudo copiar el link');
    }
    
    document.body.removeChild(textArea);
}

// Función para detectar y abrir transmisión compartida
function checkSharedStream() {
    const urlParams = new URLSearchParams(window.location.search);
    const streamParam = urlParams.get('s') || urlParams.get('stream');
    const shortId = urlParams.get('id');
    const channelParam = urlParams.get('ch');
    
    console.log('🔍 checkSharedStream - ch:', channelParam ? 'SÍ' : 'NO');
    
    if (channelParam) {
        console.log('🔗 Detectado parámetro ch:', channelParam.length + ' caracteres');
        
        // Verificar que LZString esté disponible
        if (typeof LZString === 'undefined') {
            console.error('❌ LZString no está disponible, reintentando en 500ms...');
            setTimeout(() => checkSharedStream(), 500);
            return;
        }
        
        try {
            const decompressed = LZString.decompressFromEncodedURIComponent(channelParam);
            console.log('🔓 Resultado decompresión:', decompressed ? 'OK (' + decompressed.length + ' chars)' : 'FALLÓ');
            
            if (decompressed) {
                const shareData = JSON.parse(decompressed);
                console.log('✅ Canales compartidos decodificados:', shareData.t, '- Canales:', shareData.c.length);
                
                const transmision = {
                    evento: shareData.t,
                    titulo: shareData.t,
                    canales: shareData.c.map(canal => ({
                        nombre: canal[0],
                        numero: '',
                        enlaces: [{ url: canal[1], calidad: 'HD' }],
                        tipoAPI: canal[2] || 'shared'
                    }))
                };
                
                setTimeout(() => {
                    console.log('🚀 Abriendo modal de canales compartidos...');
                    showChannelSelector(transmision, shareData.t);
                    showToast('Abriendo canales compartidos... 📺');
                    
                    const cleanUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                }, 1500);
            } else {
                console.error('❌ Decompresión retornó null - datos corruptos');
                showToast('Error: Link de canales inválido');
            }
        } catch (error) {
            console.error('❌ Error al procesar canales compartidos:', error.message);
            showToast('Error: Link de canales inválido');
        }
        return;
    }
    
    // Nuevo formato: ID corto
    if (shortId) {
        try {
            const streamCache = JSON.parse(localStorage.getItem('streamCache') || '{}');
            const cached = streamCache[shortId];
            
            if (cached && cached.u && cached.t) {
                console.log('✅ Transmisión encontrada en cache:', shortId);
                
                setTimeout(() => {
                    playStreamInModal(cached.u, cached.t, false);
                    showToast('Abriendo transmisión compartida... 📺');
                    
                    // Limpiar la URL sin recargar la página
                    const cleanUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                }, 1000);
                return;
            } else {
                console.log('⚠️ Link compartido no encontrado en cache');
                showToast('Este link ya expiró o no está disponible');
            }
        } catch (error) {
            console.error('❌ Error al procesar link corto:', error);
        }
    }
    
    // Formato antiguo: parámetro comprimido
    if (streamParam) {
        try {
            let shareData;
            
            // Intentar descomprimir primero (nuevo formato comprimido)
            try {
                const decompressed = LZString.decompressFromEncodedURIComponent(streamParam);
                if (decompressed) {
                    shareData = JSON.parse(decompressed);
                    console.log('✅ URL comprimida decodificada exitosamente');
                }
            } catch (e) {
                // Si falla, intentar el formato antiguo base64 (compatibilidad)
                console.log('⚠️ Intentando formato antiguo base64...');
                shareData = JSON.parse(atob(streamParam));
            }
            
            // Soportar tanto formato nuevo {u, t} como formato viejo {url, title}
            const url = shareData.u || shareData.url;
            const title = shareData.t || shareData.title;
            
            if (url && title) {
                // Esperar un momento para que la página cargue completamente
                setTimeout(() => {
                    playStreamInModal(url, title, false);
                    showToast('Abriendo transmisión compartida... 📺');
                    
                    // Limpiar la URL sin recargar la página
                    const cleanUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                }, 1000);
            }
        } catch (error) {
            console.error('❌ Error al procesar link compartido:', error);
            showToast('Error: Link inválido o corrupto');
        }
    }
}

// Función auxiliar para mostrar notificaciones
function showToast(message) {
    // Crear elemento de toast si no existe
    let toast = document.getElementById('toast-notification');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transition: opacity 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

// Función para compartir el modal de canales
async function shareChannelModal() {
    try {
        const currentModalData = modalNavigation.getCurrent();
        
        if (!currentModalData || currentModalData.id !== 'channelSelector') {
            showToast('No hay canales para compartir');
            return;
        }
        
        const { transmision, partidoNombre } = currentModalData.data;
        const title = partidoNombre || 'UltraGol - Canales';
        
        const minimalChannels = transmision.canales.slice(0, 8).map(canal => {
            let url = '';
            if (canal.enlaces && canal.enlaces.length > 0) {
                url = canal.enlaces[0].url || canal.enlaces[0];
            } else if (canal.links) {
                url = canal.links.hoca || canal.links.caster || canal.links.wigi || '';
            }
            return [canal.nombre || 'Canal', url, canal.tipoAPI || ''];
        }).filter(c => c[1]);
        
        const shareData = { t: title, c: minimalChannels };
        const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(shareData));
        const shareUrl = `${window.location.origin}${window.location.pathname}?ch=${compressed}`;
        
        console.log('🔗 URL generada:', shareUrl.length, 'caracteres');
        
        if (navigator.share) {
            await navigator.share({
                title: `${title} - UltraGol`,
                text: `Ver ${title} en UltraGol`,
                url: shareUrl
            });
            showToast('Compartido exitosamente');
        } else {
            await navigator.clipboard.writeText(shareUrl);
            showToast('Enlace copiado al portapapeles');
        }
        
        console.log('✅ Modal de canales compartido:', title);
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error al compartir:', error);
            showToast('No se pudo compartir');
        }
    }
}

// Variables globales para el QR modal
let currentQRUrl = '';
let currentQRTitle = '';
let qrCodeInstance = null;

// Función para abrir el modal de QR
function openQRModal() {
    const modal = document.getElementById('qrModal');
    const qrContainer = document.getElementById('qrCodeContainer');
    const qrInfo = document.getElementById('qrChannelInfo');
    
    // Limpiar el contenedor anterior
    qrContainer.innerHTML = '';
    
    // Obtener la URL actual del stream o del canal seleccionado
    let urlToShare = currentStreamUrl || window.location.href;
    let titleToShare = currentStreamTitle || 'UltraGol - Transmisión en vivo';
    
    // Si hay un stream activo, crear un link compartible
    if (currentStreamUrl) {
        try {
            const shareData = {
                u: currentStreamUrl,
                t: currentStreamTitle
            };
            const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(shareData));
            urlToShare = `${window.location.origin}${window.location.pathname}?s=${compressed}`;
        } catch (error) {
            console.error('Error al crear link compartible:', error);
        }
    }
    
    // Guardar la información actual para descarga
    currentQRUrl = urlToShare;
    currentQRTitle = titleToShare;
    
    // Generar el código QR
    qrCodeInstance = new QRCode(qrContainer, {
        text: urlToShare,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Actualizar el texto informativo
    qrInfo.textContent = `${titleToShare}`;
    
    // Mostrar el modal con animación
    modal.classList.add('active');
    
    console.log('✅ QR Code generado:', urlToShare);
    showToast('Código QR generado correctamente');
}

// Función para cerrar el modal de QR
function closeQRModal() {
    const modal = document.getElementById('qrModal');
    modal.classList.remove('active');
    
    // Limpiar el QR después de cerrar
    setTimeout(() => {
        const qrContainer = document.getElementById('qrCodeContainer');
        qrContainer.innerHTML = '';
        qrCodeInstance = null;
    }, 300);
}

// Función para descargar el código QR
function downloadQRCode() {
    try {
        const qrContainer = document.getElementById('qrCodeContainer');
        const canvas = qrContainer.querySelector('canvas');
        
        if (!canvas) {
            showToast('Error: No se encontró el código QR');
            return;
        }
        
        // Crear un canvas más grande con padding y texto
        const finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');
        const padding = 40;
        const textHeight = 60;
        
        finalCanvas.width = canvas.width + (padding * 2);
        finalCanvas.height = canvas.height + (padding * 2) + textHeight;
        
        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        
        // Dibujar el QR en el centro
        ctx.drawImage(canvas, padding, padding);
        
        // Agregar texto en la parte inferior
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        // Título del canal (truncado si es muy largo)
        let title = currentQRTitle || 'UltraGol';
        if (title.length > 35) {
            title = title.substring(0, 32) + '...';
        }
        
        ctx.fillText(title, finalCanvas.width / 2, finalCanvas.height - 30);
        
        // Logo/marca
        ctx.font = '12px Arial';
        ctx.fillText('UltraGol Live Streaming', finalCanvas.width / 2, finalCanvas.height - 10);
        
        // Convertir a imagen y descargar
        finalCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            // Crear nombre de archivo seguro
            const safeName = (currentQRTitle || 'ultragol-qr')
                .replace(/[^a-z0-9]/gi, '-')
                .toLowerCase()
                .substring(0, 50);
            
            link.download = `${safeName}-qr-code.png`;
            link.href = url;
            link.click();
            
            // Limpiar
            URL.revokeObjectURL(url);
            
            showToast('Código QR descargado exitosamente');
            console.log('✅ QR Code descargado:', link.download);
        }, 'image/png');
        
    } catch (error) {
        console.error('Error al descargar QR:', error);
        showToast('Error al descargar el código QR');
    }
}


// ==================== FUNCIONES DE RACHA ====================

function initializeStreak() {
    const saved = localStorage.getItem('ultragolStreak');
    if (saved) {
        streakData = JSON.parse(saved);
    } else {
        streakData = {
            startDate: new Date().toISOString().split('T')[0],
            currentStreak: 1,
            lastVisitDate: new Date().toISOString().split('T')[0],
            claimedRewards: []
        };
        saveStreak();
    }
    
    // Verificar si pasó un día desde la última visita
    const today = new Date().toISOString().split('T')[0];
    if (streakData.lastVisitDate !== today) {
        const lastDate = new Date(streakData.lastVisitDate);
        const currentDate = new Date(today);
        const diffTime = currentDate - lastDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            streakData.currentStreak += 1;
        } else if (diffDays > 1) {
            streakData.currentStreak = 1;
            streakData.startDate = today;
        }
        
        streakData.lastVisitDate = today;
        saveStreak();
    }
    
    updateStreakUI();
    checkStreakRewards();
}

function saveStreak() {
    localStorage.setItem('ultragolStreak', JSON.stringify(streakData));
}

function updateStreakUI() {
    const streakDaysEl = document.getElementById('streakDays');
    if (streakDaysEl) {
        streakDaysEl.textContent = streakData.currentStreak;
    }
    
    const progressBar = document.getElementById('streakProgressBar');
    if (progressBar) {
        const percentage = Math.min((streakData.currentStreak % 30) / 30 * 100, 100);
        progressBar.style.width = percentage + '%';
    }
}

function checkStreakRewards() {
    const rewardsDiv = document.getElementById('streakRewardsContent');
    if (!rewardsDiv) return;
    
    const rewards = [
        { days: 7, label: 'Semana', reward: generatePromoCode('SEMANA7') },
        { days: 14, label: '2 Sem', reward: generatePromoCode('SEMANA14') },
        { days: 30, label: 'Mes', reward: generatePromoCode('MES1') },
        { days: 60, label: '2 Meses', reward: generatePromoCode('MES2') },
        { days: 90, label: '3 Meses', reward: generatePromoCode('MES3') },
        { days: 180, label: '6 Meses', reward: generatePromoCode('MES6') }
    ];
    
    let rewardsHTML = '<div class="rewards-grid">';
    rewards.forEach(r => {
        const isEarned = streakData.currentStreak >= r.days;
        const isClaimed = streakData.claimedRewards.includes(r.days);
        let classStatus = isClaimed ? 'claimed' : (isEarned ? 'earned' : '');
        
        rewardsHTML += `
            <div class="reward-mini ${classStatus}">
                <div class="reward-mini-icon">${isClaimed ? '✓' : (isEarned ? '🎁' : '🔒')}</div>
                <div class="reward-mini-label">${r.label}</div>
                ${isEarned && !isClaimed ? `
                    <button class="reward-mini-btn" onclick="claimReward(${r.days}, '${r.reward}')">
                        Reclamar
                    </button>
                ` : ''}
                ${isClaimed ? `<div class="reward-check">✓</div>` : ''}
            </div>
        `;
    });
    rewardsHTML += '</div>';
    
    rewardsDiv.innerHTML = rewardsHTML;
}

function toggleStreakRewards() {
    const rewardsDiv = document.getElementById('streakRewardsContent');
    const toggle = document.querySelector('.streak-toggle');
    if (rewardsDiv) {
        rewardsDiv.classList.toggle('active');
        toggle.classList.toggle('active');
    }
}

function generatePromoCode(prefix) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix + '_';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function claimReward(days, code) {
    if (!streakData.claimedRewards.includes(days)) {
        streakData.claimedRewards.push(days);
        saveStreak();
        
        const input = document.getElementById('promoCodeInput');
        if (input) {
            input.value = code;
        }
        
        alert(`¡Código promocional desbloqueado!\n\n${code}\n\nSe ha copiado en el campo de código promocional.`);
        checkStreakRewards();
    }
}

