// Profile JavaScript - Professional User Profile System
document.addEventListener('DOMContentLoaded', function() {
    initializeProfile();
});

// Global variables
let currentUser = null;
let profileUser = null;
let isOwnProfile = false;
let profilePosts = [];
let profileVideos = [];
let profilePhotos = [];
let likedPosts = [];
let achievements = [];
let followers = [];
let following = [];

// Initialize Profile
function initializeProfile() {
    console.log('👤 Profile system initializing...');
    
    // Check Firebase availability
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        console.log('🔥 Firebase available, loading profile with real-time features');
        setupFirebaseProfile();
    } else {
        console.log('📱 Running Profile in demo mode');
        setupDemoProfile();
    }
    
    setupEventListeners();
    setupProfileTabs();
    loadTeamsData();
}

// Setup Firebase Profile
function setupFirebaseProfile() {
    firebase.auth().onAuthStateChanged(async (user) => {
        currentUser = user;
        
        if (user) {
            console.log('✅ User authenticated, loading profile');
            await loadProfileData();
        } else {
            console.log('❌ User not authenticated');
            window.location.href = 'fanzone.html';
        }
    });
}

// Setup Demo Profile
function setupDemoProfile() {
    // Create demo profile data
    profileUser = {
        uid: 'demo-user',
        displayName: 'Fan Profesional',
        email: 'fan@ultragol.com',
        photoURL: null,
        bio: 'Apasionado seguidor de la Liga MX desde hace 15 años. ¡Siempre apoyando a mi equipo! ⚽🔥',
        favoriteTeam: 'america',
        location: 'Ciudad de México, México',
        website: 'https://ultragol.com',
        socialLinks: {
            twitter: '@fanprofesional',
            instagram: '@fanprofesional',
            tiktok: '@fanprofesional'
        },
        joinDate: new Date('2024-01-15'),
        isPrivate: false,
        showOnlineStatus: true,
        allowMessages: true,
        isVerified: true,
        level: 8,
        stats: {
            posts: 234,
            followers: 1847,
            following: 312,
            likes: 5923,
            comments: 892
        }
    };
    
    isOwnProfile = true;
    updateProfileDisplay();
    generateDemoContent();
}

// Load Profile Data
async function loadProfileData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user') || currentUser.uid;
        isOwnProfile = userId === currentUser.uid;
        
        // Load profile user data
        const userDoc = await firebase.firestore().collection('users').doc(userId).get();
        if (userDoc.exists) {
            profileUser = userDoc.data();
        } else {
            console.error('Profile not found');
            return;
        }
        
        // Update UI
        updateProfileDisplay();
        
        // Load profile content
        await Promise.all([
            loadProfilePosts(),
            loadProfileVideos(),
            loadProfilePhotos(),
            loadLikedPosts(),
            loadAchievements(),
            loadFollowers(),
            loadFollowing(),
            loadActivityData()
        ]);
        
        // Setup real-time listeners
        setupProfileListeners();
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Update Profile Display
function updateProfileDisplay() {
    // Update cover image
    const coverImage = document.getElementById('coverImage');
    if (profileUser.coverURL) {
        coverImage.style.backgroundImage = `url(${profileUser.coverURL})`;
    }
    
    // Update avatar
    const avatarImage = document.getElementById('avatarImage');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    
    if (profileUser.photoURL) {
        avatarImage.src = profileUser.photoURL;
        avatarImage.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
    } else {
        avatarImage.style.display = 'none';
        avatarPlaceholder.style.display = 'flex';
    }
    
    // Update verification badge
    const verificationBadge = document.getElementById('verificationBadge');
    if (profileUser.isVerified) {
        verificationBadge.style.display = 'block';
    }
    
    // Update user status
    const userStatus = document.getElementById('userStatus');
    if (profileUser.showOnlineStatus) {
        userStatus.style.display = 'block';
        userStatus.className = profileUser.isOnline ? 'fas fa-circle online' : 'fas fa-circle offline';
    }
    
    // Update profile info
    document.getElementById('profileName').textContent = profileUser.displayName;
    document.getElementById('profileUsername').textContent = `@${profileUser.displayName.toLowerCase().replace(/\s+/g, '')}`;
    document.getElementById('profileBio').textContent = profileUser.bio || 'Sin biografía disponible';
    
    // Update meta information
    const joinDate = profileUser.joinDate ? new Date(profileUser.joinDate.toDate ? profileUser.joinDate.toDate() : profileUser.joinDate) : new Date();
    document.getElementById('joinDate').textContent = joinDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    
    if (profileUser.location) {
        document.getElementById('locationMeta').style.display = 'flex';
        document.getElementById('userLocation').textContent = profileUser.location;
    }
    
    if (profileUser.favoriteTeam) {
        const team = LIGA_MX_TEAMS.find(t => t.id === profileUser.favoriteTeam);
        if (team) {
            document.getElementById('teamMeta').style.display = 'flex';
            document.getElementById('favoriteTeam').textContent = team.name;
        }
    }
    
    if (profileUser.website) {
        document.getElementById('websiteMeta').style.display = 'flex';
        document.getElementById('userWebsite').href = profileUser.website;
        document.getElementById('userWebsite').textContent = profileUser.website.replace(/^https?:\/\//, '');
    }
    
    // Update social links
    updateSocialLinks();
    
    // Update stats
    updateProfileStats();
    
    // Update action buttons
    updateActionButtons();
}

// Update Social Links
function updateSocialLinks() {
    const socialLinks = document.getElementById('socialLinks');
    socialLinks.innerHTML = '';
    
    if (profileUser.socialLinks) {
        Object.entries(profileUser.socialLinks).forEach(([platform, username]) => {
            if (username) {
                const link = document.createElement('a');
                link.href = getSocialURL(platform, username);
                link.target = '_blank';
                link.className = 'social-link';
                link.innerHTML = `<i class="fab fa-${platform}"></i>`;
                socialLinks.appendChild(link);
            }
        });
    }
}

// Get Social URL
function getSocialURL(platform, username) {
    const urls = {
        twitter: `https://twitter.com/${username.replace('@', '')}`,
        instagram: `https://instagram.com/${username.replace('@', '')}`,
        tiktok: `https://tiktok.com/@${username.replace('@', '')}`,
        facebook: `https://facebook.com/${username.replace('@', '')}`,
        youtube: `https://youtube.com/@${username.replace('@', '')}`
    };
    return urls[platform] || '#';
}

// Update Profile Stats
function updateProfileStats() {
    const stats = profileUser.stats || { posts: 0, followers: 0, following: 0, likes: 0, comments: 0 };
    
    document.getElementById('postsCount').textContent = formatNumber(stats.posts);
    document.getElementById('followersCount').textContent = formatNumber(stats.followers);
    document.getElementById('followingCount').textContent = formatNumber(stats.following);
    document.getElementById('likesCount').textContent = formatNumber(stats.likes);
    document.getElementById('commentsCount').textContent = formatNumber(stats.comments);
}

// Format Number
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Update Action Buttons
function updateActionButtons() {
    const primaryAction = document.getElementById('primaryAction');
    const messageBtn = document.getElementById('messageBtn');
    
    if (isOwnProfile) {
        primaryAction.innerHTML = '<i class="fas fa-edit"></i><span>Editar Perfil</span>';
        primaryAction.onclick = openEditProfile;
        messageBtn.style.display = 'none';
    } else {
        // Check if following
        const isFollowing = following.includes(profileUser.uid);
        primaryAction.innerHTML = isFollowing ? 
            '<i class="fas fa-user-check"></i><span>Siguiendo</span>' :
            '<i class="fas fa-user-plus"></i><span>Seguir</span>';
        primaryAction.onclick = () => toggleFollow(profileUser.uid);
        
        messageBtn.style.display = 'flex';
        messageBtn.onclick = openMessageModal;
    }
}

// Toggle Follow
async function toggleFollow(userId) {
    if (!currentUser) return;
    
    try {
        const followDoc = firebase.firestore().collection('follows').doc(`${currentUser.uid}_${userId}`);
        const doc = await followDoc.get();
        
        if (doc.exists) {
            // Unfollow
            await followDoc.delete();
            following = following.filter(id => id !== userId);
        } else {
            // Follow
            await followDoc.set({
                followerId: currentUser.uid,
                followingId: userId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            following.push(userId);
        }
        
        updateActionButtons();
        
        // Update stats
        await updateFollowStats();
        
    } catch (error) {
        console.error('Error toggling follow:', error);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Edit buttons
    const editAvatar = document.getElementById('editAvatar');
    const editCover = document.getElementById('editCover');
    
    if (editAvatar) editAvatar.addEventListener('click', changeAvatar);
    if (editCover) editCover.addEventListener('click', changeCover);
    
    // Modal handlers
    const closeEditModal = document.getElementById('closeEditModal');
    const closeFollowersModal = document.getElementById('closeFollowersModal');
    const closeMessageModal = document.getElementById('closeMessageModal');
    
    if (closeEditModal) closeEditModal.addEventListener('click', closeEditProfileModal);
    if (closeFollowersModal) closeFollowersModal.addEventListener('click', closeFollowersModalHandler);
    if (closeMessageModal) closeMessageModal.addEventListener('click', closeMessageModalHandler);
    
    // Form handlers
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) editProfileForm.addEventListener('submit', saveProfile);
    
    // Followers/Following buttons
    const viewAllFollowers = document.getElementById('viewAllFollowers');
    const viewAllAchievements = document.getElementById('viewAllAchievements');
    
    if (viewAllFollowers) viewAllFollowers.addEventListener('click', openFollowersModal);
    if (viewAllAchievements) viewAllAchievements.addEventListener('click', openAchievementsModal);
}

// Setup Profile Tabs
function setupProfileTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}Tab`) {
                    content.classList.add('active');
                }
            });
            
            // Load tab content
            loadTabContent(targetTab);
        });
    });
}

// Load Tab Content
function loadTabContent(tab) {
    switch (tab) {
        case 'posts':
            displayPosts();
            break;
        case 'videos':
            displayVideos();
            break;
        case 'photos':
            displayPhotos();
            break;
        case 'likes':
            displayLikedPosts();
            break;
        case 'achievements':
            displayAchievements();
            break;
        case 'activity':
            displayActivity();
            break;
    }
}

// Generate Demo Content
function generateDemoContent() {
    // Generate demo posts
    profilePosts = Array.from({ length: 12 }, (_, i) => ({
        id: `demo-post-${i}`,
        content: `Este es un post de ejemplo #${i + 1} sobre Liga MX. ¡Vamos equipo! ⚽`,
        timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        likes: Math.floor(Math.random() * 100) + 10,
        comments: Math.floor(Math.random() * 20) + 3,
        type: i % 3 === 0 ? 'video' : i % 4 === 0 ? 'photo' : 'text'
    }));
    
    // Generate demo achievements
    achievements = [
        { id: 'first_post', name: 'Primer Post', icon: '📝', unlocked: true },
        { id: 'social_butterfly', name: 'Mariposa Social', icon: '🦋', unlocked: true },
        { id: 'top_fan', name: 'Fan Principal', icon: '⭐', unlocked: true },
        { id: 'commentator', name: 'Comentarista', icon: '💬', unlocked: false },
        { id: 'influencer', name: 'Influencer', icon: '👑', unlocked: false }
    ];
    
    displayPosts();
    displayAchievements();
    updateActivitySummary();
}

// Display Posts
function displayPosts() {
    const postsGrid = document.getElementById('userPostsGrid');
    if (!postsGrid) return;
    
    postsGrid.innerHTML = '';
    
    profilePosts.slice(0, 9).forEach(post => {
        const postCard = createPostCard(post);
        postsGrid.appendChild(postCard);
    });
}

// Create Post Card
function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'profile-post-card';
    card.innerHTML = `
        <div class="post-preview">
            ${post.type === 'photo' ? '<i class="fas fa-image"></i>' : 
              post.type === 'video' ? '<i class="fas fa-play"></i>' : 
              '<i class="fas fa-comment-alt"></i>'}
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-stats">
            <span><i class="fas fa-heart"></i> ${post.likes}</span>
            <span><i class="fas fa-comment"></i> ${post.comments}</span>
        </div>
    `;
    
    card.onclick = () => openPostModal(post);
    return card;
}

// Display Achievements
function displayAchievements() {
    const achievementsGrid = document.getElementById('achievementsGrid');
    const achievementsFullGrid = document.getElementById('achievementsFullGrid');
    
    if (achievementsGrid) {
        achievementsGrid.innerHTML = '';
        achievements.slice(0, 4).forEach(achievement => {
            const achievementCard = createAchievementCard(achievement);
            achievementsGrid.appendChild(achievementCard);
        });
    }
    
    if (achievementsFullGrid) {
        achievementsFullGrid.innerHTML = '';
        achievements.forEach(achievement => {
            const achievementCard = createAchievementCard(achievement);
            achievementsFullGrid.appendChild(achievementCard);
        });
    }
}

// Create Achievement Card
function createAchievementCard(achievement) {
    const card = document.createElement('div');
    card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-name">${achievement.name}</div>
        ${achievement.unlocked ? '<div class="achievement-status">✓</div>' : '<div class="achievement-status">🔒</div>'}
    `;
    return card;
}

// Update Activity Summary
function updateActivitySummary() {
    document.getElementById('weeklyPosts').textContent = Math.floor(Math.random() * 10) + 3;
    document.getElementById('streakDays').textContent = Math.floor(Math.random() * 30) + 7;
    document.getElementById('totalScore').textContent = Math.floor(Math.random() * 5000) + 2500;
}

// Open Edit Profile
function openEditProfile() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Populate form with current data
        document.getElementById('editDisplayName').value = profileUser.displayName || '';
        document.getElementById('editUsername').value = profileUser.displayName.toLowerCase().replace(/\s+/g, '') || '';
        document.getElementById('editBio').value = profileUser.bio || '';
        document.getElementById('editLocation').value = profileUser.location || '';
        document.getElementById('editWebsite').value = profileUser.website || '';
        
        // Populate team selector
        populateTeamSelector();
        
        // Populate social links
        document.getElementById('editTwitter').value = profileUser.socialLinks?.twitter || '';
        document.getElementById('editInstagram').value = profileUser.socialLinks?.instagram || '';
        document.getElementById('editTikTok').value = profileUser.socialLinks?.tiktok || '';
        
        // Populate privacy settings
        document.getElementById('profilePrivate').checked = profileUser.isPrivate || false;
        document.getElementById('showOnlineStatus').checked = profileUser.showOnlineStatus !== false;
        document.getElementById('allowMessages').checked = profileUser.allowMessages !== false;
    }
}

// Populate Team Selector
function populateTeamSelector() {
    const teamSelect = document.getElementById('editFavoriteTeam');
    if (teamSelect) {
        teamSelect.innerHTML = '<option value="">Seleccionar equipo</option>';
        LIGA_MX_TEAMS.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            option.selected = team.id === profileUser.favoriteTeam;
            teamSelect.appendChild(option);
        });
    }
}

// Teams data
const LIGA_MX_TEAMS = [
    { id: 'america', name: 'América' },
    { id: 'chivas', name: 'Chivas' },
    { id: 'pumas', name: 'Pumas' },
    { id: 'cruz_azul', name: 'Cruz Azul' },
    { id: 'tigres', name: 'Tigres' },
    { id: 'monterrey', name: 'Monterrey' },
    { id: 'santos', name: 'Santos' },
    { id: 'toluca', name: 'Toluca' },
    { id: 'atlas', name: 'Atlas' },
    { id: 'leon', name: 'León' },
    { id: 'pachuca', name: 'Pachuca' },
    { id: 'necaxa', name: 'Necaxa' },
    { id: 'puebla', name: 'Puebla' },
    { id: 'queretaro', name: 'Querétaro' },
    { id: 'tijuana', name: 'Tijuana' },
    { id: 'mazatlan', name: 'Mazatlán' },
    { id: 'juarez', name: 'Juárez' },
    { id: 'atletico_san_luis', name: 'Atlético San Luis' }
];

// Load Teams Data
function loadTeamsData() {
    // This function can be expanded to load team data for various selectors
    console.log('Teams data loaded');
}

// Placeholder functions for additional features
function loadProfilePosts() { return Promise.resolve(); }
function loadProfileVideos() { return Promise.resolve(); }
function loadProfilePhotos() { return Promise.resolve(); }
function loadLikedPosts() { return Promise.resolve(); }
function loadAchievements() { return Promise.resolve(); }
function loadFollowers() { return Promise.resolve(); }
function loadFollowing() { return Promise.resolve(); }
function loadActivityData() { return Promise.resolve(); }
function setupProfileListeners() { }
function changeAvatar() { console.log('Change avatar clicked'); }
function changeCover() { console.log('Change cover clicked'); }
function closeEditProfileModal() { document.getElementById('editProfileModal').style.display = 'none'; }
function closeFollowersModalHandler() { document.getElementById('followersModal').style.display = 'none'; }
function closeMessageModalHandler() { document.getElementById('messageModal').style.display = 'none'; }
function openFollowersModal() { document.getElementById('followersModal').style.display = 'flex'; }
function openAchievementsModal() { console.log('Open achievements modal'); }
function openMessageModal() { document.getElementById('messageModal').style.display = 'flex'; }
function openPostModal(post) { console.log('Open post modal:', post); }
function saveProfile(e) { e.preventDefault(); console.log('Save profile'); }
function displayVideos() { console.log('Display videos'); }
function displayPhotos() { console.log('Display photos'); }
function displayLikedPosts() { console.log('Display liked posts'); }
function displayActivity() { console.log('Display activity'); }
function updateFollowStats() { return Promise.resolve(); }