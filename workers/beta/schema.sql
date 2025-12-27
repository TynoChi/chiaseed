-- schema.sql
-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    id TEXT PRIMARY KEY,           
    name TEXT,                     
    first_visit_at INTEGER NOT NULL, 
    last_visit_at INTEGER NOT NULL,  
    visit_count INTEGER NOT NULL DEFAULT 1 
);

-- QuizAttempts Table (Updated with tags and platform_mode)
CREATE TABLE IF NOT EXISTS QuizAttempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    user_id TEXT NOT NULL,                 
    question_id TEXT NOT NULL,             
    is_correct INTEGER NOT NULL,           
    attempted_at INTEGER NOT NULL,         
    chapter TEXT NOT NULL,                 
    set_name TEXT NOT NULL,                
    tags TEXT,                             -- Comma-separated tags
    platform_mode TEXT,                    -- e.g., 'study', 'dam', 'chiaseed'
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Leaderboard Table
CREATE TABLE IF NOT EXISTS Leaderboard (
    user_id TEXT PRIMARY KEY,      
    total_correct INTEGER NOT NULL DEFAULT 0,
    total_attempted INTEGER NOT NULL DEFAULT 0,
    last_quiz_score INTEGER NOT NULL DEFAULT 0, 
    last_quiz_total_questions INTEGER NOT NULL DEFAULT 0, 
    total_time_taken_ms INTEGER NOT NULL DEFAULT 0, 
    average_score_percent REAL NOT NULL DEFAULT 0.0,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- GenAIUsage Table
CREATE TABLE IF NOT EXISTS GenAIUsage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    model TEXT NOT NULL,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0.0,
    endpoint TEXT,
    timestamp INTEGER,
    request_payload TEXT,
    response_payload TEXT
);