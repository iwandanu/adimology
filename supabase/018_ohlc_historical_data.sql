-- Historical OHLC Data Storage
-- Stores daily OHLC (Open, High, Low, Close, Volume) data for stocks
-- This eliminates API dependencies and provides consistent, fast data access

CREATE TABLE IF NOT EXISTS ohlc_historical_data (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume BIGINT,
  
  -- Additional useful fields
  source TEXT DEFAULT 'datasaham', -- datasaham, yahoo, manual
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate data
  UNIQUE(symbol, date)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ohlc_symbol ON ohlc_historical_data(symbol);
CREATE INDEX IF NOT EXISTS idx_ohlc_date ON ohlc_historical_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_ohlc_symbol_date ON ohlc_historical_data(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_ohlc_updated_at ON ohlc_historical_data(updated_at DESC);

-- Comments
COMMENT ON TABLE ohlc_historical_data IS 'Historical OHLC data for stock screening and analysis';
COMMENT ON COLUMN ohlc_historical_data.symbol IS 'Stock symbol without .JK suffix (e.g., TLKM)';
COMMENT ON COLUMN ohlc_historical_data.date IS 'Trading date';
COMMENT ON COLUMN ohlc_historical_data.source IS 'Data source: datasaham, yahoo, or manual';
COMMENT ON COLUMN ohlc_historical_data.updated_at IS 'Last time this record was updated';

-- Function to get latest N days of data for a symbol
CREATE OR REPLACE FUNCTION get_ohlc_data(
  p_symbol TEXT,
  p_days INTEGER DEFAULT 252
)
RETURNS TABLE (
  date DATE,
  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  close NUMERIC,
  volume BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.date,
    h.open,
    h.high,
    h.low,
    h.close,
    h.volume
  FROM ohlc_historical_data h
  WHERE h.symbol = UPPER(p_symbol)
  ORDER BY h.date DESC
  LIMIT p_days;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get data for multiple symbols
CREATE OR REPLACE FUNCTION get_ohlc_data_bulk(
  p_symbols TEXT[],
  p_days INTEGER DEFAULT 252
)
RETURNS TABLE (
  symbol TEXT,
  date DATE,
  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  close NUMERIC,
  volume BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.symbol,
    h.date,
    h.open,
    h.high,
    h.low,
    h.close,
    h.volume
  FROM ohlc_historical_data h
  WHERE h.symbol = ANY(p_symbols)
    AND h.date >= (CURRENT_DATE - (p_days || ' days')::INTERVAL)
  ORDER BY h.symbol, h.date DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check data freshness
CREATE OR REPLACE FUNCTION check_ohlc_freshness(
  p_symbol TEXT
)
RETURNS TABLE (
  symbol TEXT,
  latest_date DATE,
  days_old INTEGER,
  needs_update BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_symbol::TEXT,
    MAX(h.date) as latest_date,
    (CURRENT_DATE - MAX(h.date))::INTEGER as days_old,
    (CURRENT_DATE - MAX(h.date)) > 1 as needs_update
  FROM ohlc_historical_data h
  WHERE h.symbol = UPPER(p_symbol);
END;
$$ LANGUAGE plpgsql STABLE;

-- View for data statistics
CREATE OR REPLACE VIEW ohlc_data_stats AS
SELECT 
  symbol,
  COUNT(*) as total_records,
  MIN(date) as earliest_date,
  MAX(date) as latest_date,
  (CURRENT_DATE - MAX(date))::INTEGER as days_since_update,
  CASE 
    WHEN (CURRENT_DATE - MAX(date)) <= 1 THEN 'fresh'
    WHEN (CURRENT_DATE - MAX(date)) <= 7 THEN 'slightly_stale'
    ELSE 'stale'
  END as data_status
FROM ohlc_historical_data
GROUP BY symbol
ORDER BY symbol;

COMMENT ON VIEW ohlc_data_stats IS 'Summary statistics of OHLC data coverage per symbol';
