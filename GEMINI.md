# Chiaseed Quiz Platform Context (v1.1.0)

This file provides specific context for the `chiaseed` open-source project.

## Project Overview
**Chiaseed** is a lightweight, client-side quiz platform. It is the public, open-source version of the "CF-Update" production engine.

## v1.1.0 Updates
- **Reordered Flow**: User selects Set before Chapter.
- **Setup Utility**: Added `setup.py` for automated placeholder replacement.
- **Dynamic Logic**: Removed donation popups and hardcoded production subjects.
- **Safety**: Integrated `promptExit` for navigation protection.

## Development Guidelines
1.  **Generic Default**: Keep `config.js` pointing to `your-domain.com`. Users will use `setup.py` or the Settings UI to change these.
2.  **JSON Structure**: Always follow the schema in `json_schema.json`.
3.  **Modular JS**: Use native ES Modules only. No build tools (Webpack/Vite) should be required for the frontend.