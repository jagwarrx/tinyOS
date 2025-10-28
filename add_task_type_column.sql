-- Migration: Add task_type column to tasks table
-- This field categorizes tasks by their nature to help with prioritization and context switching

-- =============================================
-- Add task_type column to tasks
-- =============================================

-- Add task_type column with predefined types
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type TEXT;

-- Add comment for documentation
COMMENT ON COLUMN tasks.task_type IS 'Task type: DEEP_WORK, QUICK_WINS, GRUNT_WORK, PEOPLE_TIME, or STRATEGIC';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check that column was added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
  AND column_name = 'task_type';

-- View tasks with new column
SELECT
  id,
  ref_id,
  text,
  status,
  task_type,
  created_at
FROM tasks
ORDER BY created_at DESC
LIMIT 10;
