CREATE TABLE IF NOT EXISTS trip_rooms (
  code TEXT PRIMARY KEY CHECK (length(code) = 6),
  owner_token TEXT NOT NULL,
  shared_by TEXT NOT NULL,
  trip_json TEXT NOT NULL CHECK (json_valid(trip_json)),
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS trip_rooms_expires_at_idx
  ON trip_rooms (expires_at);
