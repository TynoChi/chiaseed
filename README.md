# ChiaSeed Platform v1.0.0

A comprehensive suite of tools for generating, practicing, and analyzing accountancy exams. This project includes a client-side quiz application, a high-fidelity exam simulator, and serverless backend workers for AI generation and data tracking.

**Note:** This is the open-source release of the platform logic. Proprietary question banks and PDF materials have been excluded.

## 🚀 Quick Start

### Local Development
1.  **Prerequisites:** Python (for simple serving) or any static file server.
2.  **Run:**
    ```bash
    ./run.sh
    # OR
    python -m http.server 8080
    ```
3.  **Access:** Open `http://localhost:8080` in your browser.

---

## 📂 Project Structure

### 1. Main Quiz App (`/`)
*   **`index.html`**: The core application. It integrates three primary modes:
    *   **Study Mode:** Practice specific chapters (requires your own JSON data).
    *   **DAM Mode:** "Daily Assessment Mode" for customizable random sets.
    *   **ChiaSeed (Weakness) Mode:** A focused practice tool that lets you select specific topics and concepts to target your weak areas.
*   **Features:**
    *   **Integrated Statistics:** Real-time leaderboard and personal progress tracking.
    *   **AI Explanation:** Instant detailed explanations for every question using DeepSeek models (requires backend setup).
    *   **Fix Weak Spots:** Automatically redirects from results to practice the specific topics you missed.

### 2. Admin Dashboard (`/admin.html`)
A powerful tool for monitoring student progress and system health.
*   **Progress Map:** Visualizes student performance across chapters.
*   **Drill-Down:** Inspect specific question attempts to see user answers, timestamps, platform mode, and tags.
*   **GenAI Audit:** Monitor AI token usage and costs.

### 3. Exam Simulator (`/cs/`)
A "Pro" version of the exam interface designed to mimic the actual exam software.
*   **Features:** Excel-style grids, Rich Text Editors, PDF Export, and multiple versioned converters.
*   **Location:** `cs/index.html`

### 4. Backend Workers (`/workers/`)
*   **Alpha (`api-x-gen`):** Handles AI explanations and question generation.
    *   *Note: The `/generate` endpoint logic exists in `handleQuizGeneration`.*
*   **Beta (`api-x-data`):** Handles user tracking, D1 database storage (Users, QuizAttempts, Leaderboard), and admin APIs.
*   **Pact:** A utility worker for internal testing or specific mini-apps.

### 5. Assets & Data
*   **`assets/js/`**: Modular ES6 JavaScript structure.
*   **`json_schema.json`**: The schema definition for creating your own compatible question banks.

### 6. Scripts (`/scripts/`)
Maintenance and data processing tools:
*   `generate_combined.js`: Merges chapter JSONs into combined sets.
*   `update_answers_v2.py`: Batch updates question answers in JSON files.
*   `update_tags_v2.py`: Standardizes tags across the question bank.
*   `increment_version.sh`: Helper for versioning deployments.

---

## 📚 Documentation

*   **[Codebase Overview](docs/CODEBASE_OVERVIEW.md):** A high-level dictionary of all files and their purposes.
*   **[Function Reference](docs/FUNCTION_REFERENCE.md):** Detailed breakdown of key functions in the Frontend and Backend logic.

---

## ⚖️ License & Copyright

This platform logic is open-source under the **GNU Alfredo License**. 

**Important:** This repository does NOT include any Question Bank data, JSON material, or PDF resources, as those are copyrighted materials. Users must provide their own data structures following the `json_schema.json` format.