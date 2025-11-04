// ==========================================
// GROUPS SYSTEM - JAVASCRIPT
// Complete Group Chat Management System
// ==========================================

// Global state
let currentUser = null;
let currentGroup = null;
let userGroups = [];
let publicGroups = [];

// Firebase references
let db, auth, storage;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to initialize
    setTimeout(() => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            db = firebase.firestore();
            auth = firebase.auth();
            storage = firebase.storage();
            
            // Setup auth listener
            auth.onAuthStateChanged((user) => {
                currentUser = user;
                if (user) {
                    loadUserGroups();
                }
            });
        }
        
        initializeGroupsSystem();
    }, 1000);
});

// Initialize Groups System
function initializeGroupsSystem() {
    // Groups button click - redirect to groups page
    const groupsBtn = document.getElementById('groupsBtn');
    if (groupsBtn) {
        groupsBtn.addEventListener('click', () => {
            window.location.href = 'groups-page.html';
        });
    }
    
    // Tabs functionality
    setupGroupsTabs();
    setupGroupDetailTabs();
    
    // Create group form
    const createGroupForm = document.getElementById('createGroupForm');
    if (createGroupForm) {
        createGroupForm.addEventListener('submit', handleCreateGroup);
    }
    
    // Avatar upload
    const avatarInput = document.getElementById('groupAvatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarUpload);
    }
    
    // Character counters
    setupCharacterCounters();
    
    // Group message input
    const sendGroupMessageBtn = document.getElementById('sendGroupMessageBtn');
    if (sendGroupMessageBtn) {
        sendGroupMessageBtn.addEventListener('click', sendGroupMessage);
    }
    
    const groupMessageInput = document.getElementById('groupMessageInput');
    if (groupMessageInput) {
        groupMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendGroupMessage();
            }
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('groupsSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleGroupsSearch);
    }
    
    console.log('✅ Groups system initialized');
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================

function openGroupsModal() {
    if (!currentUser) {
        showGroupToast('Por favor inicia sesión para ver los grupos', 'error');
        return;
    }
    
    const modal = document.getElementById('groupsModal');
    if (modal) {
        modal.classList.add('active');
        loadUserGroups();
        loadPublicGroups();
    }
}

function closeGroupsModal() {
    const modal = document.getElementById('groupsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function openCreateGroupModal() {
    const modal = document.getElementById('createGroupModal');
    if (modal) {
        modal.classList.add('active');
        // Reset form
        document.getElementById('createGroupForm')?.reset();
        const preview = document.getElementById('groupAvatarPreview');
        if (preview) {
            preview.innerHTML = '<i class="fas fa-users"></i>';
        }
    }
}

function closeCreateGroupModal() {
    const modal = document.getElementById('createGroupModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function openGroupDetailsModal(groupId) {
    if (!groupId) return;
    
    loadGroupDetails(groupId);
    const modal = document.getElementById('groupDetailsModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeGroupDetailsModal() {
    const modal = document.getElementById('groupDetailsModal');
    if (modal) {
        modal.classList.remove('active');
    }
    currentGroup = null;
}

function openInviteModal() {
    if (!currentGroup) return;
    
    const modal = document.getElementById('inviteModal');
    if (modal) {
        modal.classList.add('active');
        generateInviteLink();
        generateQRCode();
    }
}

function closeInviteModal() {
    const modal = document.getElementById('inviteModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function openPendingRequestsModal() {
    if (!currentGroup) return;
    
    loadPendingRequests();
    const modal = document.getElementById('pendingRequestsModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closePendingRequestsModal() {
    const modal = document.getElementById('pendingRequestsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ==========================================
// TABS FUNCTIONALITY
// ==========================================

function setupGroupsTabs() {
    const tabs = document.querySelectorAll('.groups-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked tab
            tab.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab content
            const tabContent = document.getElementById(`${tabName}-tab`);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            // Load content based on tab
            if (tabName === 'public-groups') {
                loadPublicGroups();
            } else if (tabName === 'discover') {
                loadDiscoverGroups();
            }
        });
    });
}

function setupGroupDetailTabs() {
    const tabs = document.querySelectorAll('.group-detail-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked tab
            tab.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.group-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab content
            const tabContent = document.getElementById(`${tabName}-tab`);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            // Load content based on tab
            if (tabName === 'members') {
                loadGroupMembers();
            }
        });
    });
}

// ==========================================
// CREATE GROUP
// ==========================================

let selectedGroupAvatar = null;

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showGroupToast('Por favor selecciona una imagen válida', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showGroupToast('La imagen no debe superar los 5MB', 'error');
        return;
    }
    
    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('groupAvatarPreview');
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Avatar">`;
            selectedGroupAvatar = file;
        }
    };
    reader.readAsDataURL(file);
}

async function handleCreateGroup(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showGroupToast('Debes iniciar sesión para crear un grupo', 'error');
        return;
    }
    
    const name = document.getElementById('groupName')?.value.trim();
    const description = document.getElementById('groupDescription')?.value.trim();
    const privacy = document.querySelector('input[name="privacy"]:checked')?.value;
    const limit = document.getElementById('groupLimit')?.value;
    const allowMemberInvites = document.getElementById('allowMemberInvites')?.checked;
    const allowFileSharing = document.getElementById('allowFileSharing')?.checked;
    const moderationEnabled = document.getElementById('moderationEnabled')?.checked;
    
    if (!name) {
        showGroupToast('El nombre del grupo es obligatorio', 'error');
        return;
    }
    
    try {
        showGroupToast('Creando grupo...', 'info');
        
        // Upload avatar if selected
        let avatarURL = null;
        if (selectedGroupAvatar && storage) {
            const avatarRef = storage.ref(`group-avatars/${Date.now()}_${selectedGroupAvatar.name}`);
            const snapshot = await avatarRef.put(selectedGroupAvatar);
            avatarURL = await snapshot.ref.getDownloadURL();
        }
        
        // Create group object
        const groupData = {
            name: name,
            description: description || '',
            privacy: privacy || 'public',
            memberLimit: limit === 'unlimited' ? null : parseInt(limit),
            avatar: avatarURL,
            settings: {
                allowMemberInvites: allowMemberInvites !== false,
                allowFileSharing: allowFileSharing !== false,
                moderationEnabled: moderationEnabled === true
            },
            creator: {
                uid: currentUser.uid,
                name: currentUser.displayName || 'Usuario',
                avatar: currentUser.photoURL || ''
            },
            admins: [currentUser.uid],
            members: [currentUser.uid],
            memberCount: 1,
            messageCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add to Firestore
        if (db) {
            const groupRef = await db.collection('groups').add(groupData);
            
            // Add user to group members sub-collection
            await groupRef.collection('members').doc(currentUser.uid).set({
                uid: currentUser.uid,
                name: currentUser.displayName || 'Usuario',
                avatar: currentUser.photoURL || '',
                role: 'admin',
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showGroupToast('¡Grupo creado exitosamente!', 'success');
            closeCreateGroupModal();
            loadUserGroups();
            
            // Open the new group
            openGroupDetailsModal(groupRef.id);
        }
        
    } catch (error) {
        console.error('Error creating group:', error);
        showGroupToast('Error al crear el grupo. Intenta de nuevo.', 'error');
    }
}

// ==========================================
// LOAD GROUPS
// ==========================================

async function loadUserGroups() {
    if (!currentUser || !db) return;
    
    try {
        const groupsRef = db.collection('groups');
        const snapshot = await groupsRef
            .where('members', 'array-contains', currentUser.uid)
            .orderBy('updatedAt', 'desc')
            .get();
        
        userGroups = [];
        snapshot.forEach(doc => {
            userGroups.push({ id: doc.id, ...doc.data() });
        });
        
        renderGroupsList(userGroups, 'myGroupsList');
    } catch (error) {
        console.error('Error loading user groups:', error);
    }
}

async function loadPublicGroups() {
    if (!db) return;
    
    try {
        const groupsRef = db.collection('groups');
        const snapshot = await groupsRef
            .where('privacy', '==', 'public')
            .orderBy('memberCount', 'desc')
            .limit(20)
            .get();
        
        publicGroups = [];
        snapshot.forEach(doc => {
            publicGroups.push({ id: doc.id, ...doc.data() });
        });
        
        renderGroupsList(publicGroups, 'publicGroupsList');
    } catch (error) {
        console.error('Error loading public groups:', error);
    }
}

async function loadDiscoverGroups() {
    if (!db) return;
    
    try {
        // Get recommended groups (mix of popular and recent)
        const groupsRef = db.collection('groups');
        const snapshot = await groupsRef
            .orderBy('createdAt', 'desc')
            .limit(15)
            .get();
        
        const discoverGroups = [];
        snapshot.forEach(doc => {
            discoverGroups.push({ id: doc.id, ...doc.data() });
        });
        
        renderGroupsList(discoverGroups, 'discoverGroupsList');
    } catch (error) {
        console.error('Error loading discover groups:', error);
    }
}

function renderGroupsList(groups, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (groups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No se encontraron grupos</p>
            </div>
        `;
        return;
    }
    
    const groupsHTML = groups.map(group => {
        const isAdmin = group.admins?.includes(currentUser?.uid);
        const isMember = group.members?.includes(currentUser?.uid);
        
        return `
            <div class="group-card" onclick="openGroupDetailsModal('${group.id}')">
                <div class="group-avatar">
                    ${group.avatar ? `<img src="${group.avatar}" alt="${group.name}">` : '<i class="fas fa-users"></i>'}
                </div>
                <div class="group-card-info">
                    <div class="group-card-header">
                        <span class="group-card-name">${group.name}</span>
                        <span class="group-privacy-badge ${group.privacy}">
                            <i class="fas fa-${group.privacy === 'public' ? 'globe' : 'lock'}"></i>
                            ${group.privacy === 'public' ? 'Público' : 'Privado'}
                        </span>
                        ${isAdmin ? '<span class="group-role-badge">ADMIN</span>' : ''}
                    </div>
                    ${group.description ? `<div class="group-card-description">${group.description}</div>` : ''}
                    <div class="group-card-stats">
                        <span><i class="fas fa-users"></i> ${group.memberCount || 0} miembros</span>
                        <span><i class="fas fa-comments"></i> ${group.messageCount || 0} mensajes</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = groupsHTML;
}

// ==========================================
// GROUP DETAILS
// ==========================================

async function loadGroupDetails(groupId) {
    if (!db) return;
    
    try {
        const groupDoc = await db.collection('groups').doc(groupId).get();
        
        if (!groupDoc.exists) {
            showGroupToast('Grupo no encontrado', 'error');
            return;
        }
        
        currentGroup = { id: groupDoc.id, ...groupDoc.data() };
        
        // Update UI
        document.getElementById('groupDetailName').textContent = currentGroup.name;
        document.getElementById('groupDetailDescription').textContent = currentGroup.description || 'Sin descripción';
        document.getElementById('groupMemberCount').textContent = currentGroup.memberCount || 0;
        document.getElementById('groupMessageCount').textContent = currentGroup.messageCount || 0;
        
        const avatar = document.getElementById('groupDetailAvatar');
        if (currentGroup.avatar) {
            avatar.src = currentGroup.avatar;
        } else {
            avatar.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%239d4edd" width="100" height="100"/><text x="50" y="55" font-size="40" fill="white" text-anchor="middle" font-family="Arial">👥</text></svg>';
        }
        
        // Show/hide buttons based on membership
        const isMember = currentGroup.members?.includes(currentUser?.uid);
        const isAdmin = currentGroup.admins?.includes(currentUser?.uid);
        
        const joinBtn = document.getElementById('joinGroupBtn');
        const leaveBtn = document.getElementById('leaveGroupBtn');
        const settingsTab = document.getElementById('groupSettingsTab');
        
        if (joinBtn) joinBtn.style.display = isMember ? 'none' : 'flex';
        if (leaveBtn) leaveBtn.style.display = isMember ? 'flex' : 'none';
        if (settingsTab) settingsTab.style.display = isAdmin ? 'flex' : 'none';
        
        // Load messages if member
        if (isMember) {
            loadGroupMessages(groupId);
        }
        
        // Update pending requests badge
        if (isAdmin) {
            updatePendingRequestsBadge(groupId);
        }
        
    } catch (error) {
        console.error('Error loading group details:', error);
        showGroupToast('Error al cargar los detalles del grupo', 'error');
    }
}

async function loadGroupMessages(groupId) {
    if (!db) return;
    
    try {
        const messagesRef = db.collection('groups').doc(groupId).collection('messages');
        
        // Listen for real-time updates
        messagesRef
            .orderBy('timestamp', 'asc')
            .limit(50)
            .onSnapshot((snapshot) => {
                const container = document.getElementById('groupMessages');
                if (!container) return;
                
                if (snapshot.empty) {
                    container.innerHTML = `
                        <div class="welcome-message">
                            <i class="fas fa-comments"></i>
                            <p>¡Bienvenido al grupo! Empieza la conversación</p>
                        </div>
                    `;
                    return;
                }
                
                const messagesHTML = [];
                snapshot.forEach(doc => {
                    const msg = doc.data();
                    messagesHTML.push(`
                        <div class="message-item">
                            <img src="${msg.userAvatar || 'https://via.placeholder.com/40'}" class="message-avatar" alt="${msg.userName}">
                            <div class="message-content">
                                <div class="message-header">
                                    <span class="message-username">${msg.userName}</span>
                                    <span class="message-timestamp">${formatTimestamp(msg.timestamp)}</span>
                                </div>
                                <div class="message-text">${msg.text}</div>
                            </div>
                        </div>
                    `);
                });
                
                container.innerHTML = messagesHTML.join('');
                container.scrollTop = container.scrollHeight;
            });
    } catch (error) {
        console.error('Error loading group messages:', error);
    }
}

async function sendGroupMessage() {
    if (!currentGroup || !currentUser || !db) return;
    
    const input = document.getElementById('groupMessageInput');
    const text = input?.value.trim();
    
    if (!text) return;
    
    try {
        const messagesRef = db.collection('groups').doc(currentGroup.id).collection('messages');
        
        await messagesRef.add({
            text: text,
            userId: currentUser.uid,
            userName: currentUser.displayName || 'Usuario',
            userAvatar: currentUser.photoURL || '',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update group message count
        await db.collection('groups').doc(currentGroup.id).update({
            messageCount: firebase.firestore.FieldValue.increment(1),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (input) input.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        showGroupToast('Error al enviar el mensaje', 'error');
    }
}

// ==========================================
// MEMBERS MANAGEMENT
// ==========================================

async function loadGroupMembers() {
    if (!currentGroup || !db) return;
    
    try {
        const membersRef = db.collection('groups').doc(currentGroup.id).collection('members');
        const snapshot = await membersRef.orderBy('role', 'asc').get();
        
        const container = document.getElementById('groupMembersList');
        if (!container) return;
        
        if (snapshot.empty) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-users-slash"></i><p>No hay miembros</p></div>';
            return;
        }
        
        const isAdmin = currentGroup.admins?.includes(currentUser?.uid);
        
        const membersHTML = [];
        snapshot.forEach(doc => {
            const member = doc.data();
            const isCurrentUser = member.uid === currentUser?.uid;
            
            membersHTML.push(`
                <div class="member-item">
                    <img src="${member.avatar || 'https://via.placeholder.com/45'}" class="member-avatar" alt="${member.name}">
                    <div class="member-info">
                        <div class="member-name">
                            ${member.name}
                            ${member.role === 'admin' ? '<span class="group-role-badge">ADMIN</span>' : ''}
                        </div>
                        <div class="member-role">
                            Miembro desde ${formatTimestamp(member.joinedAt)}
                        </div>
                    </div>
                    ${isAdmin && !isCurrentUser ? `
                        <div class="member-actions">
                            <button class="member-action-btn" onclick="promoteMember('${member.uid}')" title="Promover a admin">
                                <i class="fas fa-user-shield"></i>
                            </button>
                            <button class="member-action-btn danger" onclick="removeMember('${member.uid}')" title="Eliminar del grupo">
                                <i class="fas fa-user-times"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `);
        });
        
        container.innerHTML = membersHTML.join('');
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

async function removeMember(memberId) {
    if (!currentGroup || !db) return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar a este miembro?')) return;
    
    try {
        const groupRef = db.collection('groups').doc(currentGroup.id);
        
        // Remove from members array
        await groupRef.update({
            members: firebase.firestore.FieldValue.arrayRemove(memberId),
            memberCount: firebase.firestore.FieldValue.increment(-1)
        });
        
        // Delete member document
        await groupRef.collection('members').doc(memberId).delete();
        
        showGroupToast('Miembro eliminado del grupo', 'success');
        loadGroupMembers();
    } catch (error) {
        console.error('Error removing member:', error);
        showGroupToast('Error al eliminar el miembro', 'error');
    }
}

async function promoteMember(memberId) {
    if (!currentGroup || !db) return;
    
    try {
        const groupRef = db.collection('groups').doc(currentGroup.id);
        
        // Add to admins array
        await groupRef.update({
            admins: firebase.firestore.FieldValue.arrayUnion(memberId)
        });
        
        // Update member role
        await groupRef.collection('members').doc(memberId).update({
            role: 'admin'
        });
        
        showGroupToast('Miembro promovido a administrador', 'success');
        loadGroupMembers();
    } catch (error) {
        console.error('Error promoting member:', error);
        showGroupToast('Error al promover el miembro', 'error');
    }
}

// ==========================================
// JOIN/LEAVE GROUP
// ==========================================

async function joinGroup() {
    if (!currentGroup || !currentUser || !db) return;
    
    try {
        const groupRef = db.collection('groups').doc(currentGroup.id);
        
        if (currentGroup.privacy === 'private') {
            // Send join request
            await groupRef.collection('requests').doc(currentUser.uid).set({
                uid: currentUser.uid,
                name: currentUser.displayName || 'Usuario',
                avatar: currentUser.photoURL || '',
                requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending'
            });
            
            showGroupToast('Solicitud enviada. Espera la aprobación del administrador.', 'success');
        } else {
            // Join directly
            await groupRef.update({
                members: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
                memberCount: firebase.firestore.FieldValue.increment(1)
            });
            
            await groupRef.collection('members').doc(currentUser.uid).set({
                uid: currentUser.uid,
                name: currentUser.displayName || 'Usuario',
                avatar: currentUser.photoURL || '',
                role: 'member',
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showGroupToast('¡Te has unido al grupo!', 'success');
            loadGroupDetails(currentGroup.id);
            loadUserGroups();
        }
    } catch (error) {
        console.error('Error joining group:', error);
        showGroupToast('Error al unirse al grupo', 'error');
    }
}

async function leaveGroup() {
    if (!currentGroup || !currentUser || !db) return;
    
    if (!confirm('¿Estás seguro de que quieres salir de este grupo?')) return;
    
    try {
        const groupRef = db.collection('groups').doc(currentGroup.id);
        
        await groupRef.update({
            members: firebase.firestore.FieldValue.arrayRemove(currentUser.uid),
            admins: firebase.firestore.FieldValue.arrayRemove(currentUser.uid),
            memberCount: firebase.firestore.FieldValue.increment(-1)
        });
        
        await groupRef.collection('members').doc(currentUser.uid).delete();
        
        showGroupToast('Has salido del grupo', 'success');
        closeGroupDetailsModal();
        loadUserGroups();
    } catch (error) {
        console.error('Error leaving group:', error);
        showGroupToast('Error al salir del grupo', 'error');
    }
}

// Setup join/leave buttons
document.getElementById('joinGroupBtn')?.addEventListener('click', joinGroup);
document.getElementById('leaveGroupBtn')?.addEventListener('click', leaveGroup);

// ==========================================
// PENDING REQUESTS
// ==========================================

async function loadPendingRequests() {
    if (!currentGroup || !db) return;
    
    try {
        const requestsRef = db.collection('groups').doc(currentGroup.id).collection('requests');
        const snapshot = await requestsRef.where('status', '==', 'pending').get();
        
        const container = document.getElementById('pendingRequestsList');
        if (!container) return;
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No hay solicitudes pendientes</p>
                </div>
            `;
            return;
        }
        
        const requestsHTML = [];
        snapshot.forEach(doc => {
            const request = doc.data();
            requestsHTML.push(`
                <div class="request-item">
                    <img src="${request.avatar || 'https://via.placeholder.com/50'}" class="request-avatar" alt="${request.name}">
                    <div class="request-info">
                        <div class="request-name">${request.name}</div>
                        <div class="request-time">${formatTimestamp(request.requestedAt)}</div>
                    </div>
                    <div class="request-actions">
                        <button class="request-accept-btn" onclick="acceptRequest('${request.uid}')">
                            <i class="fas fa-check"></i> Aceptar
                        </button>
                        <button class="request-reject-btn" onclick="rejectRequest('${request.uid}')">
                            <i class="fas fa-times"></i> Rechazar
                        </button>
                    </div>
                </div>
            `);
        });
        
        container.innerHTML = requestsHTML.join('');
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

async function acceptRequest(userId) {
    if (!currentGroup || !db) return;
    
    try {
        const groupRef = db.collection('groups').doc(currentGroup.id);
        
        // Add to members
        await groupRef.update({
            members: firebase.firestore.FieldValue.arrayUnion(userId),
            memberCount: firebase.firestore.FieldValue.increment(1)
        });
        
        // Get user info from request
        const requestDoc = await groupRef.collection('requests').doc(userId).get();
        const requestData = requestDoc.data();
        
        // Add to members collection
        await groupRef.collection('members').doc(userId).set({
            uid: userId,
            name: requestData.name,
            avatar: requestData.avatar,
            role: 'member',
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Delete request
        await groupRef.collection('requests').doc(userId).delete();
        
        showGroupToast('Solicitud aceptada', 'success');
        loadPendingRequests();
        updatePendingRequestsBadge(currentGroup.id);
    } catch (error) {
        console.error('Error accepting request:', error);
        showGroupToast('Error al aceptar la solicitud', 'error');
    }
}

async function rejectRequest(userId) {
    if (!currentGroup || !db) return;
    
    try {
        await db.collection('groups').doc(currentGroup.id).collection('requests').doc(userId).delete();
        
        showGroupToast('Solicitud rechazada', 'success');
        loadPendingRequests();
        updatePendingRequestsBadge(currentGroup.id);
    } catch (error) {
        console.error('Error rejecting request:', error);
        showGroupToast('Error al rechazar la solicitud', 'error');
    }
}

async function updatePendingRequestsBadge(groupId) {
    if (!db) return;
    
    try {
        const snapshot = await db.collection('groups').doc(groupId).collection('requests')
            .where('status', '==', 'pending').get();
        
        const badge = document.getElementById('pendingRequestsBadge');
        if (badge) {
            badge.textContent = snapshot.size;
            badge.style.display = snapshot.size > 0 ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Error updating badge:', error);
    }
}

// ==========================================
// INVITE & QR CODE
// ==========================================

function generateInviteLink() {
    if (!currentGroup) return;
    
    const baseUrl = window.location.origin + window.location.pathname;
    const inviteLink = `${baseUrl}?join=${currentGroup.id}`;
    
    const input = document.getElementById('inviteLink');
    if (input) {
        input.value = inviteLink;
    }
}

function copyInviteLink() {
    const input = document.getElementById('inviteLink');
    if (input) {
        input.select();
        document.execCommand('copy');
        showGroupToast('Link copiado al portapapeles', 'success');
    }
}

function generateQRCode() {
    if (!currentGroup || typeof QRCode === 'undefined') return;
    
    const canvas = document.getElementById('qrCodeCanvas');
    if (canvas) {
        const baseUrl = window.location.origin + window.location.pathname;
        const inviteLink = `${baseUrl}?join=${currentGroup.id}`;
        
        // Clear previous QR
        canvas.innerHTML = '';
        
        new QRCode(canvas, {
            text: inviteLink,
            width: 250,
            height: 250,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

function downloadQR() {
    const canvas = document.querySelector('#qrCodeCanvas canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = `grupo-${currentGroup?.name || 'qr'}.png`;
        link.href = canvas.toDataURL();
        link.click();
        showGroupToast('QR descargado', 'success');
    }
}

// ==========================================
// UTILITIES
// ==========================================

function setupCharacterCounters() {
    const inputs = [
        { id: 'groupName', max: 50 },
        { id: 'groupDescription', max: 200 }
    ];
    
    inputs.forEach(({ id, max }) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => {
                const counter = input.parentElement?.querySelector('.char-counter');
                if (counter) {
                    counter.textContent = `${input.value.length}/${max}`;
                }
            });
        }
    });
}

function handleGroupsSearch() {
    const searchInput = document.getElementById('groupsSearchInput');
    const searchTerm = searchInput?.value.toLowerCase();
    
    if (!searchTerm) {
        loadUserGroups();
        return;
    }
    
    // Filter current groups
    const filtered = userGroups.filter(group => 
        group.name.toLowerCase().includes(searchTerm) ||
        group.description?.toLowerCase().includes(searchTerm)
    );
    
    renderGroupsList(filtered, 'myGroupsList');
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
        return 'Ahora';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `Hace ${minutes} min`;
    }
    
    // Less than 1 day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `Hace ${hours} hr`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `Hace ${days} días`;
    }
    
    // Format date
    return date.toLocaleDateString('es-MX', { 
        day: 'numeric', 
        month: 'short' 
    });
}

function showGroupToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.log('Toast:', message, type);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <div class="toast-content">
            <div class="toast-title">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Check for invite link on page load
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinGroupId = urlParams.get('join');
    
    if (joinGroupId) {
        setTimeout(() => {
            if (currentUser) {
                openGroupDetailsModal(joinGroupId);
            } else {
                showGroupToast('Por favor inicia sesión para unirte al grupo', 'info');
            }
        }, 2000);
    }
});

console.log('✅ Groups JavaScript loaded');
