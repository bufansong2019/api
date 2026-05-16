-- Migration number: 0004 	 2026-05-16T00:00:00.000Z
CREATE TABLE IF NOT EXISTS request_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    date TEXT NOT NULL,
    path TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    UNIQUE(date, path)
);

CREATE INDEX IF NOT EXISTS idx_request_stats_date ON request_stats(date);
