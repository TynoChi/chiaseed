# Function Reference

This document provides a detailed breakdown of the functions in key files of the 2nd Semester Quiz Platform (`v2.3.0`).

---

## 1. Frontend Logic: `assets/js/ui.js`

The `QuizUI` class is the central controller for the user interface. It manages views, inputs, ChiaSeed logic, and coordinates with the `QuizEngine`.

### Core Lifecycle
*   **`constructor()`**: Initializes the class. Maps all necessary DOM elements (Views, Inputs, Quiz container, Modals) to `this.els` for easy access. Instantiates helper classes (`QuizEngine`, `QuestionRenderer`, `ResultRenderer`, `AIHelper`, `LeaderboardManager`). Initializes state variables for ChiaSeed.
*   **`init()`**: The main bootstrap function.
    *   Sets up the theme (Dark/Light).
    *   Populates the "Subject" dropdown.
    *   Sets up event listeners for tabs, buttons, and inputs.
    *   Checks for URL parameters (e.g., `?tab=chiaseed&tags=...`) to handle auto-navigation from the "Fix Weak Spots" button.
    *   Checks if the donation modal should be shown.

### Theme & Configuration
*   **`setupTheme()`**: Toggles the `.dark` class on the `html` element and saves the preference to `localStorage`. Updates the sun/moon icon.
*   **`populateSubjects()`**: Iterates through `CONFIG.subjects` to fill the Subject dropdown. Calls `updateChapters()`.
*   **`updateChapters()`**: Dynamic UI update based on the selected Subject.
    *   Updates labels (e.g., "Chapter" vs "Topic").
    *   Populates the Chapter dropdown.
    *   Populates the Set dropdown.
    *   Populates the checkbox grid for Custom DAM mode using button-style inputs (`concept-checkbox`).

### Event Handling
*   **`setupEventListeners()`**: Attaches click/change handlers to:
    *   **Tabs:** Switches views (`study`, `dam`, `chiaseed`). Lazy-loads ChiaSeed data on first access.
    *   **Inputs:** Updates dependent dropdowns when Subject/Mode changes.
    *   **Buttons:** Handles "Select All", "Refresh Leaderboard", "Check Usage", "Start Quiz", "Previous/Next", "Submit".
    *   **Manual Upload:** Handles parsing of uploaded JSON files.
    *   **ChiaSeed:** Attaches handlers for Chapter/Group changes.

### Quiz Execution
*   **`startQuiz()`**: The gatekeeper for starting a session.
    *   **Validation:** Checks if the user is logged in.
    *   **Mode Handling:**
        *   **ChiaSeed Mode:** Checks if questions are filtered (`filteredChiaQuestions`) and starts the engine with them.
        *   **Study/DAM Mode:** Collects settings (Chapter, Set, Count, Time), calls `QuizFetcher.fetchQuizData` to get the questions, and then starts the engine.
    *   **Error Handling:** Catches fetch errors and shows manual upload prompt if needed.

### View Management
*   **`switchView(name)`**: Hides all view containers and unhides the requested one (`selector`, `loading`, `quiz`, `results`, `statistic`). Also toggles the visibility of the main navigation tabs.
*   **`showQuizView()`**: Convenience wrapper for `switchView('quiz')`.

### Render Delegates (Engine -> UI)
These methods are called by `QuizEngine` to update the display during a quiz.
*   **`renderQuestion(q, index, total, userAnswer, isChecked)`**: Updates the progress bar and Question ID badge. Delegates the actual HTML generation to `QuestionRenderer`.
*   **`updateButtonVisibility(index, total, isChecked, userAnswer)`**: Logic to show/hide/disable "Previous", "Next", "Check Answer", and "Submit" buttons based on the current state (Instant Mode vs Exam Mode).
*   **`renderNavGrid(...)`**: Renders the grid of question numbers. Handles coloring for "Answered", "Correct", or "Incorrect" states.
*   **`updateButtonState()`**: Updates the "Check Answer" button state (enabled/disabled) based on whether an input has been selected.
*   **`updateTimer(ms, warn)`**: Formats and displays the global countdown timer.
*   **`updateQuestionTimer(ms)`**: Formats and displays the per-question timer.
*   **`showResults(res, time)`**: Delegates to `ResultRenderer` to display the final score and review screen.

### ChiaSeed (Weakness) Logic
*   **`loadChiaQuestions()`**: Fetches **both** `combined-set-qb.json` and `combined-set-ai.json` in parallel. Merges them into `this.chiaQuestions`. Calls `processTags` to build the filter database.
*   **`processTags(questions)`**: Scans all loaded questions to build a hierarchical index: `Chapter -> Group -> Concept`. This allows the UI dropdowns to be dynamically populated based on actual data.
*   **`initChiaFilters()`**: Populates the "Chapter" dropdown for the ChiaSeed tab.
*   **`onChiaChapterChange()`**: When a chapter is selected, populates the "Group" dropdown.
*   **`onChiaGroupChange()`**: When a group is selected, renders the grid of "Concept" buttons (checkboxes).
*   **`updateChiaPreview()`**: Filters `this.chiaQuestions` based on the selected Chapter, Group, and checked Concepts. Updates the "X questions found" text.
*   **`autoFilter(tags)`**: Used when coming from the "Fix Weak Spots" button. Automatically filters the pool to questions containing the provided tags.

### Helpers
*   **`showTags(tags)`**: Renders a modal showing the tags associated with a question.
*   **`fetchAndRenderLeaderboard()`**: Delegates to `LeaderboardManager`.
*   **`fetchAndShowUsage()`**: Fetches GenAI cost data from the backend and renders it in a modal.

---

## 2. Backend Logic: `workers/beta/index.js`



...



### Admin Handlers

*   **`handleAdminUsers`**: Lists all tracked users sorted by last visit.

*   **`handleAdminUserAttempts`**:

    *   **Input:** `userId`.

    *   **Action:** Returns all quiz attempts for that user, including detailed context (`platform_mode`, `set_name`, `tags`) to power the Admin Dashboard's deep dive.

*   **`handleAdminGenAI`**: Returns the latest 50 GenAI logs for audit.



### Helpers

*   **`getUserIdFromCookie(request)`**: extracts the UUID.

*   **`setCorsHeaders(origin)`**: Manages CORS for frontend access.



---



## 3. Modular Logic Delegates (`assets/js/`)



The application uses a delegation pattern where `api.js` and `ui.js` act as entry points for more specific modules.



### API Delegates (`assets/js/api/`)

*   **`study_fetcher.js`**: `StudyFetcher` class. Handles fetching individual chapter files and optimized loading for specific subjects (like ARF).

*   **`dam_fetcher.js`**: `DamFetcher` class. Implements the complex logic for Daily Assessment Mode, including random selection across multiple chapters and merging "Standard" vs "AI" sources.

*   **`gen_fetcher.js`**: `GenFetcher` class. Handles communication with the Alpha worker for explanations and generation.

*   **`cache.js`**: `QuizCache` class. Implements a simple `localStorage` based caching layer to reduce network requests for static JSON data.



### UI Delegates (`assets/js/ui/`)

*   **`question_renderer.js`**: `QuestionRenderer` class. Contains the HTML templates and logic for rendering MCQ, MSQ, Numerical, and Cloze questions.

*   **`result_renderer.js`**: `ResultRenderer` class. Renders the score breakdown, accuracy charts, and the question-by-question review list.

*   **`ai_helper.js`**: `AIHelper` class. Manages the "Explain with AI" UI state, including loading indicators and rendering the markdown response from the GenAI worker.



---



## 4. Maintenance Scripts (`scripts/`)



*   **`update_answers_v2.py`**: 

    *   **Purpose**: Batch update answer keys across multiple JSON files. 

    *   **Logic**: Parses target JSONs, matches question numbers/IDs, and overwrites the `answer` and `answer_explanation` fields based on a provided mapping.

*   **`update_tags_v2.py`**:

    *   **Purpose**: Standardize and inject tags into the question bank.

    *   **Logic**: Uses a central tag mapping to ensure that questions across different chapters have consistent "Concept" and "Group" tags for ChiaSeed mode.

*   **`generate_combined.js`**:

    *   **Purpose**: Compiles individual chapter files from `json/new/` into the large `combined-set-*.json` files used by the frontend for optimized loading.
