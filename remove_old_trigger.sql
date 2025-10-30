-- Remove the old cleanup_links_on_delete trigger that references parent_ids
-- This trigger is no longer needed because the database schema already has
-- ON DELETE SET NULL constraints for all foreign keys (up_id, down_id, left_id, right_id)

-- Step 1: Drop the trigger
DROP TRIGGER IF EXISTS cleanup_links_on_delete ON notes;

-- Step 2: Drop the associated function
DROP FUNCTION IF EXISTS cleanup_note_links() CASCADE;

-- Verify the trigger is gone
SELECT
  tgname AS trigger_name,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'notes'::regclass
  AND tgisinternal = false;
