-- Migration: Add context and work_notes columns to tasks table
-- These fields provide additional details for task management:
-- - context: Task background, requirements, and related information
-- - work_notes: Progress updates, blockers, learnings during execution

-- =============================================
-- Add context and work_notes columns to tasks
-- =============================================

-- Add context column (for task background and details)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context TEXT;

-- Add work_notes column (for progress updates and learnings)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN tasks.context IS 'Task context: background, requirements, and related information';
COMMENT ON COLUMN tasks.work_notes IS 'Work notes: progress updates, blockers, learnings during execution';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check that columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
  AND column_name IN ('context', 'work_notes')
ORDER BY column_name;

-- View tasks with new columns
SELECT
  id,
  ref_id,
  text,
  status,
  context,
  work_notes,
  created_at
FROM tasks
ORDER BY created_at DESC
LIMIT 5;
