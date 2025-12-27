import { fetchWithFallback } from './api/common.js';
import { fetchGeneratorQuiz } from './api/gen_fetcher.js';
import { fetchStudyQuiz } from './api/study_fetcher.js';
import { fetchDAMQuiz } from './api/dam_fetcher.js';
// CACHE and DAM_CACHE are managed in api/cache.js and used by fetchers directly

export class QuizFetcher {
    static async fetchWithFallback(filename, isUnseen) {
        return fetchWithFallback(filename, isUnseen);
    }

    static async fetchQuizData(params) {
        console.log('API Call: fetchQuizData called with params:', params);
        const { mode } = params;
        
        // Generator
        // if (mode === 'study' && params.set === '99') {
        //     return await fetchGeneratorQuiz(params);
        // }

        // Study Mode
        if (mode === 'study') {
            return await fetchStudyQuiz(params);
        }

        // DAM Mode
        if (mode === 'dam') {
            return await fetchDAMQuiz(params);
        }
        
        throw new Error("Unknown quiz mode or parameters");
    }
}