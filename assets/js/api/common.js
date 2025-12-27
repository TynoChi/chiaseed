import { CONFIG } from '../config.js';

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
            return {
                id: q.number || '0',
                questionType: 'mcq',
                questionText: q.questions,
                options: q.options,
                correctOptions: q.answer,
                explanation: q.answer_explanation || q.explanation,
                marks: 1
            };
        }
        return q;
    });
}
