import { QuizUI } from './ui.js';
import { UserTracker } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    window.app = new QuizUI();
    UserTracker.init();
});
