-- Add sources column to store grounding citations from Google Search
ALTER TABLE agent_stories ADD COLUMN IF NOT EXISTS sources JSONB;

-- Comment for documentation
COMMENT ON COLUMN agent_stories.sources IS 'Array of source citations from Google Search grounding (title, uri)';
