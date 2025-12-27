export const CONFIG = {
    subjects: {
        'ARF': {
            name: 'Assurance and Risk Fundamentals',
            chapters: 16,
            chapterTitles: [
                "CH 01: Concept of and need for assurance", "CH 02: Process of assurance: obtaining an engagement",
                "CH 03: Process of assurance: planning and risk assessment", "CH 04: Process of assurance: evidence and reporting",
                "CH 05: Risk, internal controls and information flows", "CH 06: Revenue system", "CH 07: Purchases system",
                "CH 08: Employee costs", "CH 09: Internal audit", "CH 10: Documentation", "CH 11: Evidence and sampling",
                "CH 12: Written representations", "CH 13: Substantive procedures - key financial statement figures",
                "CH 14: Codes of professional ethics and regulatory issues", "CH 15: Integrity, objectivity and independence",
                "CH 16: Confidentiality"
            ],
            sets: [
                { value: "00", text: "Standard (00)" },
                { value: "10", text: "AI Set 1 (10)" },
                { value: "02", text: "Set 02 (02)" }
            ]
        }
    },
    endpoints: {
        static: 'https://cfab2.fayempire.com/json/',
        unseen: 'https://cfab2.fayempire.com/json/unseen/',
        // "Meaningless" subdomains to obscure purpose
        genai: 'https://api-x-gen.fayempire.com', 
        data: 'https://api-x-data.fayempire.com'
    },
    ai: {
        models: {
            quiz: 'google/gemini-2.5-flash',
            explanation: 'google/gemini-2.5-flash'
        }
    }
};