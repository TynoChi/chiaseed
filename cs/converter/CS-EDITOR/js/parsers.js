export function normalizeData(data) {
    return data.map(q => {
        if (!q.id) q.id = `Q-${Math.random().toString(36).substr(2, 5)}`;

        // Convert MSQ -> Nested
        if (q.questionType === 'msq') {
            return {
                ...q,
                questionType: 'nested',
                subQuestions: (q.subQuestions || []).map(sq => {
                    let opts = sq.availableOptions || ["True", "False"];
                    let ans = sq.correctOption;
                    if (String(ans).toLowerCase() === 'true') ans = "True";
                    if (String(ans).toLowerCase() === 'false') ans = "False";

                    return {
                        type: 'mcq',
                        text: sq.statement,
                        options: opts,
                        answer: ans,
                        marks: sq.marks || 1
                    };
                })
            };
        }

        // Convert Multi-Numerical -> Nested
        if (q.questionType === 'multi_numerical') {
            return {
                ...q,
                questionType: 'nested',
                subQuestions: (q.subQuestions || []).map(sq => ({
                    type: 'numerical',
                    text: sq.text,
                    answer: sq.answer,
                    marks: sq.marks || 1
                }))
            };
        }

        return q;
    });
}

export function parseMoodleXml(xmlString) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "application/xml");
            if (xmlDoc.querySelector('parsererror')) throw new Error("Invalid XML");

            // --- Helper: Clean HTML strings ---
            // 1. Removes outer <p> tags.
            // 2. If isNested=true, removes the <ul> list containing the cloze codes.
            // 3. Unescapes common entities if needed (browser handles most via textContent).
            const cleanTextContent = (html, isNested = false) => {
                if (!html) return '';
                let text = html;

                // For Nested Questions: Remove the specific UL list that contains Cloze codes
                // This isolates the "Scenario" text from the "Questions" list
                if (isNested) {
                    text = text.replace(/<ul[^>]*>[\s\S]*?\{[\s\S]*?\}[\s\S]*?<\/ul>/gi, '');
                }

                // Remove Paragraph tags (but keep content inside, including <br>)
                // Using regex to strip <p> and </p> anywhere
                text = text.replace(/<\/?p[^>]*>/gi, '');

                return text.trim();
            };

            const questions = [];
            
            xmlDoc.querySelectorAll('question').forEach(qNode => {
                const type = qNode.getAttribute('type');
                if (type === 'category') return;

                const name = qNode.querySelector('name text')?.textContent || 'Untitled';
                // Note: We access textContent of the <text> node, which is the raw HTML string
                const rawQuestionText = qNode.querySelector('questiontext text')?.textContent || '';
                const rawFeedback = qNode.querySelector('generalfeedback text')?.textContent || '';
                const grade = parseFloat(qNode.querySelector('defaultgrade')?.textContent || 1);

                let qData = { 
                    id: name, 
                    marks: grade, 
                    explanation: cleanTextContent(rawFeedback) // Clean explanation for all types
                };

                // --- 1. MCQ ---
                if (type === 'multichoice') {
                    qData.questionType = 'mcq';
                    qData.questionText = cleanTextContent(rawQuestionText);
                    qData.options = [];
                    qData.correctOptions = [];

                    qNode.querySelectorAll('answer').forEach((a, i) => {
                        qData.options.push(cleanTextContent(a.querySelector('text')?.textContent));
                        if (parseFloat(a.getAttribute('fraction')) > 0) qData.correctOptions.push(i);
                    });
                } 
                // --- 2. CLOZE (Numerical, Nested, etc) ---
                else if (type === 'cloze') {
                    const numMatch = rawQuestionText.match(/\{(\d+):NUMERICAL:=([\d.-]+)(:[\d.]*)?\}/);
                    const clozeCount = (rawQuestionText.match(/\{.*?\}/g) || []).length;

                    // A. Single Numerical (Simple Cloze)
                    if (clozeCount === 1 && numMatch && !rawQuestionText.includes('table')) {
                        qData.questionType = 'numerical';
                        qData.marks = parseInt(numMatch[1]);

                        // Remove the cloze code ({...}) and "Answer:" text
                        let cleanQ = rawQuestionText.replace(/\{.*?\}/, '').replace(/Answer:\s*/i, '');
                        qData.questionText = cleanTextContent(cleanQ);
                        qData.correctAnswer = parseFloat(numMatch[2]);
                    } 
                    // B. Financial Table (Special case)
                    else if (rawQuestionText.includes('table') && (rawQuestionText.includes('Statement of') || rawQuestionText.includes('Balance Sheet'))) {
                        qData.questionType = 'financial';
                        qData.rawXml = qNode.outerHTML; 
                        qData.title = name;
                        // Financial usually needs the HTML table structure, so we don't aggressively clean
                        qData.questionText = rawQuestionText; 
                    } 
                    // C. Nested / Complex Cloze
                    else {
                        qData.questionType = 'nested';
                        qData.subQuestions = []; 

                        // Regex matches: {Marks : Type : Content}
                        const clozeRegex = /\{(\d+):(NUMERICAL|NM|MCH|MCS|MCV|MULTICHOICE|SHORTANSWER|SA)(?:=|:)(.*?)\}/gi;
                        let match;
                        
                        while ((match = clozeRegex.exec(rawQuestionText)) !== null) {
                            const marks = parseInt(match[1]);
                            const typeCode = match[2].toUpperCase();
                            const content = match[3];
                            
                            // Find Sub-Question Text (look backwards for <li>)
                            let qText = "Sub-question";
                            const preText = rawQuestionText.substring(0, match.index);
                            const lastLiOpen = preText.lastIndexOf('<li>');
                            
                            // If we found a list item start, extract text between <li> and {Code}
                            if (lastLiOpen > -1) {
                                const rawLabel = preText.substring(lastLiOpen + 4);
                                // Strip HTML tags to get clean sub-question text
                                qText = rawLabel.replace(/<[^>]*>/g, '').trim();
                            }

                            let subQ = { marks: marks, text: qText };

                            if (typeCode.startsWith('NUM') || typeCode === 'NM') {
                                subQ.type = 'numerical';
                                const valStr = content.startsWith('=') ? content.substring(1) : content;
                                subQ.answer = parseFloat(valStr.split(':')[0]);
                            } else {
                                subQ.type = 'mcq';
                                subQ.options = [];
                                const parts = content.split('~');
                                parts.forEach(p => {
                                    if(!p.trim()) return;
                                    let isCorrect = p.startsWith('=');
                                    let optText = isCorrect ? p.substring(1) : p;
                                    // Moodle escapes chars like \= or \# or \~. Clean them.
                                    optText = optText.replace(/\\([~=#{}])/g, '$1').trim();
                                    subQ.options.push(optText);
                                    if(isCorrect) subQ.answer = optText;
                                });
                                // Fallback answer
                                if(!subQ.answer && subQ.options.length > 0) subQ.answer = subQ.options[0];
                            }
                            qData.subQuestions.push(subQ);
                        }
                        
                        // Clean the main text: Remove the list containing the questions
                        qData.questionText = cleanTextContent(rawQuestionText, true);
                    }
                }
                questions.push(qData);
            });
            return questions;
        }