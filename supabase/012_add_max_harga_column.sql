-- Migration: Add max_harga column to stock_queries table
-- Source: data.result.high from Stockbit historical/summary API
ALTER TABLE stock_queries ADD COLUMN IF NOT EXISTS max_harga NUMERIC;
