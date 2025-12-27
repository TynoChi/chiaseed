export const Utils = {
    shuffle(array) {
        for(let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },
    formatTime(ms) {
        if (isNaN(ms)) return "00:00";
        const totalSec = Math.floor(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    },
    arraysEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;
        const sA = [...a].sort((x,y)=>x-y), sB = [...b].sort((x,y)=>x-y);
        return sA.every((v, i) => v === sB[i]);
    },
    getCorrectString(q) {
        switch (q.questionType) {
            case 'mcq': 
                if (q.correctOptions && typeof q.correctOptions[0] === 'number') {
                    return q.correctOptions.map(i => String.fromCharCode(65 + i)).join(', ');
                }
                return q.correctOptions.join(', ');
            case 'msq': return q.subQuestions.map(sq => sq.correctOption).join(', ');
            case 'numerical': return q.correctAnswer;
            case 'multi_numerical': return q.subQuestions.map(sq => `${sq.text}: ${sq.answer}`).join(', ');
            case 'nested': return q.subQuestions.map(sq => {
                if (sq.type === 'mcq') return `${sq.text}: ${sq.options[sq.correctOption]}`;
                return `${sq.text}: ${sq.correctAnswer}`;
            }).join(', ');
            case 'mcloze': return q.blanks.map(b => b.correctAnswer).join(', ');
            default: return '';
        }
    },
    getUserAnswerString(userAnswer, q) {
        if (!userAnswer) return 'Not answered';
        switch (q.questionType) {
            case 'mcq': return Array.isArray(userAnswer) ? userAnswer.map(i => String.fromCharCode(65 + i)).join(', ') : 'Not answered';
            case 'msq': return Array.isArray(userAnswer) ? userAnswer.map((u, i) => {
                const opts = q.subQuestions[i].availableOptions || q.availableOptions;
                return opts[u] || 'Not answered';
            }).join(', ') : 'Not answered';
            case 'numerical': return userAnswer[0] !== undefined ? userAnswer[0] : 'Not answered';
            case 'multi_numerical': return Array.isArray(userAnswer) ? userAnswer.map((u,i) => `${q.subQuestions[i].text}: ${u??'-'}`).join(', ') : 'Not answered';
            case 'nested': return Array.isArray(userAnswer) ? userAnswer.map((u,i) => `${q.subQuestions[i].text}: ${u??'-'}`).join(', ') : 'Not answered';
            case 'mcloze': return Array.isArray(userAnswer) ? userAnswer.map(u => u || 'Not answered').join(', ') : 'Not answered';
            default: return '';
        }
    }
};

export function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

export function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(cname) === 0) return c.substring(cname.length, c.length);
    }
    return "";
}
