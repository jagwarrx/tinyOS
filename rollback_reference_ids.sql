-- Rollback: Remove reference IDs from notes and tasks tables

-- Remove ref_id column from notes table
ALTER TABLE notes DROP COLUMN IF EXISTS ref_id;

-- Remove ref_id column from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS ref_id;

-- Drop the generator function
DROP FUNCTION IF EXISTS generate_reference_id();

-- Verification
SELECT 'Rollback complete' as status;
