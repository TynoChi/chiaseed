import { state } from './state.js';
import { generateXml } from './generators.js';

export function updateStats() {
    const data = state.editedData;
    const counts = { mcq: 0, numerical: 0, nested: 0, financial: 0, total: data.length };
    let totalMarks = 0;
    data.forEach(q => {
        counts[q.questionType] = (counts[q.questionType] || 0) + 1;
        totalMarks += (q.marks || 0);
    });

    document.getElementById('stats-grid').innerHTML = `
        <div class="stat-card"><div class="stat-value">${counts.total}</div><div class="stat-label">Questions</div></div>
        <div class="stat-card"><div class="stat-value">${totalMarks}</div><div class="stat-label">Marks</div></div>
        <div class="stat-card"><div class="stat-value">${counts.mcq}</div><div class="stat-label">MCQ</div></div>
        <div class="stat-card"><div class="stat-value">${counts.nested}</div><div class="stat-label">Nested</div></div>
    `;
}

export function displayQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    state.editedData.forEach((q, i) => {
        const el = document.createElement('div');
        el.className = 'question-card';
        let content = '';

        if (q.questionType === 'mcq') {
            content = `<div class="options-list">
                ${(q.options || []).map((opt, idx) => `
                    <div class="option-item ${(q.correctOptions || []).includes(idx) ? 'correct' : ''}">
                        <div class="option-letter">${String.fromCharCode(65 + idx)}</div>
                        <div>${opt}</div>
                    </div>
                `).join('')}
            </div>`;
        } else if (q.questionType === 'numerical') {
            content = `<div class="explanation-box" style="background:#ecfdf5; border-color:var(--success);">
                <strong>Correct Answer:</strong> ${q.correctAnswer}
                ${q.entryInstructions ? `<br><small>${q.entryInstructions}</small>` : ''}
            </div>`;
        } else if (q.questionType === 'nested') {
            content = `<div class="sub-questions-container"><h5>Sub-Questions:</h5>`;
            if (q.subQuestions && q.subQuestions.length > 0) {
                q.subQuestions.forEach(sq => {
                    content += `<div class="sub-question-card">
                        <strong>${sq.type.toUpperCase()}:</strong> ${sq.text} 
                        <span class="tag" style="float:right; font-size:0.8em;">${sq.marks}mk</span>
                        <br>
                        <span style="color:var(--success); font-weight:bold;">Ans: ${sq.answer}</span>
                    </div>`;
                });
            } else {
                content += `<em>Embedded in text (Cloze format)</em>`;
            }
            content += `</div>`;
        } else if (q.questionType === 'financial') {
            content = `<div class="alert alert-info">Complex Financial Question (Read-Only)</div>`;
        }

        el.innerHTML = `
            <div class="question-header">
                <span style="font-weight:bold; color:var(--secondary);">${q.id}</span>
                <div>
                    <button class="btn btn-icon btn-info edit-btn" data-index="${i}">✏️</button>
                    <button class="btn btn-icon btn-danger delete-btn" data-index="${i}">🗑️</button>
                </div>
            </div>
            <div style="margin-bottom:1rem;">
                <span class="tag">${q.questionType}</span>
                <span class="tag">${q.marks} Marks</span>
            </div>
            <div style="margin-bottom:1rem;">${q.questionText || q.title || ''}</div>
            ${content}
            ${q.explanation ? `<div class="explanation-box"><span style="font-weight:bold;">Explanation:</span> ${q.explanation}</div>` : ''}
        `;
        container.appendChild(el);
    });
}

export function updateRawOutput() {
    const rawOutput = document.getElementById('raw-output');
    rawOutput.textContent = state.currentRawFormat === 'json'
        ? JSON.stringify(state.editedData, null, 2)
        : generateXml(state.editedData);

    document.getElementById('convertBtn').textContent =
        state.currentRawFormat === 'json' ? 'Switch to XML View' : 'Switch to JSON View';
}

export function renderMcqEditor(q) {
    const container = document.getElementById('edit-options');
    container.innerHTML = '';
    (q.options || []).forEach((opt, i) => {
        const isChecked = (q.correctOptions || []).includes(i);
        container.innerHTML += `
            <div class="option-editor">
                <div class="radio-label">
                    <input type="checkbox" class="mcq-check" value="${i}" ${isChecked ? 'checked' : ''}> Correct Answer
                </div>
                <textarea class="textarea-control mcq-text" rows="2">${opt}</textarea>
            </div>`;
    });
}

export function addOptionToEditor() {
    const container = document.getElementById('edit-options');
    container.innerHTML += `
        <div class="option-editor">
             <div class="radio-label"><input type="checkbox" class="mcq-check"> Correct Answer</div>
            <textarea class="textarea-control mcq-text" rows="2"></textarea>
        </div>`;
}

export function renderNestedEditor(q) {
    const container = document.getElementById('nested-subquestions-container');
    container.innerHTML = '';
    
    if (!q.subQuestions || q.subQuestions.length === 0) {
        // Try to infer from text if empty? Or just start empty.
        // For now, start empty if undefined.
        return; 
    }

    q.subQuestions.forEach(sq => {
        addSubQuestionToEditor(sq);
    });
}

export function addSubQuestionToEditor(sq = null) {
    const container = document.getElementById('nested-subquestions-container');
    const div = document.createElement('div');
    div.className = 'sub-question-editor card';
    div.style.padding = '0.5rem';
    div.style.marginBottom = '0.5rem';
    div.style.border = '1px solid var(--border)';

    const type = sq ? sq.type : 'numerical';
    const text = sq ? sq.text : '';
    const marks = sq ? sq.marks : 1;
    const answer = sq ? sq.answer : '';
    const options = (sq && sq.options) ? sq.options.join('\n') : '';

    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
            <select class="form-control sq-type" style="width:40%;">
                <option value="numerical" ${type === 'numerical' ? 'selected' : ''}>Numerical</option>
                <option value="mcq" ${type === 'mcq' ? 'selected' : ''}>MCQ</option>
            </select>
            <input type="number" class="form-control sq-marks" value="${marks}" style="width:20%;" placeholder="Marks">
            <button type="button" class="btn btn-danger btn-sm sq-remove">✕</button>
        </div>
        <textarea class="textarea-control sq-text" rows="2" placeholder="Sub-Question Text">${text}</textarea>
        
        <div class="sq-options-container" style="display:${type === 'mcq' ? 'block' : 'none'}; margin-top:0.5rem;">
            <label class="form-label" style="font-size:0.8rem;">Options (One per line)</label>
            <textarea class="textarea-control sq-options" rows="3">${options}</textarea>
        </div>

        <div style="margin-top:0.5rem;">
            <label class="form-label" style="font-size:0.8rem;">Correct Answer</label>
            <input type="text" class="form-control sq-answer" value="${answer}">
        </div>
    `;

    // Event Listener for Type Change
    const typeSelect = div.querySelector('.sq-type');
    const optContainer = div.querySelector('.sq-options-container');
    typeSelect.addEventListener('change', (e) => {
        optContainer.style.display = e.target.value === 'mcq' ? 'block' : 'none';
    });

    // Event Listener for Remove
    div.querySelector('.sq-remove').addEventListener('click', () => {
        div.remove();
    });

    container.appendChild(div);
}
