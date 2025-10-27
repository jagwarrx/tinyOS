-- Migration: Add reference IDs to notes and tasks tables
-- Reference ID format: [lowercase letter][number][4 random alphanumeric chars]
-- Example: a3x7k9, b5m2n8, z9abc7

-- =============================================
-- PART 1: Create the reference ID generator function
-- =============================================

-- Function to generate a random alphanumeric reference ID
CREATE OR REPLACE FUNCTION generate_reference_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  lowercase_letters text := 'abcdefghijklmnopqrstuvwxyz';
  numbers text := '0123456789';
  alphanumeric text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  ref_id text;
  first_char text;
  second_char text;
  remaining_chars text;
  i integer;
BEGIN
  -- First character: random lowercase letter
  first_char := substring(lowercase_letters, floor(random() * 26 + 1)::int, 1);

  -- Second character: random number
  second_char := substring(numbers, floor(random() * 10 + 1)::int, 1);

  -- Next 4 characters: random alphanumeric
  remaining_chars := '';
  FOR i IN 1..4 LOOP
    remaining_chars := remaining_chars || substring(alphanumeric, floor(random() * 36 + 1)::int, 1);
  END LOOP;

  -- Combine all parts
  ref_id := first_char || second_char || remaining_chars;

  RETURN ref_id;
END;
$$;

-- =============================================
-- PART 2: Add reference ID column to notes table
-- =============================================

-- Add ref_id column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ref_id text UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notes_ref_id ON notes(ref_id);

-- Generate reference IDs for existing notes
UPDATE notes
SET ref_id = generate_reference_id()
WHERE ref_id IS NULL;

-- Make ref_id NOT NULL after populating existing rows
ALTER TABLE notes ALTER COLUMN ref_id SET NOT NULL;

-- Add default value for new rows
ALTER TABLE notes ALTER COLUMN ref_id SET DEFAULT generate_reference_id();

-- =============================================
-- PART 3: Add reference ID column to tasks table
-- =============================================

-- Add ref_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ref_id text UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_ref_id ON tasks(ref_id);

-- Generate reference IDs for existing tasks
UPDATE tasks
SET ref_id = generate_reference_id()
WHERE ref_id IS NULL;

-- Make ref_id NOT NULL after populating existing rows
ALTER TABLE tasks ALTER COLUMN ref_id SET NOT NULL;

-- Add default value for new rows
ALTER TABLE tasks ALTER COLUMN ref_id SET DEFAULT generate_reference_id();

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check notes reference IDs
SELECT id, ref_id, title, created_at
FROM notes
ORDER BY created_at DESC
LIMIT 10;

-- Check tasks reference IDs
SELECT id, ref_id, text, status, created_at
FROM tasks
ORDER BY created_at DESC
LIMIT 10;

-- Verify uniqueness and format
SELECT
  'notes' as table_name,
  COUNT(*) as total_count,
  COUNT(DISTINCT ref_id) as unique_ref_ids,
  COUNT(CASE WHEN ref_id ~ '^[a-z][0-9][a-z0-9]{4}$' THEN 1 END) as valid_format_count
FROM notes
UNION ALL
SELECT
  'tasks' as table_name,
  COUNT(*) as total_count,
  COUNT(DISTINCT ref_id) as unique_ref_ids,
  COUNT(CASE WHEN ref_id ~ '^[a-z][0-9][a-z0-9]{4}$' THEN 1 END) as valid_format_count
FROM tasks;

-- =============================================
-- HELPER QUERIES FOR YOUR APPLICATION
-- =============================================

-- Query note by reference ID (use this in your app)
-- Example: SELECT * FROM notes WHERE ref_id = 'a3x7k9';

-- Query task by reference ID
-- Example: SELECT * FROM tasks WHERE ref_id = 'b5m2n8';

-- Find all notes that might reference a specific ref_id in their content
-- (useful for backlinks feature)
-- Example: SELECT * FROM notes WHERE content::text LIKE '%a3x7k9%';

-- Get note with all its tasks
-- Example:
-- SELECT
--   n.id, n.ref_id as note_ref, n.title,
--   t.id as task_id, t.ref_id as task_ref, t.text, t.status
-- FROM notes n
-- LEFT JOIN tasks t ON t.project_id = n.id
-- WHERE n.ref_id = 'a3x7k9';
