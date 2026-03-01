-- Fix volume column type - change from BIGINT to NUMERIC
-- Some APIs return volume as decimal (e.g., 8314682.5)

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_ohlc_data(TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_ohlc_data_bulk(TEXT[], INTEGER);

-- Change column type
ALTER TABLE ohlc_historical_data 
  ALTER COLUMN volume TYPE NUMERIC USING volume::NUMERIC;

-- Recreate functions with NUMERIC volume type
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
  volume NUMERIC
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
  volume NUMERIC
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

COMMENT ON COLUMN ohlc_historical_data.volume IS 'Trading volume (can be decimal from some APIs)';
