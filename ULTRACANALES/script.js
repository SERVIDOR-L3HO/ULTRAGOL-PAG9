import { auth, signInWithGoogle, signOutUser, onAuthStateChanged } from './firebase-config.js';

let channelsData = null;
let currentChannel = null;
let currentUser = null;

const channelLogos = {
    'TyC Sports HD': 'attached_assets/logos/tyc-sports.jpg',
    'TyC Sports': 'attached_assets/logos/tyc-sports.jpg',
    'TNT Sports HD': 'attached_assets/logos/tnt-sports.jpg',
    'ESPN Premium HD': 'attached_assets/logos/espn-premium.jpg',
    'ESPN Premium': 'attached_assets/logos/espn-premium.jpg',
    'DSports HD': 'attached_assets/logos/dsports.jpg',
    'DSports': 'attached_assets/logos/dsports.jpg',
    'DSports 2': 'attached_assets/logos/dsports2.jpg',
    'DirectTV Sports Plus': 'attached_assets/logos/dsports-plus.jpg',
    'Las Estrellas': 'attached_assets/logos/las-estrellas.jpg',
    'TUDN': 'attached_assets/logos/tudn.jpg',
    'TUDN Vix Plus': 'attached_assets/logos/vix-tudn.jpg',
    'Fox Sports': 'attached_assets/logos/fox-sports.jpg',
    'Fox Sports México': 'attached_assets/logos/fox-sports.jpg',
    'Fox Sports Premium': 'attached_assets/logos/fox-sports-premium-blue.jpg',
    'Fox Sports 2': 'attached_assets/logos/fox-sports2.jpg',
    'Fox Sports 2 México': 'attached_assets/logos/fox-sports2.jpg',
    'Fox Sports 3': 'attached_assets/logos/fox-sports-3-pink.jpg',
    'Fox Sports 3 México': 'attached_assets/logos/fox-sports-3-pink.jpg',
    'DAZN La Liga': 'attached_assets/logos/dazn-laliga.jpg',
    'DAZN F1': 'attached_assets/logos/dazn-f1.jpg',
    'Movistar La Liga': 'attached_assets/logos/tv-movistar.jpg',
    'Sky Sports La Liga': 'attached_assets/logos/sky-sports-laliga.jpg',
    'ESPN': 'attached_assets/logos/espn.jpg',
    'ESPN México': 'attached_assets/logos/espn-mx.jpg',
    'ESPN 2 México': 'attached_assets/logos/espn2mx.jpg',
    'ESPN 3': 'attached_assets/logos/espn3.jpg',
    'ESPN 3 México': 'attached_assets/logos/espn-3mx.jpg',
    'ESPN 4': 'attached_assets/logos/espn-4.jpg',
    'ESPN 4 México': 'attached_assets/logos/espn-4mx.jpg',
    'ESPN 5': 'attached_assets/logos/espn5.jpg',
    'ESPN 5 México': 'attached_assets/logos/espn-5mx.jpg',
    'ESPN 6': 'attached_assets/logos/espn6.jpg',
    'ESPN 7': 'attached_assets/logos/espn7.jpg',
    'GolPeru': 'attached_assets/logos/golperu.jpg',
    'Azteca 7': 'attached_assets/logos/azteca-7.jpg',
    'Canal 5': 'attached_assets/logos/canal-5.jpg',
    'TV Pública': 'attached_assets/logos/tvp.jpg',
    'Win Sports Plus': 'attached_assets/logos/win-sports-plus.jpg'
};

async function loadChannels() {
    try {
        const response1 = await fetch('attached_assets/ultracanales (1)_1760216153008.json');
        channelsData = await response1.json();
        console.log('✅ Canales cargados:', channelsData.categories.length, 'categorías');
        renderChannels();
    } catch (error) {
        console.error('Error loading channels:', error);
        document.getElementById('channels-list').innerHTML = 
            '<p style="text-align: center; color: #999;">Error al cargar los canales. Por favor, recarga la página.</p>';
    }
}

function renderChannels() {
    const container = document.getElementById('channels-list');
    container.innerHTML = '';

    const allChannels = [];
    
    channelsData.categories.forEach(category => {
        category.channels.forEach(channel => {
            allChannels.push({
                ...channel,
                categoryIcon: category.icon,
                categoryName: category.name
            });
        });
    });

    allChannels.forEach((channel, index) => {
        const channelItem = createChannelItem(channel, index);
        container.appendChild(channelItem);
    });
}


function createChannelItem(channel, index) {
    const item = document.createElement('div');
    item.className = 'channel-item';
    
    const startTime = generateRandomTime();
    const endTime = generateRandomTime(true);
    const progress = Math.floor(Math.random() * 100);
    const remaining = generateRandomRemaining();
    
    const logo = channelLogos[channel.name];
    const iconHtml = logo 
        ? `<img src="${logo}" alt="${channel.name}" style="width: 100%; height: 100%; object-fit: contain;">`
        : channel.categoryIcon;
    
    item.innerHTML = `
        <div class="channel-icon">${iconHtml}</div>
        <div class="channel-content">
            <div class="channel-header">
                <span class="channel-name">${channel.name}</span>
                ${channel.live ? '<span class="live-badge">EN VIVO</span>' : ''}
            </div>
            <div class="channel-time">${startTime} - ${endTime}</div>
            <div class="channel-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="channel-remaining">${remaining} restantes</span>
            </div>
        </div>
    `;

    item.addEventListener('click', () => openChannel(channel));
    return item;
}

function generateRandomTime(isEnd = false) {
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function generateRandomRemaining() {
    const hours = Math.floor(Math.random() * 3);
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} restantes`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')} restantes`;
}

function openChannel(channel) {
    currentChannel = channel;
    const playerSection = document.getElementById('player-section');
    const channelName = document.getElementById('current-channel-name');
    const player = document.getElementById('player');
    const sourceButtons = document.getElementById('source-buttons');
    const heroBanner = document.getElementById('hero-banner');

    if (heroBanner) {
        heroBanner.classList.add('hide');
    }

    channelName.textContent = channel.name;
    playerSection.classList.remove('hidden');

    sourceButtons.innerHTML = '';
    
    // Crear array de fuentes con el nuevo dominio al inicio
    let sourcesArray = [...channel.sources];
    
    // Buscar si hay un link de rereyano.ru y extraer el número
    const rereyanoLink = sourcesArray.find(s => s.includes('rereyano.ru/player/3/'));
    if (rereyanoLink) {
        const match = rereyanoLink.match(/\/player\/3\/(\d+)/);
        if (match) {
            const channelNumber = match[1];
            const newLink = `https://ultragol-api-3.vercel.app/ultragol-l3ho?get=https://rereyano.ru/player/3/${channelNumber}`;
            // Insertar el nuevo link al inicio
            sourcesArray.unshift(newLink);
        }
    }
    
    const maxSources = Math.min(sourcesArray.length, 4);
    sourcesArray.slice(0, maxSources).forEach((source, index) => {
        const btn = document.createElement('button');
        btn.className = 'source-btn';
        if (index === 0) btn.classList.add('active');
        
        btn.textContent = `Fuente ${index + 1}`;
        
        btn.addEventListener('click', () => {
            loadSource(source);
            document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        sourceButtons.appendChild(btn);
    });

    loadSource(sourcesArray[0]);

    playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function loadSource(source) {
    const player = document.getElementById('player');
    player.src = source;
}

function closePlayer() {
    const playerSection = document.getElementById('player-section');
    const player = document.getElementById('player');
    const heroBanner = document.getElementById('hero-banner');
    
    playerSection.classList.add('hidden');
    player.src = '';
    currentChannel = null;
    
    if (heroBanner) {
        heroBanner.classList.remove('hide');
    }
}

function updateLikes() {
    const likes = ['7.2K', '8.5K', '9.1K', '6.8K', '10.3K'];
    document.getElementById('likes').textContent = likes[Math.floor(Math.random() * likes.length)];
}

function setupAuthUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    
    if (user) {
        currentUser = user;
        loginBtn.innerHTML = `
            <img src="${user.photoURL}" alt="${user.displayName}" 
                 style="width: 24px; height: 24px; border-radius: 50%;">
            <span>${user.displayName?.split(' ')[0] || 'Usuario'}</span>
        `;
        loginBtn.onclick = handleSignOut;
    } else {
        currentUser = null;
        loginBtn.innerHTML = `
            <span class="login-icon">G</span>
            <span>Iniciar Sesión</span>
        `;
        loginBtn.onclick = handleSignIn;
    }
}

async function handleSignIn() {
    try {
        await signInWithGoogle();
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        if (error.code === 'auth/unauthorized-domain') {
            alert('Error: Este dominio no está autorizado. Por favor, contacta al administrador.');
        } else {
            alert('Error al iniciar sesión. Por favor, intenta de nuevo.');
        }
    }
}

async function handleSignOut() {
    try {
        await signOutUser();
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Por favor, intenta de nuevo.');
    }
}

function searchChannels(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
        renderChannels();
        return;
    }
    
    const channelsContainer = document.getElementById('channels-list');
    channelsContainer.innerHTML = '';
    
    let allResults = [];
    
    if (channelsData) {
        channelsData.categories.forEach(category => {
            category.channels.forEach(channel => {
                if (channel.name.toLowerCase().includes(searchTerm)) {
                    allResults.push({
                        ...channel,
                        categoryIcon: category.icon,
                        categoryName: category.name
                    });
                }
            });
        });
    }
    
    if (allResults.length === 0) {
        channelsContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray); grid-column: 1/-1; padding: 2rem;">No se encontraron canales que coincidan con tu búsqueda.</p>';
        return;
    }
    
    allResults.forEach((channel, index) => {
        const channelItem = createChannelItem(channel, index);
        channelsContainer.appendChild(channelItem);
    });
}

// Función para obtener parámetros de la URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Función para buscar y abrir canal por número
function openChannelByNumber(channelNumber) {
    if (!channelsData) {
        console.error('Datos de canales no cargados');
        return;
    }
    
    // Buscar el canal que tenga rereyano.ru/player/3/{channelNumber} en sus fuentes
    let targetChannel = null;
    const searchUrl = `https://rereyano.ru/player/3/${channelNumber}`;
    
    for (const category of channelsData.categories) {
        for (const channel of category.channels) {
            // Buscar si alguna fuente del canal contiene la URL con el número específico
            const hasMatchingSource = channel.sources && channel.sources.some(source => 
                source.includes(`player/3/${channelNumber}`)
            );
            
            if (hasMatchingSource) {
                targetChannel = {
                    ...channel,
                    categoryIcon: category.icon,
                    categoryName: category.name
                };
                break;
            }
        }
        if (targetChannel) break;
    }
    
    if (targetChannel) {
        console.log(`✅ Abriendo Canal ${channelNumber}:`, targetChannel.name);
        setTimeout(() => openChannel(targetChannel), 500);
    } else {
        console.warn(`⚠️ Canal ${channelNumber} no encontrado en el JSON. Abriendo directamente...`);
        // Si no se encuentra el canal en el JSON, crear uno temporal con la URL de rereyano
        const tempChannel = {
            id: `canal-${channelNumber}`,
            name: `Canal ${channelNumber}`,
            sources: [searchUrl],
            live: true,
            categoryIcon: '📺',
            categoryName: 'Canal Directo'
        };
        setTimeout(() => openChannel(tempChannel), 500);
    }
}

onAuthStateChanged(auth, (user) => {
    setupAuthUI(user);
});

document.addEventListener('DOMContentLoaded', () => {
    loadChannels();
    setInterval(updateLikes, 5000);
    
    // Detectar si hay un parámetro de canal o match en la URL
    const canalParam = getUrlParameter('canal');
    const matchParam = getUrlParameter('match');
    
    if (canalParam) {
        // Esperar a que los canales se carguen antes de abrir el canal específico
        setTimeout(() => {
            openChannelByNumber(canalParam);
        }, 1000);
    } else if (matchParam) {
        // Esperar a que los canales se carguen antes de abrir el partido específico
        setTimeout(() => {
            openChannelByNumber(matchParam);
        }, 1000);
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchChannels(e.target.value);
        });
        
        const searchBtn = document.querySelector('.search-icon-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                searchChannels(searchInput.value);
            });
        }
    }
});

window.closePlayer = closePlayer;
