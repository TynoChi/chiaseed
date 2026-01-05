import { state, setEditedData, setPendingData, setRawFormat } from './state.js';
import { normalizeData, parseMoodleXml } from './parsers.js';
import { generateXml } from './generators.js';
import { showAlert, copyToClipboard, downloadFile } from './utils.js';
import { updateStats, displayQuestions, updateRawOutput, renderMcqEditor, addOptionToEditor, renderNestedEditor, addSubQuestionToEditor } from './ui.js';

// DOM Elements
const fileInput = document.getElementById('fileInput');
const fileDropZone = document.getElementById('fileDropZone');
const confirmLoadBtn = document.getElementById('confirmLoadBtn');
const editModal = document.getElementById('edit-modal');
const workspaceTitle = document.getElementById('workspace-title');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // File Loading
    fileInput.addEventListener('change', handleFileLoad);
    document.getElementById('loadPasteBtn').addEventListener('click', handlePasteLoad);
    confirmLoadBtn.addEventListener('click', confirmLoad);

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
        fileDropZone.addEventListener(e, (ev) => { ev.preventDefault(); ev.stopPropagation(); }, false);
    });
    fileDropZone.addEventListener('dragover', () => fileDropZone.style.borderColor = 'var(--primary)');
    fileDropZone.addEventListener('dragleave', () => fileDropZone.style.borderColor = 'var(--border)');
    fileDropZone.addEventListener('drop', handleDrop);

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
        });
    });

    // Main Actions
    document.getElementById('downloadJsonBtn').addEventListener('click', () => downloadFile(state.editedData, 'json', (d) => JSON.stringify(d, null, 2)));
    document.getElementById('downloadXmlBtn').addEventListener('click', () => downloadFile(state.editedData, 'xml', generateXml));
    document.getElementById('convertBtn').addEventListener('click', () => {
        setRawFormat(state.currentRawFormat === 'json' ? 'xml' : 'json');
        updateRawOutput();
        showAlert(`Converted to ${state.currentRawFormat.toUpperCase()}`, 'info');
    });
    document.getElementById('copyRawBtn').addEventListener('click', () => copyToClipboard(document.getElementById('raw-output').textContent));
    document.getElementById('bulk-edit-apply-btn').addEventListener('click', handleBulkEditMarks);

    // Modal & Dynamic Buttons (Event Delegation)
    document.getElementById('questions-container').addEventListener('click', handleQuestionListClick);
    document.getElementById('modalCloseBtn').addEventListener('click', closeEditModal);
    document.getElementById('modalCancelBtn').addEventListener('click', closeEditModal);
    document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
    document.getElementById('addOptionBtn').addEventListener('click', addOptionToEditor);
    document.getElementById('addSubQBtn').addEventListener('click', () => addSubQuestionToEditor());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeEditModal(); });
});

/* --- Handlers --- */

function handleDrop(e) {
    fileDropZone.style.borderColor = 'var(--border)';
    const file = e.dataTransfer.files[0];
    if (file) readAndPreviewFile(file, file.name);
}

function handleFileLoad(e) {
    const file = e.target.files[0];
    if (file) readAndPreviewFile(file, file.name);
}

function handlePasteLoad() {
    const content = document.getElementById('jsonPasteArea').value;
    if (!content.trim()) return showAlert('Paste area is empty.', 'warning');
    const isXml = content.trim().startsWith('<quiz') || content.trim().startsWith('<?xml');
    showDataPreview(content, isXml ? 'pasted_data.xml' : 'pasted_data.json');
}

function readAndPreviewFile(file, fileName) {
    const reader = new FileReader();
    reader.onload = (e) => showDataPreview(e.target.result, fileName);
    reader.onerror = () => showAlert('Error reading file.', 'error');
    reader.readAsText(file);
}

function showDataPreview(content, fileName) {
    let processedData;
    let title = fileName;
    let previewHtml = '';
    let isXml = fileName.toLowerCase().endsWith('.xml') || content.trim().startsWith('<?xml');

    try {
        if (isXml) {
            processedData = parseMoodleXml(content);
            title = `XML Set (${fileName})`;
            previewHtml = `<p><strong>Format:</strong> Moodle XML</p><p><strong>Count:</strong> ${processedData.length}</p>`;
        } else {
            const data = JSON.parse(content);
            if (!Array.isArray(data) && data.questions) {
                processedData = [data.questions[0]]; // Simplify for financial obj
                previewHtml = `<p><strong>Format:</strong> Complex Financial Object</p>`;
            } else if (Array.isArray(data)) {
                processedData = data;
                previewHtml = `<p><strong>Format:</strong> JSON Array</p><p><strong>Count:</strong> ${data.length}</p>`;
            } else {
                throw new Error("Unknown JSON structure");
            }
        }

        processedData = normalizeData(processedData);
        setPendingData(processedData, fileName, title);
        
        document.getElementById('previewContent').innerHTML = previewHtml;
        document.getElementById('dataPreview').style.display = 'block';

    } catch (error) {
        console.error(error);
        showAlert('Parse Error: ' + error.message, 'error');
    }
}

function confirmLoad() {
    if (!state.pendingData) return;
    setEditedData(state.pendingData.data);
    workspaceTitle.textContent = `Editing ${state.pendingData.title}`;
    
    refreshView();
    
    // UI Transitions
    document.getElementById('welcome-card').style.display = 'none';
    document.getElementById('results-card').style.display = 'block';
    document.getElementById('bulk-ops-card').style.display = 'block';
    document.getElementById('downloadJsonBtn').disabled = false;
    document.getElementById('downloadXmlBtn').disabled = false;
    document.getElementById('dataPreview').style.display = 'none';
    showAlert('Data loaded!', 'success');
}

function refreshView() {
    updateStats();
    displayQuestions();
    updateRawOutput();
}

/* --- Editing Logic --- */

function handleQuestionListClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const index = parseInt(btn.dataset.index);

    if (btn.classList.contains('edit-btn')) openEdit(index);
    if (btn.classList.contains('delete-btn')) deleteQ(index);
}

function deleteQ(index) {
    if(confirm('Delete this question?')) {
        state.editedData.splice(index, 1);
        refreshView();
    }
}

function openEdit(index) {
    const q = state.editedData[index];
    if (q.questionType === 'financial' && q.rawXml) return showAlert('Cannot edit raw XML questions.', 'warning');
    
    document.getElementById('edit-index').value = index;
    document.getElementById('edit-type').value = q.questionType;
    document.getElementById('edit-question').value = q.questionText || '';
    document.getElementById('edit-explanation').value = q.explanation || '';
    document.getElementById('edit-marks').value = q.marks || 1;
    document.getElementById('modal-title').textContent = `Edit ${q.questionType.toUpperCase()}`;

    const types = ['mcq', 'numerical', 'nested'];
    types.forEach(t => document.getElementById(`${t}-editor-fields`).style.display = 'none');
    if(types.includes(q.questionType)) document.getElementById(`${q.questionType}-editor-fields`).style.display = 'block';

    if (q.questionType === 'mcq') renderMcqEditor(q);
    if (q.questionType === 'numerical') {
        document.getElementById('edit-correct-answer').value = q.correctAnswer;
        document.getElementById('edit-entry-instructions').value = q.entryInstructions || '';
    }
    if (q.questionType === 'nested') renderNestedEditor(q);

    editModal.classList.add('active');
}

function saveEdit() {
    const index = document.getElementById('edit-index').value;
    const q = state.editedData[index];
    
    q.questionText = document.getElementById('edit-question').value;
    q.explanation = document.getElementById('edit-explanation').value;
    q.marks = parseFloat(document.getElementById('edit-marks').value);

    if (q.questionType === 'mcq') {
        q.options = [];
        q.correctOptions = [];
        document.querySelectorAll('#edit-options .option-editor').forEach((el, i) => {
            q.options.push(el.querySelector('.mcq-text').value);
            if (el.querySelector('.mcq-check').checked) q.correctOptions.push(i);
        });
    } else if (q.questionType === 'numerical') {
        q.correctAnswer = parseFloat(document.getElementById('edit-correct-answer').value);
        q.entryInstructions = document.getElementById('edit-entry-instructions').value;
    } else if (q.questionType === 'nested') {
        q.subQuestions = [];
        document.querySelectorAll('#nested-subquestions-container .sub-question-editor').forEach(el => {
            const type = el.querySelector('.sq-type').value;
            const text = el.querySelector('.sq-text').value;
            const marks = parseFloat(el.querySelector('.sq-marks').value) || 1;
            const answer = el.querySelector('.sq-answer').value;
            
            let subQ = { type, text, marks, answer };
            
            if (type === 'mcq') {
                const opts = el.querySelector('.sq-options').value.split('\n').map(s => s.trim()).filter(s => s);
                subQ.options = opts;
            }
            
            q.subQuestions.push(subQ);
        });
    }

    closeEditModal();
    refreshView();
    showAlert('Saved!', 'success');
}

function closeEditModal() { editModal.classList.remove('active'); }

function handleBulkEditMarks() {
    const type = document.getElementById('bulk-edit-type').value;
    const marks = parseFloat(document.getElementById('bulk-edit-marks').value);
    if (isNaN(marks)) return;
    
    let count = 0;
    state.editedData.forEach(q => {
        if (type === 'all' || q.questionType === type) {
            q.marks = marks;
            if (q.questionType === 'financial' && q.rawXml) {
                 q.rawXml = q.rawXml.replace(/<defaultgrade>.*?<\/defaultgrade>/, `<defaultgrade>${marks.toFixed(2)}</defaultgrade>`);
            }
            count++;
        }
    });
    refreshView();
    showAlert(`Updated ${count} questions.`, 'success');
}