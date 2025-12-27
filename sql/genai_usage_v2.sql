DROP TABLE IF EXISTS GenAIUsage;

CREATE TABLE GenAIUsage (
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
    -- Removed Foreign Key constraint strict enforcement for logging flexibility, 
    -- though logically it relates to Users(id)
);
