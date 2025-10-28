-- Migration: Change scheduled_date from date to text
-- This allows special values like 'SOMEDAY' and 'THIS_WEEK' in addition to actual dates

-- =============================================
-- Change scheduled_date column type to TEXT
-- =============================================

-- Step 1: Alter the column type from DATE to TEXT
ALTER TABLE tasks ALTER COLUMN scheduled_date TYPE text USING scheduled_date::text;

-- =============================================
-- Notes:
-- =============================================
-- - scheduled_date now accepts any text value
-- - Use YYYY-MM-DD format for actual dates (e.g., '2024-01-15')
-- - Special values:
--   - 'SOMEDAY': Task is deferred indefinitely (shows in Someday/Maybe page)
--   - 'THIS_WEEK': Task is scheduled for this week (shows in Week page)
--   - NULL: Task is not scheduled (shows in Tasks page only)
-- - Existing date values will be preserved as text in YYYY-MM-DD format
--
-- Examples:
-- UPDATE tasks SET scheduled_date = 'SOMEDAY' WHERE id = 'task-id';
-- UPDATE tasks SET scheduled_date = '2024-01-15' WHERE id = 'task-id';
-- UPDATE tasks SET scheduled_date = 'THIS_WEEK' WHERE id = 'task-id';
-- UPDATE tasks SET scheduled_date = NULL WHERE id = 'task-id';
