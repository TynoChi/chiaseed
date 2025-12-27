import { CONFIG } from './config.js';
import { Utils } from './utils.js';
import { showModal, closeModal } from './modal.js';
import { loggedInUser, showLoginModal } from './auth.js';
import { QuizEngine } from './engine.js';
import { QuizFetcher } from './api.js';
import { QuestionRenderer } from './ui/question_renderer.js';
import { ResultRenderer } from './ui/result_renderer.js';
import { AIHelper } from './ui/ai_helper.js';
import { LeaderboardManager } from './ui/leaderboard.js';

export class QuizUI {
    constructor() {
        this.els = {
            views: { 
                selector: document.getElementById('view-selector'), 
                loading: document.getElementById('view-loading'), 
                quiz: document.getElementById('view-quiz'), 
                results: document.getElementById('view-results'),
                statistic: document.getElementById('view-statistic')
            },
            inputs: { 
                subject: document.getElementById('input-subject'), 
                chapter: document.getElementById('input-chapter'), 
                set: document.getElementById('input-set'), 
                damMode: document.getElementById('input-dam-mode'), 
                damSettings: document.getElementById('dam-custom-settings'), 
                malMode: document.getElementById('mal-mode'),
                // ChiaSeed Inputs
                chiaCategory: document.getElementById('chia-category-select'),
                chiaPrimaryLabel: document.getElementById('chia-primary-label'),
                chiaChapter: document.getElementById('chia-chapter-select') || document.getElementById('chapter-select'), // Support both IDs
                chiaGroup: document.getElementById('chia-group-select') || document.getElementById('group-select'),
                chiaGroupContainer: document.getElementById('chia-group-container') || document.getElementById('group-container'),
                chiaConceptContainer: document.getElementById('chia-concept-container') || document.getElementById('concept-container'),
                chiaConceptGrid: document.getElementById('chia-concept-grid') || document.getElementById('concept-grid'),
                chiaPreview: document.getElementById('chia-preview'),
                // Topic Mode Inputs
            },
            quiz: { text: document.getElementById('quiz-question-text'), options: document.getElementById('quiz-options'), navGrid: document.getElementById('quiz-nav-grid'), timer: document.getElementById('quiz-timer'), qTimer: document.getElementById('quiz-q-timer'), progress: document.getElementById('quiz-progress'), qId: document.getElementById('quiz-q-id'), explanation: document.getElementById('quiz-instant-explanation'), explanationText: document.getElementById('quiz-instant-explanation-text'), btnPrev: document.getElementById('btn-prev'), btnNext: document.getElementById('btn-next'), btnSubmit: document.getElementById('btn-submit') },
            manual: { modal: document.getElementById('modal-manual-upload'), input: document.getElementById('file-input-manual'), filename: document.getElementById('manual-filename') }
        };
        this.engine = new QuizEngine(this);
        
        // Initialize Helpers
        this.questionRenderer = new QuestionRenderer(this.els, this.engine);
        this.resultRenderer = new ResultRenderer(this);
        this.aiHelper = new AIHelper(this.engine);
        this.leaderboardManager = new LeaderboardManager(this);
        
        // State
        this.chiaQuestions = [];
        this.filteredChiaQuestions = [];
        this.tagDatabase = {};
        this.isChiaLoaded = false;
        this.pendingExitAction = null;
        
        this.init();
    }
    
    isQuizActive() {
        return this.engine && this.engine.questions && this.engine.questions.length > 0 && !this.engine.isFinished;
    }

    promptExit(callback) {
        if (this.isQuizActive()) {
            this.pendingExitAction = callback;
            showModal('modal-exit-confirm');
        } else {
            callback();
        }
    }

    init() {
        this.setupTheme();
        this.populateSubjects();
        this.setupEventListeners();
        this.checkDonation();
        
        window.QuizUI = { showModal, closeModal };

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('tab')) {
            const tab = urlParams.get('tab');
            const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
            if (btn) btn.click();
        }
        if (urlParams.has('tags')) {
            this.pendingAutoTags = urlParams.get('tags').split(',');
        }
    }
    setupTheme() {
        const toggle = document.getElementById('theme-toggle');
        const applyTheme = (isDark) => {
            document.documentElement.classList.toggle('dark', isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            document.getElementById('icon-sun').classList.toggle('hidden', !isDark);
            document.getElementById('icon-moon').classList.toggle('hidden', isDark);
        };
        const saved = localStorage.getItem('theme');
        applyTheme(saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches));
        toggle.onclick = () => applyTheme(!document.documentElement.classList.contains('dark'));
    }
    populateSubjects() {
        this.els.inputs.subject.innerHTML = '';
        Object.entries(CONFIG.subjects).forEach(([code, data]) => {
            const opt = document.createElement('option'); opt.value = code; opt.textContent = data.name;
            this.els.inputs.subject.appendChild(opt);
        });
        this.updateChapters();
    }
    updateChapters() {
        const subCode = this.els.inputs.subject.value;
        const data = CONFIG.subjects[subCode];
        const chapterLabel = document.querySelector('label[for="input-chapter"]');
        const setLabel = document.querySelector('label[for="input-set"]');
        if (chapterLabel) chapterLabel.textContent = (data && data.labels && data.labels.chapter) ? data.labels.chapter : "Chapter";
        if (setLabel) setLabel.textContent = (data && data.labels && data.labels.set) ? data.labels.set : "Set";
        const setSelect = this.els.inputs.set;
        if (setSelect) {
            setSelect.innerHTML = '';
            const sets = (data && data.sets) ? data.sets : [{ value: "00", text: "Question Bank (Standard)" },{ value: "10", text: "AI Generated (Set 01)" }];
            sets.forEach(s => {
                const opt = document.createElement('option'); opt.value = s.value; opt.textContent = s.text;
                setSelect.appendChild(opt);
            });
            if (sets.length > 0) setSelect.value = sets[0].value;
        }
        this.populateChapterOptions();
    }

    populateChapterOptions() {
        const subCode = this.els.inputs.subject.value;
        const data = CONFIG.subjects[subCode];
        
        // Determine Set Code based on active mode
        const mode = document.getElementById('view-selector') ? document.getElementById('view-selector').dataset.mode : 'study';
        let setCode = this.els.inputs.set.value;
        if (mode === 'dam' && document.getElementById('dam-chapter-source')) {
            setCode = document.getElementById('dam-chapter-source').value;
        }

        this.els.inputs.chapter.innerHTML = '';
        const checkboxContainer = document.getElementById('chapter-checkboxes');
        if(checkboxContainer) checkboxContainer.innerHTML = '';
        if (!data) return;
        
        let options = [];
        if (subCode === 'ARF' && setCode === '02') {
            options = ['A', 'B', 'C', 'D', 'E'].map(l => ({ value: l, text: `Set ${l}` }));
        } else {
            options = data.chapterTitles.map((title, i) => ({ value: String(i+1).padStart(2, '0'), text: title }));
        }
        
        options.forEach(optData => {
            const opt = document.createElement('option'); opt.value = optData.value; opt.textContent = optData.text;
            this.els.inputs.chapter.appendChild(opt);
            if (checkboxContainer) {
                const wrapper = document.createElement('div');
                const cbId = `dam-ch-${subCode}-${optData.value}`;
                wrapper.innerHTML = `<input type="checkbox" id="${cbId}" value="${subCode}-${optData.value}" class="concept-checkbox"><label for="${cbId}" class="concept-label" style="text-align: left; padding: 0.75rem 1rem;"><span style="font-weight: 800; margin-right: 0.5rem; opacity: 0.5;">${optData.value}</span> ${optData.text}</label>`;
                checkboxContainer.appendChild(wrapper);
            }
        });
    }

    setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = (e) => {
                const tab = e.target.dataset.tab;
                this.promptExit(() => {
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    document.getElementById('view-selector').dataset.mode = tab;
                    if (tab === 'statistic') { this.switchView('statistic'); this.fetchAndRenderLeaderboard(); }
                    else if (tab === 'chiaseed') {
                        this.switchView('selector');
                        document.getElementById('options-study').classList.add('hidden');
                        document.getElementById('options-dam').classList.add('hidden');
                        document.getElementById('options-chiaseed').classList.remove('hidden');
                        if (!this.isChiaLoaded) this.loadChiaQuestions();
                    } else if (tab === 'dam') {
                        this.switchView('selector');
                        document.getElementById('options-chiaseed').classList.add('hidden');
                        document.getElementById('options-study').classList.add('hidden');
                        document.getElementById('options-dam').classList.remove('hidden');
                        this.populateChapterOptions(); // Refresh for DAM source
                    } else {
                        this.switchView('selector');
                        document.getElementById('options-chiaseed').classList.add('hidden');
                        document.getElementById('options-study').classList.remove('hidden');
                        document.getElementById('options-dam').classList.add('hidden');
                        this.populateChapterOptions(); // Refresh for Study set
                    }
                });
            };
        });
        
        // Set default mode
        document.getElementById('view-selector').dataset.mode = 'study';

        document.getElementById('btn-stats').onclick = () => {
            this.promptExit(() => { this.switchView('statistic'); this.fetchAndRenderLeaderboard(); });
        };

        // Exit Modal Buttons
        document.getElementById('btn-exit-submit').onclick = () => {
            this.engine.finish();
            closeModal('modal-exit-confirm');
            if (this.pendingExitAction) this.pendingExitAction();
        };
        document.getElementById('btn-exit-discard').onclick = () => {
            this.engine.isFinished = true; // Mark as finished to bypass active check
            closeModal('modal-exit-confirm');
            if (this.pendingExitAction) this.pendingExitAction();
        };

        this.els.inputs.subject.onchange = () => this.updateChapters();
        this.els.inputs.set.onchange = () => this.populateChapterOptions();
        
        // DAM Listeners
        const damSource = document.getElementById('dam-chapter-source');
        if (damSource) {
            damSource.onchange = () => {
                this.populateChapterOptions();
                if (damSource.value === '02') {
                    // Auto-select the '02' set checkbox
                    const set02Cb = document.querySelector('input[name="dam-set"][value="02"]');
                    if (set02Cb) set02Cb.checked = true;
                }
            };
        }
        
        this.els.inputs.damMode.onchange = (e) => this.els.inputs.damSettings.classList.toggle('hidden', e.target.value !== 'customise');
        
        document.getElementById('btn-toggle-chapters').onclick = () => {
            const checkboxes = document.querySelectorAll('#chapter-checkboxes .concept-checkbox');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => cb.checked = !allChecked);
            document.getElementById('btn-toggle-chapters').textContent = allChecked ? "Select All" : "Deselect All";
        };

        document.getElementById('btn-refresh-leaderboard').onclick = () => this.fetchAndRenderLeaderboard();
        document.getElementById('btn-cost').onclick = () => { showModal('modal-usage'); this.fetchAndShowUsage(); };
        document.getElementById('btn-start').onclick = () => this.startQuiz();
        this.els.quiz.btnPrev.onclick = () => this.engine.goToQuestion(this.engine.currentIndex - 1);
        this.els.quiz.btnNext.onclick = () => {
            if (this.engine.instantMode) {
                if (!this.engine.checkedQuestions.includes(this.engine.currentIndex)) this.engine.checkInstant();
                else if (this.engine.currentIndex === this.engine.questions.length - 1) this.engine.finish();
                else this.engine.goToQuestion(this.engine.currentIndex + 1);
            } else {
                this.engine.goToQuestion(this.engine.currentIndex + 1);
            }
        };
        this.els.quiz.btnSubmit.onclick = () => { if(confirm("Are you sure you want to submit?")) this.engine.finish(); };
        document.getElementById('btn-retake').onclick = () => { this.promptExit(() => this.switchView('selector')); };
        
        this.els.manual.input.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = JSON.parse(evt.target.result);
                    const entries = data.entries || data;
                    if (!entries || entries.length === 0) throw new Error("No questions found");
                    closeModal('modal-manual-upload');
                    this.engine.start(entries, entries.length * 1.5, this.els.inputs.malMode.checked, { platform: 'manual', set: 'Manual Upload', chapter: 'Custom', subject: 'Manual' });
                } catch(err) { alert("Invalid File: " + err.message); }
            };
            reader.readAsText(file);
        };

        this.els.inputs.chiaChapter.onchange = () => this.onChiaChapterChange();
        this.els.inputs.chiaGroup.onchange = () => this.onChiaGroupChange();
    }
    
    // --- ChiaSeed Logic ---
    async loadChiaQuestions() {
        const loadingText = document.getElementById('loading-text');
        try {
            this.switchView('loading');
            loadingText.textContent = "Loading Questions...";
            const [qbRes, aiRes, s2Res] = await Promise.allSettled([fetch('json/combined/combined-set-qb.json'),fetch('json/combined/combined-set-ai.json'),fetch('json/combined/combined-set-02.json')]);
            let qbData = [], aiData = [], s2Data = [];
            if (qbRes.status === 'fulfilled' && qbRes.value.ok) qbData = (await qbRes.value.json()).entries || [];
            if (aiRes.status === 'fulfilled' && aiRes.value.ok) aiData = (await aiRes.value.json()).entries || [];
            if (s2Res.status === 'fulfilled' && s2Res.value.ok) s2Data = (await s2Res.value.json()).entries || [];
            this.chiaQuestions = [...qbData, ...aiData, ...s2Data];
            if (this.chiaQuestions.length === 0) throw new Error("No questions could be loaded.");
            this.processTags(this.chiaQuestions);
            this.initChiaFilters();
            this.isChiaLoaded = true;
            if (this.pendingAutoTags) { this.autoFilter(this.pendingAutoTags); this.pendingAutoTags = null; }
            this.switchView('selector');
        } catch (e) { alert("Error loading data: " + e.message); this.switchView('selector'); }
    }

    autoFilter(tags) {
        const matches = this.chiaQuestions.filter(q => q.tags && tags.some(t => q.tags.includes(t)));
        if(matches.length > 0) {
            this.filteredChiaQuestions = matches;
            this.els.inputs.chiaPreview.textContent = `Auto-selected ${matches.length} questions based on weak spots.`;
            this.els.inputs.chiaPreview.style.color = 'var(--primary)';
        }
    }

    processTags(questions) {
        const dbPassion = {}, dbSyllabus = {};
        const SYLLABUS_MAP = {
            '#AREA1': ['Assurance_Concept', 'Three_Party_Relationship', 'Reasonable_vs_Limited', 'Expectations_Gap', 'Statutory_Audit_Exemptions', 'Engagement_Acceptance', 'Preconditions_FAIF', 'Engagement_Letter_FORARMS', 'Materiality_Calculation', 'Performance_Materiality', 'Double_Materiality_Concept', 'Professional_Scepticism', 'Professional_Judgement', 'Fraud_vs_Error'],
            '#AREA2': ['Audit_Risk_Formula', 'Inherent_Risk', 'Control_Risk', 'Detection_Risk', 'Business_Risk_Impact', 'Control_Environment', 'Risk_Assessment_Process', 'Information_System', 'Monitoring_Controls', 'Existing_Control_Activities', 'Preventative_vs_Detective', 'Segregation_of_Duties', 'Revenue_System_Flow', 'Purchases_System_Flow', 'Payroll_System_Flow', 'Walkthrough_Procedures', 'IA_Function_Role', 'IA_vs_External_Audit', 'IA_Independence'],
            '#AREA3': ['Reliability_Hierarchy', 'Assertions_PACC_CO', 'Assertions_CVP_RE', 'Analytical_Procedures', 'Audit_Data_Analytics_ADA', 'Enquiry', 'Inspection', 'Observation', 'recalcUlation_reperformance', 'Confirmation', 'Sampling_Risk', 'Statistical_vs_NonStatistical', 'MUS_Monetary_Unit_Sampling', 'Experienced_Auditor_Rule', 'Written_Representations_ISA580', 'Modified_Opinion', 'KAM_Key_Audit_Matters'],
            '#AREA4': ['Principles_vs_Rules', 'BOCIP_Fundamental_Principles', 'Ethical_Threats', 'Self_Interest', 'Self_Review', 'Advocacy', 'Familiarity', 'Intimidation', 'Management_Threat', 'Ethical_Safeguards', 'Confidentiality_GDPR', 'Money_Laundering_POCA', 'MLRO_Tipping_Off', 'ISSB_Role_Aims', 'IFRS_S1_General', 'IFRS_S2_Climate', 'ISSA_5000_Standard'],
            '#TECH_MODERN': ['Cyber_Data_Security', 'Automation_Bias', 'RPA_AI_Blockchain', 'Remote_Auditing_Techniques', 'Physical_vs_Transition_Risks', 'ESG_Assurance']
        };
        const PASSION_GROUPS = ['#ASSURANCE_CORE', '#SUSTAINABILITY', '#ENGAGEMENT_ACCEPT', '#RISK_PLANNING', '#MATERIALITY', '#AUDIT_RISK', '#EVIDENCE_PROCEDURES', '#ASSERTIONS', '#REPORTING', '#IC_COMPONENTS', '#IC_CONTROLS', '#IT_CONTROLS', '#AUDIT_CYCLES', '#INTERNAL_AUDIT', '#DOCUMENTATION', '#SAMPLING', '#REPRESENTATIONS', '#SUBSTANTIVE_ACCOUNTS', '#ETHICS_FUNDAMENTALS', '#ETHICAL_THREATS', '#INDEPENDENCE', '#CONFIDENTIALITY'];
        questions.forEach(q => {
            if (!q.tags || !Array.isArray(q.tags)) return;
            const chapters = q.tags.filter(t => /^C\d{2}_/.test(t));
            const groupsOld = q.tags.filter(t => PASSION_GROUPS.includes(t));
            const conceptsOld = q.tags.filter(t => !/^C\d{2}_/.test(t) && !t.startsWith('#'));
            if (chapters.length > 0) {
                chapters.forEach(chap => {
                    if (!dbPassion[chap]) dbPassion[chap] = {};
                    if (groupsOld.length > 0) {
                        groupsOld.forEach(grp => {
                            if (!dbPassion[chap][grp]) dbPassion[chap][grp] = new Set();
                            conceptsOld.forEach(c => dbPassion[chap][grp].add(c));
                        });
                    }
                });
            }
            Object.entries(SYLLABUS_MAP).forEach(([area, allowedConcepts]) => {
                if (q.tags.includes(area)) {
                    if (!dbSyllabus[area]) dbSyllabus[area] = {};
                    if (!dbSyllabus[area]['General']) dbSyllabus[area]['General'] = new Set();
                    q.tags.forEach(t => { if (allowedConcepts.includes(t)) dbSyllabus[area]['General'].add(t); });
                }
            });
        });
        this.tagDatabase = { passion: this.sortDB(dbPassion), syllabus: this.sortDB(dbSyllabus) };
    }

    sortDB(db) {
        const sorted = {};
        Object.keys(db).sort().forEach(k1 => {
            sorted[k1] = {};
            Object.keys(db[k1]).sort().forEach(k2 => { sorted[k1][k2] = Array.from(db[k1][k2]).sort(); });
        });
        return sorted;
    }

    initChiaFilters() { if(this.els.inputs.chiaCategory) this.els.inputs.chiaCategory.onchange = () => this.initChiaPrimary(); this.initChiaPrimary(); }

    initChiaPrimary() {
        const category = this.els.inputs.chiaCategory ? this.els.inputs.chiaCategory.value : 'passion';
        const primarySel = this.els.inputs.chiaChapter;
        const primaryLabel = this.els.inputs.chiaPrimaryLabel;
        const currentDB = this.tagDatabase[category] || {};
        const areaLabels = { '#AREA1': 'Area 1: Concept, Process & Need', '#AREA2': 'Area 2: Risk, Controls & Info Flows', '#AREA3': 'Area 3: Evidence & Reporting', '#AREA4': 'Area 4: Ethics & Regulation', '#TECH_MODERN': 'Specialized: Tech & Modernization' };
        if (primaryLabel) primaryLabel.textContent = category === 'syllabus' ? 'Syllabus Area' : 'Chapter';
        primarySel.innerHTML = '<option value="">Select...</option>';
        const globalOpt = document.createElement('option');
        globalOpt.value = "GLOBAL"; globalOpt.textContent = category === 'syllabus' ? "All Areas (Global)" : "All Chapters (Global)";
        primarySel.appendChild(globalOpt);
        Object.keys(currentDB).forEach(key => {
            const opt = document.createElement('option'); opt.value = key;
            opt.textContent = areaLabels[key] || key.replace(/_/g, ' ').replace('#', '');
            primarySel.appendChild(opt);
        });
        this.onChiaChapterChange();
    }

    onChiaChapterChange() {
        const category = this.els.inputs.chiaCategory ? this.els.inputs.chiaCategory.value : 'passion';
        const primaryVal = this.els.inputs.chiaChapter.value;
        const groupSelect = this.els.inputs.chiaGroup;
        groupSelect.innerHTML = '<option value="">Select Topic Group...</option>';
        this.els.inputs.chiaConceptGrid.innerHTML = '';
        this.els.inputs.chiaGroupContainer.classList.remove('hidden'); 
        this.els.inputs.chiaConceptContainer.classList.add('hidden');
        this.updateChiaPreview();
        const currentDB = this.tagDatabase[category];
        let groups = [];
        if (primaryVal === 'GLOBAL' || !primaryVal) {
            const globalGroups = new Set();
            if (currentDB) Object.values(currentDB).forEach(subGroups => Object.keys(subGroups).forEach(g => globalGroups.add(g)));
            groups = Array.from(globalGroups).sort();
        } else if (currentDB && currentDB[primaryVal]) {
            groups = Object.keys(currentDB[primaryVal]);
        }
        groups.forEach(group => {
            const opt = document.createElement('option'); opt.value = group; opt.textContent = group.replace('#', '');
            groupSelect.appendChild(opt);
        });
    }

    onChiaGroupChange() {
        const category = this.els.inputs.chiaCategory ? this.els.inputs.chiaCategory.value : 'passion';
        const primaryVal = this.els.inputs.chiaChapter.value;
        const group = this.els.inputs.chiaGroup.value;
        const conceptGrid = this.els.inputs.chiaConceptGrid;
        conceptGrid.innerHTML = '';
        this.els.inputs.chiaConceptContainer.classList.add('hidden');
        if (!group) { this.updateChiaPreview(); return; }
        const currentDB = this.tagDatabase[category];
        let concepts = new Set();
        if (primaryVal === 'GLOBAL' || !primaryVal) {
             if (currentDB) Object.values(currentDB).forEach(subGroups => { if (subGroups[group]) subGroups[group].forEach(c => concepts.add(c)); });
        } else {
            if (currentDB && currentDB[primaryVal] && currentDB[primaryVal][group]) currentDB[primaryVal][group].forEach(c => concepts.add(c));
        }
        if (concepts.size > 0) {
            Array.from(concepts).sort().forEach(concept => {
                const wrapper = document.createElement('div');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox'; checkbox.id = `c-${concept}`; checkbox.value = concept; checkbox.className = 'concept-checkbox';
                checkbox.onchange = () => this.updateChiaPreview();
                const label = document.createElement('label'); label.htmlFor = `c-${concept}`; label.className = 'concept-label'; label.textContent = concept.replace(/_/g, ' ').replace('#', '');
                wrapper.appendChild(checkbox); wrapper.appendChild(label); conceptGrid.appendChild(wrapper);
            });
            this.els.inputs.chiaConceptContainer.classList.remove('hidden');
        }
        this.updateChiaPreview();
    }

    updateChiaPreview() {
        const category = this.els.inputs.chiaCategory ? this.els.inputs.chiaCategory.value : 'passion';
        const primaryVal = this.els.inputs.chiaChapter.value;
        const group = this.els.inputs.chiaGroup.value;
        if (!group) { this.els.inputs.chiaPreview.textContent = ''; return; }
        const selectedConcepts = Array.from(document.querySelectorAll('.concept-checkbox:checked')).map(cb => cb.value);
        const matches = this.chiaQuestions.filter(q => {
            if (!q.tags) return false;
            if (primaryVal && primaryVal !== 'GLOBAL' && !q.tags.includes(primaryVal)) return false;
            if (category === 'passion' && !q.tags.includes(group)) return false;
            if (selectedConcepts.length > 0) return selectedConcepts.some(c => q.tags.includes(c));
            return true;
        });
        this.filteredChiaQuestions = matches;
        const label = primaryVal && primaryVal !== 'GLOBAL' ? primaryVal.replace(/_/g, ' ') : 'Global';
        this.els.inputs.chiaPreview.textContent = `${matches.length} question${matches.length !== 1 ? 's' : ''} found in ${label}.`;
    }

    async startQuiz() {
        if (!loggedInUser) { showLoginModal(); return; }
        const mode = document.getElementById('view-selector').dataset.mode;
        if (mode === 'chiaseed') {
            if (this.filteredChiaQuestions.length === 0) return alert("No questions selected.");
            this.switchView('loading');
            const questions = Utils.shuffle([...this.filteredChiaQuestions]);
            this.engine.start(questions, questions.length * 1.5, this.els.inputs.malMode.checked, { subject: 'ARF', chapter: this.els.inputs.chiaChapter.value || 'CHIASEED', set: this.els.inputs.chiaCategory.value || 'Tags', platform: 'chiaseed' });
            return;
        }
        const damSettings = { type: this.els.inputs.damMode.value, count: parseInt(document.getElementById('input-dam-count').value), timePerQ: parseFloat(document.getElementById('input-dam-time').value), chapters: Array.from(document.querySelectorAll('#chapter-checkboxes input:checked')).map(c => c.value), sets: Array.from(document.querySelectorAll('input[name="dam-set"]:checked')).map(c => c.value) };
        if (mode === 'dam' && damSettings.type === 'customise' && (damSettings.chapters.length === 0 || damSettings.sets.length === 0)) return alert("Select at least one chapter and set.");
        this.switchView('loading');
        try {
            const data = await QuizFetcher.fetchQuizData({ mode, subject: this.els.inputs.subject.value, chapter: this.els.inputs.chapter.value, set: this.els.inputs.set.value, damSettings });
            this.engine.start(data.entries, data.timeLimit, this.els.inputs.malMode.checked, { subject: this.els.inputs.subject.value, chapter: mode === 'study' ? this.els.inputs.chapter.value : 'DAM', set: mode === 'study' ? this.els.inputs.set.value : (damSettings.type === 'qb_random' ? 'Random50' : 'Custom'), platform: mode });
        } catch (e) {
            if (e.message.includes("MANUAL_UPLOAD_NEEDED")) { this.els.manual.filename.textContent = e.message.split(':')[1]; showModal('modal-manual-upload'); }
            else { alert(e.message); this.switchView('selector'); }
        }
    }
    switchView(name) { 
        Object.values(this.els.views).forEach(v => v.classList.add('hidden')); 
        this.els.views[name].classList.remove('hidden'); 
        const tabs = document.getElementById('main-tabs');
        if (tabs) { if (name === 'quiz') tabs.classList.add('hidden'); else tabs.classList.remove('hidden'); }
    } 
    showQuizView() { this.switchView('quiz'); }
    renderQuestion(q, index, total, userAnswer, isChecked) {
        this.els.quiz.progress.textContent = `${index+1} / ${total}`;
        this.els.quiz.qId.textContent = `ID: ${q.id}`;
        this.updateButtonVisibility(index, total, isChecked, userAnswer);
        this.questionRenderer.render(q, userAnswer, isChecked);
    }
    updateButtonVisibility(index, total, isChecked, userAnswer) {
        this.els.quiz.btnPrev.disabled = index === 0;
        const isLast = index === total - 1;
        if (this.engine.instantMode) {
            if (!isChecked) {
                this.els.quiz.btnNext.textContent = "Check Answer"; this.els.quiz.btnNext.classList.remove('hidden'); this.els.quiz.btnSubmit.classList.add('hidden');
                this.els.quiz.btnNext.disabled = !(userAnswer && (Array.isArray(userAnswer) ? userAnswer.filter(x=>x!==null).length>0 : userAnswer !== null));
            } else {
                this.els.quiz.btnNext.textContent = isLast ? "Finish Quiz" : "Next Question"; this.els.quiz.btnNext.classList.remove('hidden'); this.els.quiz.btnSubmit.classList.add('hidden');
            }
        } else {
            this.els.quiz.btnNext.textContent = "Next"; this.els.quiz.btnNext.classList.toggle('hidden', isLast); this.els.quiz.btnSubmit.classList.toggle('hidden', !isLast);
        }
    }
    renderNavGrid(total, current, answers, checked, questions, instant) {
        const grid = this.els.quiz.navGrid; grid.innerHTML = '';
        for(let i=0; i<total; i++) {
            const btn = document.createElement('div'); btn.className = 'nav-cell'; btn.textContent = i+1;
            if (i === current) btn.classList.add('active');
            const ua = answers[i]; let hasAns = ua && (Array.isArray(ua) ? ua.filter(x => x !== null && x !== undefined).length > 0 : true);
            if (hasAns) {
                if (instant && checked.includes(i)) btn.classList.add(this.engine.isAnswerCorrect(questions[i], ua) ? 'answered-correct' : 'answered-incorrect');
                else btn.classList.add('answered');
            }
            btn.onclick = () => this.engine.goToQuestion(i);
            grid.appendChild(btn);
        }
    }
    updateNavState(i, ans) { if(ans) this.els.quiz.navGrid.children[i]?.classList.add('answered'); }
    updateButtonState() {
        if (this.engine.instantMode && !this.engine.checkedQuestions.includes(this.engine.currentIndex)) {
             const ua = this.engine.answers[this.engine.currentIndex];
             this.els.quiz.btnNext.disabled = !(ua && (Array.isArray(ua) ? ua.some(x => x !== null && x !== undefined && x !== "") : ua !== null && ua !== undefined && ua !== ""));
        }
    }
    updateTimer(ms, warn) { this.els.quiz.timer.textContent = Utils.formatTime(ms); this.els.quiz.timer.style.color = warn ? 'var(--error)' : 'var(--primary)'; }
    updateQuestionTimer(ms) { this.els.quiz.qTimer.textContent = Utils.formatTime(ms); }
    showResults(res, time) { this.resultRenderer.show(res, time); }
    showTags(tags) {
        const container = document.getElementById('tags-content'); container.innerHTML = '';
        if (!tags || tags.length === 0) container.textContent = "No tags available.";
        else {
            const labels = ["Chapter", "Group", "Concept", "Concept", "Concept", "Concept", "Concept"];
            tags.forEach((tag, i) => {
                const div = document.createElement('div'); div.style.marginBottom = '0.5rem'; div.style.padding = '0.5rem'; div.style.backgroundColor = 'var(--bg-body)'; div.style.borderRadius = '0.25rem';
                div.innerHTML = `<span style="font-weight:bold; color:var(--text-muted); font-size:0.8rem; display:block;">${i < labels.length ? labels[i] : "Concept"}</span> ${tag}`;
                container.appendChild(div);
            });
        }
        showModal('modal-tags');
    }
    fetchAndRenderLeaderboard() { this.leaderboardManager.fetchAndRender(); }
    fetchAndRenderWrongQuestions() { this.leaderboardManager.fetchAndRenderWrongQuestions(); }
    async fetchAndShowUsage() {
        const container = document.getElementById('usage-content'); container.innerHTML = '<div class="spinner"></div><p style="color:var(--text-muted)">Fetching usage stats...</p>';
        try {
            const res = await fetch(CONFIG.endpoints.data + '/usage', { credentials: 'include' });
            if (!res.ok) throw new Error("Failed to fetch usage");
            const data = await res.json(); const costUSD = parseFloat(data.total_cost || 0); const costMYR = costUSD * 4;
            container.innerHTML = `<div style="background:var(--bg-body); padding:1.5rem; border-radius:1rem; border:1px solid var(--border); margin-bottom:1rem;"><div style="margin-bottom:1rem;"><span style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total Cost (Approx)</span><div style="font-size:2.5rem; font-weight:800; color:var(--primary); line-height:1.2;">RM ${costMYR.toFixed(4)}</div><div style="font-size:0.9rem; color:var(--text-muted);">($${costUSD.toFixed(5)} USD)</div></div><div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; border-top:1px solid var(--border); padding-top:1rem; text-align:left;"><div><span style="display:block; font-size:0.75rem; color:var(--text-muted); font-weight:600;">Input Tokens</span><span style="font-size:1.1rem; font-weight:700; color:var(--text-main);">${(data.in_tokens || 0).toLocaleString()}</span></div><div><span style="display:block; font-size:0.75rem; color:var(--text-muted); font-weight:600;">Output Tokens</span><span style="font-size:1.1rem; font-weight:700; color:var(--text-main);">${(data.out_tokens || 0).toLocaleString()}</span></div></div></div><p style="font-size:0.8rem; color:var(--text-muted);">* Costs are estimated based on standard rates. MYR conversion rate approx 4.0.</p>`;
        } catch (e) { container.innerHTML = `<p style="color:var(--error)">Error loading usage: ${e.message}</p>`; }
    }
    checkDonation() { if(!sessionStorage.getItem('donationSeen')) { setTimeout(()=>showModal('modal-donation'), 2000); sessionStorage.setItem('donationSeen','true'); } }
}