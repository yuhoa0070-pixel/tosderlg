CREATE TABLE IF NOT EXISTS trip_room_members (
  room_code TEXT NOT NULL,
  member_id TEXT NOT NULL CHECK (length(member_id) BETWEEN 8 AND 100),
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80),
  photo_url TEXT CHECK (photo_url IS NULL OR length(photo_url) <= 1000),
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (room_code, member_id),
  FOREIGN KEY (room_code) REFERENCES trip_rooms(code) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS trip_room_members_room_idx
  ON trip_room_members (room_code, role, joined_at);
