function _escapeCloze(str) {
    if (!str) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/~/g, '\\~')
        .replace(/=/g, '\\=')
        .replace(/#/g, '\\#')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/:/g, '\\:');
}

function _genMcq(q) {
    const isMulti = q.correctOptions.length > 1;
    const fraction = isMulti ? (100 / q.correctOptions.length).toFixed(5) : 100;

    let xml = `  <question type="multichoice">\n`;
    xml += `    <name><text>${q.id}</text></name>\n`;
    xml += `    <questiontext format="html"><text><![CDATA[<p>${q.questionText}</p>]]></text></questiontext>\n`;
    xml += `    <generalfeedback format="html"><text><![CDATA[<p>${q.explanation}</p>]]></text></generalfeedback>\n`;
    xml += `    <defaultgrade>${q.marks}</defaultgrade>\n    <single>${!isMulti}</single>\n    <shuffleanswers>true</shuffleanswers>\n`;
    q.options.forEach((opt, i) => {
        const isCor = q.correctOptions.includes(i);
        xml += `    <answer fraction="${isCor ? fraction : 0}" format="html"><text><![CDATA[${opt}]]></text></answer>\n`;
    });
    xml += `  </question>\n`;
    return xml;
}

function _genNum(q) {
    const html = `<p>${q.questionText}</p><p>Answer: {${q.marks}:NUMERICAL:=${q.correctAnswer}:0}</p>`;
    return _genClozeShell(q, html);
}

function _genNested(q) {
    let html = `<p>${q.questionText}</p>`;
    if (q.subQuestions && q.subQuestions.length > 0) {
        const useList = q.subQuestions.length > 1;
        if (useList) html += `<ul>`;

        q.subQuestions.forEach(sq => {
            if (useList) html += `<li>`;
            if (sq.text) html += `${sq.text} `;

            if (sq.type === 'numerical') {
                const val = sq.answer !== undefined && sq.answer !== null ? sq.answer : 0;
                html += `{${sq.marks}:NUMERICAL:=${val}:0}`;
            } else if (sq.type === 'mcq') {
                let options = sq.options || [];
                if (options.length < 2) {
                    if (options.length === 0) options = ["True", "False"];
                    else options.push("Other");
                }
                const cleanAns = String(sq.answer).trim().toLowerCase();
                let foundCorrect = false;

                let optsString = options.map(o => {
                    const cleanOpt = String(o).trim().toLowerCase();
                    const isMatch = cleanOpt === cleanAns;
                    if (isMatch) foundCorrect = true;
                    return '~' + (isMatch ? '=' : '') + _escapeCloze(o);
                }).join('');

                if (!foundCorrect) {
                    console.warn(`No matching answer found for nested Q. Defaulting first option.`);
                    optsString = options.map((o, index) => '~' + (index === 0 ? '=' : '') + _escapeCloze(o)).join('');
                }
                html += `{${sq.marks}:MCH:${optsString}}`;
            }

            if (useList) html += `</li>`;
            else html += `<br/>`;
        });
        if (useList) html += `</ul>`;
    }
    return _genClozeShell(q, html);
}

function _genClozeShell(q, htmlContent) {
    return `  <question type="cloze">\n` +
        `    <name><text>${q.id}</text></name>\n` +
        `    <questiontext format="html"><text><![CDATA[${htmlContent}]]></text></questiontext>\n` +
        `    <generalfeedback format="html"><text><![CDATA[<p>${q.explanation}</p>]]></text></generalfeedback>\n` +
        `    <defaultgrade>${q.marks}</defaultgrade>\n` +
        `  </question>\n`;
}

export function generateXml(data) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n`;
    data.forEach(q => {
        if (q.questionType === 'mcq') xml += _genMcq(q);
        else if (q.questionType === 'numerical') xml += _genNum(q);
        else if (q.questionType === 'nested') xml += _genNested(q);
        else if (q.questionType === 'financial') xml += (q.rawXml || '');
    });
    xml += `</quiz>`;
    return xml;
}