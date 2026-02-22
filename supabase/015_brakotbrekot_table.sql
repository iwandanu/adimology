-- Create brakotbrekot_analyses table for BrakotBrekot (SAPTA-style) analysis
CREATE TABLE IF NOT EXISTS brakotbrekot_analyses (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  emiten TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, error

  -- Result (nullable until completed)
  total_skor INTEGER,
  status_final TEXT, -- PRE-MARKUP, SIAP, WATCHLIST, ABAIKAN
  fase_saat_ini TEXT,
  pola_terdeteksi JSONB, -- string[]
  rincian_skor JSONB,
  kesimpulan_trading_plan TEXT,

  -- Error info
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_brakotbrekot_emiten ON brakotbrekot_analyses(emiten);
CREATE INDEX IF NOT EXISTS idx_brakotbrekot_status ON brakotbrekot_analyses(status);
CREATE INDEX IF NOT EXISTS idx_brakotbrekot_created_at ON brakotbrekot_analyses(created_at DESC);
