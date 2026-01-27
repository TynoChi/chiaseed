# Chiaseed Quiz Platform v1.1.2

A modern, lightweight, and customizable open-source quiz platform designed for accountancy exams and similar question-bank-based learning.

## 🚀 Features

- **Modern Tech Stack**: Powered by **Vite** and **Tailwind CSS v4** for high performance and modern styling.
- **Dynamic Logic**: Selection-first flow (Set -> Chapter) with dynamic content loading.
- **Multiple Practice Modes**:
  - **Study Mode**: Target specific chapters.
  - **Question Bank (DAM)**: Standardized random exam practice.
  - **Tags/Weakness Mode**: Focus on specific semantic topics and concepts.
- **AI Integration**: Support for AI-generated explanations via Cloudflare Workers.
- **Analytics**: Integrated leaderboard and personal progress tracking.

## 🛠️ Quick Start

### 1. Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher

### 2. Installation
```bash
npm install
```

### 3. Development
```bash
./run.sh
# OR
npm run dev
```
Open `http://localhost:8080` to view the platform.

### 4. Build for Production
```bash
npm run build
```
The optimized files will be generated in the `dist/` directory.

## 📂 Project Structure

- **`assets/js/`**: Core ESM modules for the application.
  - `config.js`: Default configuration and subject data.
  - `settings_manager.js`: **Central hub** for active configuration.
- **`json/`**: Question bank JSON files (managed via individual and combined sets).
- **`workers/`**: Cloudflare Workers for AI (`alpha`) and Data persistence (`beta`).
- **`editor/`**: Integrated tool for creating and editing question JSONs.

## ☁️ Deployment

### Cloudflare Pages (Frontend)
1. Connect your repository to Cloudflare Pages.
2. Set Build Command: `npm run build`
3. Set Build Output: `dist`

### Cloudflare Workers (Backend)
1. Deploy `alpha` and `beta` workers using `wrangler`.
2. Configure `OPENROUTER_API_KEY` as a secret for the `alpha` worker.
3. Initialize the Cloudflare D1 database for the `beta` worker using the provided SQL schemas.

---
Developed by Tyno Chi & code002xcode016.