import { CACHE } from './cache.js';
import { fetchWithFallback, normalizeQuestions } from './common.js';

export async function fetchStudyQuiz(params) {
    const { mode, subject, chapter, set } = params;
    if (mode !== 'study') return null;

    const isUnseen = subject.endsWith('-UQB');
    const baseSubjectCode = isUnseen ? subject.replace('-UQB', '') : subject;

    // For ARF standard sets (00 and 10), use combined JSON
    if (baseSubjectCode === 'ARF' && !isUnseen && (set === '00' || set === '10')) {
        const combinedFilename = set === '00' ? 'combined-set-qb.json' : 'combined-set-ai.json';
        try {
            let allData = CACHE[combinedFilename];
            if (!allData) {
                console.log('API Call: Fetching combined JSON for study mode:', combinedFilename);
                const res = await fetch('json/combined/' + combinedFilename);
                if (res.ok) {
                    allData = await res.json();
                    CACHE[combinedFilename] = allData;
                    console.log('API Call: Combined JSON loaded for study mode.');
                }
            }

            if (allData && allData.entries) {
                const filtered = allData.entries.filter(q => q.chapter === chapter);
                
                if (filtered.length > 0) {
                    console.log('API Call: Filtered questions from combined JSON (study mode):', filtered.length, 'questions');
                    return { entries: filtered, timeLimit: filtered.length * 1.5 };
                } else {
                    console.warn(`No questions found in combined JSON for Chapter ${chapter}, Set ${set}`);
                }
            }
        } catch (e) {
            console.warn("Combined fetch failed, falling back to individual files", e);
        }
    }

    // Legacy Fallback
    const fileSuffix = isUnseen ? '10' : '00'; 
    const finalSet = set === '00' ? fileSuffix : set;
    let filename = `${baseSubjectCode}-${finalSet}-${chapter}.json`;
    if (baseSubjectCode === 'ARF' && !isUnseen) {
        filename = `new/${filename}`;
    }
    const data = await fetchWithFallback(filename, isUnseen);
    const questionsArray = Array.isArray(data) ? data : (data.entries || []);
    console.log('API Call: Fetched individual file (legacy fallback/study mode):', filename, 'Questions:', questionsArray.length);
    const normalizedEntries = normalizeQuestions(questionsArray);
    return { entries: normalizedEntries, timeLimit: normalizedEntries.length * 1.5 };
}
