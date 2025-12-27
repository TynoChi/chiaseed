import { CONFIG } from '../config.js';
import { getCookie } from '../utils.js';

export class LeaderboardManager {
    constructor(ui) {
        this.ui = ui; // Keep reference if needed for view switching or other interactions
    }

    async fetchAndRender() {
        console.log('UI Action: Fetching and rendering leaderboard.');
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '<tr><td colspan="5" class="loading-row"><div class="spinner" style="width:20px;height:20px;border-width:2px;margin:0 auto;"></div></td></tr>';
        
        // Clear podium
        ['first', 'second', 'third'].forEach(pos => {
            const el = document.querySelector(`.podium-spot.${pos}`);
            el.classList.add('empty');
            el.querySelector('h4').textContent = '-';
            el.querySelector('.profile-picture').src = 'assets/img/profile-placeholder.svg';
        });

        try {
            const res = await fetch(CONFIG.endpoints.data + '/leaderboard', { credentials: 'include' });
            if (!res.ok) throw new Error("Failed to load");
            const rawData = await res.json();
            console.log('Leaderboard data fetched:', rawData);
            
            // Aggregate Data by User Name & Calculate Personal Stats
            const aggregated = {};
            const currentUser = getCookie("cf_user"); 

            rawData.forEach(entry => {
                const name = entry.Name || entry.name || "Anonymous";
                
                if (!aggregated[name]) {
                    aggregated[name] = {
                        Name: name,
                        Profilepictureurl: entry.Profilepictureurl || entry.profilepictureurl,
                        Correctcount: 0,
                        Totalquestions: 0,
                        TimetakenMs: 0,
                        Attempts: 0
                    };
                }
                
                // Accumulate Counts
                aggregated[name].Correctcount += (parseInt(entry.Correctcount || entry.correctcount) || 0);
                aggregated[name].Totalquestions += (parseInt(entry.Totalquestions || entry.totalquestions) || 0);
                aggregated[name].Attempts += 1;
                
                // Robust Time Parsing
                let seconds = 0;
                // Try various keys for time
                const timeStr = entry.Timetaken || entry.TimeTaken || entry.time_taken || entry.timetaken;
                const timeMs = entry.TimetakenMs || entry.Timetaken_ms || entry.Time_taken_ms || entry.time_taken_ms;

                if (timeMs !== undefined && timeMs !== null && !isNaN(timeMs) && Number(timeMs) > 0) {
                    seconds = Number(timeMs) / 1000;
                } else if (typeof timeStr === 'string' && timeStr.includes(':')) {
                    const parts = timeStr.split(':').map(p => parseFloat(p));
                    if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
                    else if (parts.length === 2) seconds = parts[0] * 60 + parts[1]; // MM:SS
                }
                
                aggregated[name].TimetakenMs += (seconds * 1000);
            });

            // Convert back to array
            const data = Object.values(aggregated);

            // Sort by Correctcount desc (Cumulative Score)
            data.sort((a, b) => b.Correctcount - a.Correctcount);
            
            // Update Personal Statistics
            if (currentUser && aggregated[currentUser]) {
                const userStats = aggregated[currentUser];
                const acc = userStats.Totalquestions > 0 ? ((userStats.Correctcount / userStats.Totalquestions) * 100).toFixed(1) : 0;
                
                document.getElementById('stat-attempts').textContent = userStats.Attempts;
                document.getElementById('stat-total-questions').textContent = userStats.Totalquestions;
                document.getElementById('stat-correct-answers').textContent = userStats.Correctcount;
                document.getElementById('stat-accuracy').textContent = acc + '%';
            } else {
                 // Reset if no data found for user
                document.getElementById('stat-attempts').textContent = '0';
                document.getElementById('stat-total-questions').textContent = '0';
                document.getElementById('stat-correct-answers').textContent = '0';
                document.getElementById('stat-accuracy').textContent = '0%';
            }

            // Render Podium
            this.updatePodium('first', data[0]);
            this.updatePodium('second', data[1]);
            this.updatePodium('third', data[2]);

            tbody.innerHTML = '';
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">No records yet. Be the first!</td></tr>';
                return;
            }

            for(let i = 0; i < data.length; i++) {
                    const row = data[i];
                    const tr = document.createElement('tr');
                    
                    let rankDisplay = i + 1;
                    if(i === 0) rankDisplay = '1 🥇';
                    if(i === 1) rankDisplay = '2 🥈';
                    if(i === 2) rankDisplay = '3 🥉';

                    // Format Time back to HH:MM:SS
                    const totalSec = Math.floor(row.TimetakenMs / 1000);
                    const h = Math.floor(totalSec / 3600);
                    const m = Math.floor((totalSec % 3600) / 60);
                    const s = totalSec % 60;
                    
                    let timeStr = "";
                    if (h > 0) timeStr = `${h}h ${m}m`;
                    else if (m > 0) timeStr = `${m}m ${s}s`;
                    else timeStr = `${s}s`;

                    // Highlight current user
                    if (row.Name === currentUser) {
                        tr.style.backgroundColor = "var(--primary-light)";
                        tr.style.borderLeft = "4px solid var(--primary)";
                    }

                    tr.innerHTML = `
                        <td>${rankDisplay}</td>
                        <td>
                            <div class="flex items-center gap-2">
                                <img src="${row.Profilepictureurl || 'assets/img/profile-placeholder.svg'}" 
                                     style="width:30px;height:30px;border-radius:50%;object-fit:cover;"
                                     onerror="this.src='assets/img/profile-placeholder.svg'">
                                <span>${row.Name}</span>
                            </div>
                        </td>
                        <td style="font-weight:bold;color:var(--primary)">${row.Correctcount}</td>
                        <td>${timeStr}</td>
                        <td>${row.Totalquestions > 0 ? Math.round((row.Correctcount/row.Totalquestions)*100) + '%' : '-'}</td>
                    `;
                    tbody.appendChild(tr);
                }
        } catch (e) {
            console.error('Error fetching leaderboard:', e);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4" style="color:var(--error)">Failed to load leaderboard.</td></tr>';
        }
        // Also fetch wrong questions & progress map
        this.fetchAndRenderWrongQuestions();
        this.fetchAndRenderProgressMap();
    }

    async fetchAndRenderProgressMap() {
        console.log('UI Action: Fetching and rendering progress map.');
        const container = document.getElementById('user-progress-map');
        if (!container) return;
        
        container.innerHTML = '<div class="spinner"></div>';

        try {
            // 1. Fetch Question Structure (Combined JSON)
            let questionData = window.DAM_CACHE ? window.DAM_CACHE['combined-set-1.json'] : null;
            if (!questionData) {
                 const qRes = await fetch('json/combined/combined-set-1.json');
                 if (qRes.ok) {
                     questionData = await qRes.json();
                     if (!window.DAM_CACHE) window.DAM_CACHE = {};
                     window.DAM_CACHE['combined-set-1.json'] = questionData;
                 }
            }
            if (!questionData || !questionData.entries) throw new Error("Question data unavailable");

            // 2. Fetch Full History
            const histRes = await fetch(CONFIG.endpoints.data + '/history?mode=all', { credentials: 'include' });
            if (!histRes.ok) throw new Error("History fetch failed");
            const history = await histRes.json();

            // 3. Map Attempts
            const attemptsByQ = {};
            history.forEach(h => {
                if (!attemptsByQ[h.question_id]) attemptsByQ[h.question_id] = [];
                attemptsByQ[h.question_id].push(h);
            });

            // 4. Group Questions by Chapter
            const chapters = {};
            questionData.entries.forEach(q => {
                if (!chapters[q.chapter]) chapters[q.chapter] = [];
                chapters[q.chapter].push(q);
            });

            // 5. Render
            container.innerHTML = '';
            let hasActivity = false;
            
            Object.keys(chapters).sort().forEach(ch => {
                // Filter only Standard Set (Source QB) for now, as that's the main progress metric
                const questions = chapters[ch].filter(q => (q.source || 'QB') === 'QB');
                if (questions.length === 0) return;

                // Check active questions (attempted)
                const activeQs = questions.filter(q => attemptsByQ[q.id] && attemptsByQ[q.id].length > 0);
                
                // Show only attempted chapters? User requested "only chapters they have attempted will be shown"
                if (activeQs.length === 0) return;
                hasActivity = true;

                const percent = Math.round((activeQs.length / questions.length) * 100);

                const section = document.createElement('div');
                section.className = 'chapter-section';
                section.innerHTML = `
                    <div class="chapter-title">
                        <span>Chapter ${ch}</span>
                        <span>${activeQs.length} / ${questions.length} (${percent}%)</span>
                    </div>
                    <div class="question-grid" id="prog-grid-${ch}"></div>
                `;
                container.appendChild(section);

                const grid = section.querySelector(`#prog-grid-${ch}`);
                questions.forEach((q, idx) => {
                    const box = document.createElement('div');
                    box.className = 'q-box';
                    box.textContent = idx + 1;

                    const qAttempts = attemptsByQ[q.id];
                    if (qAttempts && qAttempts.length > 0) {
                        // Sort latest first
                        qAttempts.sort((a,b) => b.attempted_at - a.attempted_at);
                        const latest = qAttempts[0];
                        const isCorrect = latest.is_correct === 1;
                        
                        box.classList.add(isCorrect ? 'correct' : 'incorrect');
                        box.title = `Status: ${isCorrect ? 'Correct' : 'Incorrect'}`;
                    } else {
                        box.style.opacity = '0.3';
                        box.style.cursor = 'default';
                        box.style.borderStyle = 'dashed';
                    }
                    grid.appendChild(box);
                });
            });

            if (!hasActivity) {
                container.innerHTML = '<p class="text-center text-muted p-4">Start a Standard Quiz to see your chapter progress here!</p>';
            }

        } catch (e) {
            console.error("Progress Map Error:", e);
            container.innerHTML = `<p class="text-center text-error">Failed to load progress map.</p>`;
        }
    }

    async fetchAndRenderWrongQuestions() {
        console.log('UI Action: Fetching and rendering wrong questions.');
        const container = document.getElementById('personal-statistics');
        let wrongContainer = document.getElementById('wrong-questions-list');
        
        // Remove the placeholder text if it exists
        const placeholder = Array.from(container.children).find(el => el.tagName === 'P' && el.textContent.includes('Detailed statistics'));
        if (placeholder) placeholder.remove();

        if (!wrongContainer) {
            wrongContainer = document.createElement('div');
            wrongContainer.id = 'wrong-questions-list';
            wrongContainer.style.marginTop = '1.5rem';
            container.appendChild(wrongContainer);
        }
        
        wrongContainer.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;margin:0 auto;color:var(--primary);"></div>';

        try {
            // 1. Fetch History
            const historyRes = await fetch(CONFIG.endpoints.data + '/history', { credentials: 'include' });
            if (!historyRes.ok) throw new Error("Failed to load history");
            const historyData = await historyRes.json();
            
            if (!historyData || historyData.length === 0) {
                wrongContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;font-size:0.9rem;">Great job! No wrong answers recorded recently.</p>';
                return;
            }

            // 2. Fetch Questions
            // Accessing DAM_CACHE via window for simplicity as it was global
            let questionData = window.DAM_CACHE ? window.DAM_CACHE['combined-set-1.json'] : null;
            if (!questionData) {
                 const qRes = await fetch('json/combined/combined-set-1.json');
                 if (qRes.ok) {
                     questionData = await qRes.json();
                     if (!window.DAM_CACHE) window.DAM_CACHE = {};
                     window.DAM_CACHE['combined-set-1.json'] = questionData;
                 }
            }
            
            if (!questionData || !questionData.entries) {
                wrongContainer.innerHTML = '<p style="color:var(--error);">Failed to load question data.</p>';
                return;
            }

            // 3. Filter and Map
            const wrongQuestions = historyData.map(attempt => {
                const qDetails = questionData.entries.find(q => q.id === attempt.question_id);
                return { ...attempt, details: qDetails };
            }).filter(item => item.details);

            if (wrongQuestions.length === 0) {
                wrongContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;font-size:0.9rem;">Wrong answers recorded, but question details not found (possibly from other sets).</p>';
                return;
            }

            // 4. Render
            let html = '<h4 style="margin: 1.5rem 0 1rem 0; border-bottom:1px solid var(--border); padding-bottom:0.5rem; font-size:1rem;">Recent Mistakes</h4>';
            wrongQuestions.forEach(item => {
                const date = new Date(item.attempted_at * 1000).toLocaleDateString();
                const tags = item.details.tags || [];
                
                html += `
                    <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:1rem; margin-bottom:1rem; box-shadow:var(--shadow);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.8rem; color:var(--text-muted);">
                            <span>${item.question_id} • ${date}</span>
                            <span style="color:var(--error); font-weight:600;">Wrong</span>
                        </div>
                        <div style="font-weight:500; margin-bottom:0.75rem; color:var(--text-main); font-size:0.95rem;">${item.details.questionText}</div>
                        <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                            ${tags.map(tag => `<span style="background:var(--primary-light); color:var(--primary); padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:500;">${tag}</span>`).join('')}
                        </div>
                    </div>
                `;
            });
            wrongContainer.innerHTML = html;

        } catch (e) {
            console.error('Error fetching and rendering wrong questions:', e);
            wrongContainer.innerHTML = `<p style="color:var(--error);">Error loading details: ${e.message}</p>`;
        }
    }

    updatePodium(pos, data) {
        const el = document.querySelector(`.podium-spot.${pos}`);
        if (!data) return;
        el.classList.remove('empty');
        el.querySelector('h4').textContent = data.Name;
        const img = el.querySelector('.profile-picture');
        img.src = data.Profilepictureurl || 'assets/img/profile-placeholder.svg';
        img.onerror = () => img.src = 'assets/img/profile-placeholder.svg';
    }
}
