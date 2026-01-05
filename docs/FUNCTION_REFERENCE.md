# Function Reference (v1.1.0)

This document provides a detailed breakdown of the functions in the core Chiaseed modules.

---

## 1. UI Controller: `assets/js/ui.js`

### Core Lifecycle
*   **`init()`**: Bootstraps the application. Sets up themes, populates the Subject list, and checks for `tags` in URL parameters.
*   **`updateChapters()`**: **(v1.1.0 logic)** Refreshes the Set and Chapter dropdowns. It ensures that when a Set is selected, the Chapter list updates to match that set's specific IDs.
*   **`populateChapterOptions()`**: Generates the UI elements for chapter selection. Supports dynamic labels and alphabetic chapters (A, B, C...).

### Navigation
*   **`promptExit(callback)`**: Intercepts navigation attempts. If `engine.isQuizActive()`, it shows a confirmation modal. The `callback` is only fired if the user chooses to exit.
*   **`switchView(name)`**: Toggles the visibility of display containers (`selector`, `quiz`, `results`) and manages the visibility of navigation tabs.

---

## 2. API Fetchers: `assets/js/api/`

### `study_fetcher.js`
*   **`fetchStudyQuiz(params)`**: 
    *   **Architecture**: Uses a `combinedFileMap` to look for aggregate JSONs.
    *   **Logic**: If a combined file is found, it filters entries in-memory where `q.chapter === chapter`. This handles extension sets that lack individual files.

### `common.js`
*   **`normalizeQuestion(q)`**: Essential for data integrity. Converts `q.answer` or `q.questions` into the standard `q.correctOptions` and `q.questionText` schema.

---

## 3. Scoring Engine: `assets/js/engine/scoring.js`

*   **`isAnswerCorrect(q, ua)`**: The primary grading logic.
    *   **MCQ**: Matches user indices against `correctOptions`.
    *   **MSQ**: Validates every sub-statement selection.
    *   **Numerical**: Uses `parseFloat` to ensure string/number compatibility.
    *   **MCloze**: Iterates through blanks and calls `checkBlank`.
*   **`checkBlank(userVal, blankData)`**: Validates fill-in-the-blank inputs. Supports case-insensitivity and multiple alternative answers defined in the JSON.

---

## 4. Maintenance Utility: `scripts/`

*   **`generate_combined.js`**: 
    *   Iterates through subjects defined in `config.js`.
    *   Bundles all associated chapter files into a single `combined-set-*.json` file.
*   **`setup.py`**:
    *   Interactive Python utility.
    *   Uses Regex to replace placeholders in `config.js` with your specific branding and endpoints.
