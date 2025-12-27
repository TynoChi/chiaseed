# Codebase Overview & File Dictionary

This document provides a comprehensive explanation of the file structure, the specific purpose of each key file, and a detailed breakdown of the functions contained within the source code. Use this as a reference for future refactoring or feature implementation.

---

## 📂 Root Directory

### Core Applications

*   **`index.html`**: **The Main Application Entry Point.**
    *   **Purpose:** The central hub for the "2nd Semester Quiz Platform". It is a lean HTML file that loads modular JavaScript (`assets/js/app.js`) and CSS.
    *   **Functionality:**
        *   **Three Primary Modes:**
            1.  **Study Mode:** Chapter-by-chapter practice from the standard question bank.
            2.  **Question Bank (DAM):** Customisable random sets (Standard, AI, or Mixed).
            3.  **ChiaSeed (Weakness):** Focused practice mode allowing selection of specific topic groups and concepts (tags) to target weak areas.
        *   **Statistics:** Integrated leaderboard and personal progress tracking, accessible via the header icon.
        *   **PWA:** Supports progressive web app features (`manifest.json`, `sw.js`).
    *   **UI Structure:** Grid-based layouts for selection, modal-based interactions for login/results.

*   **`admin.html`**: **Admin Dashboard.**
    *   **Purpose:** A standalone tool for monitoring student progress and system usage.
    *   **Functionality:**
        *   **Student Progress:** Lists unique users and consolidated students (by name).
        *   **Progress Map:** Visualizes chapter-by-chapter progress using a color-coded grid.
        *   **Deep Drill-Down:** Clicking a question box shows detailed attempt info (Platform Mode, Set Name, Tags, Time).
        *   **GenAI Audit:** Logs of all AI generation requests and associated costs.
    *   **Key Functions (Inline Script):**
        *   `init()`: Bootstraps the dashboard.
        *   `fetchQuestionStructure()`: Loads `combined-set-1.json` to build the "universe" of valid questions.
        *   `fetchUsers()`: Calls `/admin/users` to get the list of tracked sessions.
        *   `renderUserList(filter)`: Renders the sidebar list with search filtering.
        *   `selectUser(user)`: Fetches attempt data for a specific ID (or list of IDs in consolidated mode).
        *   `renderProgressMap()`: The core logic that draws the grid.
        *   `showQuestionDetail(q, attempts)`: Opens a modal showing detailed context (Mode, Set, Tags) and the question itself.

*   **`chiaseed.html`**: **(Legacy/Deprecated)**
    *   *Note: The functionality of this file has been fully integrated into the "ChiaSeed" tab within `index.html`. It remains as a fallback or reference but is no longer the primary entry point.*

### Config Files
*   **`package.json`**: Node dependencies (mostly for `wrangler`).
*   **`manifest.json`**: PWA metadata (icons, colors).
*   **`sw.js`**: Service Worker for offline caching.
*   **`run.bat`** / **`run.sh`**: Helpers to start local Python server.

---

## 📂 `SEM1/` (Semester 1 Archive)

This directory contains a standalone copy of the quiz platform tailored for Semester 1.
*   **`SEM1/index.html`**: The main entry for S1.
*   **`SEM1/dam.html`**: Daily Assessment Mode for S1.
*   **`SEM1/editor.html`**: A tool for editing S1 question data.
*   **`SEM1/videos/`**: Video resources and tutorials.
*   **`SEM1/prompts/`**: AI system prompts used during S1.

---

## 📂 `assets/js/` (Modular Logic)

The JavaScript codebase is fully modular (ES6 Modules). Implementation is distributed into subdirectories for maintainability.

### `app.js`
*   **Purpose:** Entry point. Initializes `QuizUI` and `UserTracker`.

### `config.js`
*   **Purpose:** Static configuration (Subject names, Chapters, API Endpoints).

### `utils.js`
*   **Purpose:** Pure helper functions (Shuffle, Formatting, Cookies).

### `auth.js`
*   **Purpose:** Identity management and `UserTracker` for backend syncing.

### `api.js` (Facade)
*   Delegates to `assets/js/api/`:
    *   **`study_fetcher.js`**: Fetches static chapter JSONs.
    *   **`dam_fetcher.js`**: Logic for aggregating random sets.
    *   **`gen_fetcher.js`**: Communicates with the Alpha worker for AI tasks.
    *   **`cache.js`**: Handles local storage caching of quiz data.
    *   **`common.js`**: Shared fetch utilities.

### `engine.js`
*   **Purpose:** Quiz State Machine. Delegates grading to `engine/scoring.js`.

### `ui.js` (Facade)
*   Delegates to `assets/js/ui/`:
    *   **`question_renderer.js`**: Generates HTML for different question types.
    *   **`result_renderer.js`**: Renders the final score and review screen.
    *   **`leaderboard.js`**: Handles leaderboard fetching and display.
    *   **`ai_helper.js`**: Manages interaction with the AI Explanation service.

---

## 📂 `workers/` (Backend)

### `workers/alpha/` (AI Gen)
*   **`index.js`**: Handles AI explanations. Includes (currently disabled) logic for full quiz generation based on uploaded text.

### `workers/beta/` (Data & DB)
*   **`index.js`**: The master API gateway for D1 database operations.

### `workers/pact/` (Utility)
*   A secondary worker containing a simple UI and asset hosting.

---

## 📂 `scripts/` (Maintenance)

*   **`update_answers_v2.py`**: Python script for batch correction of answer keys.
*   **`update_tags_v2.py`**: Ensures consistent tagging across all JSON files.
*   **`generate_combined.js`**: Node script to compile individual chapters into `combined-set-*.json`.

---

## 📂 `ARF/` (Module Assets)

*   **PDFs**: Extensive collection of Question Banks (`QBC*.pdf`) and Workbooks (`WBC*.pdf`) with accompanying answer keys.
*   **`Workbook-v1/`**: Individual chapter PDFs from the ASR series.

---

## 📂 `json/` (Data)

*   **`combined/`**: Optimized aggregates (`combined-set-1.json`, `combined-set-qb.json`, `combined-set-ai.json`).
*   **`new/`**: The "Source of Truth" individual chapter files.

---

## 📂 `cs/` (Exam Sim)

*   **`cs/index.html`**: The high-fidelity simulator.
*   **`cs/converter/`**: Contains multiple versioned tools for converting various data formats into the simulator's schema.
*   **`cs/template/`**: JSON templates for MCQ, MSQ, Cloze, and Numerical question types.
