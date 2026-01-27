import { activeConfig as CONFIG } from '../settings_manager.js';
import { Utils } from '../utils.js';
import { LeaderboardManager } from '../ui/leaderboard.js';

// TAG_SETS moved to CONFIG.tags.definitions in config.js


const state = {
    rawUsers: [], consolidatedUsers: [], genaiLogs: [],
    viewMode: 'overall', sourceMode: 'QB', groupMode: 'chapter', tagCategory: 'clusters',
    filterAnswered: false, timeFilter: 'all', 
    allQuestions: {}, userAttempts: {}, allUserAttempts: {}, overallStats: {}, 
    currentUser: null, isDataLoaded: false, embeddingMap: {}
};

let leaderboardManager = null;

export async function init() {
    console.log('[Init] Admin panel loading...');
    setupTheme();
    setupEventListeners();
    setupMobileSidebar();
    
    leaderboardManager = new LeaderboardManager({ switchView: () => {} });
    window.leaderboardManager = leaderboardManager; // Expose globally for HTML onclicks

    try {
        await fetchQuestionStructure();
        await fetchUsers();
        switchView('overall');
    } catch(e) { 
        console.error("Init failed:", e);
        showError("Initialization failed. Please check your connection and try again.");
    }
}

function setupTheme() {
    const toggle = document.getElementById('theme-toggle');
    const applyTheme = (isDark) => {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        toggle.textContent = isDark ? '☀️' : '🌙';
    };
    const saved = localStorage.getItem('theme');
    applyTheme(saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches));
    toggle.onclick = () => applyTheme(!document.documentElement.classList.contains('dark'));
}

function setupEventListeners() {
    const ids = {
        'btn-view-chapter': () => switchGroup('chapter'),
        'btn-view-tag': () => switchGroup('tag')
    };

    // Dynamic Views
    if (CONFIG.platform.admin && CONFIG.platform.admin.views) {
        CONFIG.platform.admin.views.forEach(view => {
            if (view.tabId) ids[view.tabId] = () => switchView(view.id);
        });
    }

    // Dynamic Sources
    if (CONFIG.platform.admin && CONFIG.platform.admin.sources) {
        CONFIG.platform.admin.sources.forEach(src => {
            if (src.btnId) ids[src.btnId] = () => switchSource(src.id);
        });
    }

    // Dynamic Tag Categories
    if (CONFIG.tags && CONFIG.tags.categories) {
        CONFIG.tags.categories.forEach(cat => {
            ids[`btn-tag-${cat.id}`] = () => switchTagCategory(cat.id);
        });
    }

    for (const [id, handler] of Object.entries(ids)) {
        const el = document.getElementById(id);
        if (el) el.onclick = handler;
    }

    const chkAnswered = document.getElementById('chk-answered-only');
    if (chkAnswered) {
        chkAnswered.onchange = (e) => { 
            console.log(`[Filter] Answered Only toggled: ${e.target.checked}`);
            state.filterAnswered = e.target.checked; 
            renderProgressMap(); 
        };
    }

    const timeFilter = document.getElementById('time-filter');
    if (timeFilter) {
        timeFilter.onchange = (e) => {
            console.log(`[Filter] Time filter changed to: ${e.target.value}`);
            state.timeFilter = e.target.value;
            
            const searchTerm = document.getElementById('user-search').value.toLowerCase();
            renderUserList(searchTerm);

            if (state.viewMode === 'overall') {
                 state.isDataLoaded = false;
                 fetchOverallStats();
            }
            else if (state.viewMode === 'individual' && state.currentUser) selectUser(state.currentUser);
            else renderProgressMap();
        };
    }

    const userSearch = document.getElementById('user-search');
    if (userSearch) {
        userSearch.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            if (state.viewMode === 'genai') renderGenAILogs(term);
            else renderUserList(term);
        };
    }

    const btnWeakness = document.getElementById('btn-load-weakness');
    if (btnWeakness) btnWeakness.onclick = loadStudentWeaknesses;
    
    const btnConfig = document.getElementById('btn-weakness-config');
    if (btnConfig) {
        btnConfig.onclick = () => {
            document.getElementById('weakness-config-panel').classList.toggle('hidden');
            btnConfig.classList.toggle('active');
        };
    }
}

function setupMobileSidebar() {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn-icon mobile-menu-toggle';
    toggleBtn.innerHTML = '☰';
    toggleBtn.style.cssText = 'display: none; font-size: 1.5rem; margin-right: 1rem;';
    
    const headerInner = document.querySelector('.header-inner');
    if (headerInner) {
        headerInner.insertBefore(toggleBtn, headerInner.firstChild);
        
        toggleBtn.onclick = () => {
            document.querySelector('.sidebar').classList.toggle('active');
        };
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const toggle = document.querySelector('.mobile-menu-toggle');
            if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

function showError(msg) {
    const container = document.getElementById('chapters-container');
    if (container) {
        container.innerHTML = `<div class="card" style="border-left: 4px solid var(--error); padding: 1rem;">
            <h4 style="color: var(--error); margin-bottom: 0.5rem;">Error</h4>
            <p>${msg}</p>
        </div>`;
    } else {
        alert(msg);
    }
}

async function handleFetchError(response) {
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            window.location.href = 'index.html'; // Redirect to login/home if unauthorized
            throw new Error("Unauthorized");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
}

async function loadStudentWeaknesses() {
    const container = document.getElementById('weakness-results');
    container.innerHTML = '<div class="text-center p-8" style="grid-column: 1/-1;"><div class="spinner"></div><div class="mt-2 text-sm text-muted">Analyzing student attempts via Embedding Clusters... This may take a moment.</div></div>';
    
    const minAttempts = parseInt(document.getElementById('inp-weak-min').value) || 3;
    const threshold = (parseInt(document.getElementById('inp-weak-acc').value) || 60) / 100;

    try {
        const report = [];
        const users = state.consolidatedUsers; 
        
        const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
        const batches = chunk(users, 3);

        for (const batch of batches) {
            await Promise.all(batch.map(async (u) => {
                try {
                    const res = await fetch(`${CONFIG.endpoints.data}/admin/attempts?name=${encodeURIComponent(u.name)}`, { credentials: 'include' });
                    await handleFetchError(res);
                    const attempts = await res.json();
                    
                    const clusterStats = {};
                    attempts.forEach(a => {
                        let cluster = state.embeddingMap ? state.embeddingMap[a.question_id] : null;
                        if (!cluster) return; 

                        if (!clusterStats[cluster]) clusterStats[cluster] = { total: 0, correct: 0 };
                        clusterStats[cluster].total++;
                        if (a.is_correct) clusterStats[cluster].correct++;
                    });

                    const weakClusters = Object.entries(clusterStats)
                        .filter(([cls, stat]) => stat.total >= minAttempts && (stat.correct / stat.total) < threshold)
                        .map(([cls, stat]) => ({ tag: cls, acc: Math.round((stat.correct/stat.total)*100), total: stat.total }))
                        .sort((a,b) => a.acc - b.acc);

                    if (weakClusters.length > 0) {
                        report.push({ user: u.name, weaknesses: weakClusters });
                    }
                } catch(e) { console.error(`Failed to analyze ${u.name}`, e); }
            }));
        }
        renderWeaknessReport(report);
    } catch(e) {
        container.innerHTML = `<div class="text-error" style="grid-column: 1/-1;">Analysis failed: ${e.message}</div>`;
    }
}

function renderWeaknessReport(report) {
    const container = document.getElementById('weakness-results');
    if (report.length === 0) {
        container.innerHTML = '<div class="text-center p-4 text-muted" style="grid-column: 1/-1;">No significant weaknesses detected across the cohort based on current criteria.</div>';
        return;
    }

    container.innerHTML = report.map(r => `
        <div class="stat-card" style="padding: 1.25rem; border: 1px solid var(--border); background: var(--bg-card);">
            <div style="font-weight: 800; margin-bottom: 0.75rem; display:flex; justify-content:space-between; align-items: center;">
                <span>${r.user}</span>
                <span class="text-muted" style="font-size:0.75rem;">${r.weaknesses.length} Clusters</span>
            </div>
            <div class="flex flex-wrap gap-2" style="padding-right: 4px;">
                ${r.weaknesses.map(w => `
                    <span style="font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 0.4rem; background: rgba(239, 68, 68, 0.1); color: var(--error); border: 1px solid rgba(239, 68, 68, 0.2); display: flex; align-items: center; gap: 0.3rem; max-width: 100%;">
                        <span style="display:block; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${w.tag}">${w.tag}</span>
                        <b style="opacity:1; flex-shrink: 0;">${w.acc}%</b>
                    </span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

let charts = {};

async function renderVisualizer() {
    ['chart-overall', 'chart-student-dist', 'chart-time', 'chart-daily'].forEach(id => {
        if (charts[id]) { charts[id].destroy(); delete charts[id]; }
    });

    const users = state.consolidatedUsers;
    const attemptsByChapter = {};
    
    let dailyData = [];
    try {
        const dailyRes = await fetch(CONFIG.endpoints.data + '/admin/daily', { credentials: 'include' });
        if (dailyRes.ok) {
            dailyData = await dailyRes.json();
        }
    } catch (e) {
        console.warn("Failed to fetch daily analytics:", e);
    }
    
    if (!state.isDataLoaded) await fetchOverallStats();
    Object.values(state.allQuestions).flat().forEach(q => {
        if (state.overallStats[q.id]) {
            if (!attemptsByChapter[q.chapter]) attemptsByChapter[q.chapter] = 0;
            attemptsByChapter[q.chapter] += state.overallStats[q.id].total;
        }
    });

    const accRanges = { '0-40%': 0, '40-60%': 0, '60-80%': 0, '80-100%': 0 };
    users.forEach(u => {
        const acc = u.attempted > 0 ? (u.correct / u.attempted) * 100 : 0;
        if (acc < 40) accRanges['0-40%']++;
        else if (acc < 60) accRanges['40-60%']++;
        else if (acc < 80) accRanges['60-80%']++;
        else accRanges['80-100%']++;
    });

    let avgTimePerQ = [], studentNames = [];
    try {
        const lbRes = await fetch(CONFIG.endpoints.data + '/v2/leaderboard?source=all', { credentials: 'include' });
        if (lbRes.ok) {
            const lbData = await lbRes.json();
            const topStudents = lbData.slice(0, 10);
            avgTimePerQ = topStudents.map(s => s.total_attempted > 0 ? Math.round(s.total_time_ms / s.total_attempted / 1000) : 0);
            studentNames = topStudents.map(s => s.name || 'User');
        }
    } catch (e) { console.warn("Leaderboard fetch failed for visualizer", e); }

    const ctx0 = document.getElementById('chart-daily').getContext('2d');
    charts['chart-daily'] = new Chart(ctx0, {
        type: 'bar',
        data: {
            labels: dailyData.map(d => new Date(d.day).toLocaleDateString()),
            datasets: [
                { label: 'Attempts', data: dailyData.map(d => d.attempts), backgroundColor: '#4f46e5', order: 2 },
                { label: 'Correct', data: dailyData.map(d => d.correct), backgroundColor: '#10b981', order: 3 },
                { label: 'Active Users', data: dailyData.map(d => d.active_users), borderColor: '#f59e0b', type: 'line', yAxisID: 'y1', order: 1 }
            ]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Questions' } },
                y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Users' } }
            },
            plugins: { 
                tooltip: { 
                    mode: 'index', 
                    intersect: false,
                    callbacks: {
                        afterBody: (context) => {
                            const index = context[0].dataIndex;
                            const dayData = dailyData[index];
                            if (dayData && dayData.names && dayData.names.length > 0) {
                                return '\nActive Students:\n' + dayData.names.join(', ');
                            }
                            return '';
                        }
                    }
                } 
            }
        }
    });
    
    const ctx1 = document.getElementById('chart-overall').getContext('2d');
    charts['chart-overall'] = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: Object.keys(attemptsByChapter).sort((a,b) => !isNaN(a) ? a-b : a.localeCompare(b)).map(c => `Ch ${c}`),
            datasets: [{ label: 'Total Attempts', data: Object.keys(attemptsByChapter).sort((a,b) => !isNaN(a) ? a-b : a.localeCompare(b)).map(k => attemptsByChapter[k]), backgroundColor: '#4f46e5' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctx2 = document.getElementById('chart-student-dist').getContext('2d');
    charts['chart-student-dist'] = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: Object.keys(accRanges),
            datasets: [{ data: Object.values(accRanges), backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctx3 = document.getElementById('chart-time').getContext('2d');
    charts['chart-time'] = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: studentNames,
            datasets: [{ label: 'Avg Sec/Question', data: avgTimePerQ, backgroundColor: '#8b5cf6' }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'Seconds' } } } }
    });
}

function switchView(mode) {
    console.log(`[Switch] View changed to: ${mode}`);
    state.viewMode = mode;
    
    const views = CONFIG.platform.admin ? CONFIG.platform.admin.views : [];
    const activeView = views.find(v => v.id === mode);
    
    // Toggle Tab Active Classes
    views.forEach(v => {
        const tab = document.getElementById(v.tabId);
        if (tab) tab.classList.toggle('active', v.id === mode);
        
        // Hide all containers initially (if they are unique)
        if (v.containerId && v.id !== mode) {
            const container = document.getElementById(v.containerId);
            // Only hide if no other active view uses this container
            const otherActive = views.find(ov => ov.id === state.viewMode && ov.containerId === v.containerId);
            if (container && !otherActive) container.classList.add('hidden');
        }
    });

    // Show Active Container
    if (activeView && activeView.containerId) {
        const container = document.getElementById(activeView.containerId);
        if (container) container.classList.remove('hidden');
    }
    
    const search = document.getElementById('user-search');
    if (search) search.value = '';
    
    const header = document.getElementById('selected-user-name');
    const sub = document.getElementById('selected-user-stats');
    const controls = document.getElementById('admin-view-controls');
    const weaknessSection = document.getElementById('weakness-section');
    const summaryCard = document.getElementById('student-summary-card');

    if (activeView) {
        if (header && activeView.title) header.textContent = activeView.title;
        if (sub && activeView.subtitle) sub.textContent = activeView.subtitle;
        if (search && activeView.searchPlaceholder) search.placeholder = activeView.searchPlaceholder;
    }

    if(controls) controls.classList.remove('hidden');
    if(summaryCard) summaryCard.classList.add('hidden');
    if(weaknessSection) weaknessSection.classList.add('hidden');
    
    // Close mobile sidebar if open
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('active');
    }

    if (mode === 'genai') {
        renderGenAILogs();
        fetchGenAILogs();
    } else if (mode === 'leaderboard') {
        renderUserList();
        if(controls) controls.classList.add('hidden');
        leaderboardManager.fetchAndRender('all');
    } else if (mode === 'weakness') {
        if(controls) controls.classList.add('hidden');
        if(weaknessSection) weaknessSection.classList.remove('hidden');
        renderWeaknessAnalysis();
    } else if (mode === 'visualizer') {
        if(controls) controls.classList.add('hidden');
        renderVisualizer();
    } else if (mode === 'overall') {
        fetchOverallStats();
    } else {
        renderUserList();
    }
}

function renderWeaknessAnalysis() {
    // Stub function if it was missing in original logic, but loadStudentWeaknesses is the main one.
    // The view initialization already sets up the "Run Analysis" button.
}

function switchSource(mode) {
    console.log(`[Switch] Source changed to: ${mode}`);
    state.sourceMode = mode;
    
    if (CONFIG.platform.admin && CONFIG.platform.admin.sources) {
        CONFIG.platform.admin.sources.forEach(src => {
            const el = document.getElementById(src.btnId);
            if (el) el.classList.toggle('active', src.id === mode);
        });
    }
    renderProgressMap();
}

function switchGroup(mode) {
    console.log(`[Switch] Grouping changed to: ${mode}`);
    state.groupMode = mode;
    document.getElementById('btn-view-chapter').classList.toggle('active', mode === 'chapter');
    document.getElementById('btn-view-tag').classList.toggle('active', mode === 'tag');
    document.getElementById('tag-set-toggle').classList.toggle('hidden', mode !== 'tag');
    renderProgressMap();
}

function switchTagCategory(cat) {
    console.log(`[Switch] Tag Category changed to: ${cat}`);
    state.tagCategory = cat;
    if (CONFIG.tags && CONFIG.tags.categories) {
        CONFIG.tags.categories.forEach(c => {
            const btn = document.getElementById(`btn-tag-${c.id}`);
            if(btn) btn.classList.toggle('active', cat === c.id);
        });
    }
    renderProgressMap();
}

async function fetchQuestionStructure() {
    try {
        const sources = (CONFIG.platform.admin && CONFIG.platform.admin.sources) ? 
            CONFIG.platform.admin.sources.filter(s => s.file) : [];
        
        const fetchPromises = sources.map(s => fetch(`${CONFIG.platform.paths.combined}${s.file}`));
        fetchPromises.push(fetch(`${CONFIG.platform.paths.combined}embedding_map.json`));

        const results = await Promise.allSettled(fetchPromises);

        // Handle Embedding Map (last in results)
        const embedRes = results[results.length - 1];
        if (embedRes.status === 'fulfilled' && embedRes.value.ok) {
            const embedData = await embedRes.value.json();
            state.embeddingMap = embedData.clusters;
        }

        // Handle Sources
        for (let i = 0; i < sources.length; i++) {
            const res = results[i];
            const source = sources[i];
            if (res.status === 'fulfilled' && res.value.ok) {
                const data = await res.value.json();
                (data.entries || []).forEach(q => {
                    q.source = source.id; 
                    if (!state.allQuestions[q.chapter]) state.allQuestions[q.chapter] = [];
                    if (!state.allQuestions[q.chapter].find(ex => ex.id === q.id)) state.allQuestions[q.chapter].push(q);
                });
            }
        }
    } catch (e) { console.error(e); throw e; }
}

async function fetchUsers() {
    try {
        const res = await fetch(CONFIG.endpoints.data + '/v2/admin/report/students', { credentials: 'include' });
        await handleFetchError(res);
        const data = await res.json();
        state.consolidatedUsers = data;
        const statsEl = document.getElementById('global-stats');
        if (statsEl) statsEl.textContent = `${state.consolidatedUsers.length} Students Active`;
        renderUserList();
    } catch (e) { console.error("Failed to fetch student report:", e); throw e; }
}

async function fetchOverallStats() {
    if (state.isDataLoaded) { 
        console.log('[Admin] Heatmap data already loaded. Re-rendering...');
        renderProgressMap(); 
        return; 
    }
    console.log(`[Admin] Fetching global heatmap stats (Filter: ${state.timeFilter}h)...`);
    try {
        const res = await fetch(`${CONFIG.endpoints.data}/v2/admin/report/heatmap?hours=${state.timeFilter === 'all' ? 0 : state.timeFilter}`, { credentials: 'include' });
        await handleFetchError(res);
        const data = await res.json();
        console.log(`[Admin] Heatmap data received. ${data.length} records.`);
        
        state.overallStats = {};
        data.forEach(stat => {
            state.overallStats[stat.id] = {
                total: stat.total,
                correct: stat.correct,
                failed_by: stat.failed_by
            };
        });
        
        state.isDataLoaded = true;
        renderProgressMap();
    } catch (e) { console.error("Failed to fetch heatmap:", e); }
}

async function selectUser(user, itemEl) {
    state.currentUser = user;
    if(itemEl) { document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active')); itemEl.classList.add('active'); }
    document.getElementById('selected-user-name').textContent = user.name;
    document.getElementById('selected-user-stats').textContent = `Summary Analytics (${user.attempted} questions attempted)`;
    document.getElementById('chapters-container').innerHTML = '<div class="text-center p-8"><div class="spinner"></div></div>';
    
    try {
        const res = await fetch(`${CONFIG.endpoints.data}/admin/attempts?name=${encodeURIComponent(user.name)}`, { credentials: 'include' });
        await handleFetchError(res);
        const attempts = await res.json();
        
        const total = attempts.length;
        const correct = attempts.filter(a => a.is_correct).length;
        const accuracy = total > 0 ? Math.min(100, Math.round((correct / total) * 100)) : 0;
        document.getElementById('summary-accuracy').textContent = accuracy + '%';
        document.getElementById('summary-attempts').textContent = total;
        document.getElementById('summary-correct').textContent = correct;
        document.getElementById('summary-last-date').textContent = user.last_active ? 'Last: ' + new Date(user.last_active * 1000).toLocaleDateString() : '-';
        document.getElementById('student-summary-card').classList.remove('hidden');

        state.userAttempts = {};
        attempts.forEach(a => { if (!state.userAttempts[a.question_id]) state.userAttempts[a.question_id] = []; state.userAttempts[a.question_id].push(a); });
        renderProgressMap();
    } catch (e) { 
        console.error(e); 
        showError("Failed to fetch user attempts.");
    }
}

async function fetchGenAILogs() {
    try {
        const res = await fetch(CONFIG.endpoints.data + '/admin/genai', { credentials: 'include' });
        await handleFetchError(res);
        const data = await res.json();
        state.genaiLogs = Array.isArray(data) ? data : (data.logs || []);
        renderGenAILogs();
    } catch (e) { console.error(e); }
}

function renderUserList(filter = '') {
    const listEl = document.getElementById('user-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    const now = Math.floor(Date.now() / 1000);
    const timeLimit = state.timeFilter === 'all' ? 0 : now - (parseInt(state.timeFilter) * 3600);

    const filtered = state.consolidatedUsers
        .filter(u => {
            const nameMatch = (u.name || '').toLowerCase().includes(filter);
            const timeMatch = (u.last_active || 0) >= timeLimit;
            return nameMatch && timeMatch;
        })
        .sort((a, b) => (b.last_active || 0) - (a.last_active || 0));

    if (filtered.length === 0) {
        listEl.innerHTML = '<div class="text-center p-4 text-muted" style="font-size:0.8rem;">No students found for this period.</div>';
        return;
    }

    filtered.forEach(u => {
        const div = document.createElement('div');
        div.className = 'user-item';
        const name = u.name || 'Unknown';
        const avatar = `https://robohash.org/${encodeURIComponent(name)}?set=set4&size=80x80`;
        const dateStr = u.last_active ? new Date(u.last_active * 1000).toLocaleDateString() : 'Never';
        div.innerHTML = `<img src="${avatar}" class="user-avatar"><div><div style="font-weight:800; font-size: 0.9rem;">${name}</div><div class="sub-text">Last: ${dateStr} | ${u.attempted} Qs</div></div>`;
        if (state.currentUser && state.currentUser.name === u.name) div.classList.add('active');
        div.onclick = () => selectUser(u, div);
        listEl.appendChild(div);
    });
}

function renderProgressMap() {
    console.log(`[Admin] Rendering Progress Map. Mode: ${state.viewMode}, Source: ${state.sourceMode}, Group: ${state.groupMode}`);
    const container = document.getElementById('chapters-container');
    if (!container) return;
    container.innerHTML = '';
    
    const filteredQs = Object.values(state.allQuestions).flat().filter(q => state.sourceMode === 'ALL' || q.source === state.sourceMode);
    
    const grouped = {};
    
    filteredQs.forEach(q => {
        let key = null;
        if (state.groupMode === 'tag') {
            if (state.tagCategory === 'clusters') {
                key = state.embeddingMap ? state.embeddingMap[q.id] : 'Unclustered';
            } else {
                 const defs = CONFIG.tags && CONFIG.tags.definitions ? CONFIG.tags.definitions[state.tagCategory] : null;
                 if (defs) {
                     const allowedTags = Object.keys(defs);
                     key = (q.tags || []).find(t => allowedTags.includes(t));
                 }
            }
        } else {
            key = q.chapter;
        }
        
        if (key) { if (!grouped[key]) grouped[key] = []; grouped[key].push(q); }
    });

    const keys = Object.keys(grouped).sort((a,b) => {
         if (state.groupMode === 'chapter') return !isNaN(a) ? a - b : a.localeCompare(b);
         return a.localeCompare(b);
    });

    keys.forEach(key => {
        const questions = grouped[key];
        const activeQs = state.viewMode === 'overall' ? questions.filter(q => state.overallStats[q.id]) : questions.filter(q => state.userAttempts[q.id]);
        if (state.filterAnswered && activeQs.length === 0) return;

        const section = document.createElement('div');
        section.className = 'chapter-section';
        
        let titleText = key;
        if (state.groupMode === 'chapter') {
            titleText = 'Chapter ' + key;
        } else if (state.groupMode === 'tag') {
            const defs = CONFIG.tags && CONFIG.tags.definitions ? CONFIG.tags.definitions[state.tagCategory] : null;
            if (defs && defs[key] && defs[key].label) titleText = defs[key].label;
        }

        section.innerHTML = `<div class="chapter-title"><span>${titleText}</span><span style="opacity:0.5; font-size:0.8rem;">${activeQs.length}/${questions.length}</span></div><div class="question-grid"></div>`;
        const grid = section.querySelector('.question-grid');
        
        questions.forEach((q, idx) => {
            let isAnswered = false;
            let stat = null;
            let attempts = null;

            if (state.viewMode === 'overall') {
                stat = state.overallStats[q.id];
                isAnswered = !!stat;
            } else {
                attempts = state.userAttempts[q.id];
                isAnswered = !!attempts;
            }

            if (state.filterAnswered && !isAnswered) return;

            const box = document.createElement('div');
            box.className = 'q-box';
            box.textContent = idx + 1;
            
            if (state.viewMode === 'overall') {
                if (isAnswered) {
                    const acc = (stat.correct / stat.total) * 100;
                    box.classList.add(acc >= 80 ? 'heat-high' : acc >= 50 ? 'heat-mid' : 'heat-low');
                    
                    const uniqueFailed = stat.failed_by || [];
                    if (uniqueFailed.length > 0) {
                        box.title = `Accuracy: ${Math.round(acc)}% | Failed by: ${uniqueFailed.join(', ')}`;
                    } else {
                        box.title = `Accuracy: ${Math.round(acc)}% | Perfect score!`;
                    }

                    box.onclick = () => {
                        fetch(`${CONFIG.endpoints.data}/admin/attempts?questionId=${q.id}`, { credentials: 'include' })
                            .then(r => r.json())
                            .then(attempts => showQuestionDetail(q, attempts));
                    };
                } else box.style.opacity = '0.3';
            } else {
                if (isAnswered) {
                    box.classList.add(attempts[0].is_correct ? 'correct' : 'incorrect');
                    box.onclick = () => showQuestionDetail(q, attempts); 
                } else box.style.opacity = '0.3';
            }
            grid.appendChild(box);
        });
        container.appendChild(section);
    });
}

function renderGenAILogs(filter = '') {
    const container = document.getElementById('chapters-container');
    const filteredLogs = state.genaiLogs.filter(l => (l.name || '').toLowerCase().includes(filter));
    
    container.innerHTML = '<div class="card" style="padding:0; overflow:hidden;"><table class="admin-table"><thead><tr><th>Timestamp</th><th>User</th><th>Tokens</th><th>Cost</th><th></th></tr></thead><tbody>' + 
        filteredLogs.map((l, i) => `<tr><td>${new Date(l.timestamp * 1000).toLocaleString()}</td><td><b>${l.name || 'Unknown'}</b></td><td>${l.tokens_input}/${l.tokens_output}</td><td>$${Number(l.cost_usd).toFixed(4)}</td><td style="text-align:right"><button class="btn btn-secondary action-inspect" data-idx="${i}" style="padding:0.3rem 0.8rem; font-size:0.7rem;">Inspect</button></td></tr>`).join('') + 
        '</tbody></table></div>';
    
    // Attach listeners
    const buttons = container.querySelectorAll('.action-inspect');
    buttons.forEach(btn => {
        btn.onclick = () => showLogDetail(filteredLogs[btn.dataset.idx]);
    });
}

function showLogDetail(log) {
    const modal = document.getElementById('modal-detail');
    document.getElementById('modal-id-badge').textContent = 'Audit Log';
    document.getElementById('modal-title').textContent = log.name || 'Unknown User';
    document.getElementById('modal-status').style.display = 'none';
    document.getElementById('modal-question').innerHTML = `<div class="detail-label">Model</div><div class="mb-4">${log.model}</div><div class="detail-label">Request Payload</div><pre style="font-size:0.75rem; background:var(--bg-body); padding:1rem; border-radius:0.5rem; overflow:auto;">${log.request_payload}</pre>`;
    document.getElementById('modal-explanation').innerHTML = `<div class="detail-label">Response Payload</div><pre style="font-size:0.75rem; background:var(--bg-card); padding:1rem; border-radius:0.5rem; overflow:auto;">${log.response_payload}</pre>`;
    document.getElementById('modal-attempt-info').innerHTML = `<div class="stat-card" style="padding:1rem; background:white;"><span class="label">Token Usage</span><div class="value" style="font-size:1.2rem;">${log.tokens_input + log.tokens_output}</div></div>`;
    document.getElementById('modal-answer').textContent = `$${Number(log.cost_usd).toFixed(5)}`;
    modal.classList.add('active');
}

function showQuestionDetail(question, attempts) {
    console.log(`[Admin] Opening details for Question ${question.id}. Records found: ${attempts ? attempts.length : 0}`);
    
    if (!attempts || attempts.length === 0) {
        console.warn(`[Admin] No attempt history found for ${question.id} despite stats indicating activity.`);
        alert("Detail data is missing for this question. It may have been cleared or the ID is mismatched.");
        return;
    }

    const modal = document.getElementById('modal-detail');
    const latest = attempts[0];
    const isCorrect = latest && latest.is_correct === 1;
    
    document.getElementById('modal-id-badge').textContent = question.id;
    document.getElementById('modal-title').textContent = 'Question Analysis';
    const status = document.getElementById('modal-status');
    
    if (state.viewMode === 'overall') {
        const correctCount = attempts.filter(a => a.is_correct).length;
        const totalAttempts = attempts.length;
        const acc = Math.round((correctCount / totalAttempts) * 100);
        status.className = `status-badge ${acc >= 50 ? 'status-correct' : 'status-incorrect'}`;
        status.textContent = `${acc}% Class Accuracy`;
    } else {
        status.style.display = 'block';
        status.className = `status-badge ${isCorrect ? 'status-correct' : 'status-incorrect'}`;
        status.textContent = isCorrect ? 'PASSED' : 'FAILED';
    }

    let qHTML = `<div class="question-card">${question.questionText}</div>`;
    if (question.options) {
        qHTML += question.options.map((opt, i) => {
            const isRight = question.correctOptions.includes(i);
            return `<div class="option-row ${isRight ? 'is-correct' : ''}"><b>${String.fromCharCode(65+i)}</b> <span>${opt}</span></div>`;
        }).join('');
    }
    document.getElementById('modal-question').innerHTML = qHTML;
    document.getElementById('modal-explanation').innerHTML = question.explanation || 'No pedagogical explanation provided.';
    
    const correctStr = Utils.getCorrectString(question);
    document.getElementById('modal-answer').textContent = correctStr;
    const headerAns = document.getElementById('modal-header-answer');
    headerAns.textContent = `KEY: ${correctStr}`;
    headerAns.style.display = 'block';
    
    let analyticsHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom: 1.5rem;">
            <div class="stat-card" style="padding:0.75rem;"><span class="label">Attempts</span><div class="value" style="font-size:1.2rem;">${attempts.length}</div></div>
            <div class="stat-card" style="padding:0.75rem;"><span class="label">Latest</span><div class="value" style="font-size:0.8rem; margin-top:0.4rem;">${new Date(latest.attempted_at * 1000).toLocaleDateString()}</div></div>
        </div>`;

    if (state.viewMode === 'overall') {
        analyticsHTML += `
            <div class="detail-label mb-2">Student Breakdown</div>
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
                    <thead style="background: var(--bg-body); border-bottom: 1px solid var(--border);">
                        <tr>
                            <th style="padding: 0.5rem; text-align: left;">Student</th>
                            <th style="padding: 0.5rem; text-align: center;">Result</th>
                            <th style="padding: 0.5rem; text-align: left;">Selection</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attempts.map(a => {
                            let name = a.studentName;
                            if (!name) {
                                const userObj = state.rawUsers.find(u => u.id === a.user_id);
                                name = userObj ? (userObj.name || 'Unknown') : (a.user_id ? a.user_id.substring(0,8) : 'Unknown');
                            }
                            
                            let userAns = "Not answered";
                            try {
                                if (a.user_answer && a.user_answer !== 'null') {
                                    const parsed = JSON.parse(a.user_answer);
                                    if (['nested', 'multi_numerical'].includes(question.questionType) && Array.isArray(parsed)) {
                                        userAns = parsed.map(val => {
                                            if (val === null || val === undefined || val === "") return "-";
                                            return val;
                                        }).join(", ");
                                    } else {
                                        userAns = Utils.getUserAnswerString(parsed, question);
                                    }
                                    if (userAns === "") userAns = "(No selection)";
                                }
                            } catch(e) {}
                            
                            if (a.is_correct && (userAns === "Not answered" || userAns === "N/A")) {
                                userAns = Utils.getCorrectString(question);
                            }
                            
                            const rowStyle = a.is_correct ? '' : 'background: rgba(239, 68, 68, 0.05);';
                            
                            return `
                                <tr style="border-bottom: 1px solid var(--border); ${rowStyle} transition: background 0.2s;" 
                                    onmouseover="this.style.background='var(--primary-light)'" 
                                    onmouseout="this.style.background='${a.is_correct ? 'transparent' : 'rgba(239, 68, 68, 0.05)'}'">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--text-main);">${name}</td>
                                    <td style="padding: 0.6rem; text-align: center;">
                                        <div style="width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: ${a.is_correct ? 'var(--success)' : 'var(--error)'}; color: white; font-weight: 900; font-size: 0.7rem;">
                                            ${a.is_correct ? '✓' : '✗'}
                                        </div>
                                    </td>
                                    <td style="padding: 0.6rem; font-family: monospace; font-weight: 700; color: ${a.is_correct ? 'var(--success)' : 'var(--primary)'};">${userAns}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        let userAns = "Not answered";
        try {
            if (latest.user_answer) {
                const parsed = JSON.parse(latest.user_answer);
                userAns = Utils.getUserAnswerString(parsed, question);
            }
        } catch(e) {}
        analyticsHTML += `
            <div class="stat-card" style="padding: 1rem; border-color: var(--primary);">
                <span class="label">Chosen Answer</span>
                <div class="value" style="font-size: 1rem; color: var(--text-main);">${userAns}</div>
            </div>
        `;
    }

    document.getElementById('modal-attempt-info').innerHTML = analyticsHTML;
    modal.classList.add('active');
}
