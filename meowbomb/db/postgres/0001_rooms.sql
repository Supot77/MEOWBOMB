CREATE SCHEMA IF NOT EXISTS meowbomb;
CREATE TABLE IF NOT EXISTS meowbomb.rooms (
  code TEXT PRIMARY KEY,
  revision INTEGER NOT NULL,
  data TEXT NOT NULL,
  updated BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS rooms_updated_idx ON meowbomb.rooms(updated);
