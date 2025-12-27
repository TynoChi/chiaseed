-- Create GenAIUsage table to track token usage and cost
CREATE TABLE IF NOT EXISTS GenAIUsage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    model TEXT NOT NULL,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0.0,
    endpoint TEXT, -- '/generate' or '/explain'
    timestamp INTEGER,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);
