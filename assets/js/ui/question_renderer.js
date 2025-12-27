import { Scoring } from '../engine/scoring.js';

export class QuestionRenderer {
    constructor(uiElements, engine) {
        this.els = uiElements;
        this.engine = engine;
    }

    render(q, userAnswer, isChecked) {
        // Reset explanation visibility
        this.els.quiz.explanation.classList.add('hidden');

        const container = this.els.quiz.options; 
        container.innerHTML = '';
        
        // Render Text
        let qTextHtml = q.questionText || q.contextText || "";
        this.els.quiz.text.innerHTML = qTextHtml;

        switch (q.questionType) {
            case 'mcq':
                this.renderMCQ(q, userAnswer, isChecked, container);
                break;
            case 'msq':
                this.renderMSQ(q, userAnswer, isChecked, container);
                break;
            case 'numerical':
                this.renderNumerical(q, userAnswer, isChecked, container);
                break;
            case 'multi_numerical':
                this.renderMultiNumerical(q, userAnswer, isChecked, container);
                break;
            case 'nested':
                this.renderNested(q, userAnswer, isChecked, container);
                break;
            case 'mcloze':
                this.renderMCloze(q, userAnswer, isChecked, qTextHtml); // MCloze writes to text area too
                break;
        }

        if (isChecked) {
            this.renderExplanation(q);
        }
    }

    renderMCQ(q, userAnswer, isChecked, container) {
        let correctIndices = [];
        if (q.correctOptions && typeof q.correctOptions[0] === 'number') {
            correctIndices = q.correctOptions;
        } else {
            correctIndices = q.correctOptions.map(l => l.charCodeAt(0) - 65);
        }
        
        const uaArr = userAnswer || [];
        
        q.options.forEach((opt, i) => {
            const btn = document.createElement('button'); 
            btn.className = 'option-btn';
            btn.innerHTML = `<span class="option-letter">${String.fromCharCode(65+i)}</span> ${opt}`;
            
            if (uaArr.includes(i)) btn.classList.add('selected');
            
            if (isChecked) {
                btn.disabled = true;
                const isCorrect = correctIndices.includes(i);
                const isSelected = uaArr.includes(i);
                
                if (isCorrect) {
                    btn.classList.add('correct');
                    btn.innerHTML += ' ✅'; 
                }
                if (isSelected) {
                    if(!isCorrect) btn.classList.add('incorrect'); 
                    btn.innerHTML += isCorrect ? '' : ' ❌';
                }
            } else {
                btn.onclick = () => {
                    console.log('User Action: Answered MCQ', { index: i });
                    this.engine.answerMCQ(i);
                };
            }
            container.appendChild(btn);
        });
    }

    renderMSQ(q, userAnswer, isChecked, container) {
        const msqContainer = document.createElement('div');
        msqContainer.className = 'msq-container';
        
        q.subQuestions.forEach((sq, subIdx) => {
            const row = document.createElement('div');
            row.className = 'msq-row';
            
            const stmt = document.createElement('div');
            stmt.className = 'msq-statement';
            stmt.innerHTML = sq.statement;
            row.appendChild(stmt);
            
            const optsDiv = document.createElement('div');
            optsDiv.className = 'msq-options';
            
            const availableOptions = sq.availableOptions || q.availableOptions;
            const correctOptIdx = availableOptions.indexOf(sq.correctOption);
            
            availableOptions.forEach((optStr, optIdx) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = optStr;
                
                const isSelected = userAnswer && userAnswer[subIdx] === optIdx;
                if (isSelected) btn.classList.add('selected');
                
                if (isChecked) {
                    btn.disabled = true;
                    const isCorrect = optIdx === correctOptIdx;
                    if (isCorrect) {
                        btn.classList.add('correct');
                        btn.innerHTML += ' ✅';
                    } else if (isSelected) {
                        btn.classList.add('incorrect');
                        btn.innerHTML += ' ❌';
                    }
                } else {
                    btn.onclick = () => {
                        console.log('User Action: Answered MSQ', { subIndex: subIdx, optionIndex: optIdx });
                        this.engine.answerMSQ(subIdx, optIdx);
                    };
                }
                optsDiv.appendChild(btn);
            });
            row.appendChild(optsDiv);
            msqContainer.appendChild(row);
        });
        container.appendChild(msqContainer);
    }

    renderNumerical(q, userAnswer, isChecked, container) {
        const inp = document.createElement('input'); 
        inp.type = 'number';
        inp.value = (userAnswer && userAnswer[0]) ? userAnswer[0] : '';
        if (isChecked) {
            inp.disabled = true;
            const isCorrect = parseFloat(userAnswer[0]) === parseFloat(q.correctAnswer);
            inp.style.borderColor = isCorrect ? 'var(--success)' : 'var(--error)';
            container.appendChild(inp);
            const msg = document.createElement('p'); 
            msg.style.color = isCorrect ? 'var(--success)' : 'var(--error)';
            msg.textContent = isCorrect ? 'Correct!' : `Incorrect. Answer: ${q.correctAnswer}`;
            container.appendChild(msg);
        } else {
            inp.oninput = (e) => this.engine.answerInput([e.target.value]);
            container.appendChild(inp);
        }
    }

    renderMultiNumerical(q, userAnswer, isChecked, container) {
        const mnContainer = document.createElement('div');
        mnContainer.className = 'flex flex-col gap-4';
        
        q.subQuestions.forEach((sq, i) => {
             const row = document.createElement('div');
             row.innerHTML = `<label>${sq.text}</label>`;
             const subInp = document.createElement('input');
             subInp.type = 'number';
             subInp.value = (userAnswer && userAnswer[i] !== null && userAnswer[i] !== undefined) ? userAnswer[i] : '';
             
             if (isChecked) {
                 subInp.disabled = true;
                 const isCorrect = parseFloat(userAnswer[i]) === parseFloat(sq.answer);
                 subInp.style.borderColor = isCorrect ? 'var(--success)' : 'var(--error)';
                 row.appendChild(subInp);
                 const msg = document.createElement('span');
                 msg.className = isCorrect ? 'correct' : 'incorrect';
                 msg.style.fontSize = '0.85rem';
                 msg.innerHTML = isCorrect ? ' ✅' : ` ❌ (Ans: ${sq.answer})`;
                 row.appendChild(msg);
             } else {
                 subInp.oninput = (e) => this.engine.answerInput(e.target.value, i);
                 row.appendChild(subInp);
             }
             mnContainer.appendChild(row);
        });
        container.appendChild(mnContainer);
    }

    renderNested(q, userAnswer, isChecked, container) {
        const nestContainer = document.createElement('div');
        nestContainer.className = 'flex flex-col gap-4';

        q.subQuestions.forEach((sq, i) => {
            const row = document.createElement('div');
            row.innerHTML = `<label>${sq.text}</label>`;
            
            if (sq.type === 'numerical' || sq.type === 'text') {
                 const subInp = document.createElement('input');
                 subInp.type = sq.type === 'numerical' ? 'number' : 'text';
                 subInp.value = (userAnswer && userAnswer[i] !== null) ? userAnswer[i] : '';
                 if (isChecked) {
                     subInp.disabled = true;
                     let isCorrect = false;
                     if (sq.type === 'numerical') isCorrect = parseFloat(userAnswer[i]) === parseFloat(sq.correctAnswer);
                     else isCorrect = (userAnswer[i]||"").trim().toLowerCase() === (sq.correctAnswer||"").trim().toLowerCase();
                     
                     subInp.style.borderColor = isCorrect ? 'var(--success)' : 'var(--error)';
                     row.appendChild(subInp);
                     const msg = document.createElement('span');
                     msg.innerHTML = isCorrect ? ' ✅' : ` ❌ (${sq.correctAnswer})`;
                     msg.className = isCorrect ? 'correct' : 'incorrect';
                     row.appendChild(msg);
                 } else {
                     subInp.oninput = (e) => this.engine.answerInput(e.target.value, i);
                     row.appendChild(subInp);
                 }
            } else if (sq.type === 'mcq') {
                 const optionsDiv = document.createElement('div');
                 optionsDiv.className = 'flex flex-row flex-wrap gap-2 mt-2';

                 sq.options.forEach((opt, optIdx) => {
                     const btn = document.createElement('button');
                     btn.className = 'option-btn';
                     btn.textContent = opt;

                     const isSelected = userAnswer && userAnswer[i] === opt;
                     if (isSelected) btn.classList.add('selected');

                     if (isChecked) {
                         btn.disabled = true;
                         const isCorrectOption = opt === sq.options[sq.correctOption];
                         if (isCorrectOption) {
                             btn.classList.add('correct');
                             btn.innerHTML += ' ✅';
                         } else if (isSelected) {
                             btn.classList.add('incorrect');
                             btn.innerHTML += ' ❌';
                         }
                     } else {
                         btn.onclick = () => {
                             this.engine.answerInput(opt, i);
                             Array.from(optionsDiv.children).forEach(c => c.classList.remove('selected'));
                             btn.classList.add('selected');
                         };
                     }
                     optionsDiv.appendChild(btn);
                 });
                 row.appendChild(optionsDiv);
            }
            nestContainer.appendChild(row);
        });
        container.appendChild(nestContainer);
    }

    renderMCloze(q, userAnswer, isChecked, qTextHtml) {
        // Regex replacement for [BLANK_n]
        let processedText = qTextHtml.replace(/\[BLANK_(\d+)\]/g, (_, num) => {
            const idx = parseInt(num) - 1;
            const val = (userAnswer && userAnswer[idx]) ? userAnswer[idx] : '';
            let cls = 'cloze-input';
            let extra = '';
            if (isChecked) {
                const blank = q.blanks[idx];
                const isCorrect = Scoring.checkBlank(val, blank);
                cls += isCorrect ? ' correct' : ' incorrect';
                extra = 'disabled';
            }
            return `<input type="text" class="${cls}" data-idx="${idx}" value="${val}" ${extra}>`;
        });
        this.els.quiz.text.innerHTML = processedText;
        
        // Re-bind events
        this.els.quiz.text.querySelectorAll('.cloze-input').forEach(input => {
            if (!isChecked) {
                input.addEventListener('input', (e) => {
                    this.engine.answerInput(e.target.value, parseInt(e.target.dataset.idx));
                });
            } else {
                // Show correction if wrong
                const idx = parseInt(input.dataset.idx);
                const blank = q.blanks[idx];
                const val = (userAnswer && userAnswer[idx]) ? userAnswer[idx] : '';
                if (!Scoring.checkBlank(val, blank)) {
                    const corrSpan = document.createElement('span');
                    corrSpan.className = 'correct';
                    corrSpan.style.fontSize = '0.9rem';
                    corrSpan.style.marginLeft = '0.5rem';
                    corrSpan.textContent = `(${blank.correctAnswer})`;
                    input.parentNode.insertBefore(corrSpan, input.nextSibling);
                }
            }
        });
    }

    renderExplanation(q) {
        this.els.quiz.explanation.classList.remove('hidden');
        let expText = "";
        
        if (q.questionType === 'msq' || q.questionType === 'nested') {
             const hasSubExp = q.subQuestions && q.subQuestions.some(sq => sq.explanation || sq.explanationPart);
             
             if (q.overallExplanation || (q.explanation && hasSubExp)) {
                 expText += `<b>Overall:</b> ${q.overallExplanation || q.explanation}<br><br>`;
             } else if (q.explanation && !hasSubExp) {
                 expText += `${q.explanation}<br>`;
             }

             if (q.subQuestions) {
                 q.subQuestions.forEach((sq, i) => {
                     const part = sq.explanation || sq.explanationPart;
                     if(part) expText += `<b>Part ${i+1}:</b> ${part}<br>`;
                 });
             }
        } else {
            expText = q.explanation || "No explanation provided.";
        }
        this.els.quiz.explanationText.innerHTML = expText;
    }
}
