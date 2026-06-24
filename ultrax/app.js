const _isDev = location.hostname.includes('localhost') || location.hostname.includes('replit.dev') || location.hostname.includes('127.0.0.1');
const _log = _isDev ? console.log.bind(console) : () => {};

function decodeStreamUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('http')) return url;
    try { return atob(url); } catch(e) { return url; }
}

let currentStreamUrl = '';
let currentStreamTitle = '';
let currentChannelsList = [];
let currentActiveServerIdx = 0;
let currentTransmisionRef = null;
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
let transmisionesAPI7 = null;
let transmisionesAPI8 = null;
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

const API_BASE = 'https://ultrago-xi.vercel.app';

// Función para hacer fetch con timeout
async function fetchWithTimeout(url, timeout = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

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
    // ── Liga MX ──────────────────────────────────────────────────────────────
    'uanl':       ['tigres', 'tigres uanl', 'uanl', 'tigs'],
    'tigres':     ['tigres', 'tigres uanl', 'uanl', 'tigs'],
    'america':    ['america', 'club america', 'las aguilas', 'ame'],
    'chivas':     ['chivas', 'guadalajara', 'cd guadalajara', 'gdl', 'rebano'],
    'guadalajara':['chivas', 'guadalajara', 'cd guadalajara', 'gdl', 'rebano'],
    'cruz azul':  ['cruz azul', 'la maquina', 'azul', 'caz', 'crz', 'cru'],
    'caz':        ['cruz azul', 'la maquina', 'azul', 'caz', 'crz', 'cru'],
    'pumas':      ['pumas', 'pumas unam', 'unam', 'felinos', 'pum', 'umas'],
    'monterrey':  ['monterrey', 'rayados', 'cf monterrey', 'mty', 'rayos', 'mon', 'mty'],
    'santos':     ['santos', 'santos laguna', 'guerreros', 'san', 'lag'],
    'toluca':     ['toluca', 'diablos rojos', 'diablos', 'tol'],
    'leon':       ['leon', 'club leon', 'la fiera', 'esmeraldas', 'leo', 'clb'],
    'atlas':      ['atlas', 'fc atlas', 'rojinegros', 'atl', 'atlatl'],
    'pachuca':    ['pachuca', 'tuzos', 'pach', 'pac'],
    'tijuana':    ['tijuana', 'xolos', 'club tijuana', 'tj', 'tij', 'xol'],
    'puebla':     ['puebla', 'club puebla', 'la franja', 'pue'],
    'queretaro':  ['queretaro', 'gallos blancos', 'gallos', 'qro', 'que'],
    'necaxa':     ['necaxa', 'rayos del necaxa', 'nec'],
    'mazatlan':   ['mazatlan', 'mazatlan fc', 'mzt', 'maz'],
    'juarez':     ['juarez', 'fc juarez', 'bravos', 'jua', 'bra'],
    'san luis':   ['san luis', 'atletico de san luis', 'atl san luis', 'asl', 'tuneros', 'asl'],
    'asl':        ['san luis', 'atletico de san luis', 'atl san luis', 'asl', 'tuneros'],
    'gdl':        ['chivas', 'guadalajara', 'cd guadalajara', 'rebano'],
    'mty':        ['monterrey', 'rayados', 'cf monterrey'],
    'chv':        ['chivas', 'guadalajara', 'cd guadalajara', 'rebano'],
    'tig':        ['tigres', 'tigres uanl', 'uanl', 'tigs'],
    'ame':        ['america', 'club america', 'las aguilas', 'ame'],
    // ── MLS / CONCACAF ───────────────────────────────────────────────────────
    'lafc':            ['lafc', 'los angeles fc', 'la fc', 'angeles fc'],
    'los angeles fc':  ['lafc', 'los angeles fc', 'la fc', 'angeles fc'],
    'la galaxy':       ['la galaxy', 'galaxy', 'los angeles galaxy', 'lag'],
    'inter miami':     ['inter miami', 'miami', 'inter miami cf', 'imcf'],
    'miami':           ['inter miami', 'miami', 'inter miami cf'],
    'nycfc':           ['nycfc', 'new york city fc', 'new york city'],
    'red bulls':       ['red bulls', 'new york red bulls', 'nyrb'],
    'seattle':         ['seattle', 'seattle sounders', 'sounders'],
    'portland':        ['portland', 'portland timbers', 'timbers'],
    'atlanta':         ['atlanta', 'atlanta united'],
    'toronto':         ['toronto', 'toronto fc'],
    'cf montreal':     ['cf montreal', 'montreal', 'impact'],
    'vancouver':       ['vancouver', 'vancouver whitecaps', 'whitecaps'],
    // ── Europa ───────────────────────────────────────────────────────────────
    'real madrid':     ['real madrid', 'madrid', 'merengues'],
    'barcelona':       ['barcelona', 'barca', 'barça', 'blaugrana'],
    'atletico madrid': ['atletico madrid', 'atletico', 'atleti', 'colchoneros'],
    'atletico':        ['atletico madrid', 'atletico', 'atleti', 'colchoneros'],
    'psg':             ['psg', 'paris saint-germain', 'paris saint germain', 'paris sg', 'paris'],
    'paris saint-germain': ['psg', 'paris saint-germain', 'paris sg', 'paris'],
    'man city':        ['manchester city', 'man city', 'city', 'citizens'],
    'manchester city': ['manchester city', 'man city', 'city', 'citizens'],
    'man utd':         ['manchester united', 'man utd', 'man united', 'united', 'mufc'],
    'manchester united':['manchester united', 'man utd', 'man united', 'mufc'],
    'liverpool':       ['liverpool', 'lfc', 'reds', 'the reds'],
    'arsenal':         ['arsenal', 'gunners', 'afc'],
    'chelsea':         ['chelsea', 'blues', 'cfc'],
    'tottenham':       ['tottenham', 'spurs', 'thfc'],
    'spurs':           ['tottenham', 'spurs', 'thfc'],
    'bayern':          ['bayern munich', 'bayern', 'fcb', 'munich'],
    'bayern munich':   ['bayern munich', 'bayern', 'fcb', 'munich'],
    'dortmund':        ['borussia dortmund', 'dortmund', 'bvb'],
    'bvb':             ['borussia dortmund', 'dortmund', 'bvb'],
    'juventus':        ['juventus', 'juve', 'bianconeri'],
    'juve':            ['juventus', 'juve', 'bianconeri'],
    'inter milan':     ['inter milan', 'inter', 'internazionale', 'nerazzurri'],
    'inter':           ['inter milan', 'inter', 'internazionale'],
    'ac milan':        ['ac milan', 'milan', 'rossoneri'],
    'milan':           ['ac milan', 'milan', 'rossoneri'],
    'roma':            ['as roma', 'roma'],
    'napoli':          ['napoli', 'ssc napoli', 'partenopei'],
    'ajax':            ['ajax', 'afc ajax'],
    'benfica':         ['benfica', 'slb', 'encarnados'],
    'porto':           ['porto', 'fc porto', 'dragoes'],
    'sevilla':         ['sevilla', 'sfc'],
    'valencia':        ['valencia', 'vcf', 'che'],
    // ── Selecciones nacionales (Mundial 2026 — inglés ↔ español) ─────────────
    'south africa':    ['south africa', 'sudafrica', 'sudáfrica', 'bafana bafana'],
    'sudafrica':       ['south africa', 'sudafrica', 'sudáfrica', 'bafana bafana'],
    'korea republic':  ['korea republic', 'corea del sur', 'south korea', 'corea', 'korea', 'kor'],
    'corea del sur':   ['korea republic', 'corea del sur', 'south korea', 'corea', 'korea'],
    'czech republic':  ['czech republic', 'czechia', 'chequia', 'republica checa', 'cze'],
    'czechia':         ['czech republic', 'czechia', 'chequia', 'republica checa'],
    'chequia':         ['czech republic', 'czechia', 'chequia', 'republica checa'],
    'united states':   ['united states', 'usa', 'estados unidos', 'usmnt', 'us'],
    'estados unidos':  ['united states', 'usa', 'estados unidos', 'usmnt'],
    'ivory coast':     ['ivory coast', 'cote d\'ivoire', 'costa de marfil', 'marfil'],
    'costa de marfil': ['ivory coast', 'cote d\'ivoire', 'costa de marfil'],
    'saudi arabia':    ['saudi arabia', 'arabia saudita', 'arabia saudi', 'ksa'],
    'arabia saudita':  ['saudi arabia', 'arabia saudita', 'arabia saudi'],
    'new zealand':     ['new zealand', 'nueva zelanda', 'nueva zelandia', 'all whites'],
    'nueva zelanda':   ['new zealand', 'nueva zelanda', 'nueva zelandia'],
    'republic of ireland': ['republic of ireland', 'ireland', 'irlanda', 'roi'],
    'irlanda':         ['republic of ireland', 'ireland', 'irlanda'],
    'northern ireland':['northern ireland', 'irlanda del norte'],
    'iran':            ['iran', 'irán', 'team melli'],
    'cameroon':        ['cameroon', 'camerun', 'camerún', 'lions indomables'],
    'camerun':         ['cameroon', 'camerun', 'camerún'],
    'senegal':         ['senegal', 'lions de la teranga', 'lions'],
    'ghana':           ['ghana', 'black stars'],
    'egypt':           ['egypt', 'egipto', 'pharaohs'],
    'egipto':          ['egypt', 'egipto'],
    'nigeria':         ['nigeria', 'super eagles'],
    'morocco':         ['morocco', 'marruecos', 'atlas lions'],
    'marruecos':       ['morocco', 'marruecos'],
    'algeria':         ['algeria', 'argelia', 'fennec foxes'],
    'argelia':         ['algeria', 'argelia'],
    'uruguay':         ['uruguay', 'celeste', 'uru'],
    'colombia':        ['colombia', 'los cafeteros', 'col'],
    'venezuela':       ['venezuela', 'vinotinto', 'ven'],
    'ecuador':         ['ecuador', 'la tri', 'ecu'],
    'paraguay':        ['paraguay', 'albirroja', 'par'],
    'bolivia':         ['bolivia', 'verde', 'bol'],
    'chile':           ['chile', 'la roja', 'chi'],
    'peru':            ['peru', 'perú', 'la blanquirroja', 'per'],
    'germany':         ['germany', 'alemania', 'deutschland', 'ger', 'die mannschaft'],
    'alemania':        ['germany', 'alemania', 'deutschland', 'mannschaft'],
    'france':          ['france', 'francia', 'les bleus', 'fra'],
    'francia':         ['france', 'francia', 'les bleus'],
    'england':         ['england', 'inglaterra', 'three lions', 'eng'],
    'inglaterra':      ['england', 'inglaterra', 'three lions'],
    'spain':           ['spain', 'espana', 'españa', 'la roja', 'esp'],
    'espana':          ['spain', 'espana', 'españa'],
    'portugal':        ['portugal', 'selecao', 'seleção', 'por'],
    'netherlands':     ['netherlands', 'holland', 'holanda', 'países bajos', 'paises bajos', 'ned', 'oranje'],
    'holanda':         ['netherlands', 'holland', 'holanda', 'países bajos'],
    'belgium':         ['belgium', 'belgica', 'bélgica', 'red devils', 'bel'],
    'belgica':         ['belgium', 'belgica', 'bélgica'],
    'croatia':         ['croatia', 'croacia', 'vatreni', 'cro'],
    'croacia':         ['croatia', 'croacia'],
    'denmark':         ['denmark', 'dinamarca', 'den'],
    'dinamarca':       ['denmark', 'dinamarca'],
    'switzerland':     ['switzerland', 'suiza', 'sui'],
    'suiza':           ['switzerland', 'suiza'],
    'austria':         ['austria', 'aut'],
    'poland':          ['poland', 'polonia', 'pol'],
    'polonia':         ['poland', 'polonia'],
    'serbia':          ['serbia', 'srb'],
    'turkey':          ['turkey', 'turquia', 'turquía', 'tur'],
    'turquia':         ['turkey', 'turquia', 'turquía'],
    'ukraine':         ['ukraine', 'ucrania', 'ukr'],
    'ucrania':         ['ukraine', 'ucrania'],
    'hungary':         ['hungary', 'hungria', 'hungría', 'hun'],
    'hungria':         ['hungary', 'hungria'],
    'scotland':        ['scotland', 'escocia', 'sco'],
    'escocia':         ['scotland', 'escocia'],
    'wales':           ['wales', 'gales', 'wal'],
    'gales':           ['wales', 'gales'],
    'japan':           ['japan', 'japon', 'japón', 'samurai blue', 'jpn'],
    'japon':           ['japan', 'japon', 'japón'],
    'australia':       ['australia', 'socceroos', 'aus'],
    'china':           ['china', 'china pr', 'chn'],
    'indonesia':       ['indonesia', 'garuda', 'idn'],
    'iraq':            ['iraq', 'irak', 'irq'],
    'jordan':          ['jordan', 'jordania', 'jor'],
    'uzbekistan':      ['uzbekistan', 'uzbekistan', 'uzb'],
    'congo':           ['congo', 'dr congo', 'republica democratica del congo', 'rdc'],
    'tanzania':        ['tanzania', 'taifa stars'],
    'zambia':          ['zambia', 'chipolopolo'],
    'canada':          ['canada', 'canadá', 'can'],
    'costa rica':      ['costa rica', 'los ticos', 'ticos', 'crc'],
    'panama':          ['panama', 'panamá', 'pan'],
    'honduras':        ['honduras', 'catrachos', 'hon'],
    'el salvador':     ['el salvador', 'cuscatlecos', 'slv'],
    'jamaica':         ['jamaica', 'reggae boyz', 'jam'],
    'haiti':           ['haiti', 'haití', 'hai'],
    'cuba':            ['cuba', 'cub'],
    'trinidad':        ['trinidad', 'trinidad and tobago', 'trinidad tobago', 'tri'],
};

// ─── Matching inteligente de eventos por equipos ──────────────────────────────
// Extrae [equipo1, equipo2] de "Toluca vs LAFC", "Chivas x America", etc.
function _equiposDeEvento(titulo) {
    const norm = normalizarNombre(titulo || '');
    const partes = norm.split(/\s+(?:vs?\.?|×|x|-)\s+/i);
    if (partes.length >= 2) return [partes[0].trim(), partes[1].trim()];
    return [norm, ''];
}

// Comprueba si un candidato (título de otra API) cubre el mismo partido.
// Estrategia: coincidencia literal primero, luego por aliases de equipos en cualquier orden.
function _matchesEvento(eventoRef, eventoCandidate) {
    const ref  = normalizarNombre(eventoRef || '');
    const cand = normalizarNombre(eventoCandidate || '');
    if (!ref || !cand) return false;

    // 1. Coincidencia literal (comportamiento original)
    if (cand === ref || cand.includes(ref) || ref.includes(cand)) return true;

    // 2. Extraer equipos del título de referencia y buscar ambos en el candidato
    const [tA, tB] = _equiposDeEvento(ref);
    if (!tA || !tB) return false;

    const aliasA = obtenerAliases(tA);
    const aliasB = obtenerAliases(tB);

    const inCand = (aliases) => aliases.some(a => a.length >= 3 && cand.includes(a));
    return inCand(aliasA) && inCand(aliasB);
}

// También acepta equipo1/equipo2 del objeto transmisión como señal adicional
function _matchesTransmision(eventoRef, t) {
    const titulo = t.evento || t.titulo || '';
    if (_matchesEvento(eventoRef, titulo)) return true;
    if (t.equipo1 && t.equipo2) {
        if (_matchesEvento(eventoRef, `${t.equipo1} vs ${t.equipo2}`)) return true;
    }
    return false;
}

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
        // Coincidencia exacta con la clave o con algún alias
        if (normalizado === clave || aliases.includes(normalizado)) {
            return aliases;
        }
        // Coincidencia parcial solo si la clave/alias tiene 5+ caracteres (evitar "ca","ame" en otras palabras)
        if (clave.length >= 5 && normalizado.includes(clave)) return aliases;
        if (aliases.some(alias => alias.length >= 5 && normalizado.includes(alias))) return aliases;
    }
    
    return [normalizado];
};

// Sistema de navegación con historial de modales
let modalHistory = [];

// Utilidades de navegación de modales
const modalNavigation = {
    resetHistory() {
        modalHistory = [];
        _log('📋 Historial de modales reseteado');
    },
    
    pushModal(modalId, data = {}) {
        modalHistory.push({ id: modalId, data: data });
        _log(`📌 Modal añadido al historial: ${modalId}`, modalHistory);
    },
    
    popModal() {
        const popped = modalHistory.pop();
        _log(`📤 Modal removido del historial: ${popped?.id}`, modalHistory);
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
    _log('📱 ULTRAGOL iniciando... URL:', window.location.href);
    _log('🔗 Query params:', window.location.search);
    
    // Iniciar reloj en tiempo real
    startRealTimeClock();
    
    // Iniciar contador de usuarios reales
    startOnlineCounter();
    
    // Verificar inmediatamente si hay link compartido
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('ch')) {
        _log('⚡ Link compartido detectado, procesando primero...');
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
    setInterval(updateClock, 60000);
}

// Función para el contador de usuarios reales usando Firebase Realtime Database
function startOnlineCounter() {
    const counterElement = document.getElementById('onlineCountText');
    if (!counterElement) return;

    function initFirebaseCounter() {
        try {
            import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js").then((rtdbModule) => {
                const { getDatabase, ref, onValue, set, onDisconnect, push, serverTimestamp } = rtdbModule;

                const db = getDatabase();

                // Detectar conexión real con Firebase usando .info/connected
                const connectedRef = ref(db, '.info/connected');
                let myUserRef = null;

                onValue(connectedRef, (snap) => {
                    if (snap.val() === true) {
                        // Conectado — registrar presencia en online_users/
                        myUserRef = push(ref(db, 'online_users'));
                        set(myUserRef, { ts: serverTimestamp() });
                        // Al cerrar pestaña o perder conexión, se borra automáticamente
                        onDisconnect(myUserRef).remove();
                        _log('🟢 Presencia registrada en Firebase');
                    }
                });

                // Escuchar online_users/ y contar cuántos hijos hay
                const onlineUsersRef = ref(db, 'online_users');
                onValue(onlineUsersRef, (snapshot) => {
                    const count = snapshot.size || 0;
                    counterElement.textContent = `${count.toLocaleString()} ONLINE`;
                    _log('📊 Usuarios conectados (Firebase):', count);
                }, (error) => {
                    _log('Error leyendo online_users:', error);
                    counterElement.textContent = 'ONLINE';
                });

            }).catch(err => {
                _log('Error cargando Firebase RTDB module:', err);
                counterElement.textContent = 'CONECTADO';
            });
        } catch (e) {
            _log('Error general en contador:', e);
        }
    }

    if (document.readyState === 'complete') {
        initFirebaseCounter();
    } else {
        window.addEventListener('load', initFirebaseCounter);
    }
}

// Función principal para cargar marcadores desde la API
async function loadMarcadores() {
    try {
        const leagueConfig = leaguesConfig[currentLeague];
        const endpoint = leagueConfig ? leagueConfig.marcadores : '/marcadores';
        
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();
        marcadoresData = data;
        
        _log('✅ Marcadores cargados:', endpoint);
        
        updateFeaturedMatch(data);
        
        if (activeTab === 'live') {
            updateLiveMatches(data);
        } else if (activeTab === 'upcoming') {
            updateUpcomingMatches(data);
        }
        
        return data;
    } catch (error) {
        _log('❌ Error cargando marcadores:', error);
        return null;
    }
}


// Función para cargar transmisiones desde las 7 APIs
async function loadTransmisiones() {
    try {
        // Cargar las 7 APIs en paralelo con manejo individual de errores y timeouts
        const [data1, data2, data3, data4, data5, data6, data7, data8] = await Promise.all([
            fetchWithTimeout(`/api/ultragol/transmisiones1`, 8000)
                .then(res => res.json())
                .catch(err => {
                    _log('⚠️ Error cargando API 1 (rereyano):', err.message);
                    return { transmisiones: [] };
                }),
            fetchWithTimeout(`${API_BASE}/gol-3`, 8000)
                .then(res => res.json())
                .catch(err => {
                    _log('⚠️ Error cargando API 2 (e1link):', err.message);
                    return { transmisiones: [] };
                }),
            fetchWithTimeout(`${API_BASE}/gol-2`, 8000)
                .then(res => res.json())
                .catch(err => {
                    _log('⚠️ Error cargando API 3 (voodc):', err.message);
                    return { transmisiones: [] };
                }),
            fetchWithTimeout(`${API_BASE}/gol-4`, 8000)
                .then(res => res.json())
                .catch(err => {
                    _log('⚠️ Error cargando API 4 (gol-4):', err.message);
                    return { transmisiones: [] };
                }),
            fetchWithTimeout(`${API_BASE}/gol-5`, 8000)
                .then(res => res.json())
                .catch(err => {
                    _log('⚠️ Error cargando API 5 (donromans):', err.message);
                    return { matches: [] };
                }),
            fetchWithTimeout(`${API_BASE}/gol-6`, 8000)
                .then(res => res.json())
                .catch(err => {
                    _log('⚠️ Error cargando API 6 (external):', err.message);
                    return { transmisiones: [] };
                }),
            fetchWithTimeout(`${API_BASE}/gol-7`, 8000)
                .then(res => res.json())
                .catch(err => {
                    _log('⚠️ Error cargando API 7 (gol-7):', err.message);
                    return { transmisiones: [] };
                }),
            fetchWithTimeout(`${API_BASE}/gol-8`, 8000)
                .then(res => res.json())
                .catch(err => {
                    _log('⚠️ Error cargando API 8 (gol-8):', err.message);
                    return { transmisiones: [] };
                })
        ]);
        
        // Convertir API 2 (transmisiones3 - e1link) que usa "enlacesDetalle" → un canal por enlace
        const transmisionesNormalizadasAPI2 = (data2.transmisiones || []).map(t => {
            const detalles = t.enlacesDetalle || t.enlaces || [];
            const canalesNormalizados = detalles
                .filter(e => e && e.url)
                .map(e => ({
                    numero: '',
                    nombre: e.nombre || 'Canal',
                    url: decodeStreamUrl(e.url),
                    tipoAPI: 'e1link'
                }));

            return {
                ...t,
                evento: t.titulo || t.evento,
                titulo: t.titulo || t.evento,
                canales: canalesNormalizados,
                tipoAPI: 'e1link'
            };
        });
        
        // Convertir API 3 (transmisiones2 - voodc) que usa "url" directamente a "canales"
        const transmisionesNormalizadasAPI3 = (data3.transmisiones || []).map(t => {
            const canalesNormalizados = [{
                numero: '',
                nombre: t.deporte || 'Canal',
                enlaces: t.url ? [{ url: decodeStreamUrl(t.url), calidad: 'HD' }] : [],
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
                enlaces: canal.url ? [{ url: decodeStreamUrl(canal.url), calidad: 'HD' }] : [],
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
                                        url: decodeStreamUrl(stream.match_url),
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
        
        // Marcar transmisiones API 1 con su tipo — expandir principal/backup/wrapper como canales separados
        const transmisionesAPI1Marcadas = (data1.transmisiones || []).map(t => {
            const canalesExpand = [];
            (t.canales || []).forEach(c => {
                if (c.links) {
                    if (c.links.principal) canalesExpand.push({ ...c, nombre: c.nombre || 'Canal', url: decodeStreamUrl(c.links.principal), tipoAPI: 'rereyano' });
                    if (c.links.backup)    canalesExpand.push({ ...c, nombre: `${c.nombre || 'Canal'} OP2`, url: decodeStreamUrl(c.links.backup), tipoAPI: 'rereyano' });
                    if (c.links.wrapper)   canalesExpand.push({ ...c, nombre: `${c.nombre || 'Canal'} OP3`, url: decodeStreamUrl(c.links.wrapper), tipoAPI: 'rereyano' });
                } else {
                    const streamUrl = c.embed || c.url;
                    if (streamUrl) canalesExpand.push({ ...c, url: decodeStreamUrl(streamUrl), tipoAPI: 'rereyano' });
                }
            });
            return { ...t, tipoAPI: 'rereyano', canales: canalesExpand };
        });
        
        // Normalizar transmisiones API 6 (streamed.pk usa "fuentes", JSON local usa "canales")
        const transmisionesAPI6Marcadas = (data6.transmisiones || []).map(t => {
            let canalesNormalizados = [];

            if (t.canales && t.canales.length > 0) {
                // Formato JSON local: ya tiene canales
                canalesNormalizados = t.canales.map(c => ({ ...c, url: decodeStreamUrl(c.url), tipoAPI: 'transmisiones6' }));
            } else if (t.fuentes && t.fuentes.length > 0) {
                // Formato API externa (streamed.pk): usa "fuentes" → convertir a canales
                canalesNormalizados = t.fuentes.map(f => ({
                    numero: '',
                    nombre: f.fuente || 'Canal',
                    enlaces: f.url ? [{ url: decodeStreamUrl(f.url), calidad: 'HD' }] : [],
                    tipoAPI: 'transmisiones6'
                }));
            }

            return {
                ...t,
                tipoAPI: 'transmisiones6',
                canales: canalesNormalizados
            };
        });

        // Normalizar transmisiones API 7 (misma estructura que transmisiones4: canales con url directo)
        const transmisionesNormalizadasAPI7 = (data7.transmisiones || []).map(t => {
            const canalesNormalizados = (t.canales || []).map(canal => ({
                numero: '',
                nombre: canal.nombre || 'Canal',
                enlaces: canal.url ? [{ url: decodeStreamUrl(canal.url), calidad: 'HD' }] : [],
                tipoAPI: 'transmisiones7'
            }));

            return {
                ...t,
                evento: t.evento || t.titulo,
                titulo: t.titulo || t.evento,
                canales: canalesNormalizados,
                tipoAPI: 'transmisiones7'
            };
        });

        // Normalizar transmisiones API 8 (misma estructura que transmisiones7)
        const transmisionesNormalizadasAPI8 = (data8.transmisiones || []).map(t => {
            const canalesNormalizados = (t.canales || []).map(canal => ({
                numero: '',
                nombre: canal.nombre || 'Canal',
                enlaces: canal.url ? [{ url: decodeStreamUrl(canal.url), calidad: 'HD' }] : [],
                tipoAPI: 'transmisiones8'
            }));

            return {
                ...t,
                evento: t.evento || t.titulo,
                titulo: t.titulo || t.evento,
                canales: canalesNormalizados,
                tipoAPI: 'transmisiones8'
            };
        });
        
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
        transmisionesAPI7 = {
            ...data7,
            transmisiones: transmisionesNormalizadasAPI7
        };
        transmisionesAPI8 = {
            ...data8,
            transmisiones: transmisionesNormalizadasAPI8
        };
        
        // Combinar las transmisiones de las 8 APIs (partidos pueden repetirse)
        const transmisionesCombinadas = [
            ...transmisionesAPI1Marcadas,
            ...transmisionesNormalizadasAPI2,
            ...transmisionesNormalizadasAPI3,
            ...transmisionesNormalizadasAPI4,
            ...transmisionesNormalizadasAPI5,
            ...transmisionesAPI6Marcadas,
            ...transmisionesNormalizadasAPI7,
            ...transmisionesNormalizadasAPI8
        ];
        
        // Crear el objeto combinado
        transmisionesData = {
            transmisiones: transmisionesCombinadas
        };
        
        _log('✅ Transmisiones cargadas desde API 1 (rereyano):', data1.transmisiones?.length || 0);
        _log('✅ Transmisiones cargadas desde API 2 (e1link):', data2.transmisiones?.length || 0);
        _log('✅ Transmisiones cargadas desde API 3 (voodc):', data3.transmisiones?.length || 0);
        _log('✅ Transmisiones cargadas desde API 4 (transmisiones4):', data4.transmisiones?.length || 0);
        _log('✅ Transmisiones cargadas desde API 5 (donromans):', data5.matches?.length || 0);
        _log('✅ Transmisiones cargadas desde API 6 (external):', data6.transmisiones?.length || 0);
        _log('✅ Transmisiones cargadas desde API 7 (transmisiones7):', data7.transmisiones?.length || 0);
        _log('✅ Transmisiones cargadas desde API 8 (transmisiones8):', data8.transmisiones?.length || 0);
        
        // Log detallado de API 5 para debugging
        const totalCanalesAPI5 = transmisionesNormalizadasAPI5.reduce((sum, t) => sum + (t.canales?.length || 0), 0);
        _log(`✅ Total canales en API 5 (donromans): ${totalCanalesAPI5}`);
        if (totalCanalesAPI5 === 0 && data5.matches?.length > 0) {
            _log('⚠️ API 5 tiene matches pero sin canales procesados. Estructura:', data5.matches[0]);
        }
        
        _log('✅ Total transmisiones combinadas:', transmisionesCombinadas.length);
        
        return transmisionesData;
    } catch (error) {
        _log('❌ Error cargando transmisiones:', error);
        // Retornar objeto vacío en lugar de null para evitar errores
        transmisionesData = { transmisiones: [] };
        return transmisionesData;
    }
}

// ─── FEATURED MATCH PRO v2 ───────────────────────────────────────────────────
const _fmpPrevScores = {};
let _fmpAutoTimer = null;
let _fmpProgressTimer = null;
let _fmpProgressStart = null;
const FMP_AUTO_INTERVAL = 7000;

const STADIUM_BACKGROUNDS = [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=85',
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=900&q=85',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&q=85',
    'https://images.unsplash.com/photo-1483000805330-4eaf0a0d82da?w=900&q=85',
    'https://images.unsplash.com/photo-1540747913346-19212a4b279d?w=900&q=85',
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=900&q=85',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=900&q=85',
];

const LEAGUE_LOGOS = {
    'Liga MX':        'https://a.espncdn.com/i/leaguelogos/soccer/500/193.png',
    'Premier League': 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
    'La Liga':        'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
    'Serie A':        'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
    'Bundesliga':     'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png',
    'Ligue 1':        'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png',
    'Liga Argentina': 'https://a.espncdn.com/i/leaguelogos/soccer/500/26.png',
    'Liga Ecuador':   'https://a.espncdn.com/i/leaguelogos/soccer/500/184.png',
};

// Team primary colors for gradient splits
const TEAM_COLORS = {
    'america': '#FFD700', 'club america': '#FFD700',
    'chivas': '#C8102E', 'guadalajara': '#C8102E',
    'tigres': '#F5B400', 'tigres uanl': '#F5B400',
    'monterrey': '#003DA5', 'rayados': '#003DA5',
    'cruz azul': '#1E4D9B',
    'pumas': '#1B295E', 'pumas unam': '#1B295E',
    'pachuca': '#1C3F8E',
    'toluca': '#CC0000',
    'atlas': '#8B1A1A',
    'leon': '#006400', 'león': '#006400',
    'santos': '#00A550', 'santos laguna': '#00A550',
    'tijuana': '#C8102E', 'xolos': '#C8102E',
    'necaxa': '#CC0000',
    'mazatlan': '#7B2D8B', 'mazatlán': '#7B2D8B',
    'queretaro': '#003DA5', 'querétaro': '#003DA5',
    'juarez': '#111111', 'juárez': '#111111',
    'atletico san luis': '#CC0000',
    'manchester united': '#DA291C', 'man united': '#DA291C', 'man utd': '#DA291C',
    'liverpool': '#C8102E',
    'arsenal': '#EF0107',
    'chelsea': '#034694',
    'manchester city': '#6CABDD', 'man city': '#6CABDD',
    'tottenham': '#132257', 'spurs': '#132257',
    'newcastle': '#241F20',
    'aston villa': '#95BFE5',
    'west ham': '#7A263A',
    'barcelona': '#A50044',
    'real madrid': '#00529F',
    'atletico madrid': '#CC0000', 'atlético madrid': '#CC0000',
    'sevilla': '#D4AF37',
    'juventus': '#000000',
    'inter milan': '#003399', 'inter': '#003399',
    'ac milan': '#CC0000', 'milan': '#CC0000',
    'napoli': '#087AC7',
    'roma': '#8B0000',
    'lazio': '#87CEEB',
    'bayern munich': '#DC052D', 'bayern': '#DC052D',
    'borussia dortmund': '#FDE100', 'dortmund': '#FDE100', 'bvb': '#FDE100',
    'psg': '#004170', 'paris saint-germain': '#004170',
    'lyon': '#1B66B1',
    'marseille': '#6EC6E6',
};

function _fmpGetTeamColor(name) {
    if (!name) return '#e94560';
    const key = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return TEAM_COLORS[key] || '#e94560';
}

function _fmpHexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
}

function _fmpBuildStatusBadge(partido) {
    const hora = typeof formatearHora === 'function' ? formatearHora(partido.fecha) : (partido.fecha || '');
    if (partido.estado?.enVivo) {
        const min = partido.reloj || partido.minuto || '';
        return `<div class="fmp-status live"><span class="fmp-live-dot"></span>EN VIVO${min ? ' · ' + min + "'" : ''}</div>`;
    }
    if (partido.estado?.finalizado) {
        return `<div class="fmp-status finished"><i class="fas fa-check-circle" style="font-size:9px;margin-right:4px;"></i>FINALIZADO</div>`;
    }
    return `<div class="fmp-status scheduled"><i class="fas fa-clock" style="font-size:9px;margin-right:5px;"></i>${hora}</div>`;
}

function _fmpMinutePercent(partido) {
    if (!partido.estado?.enVivo) return 0;
    const min = parseInt(partido.reloj || partido.minuto || '0', 10);
    if (isNaN(min)) return 0;
    return Math.min(100, Math.round((min / 90) * 100));
}

function _fmpBuildSlide(partido, index, bgUrl, leagueName) {
    const statusBadge = _fmpBuildStatusBadge(partido);
    const leagueLogo  = LEAGUE_LOGOS[leagueName] || LEAGUE_LOGOS['Liga MX'];

    const localName  = partido.local?.nombreCorto  || partido.local?.nombre  || partido.equipo1  || 'Local';
    const visitName  = partido.visitante?.nombreCorto || partido.visitante?.nombre || partido.equipo2 || 'Visitante';
    const localLogo  = partido.local?.logo  || partido.logo1  || '';
    const visitLogo  = partido.visitante?.logo || partido.logo2 || '';
    const localScore = partido.local?.marcador  ?? partido.marcadorLocal  ?? '-';
    const visitScore = partido.visitante?.marcador ?? partido.marcadorVisitante ?? '-';
    const matchId    = partido.id || partido.slug || index;
    const hasStream  = !!(partido.transmisionUrl || partido.url);

    // Team colors for gradient
    const colL  = _fmpGetTeamColor(localName);
    const colV  = _fmpGetTeamColor(visitName);
    const rgbL  = _fmpHexToRgb(colL);
    const rgbV  = _fmpHexToRgb(colV);

    const minutePct = _fmpMinutePercent(partido);
    const minLabel  = partido.estado?.enVivo
        ? (partido.reloj || partido.minuto ? `${partido.reloj || partido.minuto}'` : 'EN VIVO')
        : (partido.estado?.finalizado ? 'FT' : '');

    const fallbackSvg = (letter, color) =>
        `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'><circle cx='30' cy='30' r='30' fill='${encodeURIComponent(color)}'/><text x='50%25' y='57%25' text-anchor='middle' font-size='22' font-weight='900' fill='white' font-family='Inter,Arial'>${letter}</text></svg>`;

    return `
        <div class="fmp-slide" data-index="${index}" data-id="${matchId}">
            <!-- Background stadium photo -->
            <img class="fmp-bg" src="${bgUrl}" alt="Estadio"
                 onerror="this.src='${STADIUM_BACKGROUNDS[0]}'">

            <!-- Team color gradient split -->
            <div class="fmp-color-split" style="background:linear-gradient(100deg,
                rgba(${rgbL},0.72) 0%,
                rgba(${rgbL},0.15) 42%,
                rgba(${rgbV},0.15) 58%,
                rgba(${rgbV},0.72) 100%)"></div>

            <!-- Bottom fade -->
            <div class="fmp-bottom-fade"></div>

            <!-- TOP BAR -->
            <div class="fmp-topbar">
                <div class="fmp-league-badge">
                    <img src="${leagueLogo}" alt="${leagueName}" onerror="this.style.display='none'">
                    ${leagueName}
                </div>
                ${statusBadge}
            </div>

            <!-- SCORE BODY -->
            <div class="fmp-body">
                <!-- Local team -->
                <div class="fmp-team">
                    <div class="fmp-logo-ring">
                        <div class="fmp-logo-glow" style="background:${colL}"></div>
                        <div class="fmp-logo-spinner"></div>
                        <div class="fmp-logo-img-wrap"
                             style="box-shadow:0 0 0 2.5px ${colL}, 0 10px 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.18);">
                            <img class="fmp-logo-img" src="${localLogo}" alt="${localName}"
                                 onerror="this.src='${fallbackSvg(localName.charAt(0), colL)}'">
                        </div>
                    </div>
                    <span class="fmp-team-name">${localName}</span>
                </div>

                <!-- Score center -->
                <div class="fmp-score-center">
                    <div class="fmp-scoreboard">
                        <span class="fmp-score-digit" id="fmpL${index}">${localScore}</span>
                        <div class="fmp-colon-wrap">
                            <div class="fmp-colon-dot"></div>
                            <div class="fmp-colon-dot"></div>
                        </div>
                        <span class="fmp-score-digit" id="fmpV${index}">${visitScore}</span>
                    </div>
                    ${minutePct > 0 || minLabel ? `
                    <div class="fmp-match-time">
                        ${minLabel ? `<span class="fmp-minute-label">${minLabel}</span>` : ''}
                        ${minutePct > 0 ? `
                        <div class="fmp-minute-bar-wrap">
                            <div class="fmp-minute-bar" style="width:${minutePct}%"></div>
                        </div>` : ''}
                    </div>` : ''}
                </div>

                <!-- Away team -->
                <div class="fmp-team">
                    <div class="fmp-logo-ring">
                        <div class="fmp-logo-glow" style="background:${colV}"></div>
                        <div class="fmp-logo-spinner"></div>
                        <div class="fmp-logo-img-wrap"
                             style="box-shadow:0 0 0 2.5px ${colV}, 0 10px 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.18);">
                            <img class="fmp-logo-img" src="${visitLogo}" alt="${visitName}"
                                 onerror="this.src='${fallbackSvg(visitName.charAt(0), colV)}'">
                        </div>
                    </div>
                    <span class="fmp-team-name">${visitName}</span>
                </div>
            </div>

            <!-- BOTTOM ACTION STRIP -->
            <div class="fmp-bottom">
                <div class="fmp-dots" id="fmpDots${index}"></div>
                <button class="fmp-watch-btn fmp-has-stream" onclick="openFeaturedMatchChannels(${index})">
                    <span class="fmp-play-icon"><i class="fas fa-tv"></i></span>
                    VER CANALES
                </button>
                <button class="fmp-share-btn"
                        onclick="_fmpShare(${index},'${localName} vs ${visitName}')"
                        title="Compartir">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>`;
}

async function _fmpShare(index, title) {
    const partido = featuredMatches[index];
    if (!partido) { showToast('No se pudo compartir'); return; }

    const localName = partido.local?.nombreCorto || partido.local?.nombre || partido.equipo1 || 'Local';
    const visitName = partido.visitante?.nombreCorto || partido.visitante?.nombre || partido.equipo2 || 'Visitante';
    const eventoRef = `${localName} vs ${visitName}`;

    showToast('Generando link... ⏳');

    // Resolve channels the same way openFeaturedMatchChannels does
    let canalesCombinados = [];
    const directUrl = partido.transmisionUrl || partido.url || '';
    if (directUrl) {
        directUrl.split(',').map(u => u.trim()).filter(Boolean).forEach((url, i) => {
            canalesCombinados.push({ nombre: `Servidor ${i + 1}`, url, fuente: 'rereyano' });
        });
    }
    const apis = [
        { data: transmisionesAPI2, fuente: 'e1link'          },
        { data: transmisionesAPI1, fuente: 'rereyano'        },
        { data: transmisionesAPI3, fuente: 'voodc'           },
        { data: transmisionesAPI4, fuente: 'transmisiones4'  },
        { data: transmisionesAPI5, fuente: 'donromans'       },
        { data: transmisionesAPI6, fuente: 'transmisiones6'  },
        { data: transmisionesAPI7, fuente: 'transmisiones7'  },
        { data: transmisionesAPI8, fuente: 'transmisiones8'  },
    ];
    for (const { data, fuente } of apis) {
        if (!data?.transmisiones) continue;
        const coincidentes = data.transmisiones.filter(t => _matchesTransmision(eventoRef, t));
        for (const t of coincidentes) {
            if (t.canales?.length) canalesCombinados.push(...t.canales.map(c => ({ ...c, fuente })));
        }
    }
    // Deduplicate by URL
    const seen = new Set();
    canalesCombinados = canalesCombinados.filter(c => {
        const url = c.url || c.src || c.stream_url || '';
        if (!url || seen.has(url)) return false;
        seen.add(url); return true;
    });

    // Build compact channel array for the server
    const channels = canalesCombinados.map(c => {
        const url = c.url || c.enlaces?.[0]?.url || c.link || c.src || c.stream_url || '';
        return [c.nombre || c.fuente || 'Canal', url, c.tipoAPI || c.fuente || ''];
    }).filter(c => c[1]);

    try {
        const resp = await fetch('/api/share/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: eventoRef, channels })
        });
        if (!resp.ok) throw new Error('server error');
        const { id } = await resp.json();
        const shareUrl = `${window.location.origin}${window.location.pathname}?match=${id}`;

        if (navigator.share) {
            await navigator.share({
                title: `${eventoRef} - UltraGol`,
                text: `Ver ${eventoRef} en UltraGol`,
                url: shareUrl
            });
            showToast('¡Compartido! 🎉');
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareUrl);
            showToast('¡Enlace copiado! 📋');
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            _log('_fmpShare error:', e);
            showToast('No se pudo generar el link');
        }
    }
}

function openFeaturedMatchChannels(index) {
    const partido = featuredMatches[index];
    if (!partido) { showToast('No se encontró el partido'); return; }

    const localName  = partido.local?.nombreCorto  || partido.local?.nombre  || partido.equipo1  || 'Local';
    const visitName  = partido.visitante?.nombreCorto || partido.visitante?.nombre || partido.equipo2 || 'Visitante';
    const directUrl  = partido.transmisionUrl || partido.url || '';
    const eventoRef  = `${localName} vs ${visitName}`;
    const titulo     = eventoRef;

    const apis = [
        { data: transmisionesAPI2, fuente: 'e1link'          },
        { data: transmisionesAPI1, fuente: 'rereyano'        },
        { data: transmisionesAPI3, fuente: 'voodc'           },
        { data: transmisionesAPI4, fuente: 'transmisiones4'  },
        { data: transmisionesAPI5, fuente: 'donromans'       },
        { data: transmisionesAPI6, fuente: 'transmisiones6'  },
        { data: transmisionesAPI7, fuente: 'transmisiones7'  },
        { data: transmisionesAPI8, fuente: 'transmisiones8'  },
    ];

    let canalesCombinados = [];

    if (directUrl) {
        directUrl.split(',').map(u => u.trim()).filter(Boolean).forEach((url, i) => {
            canalesCombinados.push({ nombre: `Servidor ${i + 1}`, url, fuente: 'rereyano' });
        });
    }

    for (const { data, fuente } of apis) {
        if (!data?.transmisiones) continue;
        const coincidentes = data.transmisiones.filter(t => _matchesTransmision(eventoRef, t));
        for (const t of coincidentes) {
            if (t.canales?.length) canalesCombinados.push(...t.canales.map(c => ({ ...c, fuente })));
        }
    }

    const seen = new Set();
    canalesCombinados = canalesCombinados.filter(c => {
        const url = c.url || c.src || c.stream_url || '';
        if (!url || seen.has(url)) return !url;
        seen.add(url);
        return true;
    });

    if (canalesCombinados.length > 0) {
        showChannelSelector({ evento: titulo, titulo, canales: canalesCombinados }, titulo);
    } else {
        showToast('No hay canales disponibles aún. Espera unos segundos e intenta de nuevo.');
    }
}

function _fmpSpawnParticles() {
    const container = document.getElementById('fmpContainer');
    if (!container) return;
    const colors = ['#ffd700','#ff6b35','#e94560','#ffffff','#00ff88'];
    for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'fmp-particle';
        const angle = Math.random() * 360;
        const dist  = 80 + Math.random() * 120;
        const tx    = Math.cos(angle * Math.PI / 180) * dist;
        const ty    = -(60 + Math.random() * dist);
        p.style.cssText = `
            left:${40 + Math.random()*20}%;
            top:${40 + Math.random()*20}%;
            background:${colors[Math.floor(Math.random()*colors.length)]};
            border-radius:${Math.random()>0.5?'50%':'3px'};
            width:${5+Math.random()*7}px;
            height:${5+Math.random()*7}px;
            --tx:translate(${tx}px,${ty}px);
            animation-delay:${Math.random()*0.3}s;
            animation-duration:${1.2+Math.random()*0.5}s;
        `;
        container.appendChild(p);
        setTimeout(() => p.remove(), 2000);
    }
}

function _fmpUpdateTrack() {
    const track = document.getElementById('fmpTrack');
    if (!track) return;
    track.style.transform = `translateX(-${currentFeaturedIndex * 100}%)`;

    // Refresh dots in ALL slides
    document.querySelectorAll('[id^="fmpDots"]').forEach(dotsEl => {
        dotsEl.innerHTML = featuredMatches.map((_, i) =>
            `<button class="fmp-dot${i === currentFeaturedIndex ? ' fmp-active' : ''}"
                     onclick="goToFeaturedMatch(${i})"></button>`
        ).join('');
    });

    // Nav arrow opacity
    const prev = document.getElementById('fmpPrev');
    const next = document.getElementById('fmpNext');
    if (prev) { prev.style.opacity = currentFeaturedIndex === 0 ? '0.3' : '1'; prev.disabled = currentFeaturedIndex === 0; }
    if (next) { next.style.opacity = currentFeaturedIndex >= featuredMatches.length - 1 ? '0.3' : '1'; next.disabled = currentFeaturedIndex >= featuredMatches.length - 1; }

    // Active slide class (triggers bg scale-in)
    document.querySelectorAll('.fmp-slide').forEach((s, i) => {
        s.classList.toggle('fmp-active', i === currentFeaturedIndex);
    });

    // Animate progress bar
    _fmpStartProgress();
}

function _fmpStartProgress() {
    const bar = document.getElementById('fmpProgressBar');
    if (!bar || featuredMatches.length <= 1) return;
    bar.style.transition = 'none';
    bar.style.width = '0%';
    // Force reflow
    void bar.offsetWidth;
    bar.style.transition = `width ${FMP_AUTO_INTERVAL}ms linear`;
    bar.style.width = '100%';
}

function _fmpCheckGoals() {
    featuredMatches.forEach((partido, i) => {
        const id     = partido.id || partido.slug || i;
        const lScore = partido.local?.marcador  ?? partido.marcadorLocal;
        const vScore = partido.visitante?.marcador ?? partido.marcadorVisitante;
        const prev   = _fmpPrevScores[id];

        if (prev !== undefined && (Number(lScore) > Number(prev.l) || Number(vScore) > Number(prev.v))) {
            // Animate score digits
            [`fmpL${i}`, `fmpV${i}`].forEach(elId => {
                const el = document.getElementById(elId);
                if (el) {
                    el.classList.remove('fmp-goal-pop');
                    void el.offsetWidth;
                    el.classList.add('fmp-goal-pop');
                    el.addEventListener('animationend', () => el.classList.remove('fmp-goal-pop'), { once: true });
                }
            });

            if (i === currentFeaturedIndex) {
                const overlay = document.getElementById('fmpGoalOverlay');
                if (overlay) {
                    overlay.classList.remove('fmp-show');
                    void overlay.offsetWidth;
                    overlay.classList.add('fmp-show');
                    setTimeout(() => overlay.classList.remove('fmp-show'), 2100);
                }
                _fmpSpawnParticles();
            }
        }
        _fmpPrevScores[id] = { l: lScore, v: vScore };
    });
}

// Actualizar el carrusel del partido destacado con TODOS los partidos
function updateFeaturedMatch(data) {
    if (!data || !data.partidos || data.partidos.length === 0) return;

    const track    = document.getElementById('fmpTrack');
    const skeleton = document.getElementById('fmpSkeleton');
    if (!track) return;

    // Check goals BEFORE overwriting data
    _fmpCheckGoals();

    // Preserve the match the user is viewing
    const previousId = featuredMatches[currentFeaturedIndex]?.id || featuredMatches[currentFeaturedIndex]?.slug;
    featuredMatches  = data.partidos;

    if (previousId) {
        const idx = featuredMatches.findIndex(p => (p.id || p.slug) === previousId);
        currentFeaturedIndex = idx !== -1 ? idx : 0;
    } else {
        currentFeaturedIndex = 0;
    }

    const leagueName = currentLeague || 'Liga MX';

    // Build slides HTML
    track.innerHTML = featuredMatches.map((partido, index) =>
        _fmpBuildSlide(partido, index, STADIUM_BACKGROUNDS[index % STADIUM_BACKGROUNDS.length], leagueName)
    ).join('');

    // Hide skeleton
    if (skeleton) skeleton.style.display = 'none';

    // Show/hide nav arrows
    const prevBtn = document.getElementById('fmpPrev');
    const nextBtn = document.getElementById('fmpNext');
    const multi   = featuredMatches.length > 1;
    if (prevBtn) prevBtn.style.display = multi ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = multi ? 'flex' : 'none';

    _fmpUpdateTrack();
    initTouchSupport();
    _fmpResetAutoTimer();
}

// Navegar al siguiente partido
function nextFeaturedMatch() {
    if (currentFeaturedIndex < featuredMatches.length - 1) {
        currentFeaturedIndex++;
        _fmpUpdateTrack();
        _fmpResetAutoTimer();
    }
}

// Navegar al partido anterior
function prevFeaturedMatch() {
    if (currentFeaturedIndex > 0) {
        currentFeaturedIndex--;
        _fmpUpdateTrack();
        _fmpResetAutoTimer();
    }
}

// Ir a un partido específico
function goToFeaturedMatch(index) {
    if (index >= 0 && index < featuredMatches.length) {
        currentFeaturedIndex = index;
        _fmpUpdateTrack();
        _fmpResetAutoTimer();
    }
}

function _fmpResetAutoTimer() {
    if (_fmpAutoTimer) { clearInterval(_fmpAutoTimer); _fmpAutoTimer = null; }
    if (featuredMatches.length > 1) {
        _fmpAutoTimer = setInterval(() => {
            currentFeaturedIndex = (currentFeaturedIndex + 1) % featuredMatches.length;
            _fmpUpdateTrack();
        }, FMP_AUTO_INTERVAL);
    }
}

// Keep backward compat alias
function updateCarouselPosition() { _fmpUpdateTrack(); }
function updateCarouselIndicators() { _fmpUpdateTrack(); }

// Inicializar soporte táctil para swipe
function initTouchSupport() {
    const track = document.getElementById('fmpTrack');
    if (!track) return;
    track.removeEventListener('touchstart', handleTouchStart);
    track.removeEventListener('touchend', handleTouchEnd);
    track.addEventListener('touchstart', handleTouchStart, { passive: true });
    track.addEventListener('touchend', handleTouchEnd, { passive: true });
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
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) { nextFeaturedMatch(); }
    if (touchEndX > touchStartX + swipeThreshold) { prevFeaturedMatch(); }
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

// Iniciar actualización automática cada 45 segundos
function startAutoUpdate() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    updateInterval = setInterval(async () => {
        if (!document.hidden) {
            await loadMarcadores();
        }
    }, 45000);
}

// Pausar/reanudar intervalos cuando la app va al fondo
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && activeTab === 'live') {
        loadMarcadores();
    }
});

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
        'uanl':        ['tigres', 'tigres uanl', 'uanl', 'tigs'],
        'tigres':      ['tigres', 'tigres uanl', 'uanl', 'tigs'],
        'tig':         ['tigres', 'tigres uanl', 'uanl', 'tigs'],
        'america':     ['america', 'club america', 'las aguilas', 'ame'],
        'ame':         ['america', 'club america', 'las aguilas', 'ame'],
        'chivas':      ['chivas', 'guadalajara', 'cd guadalajara', 'gdl', 'rebano', 'chv'],
        'guadalajara': ['chivas', 'guadalajara', 'cd guadalajara', 'gdl', 'rebano', 'chv'],
        'chv':         ['chivas', 'guadalajara', 'cd guadalajara', 'gdl', 'rebano'],
        'cruz azul':   ['cruz azul', 'la maquina', 'azul', 'caz', 'crz', 'cru'],
        'caz':         ['cruz azul', 'la maquina', 'azul', 'caz', 'crz', 'cru'],
        'pumas':       ['pumas', 'pumas unam', 'unam', 'felinos', 'pum'],
        'monterrey':   ['monterrey', 'rayados', 'cf monterrey', 'mty', 'mon'],
        'santos':      ['santos', 'santos laguna', 'guerreros', 'san'],
        'toluca':      ['toluca', 'diablos rojos', 'diablos', 'tol'],
        'leon':        ['leon', 'club leon', 'la fiera', 'esmeraldas', 'leo'],
        'atlas':       ['atlas', 'fc atlas', 'rojinegros', 'atl'],
        'pachuca':     ['pachuca', 'tuzos', 'pach', 'pac'],
        'tijuana':     ['tijuana', 'xolos', 'club tijuana', 'tj', 'tij'],
        'puebla':      ['puebla', 'club puebla', 'la franja', 'pue'],
        'queretaro':   ['queretaro', 'gallos blancos', 'gallos', 'qro', 'que'],
        'necaxa':      ['necaxa', 'rayos', 'nec'],
        'mazatlan':    ['mazatlan', 'mazatlan fc', 'mzt', 'maz'],
        'juarez':      ['juarez', 'fc juarez', 'bravos', 'jua'],
        'san luis':    ['san luis', 'atletico de san luis', 'atl san luis', 'atl. san luis', 'asl', 'tuneros'],
        'asl':         ['san luis', 'atletico de san luis', 'atl san luis', 'atl. san luis', 'asl', 'tuneros'],
        'gdl':         ['chivas', 'guadalajara', 'cd guadalajara', 'rebano'],
        'mty':         ['monterrey', 'rayados', 'cf monterrey']
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
    
    _log(`🔍 Buscando transmisión para:`);
    _log(`   Local: "${nombreLocal}" → aliases: [${aliasesLocal.join(', ')}]`);
    _log(`   Visitante: "${nombreVisitante}" → aliases: [${aliasesVisitante.join(', ')}]`);
    
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
                _log(`  ✅ Match encontrado (con aliases): "${evento}"`);
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
                        _log(`  ✅ Match encontrado (flexible): "${evento}"`);
                        return true;
                    }
                }
                
                return false;
            });
        }
        
        if (!resultado) {
            _log(`  ❌ No se encontró coincidencia en ${transmisiones.length} transmisiones`);
        }
        
        return resultado;
    };
    
    // Buscar en las 7 APIs
    const transmisionAPI1 = transmisionesAPI1 ? buscarTransmision(transmisionesAPI1.transmisiones) : null;
    const transmisionAPI2 = transmisionesAPI2 ? buscarTransmision(transmisionesAPI2.transmisiones) : null;
    const transmisionAPI3 = transmisionesAPI3 ? buscarTransmision(transmisionesAPI3.transmisiones) : null;
    const transmisionAPI4 = transmisionesAPI4 ? buscarTransmision(transmisionesAPI4.transmisiones) : null;
    const transmisionAPI5 = transmisionesAPI5 ? buscarTransmision(transmisionesAPI5.transmisiones) : null;
    const transmisionAPI6 = transmisionesAPI6 ? buscarTransmision(transmisionesAPI6.transmisiones) : null;
    const transmisionAPI7 = transmisionesAPI7 ? buscarTransmision(transmisionesAPI7.transmisiones) : null;
    const transmisionAPI8 = transmisionesAPI8 ? buscarTransmision(transmisionesAPI8.transmisiones) : null;
    
    // Combinar canales de las 8 APIs
    let canalesCombinados = [];
    let eventoNombre = '';
    
    if (transmisionAPI1) {
        eventoNombre = transmisionAPI1.evento || transmisionAPI1.titulo;
        const canalesAPI1 = (transmisionAPI1.canales || []).map(canal => ({
            ...canal,
            fuente: 'golazolvhd'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI1];
        _log(`✅ Encontrados ${canalesAPI1.length} canales en API 1 (golazolvhd)`);
    }
    
    if (transmisionAPI2) {
        if (!eventoNombre) eventoNombre = transmisionAPI2.evento || transmisionAPI2.titulo;
        const canalesAPI2 = (transmisionAPI2.canales || []).map(canal => ({
            ...canal,
            fuente: 'ellink'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI2];
        _log(`✅ Encontrados ${canalesAPI2.length} canales en API 2 (ellink)`);
    }
    
    if (transmisionAPI3) {
        if (!eventoNombre) eventoNombre = transmisionAPI3.evento || transmisionAPI3.titulo;
        const canalesAPI3 = (transmisionAPI3.canales || []).map(canal => ({
            ...canal,
            fuente: 'voodc'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI3];
        _log(`✅ Encontrados ${canalesAPI3.length} canales en API 3 (voodc)`);
    }
    
    if (transmisionAPI4) {
        if (!eventoNombre) eventoNombre = transmisionAPI4.evento || transmisionAPI4.titulo;
        const canalesAPI4 = (transmisionAPI4.canales || []).map(canal => ({
            ...canal,
            fuente: 'ftvhd'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI4];
        _log(`✅ Encontrados ${canalesAPI4.length} canales en API 4 (ftvhd)`);
    }
    
    if (transmisionAPI5) {
        if (!eventoNombre) eventoNombre = transmisionAPI5.evento || transmisionAPI5.titulo;
        const canalesAPI5 = (transmisionAPI5.canales || []).map(canal => ({
            ...canal,
            fuente: 'donromans'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI5];
        _log(`✅ Encontrados ${canalesAPI5.length} canales en API 5 (donromans)`);
    }

    if (transmisionAPI6) {
        if (!eventoNombre) eventoNombre = transmisionAPI6.evento || transmisionAPI6.titulo;
        const canalesAPI6 = (transmisionAPI6.canales || []).map(canal => ({
            ...canal,
            fuente: 'transmisiones6'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI6];
        _log(`✅ Encontrados ${canalesAPI6.length} canales en API 6 (transmisiones6)`);
    }

    if (transmisionAPI7) {
        if (!eventoNombre) eventoNombre = transmisionAPI7.evento || transmisionAPI7.titulo;
        const canalesAPI7 = (transmisionAPI7.canales || []).map(canal => ({
            ...canal,
            fuente: 'transmisiones7'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI7];
        _log(`✅ Encontrados ${canalesAPI7.length} canales en API 7 (transmisiones7)`);
    }

    if (transmisionAPI8) {
        if (!eventoNombre) eventoNombre = transmisionAPI8.evento || transmisionAPI8.titulo;
        const canalesAPI8 = (transmisionAPI8.canales || []).map(canal => ({
            ...canal,
            fuente: 'transmisiones8'
        }));
        canalesCombinados = [...canalesCombinados, ...canalesAPI8];
        _log(`✅ Encontrados ${canalesAPI8.length} canales en API 8 (transmisiones8)`);
    }
    
    if (canalesCombinados.length === 0) {
        showToast('Por favor espera 30 segundos mientras cargamos los links disponibles');
        _log(`❌ No se encontró transmisión para: ${partido.local.nombre} vs ${partido.visitante.nombre}`);
        return;
    }
    
    _log(`📺 Total canales combinados: ${canalesCombinados.length}`);
    
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
        _log("❌ Error: No se encontraron los elementos del modal en el DOM");
        return;
    }
    
    title.innerHTML = `<i class="fas fa-microchip"></i> ${partidoNombre}`;

    // Save channels for in-player server selector
    currentChannelsList = transmision.canales || [];
    currentTransmisionRef = transmision;
    
    // Guardar en historial antes de abrir
    modalNavigation.pushModal('channelSelector', { transmision, partidoNombre });
    
    const totalCanales = transmision.canales ? transmision.canales.length : 0;

    const servidorMap = {
        'transmisiones':  'SERVIDOR 1',
        'marcadores':     'SERVIDOR 1',
        'e1link':         'SERVIDOR 1',
        'ellink':         'SERVIDOR 1',
        'transmisiones2': 'SERVIDOR 2',
        'rereyano':       'SERVIDOR 2',
        'golazolvhd':     'SERVIDOR 2',
        'transmisiones3': 'SERVIDOR 3',
        'voodc':          'SERVIDOR 3',
        'transmisiones4': 'SERVIDOR 4',
        'ftvhd':          'SERVIDOR 4',
        'transmisiones5': 'SERVIDOR 5',
        'donromans':      'SERVIDOR 5',
        'transmisiones6': 'SERVIDOR 6',
        'transmisiones7': 'SERVIDOR 7',
        'transmisiones8': 'SERVIDOR 8',
    };

    let rowsHtml = '';

    if (totalCanales > 0) {
        transmision.canales.forEach((canal, index) => {
            const serverNum   = index + 1;
            const rawType     = (canal.tipoAPI || canal.fuente || '').toLowerCase();
            const apiLabel    = servidorMap[rawType] || 'STREAM';
            const isSelected  = index === 0 ? 'sr-selected' : '';

            let enlace = '';
            if (canal.url) {
                enlace = canal.url;
            } else if (canal.embed) {
                enlace = decodeStreamUrl(canal.embed);
            } else if (canal.enlaces && canal.enlaces.length > 0) {
                enlace = canal.enlaces[0].url || canal.enlaces[0];
            } else if (canal.links) {
                enlace = canal.links.principal || canal.links.backup || canal.links.hoca || canal.links.caster || canal.links.wigi || canal.links.url || '';
            } else if (canal.link) {
                enlace = canal.link;
            }

            if (!enlace) return;

            const canalNombre     = canal.nombre || `Servidor ${serverNum}`;
            const safeNombre      = partidoNombre.replace(/'/g, "\\'");
            const safeEnlace      = enlace.replace(/'/g, "\\'");
            const safeCanalNombre = canalNombre.replace(/'/g, "\\'");

            rowsHtml += `
                <div class="sr-row ${isSelected}" role="button" tabindex="0"
                     aria-label="${canalNombre}"
                     onclick="playChannelFromSelector('${safeEnlace}','${safeNombre}','${safeCanalNombre}')"
                     onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();playChannelFromSelector('${safeEnlace}','${safeNombre}','${safeCanalNombre}')}">
                    <div class="sr-radio"><div class="sr-radio-inner"></div></div>
                    <div class="sr-info">
                        <div class="sr-name">${canalNombre}</div>
                        <div class="sr-type">${apiLabel.toUpperCase()}</div>
                    </div>
                </div>
            `;
        });
    } else {
        rowsHtml = `
            <div class="sr-empty">
                <i class="fas fa-satellite-dish"></i>
                No se encontraron señales activas.
            </div>
        `;
    }

    let channelsHtml = rowsHtml;
    
    body.innerHTML = channelsHtml;
    modal.classList.add('active');
    // Auto-focus primer canal para navegación TV
    setTimeout(() => {
        const first = body.querySelector('.sr-row[tabindex]');
        if (first) first.focus();
    }, 120);
}

function playChannelFromSelector(url, title, channelName) {
    if (!url || url === 'undefined') {
        showToast('Error: Nodo de transmisión no válido');
        return;
    }
    const modal = document.getElementById('channelSelectorModal');
    saveRecentChannel(url, title, channelName || '');
    if (modal) modal.classList.remove('active');
    window.open(url, '_blank', 'noopener,noreferrer');
}

// ── HISTORIAL DE CANALES VISTOS ──────────────────────────────────────────────
const RECIENTES_KEY = 'ultragol_recientes';
const RECIENTES_MAX = 10;

function saveRecentChannel(url, title, channelName) {
    if (!url || !title) return;
    let items = getRecentChannels();
    // Eliminar duplicado por url
    items = items.filter(i => i.url !== url);
    items.unshift({ url, title, channel: channelName || '', ts: Date.now() });
    items = items.slice(0, RECIENTES_MAX);
    try { localStorage.setItem(RECIENTES_KEY, JSON.stringify(items)); } catch (_) {}
    renderRecentChannels();
}

function getRecentChannels() {
    try {
        const raw = localStorage.getItem(RECIENTES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
}

function clearRecentChannels() {
    try { localStorage.removeItem(RECIENTES_KEY); } catch (_) {}
    renderRecentChannels();
    showToast('Historial borrado');
}

function _timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60)  return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
}

function renderRecentChannels() {
    const section = document.getElementById('recentesSection');
    const track   = document.getElementById('recientesTrack');
    if (!section || !track) return;

    const items = getRecentChannels();
    if (items.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    track.innerHTML = items.map(item => {
        const safeUrl   = item.url.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeTitle = (item.title || '').replace(/'/g, "\\'");
        return `
            <div class="rc-card" onclick="playStreamInModal('${safeUrl}','${safeTitle}')">
                <div class="rc-match">${item.title || 'Partido'}</div>
                <div class="rc-channel"><i class="fas fa-tower-broadcast" style="font-size:9px;margin-right:4px;opacity:.5"></i>${item.channel || 'Canal'}</div>
                <div class="rc-footer">
                    <span class="rc-time">${_timeAgo(item.ts)}</span>
                    <div class="rc-play"><i class="fas fa-play" style="margin-left:1px"></i></div>
                </div>
            </div>`;
    }).join('');
}

// Inicializar sección recientes al cargar
document.addEventListener('DOMContentLoaded', () => { renderRecentChannels(); });


// ==================== FUNCIONES DE ESTADÍSTICAS EN TIEMPO REAL ====================

// Cache para estadísticas cargadas de la API
let statsCache = {};

// Función para obtener estadísticas reales desde la API
async function fetchRealMatchStats(eventId) {
    if (!eventId) return null;

    // Return cache if less than 55 seconds old
    const cached = statsCache[eventId];
    if (cached && (Date.now() - cached.timestamp) < 55000) {
        return cached.data;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
        const response = await fetch(`${API_BASE}/estadisticas/partido/${eventId}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) return null;

        const data = await response.json();
        statsCache[eventId] = { data, timestamp: Date.now() };
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
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
        _log('📊 No hay datos de API, usando estadísticas generadas');
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
    
    _log('✅ Estadísticas actualizadas en el DOM');
}

// Función para iniciar la actualización automática de estadísticas
function startStatsAutoUpdate(eventId, partido) {
    // Limpiar intervalo anterior si existe
    stopStatsAutoUpdate();
    
    currentStatsEventId = eventId;
    
    // Cargar estadísticas inmediatamente
    updateStatsInDOM(eventId, partido);
    
    // Configurar actualización automática cada 60 segundos
    statsUpdateInterval = setInterval(() => {
        if (currentStatsEventId === eventId && !document.hidden) {
            updateStatsInDOM(eventId, partido);
        }
    }, 60000);
    
    _log(`⏱️ Auto-actualización de estadísticas iniciada para partido ${eventId}`);
}

// Función para detener la actualización automática
function stopStatsAutoUpdate() {
    if (statsUpdateInterval) {
        clearInterval(statsUpdateInterval);
        statsUpdateInterval = null;
        currentStatsEventId = null;
        _log('⏹️ Auto-actualización de estadísticas detenida');
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
        _log('📊 No se pudo detectar la liga para:', partidoNombre);
        return null;
    }
    
    _log('📊 Buscando partido en datos cargados...');
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
    _log('📊 Tabs de estadísticas inicializados');
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

    streamUrl = decodeStreamUrl(streamUrl);

    // Wire server strip with current channels list
    currentActiveServerIdx = (() => {
        const decoded = streamUrl;
        return currentChannelsList.findIndex(c => {
            const u = decodeStreamUrl(c.url || c.embed || (c.enlaces && c.enlaces[0] && (c.enlaces[0].url || c.enlaces[0])) ||
                (c.links && (c.links.principal || c.links.backup || c.links.url)) || c.link || '');
            return u && decoded && u === decoded;
        });
    })();
    if (currentActiveServerIdx < 0) currentActiveServerIdx = 0;
    renderServerStrip(currentChannelsList);
    
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
    
    // Reset play overlay — require user to press play before radio
    _showStreamPlayOverlay();
    
    // Configurar iframe
    const iframe = document.getElementById('modalIframe');
    const loader = document.getElementById('modalLoader');
    
    if (loader) loader.style.display = 'flex';
    
    iframe.src = embedUrl;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; microphone; camera';
    
    // Deferir carga de estadísticas para no bloquear el render del player
    if (statsContainer) {
        setTimeout(() => {
            statsContainer.innerHTML = generateMatchStatsSection(displayTitle);
            initStatsTabsListeners();
            let partido = findPartidoByName(displayTitle);
            if (partido && partido.id) {
                startStatsAutoUpdate(partido.id, partido);
            } else {
                fetchStatsForMatch(title).then(partidoRemoto => {
                    if (partidoRemoto && partidoRemoto.id) {
                        startStatsAutoUpdate(partidoRemoto.id, partidoRemoto);
                    }
                }).catch(() => {});
            }
        }, 800);
    }
    
    iframe.onload = () => {
        setTimeout(() => {
            if (loader) loader.style.display = 'none';
        }, 800);
    };
    
    iframe.onerror = () => {
        _log('Error cargando stream:', embedUrl);
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
    
    _log(`⬅️ Navegando hacia atrás desde: ${currentModal.id}`);
    
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
        _log('✅ No hay modal anterior, todo cerrado');
        return;
    }
    
    // Restaurar el modal anterior
    _log(`🔄 Restaurando modal anterior: ${previousModal.id}`);
    
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
    const statsContainer = document.getElementById('playerStatsContainer');
    
    modal.classList.remove('active');
    
    const iframe = document.getElementById('modalIframe');
    if (iframe) iframe.src = '';
    
    // Hide play overlay and reset radio state when modal closes
    const overlay = document.getElementById('streamPlayOverlay');
    if (overlay) overlay.classList.add('hidden');
    streamStarted = false;
    radioModeActive = false;
    
    currentStreamUrl = '';
    currentChannelsList = [];
    currentActiveServerIdx = 0;
    currentTransmisionRef = null;

    // Reset server strip
    renderServerStrip([]);
    
    // Detener la actualización automática de estadísticas
    stopStatsAutoUpdate();
    
    if (statsContainer) statsContainer.innerHTML = '';
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
    _log('🚪 Todos los modales cerrados');
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
let streamStarted = false;
let radioAudioContext = null;
let radioOscillator = null;
let radioGainNode = null;
let radioAudioElement = null;

function _showStreamPlayOverlay() {
    const overlay = document.getElementById('streamPlayOverlay');
    const radioBtn = document.getElementById('radioBtnControl');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
    if (radioBtn) {
        radioBtn.classList.add('radio-locked');
    }
    streamStarted = false;
}

function onStreamPlayPressed() {
    const overlay = document.getElementById('streamPlayOverlay');
    const radioBtn = document.getElementById('radioBtnControl');
    if (overlay) {
        overlay.classList.add('hidden');
    }
    if (radioBtn) {
        radioBtn.classList.remove('radio-locked');
    }
    streamStarted = true;
}

function toggleRadioMode() {
    if (!streamStarted) {
        showToast('Presiona play primero para iniciar la transmisión');
        return;
    }
    const visualizer = document.getElementById('radioVisualizer');
    const iframe = document.getElementById('modalIframe');
    const radioBtn = document.querySelector('.radio-btn');
    
    radioModeActive = !radioModeActive;
    
    if (radioModeActive) {
        visualizer.classList.add('active');
        // Keep iframe rendering (don't hide it) so the browser doesn't suspend its audio
        iframe.style.pointerEvents = 'none';
        radioBtn.classList.add('active');
        document.getElementById('radioTitleText').textContent = currentStreamTitle || 'MODO RADIO ACTIVO';
        _startBackgroundAudioKeepAlive();
        showToast('Modo Radio: Solo audio activado');
    } else {
        visualizer.classList.remove('active');
        iframe.style.pointerEvents = 'auto';
        radioBtn.classList.remove('active');
        _stopBackgroundAudioKeepAlive();
        showToast('Modo Video activado');
    }
}

// ---------- Web Audio keep-alive helpers ----------
function _startBackgroundAudioKeepAlive() {
    try {
        if (!radioAudioContext || radioAudioContext.state === 'closed') {
            radioAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (radioAudioContext.state === 'suspended') {
            radioAudioContext.resume();
        }
        // Stop any previous oscillator
        if (radioOscillator) {
            try { radioOscillator.stop(); } catch(e) {}
            radioOscillator = null;
        }
        // Create an inaudible but continuous tone so the OS never kills the audio session
        radioGainNode = radioAudioContext.createGain();
        radioGainNode.gain.value = 0.00001;
        radioGainNode.connect(radioAudioContext.destination);
        radioOscillator = radioAudioContext.createOscillator();
        radioOscillator.frequency.value = 440;
        radioOscillator.connect(radioGainNode);
        radioOscillator.start();
        _log('🎵 Background audio keep-alive started (Web Audio API)');
    } catch (e) {
        _log('Web Audio API unavailable, falling back to silent element:', e);
        _startSilentAudioFallback();
    }
    _setupMediaSession();
    requestWakeLock();
}

function _stopBackgroundAudioKeepAlive() {
    if (radioOscillator) {
        try { radioOscillator.stop(); } catch(e) {}
        radioOscillator = null;
    }
    if (radioAudioContext) {
        radioAudioContext.suspend().catch(() => {});
    }
    if (radioAudioElement) {
        radioAudioElement.pause();
    }
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
    }
    releaseWakeLock();
}

function _startSilentAudioFallback() {
    if (!radioAudioElement) {
        radioAudioElement = document.createElement('audio');
        radioAudioElement.id = 'radioBackgroundAudio';
        radioAudioElement.loop = true;
        radioAudioElement.volume = 0.01;
        radioAudioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        document.body.appendChild(radioAudioElement);
    }
    radioAudioElement.play().catch(e => _log('Audio play error:', e));
}

function _setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStreamTitle || 'ULTRAGOL Radio',
        artist: 'Transmisión en vivo',
        album: 'ULTRAGOL',
        artwork: [
            { src: 'ultragol-logo.png', sizes: '96x96',   type: 'image/png' },
            { src: 'ultragol-logo.png', sizes: '128x128', type: 'image/png' },
            { src: 'ultragol-logo.png', sizes: '192x192', type: 'image/png' },
            { src: 'ultragol-logo.png', sizes: '256x256', type: 'image/png' },
            { src: 'ultragol-logo.png', sizes: '384x384', type: 'image/png' },
            { src: 'ultragol-logo.png', sizes: '512x512', type: 'image/png' }
        ]
    });
    navigator.mediaSession.setActionHandler('play', () => {
        if (radioAudioContext && radioAudioContext.state === 'suspended') radioAudioContext.resume();
        if (radioAudioElement) radioAudioElement.play();
        showToast('Modo Radio activado');
    });
    navigator.mediaSession.setActionHandler('pause', () => { deactivateRadioMode(); });
    navigator.mediaSession.setActionHandler('stop',  () => { deactivateRadioMode(); });
    navigator.mediaSession.playbackState = 'playing';
}
// --------------------------------------------------

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
    
    _startBackgroundAudioKeepAlive();
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
    
    _stopBackgroundAudioKeepAlive();
    showToast('Modo Radio desactivado');
}

// Wake Lock API para mantener la pantalla activa (opcional)
let wakeLock = null;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            _log('Wake Lock activado');
            
            wakeLock.addEventListener('release', () => {
                _log('Wake Lock liberado');
            });
        }
    } catch (err) {
        _log('Wake Lock no disponible:', err);
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
    if (radioModeActive) {
        if (document.visibilityState === 'visible') {
            // Page came back into view — resume audio context if suspended
            if (radioAudioContext && radioAudioContext.state === 'suspended') {
                radioAudioContext.resume().catch(() => {});
            }
            if (wakeLock !== null) requestWakeLock();
        }
        // When going hidden (screen off): AudioContext continues if started by user gesture
    }
});

function openStream(url) {
    if (!url) return;
    currentStreamUrl = url;
    window.open(url, '_blank', 'noopener,noreferrer');
}

// ── SERVER SELECTOR ────────────────────────────────────────────────────────

function renderServerStrip(channels) {
    const scroll = document.getElementById('pglServersScroll');
    const countEl = document.getElementById('pglSrvCount');
    if (!scroll) return;

    const list = (channels || []).filter(c => {
        const u = c.url || c.embed || (c.enlaces && c.enlaces[0] && (c.enlaces[0].url || c.enlaces[0])) ||
                  (c.links && (c.links.principal || c.links.backup || c.links.url)) || c.link || '';
        return !!u;
    });

    if (countEl) countEl.textContent = list.length + ' disponible' + (list.length !== 1 ? 's' : '');

    if (list.length === 0) {
        scroll.innerHTML = `<div class="pgl-srv-empty"><i class="fas fa-satellite-dish"></i><span>Sin señales extra disponibles</span></div>`;
        return;
    }

    const pingVals = list.map(() => Math.floor(Math.random() * 38) + 5);

    scroll.innerHTML = list.map((canal, i) => {
        const ping = pingVals[i];
        const pingClass = ping < 20 ? 'fast' : ping < 35 ? 'medium' : 'slow';
        const name = canal.nombre || `Servidor ${i + 1}`;
        const num = String(i + 1).padStart(2, '0');
        const isActive = i === currentActiveServerIdx ? 'active' : '';
        return `<button class="pgl-srv-pill ${isActive}" onclick="loadServerInPlayer(${i})" title="${name}">
            <span class="pgl-pill-num">${num}</span>
            <span class="pgl-pill-name">${name}</span>
            <span class="pgl-pill-hd">HD</span>
            <span class="pgl-pill-ping ${pingClass}">${ping}ms</span>
        </button>`;
    }).join('');
}

function loadServerInPlayer(index) {
    if (!currentChannelsList || !currentChannelsList[index]) return;
    const canal = currentChannelsList[index];

    let url = canal.url || '';
    if (!url && canal.embed) url = canal.embed;
    if (!url && canal.enlaces && canal.enlaces.length > 0) url = canal.enlaces[0].url || canal.enlaces[0];
    if (!url && canal.links) url = canal.links.principal || canal.links.backup || canal.links.hoca || canal.links.url || '';
    if (!url && canal.link) url = canal.link;
    url = decodeStreamUrl(url);
    if (!url) { showToast('Este servidor no tiene señal disponible'); return; }

    window.open(url, '_blank', 'noopener,noreferrer');
}

function openStreamNewTab() {
    if (!currentStreamUrl) { showToast('No hay transmisión activa'); return; }
    window.open(currentStreamUrl, '_blank', 'noopener,noreferrer');
}

function copyStreamLink() {
    if (!currentStreamUrl) { showToast('No hay transmisión activa'); return; }
    const btn = document.querySelector('.pgl-btn-copy');
    const icon = document.getElementById('pglCopyIcon');
    const text = currentStreamUrl;
    const reset = () => {
        if (btn) btn.classList.remove('copied');
        if (icon) { icon.className = 'fas fa-link'; }
    };
    const onDone = () => {
        if (btn) btn.classList.add('copied');
        if (icon) { icon.className = 'fas fa-check'; }
        showToast('¡Link copiado! 📋');
        setTimeout(reset, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onDone).catch(() => { fallbackCopyToClipboard(text); onDone(); });
    } else {
        fallbackCopyToClipboard(text); onDone();
    }
}

function showCurrentChannels() {
    if (!currentTransmisionRef) { showToast('No hay canales disponibles'); return; }
    showChannelSelector(currentTransmisionRef, currentStreamTitle || 'Partido');
}

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('active');
    if (panel.classList.contains('active')) {
        updateNotifButtonState();
    }
}

function updateNotifButtonState() {
    const btn = document.getElementById('notifToggleBtn');
    const icon = document.getElementById('notifToggleIcon');
    const text = document.getElementById('notifToggleText');
    if (!btn || !icon || !text) return;

    const perm = localStorage.getItem('notificationPermission');
    const browserPerm = ('Notification' in window) ? Notification.permission : 'denied';
    const active = perm === 'granted' && browserPerm === 'granted';

    if (active) {
        btn.style.background = '#e94560';
        icon.className = 'fas fa-bell-slash';
        text.textContent = 'Desactivar';
    } else {
        btn.style.background = 'var(--primary)';
        icon.className = 'fas fa-bell';
        text.textContent = 'Activar';
    }
}

function toggleNotificationsFromSettings() {
    const perm = localStorage.getItem('notificationPermission');
    const browserPerm = ('Notification' in window) ? Notification.permission : 'denied';
    const active = perm === 'granted' && browserPerm === 'granted';

    if (active) {
        if (window.notificationManager) window.notificationManager.disableNotifications();
        else {
            localStorage.setItem('notificationPermission', 'denied');
        }
        updateNotifButtonState();
    } else {
        if (window.notificationManager) {
            window.notificationManager.showPermissionModal();
        }
        // Update button after a short delay (permission dialog takes time)
        setTimeout(updateNotifButtonState, 2000);
    }
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

    // Bounce animation
    if (typeof navBounce === 'function') navBounce(button);
    
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
        showSearchWelcome();
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
            <div class="sw-section">
                <div class="sw-section-head">
                    <span><i class="fas fa-history"></i> Recientes</span>
                    <button class="sw-clear-btn" onclick="clearSearchHistory()">Borrar todo</button>
                </div>
                <div class="sw-chips-scroll">
                    ${history.map(item => `<span class="sw-chip sw-chip-history" onclick="quickSearch('${item.replace(/'/g,"\\'")}')"><i class="fas fa-clock"></i> ${item}</span>`).join('')}
                </div>
            </div>
        `;
    }

    const leagues = [
        { name: 'Liga MX', sub: 'México · Fútbol', icon: 'fa-futbol', color: '#22c55e' },
        { name: 'Champions League', sub: 'Europa · Fútbol', icon: 'fa-futbol', color: '#1a78c2' },
        { name: 'Premier League', sub: 'Inglaterra · Fútbol', icon: 'fa-crown', color: '#a855f7' },
        { name: 'Libertadores', sub: 'Sudamérica · Fútbol', icon: 'fa-futbol', color: '#22d3ee' },
        { name: 'NBA', sub: 'EEUU · Baloncesto', icon: 'fa-basketball-ball', color: '#c9082a' },
        { name: 'UFC', sub: 'MMA · Artes Marciales', icon: 'fa-fist-raised', color: '#FF4500' },
        { name: 'NFL', sub: 'EEUU · Fútbol Americano', icon: 'fa-football-ball', color: '#7c3aed' },
    ];

    const leagueRows = leagues.map(l => `
        <div class="sw-row" onclick="quickSearch('${l.name}')">
            <div class="sw-row-icon" style="background:${l.color}22;color:${l.color}"><i class="fas ${l.icon}"></i></div>
            <div class="sw-row-body">
                <span class="sw-row-title">${l.name}</span>
                <span class="sw-row-sub">${l.sub}</span>
            </div>
            <i class="fas fa-chevron-right sw-row-chevron"></i>
        </div>
    `).join('');

    const teams = [
        { name: 'América', icon: 'fa-star', color: '#FFD700' },
        { name: 'Chivas', icon: 'fa-heart', color: '#cc0000' },
        { name: 'Cruz Azul', icon: 'fa-bolt', color: '#1d6fd8' },
        { name: 'Tigres', icon: 'fa-paw', color: '#f5a623' },
        { name: 'Pumas', icon: 'fa-cat', color: '#9fbd5c' },
        { name: 'Monterrey', icon: 'fa-mountain', color: '#4287f5' },
        { name: 'Real Madrid', icon: 'fa-chess-king', color: '#e8d99f' },
        { name: 'Barcelona', icon: 'fa-shield-alt', color: '#a50044' },
    ];

    const teamChips = teams.map(t => `
        <div class="sw-team-chip" onclick="quickSearch('${t.name}')">
            <div class="sw-team-icon" style="background:${t.color}22;color:${t.color}"><i class="fas ${t.icon}"></i></div>
            <span>${t.name.split(' ')[0]}</span>
        </div>
    `).join('');

    resultsContainer.innerHTML = `
        <div class="sw-root">
            ${historyHtml}
        </div>
    `;
}

function startVoiceSearch() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = document.getElementById('voiceSearchBtn');
    if (!SR) {
        if (btn) { btn.style.opacity = '0.4'; setTimeout(() => btn.style.opacity = '', 1000); }
        return;
    }
    const recognition = new SR();
    recognition.lang = 'es-MX';
    recognition.continuous = false;
    recognition.interimResults = false;
    if (btn) btn.classList.add('listening');
    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        quickSearch(transcript);
    };
    recognition.onend = () => { if (btn) btn.classList.remove('listening'); };
    recognition.onerror = () => { if (btn) btn.classList.remove('listening'); };
    recognition.start();
}

function filterBySport(sport, el) {
    document.querySelectorAll('.sport-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    const q = document.getElementById('searchInput');
    if (q && q.value.trim()) {
        performSearch(q.value.trim());
    } else if (sport !== 'todos') {
        quickSearch(sport === 'fútbol' ? 'fútbol' : sport === 'basket' ? 'NBA' : sport === 'box' ? 'UFC' : 'NFL');
    }
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

// ===== TEAM PROFILE (Google-style) — real scraped data ===========================
let _currentTeamProfile = null;
let _currentTeamQuery = '';
let _profileTab = 'overview';
let _currentMatchProfile = null;
const _teamProfileMemCache = new Map();
const _matchProfileMemCache = new Map();

async function fetchTeamProfile(query) {
    const key = query.trim().toLowerCase();
    const cached = _teamProfileMemCache.get(key);
    if (cached && Date.now() - cached.ts < 10 * 60 * 1000) return cached.data;
    try {
        const r = await fetch(`/api/team-profile?name=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(8000) });
        const data = await r.json();
        _teamProfileMemCache.set(key, { data, ts: Date.now() });
        return data;
    } catch (_) { return null; }
}

async function fetchMatchProfile(home, away) {
    const key = `${home}|${away}`.toLowerCase();
    const cached = _matchProfileMemCache.get(key);
    if (cached && Date.now() - cached.ts < 10 * 60 * 1000) return cached.data;
    try {
        const r = await fetch(`/api/match-profile?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}`, { signal: AbortSignal.timeout(10000) });
        const data = await r.json();
        _matchProfileMemCache.set(key, { data, ts: Date.now() });
        return data;
    } catch (_) { return null; }
}

// Detect "X vs Y" / "X x Y" / "X - Y" patterns. Returns {home, away} or null.
function _parseMatchQuery(q) {
    const s = (q || '').trim();
    if (s.length < 5) return null;
    const m = s.match(/^(.+?)\s+(?:vs?\.?|×|x|-)\s+(.+)$/i);
    if (!m) return null;
    const home = m[1].trim();
    const away = m[2].trim();
    if (home.length < 2 || away.length < 2) return null;
    return { home, away };
}

// Heuristic: only fetch profile for single-team-style queries (1-3 tokens, no "vs"/"en vivo")
function _shouldTryTeamProfile(q) {
    const s = (q || '').trim().toLowerCase();
    if (s.length < 3) return false;
    if (/\b(vs|en vivo|live|hoy|próximo|proximo|finalizado|programado|champions|premier|liga mx|nba|ufc|nfl|mundial|copa)\b/.test(s)) return false;
    const tokens = s.split(/\s+/);
    if (tokens.length > 3) return false;
    return true;
}

function switchProfileTab(tab) {
    _profileTab = tab;
    const tabsBar = document.querySelector('.tp-tabs');
    if (tabsBar) {
        tabsBar.querySelectorAll('.tp-tab').forEach(t => t.classList.toggle('tp-tab-active', t.dataset.tab === tab));
    }
    const body = document.getElementById('tpTabBody');
    if (body && _currentTeamProfile) body.innerHTML = renderProfileTab(tab, _currentTeamProfile);
}

function _fmtMatchDate(d) {
    if (!d) return '';
    try {
        const dt = new Date(d);
        return dt.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (_) { return d; }
}

function _safeImg(src, alt = '', cls = '') {
    const fallback = "this.style.visibility='hidden'";
    return src ? `<img class="${cls}" src="${src}" alt="${alt}" onerror="${fallback}">` : '';
}

function renderProfileTab(tab, profile) {
    const t = profile.team || {};

    if (tab === 'overview') {
        const next = (profile.nextMatches || [])[0];
        const last = (profile.lastMatches || [])[0];
        const top4 = (profile.standings || []).slice(0, 4);
        const currentPos = (profile.standings || []).find(s => s.isCurrent);
        return `
            ${last ? `
                <div class="tp-card tp-card-match">
                    <div class="tp-card-head">
                        <span class="tp-card-tag">${last.league || ''} · Último partido</span>
                        <span class="tp-card-result ${last.homeScore != null ? 'tp-finished' : ''}">${last.status || 'Finalizado'}</span>
                    </div>
                    <div class="tp-match-row">
                        <div class="tp-match-team">${_safeImg(last.homeBadge, last.home, 'tp-team-badge')}<span>${last.home}</span></div>
                        <div class="tp-match-score">${last.homeScore ?? '-'} <span>·</span> ${last.awayScore ?? '-'}</div>
                        <div class="tp-match-team tp-match-team-away">${_safeImg(last.awayBadge, last.away, 'tp-team-badge')}<span>${last.away}</span></div>
                    </div>
                    <div class="tp-match-meta">${_fmtMatchDate(last.date)}${last.venue ? ' · ' + last.venue : ''}</div>
                    ${last.video ? `<a class="tp-match-video" href="${last.video}" target="_blank" rel="noopener"><i class="fas fa-play-circle"></i> Resumen del partido</a>` : ''}
                </div>` : ''}
            ${next ? `
                <div class="tp-card">
                    <div class="tp-card-head"><span class="tp-card-tag">Próximo partido</span><span class="tp-card-date">${_fmtMatchDate(next.date)}${next.time ? ' · ' + next.time.slice(0,5) : ''}</span></div>
                    <div class="tp-match-row">
                        <div class="tp-match-team">${_safeImg(next.homeBadge, next.home, 'tp-team-badge')}<span>${next.home}</span></div>
                        <div class="tp-match-vs">vs</div>
                        <div class="tp-match-team tp-match-team-away">${_safeImg(next.awayBadge, next.away, 'tp-team-badge')}<span>${next.away}</span></div>
                    </div>
                    ${next.venue ? `<div class="tp-match-meta"><i class="fas fa-map-marker-alt"></i> ${next.venue}</div>` : ''}
                </div>` : ''}
            <div class="tp-grid-2">
                ${top4.length ? `
                    <div class="tp-card tp-card-link" onclick="switchProfileTab('standings')">
                        <div class="tp-card-head"><span class="tp-card-tag">Posiciones</span><i class="fas fa-chevron-right tp-chev"></i></div>
                        <div class="tp-card-sub">${t.league || ''}</div>
                        <div class="tp-mini-table">
                            ${top4.map(s => `
                                <div class="tp-mini-row ${s.isCurrent ? 'tp-mini-row-current' : ''}">
                                    <span class="tp-mini-pos">${s.position}</span>
                                    ${_safeImg(s.badge, s.team, 'tp-mini-badge')}
                                    <span class="tp-mini-team">${s.team.length > 14 ? s.team.slice(0,14)+'…' : s.team}</span>
                                    <span class="tp-mini-pts">${s.points} ptos</span>
                                </div>`).join('')}
                            ${currentPos && currentPos.position > 4 ? `
                                <div class="tp-mini-row tp-mini-row-current">
                                    <span class="tp-mini-pos">${currentPos.position}</span>
                                    ${_safeImg(currentPos.badge, currentPos.team, 'tp-mini-badge')}
                                    <span class="tp-mini-team">${t.shortName || t.name}</span>
                                    <span class="tp-mini-pts">${currentPos.points} ptos</span>
                                </div>` : ''}
                        </div>
                    </div>` : ''}
                ${(profile.squad || []).length ? `
                    <div class="tp-card tp-card-link" onclick="switchProfileTab('squad')">
                        <div class="tp-card-head"><span class="tp-card-tag">Jugadores</span><i class="fas fa-chevron-right tp-chev"></i></div>
                        <div class="tp-mini-players">
                            ${profile.squad.slice(0,3).map(p => `
                                <div class="tp-mini-player">
                                    ${p.photo ? `<img src="${p.photo}" alt="${p.name}" onerror="this.style.display='none'">` : '<div class="tp-mini-player-ph"><i class="fas fa-user"></i></div>'}
                                    <div>
                                        <div class="tp-mini-player-name">${p.name}</div>
                                        <div class="tp-mini-player-pos">${p.position || ''}</div>
                                    </div>
                                </div>`).join('')}
                        </div>
                        <div class="tp-mini-more">+${Math.max(0, profile.squad.length - 3)} más</div>
                    </div>` : ''}
            </div>
            ${t.stadium ? `
                <div class="tp-card">
                    <div class="tp-card-head"><span class="tp-card-tag">Estadio local</span></div>
                    <div class="tp-stadium">
                        ${t.stadiumThumb ? `<img class="tp-stadium-img" src="${t.stadiumThumb}" alt="${t.stadium}" onerror="this.style.display='none'">` : '<div class="tp-stadium-ph"><i class="fas fa-stadium"></i></div>'}
                        <div class="tp-stadium-info">
                            <div class="tp-stadium-name">${t.stadium}</div>
                            ${t.stadiumLocation ? `<div class="tp-stadium-loc"><i class="fas fa-map-marker-alt"></i> ${t.stadiumLocation}</div>` : ''}
                            ${t.stadiumCapacity ? `<div class="tp-stadium-cap"><i class="fas fa-users"></i> Capacidad: ${Number(t.stadiumCapacity).toLocaleString('es-MX')}</div>` : ''}
                        </div>
                    </div>
                </div>` : ''}
            ${t.description ? `
                <div class="tp-card">
                    <div class="tp-card-head"><span class="tp-card-tag">Acerca de</span></div>
                    <p class="tp-desc">${t.description.length > 320 ? t.description.slice(0,320)+'…' : t.description}</p>
                    <div class="tp-meta-row">
                        ${t.founded ? `<span><i class="fas fa-calendar"></i> Fundado ${t.founded}</span>` : ''}
                        ${t.country ? `<span><i class="fas fa-flag"></i> ${t.country}</span>` : ''}
                        ${t.league ? `<span><i class="fas fa-trophy"></i> ${t.league}</span>` : ''}
                    </div>
                </div>` : ''}
        `;
    }

    if (tab === 'matches') {
        const lastM = profile.lastMatches || [];
        const nextM = profile.nextMatches || [];
        if (!lastM.length && !nextM.length) {
            return '<div class="tp-empty"><i class="far fa-calendar"></i><p>Sin partidos disponibles</p></div>';
        }
        const renderMatch = (m, finished) => `
            <div class="tp-card tp-card-match">
                <div class="tp-card-head">
                    <span class="tp-card-tag">${m.league || ''}${m.round ? ' · J' + m.round : ''}</span>
                    <span class="tp-card-date">${_fmtMatchDate(m.date)}${m.time ? ' · ' + m.time.slice(0,5) : ''}</span>
                </div>
                <div class="tp-match-row">
                    <div class="tp-match-team">${_safeImg(m.homeBadge, m.home, 'tp-team-badge')}<span>${m.home}</span></div>
                    ${finished
                        ? `<div class="tp-match-score">${m.homeScore ?? '-'} <span>·</span> ${m.awayScore ?? '-'}</div>`
                        : `<div class="tp-match-vs">vs</div>`}
                    <div class="tp-match-team tp-match-team-away">${_safeImg(m.awayBadge, m.away, 'tp-team-badge')}<span>${m.away}</span></div>
                </div>
                ${m.venue ? `<div class="tp-match-meta"><i class="fas fa-map-marker-alt"></i> ${m.venue}</div>` : ''}
                ${m.video ? `<a class="tp-match-video" href="${m.video}" target="_blank" rel="noopener"><i class="fas fa-play-circle"></i> Resumen</a>` : ''}
            </div>`;
        return `
            ${nextM.length ? `<div class="tp-section-h"><i class="far fa-clock"></i> Próximos</div>${nextM.map(m => renderMatch(m, false)).join('')}` : ''}
            ${lastM.length ? `<div class="tp-section-h"><i class="fas fa-history"></i> Recientes</div>${lastM.map(m => renderMatch(m, true)).join('')}` : ''}
        `;
    }

    if (tab === 'standings') {
        const rows = profile.standings || [];
        if (!rows.length) return '<div class="tp-empty"><i class="fas fa-list-ol"></i><p>Sin tabla de posiciones disponible</p></div>';
        return `
            <div class="tp-card tp-card-flush">
                <div class="tp-card-head"><span class="tp-card-tag">${t.league || 'Tabla de posiciones'}</span></div>
                <div class="tp-standings">
                    <div class="tp-standings-head">
                        <span>#</span><span>Equipo</span><span>PJ</span><span>DG</span><span>Pts</span>
                    </div>
                    ${rows.map(s => `
                        <div class="tp-standings-row ${s.isCurrent ? 'tp-standings-row-current' : ''}">
                            <span class="tp-standings-pos">${s.position}</span>
                            <span class="tp-standings-team">${_safeImg(s.badge, s.team, 'tp-standings-badge')}<span>${s.team}</span></span>
                            <span>${s.played ?? '-'}</span>
                            <span>${s.goalDifference > 0 ? '+' : ''}${s.goalDifference ?? '-'}</span>
                            <span class="tp-standings-pts">${s.points ?? '-'}</span>
                        </div>`).join('')}
                </div>
            </div>
        `;
    }

    if (tab === 'squad') {
        const players = profile.squad || [];
        if (!players.length) return '<div class="tp-empty"><i class="fas fa-users"></i><p>Sin información de jugadores</p></div>';
        const groups = { 'Portero': [], 'Defensa': [], 'Mediocampista': [], 'Delantero': [], 'Otros': [] };
        players.forEach(p => {
            const pos = (p.position || '').toLowerCase();
            if (/goal|portero/.test(pos)) groups['Portero'].push(p);
            else if (/defen|back/.test(pos)) groups['Defensa'].push(p);
            else if (/mid|medio/.test(pos)) groups['Mediocampista'].push(p);
            else if (/forw|delant|striker|wing/.test(pos)) groups['Delantero'].push(p);
            else groups['Otros'].push(p);
        });
        return Object.entries(groups).filter(([, arr]) => arr.length).map(([label, arr]) => `
            <div class="tp-section-h">${label} <span class="tp-section-count">${arr.length}</span></div>
            <div class="tp-squad-grid">
                ${arr.map(p => `
                    <div class="tp-player-card">
                        <div class="tp-player-photo">
                            ${p.photo ? `<img src="${p.photo}" alt="${p.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=&quot;fas fa-user&quot;></i>'">` : '<i class="fas fa-user"></i>'}
                            ${p.number ? `<span class="tp-player-num">${p.number}</span>` : ''}
                        </div>
                        <div class="tp-player-name">${p.name}</div>
                        <div class="tp-player-meta">${p.position || ''}${p.nationality ? ' · ' + p.nationality : ''}</div>
                    </div>`).join('')}
            </div>
        `).join('');
    }

    return '';
}

function renderTeamProfileHeader(profile) {
    const t = profile.team || {};
    const banner = t.fanart || t.banner || t.stadiumThumb || '';
    return `
        <div class="tp-header" ${banner ? `style="background-image: linear-gradient(180deg, rgba(15,15,15,0) 0%, rgba(15,15,15,0.85) 60%, #0f0f0f 100%), url('${banner}'); background-size: cover; background-position: center;"` : ''}>
            <div class="tp-header-inner">
                <div class="tp-header-badge">${_safeImg(t.badge, t.name, '')}</div>
                <div class="tp-header-info">
                    <h2 class="tp-header-name">${t.name}</h2>
                    <div class="tp-header-sub">${t.league || ''}${t.country ? ' · ' + t.country : ''}</div>
                </div>
                <button class="tp-follow-btn" onclick="this.classList.toggle('tp-following'); this.innerHTML = this.classList.contains('tp-following') ? '<i class=&quot;fas fa-check&quot;></i> Siguiendo' : 'Seguir'">Seguir</button>
            </div>
            <div class="tp-tabs">
                <button class="tp-tab tp-tab-active" data-tab="overview" onclick="switchProfileTab('overview')">Información general</button>
                <button class="tp-tab" data-tab="matches" onclick="switchProfileTab('matches')">Partidos</button>
                <button class="tp-tab" data-tab="standings" onclick="switchProfileTab('standings')">Posiciones</button>
                <button class="tp-tab" data-tab="squad" onclick="switchProfileTab('squad')">Jugadores</button>
            </div>
        </div>
        <div id="tpTabBody" class="tp-tab-body">${renderProfileTab('overview', profile)}</div>
    `;
}

function _formChip(r) {
    const cls = r === 'V' ? 'win' : r === 'D' ? 'loss' : r === 'E' ? 'draw' : 'unknown';
    return `<span class="mp-form-chip mp-form-${cls}" title="${r === 'V' ? 'Victoria' : r === 'D' ? 'Derrota' : r === 'E' ? 'Empate' : '—'}">${r}</span>`;
}

function renderMatchProfileHeader(mp) {
    const home = mp.home || {};
    const away = mp.away || {};
    const main = mp.mainMatch;
    const homeName = home.name || mp.query?.home || '—';
    const awayName = away.name || mp.query?.away || '—';
    const homeBadge = home.badge || (main && main.homeBadge) || '';
    const awayBadge = away.badge || (main && main.awayBadge) || '';

    let scoreOrTime = '';
    let statusLabel = '';
    if (main) {
        if (main.homeScore != null && main.awayScore != null) {
            scoreOrTime = `<div class="mp-score">${main.homeScore} <span>:</span> ${main.awayScore}</div>`;
            statusLabel = main.status === 'Match Finished' || main.status === 'FT' ? 'Finalizado' : (main.status || 'Finalizado');
        } else {
            scoreOrTime = `<div class="mp-vs">VS</div>`;
            statusLabel = main.date ? `${_fmtMatchDate(main.date)}${main.time ? ' · ' + main.time.slice(0, 5) : ''}` : 'Próximamente';
        }
    } else {
        scoreOrTime = `<div class="mp-vs">VS</div>`;
        statusLabel = 'Sin partido programado';
    }

    const leagueLine = main?.league || mp.league?.name || '';
    const venueLine = main?.venue ? `<i class="fas fa-map-marker-alt"></i> ${main.venue}` : '';

    const homeFormHtml = (mp.homeForm || []).map(f => _formChip(f.result)).join('') || '<span class="mp-form-empty">—</span>';
    const awayFormHtml = (mp.awayForm || []).map(f => _formChip(f.result)).join('') || '<span class="mp-form-empty">—</span>';

    const h2hHtml = (mp.headToHead || []).slice(0, 5).map(e => {
        const score = (e.homeScore != null && e.awayScore != null) ? `${e.homeScore} - ${e.awayScore}` : 'Próximo';
        return `
            <li class="mp-h2h-item">
                <span class="mp-h2h-date">${_fmtMatchDate(e.date)}</span>
                <span class="mp-h2h-teams">${e.home} <strong>${score}</strong> ${e.away}</span>
                <span class="mp-h2h-comp">${e.league || ''}</span>
            </li>`;
    }).join('') || '<li class="mp-h2h-empty">Sin enfrentamientos recientes registrados.</li>';

    const standingsRows = (mp.standings || []).map(s => `
        <tr class="${s.isHome ? 'mp-row-home' : ''} ${s.isAway ? 'mp-row-away' : ''}">
            <td>${s.position || ''}</td>
            <td class="mp-stand-team">${_safeImg(s.badge, s.team, 'mp-stand-badge')} <span>${s.team}</span></td>
            <td>${s.played || 0}</td>
            <td>${s.goalDifference >= 0 ? '+' : ''}${s.goalDifference || 0}</td>
            <td><strong>${s.points || 0}</strong></td>
        </tr>`).join('');

    return `
        <div class="mp-card">
            <div class="mp-banner">
                <div class="mp-league-bar">
                    <span class="mp-league-name">${leagueLine || 'Partido'}</span>
                    <span class="mp-status">${statusLabel}</span>
                </div>
                <div class="mp-teams-row">
                    <div class="mp-team mp-team-home">
                        <div class="mp-team-badge">${_safeImg(homeBadge, homeName, '')}</div>
                        <div class="mp-team-name">${homeName}</div>
                        <div class="mp-team-form">${homeFormHtml}</div>
                    </div>
                    <div class="mp-center">
                        ${scoreOrTime}
                        ${venueLine ? `<div class="mp-venue">${venueLine}</div>` : ''}
                    </div>
                    <div class="mp-team mp-team-away">
                        <div class="mp-team-badge">${_safeImg(awayBadge, awayName, '')}</div>
                        <div class="mp-team-name">${awayName}</div>
                        <div class="mp-team-form">${awayFormHtml}</div>
                    </div>
                </div>
            </div>

            ${(mp.headToHead && mp.headToHead.length) ? `
            <div class="mp-section">
                <h3 class="mp-section-title"><i class="fas fa-history"></i> Cara a cara</h3>
                <ul class="mp-h2h-list">${h2hHtml}</ul>
            </div>` : ''}

            ${standingsRows ? `
            <div class="mp-section">
                <h3 class="mp-section-title"><i class="fas fa-list-ol"></i> ${mp.league?.name || 'Tabla'}</h3>
                <table class="mp-standings">
                    <thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>DG</th><th>Pts</th></tr></thead>
                    <tbody>${standingsRows}</tbody>
                </table>
            </div>` : ''}
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

    // Try to fetch a team OR match profile in parallel (Google-style real scraped info)
    _currentTeamProfile = null;
    _currentMatchProfile = null;
    _currentTeamQuery = query;
    _profileTab = 'overview';
    let teamProfilePromise = null;
    let matchProfilePromise = null;
    const matchParts = _parseMatchQuery(query);
    if (matchParts) {
        matchProfilePromise = fetchMatchProfile(matchParts.home, matchParts.away);
    } else if (_shouldTryTeamProfile(query)) {
        teamProfilePromise = fetchTeamProfile(query);
    }
    
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
    _log(`🔍 Buscando: "${searchTerm}" → aliases: [${searchAliases.join(', ')}]`);
    
    // Función para verificar si un nombre coincide con la búsqueda (con abreviaciones)
    const coincideConBusqueda = (nombre) => {
        if (!nombre) return false;
        const nombreNormalizado = normalizarNombre(nombre);
        const aliasesNombre = obtenerAliases(nombreNormalizado);
        
        // Verificar coincidencia directa (mínimo 3 chars para evitar falsos positivos)
        if (searchTerm.length >= 3 && nombreNormalizado.includes(searchTerm)) return true;
        if (searchTerm.length < 3 && nombreNormalizado === searchTerm) return true;
        
        // Verificar coincidencia con aliases de la búsqueda (mínimo 3 chars para evitar "ca" en "Newcastle")
        if (searchAliases.some(alias => alias.length >= 3 && nombreNormalizado.includes(alias))) return true;
        
        // Verificar coincidencia con aliases del nombre (mínimo 3 chars)
        if (aliasesNombre.some(alias => alias.length >= 3 && (searchTerm.includes(alias) || alias.includes(searchTerm)))) return true;
        
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
    
    // Buscar y deduplicar transmisiones de TODAS las APIs combinando canales
    if (transmisionesData && transmisionesData.transmisiones) {
        const uniqueEventsMap = new Map();

        transmisionesData.transmisiones.forEach(transmision => {
            const titulo = normalizarNombre(transmision.titulo || '');
            const liga = normalizarNombre(transmision.liga || '');
            const estado = normalizarNombre(transmision.estado || '');
            const evento = normalizarNombre(transmision.evento || '');
            const deporte = normalizarNombre(transmision.deporte || '');
            const equipo1 = normalizarNombre(transmision.equipo1 || '');
            const equipo2 = normalizarNombre(transmision.equipo2 || '');

            let matches = false;

            // Verificar en título, evento, liga, deporte y equipos directamente
            const camposTexto = [titulo, evento, equipo1, equipo2];
            if (searchTerm.length >= 3) {
                if (camposTexto.some(c => c.includes(searchTerm))) matches = true;
                if (!matches && liga.includes(searchTerm)) matches = true;
                if (!matches && deporte.includes(searchTerm)) matches = true;
            }

            // Verificar con aliases del término buscado
            if (!matches) {
                matches = camposTexto.some(c => c && coincideConBusqueda(c.split(/\s+vs?\.?\s+|\s+x\s+|\s+-\s+/i)[0]) ||
                    coincideConBusqueda(c));
            }

            if (!matches && (searchTerm === 'vivo' || searchTerm === 'en vivo') && (estado.includes('vivo') || estado.includes('live'))) matches = true;
            if (!matches && (searchTerm === 'programado' || searchTerm === 'proximo' || searchTerm === 'próximo') && (estado.includes('programado') || estado.includes('por comenzar'))) matches = true;

            // Partir título/evento por separadores comunes (vs, x, -)
            if (!matches) {
                const textoCompleto = [titulo, evento].filter(Boolean).join(' ');
                const palabras = textoCompleto.split(/\s+vs?\.?\s+|\s+x\s+|\s+-\s+/i);
                for (const p of palabras) {
                    const pt = p.trim();
                    if (pt.length >= 3 && coincideConBusqueda(pt)) { matches = true; break; }
                }
            }
            if (!matches) return;

            const key = normalizarNombre(transmision.titulo || transmision.evento || '');
            if (!key) return;

            if (!uniqueEventsMap.has(key)) {
                uniqueEventsMap.set(key, {
                    ...transmision,
                    titulo: transmision.titulo || transmision.evento || 'Partido',
                    evento: transmision.titulo || transmision.evento || 'Partido',
                    canales: [],
                    logo1: transmision.logo1 || '',
                    logo2: transmision.logo2 || '',
                    equipo1: transmision.equipo1 || '',
                    equipo2: transmision.equipo2 || '',
                    deporte: transmision.deporte || 'Fútbol',
                    hora: transmision.hora || '',
                    estado: transmision.estado || '',
                    liga: transmision.liga || '',
                });
            }

            const existing = uniqueEventsMap.get(key);
            if (transmision.canales && transmision.canales.length > 0) {
                existing.canales = [...existing.canales, ...transmision.canales];
            }
            if (!existing.logo1 && transmision.logo1) existing.logo1 = transmision.logo1;
            if (!existing.logo2 && transmision.logo2) existing.logo2 = transmision.logo2;
            if (!existing.equipo1 && transmision.equipo1) existing.equipo1 = transmision.equipo1;
            if (!existing.equipo2 && transmision.equipo2) existing.equipo2 = transmision.equipo2;
            if (!existing.hora && transmision.hora) existing.hora = transmision.hora;
            const estadoActual = (existing.estado || '').toLowerCase();
            const estadoNuevo = (transmision.estado || '').toLowerCase();
            if (!estadoActual.includes('vivo') && estadoNuevo.includes('vivo')) existing.estado = transmision.estado;
        });

        results.importantMatches = Array.from(uniqueEventsMap.values()).slice(0, 30);
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
    
    // Mostrar transmisiones agrupadas por deporte — diseño grid 2 columnas
    if (results.importantMatches.length > 0) {
        const deporteIconos = {
            'fútbol': 'fas fa-futbol', 'futbol': 'fas fa-futbol',
            'baloncesto': 'fas fa-basketball-ball', 'basketball': 'fas fa-basketball-ball', 'nba': 'fas fa-basketball-ball',
            'hockey': 'fas fa-hockey-puck',
            'béisbol': 'fas fa-baseball-ball', 'beisbol': 'fas fa-baseball-ball',
            'tenis': 'fas fa-table-tennis',
            'ufc': 'fas fa-fist-raised', 'mma': 'fas fa-fist-raised',
            'nfl': 'fas fa-football-ball', 'fútbol americano': 'fas fa-football-ball', 'futbol americano': 'fas fa-football-ball',
            'golf': 'fas fa-golf-ball',
            'ciclismo': 'fas fa-bicycle',
            'boxeo': 'fas fa-fist-raised',
        };

        // Agrupar por deporte
        const bySport = {};
        results.importantMatches.forEach(t => {
            const sport = t.deporte || 'Fútbol';
            if (!bySport[sport]) bySport[sport] = [];
            bySport[sport].push(t);
        });

        Object.entries(bySport).forEach(([sport, items]) => {
            const sportKey = sport.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const sportIcon = deporteIconos[sportKey] || 'fas fa-trophy';
            const hasLive = items.some(i => {
                const s = (i.estado || '').toLowerCase();
                return s.includes('vivo') || s.includes('live');
            });

            html += `
            <div class="sr-group">
                <div class="sr-group-header">
                    <div class="sr-group-bar"></div>
                    <i class="${sportIcon}"></i>
                    <span class="sr-group-name">${sport.toUpperCase()}</span>
                </div>
                <div class="sr-group-sub">${hasLive ? '<span class="sr-live-indicator"><span class="sr-live-dot"></span>EN VIVO</span>' : 'PRÓXIMOS EVENTOS'}</div>
                <div class="sr-grid">`;

            items.forEach(transmision => {
                const estadoAPI = (transmision.estado || '').toLowerCase().trim();
                const isLive = estadoAPI.includes('vivo') || estadoAPI.includes('live');
                const hora = transmision.hora || '';
                const eventName = transmision.evento || transmision.titulo || 'Partido';
                const eq1 = transmision.equipo1 || '';
                const eq2 = transmision.equipo2 || '';
                const logo1 = transmision.logo1 || '';
                const logo2 = transmision.logo2 || '';
                const liga = transmision.liga || sport;
                const canalesCount = transmision.canales?.length || 0;
                const safeEvent = eventName.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                const displayTitle = eq1 && eq2 ? `${eq1} vs ${eq2}` : eventName;

                html += `
                <div class="sr-card ${isLive ? 'sr-card-live' : ''}" onclick='selectImportantMatchByName("${safeEvent}")'>
                    <div class="sr-thumb">
                        <div class="sr-thumb-bg"></div>
                        ${logo1 || logo2 ? `
                        <div class="sr-thumb-logos">
                            ${logo1 ? `<img src="${logo1}" alt="${eq1}" onerror="this.style.display='none'">` : `<div class="sr-thumb-logo-placeholder"><i class="${sportIcon}"></i></div>`}
                            <div class="sr-thumb-vs"><i class="fas fa-bolt"></i></div>
                            ${logo2 ? `<img src="${logo2}" alt="${eq2}" onerror="this.style.display='none'">` : `<div class="sr-thumb-logo-placeholder"><i class="${sportIcon}"></i></div>`}
                        </div>` : `
                        <div class="sr-thumb-icon-only"><i class="${sportIcon}"></i></div>`}
                        ${isLive ? `<div class="sr-thumb-live"><span class="sr-live-dot"></span>EN VIVO</div>` : hora ? `<div class="sr-thumb-time"><i class="far fa-clock"></i> ${hora}</div>` : ''}
                        ${canalesCount > 0 ? `<div class="sr-thumb-servers"><i class="fas fa-play"></i> ${canalesCount}</div>` : ''}
                        <div class="sr-thumb-overlay"></div>
                    </div>
                    <div class="sr-card-body">
                        <div class="sr-card-liga">${liga}</div>
                        <div class="sr-card-title">${displayTitle}</div>
                    </div>
                </div>`;
            });

            html += `</div></div>`;
        });
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
    
    const eventoRef = transmision.evento || transmision.titulo || '';
    let tituloMostrar = transmision.titulo || transmision.evento;

    _combinarCanalesDeAPIs(eventoRef, tituloMostrar, transmision);
}

// ─── Función central: busca el mismo partido en TODAS las APIs y combina canales ─
function _combinarCanalesDeAPIs(eventoRef, tituloMostrar, fallbackTransmision) {
    const apis = [
        { data: transmisionesAPI2, nombre: 'API 2 (e1link)',         fuente: 'e1link'          },
        { data: transmisionesAPI1, nombre: 'API 1 (rereyano)',      fuente: 'rereyano'        },
        { data: transmisionesAPI3, nombre: 'API 3 (voodc)',          fuente: 'voodc'           },
        { data: transmisionesAPI4, nombre: 'API 4 (transmisiones4)', fuente: 'transmisiones4'  },
        { data: transmisionesAPI5, nombre: 'API 5 (donromans)',      fuente: 'donromans'       },
        { data: transmisionesAPI6, nombre: 'API 6 (local)',          fuente: 'transmisiones6'  },
    ];

    let canalesCombinados = [];

    for (const { data, nombre, fuente } of apis) {
        if (!data || !data.transmisiones) continue;

        // Busca TODOS los registros que coincidan (puede haber varios del mismo partido en una API)
        const coincidentes = data.transmisiones.filter(t => _matchesTransmision(eventoRef, t));
        for (const t of coincidentes) {
            if (t.canales && t.canales.length > 0) {
                const etiquetados = t.canales.map(c => ({ ...c, fuente }));
                canalesCombinados = [...canalesCombinados, ...etiquetados];
                _log(`✅ ${etiquetados.length} canales en ${nombre} para "${t.evento || t.titulo}"`);
            }
        }
    }

    // Eliminar canales duplicados (mismo url — también revisamos enlaces[0].url)
    const urlsSeen = new Set();
    canalesCombinados = canalesCombinados.filter(c => {
        const url = c.url || c.src || c.stream_url || c.embed ||
                    (c.enlaces && c.enlaces[0] && c.enlaces[0].url) || '';
        if (!url || urlsSeen.has(url)) return false;
        urlsSeen.add(url);
        return true;
    });

    // Renumerar canales con el mismo nombre para que sean distinguibles
    const nombreCount = {};
    canalesCombinados = canalesCombinados.map(c => {
        const base = c.nombre || 'Servidor';
        nombreCount[base] = (nombreCount[base] || 0) + 1;
        if (nombreCount[base] > 1) return { ...c, nombre: `${base} ${nombreCount[base]}` };
        return c;
    });

    _log(`📺 Total canales combinados de todas las APIs: ${canalesCombinados.length}`);

    if (canalesCombinados.length > 0) {
        showChannelSelector({ evento: tituloMostrar, titulo: tituloMostrar, canales: canalesCombinados }, tituloMostrar);
    } else if (fallbackTransmision && fallbackTransmision.canales && fallbackTransmision.canales.length > 0) {
        showChannelSelector(fallbackTransmision, tituloMostrar);
    } else {
        showToast('No hay canales disponibles para este partido');
    }
}

function selectImportantMatchByName(eventoNombre) {
    closeSearchModal();

    if (!transmisionesData || !transmisionesData.transmisiones) {
        showToast('No hay transmisiones disponibles');
        return;
    }

    // Busca la transmisión base (para metadatos y como fallback)
    const transmision = transmisionesData.transmisiones.find(t => _matchesTransmision(eventoNombre, t));

    if (!transmision) {
        showToast('No se encontró la transmisión');
        return;
    }

    const tituloMostrar = transmision.titulo || transmision.evento;
    _combinarCanalesDeAPIs(eventoNombre, tituloMostrar, transmision);
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
        const response = await fetch(`${API_BASE}/videos`);
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
        _log('Error loading replays:', error);
        container.innerHTML = '<div class="error-message">Error al cargar los mejores momentos</div>';
    }
}

const teamLogosMap = {
    'américa': 'https://a.espncdn.com/i/teamlogos/soccer/500/227.png',
    'america': 'https://a.espncdn.com/i/teamlogos/soccer/500/227.png',
    'club américa': 'https://a.espncdn.com/i/teamlogos/soccer/500/227.png',
    'club america': 'https://a.espncdn.com/i/teamlogos/soccer/500/227.png',
    'atlas': 'https://a.espncdn.com/i/teamlogos/soccer/500/216.png',
    'atlético de san luis': 'https://a.espncdn.com/i/teamlogos/soccer/500/15720.png',
    'atletico de san luis': 'https://a.espncdn.com/i/teamlogos/soccer/500/15720.png',
    'san luis': 'https://a.espncdn.com/i/teamlogos/soccer/500/15720.png',
    'cruz azul': 'https://a.espncdn.com/i/teamlogos/soccer/500/218.png',
    'fc juarez': 'https://a.espncdn.com/i/teamlogos/soccer/500/17851.png',
    'juárez': 'https://a.espncdn.com/i/teamlogos/soccer/500/17851.png',
    'juarez': 'https://a.espncdn.com/i/teamlogos/soccer/500/17851.png',
    'guadalajara': 'https://a.espncdn.com/i/teamlogos/soccer/500/219.png',
    'chivas': 'https://a.espncdn.com/i/teamlogos/soccer/500/219.png',
    'león': 'https://a.espncdn.com/i/teamlogos/soccer/500/228.png',
    'leon': 'https://a.espncdn.com/i/teamlogos/soccer/500/228.png',
    'mazatlán': 'https://a.espncdn.com/i/teamlogos/soccer/500/20702.png',
    'mazatlan': 'https://a.espncdn.com/i/teamlogos/soccer/500/20702.png',
    'mazatlán fc': 'https://a.espncdn.com/i/teamlogos/soccer/500/20702.png',
    'monterrey': 'https://a.espncdn.com/i/teamlogos/soccer/500/220.png',
    'necaxa': 'https://a.espncdn.com/i/teamlogos/soccer/500/229.png',
    'pachuca': 'https://a.espncdn.com/i/teamlogos/soccer/500/234.png',
    'puebla': 'https://a.espncdn.com/i/teamlogos/soccer/500/231.png',
    'pumas': 'https://a.espncdn.com/i/teamlogos/soccer/500/233.png',
    'pumas unam': 'https://a.espncdn.com/i/teamlogos/soccer/500/233.png',
    'querétaro': 'https://a.espncdn.com/i/teamlogos/soccer/500/222.png',
    'queretaro': 'https://a.espncdn.com/i/teamlogos/soccer/500/222.png',
    'santos': 'https://a.espncdn.com/i/teamlogos/soccer/500/225.png',
    'santos laguna': 'https://a.espncdn.com/i/teamlogos/soccer/500/225.png',
    'tigres': 'https://a.espncdn.com/i/teamlogos/soccer/500/232.png',
    'tigres uanl': 'https://a.espncdn.com/i/teamlogos/soccer/500/232.png',
    'tijuana': 'https://a.espncdn.com/i/teamlogos/soccer/500/10125.png',
    'toluca': 'https://a.espncdn.com/i/teamlogos/soccer/500/223.png',
    'arsenal': 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
    'manchester city': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
    'manchester united': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
    'aston villa': 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png',
    'chelsea': 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
    'liverpool': 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
    'brentford': 'https://a.espncdn.com/i/teamlogos/soccer/500/333.png',
    'everton': 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png',
    'afc bournemouth': 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png',
    'bournemouth': 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png',
    'fulham': 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png',
    'sunderland': 'https://a.espncdn.com/i/teamlogos/soccer/500/379.png',
    'newcastle united': 'https://a.espncdn.com/i/teamlogos/soccer/500/23.png',
    'newcastle': 'https://a.espncdn.com/i/teamlogos/soccer/500/23.png',
    'crystal palace': 'https://a.espncdn.com/i/teamlogos/soccer/500/366.png',
    'brighton & hove albion': 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png',
    'brighton': 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png',
    'leeds united': 'https://a.espncdn.com/i/teamlogos/soccer/500/357.png',
    'leeds': 'https://a.espncdn.com/i/teamlogos/soccer/500/357.png',
    'tottenham hotspur': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
    'tottenham': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
    'nottingham forest': 'https://a.espncdn.com/i/teamlogos/soccer/500/374.png',
    'west ham united': 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png',
    'west ham': 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png',
    'burnley': 'https://a.espncdn.com/i/teamlogos/soccer/500/336.png',
    'wolverhampton wanderers': 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png',
    'wolverhampton': 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png',
    'wolves': 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png',
    'barcelona': 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
    'fc barcelona': 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
    'real madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
    'atlético madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
    'atletico madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
    'villarreal': 'https://a.espncdn.com/i/teamlogos/soccer/500/102.png',
    'real betis': 'https://a.espncdn.com/i/teamlogos/soccer/500/88.png',
    'celta vigo': 'https://a.espncdn.com/i/teamlogos/soccer/500/3728.png',
    'celta': 'https://a.espncdn.com/i/teamlogos/soccer/500/3728.png',
    'espanyol': 'https://a.espncdn.com/i/teamlogos/soccer/500/3727.png',
    'real sociedad': 'https://a.espncdn.com/i/teamlogos/soccer/500/89.png',
    'getafe': 'https://a.espncdn.com/i/teamlogos/soccer/500/3842.png',
    'athletic club': 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png',
    'athletic bilbao': 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png',
    'osasuna': 'https://a.espncdn.com/i/teamlogos/soccer/500/3785.png',
    'valencia': 'https://a.espncdn.com/i/teamlogos/soccer/500/97.png',
    'rayo vallecano': 'https://a.espncdn.com/i/teamlogos/soccer/500/91.png',
    'sevilla': 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png',
    'girona': 'https://a.espncdn.com/i/teamlogos/soccer/500/9812.png',
    'alavés': 'https://a.espncdn.com/i/teamlogos/soccer/500/3808.png',
    'alaves': 'https://a.espncdn.com/i/teamlogos/soccer/500/3808.png',
    'elche': 'https://a.espncdn.com/i/teamlogos/soccer/500/3761.png',
    'mallorca': 'https://a.espncdn.com/i/teamlogos/soccer/500/3805.png',
    'levante': 'https://a.espncdn.com/i/teamlogos/soccer/500/2922.png',
    'real oviedo': 'https://a.espncdn.com/i/teamlogos/soccer/500/3736.png',
    'internazionale': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
    'inter': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
    'inter milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
    'ac milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
    'milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
    'napoli': 'https://a.espncdn.com/i/teamlogos/soccer/500/3590.png',
    'como': 'https://a.espncdn.com/i/teamlogos/soccer/500/3580.png',
    'as roma': 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
    'roma': 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
    'juventus': 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png',
    'atalanta': 'https://a.espncdn.com/i/teamlogos/soccer/500/3556.png',
    'bologna': 'https://a.espncdn.com/i/teamlogos/soccer/500/3576.png',
    'sassuolo': 'https://a.espncdn.com/i/teamlogos/soccer/500/3597.png',
    'lazio': 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',
    'udinese': 'https://a.espncdn.com/i/teamlogos/soccer/500/3601.png',
    'parma': 'https://a.espncdn.com/i/teamlogos/soccer/500/3593.png',
    'genoa': 'https://a.espncdn.com/i/teamlogos/soccer/500/3586.png',
    'cagliari': 'https://a.espncdn.com/i/teamlogos/soccer/500/3578.png',
    'torino': 'https://a.espncdn.com/i/teamlogos/soccer/500/3600.png',
    'lecce': 'https://a.espncdn.com/i/teamlogos/soccer/500/3589.png',
    'fiorentina': 'https://a.espncdn.com/i/teamlogos/soccer/500/108.png',
    'cremonese': 'https://a.espncdn.com/i/teamlogos/soccer/500/3582.png',
    'hellas verona': 'https://a.espncdn.com/i/teamlogos/soccer/500/3588.png',
    'verona': 'https://a.espncdn.com/i/teamlogos/soccer/500/3588.png',
    'pisa': 'https://a.espncdn.com/i/teamlogos/soccer/500/3594.png',
    'bayern munich': 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
    'bayern': 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
    'borussia dortmund': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
    'dortmund': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
    'tsg hoffenheim': 'https://a.espncdn.com/i/teamlogos/soccer/500/5859.png',
    'hoffenheim': 'https://a.espncdn.com/i/teamlogos/soccer/500/5859.png',
    'vfb stuttgart': 'https://a.espncdn.com/i/teamlogos/soccer/500/127.png',
    'stuttgart': 'https://a.espncdn.com/i/teamlogos/soccer/500/127.png',
    'rb leipzig': 'https://a.espncdn.com/i/teamlogos/soccer/500/23603.png',
    'leipzig': 'https://a.espncdn.com/i/teamlogos/soccer/500/23603.png',
    'bayer leverkusen': 'https://a.espncdn.com/i/teamlogos/soccer/500/126.png',
    'leverkusen': 'https://a.espncdn.com/i/teamlogos/soccer/500/126.png',
    'eintracht frankfurt': 'https://a.espncdn.com/i/teamlogos/soccer/500/128.png',
    'frankfurt': 'https://a.espncdn.com/i/teamlogos/soccer/500/128.png',
    'sc freiburg': 'https://a.espncdn.com/i/teamlogos/soccer/500/2715.png',
    'freiburg': 'https://a.espncdn.com/i/teamlogos/soccer/500/2715.png',
    'fc augsburg': 'https://a.espncdn.com/i/teamlogos/soccer/500/11413.png',
    'augsburg': 'https://a.espncdn.com/i/teamlogos/soccer/500/11413.png',
    'hamburg sv': 'https://a.espncdn.com/i/teamlogos/soccer/500/130.png',
    'hamburg': 'https://a.espncdn.com/i/teamlogos/soccer/500/130.png',
    '1. fc union berlin': 'https://a.espncdn.com/i/teamlogos/soccer/500/28007.png',
    'union berlin': 'https://a.espncdn.com/i/teamlogos/soccer/500/28007.png',
    'borussia mönchengladbach': 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png',
    'borussia monchengladbach': 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png',
    'mönchengladbach': 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png',
    'gladbach': 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png',
    'werder bremen': 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png',
    'werder': 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png',
    'fc cologne': 'https://a.espncdn.com/i/teamlogos/soccer/500/133.png',
    'cologne': 'https://a.espncdn.com/i/teamlogos/soccer/500/133.png',
    'köln': 'https://a.espncdn.com/i/teamlogos/soccer/500/133.png',
    'koln': 'https://a.espncdn.com/i/teamlogos/soccer/500/133.png',
    'mainz': 'https://a.espncdn.com/i/teamlogos/soccer/500/5857.png',
    'st. pauli': 'https://a.espncdn.com/i/teamlogos/soccer/500/3770.png',
    'st pauli': 'https://a.espncdn.com/i/teamlogos/soccer/500/3770.png',
    'vfl wolfsburg': 'https://a.espncdn.com/i/teamlogos/soccer/500/7429.png',
    'wolfsburg': 'https://a.espncdn.com/i/teamlogos/soccer/500/7429.png',
    '1. fc heidenheim 1846': 'https://a.espncdn.com/i/teamlogos/soccer/500/26600.png',
    'heidenheim': 'https://a.espncdn.com/i/teamlogos/soccer/500/26600.png',
    'paris saint-germain': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
    'psg': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
    'lens': 'https://a.espncdn.com/i/teamlogos/soccer/500/154.png',
    'rc lens': 'https://a.espncdn.com/i/teamlogos/soccer/500/154.png',
    'marseille': 'https://a.espncdn.com/i/teamlogos/soccer/500/156.png',
    'om': 'https://a.espncdn.com/i/teamlogos/soccer/500/156.png',
    'lyon': 'https://a.espncdn.com/i/teamlogos/soccer/500/157.png',
    'ol': 'https://a.espncdn.com/i/teamlogos/soccer/500/157.png',
    'stade rennais': 'https://a.espncdn.com/i/teamlogos/soccer/500/161.png',
    'rennes': 'https://a.espncdn.com/i/teamlogos/soccer/500/161.png',
    'lille': 'https://a.espncdn.com/i/teamlogos/soccer/500/155.png',
    'losc': 'https://a.espncdn.com/i/teamlogos/soccer/500/155.png',
    'as monaco': 'https://a.espncdn.com/i/teamlogos/soccer/500/162.png',
    'monaco': 'https://a.espncdn.com/i/teamlogos/soccer/500/162.png',
    'strasbourg': 'https://a.espncdn.com/i/teamlogos/soccer/500/164.png',
    'rc strasbourg': 'https://a.espncdn.com/i/teamlogos/soccer/500/164.png',
    'brest': 'https://a.espncdn.com/i/teamlogos/soccer/500/508.png',
    'lorient': 'https://a.espncdn.com/i/teamlogos/soccer/500/3767.png',
    'angers': 'https://a.espncdn.com/i/teamlogos/soccer/500/144.png',
    'toulouse': 'https://a.espncdn.com/i/teamlogos/soccer/500/165.png',
    'paris fc': 'https://a.espncdn.com/i/teamlogos/soccer/500/3769.png',
    'le havre': 'https://a.espncdn.com/i/teamlogos/soccer/500/3764.png',
    'le havre ac': 'https://a.espncdn.com/i/teamlogos/soccer/500/3764.png',
    'nice': 'https://a.espncdn.com/i/teamlogos/soccer/500/159.png',
    'ogc nice': 'https://a.espncdn.com/i/teamlogos/soccer/500/159.png',
    'aj auxerre': 'https://a.espncdn.com/i/teamlogos/soccer/500/143.png',
    'auxerre': 'https://a.espncdn.com/i/teamlogos/soccer/500/143.png',
    'nantes': 'https://a.espncdn.com/i/teamlogos/soccer/500/158.png',
    'fc nantes': 'https://a.espncdn.com/i/teamlogos/soccer/500/158.png',
    'metz': 'https://a.espncdn.com/i/teamlogos/soccer/500/3765.png',
    'fc metz': 'https://a.espncdn.com/i/teamlogos/soccer/500/3765.png',
};

function getTeamLogo(nombre) {
    if (!nombre) return '';
    const key = nombre.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalized = nombre.toLowerCase().trim();
    if (teamLogosMap[normalized]) return teamLogosMap[normalized];
    if (teamLogosMap[key]) return teamLogosMap[key];
    for (const [k, v] of Object.entries(teamLogosMap)) {
        if (normalized.includes(k) || k.includes(normalized)) return v;
    }
    return '';
}

async function loadStandings() {
    const standingsTable = document.getElementById('standingsTable');
    if (!standingsTable) return;

    standingsTable.innerHTML = `
        <div class="standings-loading">
            <div class="standings-spinner"></div>
            <span>Cargando posiciones…</span>
        </div>`;

    try {
        const leagueConfig = leaguesConfig[currentLeague];
        const endpoint = leagueConfig ? leagueConfig.tabla : '/tabla';
        if (!endpoint) {
            standingsTable.innerHTML = `<div class="standings-loading">Tabla no disponible para esta liga.</div>`;
            return;
        }

        const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, 8000);
        const data = await response.json();

        if (!data.tabla || data.tabla.length === 0) {
            standingsTable.innerHTML = '<div class="standings-loading">No hay datos de tabla disponibles</div>';
            return;
        }

        const equipos = data.tabla.sort((a, b) => a.posicion - b.posicion);

        // Determine zone thresholds based on league
        const isLigaMX = currentLeague === 'Liga MX';
        const directZone  = isLigaMX ? 6  : 4;
        const playinZone  = isLigaMX ? 10 : 6;

        function getZoneClass(index) {
            if (index === 0)               return 'zona-lider';
            if (index < directZone)        return 'zona-calificacion-directa';
            if (index < playinZone)        return 'zona-repechaje';
            return 'zona-media';
        }

        function buildSep(type, label) {
            return `
            <div class="standings-zone-sep sep-${type}">
                <div class="standings-zone-line"></div>
                <span class="standings-zone-label">${label}</span>
                <div class="standings-zone-line"></div>
            </div>`;
        }

        let rowsHtml = '';
        let prevZone = null;

        equipos.forEach((equipo, index) => {
            const zone = getZoneClass(index);
            const logoUrl = equipo.logo || getTeamLogo(equipo.equipo);
            const pts = equipo.estadisticas?.pts || 0;
            const pj  = equipo.estadisticas?.pj  || 0;
            const pg  = equipo.estadisticas?.pg  || 0;
            const pe  = equipo.estadisticas?.pe  || 0;
            const pp  = equipo.estadisticas?.pp  || 0;

            // Zone separators
            if (index > 0 && zone !== prevZone) {
                if (zone === 'zona-repechaje') {
                    rowsHtml += buildSep('playin', isLigaMX ? 'Play-In' : 'Europa League');
                } else if (zone === 'zona-media') {
                    rowsHtml += buildSep('elim', 'Eliminados');
                }
            }
            prevZone = zone;

            // Team logo
            const logoEl = logoUrl
                ? `<img src="${logoUrl}" alt="${equipo.equipo}" class="team-logo-small" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                : '';
            const ph = `<div class="team-logo-placeholder" style="${logoUrl ? 'display:none' : ''}">${(equipo.equipo||'').substring(0,2).toUpperCase()}</div>`;

            rowsHtml += `
            <div class="standings-row ${zone}" style="animation-delay:${index * 0.04}s">
                <div class="pos">
                    <span class="pos-number">${equipo.posicion || index + 1}</span>
                </div>
                <div class="team-cell">
                    ${logoEl}${ph}
                    <div class="team-info-standings">
                        <div class="team-name-standings">${equipo.equipo}</div>
                    </div>
                </div>
                <div class="stat">${pj}</div>
                <div class="stat">${pg}</div>
                <div class="stat">${pp}</div>
                <div class="stat points">${pts}</div>
            </div>`;
        });

        standingsTable.innerHTML = `
            <div class="standings-col-header">
                <div class="sh-num">#</div>
                <div class="sh-team">Equipo</div>
                <div class="sh-num">PJ</div>
                <div class="sh-num">G</div>
                <div class="sh-num">P</div>
                <div class="sh-num">PTS</div>
            </div>
            ${rowsHtml}
        `;

    } catch (error) {
        _log('Error loading standings:', error);
        standingsTable.innerHTML = '<div class="standings-loading">Error al cargar la tabla. Intenta de nuevo.</div>';
    }
}

async function loadNews() {
    try {
        const leagueConfig = leaguesConfig[currentLeague];
        const endpoint = leagueConfig ? leagueConfig.noticias : '/noticias';
        const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, 8000);
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
        _log('Error loading news:', error);
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

function switchStandingsTab(tab, element) {
    const tabs = document.querySelectorAll('.standings-tab');
    tabs.forEach(t => t.classList.remove('active'));
    element.classList.add('active');

    const table = document.getElementById('standingsTable');
    const results = document.getElementById('resultsContainer');

    if (tab === 'table') {
        table.style.display = 'block';
        results.style.display = 'none';
        loadStandings();
    } else {
        table.style.display = 'none';
        results.style.display = 'block';
        loadResults();
    }
}

async function loadResults() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '<div class="standings-loading">Cargando últimos resultados...</div>';

    try {
        const response = await fetch(`${API_BASE}/resultados/todas-las-ligas`);
        const data = await response.json();

        if (!data || !data.success || !data.resultados || data.resultados.length === 0) {
            container.innerHTML = '<div class="no-results">No hay resultados recientes.</div>';
            return;
        }

        // Si la liga actual es "Liga MX", "Premier League", etc., filtramos solo para esa liga.
        // Si no hay filtro (Todas las Ligas), mostramos todo.
        displayCategorizedResults(data.resultados, currentLeague);
    } catch (error) {
        _log('Error cargando resultados:', error);
        container.innerHTML = '<div class="error-message">Error al cargar resultados globales.</div>';
    }
}

function displayCategorizedResults(resultadosPorFecha, leagueFilter) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    let totalMatchesFound = 0;

    // Recorremos todas las fechas disponibles en la API
    resultadosPorFecha.forEach((dia, index) => {
        let hasMatchesThisDay = false;
        const dateSection = document.createElement('div');
        dateSection.className = 'results-date-group';
        
        const dateHeader = document.createElement('div');
        dateHeader.className = 'results-date-header';
        dateHeader.innerHTML = `<span>Resultados del ${formatDateString(dia.fecha)}</span>`;
        dateSection.appendChild(dateHeader);

        dia.ligas.forEach(ligaData => {
            if (leagueFilter && leagueFilter !== 'Todas las Ligas' && ligaData.liga !== leagueFilter) {
                return;
            }

            const allMatches = [
                ...(ligaData.en_vivo || []).map(m => ({ ...m, statusType: 'LIVE' })),
                ...(ligaData.finalizados || []).map(m => ({ ...m, statusType: 'FT' })),
                ...(ligaData.programados || []).map(m => ({ ...m, statusType: 'SCHEDULED' }))
            ];

            if (allMatches.length === 0) return;
            hasMatchesThisDay = true;
            totalMatchesFound += allMatches.length;

            const leagueSection = document.createElement('div');
            leagueSection.className = 'league-results-section';
            
            if (!leagueFilter || leagueFilter === 'Todas las Ligas') {
                leagueSection.innerHTML = `<h4 class="league-results-title">${ligaData.liga}</h4>`;
            }

            allMatches.forEach(match => {
                const card = document.createElement('div');
                card.className = `result-card ${match.statusType.toLowerCase()}`;
                
                const homeLogo = match.local.logo || 'https://via.placeholder.com/35';
                const awayLogo = match.visitante.logo || 'https://via.placeholder.com/35';
                
                let statusBadge = match.reloj || match.estado.descripcion;
                if (match.statusType === 'LIVE') {
                    statusBadge = `<span class="live-dot"></span> ${match.reloj}`;
                }

                card.innerHTML = `
                    <div class="result-header">
                        <span>${match.detalles.estadio || ligaData.liga}</span>
                        <span class="status-badge">${statusBadge}</span>
                    </div>
                    <div class="result-teams">
                        <div class="result-team">
                            <img src="${homeLogo}" alt="${match.local.nombre}">
                            <span>${match.local.nombre}</span>
                        </div>
                        <div class="result-score">
                            ${match.local.marcador} - ${match.visitante.marcador}
                        </div>
                        <div class="result-team">
                            <img src="${awayLogo}" alt="${match.visitante.nombre}">
                            <span>${match.visitante.nombre}</span>
                        </div>
                    </div>
                `;
                leagueSection.appendChild(card);
            });
            dateSection.appendChild(leagueSection);
        });

        if (hasMatchesThisDay) {
            container.appendChild(dateSection);
        }
    });

    if (totalMatchesFound === 0) {
        container.innerHTML = `<div class="no-results">No hay resultados disponibles para ${leagueFilter || 'esta liga'} en los últimos días.</div>`;
    }
}

function formatDateString(dateStr) {
    // Formato YYYYMMDD a DD/MM/YYYY
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
}

function selectLeague(leagueName, element) {
    document.querySelectorAll('.league-btn, .lbar-btn').forEach(btn => btn.classList.remove('active'));
    
    if (element) {
        element.classList.add('active');
    } else {
        document.querySelectorAll('.league-btn, .lbar-btn').forEach(btn => {
            const btnText = btn.querySelector('span')?.textContent || '';
            if (btnText === leagueName || btnText.includes(leagueName.split(' ')[0])) {
                btn.classList.add('active');
            }
        });
    }
    
    currentLeague = leagueName;
    
    const standingsTitle = document.getElementById('standingsLeagueName');
    if (standingsTitle) {
        standingsTitle.textContent = `TABLA DE POSICIONES - ${leagueName}`;
    }

    // Reset tabs when switching leagues
    const tabs = document.querySelectorAll('.standings-tab');
    if (tabs.length > 0) {
        tabs.forEach(t => t.classList.remove('active'));
        tabs[0].classList.add('active');
        document.getElementById('standingsTable').style.display = 'block';
        document.getElementById('resultsContainer').style.display = 'none';
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

function openSponsorModal() {
    const modal = document.getElementById('sponsorModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSponsorModal(e) {
    if (e && e.target !== document.getElementById('sponsorModal') && !e.target.classList.contains('sponsor-modal-close')) return;
    const modal = document.getElementById('sponsorModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openTacosModal() {
    const modal = document.getElementById('tacosModal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeTacosModal(e) {
    if (e && e.target !== document.getElementById('tacosModal') && !e.target.classList.contains('tacos-modal-close')) return;
    const modal = document.getElementById('tacosModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// ── Auto-show sponsor modal for international visitors ──────────────────────
(async function initIntlSponsorPromo() {
    // Only trigger once per session, never for returning closers
    const SK = 'ug_sponsor_shown';
    if (sessionStorage.getItem(SK)) return;

    try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 4000);
        const r = await fetch('/api/geo', { signal: ctrl.signal });
        if (!r.ok) return;
        const data = await r.json();
        const country = (data.country_code || '').toUpperCase();

        // Show for everyone EXCEPT Mexico (MX)
        if (country === 'MX' || !country) return;

        // Update modal stat to reflect international reach
        const statNum = document.querySelector('.sponsor-stat-num');
        if (statNum) statNum.textContent = '50K+';

        // Inject country-aware badge into the modal
        const badge = document.querySelector('.sponsor-modal-badge');
        if (badge && country) {
            const flag = country.split('').map(c =>
                String.fromCodePoint(c.charCodeAt(0) + 127397)
            ).join('');
            badge.innerHTML = `<span class="sponsor-badge-dot"></span>${flag} Visitante Internacional`;
        }

        // Mark as shown so it only fires once
        sessionStorage.setItem(SK, '1');

        // Wait 30 s then open with a smooth entrance
        setTimeout(() => {
            const modal = document.getElementById('sponsorModal');
            if (!modal || modal.classList.contains('active')) return;
            openSponsorModal();
        }, 30000);

    } catch (_) {
        // Silently ignore network errors — no disruption to users
    }
})();

async function loadImportantMatches() {
    try {
        if (!transmisionesData || !transmisionesData.transmisiones) {
            await loadTransmisiones();
        }
        
        renderImportantMatches();
    } catch (error) {
        _log('Error cargando partidos importantes:', error);
        showNoMatchesMessage();
    }
}

// Carousel state (kept for compatibility)
let carouselCurrentIndex = 0;
let carouselTotalItems = 0;
let carouselTouchStartX = 0;
let carouselTouchEndX = 0;

// Rokc list state
let selectedDayIndex = 0;
let rokczoneDays = [];

function renderImportantMatches() {
    const body = document.getElementById('importantMatchesBody');

    if (!transmisionesData || !transmisionesData.transmisiones || transmisionesData.transmisiones.length === 0) {
        showNoMatchesMessage();
        return;
    }

    let currentItems = transmisionesData.transmisiones.filter(t => t.tipoAPI === 'donromans');

    if (isLiveFilterActive) {
        currentItems = currentItems.filter(t => {
            const estadoAPI = (t.estado || '').toLowerCase().trim();
            return estadoAPI.includes('vivo') || estadoAPI.includes('live') || estadoAPI === 'en vivo';
        });
    }

    currentItems.sort((a, b) => {
        const aDate = a.fecha ? new Date(a.fecha) : null;
        const bDate = b.fecha ? new Date(b.fecha) : null;
        if (aDate && bDate) return aDate - bDate;
        return 0;
    });

    // Sport background photo map (Unsplash CDN)
    const SPORT_BG = {
        basketball: 'https://images.unsplash.com/photo-1546519638405-a9d1b947c4b8?w=700&q=65&fit=crop&auto=format',
        nba:        'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=700&q=65&fit=crop&auto=format',
        soccer:     'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=700&q=65&fit=crop&auto=format',
        boxing:     'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=700&q=65&fit=crop&auto=format',
        nfl:        'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=700&q=65&fit=crop&auto=format',
        tennis:     'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=700&q=65&fit=crop&auto=format',
        baseball:   'https://images.unsplash.com/photo-1509924603848-aca5e5f276d7?w=700&q=65&fit=crop&auto=format',
        racing:     'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=700&q=65&fit=crop&auto=format',
        default:    'https://images.unsplash.com/photo-1521731978332-9e9e714bdd20?w=700&q=65&fit=crop&auto=format',
    };

    const rowsHTML = currentItems.map((t, idx) => {
        const estadoAPI = (t.estado || '').toLowerCase().trim();
        const isDonRomans = t.tipoAPI === 'donromans';
        const isLive = isDonRomans || estadoAPI.includes('vivo') || estadoAPI.includes('live');

        const deporte = (t.deporte || 'fútbol').toLowerCase();
        const ligaRaw = (t.liga || t.deporte || '').toLowerCase();

        let sportIcon = 'fa-futbol';
        let sportBg   = SPORT_BG.soccer;

        if (deporte.includes('basket') || ligaRaw.includes('nba')) {
            sportIcon = 'fa-basketball-ball';
            sportBg   = ligaRaw.includes('nba') ? SPORT_BG.nba : SPORT_BG.basketball;
        } else if (deporte.includes('moto') || deporte.includes('f1') || deporte.includes('formula')) {
            sportIcon = 'fa-flag-checkered';
            sportBg   = SPORT_BG.racing;
        } else if (deporte.includes('tenis') || deporte.includes('tennis')) {
            sportIcon = 'fa-table-tennis';
            sportBg   = SPORT_BG.tennis;
        } else if (deporte.includes('beisbol') || deporte.includes('baseball')) {
            sportIcon = 'fa-baseball-ball';
            sportBg   = SPORT_BG.baseball;
        } else if (deporte.includes('box') || deporte.includes('ufc') || deporte.includes('mma') || ligaRaw.includes('wwe') || ligaRaw.includes('box')) {
            sportIcon = 'fa-fist-raised';
            sportBg   = SPORT_BG.boxing;
        } else if (deporte.includes('americano') || ligaRaw.includes('nfl')) {
            sportIcon = 'fa-football-ball';
            sportBg   = SPORT_BG.nfl;
        } else if (deporte.includes('futbol') || deporte.includes('fútbol') || deporte.includes('soccer') || ligaRaw.includes('liga')) {
            sportBg = SPORT_BG.soccer;
        } else {
            sportBg = SPORT_BG.default;
        }

        const liga = t.liga || t.deporte || '';
        const evento = t.evento || t.titulo || '';
        const eventoEscapado = evento.replace(/'/g, "\\'");

        const vsSplit = evento.split(/\s+vs\.?\s+/i);
        const equipo1 = (vsSplit[0] || evento).trim();
        const equipo2 = (vsSplit[1] || '').trim();

        const statusBadge = isLive
            ? `<span class="rim-live"><span class="rim-dot"></span>EN VIVO</span>`
            : t.fecha ? (() => { try { const d = new Date(t.fecha); return isNaN(d) ? '' : `<span class="rim-time"><i class="far fa-clock"></i> ${d.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</span>`; } catch(e){ return ''; } })() : '';

        const ligaBadge = liga ? `<span class="rim-liga"><i class="fas ${sportIcon}"></i> ${liga.toUpperCase()}</span>` : '';

        const entranceDelay = (idx * 45) + 'ms';

        return `
            <div class="rim-card ${isLive ? 'live' : ''}"
                 style="animation-delay:${entranceDelay};background-image:url('${sportBg}')"
                 tabindex="0" role="button"
                 aria-label="${evento}"
                 onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectImportantMatchByTransmision('${eventoEscapado}')}"
                 onclick='selectImportantMatchByTransmision("${eventoEscapado}")'>
                <div class="rim-bg-overlay"></div>
                <div class="rim-teams">
                    <div class="rim-team">
                        <div class="rim-logo-box">
                            <img class="rim-logo" src="/ULTRA/favicon.png" alt="${equipo1}" data-team="${encodeURIComponent(equipo1)}">
                        </div>
                        <span class="rim-name">${equipo1.toUpperCase()}</span>
                    </div>
                    <div class="rim-vs-col">
                        <span class="rim-vs">VS</span>
                    </div>
                    <div class="rim-team rim-team-right">
                        <span class="rim-name">${equipo2.toUpperCase()}</span>
                        <div class="rim-logo-box">
                            <img class="rim-logo" src="/ULTRA/favicon.png" alt="${equipo2}" data-team="${encodeURIComponent(equipo2)}">
                        </div>
                    </div>
                </div>
                <div class="rim-footer-row">
                    <div class="rim-badges">${statusBadge}${ligaBadge}</div>
                    <i class="fas fa-chevron-right rim-chevron"></i>
                </div>
            </div>
        `;
    }).join('') || `<div class="rim-empty"><i class="fas fa-satellite-dish"></i><p>No hay partidos en este momento</p></div>`;

    body.innerHTML = `
        <style>
            /* ── Wrapper & scroll ── */
            .rokc-wrapper{width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;background:#08080c;}
            .rokc-list{flex:1;overflow-y:auto;padding:12px 12px 4px;display:flex;flex-direction:column;gap:9px;}
            .rokc-list::-webkit-scrollbar{width:2px;}
            .rokc-list::-webkit-scrollbar-thumb{background:rgba(255,107,53,0.3);border-radius:2px;}

            /* ── Base card ── */
            @keyframes rimIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
            @keyframes rimPulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(255,64,64,.55);}50%{opacity:.6;box-shadow:0 0 0 5px rgba(255,64,64,0);}}

            .rim-card{
                border:1px solid rgba(255,255,255,0.1);
                border-radius:18px;
                padding:16px 14px 13px 18px;
                cursor:pointer;
                position:relative;
                overflow:hidden;
                background-size:cover;
                background-position:center;
                background-color:#111;
                transition:border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
                animation:rimIn 0.38s ease both;
                min-height:88px;
            }
            /* top shimmer line */
            .rim-card::before{
                content:'';position:absolute;top:0;left:0;right:0;height:1px;z-index:2;
                background:linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.18) 50%,transparent 90%);
            }
            /* left accent bar */
            .rim-card::after{
                content:'';position:absolute;top:12px;bottom:12px;left:0;z-index:3;
                width:3.5px;border-radius:0 3px 3px 0;
                background:rgba(255,255,255,0.2);
                transition:background 0.2s ease, box-shadow 0.2s ease, width 0.2s ease;
            }
            .rim-card.live::after{
                background:linear-gradient(180deg,#ff6b35,#ff3d00);
                box-shadow:0 0 14px rgba(255,69,0,0.8);
            }
            .rim-card.live{
                border-color:rgba(255,107,53,0.35);
                box-shadow:0 0 28px rgba(255,69,0,0.12);
            }
            .rim-card:hover{
                border-color:rgba(255,255,255,0.22);
                transform:translateY(-2px) scale(1.005);
                box-shadow:0 12px 36px rgba(0,0,0,0.55);
            }
            .rim-card:hover::after{ width:4.5px; }
            .rim-card.live:hover{
                border-color:rgba(255,107,53,0.55);
                box-shadow:0 12px 36px rgba(255,69,0,0.2);
            }
            .rim-card:active{transform:scale(0.985);opacity:0.92;}

            /* ── Photo overlay ── */
            .rim-bg-overlay{
                position:absolute;inset:0;z-index:1;pointer-events:none;border-radius:inherit;
                background:linear-gradient(
                    105deg,
                    rgba(0,0,0,0.88) 0%,
                    rgba(0,0,0,0.72) 45%,
                    rgba(0,0,0,0.55) 70%,
                    rgba(0,0,0,0.72) 100%
                );
            }
            .rim-card.live .rim-bg-overlay{
                background:linear-gradient(
                    105deg,
                    rgba(12,4,0,0.92) 0%,
                    rgba(20,6,0,0.75) 45%,
                    rgba(0,0,0,0.58) 70%,
                    rgba(0,0,0,0.75) 100%
                );
            }

            /* ── Team row ── */
            .rim-teams{display:flex;align-items:center;gap:6px;margin-bottom:10px;position:relative;z-index:2;}
            .rim-team{display:flex;align-items:center;gap:8px;flex:1;min-width:0;}
            .rim-team-right{justify-content:flex-end;}

            .rim-logo-box{
                width:36px;height:36px;border-radius:10px;
                background:rgba(0,0,0,0.45);
                border:1px solid rgba(255,255,255,0.18);
                backdrop-filter:blur(6px);
                display:flex;align-items:center;justify-content:center;
                flex-shrink:0;overflow:hidden;
            }
            .rim-logo{width:28px;height:28px;object-fit:contain;opacity:0.3;transition:opacity 0.35s ease;}
            .rim-logo.loaded{opacity:1;}

            .rim-name{
                font-size:14px;font-weight:900;color:#ffffff;
                letter-spacing:0.4px;line-height:1.2;
                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                text-shadow:0 1px 8px rgba(0,0,0,0.9),0 0 20px rgba(0,0,0,0.7);
            }
            .rim-team.rim-team-right .rim-name{text-align:right;}

            .rim-vs-col{flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:0 4px;}
            .rim-vs{
                font-size:10px;font-weight:900;letter-spacing:1.4px;
                color:#ffffff;
                background:rgba(255,107,53,0.75);
                border:none;
                border-radius:6px;
                padding:4px 8px;
                text-shadow:none;
                box-shadow:0 2px 10px rgba(255,69,0,0.5);
            }

            /* ── Footer row ── */
            .rim-footer-row{display:flex;align-items:center;justify-content:space-between;gap:8px;position:relative;z-index:2;}
            .rim-badges{display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-width:0;}

            .rim-live{
                display:inline-flex;align-items:center;gap:5px;
                background:rgba(200,0,0,0.55);
                border:1px solid rgba(255,60,60,0.5);
                backdrop-filter:blur(8px);
                border-radius:20px;padding:3px 9px;
                font-size:9.5px;font-weight:800;color:#fff;
                letter-spacing:0.8px;text-transform:uppercase;
                box-shadow:0 2px 10px rgba(255,0,0,0.3);
            }
            .rim-dot{
                width:5px;height:5px;background:#ff5555;border-radius:50%;
                animation:rimPulse 1.2s ease-in-out infinite;
                flex-shrink:0;box-shadow:0 0 5px rgba(255,60,60,0.9);
            }
            .rim-time{
                display:inline-flex;align-items:center;gap:4px;
                font-size:9.5px;font-weight:600;color:rgba(255,255,255,0.75);
                background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.18);
                backdrop-filter:blur(8px);
                border-radius:20px;padding:3px 9px;
            }
            .rim-liga{
                display:inline-flex;align-items:center;gap:4px;
                background:rgba(0,0,0,0.45);
                border:1px solid rgba(255,255,255,0.2);
                backdrop-filter:blur(8px);
                border-radius:20px;padding:3px 9px;
                font-size:9.5px;font-weight:700;color:rgba(255,200,150,0.95);
                letter-spacing:0.3px;
                max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
            }
            .rim-liga i{font-size:8px;flex-shrink:0;}
            .rim-chevron{
                font-size:13px;color:rgba(255,255,255,0.55);flex-shrink:0;
                transition:color 0.18s ease, transform 0.18s ease;
                text-shadow:0 1px 6px rgba(0,0,0,0.8);
            }
            .rim-card:hover .rim-chevron{color:#ff8a50;transform:translateX(3px);}

            /* ── Empty state ── */
            .rim-empty{
                text-align:center;color:rgba(255,255,255,0.25);
                padding:60px 20px;font-size:14px;
                display:flex;flex-direction:column;align-items:center;gap:14px;
            }
            .rim-empty i{font-size:36px;color:rgba(255,255,255,0.1);}
            .rim-empty p{font-size:13px;}

            /* ── Footer ── */
            .rokc-footer{padding:12px 12px 16px;background:#08080c;border-top:1px solid rgba(255,255,255,0.06);flex-shrink:0;}
            .rokc-footer::before{
                content:'';display:block;height:1px;margin-bottom:12px;
                background:linear-gradient(90deg,transparent,rgba(255,107,53,0.2),transparent);
            }
            .rokc-footer-btn{
                display:flex;align-items:center;justify-content:center;gap:9px;
                width:100%;padding:13px 16px;border-radius:14px;
                border:1px solid rgba(255,107,53,0.3);
                background:rgba(255,107,53,0.08);
                color:#ff8a50;font-size:13px;font-weight:700;
                cursor:pointer;transition:all 0.2s;letter-spacing:0.3px;
            }
            .rokc-footer-btn:hover{background:rgba(255,107,53,0.14);border-color:rgba(255,107,53,0.5);}
            .rokc-footer-btn:active{transform:scale(0.98);}
            .rokc-footer-btn i{font-size:13px;}
            .rokc-footer-hint{text-align:center;margin-top:8px;font-size:10px;color:rgba(255,255,255,0.18);line-height:1.5;}
        </style>
        <div class="rokc-wrapper">
            <div class="rokc-list">${rowsHTML}</div>
            <div class="rokc-footer">
                <button class="rokc-footer-btn" onclick="closeImportantMatchesModal(); setTimeout(showSearchModal, 250);">
                    <i class="fas fa-search"></i>
                    ¿No encuentras tu partido? Búscalo aquí
                </button>
                <p class="rokc-footer-hint">El buscador tiene más de 400 transmisiones en vivo y programadas</p>
            </div>
        </div>
    `;

    loadRokcLogos();
}

async function loadRokcLogos() {
    const imgs = document.querySelectorAll('.rim-logo[data-team]');
    const seen = new Map();

    for (const img of imgs) {
        const raw = decodeURIComponent(img.dataset.team || '');
        if (!raw) { img.classList.add('loaded'); continue; }
        const key = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
        if (!key) { img.classList.add('loaded'); continue; }

        if (!seen.has(key)) {
            seen.set(key, fetch(`/api/team-logo?team=${encodeURIComponent(raw)}`)
                .then(r => r.json()).then(d => d.url || null).catch(() => null));
        }

        seen.get(key).then(url => {
            if (!img.isConnected) return;
            if (url) { img.src = url; }
            img.classList.add('loaded');
        });
    }
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

    const transmision = transmisionesData.transmisiones.find(t => _matchesTransmision(eventoNombre, t));

    if (!transmision) {
        showToast('No se encontró el partido');
        return;
    }

    const tituloMostrar = transmision.titulo || transmision.evento;

    // Reutiliza la función central, pero cierra el modal de partidos importantes antes
    const apis = [
        { data: transmisionesAPI2, fuente: 'e1link'         },
        { data: transmisionesAPI1, fuente: 'rereyano'       },
        { data: transmisionesAPI3, fuente: 'voodc'          },
        { data: transmisionesAPI4, fuente: 'transmisiones4' },
        { data: transmisionesAPI5, fuente: 'donromans'      },
        { data: transmisionesAPI6, fuente: 'transmisiones6' },
    ];
    let canalesCombinados = [];
    for (const { data, fuente } of apis) {
        if (!data?.transmisiones) continue;
        const coincidentes = data.transmisiones.filter(t => _matchesTransmision(eventoNombre, t));
        for (const t of coincidentes) {
            if (t.canales?.length) canalesCombinados.push(...t.canales.map(c => ({ ...c, fuente })));
        }
    }
    // Dedup por URL (también revisamos enlaces[0].url)
    const seen = new Set();
    canalesCombinados = canalesCombinados.filter(c => {
        const url = c.url || c.src || c.stream_url || c.embed ||
                    (c.enlaces && c.enlaces[0] && c.enlaces[0].url) || '';
        if (!url || seen.has(url)) return false;
        seen.add(url); return true;
    });

    // Renumerar canales con el mismo nombre
    const nombreCount = {};
    canalesCombinados = canalesCombinados.map(c => {
        const base = c.nombre || 'Servidor';
        nombreCount[base] = (nombreCount[base] || 0) + 1;
        if (nombreCount[base] > 1) return { ...c, nombre: `${base} ${nombreCount[base]}` };
        return c;
    });

    closeImportantMatchesModal();
    if (canalesCombinados.length > 0) {
        showChannelSelector({ evento: tituloMostrar, titulo: tituloMostrar, canales: canalesCombinados }, tituloMostrar);
    } else if (transmision.canales?.length > 0) {
        showChannelSelector(transmision, tituloMostrar);
    } else {
        showToast('No hay canales disponibles para este partido');
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
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();
        lineupsData = data;
        
        _log('✅ Alineaciones cargadas:', data);
        
        renderMatchSelector();
        
        if (data.partidos && data.partidos.length > 0) {
            renderLineup(0);
        }
        
        return data;
    } catch (error) {
        _log('❌ Error cargando alineaciones:', error);
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
    
    _log(`🔗 URL corta generada: ${shareUrl}`);
    
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

// Copiar link de un canal desde el modal de señales
function copyChannelLink(btn, url) {
    if (!url) return;
    const icon = btn.querySelector('i');
    const doReset = () => {
        btn.classList.remove('copied');
        if (icon) { icon.className = 'fas fa-link'; }
    };
    const onSuccess = () => {
        btn.classList.add('copied');
        if (icon) { icon.className = 'fas fa-check'; }
        showToast('¡Link copiado!');
        setTimeout(doReset, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(onSuccess).catch(() => {
            fallbackCopyToClipboard(url);
            onSuccess();
        });
    } else {
        fallbackCopyToClipboard(url);
        onSuccess();
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
    const matchId = urlParams.get('match');

    // Nuevo formato corto: ?match=XXXXXX (servidor)
    if (matchId) {
        fetch(`/api/share/match/${matchId}`)
            .then(r => r.json())
            .then(data => {
                if (!data.channels) { showToast('Link expirado o inválido'); return; }
                const transmision = {
                    evento: data.title, titulo: data.title,
                    canales: data.channels.map(c => ({
                        nombre: c[0], numero: '',
                        enlaces: [{ url: c[1], calidad: 'HD' }],
                        tipoAPI: c[2] || 'shared'
                    }))
                };
                setTimeout(() => {
                    showChannelSelector(transmision, data.title);
                    showToast('Abriendo canales compartidos... 📺');
                    window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
                }, 1200);
            })
            .catch(() => showToast('No se pudo cargar el link compartido'));
        return;
    }
    
    _log('🔍 checkSharedStream - ch:', channelParam ? 'SÍ' : 'NO');
    
    if (channelParam) {
        _log('🔗 Detectado parámetro ch:', channelParam.length + ' caracteres');
        
        // Verificar que LZString esté disponible
        if (typeof LZString === 'undefined') {
            _log('❌ LZString no está disponible, reintentando en 500ms...');
            setTimeout(() => checkSharedStream(), 500);
            return;
        }
        
        try {
            const decompressed = LZString.decompressFromEncodedURIComponent(channelParam);
            _log('🔓 Resultado decompresión:', decompressed ? 'OK (' + decompressed.length + ' chars)' : 'FALLÓ');
            
            if (decompressed) {
                const shareData = JSON.parse(decompressed);
                _log('✅ Canales compartidos decodificados:', shareData.t, '- Canales:', shareData.c.length);
                
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
                    _log('🚀 Abriendo modal de canales compartidos...');
                    showChannelSelector(transmision, shareData.t);
                    showToast('Abriendo canales compartidos... 📺');
                    
                    const cleanUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                }, 1500);
            } else {
                _log('❌ Decompresión retornó null - datos corruptos');
                showToast('Error: Link de canales inválido');
            }
        } catch (error) {
            _log('❌ Error al procesar canales compartidos:', error.message);
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
                _log('✅ Transmisión encontrada en cache:', shortId);
                
                setTimeout(() => {
                    playStreamInModal(cached.u, cached.t, false);
                    showToast('Abriendo transmisión compartida... 📺');
                    
                    // Limpiar la URL sin recargar la página
                    const cleanUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                }, 1000);
                return;
            } else {
                _log('⚠️ Link compartido no encontrado en cache');
                showToast('Este link ya expiró o no está disponible');
            }
        } catch (error) {
            _log('❌ Error al procesar link corto:', error);
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
                    _log('✅ URL comprimida decodificada exitosamente');
                }
            } catch (e) {
                // Si falla, intentar el formato antiguo base64 (compatibilidad)
                _log('⚠️ Intentando formato antiguo base64...');
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
            _log('❌ Error al procesar link compartido:', error);
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
        
        const channels = transmision.canales.slice(0, 8).map(canal => {
            let url = '';
            if (canal.enlaces && canal.enlaces.length > 0) {
                url = canal.enlaces[0].url || canal.enlaces[0];
            } else if (canal.links) {
                url = canal.links.principal || canal.links.backup || canal.links.hoca || canal.links.caster || canal.links.wigi || '';
            }
            return [canal.nombre || 'Canal', url, canal.tipoAPI || ''];
        }).filter(c => c[1]);

        showToast('Generando link...');

        // Guardar en el servidor y obtener ID corto
        const resp = await fetch('/api/share/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, channels })
        });
        const { id } = await resp.json();
        const shareUrl = `${window.location.origin}${window.location.pathname}?match=${id}`;
        
        _log('🔗 URL corta generada:', shareUrl);
        
        if (navigator.share) {
            await navigator.share({
                title: `${title} - UltraGol`,
                text: `Ver ${title} en UltraGol`,
                url: shareUrl
            });
            showToast('¡Compartido! 🎉');
        } else {
            await navigator.clipboard.writeText(shareUrl);
            showToast('¡Enlace copiado! 📋');
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            _log('Error al compartir:', error);
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
            _log('Error al crear link compartible:', error);
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
    
    _log('✅ QR Code generado:', urlToShare);
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
            _log('✅ QR Code descargado:', link.download);
        }, 'image/png');
        
    } catch (error) {
        _log('Error al descargar QR:', error);
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


// ═══════════════════════════════════════════════════════
//  NAVEGACIÓN TV — Control Remoto (teclas flecha + Enter)
// ═══════════════════════════════════════════════════════
(function initTVNavigation() {
    const TV_KEY = 'ultragol_tv_mode';

    // ── Detección automática de TV ───────────────────────────────────────────
    function detectarTV() {
        const ua = navigator.userAgent.toLowerCase();

        // 1. User-agent de plataformas TV conocidas
        const tvUAs = [
            'tizen', 'webos', 'netcast', 'smarttv', 'smart-tv', 'hbbtv',
            'viera', 'bravia', 'philips', 'roku', 'googletv', 'crkey',
            'firetv', 'fire tv', 'aftb', 'aftt', 'aftm', 'aftn', 'afts',
            'android tv', 'aquos', 'kdl', 'nettv'
        ];
        if (tvUAs.some(k => ua.includes(k))) return true;

        // 2. Pantalla ≥1280px SIN puntos táctiles → probablemente TV o monitor
        if (window.screen.width >= 1280 && navigator.maxTouchPoints === 0) return true;

        // 3. Control remoto: pointer:coarse (no ratón fino) + hover:hover
        //    Esto distingue TV del móvil (móvil = coarse + hover:none)
        const coarse = window.matchMedia('(pointer: coarse)').matches;
        const hover  = window.matchMedia('(hover: hover)').matches;
        if (coarse && hover) return true;

        return false;
    }

    const esTV = detectarTV();

    if (esTV) {
        // TV detectada → activar modo TV automáticamente + marcar como detectado
        document.body.classList.add('tv-mode', 'tv-detected');
        localStorage.setItem(TV_KEY, '1');
    } else if (localStorage.getItem(TV_KEY) === '1') {
        // El usuario lo activó manualmente antes (no TV real)
        document.body.classList.add('tv-mode');
        // NO añadimos tv-detected → la barra de colores no aparece en móvil
    }

    window.toggleTVMode = function() {
        const active = document.body.classList.toggle('tv-mode');
        localStorage.setItem(TV_KEY, active ? '1' : '0');
        showToast(active ? '📺 Modo TV activado — usa las flechas del control' : '📱 Modo TV desactivado');
        const btn = document.getElementById('tvToggleBtn');
        if (btn) btn.title = active ? 'Desactivar modo TV' : 'Activar modo TV (control remoto)';
    };

    // Devuelve todos los elementos navegables visibles dentro de un contenedor
    function getFocusables(container) {
        const sel = '.sv-card[tabindex], .server-node-card[tabindex], .rim-card[tabindex], .smp-card[tabindex], .lbar-btn, .nav-btn, .nav-reels-btn';
        return [...(container || document).querySelectorAll(sel)]
            .filter(el => el.offsetParent !== null);
    }

    // Mueve el foco hacia arriba o abajo en la lista
    function moveFocus(dir, container) {
        const items = getFocusables(container);
        if (!items.length) return;
        const idx = items.indexOf(document.activeElement);
        let next;
        if (dir === 'down') next = idx < items.length - 1 ? items[idx + 1] : items[0];
        else next = idx > 0 ? items[idx - 1] : items[items.length - 1];
        if (next) { next.focus(); next.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    }

    // Detecta qué modal/contenedor está activo
    function getActiveContainer() {
        const cs = document.getElementById('channelSelectorModal');
        if (cs?.classList.contains('active')) return cs.querySelector('.channel-selector-body');
        const im = document.getElementById('importantMatchesModal');
        if (im?.classList.contains('active')) return im.querySelector('.important-modal-body');
        const sm = document.getElementById('searchModal');
        if (sm?.classList.contains('active')) return sm.querySelector('.search-modal-body');
        return null;
    }

    // Listener global de teclado
    document.addEventListener('keydown', function(e) {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';

        switch (e.key) {
            // ── Botones de color del control remoto TV ─────────────
            // Rojo (F1 / keyCode 403) → Inicio (Liga MX)
            case 'F1':
            case 'ColorF0Red':
                e.preventDefault();
                closeAllModals && closeAllModals();
                navTo && navTo('home', document.querySelector('[data-nav="home"]'));
                break;

            // Verde (F2 / keyCode 404) → Partidos en vivo
            case 'F2':
            case 'ColorF1Green':
                e.preventDefault();
                closeAllModals && closeAllModals();
                openImportantMatchesModal && openImportantMatchesModal();
                break;

            // Amarillo (F3 / keyCode 405) → Búsqueda
            case 'F3':
            case 'ColorF2Yellow':
                e.preventDefault();
                closeAllModals && closeAllModals();
                showSearchModal && showSearchModal();
                break;

            // Azul (F4 / keyCode 406) → Activar/desactivar modo TV
            case 'F4':
            case 'ColorF3Blue':
                e.preventDefault();
                toggleTVMode && toggleTVMode();
                break;

            case 'Escape':
                if (!isInput) {
                    e.preventDefault();
                    if (typeof closeAllModals === 'function') closeAllModals();
                    else if (typeof navigateBack === 'function') navigateBack();
                }
                break;

            case 'ArrowDown':
            case 'ArrowRight':
                if (!isInput) {
                    e.preventDefault();
                    moveFocus('down', getActiveContainer());
                }
                break;

            case 'ArrowUp':
            case 'ArrowLeft':
                if (!isInput) {
                    e.preventDefault();
                    moveFocus('up', getActiveContainer());
                }
                break;

            case 'Enter':
            case ' ':
                if (!isInput) {
                    const el = document.activeElement;
                    if (el && el.tagName !== 'BUTTON' &&
                        (el.classList.contains('sv-card') ||
                         el.classList.contains('server-node-card') ||
                         el.classList.contains('rim-card') ||
                         el.classList.contains('smp-card'))) {
                        e.preventDefault();
                        el.click();
                    }
                }
                break;
        }
    }, true);

    // Auto-focus primer partido al abrir modal de partidos importantes
    const observer = new MutationObserver(() => {
        const im = document.getElementById('importantMatchesModal');
        if (im?.classList.contains('active')) {
            setTimeout(() => {
                const first = im.querySelector('.rim-card[tabindex]');
                if (first && !im.contains(document.activeElement)) first.focus();
            }, 200);
        }
    });
    const im = document.getElementById('importantMatchesModal');
    if (im) observer.observe(im, { attributes: true, attributeFilter: ['class'] });
})();

// ══════════════════════════════════════════════════════
// CHAT EN VIVO — floating panel
// ══════════════════════════════════════════════════════
(function initLiveChat() {
    let chatOpen = false;
    let iframeLoaded = false;

    window.toggleLiveChat = function () {
        const panel   = document.getElementById('livechatPanel');
        const overlay = document.getElementById('livechatOverlay');
        const fab     = document.getElementById('livechatFab');
        if (!panel) return;

        chatOpen = !chatOpen;
        panel.classList.toggle('open', chatOpen);
        if (overlay) overlay.classList.toggle('show', chatOpen);
        if (fab) fab.classList.toggle('active', chatOpen);

        // Lazy-load iframe only when opened for the first time
        if (chatOpen && !iframeLoaded) {
            const frame = document.getElementById('livechatFrame');
            if (frame && frame.dataset.src) {
                frame.src = frame.dataset.src;
                iframeLoaded = true;
            }
        }

        // Hide pulse ring once user has opened chat
        const pulse = document.querySelector('.livechat-pulse');
        if (pulse) pulse.style.display = 'none';
    };

    window.expandLiveChat = function () {
        const panel = document.getElementById('livechatPanel');
        if (!panel) return;
        panel.classList.toggle('expanded');
    };

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatOpen) window.toggleLiveChat();
    });
})();
