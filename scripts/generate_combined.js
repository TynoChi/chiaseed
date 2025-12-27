const fs = require('fs');
const path = require('path');

const SOURCE_DIR_MAIN = 'json';
const SOURCE_DIR_NEW = 'json/new';
const OUTPUT_DIR = 'json/combined';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Config: Map file suffix to Target Set ID
// Suffix '00' -> Set 1 (QB)
// Suffix '01' -> Set 2 (Lectures)
// Suffix '02' -> Set 9 (Old Syllabus) -> Mapped to Set 02 based on usage
// Suffix '10' -> Set 10 (AI 1)

const mappings = [
    { suffixes: ['00'], targetSet: 'qb', description: 'Question Bank Only' },
    { suffixes: ['10'], targetSet: 'ai', description: 'AI Generated Only' },
    { suffixes: ['02'], targetSet: '02', description: 'Set 02' }
];

function processSet(mapping) {
    const combinedEntries = [];
    const targetFile = path.join(OUTPUT_DIR, `combined-set-${mapping.targetSet}.json`);
    
    console.log(`Processing Set ${mapping.targetSet} (${mapping.description})...`);

    // Define all possible chapter identifiers
    const chapters = [];
    for (let i = 1; i <= 16; i++) chapters.push(String(i).padStart(2, '0'));
    ['A', 'B', 'C', 'D', 'E'].forEach(c => chapters.push(c));

    // Iterate all chapters
    for (const chStr of chapters) {
        
        // Use suffixes array if available, otherwise fallback to single suffix
        const suffixes = mapping.suffixes || [mapping.suffix];

        for (const suffix of suffixes) {
            const filename = `ARF-${suffix}-${chStr}.json`;
            
            // Try 'new/' first, then 'json/'
            let filePath = path.join(SOURCE_DIR_NEW, filename);
            if (!fs.existsSync(filePath)) {
                filePath = path.join(SOURCE_DIR_MAIN, filename);
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

                    // Add 'chapter' and 'suffix' metadata to each entry for filtering
                    entries.forEach(entry => {
                        entry.chapter = chStr;
                        entry.suffix = suffix;
                        if (suffix === '00') entry.source = 'QB';
                        else if (suffix === '10') entry.source = 'AI';
                        else entry.source = 'Set 02';
                    });

                    combinedEntries.push(...entries);
                    console.log(`  Added ${entries.length} questions from ${filename}`);
                } catch (err) {
                    console.error(`  Error reading ${filename}:`, err.message);
                }
            } else {
                // console.warn(`  File not found: ${filename}`);
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

mappings.forEach(processSet);