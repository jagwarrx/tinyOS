-- Connect Scheduled page to Today's left
-- First, find the IDs
DO $$
DECLARE
  today_id UUID;
  scheduled_id UUID;
BEGIN
  -- Get Today note ID
  SELECT id INTO today_id FROM notes WHERE title = 'Today' LIMIT 1;
  
  -- Get Scheduled note ID
  SELECT id INTO scheduled_id FROM notes WHERE title = 'Scheduled' LIMIT 1;
  
  IF today_id IS NOT NULL AND scheduled_id IS NOT NULL THEN
    -- Set Scheduled's left to Today
    UPDATE notes SET left_id = today_id WHERE id = scheduled_id;
    
    -- Set Today's right to Scheduled
    UPDATE notes SET right_id = scheduled_id WHERE id = today_id;
    
    RAISE NOTICE 'Connected Scheduled to Today (left link)';
  ELSE
    RAISE NOTICE 'Could not find Today or Scheduled notes';
  END IF;
END $$;


