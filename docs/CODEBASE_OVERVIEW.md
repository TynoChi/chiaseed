# Codebase Overview & File Dictionary (v1.1.0)

This document provides a comprehensive explanation of the Chiaseed file structure, the specific purpose of each key file, and the architectural evolution of the platform.

---

## 🚀 Version 1.1.0 Refactor
The v1.1.0 release introduces a **Settings-Driven Architecture**, allowing users to configure the platform without modifying core logic files.

*   **Selection Flow**: Reordered from (Chapter -> Set) to **(Set -> Chapter)**.
*   **Centralized Config**: All modules now consume `activeConfig` from `settings_manager.js` instead of the static `config.js` default.
*   **Security**: Integrated `promptExit()` to safeguard progress.

---

## 📂 Root Directory

*   **`index.html`**: **The Main Application Entry Point.**
    *   Central hub for the quiz platform. It loads modular JavaScript (`assets/js/app.js`) and handles the three primary modes: **Study**, **DAM**, and **ChiaSeed (Weakness)**.
    *   Features integrated statistics (leaderboard/progress) and PWA support.
*   **`setup.py`**: **(New Utility)** Interactive CLI tool to quickly configure your Platform Name and API endpoints.
*   **`simulator.html`**: A separate high-fidelity entrance for the exam simulation mode.
*   **`editor/`**: A standalone subdirectory containing a browser-based tool for creating and editing question JSON files.

---

## 📂 `assets/js/` (Modular Logic)

### Core System
*   **`settings_manager.js`**: **(Architectural Hub)** Manages `localStorage` overrides. It deep-merges user settings with `config.js` defaults and exports the `activeConfig` used globally.
*   **`app.js`**: Initializes `QuizUI` and the `UserTracker` authentication system.
*   **`auth.js`**: Handles user identity. It manages the `UserTracker` object for backend syncing and leaderboard registration.
*   **`engine.js`**: The **Quiz State Machine**. Manages the global and per-question timers, answer state, and transition logic.

### Data & API (`assets/js/api/`)
*   **`api.js`**: The facade for data acquisition. Delegates requests to specific fetchers based on the quiz mode.
*   **`study_fetcher.js`**: Handles fetching static chapter JSONs. In v1.1.0, it is optimized to try `json/combined/` first to ensure zero-latency loading.
*   **`dam_fetcher.js`**: Logic for aggregating random sets across multiple chapters.
*   **`common.js`**: Shared utilities, including `normalizeQuestion` which ensures legacy JSON formats are compatible with the modern renderer.
*   **`cache.js`**: Manages in-memory caching (`CACHE` and `DAM_CACHE`) to prevent redundant network requests.

### User Interface (`assets/js/ui/`)
*   **`ui.js`**: The main UI controller. Orchestrates view switching and input population.
*   **`question_renderer.js`**: Generates HTML for 6 question types: MCQ, MSQ, Numerical, Multi-Numerical, Nested, and MCloze (Fill-in-the-blanks).
*   **`result_renderer.js`**: Renders the final review screen. It calculates "Fair Scoring" (based on attempted questions) and identifies weak spots.
*   **`ai_helper.js`**: Manages interaction with the AI Explanation service. It sends context-rich prompts to the backend and renders structured JSON responses.

---

## 📂 `scripts/` (Maintenance)

*   **`generate_combined.js`**: Node.js script to compile individual chapter files into `combined-set-*.json` aggregates.
*   **`update_tags_v2.py`**: Standardizes tags across the question bank to ensure consistency in ChiaSeed mode.
*   **`check_dataset.js`**: Validation tool to identify broken JSON or missing fields in your data.
