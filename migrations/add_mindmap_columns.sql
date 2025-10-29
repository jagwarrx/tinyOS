-- Migration: Add mindmap columns to notes table
-- This enables storing mindmap markdown source and rendered SVG

-- Add mindmap_markdown column to store the markdown source
ALTER TABLE notes ADD COLUMN IF NOT EXISTS mindmap_markdown TEXT;

-- Add mindmap_svg column to store the rendered SVG for previews
ALTER TABLE notes ADD COLUMN IF NOT EXISTS mindmap_svg TEXT;

-- Comment the columns
COMMENT ON COLUMN notes.mindmap_markdown IS 'Markdown source for mindmap notes (note_type = mindmap)';
COMMENT ON COLUMN notes.mindmap_svg IS 'Rendered SVG output for mindmap previews';
