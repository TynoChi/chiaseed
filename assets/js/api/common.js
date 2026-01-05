import { activeConfig as CONFIG } from '../settings_manager.js';

export async function fetchWithFallback(filename, isUnseen) {
    const sources = [
        (isUnseen ? CONFIG.endpoints.unseen : CONFIG.endpoints.static) + filename,
        (isUnseen ? 'json/unseen/' : 'json/') + filename,
        `https://api.allorigins.win/raw?url=${encodeURIComponent((isUnseen ? CONFIG.endpoints.unseen : CONFIG.endpoints.static) + filename)}`
    ];

    for (const url of sources) {
        try {
            console.log('API Call: Attempting to fetch from', url);
            const res = await fetch(url);
            if (res.ok) {
                console.log('API Call: Successfully fetched from', url);
                return await res.json();
            } else {
                console.warn(`API Call: Failed to fetch ${url} with status ${res.status}`);
            }
        } catch (err) { console.warn(`API Call: Error fetching from ${url}`, err); }
    }
    throw new Error(`MANUAL_UPLOAD_NEEDED:${filename}`);
}

export function normalizeQuestions(questions) {
     return (questions || []).map(q => {
        if (!q.questionType) {
            // Handle legacy format or raw JSON
            const type = q.type || 'mcq';
            const normalized = {
                id: q.id || q.number || '0',
                questionType: type,
                questionText: q.question || q.questions || "",
                options: q.options || [],
                explanation: q.explanation || q.answer_explanation || "",
                marks: q.marks || 1,
                chapter: q.chapter,
                tags: q.tags || []
            };

            // Ensure correctOptions is an array
            if (q.correctOptions) {
                normalized.correctOptions = Array.isArray(q.correctOptions) ? q.correctOptions : [q.correctOptions];
            } else if (q.answer) {
                normalized.correctOptions = Array.isArray(q.answer) ? q.answer : [q.answer];
            } else {
                normalized.correctOptions = [];
            }

            // Handle type-specific fields
            if (type === 'nested' || type === 'multi_numerical' || type === 'msq') {
                normalized.subQuestions = q.subQuestions || [];
            }
            if (type === 'mcloze') {
                normalized.blanks = q.blanks || [];
            }

            return normalized;
        }
        return q;
    });
}
