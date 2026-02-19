-- Create table for emiten flags
CREATE TABLE IF NOT EXISTS emiten_flags (
  emiten TEXT PRIMARY KEY,
  flag TEXT CHECK (flag IN ('OK', 'NG', 'Neutral')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_emiten_flags_emiten ON emiten_flags(emiten);

-- Add RLS policies if needed (assuming public access for now or existing auth)
ALTER TABLE emiten_flags ENABLE ROW LEVEL SECURITY;

-- Allow public read access (or restricted based on app needs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'emiten_flags' AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access" ON emiten_flags FOR SELECT USING (true);
    END IF;
END
$$;

-- Allow authenticated upload (adjust as needed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'emiten_flags' AND policyname = 'Allow authenticated insert/update'
    ) THEN
        CREATE POLICY "Allow authenticated insert/update" ON emiten_flags FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;
