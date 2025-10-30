-- Fix parent_ids trigger issue
-- This script will help you identify and remove the problematic trigger

-- Step 1: List all triggers on the notes table
SELECT
  tgname AS trigger_name,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'notes'::regclass
  AND tgisinternal = false;

-- Step 2: Drop any triggers that reference parent_ids
-- Uncomment and run the appropriate DROP TRIGGER command after identifying it from Step 1

-- Example (replace 'trigger_name_here' with actual trigger name):
-- DROP TRIGGER IF EXISTS trigger_name_here ON notes;

-- Step 3: Also check for any functions that reference parent_ids
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%parent_ids%';

-- Step 4: If you find a function, drop it (replace 'function_name_here' with actual name):
-- DROP FUNCTION IF EXISTS function_name_here CASCADE;
