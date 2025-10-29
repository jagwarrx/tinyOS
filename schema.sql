-- Lexical Notes App - Complete Database Schema
-- This schema creates all necessary tables and functions for the application

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate unique reference IDs (format: [a-z][0-9][a-z0-9]{4})
CREATE OR REPLACE FUNCTION generate_reference_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  alpha_chars text := 'abcdefghijklmnopqrstuvwxyz';
  digit_chars text := '0123456789';
  result text := '';
  i integer;
  ref_exists boolean;
BEGIN
  LOOP
    result := '';

    -- First character: lowercase letter
    result := result || substr(alpha_chars, floor(random() * length(alpha_chars) + 1)::integer, 1);

    -- Second character: digit
    result := result || substr(digit_chars, floor(random() * length(digit_chars) + 1)::integer, 1);

    -- Remaining 4 characters: alphanumeric
    FOR i IN 1..4 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    -- Check if this ref_id already exists in notes or tasks
    SELECT EXISTS(
      SELECT 1 FROM notes WHERE ref_id = result
      UNION ALL
      SELECT 1 FROM tasks WHERE ref_id = result
    ) INTO ref_exists;

    -- If it doesn't exist, we're done
    EXIT WHEN NOT ref_exists;
  END LOOP;

  RETURN result;
END;
$$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Notes table: Stores all notes with Lexical editor content
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled'::text,
  content jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  depth_level integer DEFAULT 0,
  sequence_order integer DEFAULT 0,
  is_home boolean DEFAULT false,
  up_id uuid,
  down_id uuid,
  left_id uuid,
  right_id uuid,
  is_starred boolean DEFAULT false,
  note_type text DEFAULT 'standard'::text,
  list_metadata jsonb DEFAULT '{}'::jsonb,
  ref_id text NOT NULL DEFAULT generate_reference_id() UNIQUE,
  project_status text,
  project_start_date text,
  project_due_date text,
  project_context text,
  project_id uuid,
  CONSTRAINT notes_pkey PRIMARY KEY (id),
  CONSTRAINT notes_up_id_fkey FOREIGN KEY (up_id) REFERENCES public.notes(id) ON DELETE SET NULL,
  CONSTRAINT notes_down_id_fkey FOREIGN KEY (down_id) REFERENCES public.notes(id) ON DELETE SET NULL,
  CONSTRAINT notes_left_id_fkey FOREIGN KEY (left_id) REFERENCES public.notes(id) ON DELETE SET NULL,
  CONSTRAINT notes_right_id_fkey FOREIGN KEY (right_id) REFERENCES public.notes(id) ON DELETE SET NULL,
  CONSTRAINT notes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.notes(id) ON DELETE SET NULL
);

-- Create indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_ref_id ON public.notes(ref_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_home ON public.notes(is_home);
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON public.notes(note_type);
CREATE INDEX IF NOT EXISTS idx_notes_is_starred ON public.notes(is_starred);
CREATE INDEX IF NOT EXISTS idx_notes_project_id ON public.notes(project_id);

-- Tasks table: Stores all tasks with status, priority, and metadata
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  text text NOT NULL,
  status text NOT NULL DEFAULT 'BACKLOG'::text,
  priority integer NOT NULL DEFAULT 999,
  starred boolean DEFAULT false,
  project_id uuid,
  note_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  completed_at timestamp without time zone,
  user_id uuid,
  ref_id text NOT NULL DEFAULT generate_reference_id() UNIQUE,
  context text,
  scheduled_date text,
  work_notes text,
  task_type text,
  value integer DEFAULT 0 CHECK (value >= 0 AND value <= 5),
  urgency integer DEFAULT 0 CHECK (urgency >= 0 AND urgency <= 5),
  effort integer DEFAULT 0 CHECK (effort >= 0 AND effort <= 5),
  work_type text CHECK (work_type = ANY (ARRAY['reactive'::text, 'strategic'::text])),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.notes(id) ON DELETE SET NULL,
  CONSTRAINT tasks_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE SET NULL
);

-- Create indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_ref_id ON public.tasks(ref_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON public.tasks(scheduled_date);

-- Activity log table: Stores all user activity for logging and reminders
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_ref_id text,
  entity_title text,
  details jsonb DEFAULT '{}'::jsonb,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_log_pkey PRIMARY KEY (id)
);

-- Create indexes for activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON public.activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON public.activity_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON public.activity_log(timestamp);

-- Settings table: Stores application settings (themes, preferences, etc.)
CREATE TABLE IF NOT EXISTS public.settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (key)
);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Note: Initial data (HOME note, special pages, etc.) should be created
-- by the application on first run, not hardcoded in the schema.

-- ============================================================================
-- ROW LEVEL SECURITY (Optional - enable if using Supabase Auth)
-- ============================================================================

-- Uncomment these if you want to enable RLS:
-- ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust based on your auth setup):
-- CREATE POLICY "Enable read access for all users" ON public.notes FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for all users" ON public.notes FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Enable update for all users" ON public.notes FOR UPDATE USING (true);
-- CREATE POLICY "Enable delete for all users" ON public.notes FOR DELETE USING (true);

-- ============================================================================
-- NOTES
-- ============================================================================

-- To apply this schema:
-- 1. Run this file in your Supabase SQL editor or via psql
-- 2. The application will create initial notes (HOME, Tasks, Today, etc.) on first run
-- 3. The generate_reference_id() function is used automatically for new notes and tasks
