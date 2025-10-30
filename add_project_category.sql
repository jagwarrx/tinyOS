-- Add project_category column to notes table
-- Values: 'personal', 'work', 'admin', or NULL for non-project notes

ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS project_category text;

-- Add check constraint to ensure valid categories
ALTER TABLE public.notes
ADD CONSTRAINT valid_project_category
CHECK (project_category IS NULL OR project_category IN ('personal', 'work', 'admin'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_notes_project_category
ON public.notes(project_category)
WHERE note_type = 'project';

-- Optional: Set default category for existing projects to 'personal'
-- Uncomment if you want to categorize existing projects
-- UPDATE public.notes
-- SET project_category = 'personal'
-- WHERE note_type = 'project' AND project_category IS NULL;
