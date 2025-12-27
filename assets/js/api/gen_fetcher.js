// import { CONFIG } from '../config.js';
// import { currentUserId } from '../auth.js';
// import { normalizeQuestions } from './common.js';

export async function fetchGeneratorQuiz(params) {
    return null;
//     const { subject, chapter, set } = params;
    
//     // Generator only triggers on set '99'
//     if (set !== '99') return null;

//     const formData = new FormData();
//     formData.append('subject', subject);
//     formData.append('chapter', chapter);
//     if (CONFIG.ai && CONFIG.ai.models && CONFIG.ai.models.quiz) {
//         formData.append('model', CONFIG.ai.models.quiz);
//     }
//     console.log('API Call: Sending quiz generation request to', `${CONFIG.endpoints.genai}/generate`, 'with data:', { subject, chapter });
    
//     const res = await fetch(`${CONFIG.endpoints.genai}/generate`, { 
//         method: 'POST', 
//         body: formData, 
//         headers: { 'X-User-ID': currentUserId || '' },
//         credentials: 'include' 
//     });
    
//     if (!res.ok) {
//         const errorText = await res.text();
//         console.error('API Call: Quiz Generator API failed with status', res.status, errorText);
//         throw new Error("Generator API failed");
//     }
    
//     const data = await res.json();
//     console.log('API Call: Quiz Generator API response:', data);
    
//     const normalizedEntries = normalizeQuestions(data.entries);
//     return { entries: normalizedEntries, timeLimit: normalizedEntries.length * 1.5 };
}

