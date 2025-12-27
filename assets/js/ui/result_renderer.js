import { Utils } from '../utils.js';
import { showModal } from '../modal.js';
import { currentUserId, loggedInUser, showLoginModal } from '../auth.js';
import { Scoring } from '../engine/scoring.js';

export class ResultRenderer {
    constructor(ui) {
        this.ui = ui;
    }

    show(res, time) {
        console.log('UI Action: Displaying quiz results', { score: res.score, total: res.total, attempted: res.attemptedTotal, timeTaken: time });
        this.ui.switchView('results');
        
        // Use attemptedTotal for percentage calculation if available (Fair Scoring)
        const displayTotal = res.attemptedTotal > 0 ? res.attemptedTotal : (res.total > 0 ? res.total : 1);
        const p = (res.score / displayTotal) * 100;
        
        document.getElementById('result-score-summary').textContent = `Score: ${res.score} / ${displayTotal} (${p.toFixed(1)}%)`;
        document.getElementById('result-time-summary').textContent = `Total Time: ${Utils.formatTime(time)}`;

        // Modified: Show Tags for "Problems" instead of Question IDs
        const wrongDetails = res.details.filter(d => !d.correct);
        const summaryEl = document.getElementById('result-question-id-summary');
        
        if (wrongDetails.length === 0) {
            summaryEl.textContent = "Perfect Score! No weak spots detected. 🎉";
            summaryEl.style.color = 'var(--success)';
            summaryEl.style.fontWeight = 'bold';
        } else {
            // Collect and count tags from wrong answers to find the most frequent "problems"
            const tagCounts = {};
            wrongDetails.forEach(d => {
                if (d.question.tags && Array.isArray(d.question.tags)) {
                    d.question.tags.forEach(t => {
                        // Skip chapter tags (C01...) to focus on concepts
                        if (!t.match(/^C\d{2}_/)) {
                            tagCounts[t] = (tagCounts[t] || 0) + 1;
                        }
                    });
                }
            });
            
            const sortedTags = Object.keys(tagCounts).sort((a,b) => tagCounts[b] - tagCounts[a]);
            
            if (sortedTags.length > 0) {
                // Take top 5
                const displayTags = sortedTags.slice(0, 5).map(t => t.replace(/_/g, ' ').replace('#', ''));
                let text = displayTags.join(', ');
                if (sortedTags.length > 5) text += ` (+${sortedTags.length - 5} more)`;
                
                summaryEl.innerHTML = `<span style="color:var(--error); font-weight:600;">Focus Areas:</span> ${text}`;
                summaryEl.style.color = 'var(--text-muted)';
            } else {
                summaryEl.textContent = "Review your incorrect answers below.";
            }
        }

        this.checkWeakSpots(res);
        this.checkLoginWarning();
        this.renderNavGrid(res);
        this.renderList(res);
        
        this.setFilter('all');
    }

    checkWeakSpots(res) {
        const weakChapters = {};
        const weakGroups = {};
        const weakConcepts = {};

        res.details.forEach(d => {
            if (!d.correct && d.question.tags && d.question.tags.length >= 3) {
                const tags = d.question.tags;
                if (tags[0]) weakChapters[tags[0]] = (weakChapters[tags[0]] || 0) + 1;
                if (tags[1]) weakGroups[tags[1]] = (weakGroups[tags[1]] || 0) + 1;
                for (let i = 2; i < tags.length; i++) {
                    if (tags[i]) weakConcepts[tags[i]] = (weakConcepts[tags[i]] || 0) + 1;
                }
            }
        });
        
        const topConcepts = Object.entries(weakConcepts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(e => e[0]);

        const oldBtn = document.getElementById('btn-chiaseed-fix');
        if (oldBtn) oldBtn.remove();

        if (topConcepts.length > 0) {
            const fixBtn = document.createElement('button');
            fixBtn.id = 'btn-chiaseed-fix';
            fixBtn.className = 'btn btn-primary';
            fixBtn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
            fixBtn.style.marginTop = '1rem';
            fixBtn.style.width = '100%';
            fixBtn.innerHTML = '✨ Fix Weak Spots with ChiaSeed';
            fixBtn.onclick = () => {
                console.log('User Action: Fix Weak Spots button clicked', { topConcepts });
                // Redirect to main page with ChiaSeed tab active and tags selected
                window.location.href = `index.html?tab=chiaseed&tags=${encodeURIComponent(topConcepts.join(','))}`;
            };
            document.getElementById('result-time-summary').after(fixBtn);
        }
    }

    checkLoginWarning() {
        if (!loggedInUser) {
            const warning = document.createElement('p');
            warning.id = 'login-warning-msg';
            warning.style.color = 'var(--error)';
            warning.style.fontSize = '0.9rem';
            warning.style.marginTop = '0.5rem';
            
            warning.appendChild(document.createTextNode('⚠ '));
            
            const loginSpan = document.createElement('span');
            loginSpan.style.cursor = 'pointer';
            loginSpan.style.textDecoration = 'underline';
            loginSpan.style.fontWeight = 'bold';
            loginSpan.textContent = 'Login';
            loginSpan.onclick = () => {
                console.log('User Action: Login prompt clicked (from results view)');
                showLoginModal();
            };
            
            warning.appendChild(loginSpan);
            warning.appendChild(document.createTextNode(' to save your score to the leaderboard!'));

            const old = document.getElementById('login-warning-msg');
            if(old) old.remove();
            document.getElementById('result-time-summary').after(warning);
        }
    }

    renderNavGrid(res) {
        const navGrid = document.getElementById('result-nav-grid');
        navGrid.innerHTML = '';
        res.details.forEach((r, i) => {
            const btn = document.createElement('div');
            btn.className = `nav-cell ${r.correct ? 'answered-correct' : 'answered-incorrect'}`;
            btn.textContent = i + 1;
            btn.onclick = () => {
                console.log('User Action: Result navigation clicked for question', i + 1);
                const card = document.getElementById(`result-card-${i}`);
                if (card) {
                    if (card.classList.contains('hidden')) this.setFilter('all');
                    setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
                }
            };
            navGrid.appendChild(btn);
        });

        document.getElementById('filter-all').onclick = () => {
            console.log('User Action: Result filter - Show All');
            this.setFilter('all');
        };
        document.getElementById('filter-wrong').onclick = () => {
            console.log('User Action: Result filter - Wrong Only');
            this.setFilter('incorrect');
        };
    }

    renderList(res) {
        const list = document.getElementById('results-list'); list.innerHTML = '';
        
        res.details.forEach((r, i) => {
            const div = document.createElement('div'); 
            div.id = `result-card-${i}`;
            div.dataset.correct = r.correct;
            div.className = `result-card ${r.correct?'result-correct':'result-incorrect'}`;
            
            div.innerHTML = `<div class="flex justify-between"><h4>Q${i+1}</h4><span style="font-size:0.8rem;color:var(--text-muted)">Time: ${Utils.formatTime(r.time)}</span></div>`;
            div.innerHTML += `<div style="margin:0.5rem 0; font-weight:500;">${r.question.questionText || r.question.contextText}</div>`;
            
            const ansDiv = document.createElement('div');
            ansDiv.className = 'user-answer';
            this.renderItem(ansDiv, r.question, r.user, r.correct);
            div.appendChild(ansDiv);
            
            let exp = "";
             if (r.question.questionType === 'msq' || r.question.questionType === 'nested') {
                 const hasSubExp = r.question.subQuestions && r.question.subQuestions.some(sq => sq.explanation || sq.explanationPart);
                 
                 if (r.question.overallExplanation || (r.question.explanation && hasSubExp)) {
                     exp += `<b>Overall:</b> ${r.question.overallExplanation || r.question.explanation}<br>`;
                 } else if (r.question.explanation && !hasSubExp) {
                     exp += `${r.question.explanation}<br>`;
                 }

                 if (r.question.subQuestions) {
                     r.question.subQuestions.forEach((sq, si) => {
                         const part = sq.explanation || sq.explanationPart;
                         if(part) exp += `<br><b>Part ${si+1}:</b> ${part}`;
                     });
                 }
            } else {
                exp = r.question.explanation || "No explanation provided.";
            }
            div.innerHTML += `<div class="explanation-box"><strong>Explanation:</strong> ${exp}</div>`;
            
            div.innerHTML += `<div class="flex gap-4 mt-2">
                <button class="btn-icon ai-btn" data-index="${i}" style="font-size:0.8rem;color:var(--primary)">✨ Explain using DeepSeek 🐳</button>
                ${r.question.tags && r.question.tags.length > 0 ? 
                    `<button class="btn-icon tags-btn" data-index="${i}" style="font-size:0.8rem;color:var(--text-muted)">🏷️ Show Tags</button>` : ''}
            </div>`;
            
            list.appendChild(div);
        });
        
        // Re-bind events via UI to AI Helper
        document.querySelectorAll('.ai-btn').forEach(b => b.onclick = (e) => {
            this.ui.aiHelper.showAI(e.target.dataset.index, res.details);
        });
        document.querySelectorAll('.tags-btn').forEach(b => b.onclick = (e) => {
            this.ui.showTags(res.details[e.target.dataset.index].question.tags);
        });
    }

    renderItem(container, q, user, isOverallCorrect) {
        // Delegate to QuestionRenderer for consistent visual feedback (buttons, highlights)
        // This satisfies the request to show options for MSQ/Nested in results
        if (['mcq', 'msq', 'nested', 'numerical', 'multi_numerical'].includes(q.questionType)) {
            const qr = this.ui.questionRenderer;
            // Pass isChecked=true to render in "result/feedback" mode (disabled inputs, validation colors)
            if (q.questionType === 'mcq') qr.renderMCQ(q, user, true, container);
            else if (q.questionType === 'msq') qr.renderMSQ(q, user, true, container);
            else if (q.questionType === 'nested') qr.renderNested(q, user, true, container);
            else if (q.questionType === 'numerical') qr.renderNumerical(q, user, true, container);
            else if (q.questionType === 'multi_numerical') qr.renderMultiNumerical(q, user, true, container);
            return;
        }

        // Keep custom logic for Cloze or other types if necessary
        switch(q.questionType) {
            case 'mcloze':
                q.blanks.forEach((b, i) => {
                    const uVal = user ? user[i] : '';
                    const isRight = Scoring.checkBlank(uVal, b); 
                    const p = document.createElement('p');
                    p.innerHTML = `Blank ${i+1}: <span class="${isRight?'correct':'incorrect'}">${uVal || 'Empty'}</span>`;
                    if(!isRight) p.innerHTML += ` | Correct: <span class="correct">${b.correctAnswer}</span>`;
                    container.appendChild(p);
                });
                break;
            default:
                container.textContent = "Detailed result view not available for this question type.";
        }
    }

    setFilter(mode) {
        console.log('UI Action: Setting result filter to', mode);
        const btnAll = document.getElementById('filter-all');
        const btnWrong = document.getElementById('filter-wrong');
        const activeStyle = "background: var(--primary); color: white; border-color: var(--primary);";
        const inactiveStyle = "background: var(--bg-body); color: var(--text-main); border: 1px solid var(--border);";
        
        if (mode === 'all') {
            btnAll.style.cssText = activeStyle;
            btnWrong.style.cssText = inactiveStyle;
        } else {
            btnAll.style.cssText = inactiveStyle;
            btnWrong.style.cssText = activeStyle;
        }

        document.querySelectorAll('.result-card').forEach(card => {
            if (mode === 'all') card.classList.remove('hidden');
            else { 
                if (card.dataset.correct === 'true') card.classList.add('hidden');
                else card.classList.remove('hidden');
            }
        });
    }
}
