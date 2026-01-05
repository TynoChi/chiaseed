const fs = require('fs');

// --- Configuration ---
// Usage: node check_dataset.js [path/to/json/file]
const DEFAULT_FILE = 'json/combined/combined-set-qb.json'; 

const TARGET_FILE = process.argv[2] || DEFAULT_FILE;

console.log(`Checking dataset: ${TARGET_FILE}\n`);

if (!fs.existsSync(TARGET_FILE)) {
    console.error(`Error: File not found: ${TARGET_FILE}`);
    process.exit(1);
}

try {
    const data = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));
    // Handle both array root and { entries: [] } format
    const entries = Array.isArray(data) ? data : (data.entries || []);
    const issues = [];

    if (entries.length === 0) {
        console.warn("Warning: No entries found in dataset.");
    }

    entries.forEach((entry, index) => {
        const entryIssues = [];
        
        // 1. Basic Identity
        if (!entry.id) entryIssues.push('Missing ID');
        if (!entry.questionText && !entry.question) entryIssues.push('Missing question text');
        
        // 2. Type-Specific Validation
        const type = entry.questionType || entry.type || 'mcq';

        if (type === 'mcq' || type === 'msq') {
            if (!entry.options || entry.options.length === 0) entryIssues.push('Empty options');
            
            // Correct Answer Checks
            const hasCorrectOption = entry.correctOption !== undefined || (entry.correctOptions && entry.correctOptions.length > 0) || (entry.answer && entry.answer.length > 0);
            if (!hasCorrectOption) entryIssues.push('Missing answer definition (correctOption/answer)');
        } 
        else if (type === 'nested') {
            if (!entry.subQuestions || entry.subQuestions.length === 0) entryIssues.push('Empty subQuestions');
            else {
                entry.subQuestions.forEach((sq, sqIdx) => {
                    if (!sq.text && !sq.question) entryIssues.push(`Empty subQuestion[${sqIdx}] text`);
                    if (!sq.options || sq.options.length === 0) entryIssues.push(`Empty subQuestion[${sqIdx}] options`);
                    
                    const hasSqAnswer = sq.correctOption !== undefined || (sq.correctOptions && sq.correctOptions.length > 0) || (sq.answer && sq.answer.length > 0);
                    if (!hasSqAnswer) entryIssues.push(`Missing subQuestion[${sqIdx}] answer`);
                });
            }
        }

        // 3. Explanation Check (Optional but recommended)
        if (!entry.explanation && !entry.answer_explanation) {
            // Uncomment to enforce explanations
            // entryIssues.push('Empty explanation');
        }

        if (entryIssues.length > 0) {
            issues.push({
                index,
                id: entry.id || `IDX_${index}`,
                chapter: entry.chapter || 'Unknown',
                issues: entryIssues
            });
        }
    });

    if (issues.length > 0) {
        console.log(`Found ${issues.length} entries with potential issues:\n`);
        issues.forEach(issue => {
            console.log(`[Index ${issue.index}] ID: ${issue.id} (Ch: ${issue.chapter})`);
            issue.issues.forEach(i => console.log(`  - ${i}`));
        });
        process.exit(1); // Exit with error code if issues found
    } else {
        console.log(`✅ No issues found in ${entries.length} entries.`);
    }

} catch (err) {
    console.error('Error parsing JSON:', err.message);
    process.exit(1);
}