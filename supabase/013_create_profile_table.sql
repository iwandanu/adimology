-- Migration: Create profile table for user preferences (key-value store)
-- First setting: history_row_count (default 5)
CREATE TABLE IF NOT EXISTS profile (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO profile (key, value) VALUES ('history_row_count', '5')
ON CONFLICT (key) DO NOTHING;
