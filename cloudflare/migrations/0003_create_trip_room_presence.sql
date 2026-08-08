CREATE TABLE IF NOT EXISTS trip_room_presence (
  room_code TEXT NOT NULL,
  member_id TEXT NOT NULL CHECK (length(member_id) BETWEEN 8 AND 100),
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80),
  day_index INTEGER NOT NULL CHECK (day_index >= 0),
  stop_index INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (room_code, member_id),
  FOREIGN KEY (room_code) REFERENCES trip_rooms(code) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS trip_room_presence_room_idx
  ON trip_room_presence (room_code, updated_at);
