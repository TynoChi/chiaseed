export const CONFIG = {
    // Platform Configuration
    platform: {
        name: "Chiaseed Quiz Platform",
        version: "v1.1.0",
        logoUrl: "assets/img/logo.png", // Default Logo
        theme: "system", // system, light, dark
        uiStyle: "modern", // standard, glass, minimal
        students: ["Student 1", "Student 2", "Student 3", "Student 4", "Student 5", "Student 6", "Student 7", "Student 8", "Student 9", "Student 10"],
        paths: {
            json: "json/", // Base directory for JSON files
            combined: "json/combined/", // Directory for combined sets
            combinedFiles: []
        },
        // Admin Dashboard Configuration
        admin: {
            views: [
                { 
                    id: 'individual', 
                    label: 'Students', 
                    icon: '👤', 
                    tabId: 'tab-individual', 
                    containerId: 'progress-view',
                    title: 'Welcome, Admin',
                    subtitle: 'Select a student or view the global heatmap to begin analysis.',
                    searchPlaceholder: 'Search accounts...'
                },
                { 
                    id: 'overall', 
                    label: 'Heatmap', 
                    icon: '🌍', 
                    tabId: 'tab-overall', 
                    containerId: 'progress-view',
                    title: 'Global Performance Heatmap',
                    subtitle: 'Aggregated accuracy distribution for all students.'
                },
                { 
                    id: 'weakness', 
                    label: 'Weakness', 
                    icon: '📉', 
                    tabId: 'tab-weakness', 
                    containerId: 'weakness-view',
                    title: 'Systemic Weakness Analysis',
                    subtitle: 'Identifying common pitfalls across the entire student population.'
                },
                { 
                    id: 'leaderboard', 
                    label: 'Rank', 
                    icon: '🏆', 
                    tabId: 'tab-leaderboard', 
                    containerId: 'leaderboard-view',
                    title: 'Leaderboard',
                    subtitle: 'Ranking based on correct answers and total accuracy.',
                    searchPlaceholder: 'Search students...'
                },
                { 
                    id: 'genai', 
                    label: 'GenAI', 
                    icon: '🤖', 
                    tabId: 'tab-genai', 
                    containerId: 'genai-view',
                    title: 'GenAI Performance Audit',
                    subtitle: 'Monitoring token consumption and AI generation reliability.'
                },
                { 
                    id: 'visualizer', 
                    label: 'Visualizer', 
                    icon: '📊', 
                    tabId: 'tab-visualizer', 
                    containerId: 'visualizer-view',
                    title: 'Visualizer',
                    subtitle: 'Time-series data and distribution metrics.'
                }
            ],
            sources: [
                { id: 'QB', label: 'QB', file: 'combined-set-qb.json', btnId: 'btn-source-qb' },
                { id: 'Old Syllabus', label: 'S11', file: 'combined-set-11.json', btnId: 'btn-source-s11' },
                { id: 'Set 12', label: 'S12', file: 'combined-set-12.json', btnId: 'btn-source-s12' },
                { id: 'Set 02', label: 'S02', file: 'combined-set-02.json', btnId: 'btn-source-s2' },
                { id: 'ALL', label: 'All', file: null, btnId: 'btn-source-all' }
            ]
        }
    },

    // Subject Configuration
    subjects: {
        'MATH': {
            name: 'Mathematics',
            chapters: 2,
            useCombined: false,
            pathPrefix: "",
            chapterTitles: [
                "CH 01: Quadratic & Logarithms",
                "CH 02: Calculus"
            ],
            sets: [
                { value: "00", text: "Standard Set (00)" }
            ]
        },
        'ENG': {
            name: 'English',
            chapters: 1,
            useCombined: false,
            pathPrefix: "",
            chapterTitles: [
                "CH 01: Grammar & Vocabulary"
            ],
            sets: [
                { value: "00", text: "Standard Set (00)" }
            ]
        }
    },

    // Tag Configuration (for Tags/Weakness Mode)
    tags: {
        categories: [
            { id: "passion", label: "Group By Topic" },
            { id: "syllabus", label: "Group By Area" },
            { id: "clusters", label: "AI Clusters" }
        ],
        // Database of tags mapping to specific concepts
        definitions: {
            syllabus: {
                '#AREA1': { label: 'Area 1: Concept A', concepts: ['Concept_1', 'Concept_2'] },
                '#AREA2': { label: 'Area 2: Concept B', concepts: ['Concept_3', 'Concept_4'] }
            },
            passion: {
                '#TOPIC_A': { label: 'Topic A', concepts: ['SubTopic_1', 'SubTopic_2'] },
                '#TOPIC_B': { label: 'Topic B', concepts: ['SubTopic_3', 'SubTopic_4'] }
            }
        }
    },

    endpoints: {
        // Points to local or relative path by default for static files
        static: './json/', 
        unseen: './json/unseen/',
        // Placeholder API endpoints - users should configure these
        genai: 'https://api.your-domain.com/genai', 
        data: 'https://api.your-domain.com/data'
    },
    ai: {
        models: {
            quiz: 'google/gemini-2.0-flash',
            explanation: 'google/gemini-2.0-flash'
        }
    }
};