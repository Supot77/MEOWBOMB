CREATE TABLE IF NOT EXISTS meowbomb.creation_limits (
 key TEXT PRIMARY KEY,
 count INTEGER NOT NULL,
 reset_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS creation_limits_reset_idx ON meowbomb.creation_limits(reset_at);
