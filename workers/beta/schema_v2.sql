-- Schema V2: Consolidated and Validated
-- Use _v2 suffix to coexist with legacy tables

CREATE TABLE IF NOT EXISTS Users_v2 (
    id TEXT PRIMARY KEY,
    name TEXT,
    created_at INTEGER NOT NULL,
    last_active_at INTEGER NOT NULL,
    metadata TEXT -- JSON for extra info like platform, device
);

-- Sessions_v2: Track every quiz completion to reconstruct stats if needed
CREATE TABLE IF NOT EXISTS Sessions_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken_ms INTEGER NOT NULL,
    timestamp INTEGER NOT NULL,
    mode TEXT, -- 'study', 'exam', 'instant'
    tags TEXT,
    FOREIGN KEY (user_id) REFERENCES Users_v2(id) ON DELETE CASCADE
);

-- Attempts_v2: Detailed question logs
CREATE TABLE IF NOT EXISTS Attempts_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER, -- Optional link to a session
    user_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
    timestamp INTEGER NOT NULL,
    user_answer TEXT, -- JSON string of the answer
    FOREIGN KEY (user_id) REFERENCES Users_v2(id) ON DELETE CASCADE
);

-- Leaderboard_v2: Aggregated Stats (Validated)
CREATE TABLE IF NOT EXISTS Leaderboard_v2 (
    user_id TEXT PRIMARY KEY,
    total_correct INTEGER NOT NULL DEFAULT 0,
    total_attempted INTEGER NOT NULL DEFAULT 0,
    total_sessions INTEGER NOT NULL DEFAULT 0,
    total_time_ms INTEGER NOT NULL DEFAULT 0,
    average_accuracy REAL GENERATED ALWAYS AS (
        CASE WHEN total_attempted = 0 THEN 0 
        ELSE (CAST(total_correct AS REAL) / total_attempted) * 100 
        END
    ) VIRTUAL,
    FOREIGN KEY (user_id) REFERENCES Users_v2(id) ON DELETE CASCADE
);
