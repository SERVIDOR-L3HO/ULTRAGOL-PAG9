import { auth, signInWithGoogle, signOutUser, onAuthStateChanged } from './firebase-config.js';

let moreChannelsData = null;
let currentChannel = null;
let currentUser = null;
let allChannels = [];
let currentCategory = 'all';

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

const categoryMapping = {
    'mexico': ['Azteca 7', 'Canal 5', 'Las Estrellas', 'TUDN', 'TUDN Vix Plus'],
    'fox': ['Fox Sports', 'Fox Sports México', 'Fox Sports 2', 'Fox Sports 2 México', 'Fox Sports 3', 'Fox Sports 3 México', 'Fox Sports Premium'],
    'espn': ['ESPN', 'ESPN México', 'ESPN 2 México', 'ESPN 3', 'ESPN 3 México', 'ESPN 4', 'ESPN 4 México', 'ESPN 5', 'ESPN 5 México', 'ESPN 6', 'ESPN 7', 'ESPN Premium', 'ESPN Premium HD'],
    'dazn': ['DAZN F1', 'DAZN La Liga'],
    'sudamerica': ['TyC Sports', 'TyC Sports HD', 'TV Pública', 'GolPeru', 'Win Sports Plus']
};

async function loadChannels() {
    try {
        const response = await fetch('attached_assets/ultracanales (1)_1760216153008.json');
        moreChannelsData = await response.json();
        
        allChannels = [];
        moreChannelsData.categories.forEach(category => {
            category.channels.forEach(channel => {
                allChannels.push({
                    ...channel,
                    categoryIcon: category.icon,
                    categoryName: category.name,
                    categoryId: category.id
                });
            });
        });
        
        renderChannels(allChannels);
        updateChannelCount(allChannels.length);
        checkDeepLink();
    } catch (error) {
        console.error('Error loading channels:', error);
    }
}

function updateChannelCount(count) {
    const countEl = document.getElementById('channel-count');
    if (countEl) {
        countEl.textContent = `${count} canales disponibles`;
    }
}

function renderChannels(channels) {
    const container = document.getElementById('all-channels-grid');
    container.innerHTML = '';
    
    channels.forEach(channel => {
        const card = createChannelCard(channel);
        container.appendChild(card);
    });
    
    updateChannelCount(channels.length);
}

function createChannelCard(channel) {
    const card = document.createElement('div');
    card.className = 'channel-card';
    
    let logo = channelLogos[channel.name];
    if (!logo) {
        const logoExtensions = ['.png', '.jpg', '.jpeg'];
        for (const ext of logoExtensions) {
            const potentialLogo = `attached_assets/logos/${channel.id}${ext}`;
            logo = potentialLogo;
            break;
        }
    }
    
    const imageContent = logo 
        ? `<img src="${logo}" alt="${channel.name}" onerror="this.parentElement.innerHTML='<div style=\\'font-size: 2.5rem;\\'>${channel.categoryIcon}</div>'">`
        : `<div style="font-size: 2.5rem;">${channel.categoryIcon}</div>`;
    
    card.innerHTML = `
        <div class="channel-card-image">
            ${imageContent}
        </div>
        <div class="channel-card-content">
            <div>
                <div class="channel-card-name">${channel.name}</div>
                <div class="channel-card-category">${channel.categoryName}</div>
            </div>
            <div>
                ${channel.live ? '<span class="channel-card-badge">EN VIVO</span>' : ''}
                <div class="channel-sources">${channel.sources.length} fuente${channel.sources.length > 1 ? 's' : ''}</div>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => openChannel(channel));
    return card;
}

function openChannel(channel) {
    currentChannel = channel;
    const playerSection = document.getElementById('player-section');
    const channelName = document.getElementById('current-channel-name');
    const player = document.getElementById('player');
    const sourceButtons = document.getElementById('source-buttons');

    channelName.textContent = channel.name;
    playerSection.classList.remove('hidden');

    sourceButtons.innerHTML = '';
    
    let sourcesArray = [...channel.sources];
    
    const rereyanoLink = sourcesArray.find(s => s.includes('rereyano.ru/player/3/'));
    if (rereyanoLink) {
        const match = rereyanoLink.match(/\/player\/3\/(\d+)/);
        if (match) {
            const channelNumber = match[1];
            const newLink = `https://ultragol-api-3.vercel.app/ultragol-l3ho?get=https://rereyano.ru/player/3/${channelNumber}`;
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

    updateMetaTags(channel);
    loadSource(sourcesArray[0]);
    playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateMetaTags(channel) {
    document.title = `${channel.name} - ULTRACANALES`;
    
    const metaTags = {
        'og:title': `${channel.name} - ULTRACANALES`,
        'og:description': `Mira ${channel.name} en vivo en ULTRACANALES 🔥 ${channel.categoryName}`,
        'twitter:title': `${channel.name} - ULTRACANALES`,
        'twitter:description': `Mira ${channel.name} en vivo en ULTRACANALES 🔥 ${channel.categoryName}`
    };
    
    Object.entries(metaTags).forEach(([property, content]) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.querySelector(`meta[name="${property}"]`);
        }
        if (meta) {
            meta.setAttribute('content', content);
        }
    });
}

function loadSource(source) {
    const player = document.getElementById('player');
    player.src = source;
}

function closePlayer() {
    const playerSection = document.getElementById('player-section');
    const player = document.getElementById('player');
    
    playerSection.classList.add('hidden');
    player.src = '';
    currentChannel = null;
}

function filterChannelsByCategory(category) {
    currentCategory = category;
    
    if (category === 'all') {
        renderChannels(allChannels);
    } else if (categoryMapping[category]) {
        const categoryChannels = categoryMapping[category];
        const filtered = allChannels.filter(ch => 
            categoryChannels.some(name => ch.name.includes(name) || name.includes(ch.name))
        );
        renderChannels(filtered);
    } else {
        const filtered = allChannels.filter(ch => ch.categoryId === category);
        renderChannels(filtered);
    }
}

function searchChannels(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
        filterChannelsByCategory(currentCategory);
        return;
    }
    
    const filtered = allChannels.filter(ch => 
        ch.name.toLowerCase().includes(searchTerm) ||
        ch.categoryName.toLowerCase().includes(searchTerm)
    );
    
    renderChannels(filtered);
}

function setupAuthUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    
    if (user) {
        currentUser = user;
        loginBtn.innerHTML = `
            <img src="${user.photoURL}" alt="${user.displayName}" 
                 style="width: 28px; height: 28px; border-radius: 50%; margin-right: 0.5rem;">
            <span>${user.displayName?.split(' ')[0] || 'Usuario'}</span>
        `;
        loginBtn.onclick = handleSignOut;
    } else {
        currentUser = null;
        loginBtn.innerHTML = `👤 Iniciar Sesión`;
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
    }
}

async function shareChannel() {
    if (!currentChannel) return;
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?channel=${currentChannel.id}`;
    const shareData = {
        title: `${currentChannel.name} - ULTRACANALES`,
        text: `Mira ${currentChannel.name} en vivo en ULTRACANALES 🔥`,
        url: shareUrl
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareUrl);
            showShareNotification('¡Link copiado al portapapeles! 📋');
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showShareNotification('¡Link copiado al portapapeles! 📋');
            } catch (clipboardError) {
                showShareNotification('Error al compartir. Intenta de nuevo.');
            }
        }
    }
}

function showShareNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

function checkDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('channel');
    
    if (channelId && allChannels.length > 0) {
        const channel = allChannels.find(ch => ch.id === channelId);
        if (channel) {
            setTimeout(() => {
                openChannel(channel);
            }, 500);
        }
    }
}

onAuthStateChanged(auth, (user) => {
    setupAuthUI(user);
});

document.addEventListener('DOMContentLoaded', () => {
    loadChannels();
    
    const categoryFilters = document.querySelectorAll('.category-btn');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            categoryFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            filterChannelsByCategory(filter.dataset.category);
        });
    });
    
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
    
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        searchChannels(e.target.value);
    });
    
    const searchBtn = document.querySelector('.search-btn');
    searchBtn.addEventListener('click', () => {
        searchChannels(searchInput.value);
    });
    
    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareChannel);
    }
});

window.closePlayer = closePlayer;
window.shareChannel = shareChannel;
