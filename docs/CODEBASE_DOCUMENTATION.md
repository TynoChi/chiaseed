# Chiaseed Codebase Documentation

This document provides a detailed technical overview of the Chiaseed Quiz Platform codebase. It is intended to help developers understand the architecture, key files, and data flows to facilitate future maintenance and development.

## 1. Project Overview

Chiaseed is a client-side-heavy web application designed for administering quizzes and exams.
*   **Architecture:** Vanilla HTML5/CSS3/ES6 JavaScript.
*   **Modules:** Native ES Modules (`import`/`export`).
*   **Build System:** None required for the frontend. A Node.js script (`generate_combined.js`) is used for data aggregation.
*   **State Management:** Custom state management within classes (e.g., `QuizEngine`).

## 2. Core Application Logic (`assets/js/`)

### 2.1 Entry Point
*   **`app.js`**: The main entry point. It initializes the `QuizUI` and `UserTracker` when the DOM is ready.

### 2.2 Quiz Engine (`engine.js`)
The `QuizEngine` class manages the runtime state of a quiz session.
*   **Responsibilities:**
    *   Manages the list of questions and user answers.
    *   Handles timers (global and per-question).
    *   Navigates between questions (`goToQuestion`).
    *   Processes user inputs (`answerMCQ`, `answerInput`).
    *   Calculates results (`finish`, `calculateResults`).
    *   Tracks metrics for the `UserTracker`.
*   **Key Methods:**
    *   `start(data, timeLimit, mode)`: Resets state and begins a new session.
    *   `checkInstant()`: Validates the current question immediately (Instant Mode).

### 2.3 Configuration (`config.js`, `settings_manager.js`)
*   **`config.js`**: Contains the default static configuration (Platform name, endpoints, subject definitions, admin view structure).
*   **`settings_manager.js`**:
    *   `SettingsManager` class: Handles loading/saving user overrides from `localStorage`.
    *   Merges defaults with user settings.
    *   Exports `activeConfig` which is used throughout the app.

### 2.4 Authentication & Tracking (`auth.js`)
*   **`UserTracker`**: Static class for handling user identity and sending telemetry to the backend.
*   **Key Features:** Generates UUIDs, tracks attempts, submits scores.

## 3. UI Components (`assets/js/ui/`)

### 3.1 Question Rendering (`question_renderer.js`)
The `QuestionRenderer` class is responsible for generating the DOM for specific question types.
*   **Supported Types:**
    *   `mcq`: Multiple Choice.
    *   `msq`: Multiple Select.
    *   `numerical`: Single number input.
    *   `multi_numerical`: Multiple number inputs (rows).
    *   `nested`: Complex sub-questions.
    *   `mcloze`: Fill-in-the-blank (Cloze) text.
*   **Modes:** Handles both "Input" mode (interactive) and "Review" mode (disabled, showing correct/incorrect status).

### 3.2 Main UI (`ui.js`)
*   **`QuizUI`**: The central UI controller.
*   **Responsibilities:**
    *   Manages DOM elements for screens (Home, Quiz, Results).
    *   Updates navigation grids and timer displays.
    *   Delegates question rendering to `QuestionRenderer`.
    *   Displays modals.

## 4. Data Layer (`assets/js/api/`)

### 4.1 Common Utilities (`common.js`)
*   **`fetchWithFallback(filename, isUnseen)`**: Implements a robust fetching strategy.
    1.  Tries the configured API endpoint.
    2.  Falls back to local/relative paths.
    3.  Falls back to a CORS proxy (`allorigins.win`) if needed.
*   **`normalizeQuestions(questions)`**: Sanitizes incoming JSON data.
    *   Ensures consistent field names (e.g., `questionText`, `correctOptions`).
    *   Handles legacy formats or raw API responses.

## 5. Admin Dashboard (`assets/js/admin/`)

### 5.1 Dashboard Logic (`dashboard.js`)
Powered by `Chart.js` for visualizations.
*   **Dynamic View Switching:** Uses `activeConfig` to define views (Heatmap, Students, Leaderboard) and data sources (QB, Sets).
*   **Data Fetching:** Aggregates data from multiple sources (Combined JSONs + Backend APIs).
*   **Visualizations:**
    *   `renderProgressMap()`: Generates the color-coded grid of questions.
    *   `renderVisualizer()`: Renders Chart.js graphs for daily activity and accuracy.

## 6. Editor Tool (`editor/`)

A standalone tool for creating and modifying Question Bank JSONs.
*   **`editor/js/app.js`**: Main controller. Handles file I/O (Drag & Drop, Paste).
*   **`editor/js/parsers.js`**: Converts Moodle XML and various JSON formats into the normalized internal format.
*   **`editor/js/generators.js`**: Exports data back to JSON or Moodle XML.
*   **`editor/js/ui.js`**: Manages the editor interface (form fields, dynamic inputs).

## 7. Scripts & Utilities

### 7.1 Setup (`setup.py`)
A Python script for initial project configuration.
*   Interactively prompts the user for Platform Name and API Endpoints.
*   Updates `assets/js/config.js` using Regex replacement.

### 7.2 Build Pipeline (`scripts/generate_combined.js`)
A Node.js script to aggregate individual chapter files into "Combined Sets".
*   **Configuration:** Reads `CONFIG` object at the top of the file for input/output paths and file patterns.
*   **Mappings:** Defines how file suffixes (e.g., `00`, `02`) map to output files (e.g., `combined-set-qb.json`).
*   **Logic:** Iterates through subjects and chapters, reads files, validates JSON, adds metadata, and writes to `json/combined/`.

## 8. Data Formats

### 8.1 Question JSON Schema
See `json_schema.json` for the formal definition.
Key fields:
*   `id`: Unique identifier.
*   `questionType`: `mcq`, `msq`, etc.
*   `questionText`: HTML string.
*   `options`: Array of strings (for MCQ).
*   `correctOptions`: Array of indices (MCQ) or values.
*   `explanation`: HTML string.
*   `tags`: Array of semantic tags (e.g., `#AREA1`).

## 9. Future Development Guide

*   **Adding a Question Type:**
    1.  Update `QuestionRenderer` in `assets/js/ui/question_renderer.js` to handle the DOM.
    2.  Update `Scoring` in `assets/js/engine/scoring.js` (if logic differs).
    3.  Update `json_schema.json`.
*   **Adding an Admin View:**
    1.  Add the view definition to `assets/js/config.js` under `platform.admin.views`.
    2.  Implement the rendering logic in `assets/js/admin/dashboard.js` (referenced by `id`).
*   **Customizing the Build:**
    1.  Edit `scripts/generate_combined.js` to change file patterns or set definitions.
