-- Feature flags table for gating menus / expensive API usage
-- Stores simple boolean toggles by key.

CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed defaults (idempotent)
INSERT INTO feature_flags (key, enabled)
VALUES
  ('menu_search_history', TRUE),
  ('menu_performance', TRUE),
  ('menu_screener', TRUE),
  ('menu_minervini_screener', TRUE),
  ('menu_retail_opportunity', TRUE),
  ('menu_advanced_analytics', TRUE),
  ('api_screen', TRUE),
  ('api_advanced_analytics', TRUE),
  ('api_retail_opportunity', TRUE)
ON CONFLICT (key) DO NOTHING;

