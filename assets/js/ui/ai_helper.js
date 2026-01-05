import { activeConfig as CONFIG } from '../settings_manager.js';
import { Utils } from '../utils.js';
import { currentUserId } from '../auth.js';
import { showModal } from '../modal.js';

export class AIHelper {
    constructor(engine) {
        this.engine = engine;
    }

    async showAI(idx, details) {
        console.log('User Action: Requesting AI explanation for question index', idx);
        showModal('modal-ai');
        const contentDiv = document.getElementById('ai-content');
        contentDiv.innerHTML = '<div class="text-center" style="padding: 2rem;"><div class="spinner"></div><p style="color:var(--text-muted)">Consulting the AI Tutor...</p></div>';
        
        try {
            const q = details[idx];
            
            // Build context-rich prompt
            let promptText = "Analyze this question and the student's answer.\n\nQuestion Type: " + q.question.questionType + "\nQuestion:\n" + (q.question.questionText || q.question.contextText || "No text provided.");
            
            if (q.question.questionType === 'mcq' && Array.isArray(q.question.options)) {
                promptText += "\n\nOptions:\n" + q.question.options.map((opt, i) => String.fromCharCode(65+i) + ". " + opt).join('\n');
                promptText += "\n\nCorrect Answer: " + Utils.getCorrectString(q.question);
                promptText += "\nUser's Answer: " + Utils.getUserAnswerString(q.user, q.question);
            } else if (q.question.questionType === 'msq' && Array.isArray(q.question.subQuestions)) {
                promptText += "\n\nStatements Analysis:";
                q.question.subQuestions.forEach((sq, i) => {
                    const opts = sq.availableOptions || q.question.availableOptions || ["False", "True"];
                    const correctText = sq.correctOption; 
                    
                    let userText = "Not answered";
                    if (q.user && q.user[i] !== undefined && q.user[i] !== null) {
                        userText = opts[q.user[i]] || "Unknown";
                    }
                    
                    promptText += `\nStatement ${i+1}: "${sq.statement}"`;
                    promptText += `\n   - User Selection: ${userText}`;
                    promptText += `\n   - Correct Selection: ${correctText}`;
                });
            } else if (q.question.questionType === 'nested' && Array.isArray(q.question.subQuestions)) {
                promptText += "\n\nSub-questions Analysis:";
                q.question.subQuestions.forEach((sq, i) => {
                    let correctText = "";
                    if (sq.type === 'mcq' && sq.options) correctText = sq.options[sq.correctOption];
                    else if (sq.type === 'numerical' || sq.type === 'text') correctText = sq.correctAnswer;
                    
                    let userText = "Not answered";
                    if (q.user && q.user[i] !== undefined && q.user[i] !== null) {
                        userText = q.user[i];
                    }

                    promptText += `\nSub-question ${i+1}: "${sq.text}"`;
                    promptText += `\n   - User Answer: ${userText}`;
                    promptText += `\n   - Correct Answer: ${correctText}`;
                });
            } else {
                 // Fallback for other types
                 promptText += "\n\nCorrect Answer: " + Utils.getCorrectString(q.question);
                 promptText += "\nUser's Answer: " + Utils.getUserAnswerString(q.user, q.question);
            }
            
            let origExp = q.question.explanation || "";
            if (q.question.questionType === 'msq' && q.question.subQuestions) {
                origExp += "\nDetails:\n" + q.question.subQuestions.map((sq, i) => "Statement " + (i+1) + ": " + (sq.explanationPart || '')).join('\n');
            } else if (q.question.questionType === 'nested' && q.question.subQuestions) {
                 origExp += "\nDetails:\n" + q.question.subQuestions.map((sq, i) => "Sub-question " + (i+1) + ": " + (sq.explanation || sq.explanationPart || '')).join('\n');
            }
            promptText += "\nOriginal Explanation: " + (origExp || "None");

            promptText += "\n\nTASK: Provide a structured explanation in JSON format.\nJSON Structure:\n{\n  \"concept\": \"The main accounting/auditing concept tested (max 5 words)\",\n  \"analysis\": \"A brief analysis of what the question is asking (1-2 sentences)\",\n  \"options\": [\n    { \n      \"id\": \"Statement 1\" or \"Option A\", \n      \"text\": \"The text of the statement or option\", \n      \"is_correct_option\": true, \n      \"user_selected\": false, \n      \"explanation\": \"Detailed reason why this is correct/incorrect\" \n    }\n  ],\n  \"tip\": \"A short exam tip for this type of question\"\n}\n\nFor MSQ/Nested questions:\n- Treat each Statement/Sub-question as an option in the 'options' array.\n- 'id' should be 'Statement 1', 'Sub-question 2', etc.\n- If the student answered the statement/sub-question CORRECTLY: Set 'is_correct_option': true AND 'user_selected': true.\n- If the student answered INCORRECTLY: Set 'is_correct_option': false AND 'user_selected': true.\n\nIMPORTANT: Return ONLY valid JSON. No markdown formatting.";
            
            const metadata = this.engine.metadata || {};

            if (!currentUserId) {
                console.warn("UserTracker: currentUserId is missing. Usage will NOT be logged by the server.");
            } else {
                console.log('UI Action: Sending AI request with X-User-ID:', currentUserId);
            }

            const res = await fetch(CONFIG.endpoints.genai + '/explain', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-User-ID': currentUserId || '' 
                },
                credentials: 'include',
                body: JSON.stringify({
                    prompt: promptText,
                    chapter: metadata.chapter,
                    set: metadata.set,
                    model: (CONFIG.ai && CONFIG.ai.models && CONFIG.ai.models.explanation) ? CONFIG.ai.models.explanation : undefined
                })
            });
            
            if (res.ok) {
                const text = await res.text();
                // cleanup json
                let jsonStr = text.trim();
                if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
                else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');
                
                try {
                    const data = JSON.parse(jsonStr);
                    this.renderAIStructured(data, contentDiv, q.question.questionText || q.question.contextText);
                } catch (e) {
                    console.warn("AI returned non-JSON:", text);
                    contentDiv.innerHTML = `<div style="white-space: pre-wrap;">${text}</div>`;
                }
                console.log('AI explanation received successfully.');
            } else {
                throw new Error(await res.text() || "API Error");
            }
        } catch (e) { 
            console.error(e);
            contentDiv.innerHTML = `<p style="color:var(--error)">AI Service Unavailable. ${e.message}</p>`; 
        }
    }

    renderAIStructured(data, container, questionText) {
        let html = '';
        
        // Header: Concept
        if (data.concept) {
            html += `<div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:start;"><span style="background:var(--primary); color:white; padding:0.25rem 0.75rem; border-radius:1rem; font-size:0.8rem; font-weight:700;">${data.concept}</span></div>`;
        }

        // Question Text (User Request)
        if (questionText) {
             html += `<div style="background:var(--bg-body); padding:1rem; border-radius:0.5rem; border:1px solid var(--border); margin-bottom:1.5rem; font-weight:500; font-size:0.95rem;">${questionText}</div>`;
        }
        
        // Analysis
        if (data.analysis) {
            html += `<p style="font-style:italic; color:var(--text-main); margin-bottom:1.5rem; border-left:3px solid var(--primary); padding-left:0.75rem;">${data.analysis}</p>`;
        }
        
        // Options
        if (data.options && Array.isArray(data.options)) {
            html += `<div style="display:flex; flex-direction:column; gap:1rem;">`;
            data.options.forEach((opt, i) => {
                const isCorrect = opt.is_correct_option === true;
                const isUserWrong = opt.user_selected === true && !isCorrect;
                
                // Determine Styles
                let headerBg, headerColor, borderColor, icon;
                
                if (isCorrect) {
                    // Green
                    headerBg = 'var(--success-bg)';
                    headerColor = 'var(--success)';
                    borderColor = 'var(--success)';
                    icon = '✅';
                } else if (isUserWrong) {
                    // Red
                    headerBg = 'var(--error-bg)';
                    headerColor = 'var(--error)';
                    borderColor = 'var(--error)';
                    icon = '❌';
                } else {
                    // Neutral (Grey)
                    headerBg = 'var(--bg-body)';
                    headerColor = 'var(--text-muted)';
                    borderColor = 'var(--border)';
                    icon = ''; // No icon for distractors
                }

                // Relevant = Correct OR Selected
                const isRelevant = isCorrect || opt.user_selected;
                const bodyId = `ai-opt-${i}-${Date.now()}`;
                
                // Chevron: Right if collapsed, Down if expanded
                const chevron = isRelevant ? '▼' : '▶'; 
                
                // Badges
                let badgesHtml = '';
                if (opt.user_selected) {
                    const badgeColor = isCorrect ? 'var(--success)' : 'var(--error)';
                    badgesHtml += `<span style="font-size:0.65rem; font-weight:800; padding:2px 6px; border-radius:4px; margin-right:0.25rem; color:white; background:${badgeColor};">YOU</span>`;
                }
                if (isCorrect && !opt.user_selected) {
                     badgesHtml += `<span style="font-size:0.65rem; font-weight:800; padding:2px 6px; border-radius:4px; margin-right:0.25rem; color:white; background:var(--success);">CORRECT</span>`;
                }

                html += `
                    <div style="border:1px solid ${borderColor}; border-radius:0.5rem; overflow:hidden;">
                        <div onclick="document.getElementById('${bodyId}').classList.toggle('hidden'); this.querySelector('.chevron').textContent = document.getElementById('${bodyId}').classList.contains('hidden') ? '▶' : '▼';" 
                             style="background:${headerBg}; color:${headerColor}; padding:0.75rem; border-bottom:1px solid ${borderColor}; font-weight:600; display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                            <span class="chevron" style="font-size:0.7rem; width:1.5rem;">${chevron}</span>
                            <span style="font-family:monospace; background:var(--bg-card); border:1px solid ${borderColor}; padding:2px 6px; border-radius:4px; color:${headerColor};">${opt.id}</span>
                            ${badgesHtml}
                            <span style="flex:1;">${opt.text || ''}</span>
                            <span>${icon}</span>
                        </div>
                        <div id="${bodyId}" class="${isRelevant ? '' : 'hidden'}" style="padding:0.75rem; font-size:0.9rem; color:var(--text-muted); background:var(--bg-card); border-top:1px solid ${borderColor};">
                            ${opt.explanation}
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }
        
        // Tip
        if (data.tip) {
            html += `
                <div style="margin-top:1.5rem; background:var(--bg-card); padding:1rem; border-radius:0.5rem; border:1px solid var(--primary); color:var(--text-main);">
                    <strong style="display:block; margin-bottom:0.25rem; color:var(--primary);">💡 Exam Tip</strong>
                    ${data.tip}
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
}