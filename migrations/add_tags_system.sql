-- Hierarchical Tagging System Migration
-- Supports tags like "work/qbotica/projects/calvetti" with automatic hierarchy generation

-- Tags table with materialized path approach
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  full_path TEXT UNIQUE NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Junction table for task tags
CREATE TABLE IF NOT EXISTS task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (task_id, tag_id)
);

-- Junction table for note tags (for future use)
CREATE TABLE IF NOT EXISTS note_tags (
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (note_id, tag_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tags_full_path ON tags(full_path);
CREATE INDEX IF NOT EXISTS idx_tags_level ON tags(level);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER tags_updated_at_trigger
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tags_updated_at();

-- Comments
COMMENT ON TABLE tags IS 'Hierarchical tags using materialized path pattern (e.g., work/qbotica/projects/calvetti)';
COMMENT ON COLUMN tags.name IS 'Tag name without path (e.g., "calvetti")';
COMMENT ON COLUMN tags.full_path IS 'Complete hierarchical path (e.g., "work/qbotica/projects/calvetti")';
COMMENT ON COLUMN tags.level IS 'Depth level: 0 for "work", 1 for "work/qbotica", etc.';
COMMENT ON TABLE task_tags IS 'Many-to-many relationship between tasks and tags';
COMMENT ON TABLE note_tags IS 'Many-to-many relationship between notes and tags';
