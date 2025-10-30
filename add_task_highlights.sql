-- Add is_highlighted column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT FALSE;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_tasks_highlighted
ON tasks(is_highlighted)
WHERE is_highlighted = TRUE;

-- Add index for highlighted done tasks (common query)
CREATE INDEX IF NOT EXISTS idx_tasks_highlighted_done
ON tasks(is_highlighted, status)
WHERE is_highlighted = TRUE AND status = 'DONE';
