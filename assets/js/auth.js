import { activeConfig as CONFIG } from './settings_manager.js';
import { setCookie, getCookie } from './utils.js';
import { showModal, closeModal } from './modal.js';

export const studentNames = (CONFIG.platform && CONFIG.platform.students ? CONFIG.platform.students : []).sort();
export let loggedInUser = null;
export let currentUserId = null;

const COOKIE_NAME = "cf_user";

function flushOldCookies() {
    if (getCookie("username")) {
        console.log('flushOldCookies: Removing legacy "username" cookie.');
        setCookie("username", "", -1);
    }
}

export function renderLoginStatus() {
    let username = getCookie(COOKIE_NAME);
    console.log('renderLoginStatus: username from cookie ->', username);

    // Explicitly remove Anonymous cookie if found
    if (username && username.toLowerCase() === 'anonymous') {
        console.log('renderLoginStatus: Found "Anonymous" cookie. Removing it to force re-login.');
        setCookie(COOKIE_NAME, "", -1);
        username = null;
    }

    const container = document.getElementById('user-info');
    if (!container) return;
    container.innerHTML = '';
    
    if (username) {
        loggedInUser = username;
        const badge = document.createElement('span');
        badge.className = 'user-badge';
        badge.textContent = `Hi, ${username}`;
        container.appendChild(badge);

        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-secondary';
        logoutBtn.style.padding = '0.25rem 0.75rem';
        logoutBtn.style.fontSize = '0.8rem';
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = logout;
        container.appendChild(logoutBtn);
    } else {
        loggedInUser = null;
        const loginBtn = document.createElement('button');
        loginBtn.className = 'btn btn-primary';
        loginBtn.style.padding = '0.4rem 1rem';
        loginBtn.style.fontSize = '0.85rem';
        loginBtn.textContent = 'Login';
        loginBtn.onclick = showLoginModal;
        container.appendChild(loginBtn);
    }
}

export async function logout() {
    console.log('logout: Attempting to log out user.');
    localStorage.setItem('logout_event', 'true');
    
    try {
        await fetch(CONFIG.endpoints.data + '/logout', { method: 'POST', credentials: 'include' });
    } catch(e) { console.warn("Backend logout failed", e); }

    setCookie(COOKIE_NAME, "", -1);
    renderLoginStatus();
    window.location.reload();
}

export function showLoginModal() {
    const modal = document.getElementById('modal-login');
    const list = document.getElementById('name-list');
    list.innerHTML = '';
    studentNames.forEach(name => {
        const item = document.createElement('div');
        item.className = 'name-list-item';
        item.textContent = name;
        item.onclick = () => handleNameSelection(name);
        list.appendChild(item);
    });
    showModal('modal-login');
}

export function handleNameSelection(name) {
    localStorage.removeItem('logout_event');
    const current = getCookie(COOKIE_NAME);
    if (current === name) {
         // Already logged in as this user.
         loggedInUser = name;
         renderLoginStatus();
         closeModal('modal-login');
         return; 
    }
    flushOldCookies(); // Ensure legacy cookies are cleared
    setCookie(COOKIE_NAME, name, 7); // Set new cookie for 7 days
    renderLoginStatus();
    closeModal('modal-login');
    // Sync with backend immediately
    UserTracker.register(name).then(() => UserTracker.init());
}

export const UserTracker = {
    async init() {
        console.log('UserTracker: Initializing...');
        // 1. Check Local Cookie for Name
        flushOldCookies(); // Flush legacy cookies for new visitors/upgraded users
        renderLoginStatus(); 
        
        if (!loggedInUser) {
             console.log('UserTracker: No user logged in. Skipping server tracking initialization.');
             return;
        }
        
        try {
            // 2. Ping track to establish/check UUID
            console.log('UserTracker: Pinging /v2/track endpoint.');
            const res = await fetch(CONFIG.endpoints.data + '/v2/track', { credentials: 'include' });
            if (!res.ok) throw new Error("Failed to ping /v2/track");
            const data = await res.json();
            console.log('UserTracker: /v2/track response:', data);
            
            if (data.userId) {
                currentUserId = data.userId;
                console.log('UserTracker: currentUserId set to', currentUserId);
            }

            // 3. Synchronization Logic
            let backendName = data.name;
            if (backendName && backendName.toLowerCase() === 'anonymous') {
                backendName = null; // Treat backend "Anonymous" as no session
            }

            if (backendName) {
                // Backend has a valid session (e.g. "Alice")
                if (!loggedInUser) {
                    if (localStorage.getItem('logout_event') === 'true') {
                        console.log("UserTracker: Detected explicit logout. Ignoring backend restoration.");
                        return;
                    }
                    // Restore session from backend
                    console.log("UserTracker: Restoring session from backend:", backendName);
                    loggedInUser = backendName;
                    setCookie(COOKIE_NAME, backendName, 7); // Restore with 7 days expiry
                    renderLoginStatus();
                } else if (loggedInUser !== backendName) {
                    // Conflict: Frontend cookie differs from Backend session.
                    if (loggedInUser.toLowerCase() === 'anonymous') {
                        console.log("UserTracker: Frontend is Anonymous, ignoring backend session.");
                    } else {
                        // Trust frontend (user action) -> update backend
                        console.warn("UserTracker: Conflict detected, syncing frontend username to backend.");
                        await this.register(loggedInUser);
                    }
                }
            } else {
                // Backend has no session (or was Anonymous)
                if (loggedInUser && loggedInUser.toLowerCase() !== 'anonymous') {
                    // Frontend has user -> Register to create backend session
                    console.log("UserTracker: Frontend has user, registering with backend:", loggedInUser);
                    await this.register(loggedInUser);
                } else {
                    // No session anywhere
                    console.log("UserTracker: No session found.");
                    if (!loggedInUser) {
                         showLoginModal();
                    }
                    // If loggedInUser is Anonymous, we just stay Anonymous (no backend sync)
                }
            }
        } catch (e) { 
            console.warn("UserTracker: Tracking init failed", e);
            if (!loggedInUser) showLoginModal();
        }
    },
    async register(name) {
        if (!name || name.toLowerCase() === 'anonymous') {
            console.error("UserTracker: Cannot register anonymous user.");
            return;
        }
        console.log('UserTracker: Attempting to register name:', name);
        try {
            const res = await fetch(CONFIG.endpoints.data + '/v2/track', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name }),
                credentials: 'include'
            });
            if (res.ok) {
                console.log('UserTracker: Name registered successfully:', name);
            } else {
                console.error('UserTracker: Failed to register name. Status:', res.status);
            }
        } catch (e) { console.error("UserTracker: Register failed", e); }
    },
    async submitScore(correct, total, timeMs, mode, tags) {
        if (!loggedInUser || loggedInUser.toLowerCase() === 'anonymous') {
            console.warn('UserTracker: Not logged in or Anonymous, score not submitted.');
            return;
        } 
        console.log('UserTracker: Submitting score for user:', loggedInUser, { correct, total, timeMs });
        try {
            const res = await fetch(CONFIG.endpoints.data + '/v2/submit-score', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    correct, 
                    total, 
                    timeMs, 
                    mode: mode || 'standard',
                    tags: tags || [] 
                }),
                credentials: 'include'
            });
            if (res.ok) {
                console.log('UserTracker: Score submitted successfully.');
            } else {
                console.error('UserTracker: Failed to submit score. Status:', res.status);
            }
        } catch (e) { console.error("UserTracker: Score submit failed", e); }
    },
    async trackAttempt(qId, isCorrect, chapter, set, tags, platform_mode, user_answer) {
         if (!loggedInUser || loggedInUser.toLowerCase() === 'anonymous') {
             console.warn('UserTracker: Not logged in or Anonymous, attempt not tracked.');
             return; // Do not track anonymous attempts
         }
         console.log('UserTracker: Tracking attempt for user:', loggedInUser, { qId, isCorrect, chapter, set, tags, platform_mode });
         try {
            const res = await fetch(CONFIG.endpoints.data + '/v2/attempt', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    question_id: qId, 
                    is_correct: isCorrect, 
                    chapter: chapter || '00', 
                    set_name: set || '00',
                    tags: tags || [],
                    platform_mode: platform_mode || 'unknown',
                    user_answer: user_answer || null
                    // name is no longer needed here as it's handled by session/cookie
                }),
                credentials: 'include'
            });
            if (res.ok) {
                console.log('UserTracker: Attempt tracked successfully.');
            } else {
                console.error('UserTracker: Failed to track attempt. Status:', res.status);
            }
         } catch(e) { console.error("UserTracker: Attempt track failed", e); }
    }
};