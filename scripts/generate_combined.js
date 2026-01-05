const fs = require('fs');
const path = require('path');

// --- Configuration Template ---
const CONFIG = {
    // Directories
    directories: {
        sourceMain: 'json',       // e.g., 'json'
        sourceNew: 'json/new',    // e.g., 'json/new' (optional override path)
        output: 'json/combined'   // e.g., 'json/combined'
    },
    
    // Set Mappings
    // Define how file suffixes (e.g., SUBJECT-00-*.json) map to output combined files.
    mappings: [
        { 
            suffixes: ['00'], 
            targetSet: 'qb', 
            description: 'Standard Question Bank',
            sourceLabel: 'QB'
        },
        { 
            suffixes: ['10'], 
            targetSet: 'ai', 
            description: 'AI Generated Set',
            sourceLabel: 'AI'
        },
        { 
            suffixes: ['02'], 
            targetSet: '02', 
            description: 'Extension Set 02',
            sourceLabel: 'Set 02'
        },
        {
            suffixes: ['11'],
            targetSet: '11',
            description: 'Legacy/Old Syllabus',
            sourceLabel: 'Set 11'
        }
    ],

    // File Pattern Configuration
    // {subject}-{suffix}-{chapter}.json
    filePattern: (subject, suffix, chapter) => `${subject}-${suffix}-${chapter}.json`,
    
    // Subject Code (Change this or make dynamic)
    subjectCode: 'ARF', 
    
    // Chapter Range
    chapters: {
        numeric: 16, // 1 to 16
        alpha: ['A', 'B', 'C', 'D', 'E'] // Additional alpha chapters
    }
};

// --- Script Logic ---

if (!fs.existsSync(CONFIG.directories.output)) {
    fs.mkdirSync(CONFIG.directories.output, { recursive: true });
}

function processSet(mapping) {
    const combinedEntries = [];
    const targetFile = path.join(CONFIG.directories.output, `combined-set-${mapping.targetSet}.json`);
    
    console.log(`Processing Set ${mapping.targetSet} (${mapping.description})...
`);

    // Define all possible chapter identifiers
    const chapters = [];
    for (let i = 1; i <= CONFIG.chapters.numeric; i++) chapters.push(String(i).padStart(2, '0'));
    if (CONFIG.chapters.alpha) {
        CONFIG.chapters.alpha.forEach(c => chapters.push(c));
    }

    // Iterate all chapters
    for (const chStr of chapters) {
        const suffixes = mapping.suffixes || [mapping.suffix];

        for (const suffix of suffixes) {
            // Construct filename using configured pattern
            const filename = CONFIG.filePattern(CONFIG.subjectCode, suffix, chStr);
            
            // Try 'new/' first, then 'json/' (or configured paths)
            let filePath = path.join(CONFIG.directories.sourceNew, filename);
            if (!fs.existsSync(filePath)) {
                filePath = path.join(CONFIG.directories.sourceMain, filename);
            }

            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    let data = JSON.parse(content);
                    
                    // Handle different formats (array vs { entries: [] })
                    let entries = [];
                    if (Array.isArray(data)) {
                        entries = data;
                    } else if (data.entries) {
                        entries = data.entries;
                    }

                    // Add metadata
                    entries.forEach(entry => {
                        entry.chapter = chStr;
                        entry.suffix = suffix;
                        entry.source = mapping.sourceLabel || mapping.targetSet;
                        // Preserve original set/chapter if needed, or normalize
                        if (!entry.set) entry.set = suffix;
                    });

                    combinedEntries.push(...entries);
                    console.log(`  Added ${entries.length} questions from ${filename}`);
                } catch (err) {
                    console.error(`  Error reading ${filename}:`, err.message);
                }
            }
        }
    }

    if (combinedEntries.length > 0) {
        fs.writeFileSync(targetFile, JSON.stringify({ entries: combinedEntries }, null, 2));
        console.log(`Created ${targetFile} with ${combinedEntries.length} entries.\n`);
    } else {
        console.log(`No entries found for Set ${mapping.targetSet}.\n`);
    }
}

// Run
CONFIG.mappings.forEach(processSet);
