import { Utils } from './utils.js';
import { UserTracker } from './auth.js';
import { showModal } from './modal.js';
import { Scoring } from './engine/scoring.js';

export class QuizEngine {
    constructor(ui) {
        this.ui = ui;
        this.reset();
    }
    reset() {
        this.questions = []; this.answers = []; this.questionTimes = [];
        this.currentIndex = 0; this.timeLimitMinutes = 0; this.startTime = null;
        this.timerInterval = null; this.qTimerInterval = null; this.qStartTime = null;
        this.isFinished = false; this.instantMode = false; this.checkedQuestions = [];
        this.metadata = {};
        this.isPaused = false; this.pausedDuration = 0; this.qPausedDuration = 0; this.pauseStartTime = 0;
    }
    start(data, timeLimit, isInstant, metadata) {
        this.reset();
        this.questions = data;
        this.timeLimitMinutes = timeLimit;
        this.instantMode = isInstant;
        this.metadata = metadata || {};
        // Initialize answers structure based on type
        this.answers = data.map(q => {
             if (!q) return null;
             if(q.questionType === 'msq') return []; // Array for MSQ answers
             if(q.questionType === 'mcq') return []; // Array for MCQ selection indices
             if(q.questionType === 'mcloze') return []; // Array for text inputs
             if(q.questionType === 'numerical') return []; // Array containing one number
             if(q.questionType === 'multi_numerical') return new Array(q.subQuestions ? q.subQuestions.length : 0).fill(null);
             if(q.questionType === 'nested') return new Array(q.subQuestions ? q.subQuestions.length : 0).fill(null);
             return null;
        });
        this.questionTimes = new Array(data.length).fill(0);
        this.startTime = Date.now();
        this.startGlobalTimer();
        this.ui.showQuizView();
        this.goToQuestion(0);
    }
    startGlobalTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;
            const remaining = (this.timeLimitMinutes * 60 * 1000) - (Date.now() - this.startTime - this.pausedDuration);
            if (remaining <= 0) this.finish(true);
            else this.ui.updateTimer(remaining, remaining < 60000); // Warn if < 1 min
        }, 1000);
    }
    startQuestionTimer() {
        clearInterval(this.qTimerInterval);
        this.qStartTime = Date.now();
        this.ui.updateQuestionTimer(0);
        this.qTimerInterval = setInterval(() => {
            if (this.isPaused) return;
            this.ui.updateQuestionTimer(Date.now() - this.qStartTime - this.qPausedDuration);
        }, 1000);
    }
    pauseTimer() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.pauseStartTime = Date.now();
    }
    resumeTimer() {
        if (!this.isPaused) return;
        this.isPaused = false;
        const duration = Date.now() - this.pauseStartTime;
        this.pausedDuration += duration;
        this.qPausedDuration += duration;
    }
    saveCurrentQuestionTime() {
        if (this.qStartTime) {
            let activeTime = Date.now() - this.qStartTime - this.qPausedDuration;
            if (this.isPaused) activeTime -= (Date.now() - this.pauseStartTime);
            this.questionTimes[this.currentIndex] += activeTime;
        }
    }
    goToQuestion(index) {
        if (index < 0 || index >= this.questions.length) return;
        
        if (this.isPaused) this.resumeTimer(); // Resume if coming from paused state

        this.saveCurrentQuestionTime();
        this.currentIndex = index;
        
        this.qPausedDuration = 0; // Reset for new question
        this.startQuestionTimer();
        
        this.ui.renderQuestion(this.questions[index], index, this.questions.length, this.answers[index], this.instantMode ? this.checkedQuestions.includes(index) : false);
        this.ui.renderNavGrid(this.questions.length, this.currentIndex, this.answers, this.checkedQuestions, this.questions, this.instantMode);
    }
    answerMCQ(optionIndex) {
        if (this.isFinished || (this.instantMode && this.checkedQuestions.includes(this.currentIndex))) return;
        const q = this.questions[this.currentIndex];
        const correctCount = q.correctOptions.length;
        let ua = this.answers[this.currentIndex];
        
        if (correctCount === 1) {
            ua = [optionIndex];
        } else {
            const existingIdx = ua.indexOf(optionIndex);
            if (existingIdx > -1) ua.splice(existingIdx, 1); 
            else if (ua.length < correctCount) ua.push(optionIndex);
        }
        this.answers[this.currentIndex] = ua;
        this.refreshCurrent();
    }
    answerMSQ(subIndex, optionIndex) {
        if (this.isFinished || (this.instantMode && this.checkedQuestions.includes(this.currentIndex))) return;
        this.answers[this.currentIndex][subIndex] = optionIndex;
        this.refreshCurrent();
    }
    answerInput(value, subIndex = 0) {
        if (this.isFinished || (this.instantMode && this.checkedQuestions.includes(this.currentIndex))) return;
        this.answers[this.currentIndex][subIndex] = value;
        // No full refresh needed for inputs usually, but to update Nav state:
        this.ui.updateNavState(this.currentIndex, true);
        this.ui.updateButtonState();
    }
    refreshCurrent() {
        this.ui.updateNavState(this.currentIndex, true);
        this.ui.renderQuestion(this.questions[this.currentIndex], this.currentIndex, this.questions.length, this.answers[this.currentIndex], false);
    }
    checkInstant() {
        this.checkedQuestions.push(this.currentIndex);
        this.saveCurrentQuestionTime();
        this.pauseTimer(); // Stop timer
        
        // Track Attempt
        const q = this.questions[this.currentIndex];
        const isCorrect = Scoring.isAnswerCorrect(q, this.answers[this.currentIndex]);
        UserTracker.trackAttempt(q.id, isCorrect, this.metadata.chapter, this.metadata.set, q.tags, this.metadata.platform, JSON.stringify(this.answers[this.currentIndex]));

        this.ui.renderQuestion(q, this.currentIndex, this.questions.length, this.answers[this.currentIndex], true);
        this.ui.renderNavGrid(this.questions.length, this.currentIndex, this.answers, this.checkedQuestions, this.questions, true);
    }
    finish(timeUp = false) {
        this.saveCurrentQuestionTime();
        clearInterval(this.timerInterval);
        clearInterval(this.qTimerInterval);
        this.isFinished = true;
        if (timeUp) showModal('modal-timeup');
        
        try {
            const results = this.calculateResults();
            
            let attemptsCount = 0;
            let correctCount = 0;

            results.details.forEach((d) => {
                if (d.answered) {
                    attemptsCount++;
                    if (d.correct) correctCount++;

                    // Track individual attempts for Normal Mode quizzes upon submission
                    if (!this.instantMode) {
                        UserTracker.trackAttempt(d.question.id, d.correct, this.metadata.chapter, this.metadata.set, d.question.tags, this.metadata.platform, JSON.stringify(d.user));
                    }
                }
            });

            // Submit overall score regardless of mode
            // We use attemptsCount as the denominator as per user requirement (only count what was answered)
            if (attemptsCount > 0) {
                UserTracker.submitScore(correctCount, attemptsCount, Date.now() - this.startTime - this.pausedDuration);
            }
            
            this.ui.showResults(results, Date.now() - this.startTime - this.pausedDuration);
        } catch (e) {
            console.error("Error finishing quiz:", e);
            alert("An error occurred while calculating results. Please check the console.");
        }
    }
    calculateResults() {
        let score = 0, total = 0, attemptedTotal = 0;
        const details = this.questions.map((q, i) => {
            let correct = false;
            let user = this.answers[i];
            const qMarks = q.marks || 1;
            
            // Check if answered
            const hasAns = user && (Array.isArray(user) ? user.some(x => x !== null && x !== undefined && x !== "") : user !== null && user !== "");

            try {
                if (hasAns) {
                    correct = Scoring.isAnswerCorrect(q, user);
                    if (correct) score += qMarks;
                    attemptedTotal += qMarks;
                }
            } catch (e) {
                console.error(`Error grading Q${i+1}`, e);
                correct = false; 
            }
            total += qMarks;
            return { question: q, user, correct, time: this.questionTimes[i], answered: hasAns };
        });
        return { score, total, attemptedTotal, details };
    }
    isAnswerCorrect(q, ua) {
        return Scoring.isAnswerCorrect(q, ua);
    }
}