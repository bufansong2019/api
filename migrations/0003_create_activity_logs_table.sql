-- Migration number: 0003 	 2026-05-04T20:00:00.000Z
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '成功',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
