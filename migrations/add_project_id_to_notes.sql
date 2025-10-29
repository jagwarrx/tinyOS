-- Migration: Add project_id column to notes table
-- This allows notes to be linked to projects (e.g., mindmaps, diagrams, documents for a project)

-- Add project_id column to notes table
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.notes(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_project_id ON public.notes(project_id);

-- Helpful comment
COMMENT ON COLUMN public.notes.project_id IS 'Links this note to a project note (for project assets like mindmaps, diagrams, documents)';
