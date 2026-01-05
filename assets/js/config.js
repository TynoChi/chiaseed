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
            { id: "syllabus", label: "Group By Area" }
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