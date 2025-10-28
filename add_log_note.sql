-- Add Log special note for activity log viewing

-- First, check if a Log note already exists
DO $$
DECLARE
  log_note_count integer;
BEGIN
  SELECT COUNT(*) INTO log_note_count
  FROM notes
  WHERE note_type = 'log_list' AND title = 'Log';

  -- Only create if it doesn't exist
  IF log_note_count = 0 THEN
    INSERT INTO notes (
      title,
      content,
      note_type,
      is_home,
      is_starred,
      created_at,
      updated_at
    ) VALUES (
      'Log',
      '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}',
      'log_list',
      false,
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Log note created successfully';
  ELSE
    RAISE NOTICE 'Log note already exists, skipping creation';
  END IF;
END $$;
