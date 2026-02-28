-- Migration 017: Create Minervini Screening Results Table
-- Stores results from Minervini 8-criteria screening

CREATE TABLE IF NOT EXISTS minervini_screening_results (
  id BIGSERIAL PRIMARY KEY,
  emiten TEXT NOT NULL,
  sector TEXT,
  price NUMERIC,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 8),
  rs NUMERIC, -- Relative Strength vs Sector
  week_52_high NUMERIC,
  week_52_low NUMERIC,
  ma50 NUMERIC,
  ma150 NUMERIC,
  ma200 NUMERIC,
  -- Individual criteria flags
  c1 BOOLEAN DEFAULT FALSE, -- Price > MA150 & MA200
  c2 BOOLEAN DEFAULT FALSE, -- MA150 > MA200
  c3 BOOLEAN DEFAULT FALSE, -- MA200 trending up
  c4 BOOLEAN DEFAULT FALSE, -- MA50 > MA150 & MA200
  c5 BOOLEAN DEFAULT FALSE, -- Price > MA50
  c6 BOOLEAN DEFAULT FALSE, -- Price > 30% from 52W low
  c7 BOOLEAN DEFAULT FALSE, -- Price within 25% of 52W high
  c8 BOOLEAN DEFAULT FALSE, -- RS > 70
  -- Metadata
  universe TEXT, -- lq45, idx80, liquid, etc
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_minervini_emiten_scanned 
  ON minervini_screening_results(emiten, scanned_at DESC);

CREATE INDEX IF NOT EXISTS idx_minervini_score 
  ON minervini_screening_results(score DESC, rs DESC);

CREATE INDEX IF NOT EXISTS idx_minervini_sector_score 
  ON minervini_screening_results(sector, score DESC);

CREATE INDEX IF NOT EXISTS idx_minervini_scanned_at 
  ON minervini_screening_results(scanned_at DESC);

-- Add comment
COMMENT ON TABLE minervini_screening_results IS 'Stores Mark Minervini 8-criteria screening results with sector-relative RS calculation';
