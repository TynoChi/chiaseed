# Chiaseed Quiz Platform v1.1.0

A lightweight, customizable, and open-source quiz platform designed for accountancy exams and similar question-bank-based learning.

## 🚀 Quick Start

1.  **Run the Setup Utility:**
    ```bash
    python3 setup.py
    ```
    This will help you configure your Platform Name and API endpoints without manually editing code.

2.  **Serve the application:**
    *   **Using Python:** `python3 -m http.server 8080`
    *   **Using Node.js:** `npx http-server .`

3.  **Open in Browser:** Navigate to `http://localhost:8080`.

---

## 📖 Configuration

The platform is settings-driven. While defaults are in `assets/js/config.js`, users can override them via the in-app Settings UI.

### Selection Flow (v1.1.0)
The selection logic has been optimized for user flow:
1.  **Select Set**: Choose between Question Bank, AI, or custom sets.
2.  **Select Chapter**: The chapter list dynamically updates based on the selected set.

### Endpoints
*   **Static**: Where your JSON files are hosted.
*   **GenAI**: Your Cloudflare Worker for AI explanations.
*   **Data**: Your Cloudflare Worker for tracking and leaderboards.

---

## 🛠️ Setup Utility

To avoid manual code editing, use the included `setup.py` script. This interactive tool will automatically update your `config.js` with:
*   **Custom Branding**: Change the Platform Name.
*   **API Integration**: Set your GenAI and Data tracking endpoints.

**Usage:**
```bash
python3 setup.py
```

---

## 🛠️ Tools & Scripts

*   **`setup.py`**: Interactive CLI tool to configure your platform.
*   **`scripts/generate_combined.js`**: Merges individual chapter files into combined sets for faster loading.
*   **`editor/`**: A standalone tool included in this folder to create and edit your question JSONs.

---

## 📂 Directory Structure

*   **`assets/js/`**: Core application logic.
    *   `settings_manager.js`: **Central configuration hub.**
*   **`json/`**: Place your question bank JSON files here.
*   **`workers/`**: Cloudflare Worker source code.
*   **`docs/`**: Detailed technical documentation.
