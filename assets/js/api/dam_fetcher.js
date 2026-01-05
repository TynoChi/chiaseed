import { activeConfig as CONFIG } from '../settings_manager.js';
import { Utils } from '../utils.js';
import { DAM_CACHE } from './cache.js';
import { fetchWithFallback, normalizeQuestions } from './common.js';

export async function fetchDAMQuiz(params) {
    const { mode, subject, damSettings } = params;
    if (mode !== 'dam') return null;

    const isUnseen = subject.endsWith('-UQB');
    const baseSubjectCode = isUnseen ? subject.replace('-UQB', '') : subject;
    
    let allQuestions = [];
    const subjectInfo = CONFIG.subjects[subject] || CONFIG.subjects[baseSubjectCode];
    
    let setsToFetch = [];
    if (damSettings.type === 'customise') {
        setsToFetch = damSettings.sets;
    } else if (damSettings.type === 'qb_random') {
        setsToFetch = ['00'];
    } else if (damSettings.type === 'ai_random') {
        setsToFetch = ['10'];
    } else if (damSettings.type === 'iz_mixed') {
        setsToFetch = ['00', '10'];
    } else {
        setsToFetch = ['00'];
    }

    let selectedChapters = [];
    if (damSettings.type === 'customise') {
        selectedChapters = damSettings.chapters.map(c => c.split('-')[1]);
    } else {
        for(let i=1; i<=subjectInfo.chapters; i++) selectedChapters.push(String(i).padStart(2,'0'));
    }

    // Use combined JSON if configured for this subject, BUT NOT in Custom Mode
    if (subjectInfo && subjectInfo.useCombined && !isUnseen && damSettings.type !== 'customise') {
        const combinedFiles = [];
        if (setsToFetch.includes('00')) combinedFiles.push('combined-set-qb.json');
        if (setsToFetch.includes('10')) combinedFiles.push('combined-set-ai.json');

        for (const filename of combinedFiles) {
            try {
                let combinedData = DAM_CACHE[filename];
                if (!combinedData) {
                    console.log('API Call: Fetching combined JSON for DAM mode:', filename);
                    const res = await fetch('json/combined/' + filename);
                    if (res.ok) {
                        combinedData = await res.json();
                        DAM_CACHE[filename] = combinedData;
                        console.log('API Call: Combined JSON loaded for DAM mode:', filename);
                    }
                }

                if (combinedData && combinedData.entries) {
                    let relevantQuestions = combinedData.entries.filter(q => selectedChapters.includes(q.chapter));
                    allQuestions.push(...relevantQuestions);
                    console.log(`API Call: Filtered questions from ${filename} (DAM mode):`, relevantQuestions.length, 'questions');
                }
            } catch (e) {
                console.warn(`Combined fetch failed for ${filename} in DAM mode`, e);
            }
        }
        
        // Remove handled sets
        setsToFetch = setsToFetch.filter(s => s !== '00' && s !== '10');
    }

    // Fetch remaining sets individually
    const fetchPromises = [];
    selectedChapters.forEach(ch => {
            setsToFetch.forEach(s => {
                let filename = `${baseSubjectCode}-${s}-${ch}.json`;
                if (subjectInfo && subjectInfo.pathPrefix && !isUnseen) {
                    filename = `${subjectInfo.pathPrefix}${filename}`;
                }
                fetchPromises.push(
                    fetchWithFallback(filename, isUnseen)
                        .then(d => {
                            console.log('API Call: Fetched individual file for DAM mode:', filename);
                            return Array.isArray(d) ? d : (d.entries || []);
                        })
                        .catch(e => {
                            if(e.message.includes("MANUAL_UPLOAD_NEEDED")) throw e; 
                            console.warn(`File not found or error fetching: ${filename}`);
                            return [];
                        })
                );
            });
    });

    const results = await Promise.all(fetchPromises);
    results.forEach(res => allQuestions.push(...res));
    console.log('API Call: Total questions collected for DAM mode:', allQuestions.length);

    if (allQuestions.length === 0) {
        console.error('API Error: No questions found for selected criteria in DAM mode.');
        throw new Error("No questions found for selected criteria.");
    }
    
    allQuestions = normalizeQuestions(allQuestions);

    let count = 50;
    if (damSettings.type === 'customise') count = damSettings.count;
    else if (damSettings.type === 'iz_mixed') count = allQuestions.length;

    const finalQ = Utils.shuffle(allQuestions).slice(0, count);
    
    let timeLimit;
    if (damSettings.type === 'iz_mixed' || damSettings.type === 'customise') {
            timeLimit = finalQ.length * (damSettings.type === 'customise' ? damSettings.timePerQ : 1.5);
    } else { 
            timeLimit = 90; // Default standard exam time
    }
    console.log('API Call: Final quiz data prepared for DAM mode:', { numQuestions: finalQ.length, timeLimit: timeLimit });
    return { entries: finalQ, timeLimit: timeLimit };
}
