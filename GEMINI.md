# Chiaseed Quiz Platform Context (v1.1.0)

This file provides specific context for the `chiaseed` open-source project.

## Project Overview
**Chiaseed** is a lightweight, client-side quiz platform. It is the public, open-source version of the "CF-Update" production engine.

## v1.1.0 Updates (Major)
- **Unified Admin Interface**: Ported the modular admin dashboard from the production environment (`cf-update` v2.4.7).
- **Advanced Analytics**:
    - **Visualizer**: Integrated Chart.js for interactive performance graphing.
    - **Weakness Analysis**: Added semantic clustering analysis to identify student knowledge gaps.
- **Architecture**:
    - Refactored `admin.html` to use ES modules (`assets/js/admin/dashboard.js`).
    - Added `assets/css/admin.css` for modern glassmorphism styling.
- **Config-Driven**: Retained the generic configuration structure (`assets/js/config.js`) for easy open-source adoption.

## Previous Updates
- **v1.1.0**: Reordered flow (Set -> Chapter), Setup Utility (`setup.py`), removal of hardcoded production logic.

## Development Guidelines
1.  **Generic Default**: Keep `config.js` pointing to placeholders. Users will use `setup.py` or manual editing.
2.  **JSON Structure**: Always follow the schema in `json_schema.json`.
3.  **Modular JS**: Use native ES Modules only.
4.  **Admin Features**: The admin panel gracefully handles missing backend data (e.g., "No Data" states for visualizers) since open-source users may run without a server.
