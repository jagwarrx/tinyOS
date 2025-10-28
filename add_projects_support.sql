-- Migration: Add Projects Support to Notes
-- Projects are special notes with note_type='project' or 'project_list'
-- The existing task.project_id already references notes.id, so no changes needed there

-- =============================================
-- PART 1: Add project-specific columns
-- =============================================

-- Project status - track project lifecycle
-- Values: 'ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED'
ALTER TABLE notes ADD COLUMN IF NOT EXISTS project_status TEXT;

-- Project start date - when the project begins
-- Format: 'YYYY-MM-DD' or text like 'Q1 2025'
ALTER TABLE notes ADD COLUMN IF NOT EXISTS project_start_date TEXT;

-- Project due date - project deadline
-- Format: 'YYYY-MM-DD' or text like 'Q2 2025'
ALTER TABLE notes ADD COLUMN IF NOT EXISTS project_due_date TEXT;

-- Project context - high-level description of goals/purpose
-- Similar to task.context but for the entire project
ALTER TABLE notes ADD COLUMN IF NOT EXISTS project_context TEXT;

-- Add indices for better performance
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON notes(note_type);
CREATE INDEX IF NOT EXISTS idx_notes_project_status ON notes(project_status);

-- =============================================
-- PART 2: Helper queries for project management
-- =============================================

-- Get all project notes
-- SELECT * FROM notes WHERE note_type = 'project' ORDER BY created_at DESC;

-- Get the Projects list page
-- SELECT * FROM notes WHERE note_type = 'project_list' LIMIT 1;

-- Get all tasks for a specific project
-- SELECT t.* FROM tasks t
-- WHERE t.project_id = 'PROJECT_NOTE_ID'
-- ORDER BY t.priority ASC;

-- Get project with task counts
-- SELECT
--   n.id,
--   n.ref_id,
--   n.title,
--   n.project_status,
--   n.project_due_date,
--   n.created_at,
--   COUNT(t.id) as total_tasks,
--   COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) as completed_tasks,
--   COUNT(CASE WHEN t.status != 'DONE' AND t.status != 'CANCELLED' THEN 1 END) as active_tasks
-- FROM notes n
-- LEFT JOIN tasks t ON t.project_id = n.id
-- WHERE n.note_type = 'project'
-- GROUP BY n.id
-- ORDER BY n.created_at DESC;

-- =============================================
-- VERIFICATION
-- =============================================

-- Check that columns were added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'notes'
  AND column_name IN ('project_status', 'project_start_date', 'project_due_date', 'project_context', 'note_type')
ORDER BY column_name;

-- Summary
-- After running this migration, each project note will have:
--
-- EXISTING FIELDS (already in notes table):
-- - title: Project name
-- - content: Detailed project notes (Lexical editor rich content)
-- - note_type: Set to 'project' for individual projects, 'project_list' for list page
-- - ref_id: Reference ID for linking (e.g., 'p3x7k9')
-- - created_at, updated_at: Timestamps
-- - left_id: Points back to Projects list page
--
-- NEW FIELDS (added by this migration):
-- - project_status: 'ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED'
-- - project_start_date: When project begins ('YYYY-MM-DD' or 'Q1 2025')
-- - project_due_date: Project deadline ('YYYY-MM-DD' or 'Q2 2025')
-- - project_context: High-level goals/purpose (text field)
--
-- RELATIONSHIPS:
-- - Tasks linked via: task.project_id → notes.id (already works!)
--
-- EXAMPLE PROJECT NOTE:
-- {
--   id: 'abc-123',
--   title: 'Website Redesign',
--   note_type: 'project',
--   project_status: 'ACTIVE',
--   project_start_date: '2025-01-15',
--   project_due_date: '2025-03-30',
--   project_context: 'Modernize UI, improve conversion rate, mobile-first design',
--   content: '{...}', // Rich Lexical content for detailed notes
--   left_id: 'projects-page-id',
--   ref_id: 'p5m8x3'
-- }
