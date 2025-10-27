-- Migration: Add scheduled_date to tasks table
-- This allows tasks to be scheduled for specific days
-- Tasks scheduled for today will automatically appear in the Today view

-- =============================================
-- Add scheduled_date column to tasks table
-- =============================================

-- Add scheduled_date column (nullable, defaults to NULL)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_date date;

-- Create index for faster lookups by scheduled date
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);

-- Example: Update existing tasks to have a scheduled date
-- UPDATE tasks SET scheduled_date = CURRENT_DATE WHERE id = 'some-task-id';

-- =============================================
-- Notes:
-- =============================================
-- - scheduled_date is stored as a DATE type (YYYY-MM-DD)
-- - NULL means the task is not scheduled for a specific day
-- - When a task has scheduled_date = CURRENT_DATE, it shows up in Today
-- - When status changes to PLANNED, you should set a scheduled_date
-- - starred field already exists in the tasks table for Today functionality
--
-- =============================================
-- OVERDUE Status (Auto-set):
-- =============================================
-- - Tasks with scheduled_date in the past are automatically set to OVERDUE status
-- - This happens when fetchTasksForView is called (on page load or view change)
-- - OVERDUE status is NOT manually selectable in the UI
-- - Only tasks with status NOT IN (DONE, CANCELLED, OVERDUE) are checked
-- - Once marked OVERDUE, tasks can be manually changed to any other status
-- - OVERDUE tasks display with red color, bold text, and an alert circle icon
