import { Utils } from '../utils.js';

export const Scoring = {
    isAnswerCorrect(q, ua) {
        if (!q || !ua) return false;
        try {
            if (q.questionType === 'mcq') {
                if (!q.correctOptions) return false;
                let correctIndices = [];
                if (typeof q.correctOptions[0] === 'number') {
                    correctIndices = q.correctOptions;
                } else {
                    correctIndices = q.correctOptions.map(l => l.charCodeAt(0) - 65);
                }
                const sUA = [...ua].sort((a,b)=>a-b);
                const sCI = [...correctIndices].sort((a,b)=>a-b);
                return Utils.arraysEqual(sUA, sCI);
            }
            if (q.questionType === 'msq') {
                if (!q.subQuestions || ua.length < q.subQuestions.length) return false;
                return q.subQuestions.every((sq, i) => {
                    const opts = sq.availableOptions || q.availableOptions;
                    if (!opts) return false;
                    const correctIdx = opts.indexOf(sq.correctOption);
                    return ua[i] === correctIdx;
                });
            }
            if (q.questionType === 'numerical') {
                if (ua[0] === undefined || ua[0] === null || ua[0] === "") return false;
                return parseFloat(ua[0]) === parseFloat(q.correctAnswer);
            }
            if (q.questionType === 'multi_numerical') {
                if (!q.subQuestions || ua.length < q.subQuestions.length) return false;
                return q.subQuestions.every((sq, i) => {
                    if (ua[i] === undefined || ua[i] === null || ua[i] === "") return false;
                    return parseFloat(ua[i]) === parseFloat(sq.answer);
                });
            }
            if (q.questionType === 'nested') {
                if (!q.subQuestions || ua.length < q.subQuestions.length) return false;
                return q.subQuestions.every((sq, i) => {
                    if (ua[i] === undefined || ua[i] === null) return false;
                    if (sq.type === 'numerical') return parseFloat(ua[i]) === parseFloat(sq.correctAnswer);
                    if (sq.type === 'mcq') return (ua[i] || "").toString().trim() === sq.options[sq.correctOption];
                    if (sq.type === 'text') return (ua[i] || "").toString().trim().toLowerCase() === (sq.correctAnswer || "").toString().trim().toLowerCase();
                    return false;
                });
            }
            if (q.questionType === 'mcloze') {
                if (!q.blanks || ua.length < q.blanks.length) return false;
                return q.blanks.every((blank, i) => this.checkBlank(ua[i], blank));
            }
        } catch (e) {
            console.error("isAnswerCorrect failed", e);
            return false;
        }
        return false;
    },
    
    checkBlank(userVal, blankData) {
        if (!userVal || !blankData) return false;
        let u = userVal.toString().trim();
        let c = blankData.correctAnswer ? blankData.correctAnswer.toString().trim() : "";
        if (!blankData.isCaseSensitive) { u = u.toLowerCase(); c = c.toLowerCase(); }
        if (u === c) return true;
        return blankData.acceptedAlternatives && blankData.acceptedAlternatives.some(alt => {
            let a = alt.toString().trim();
            if (!blankData.isCaseSensitive) a = a.toLowerCase();
            return u === a;
        });
    }
};
