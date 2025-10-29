-- Migration: Add diagram support to notes table
-- Date: 2025-10-29
--
-- Adds columns to store Draw.io diagram data (XML and SVG) for diagram notes

ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS diagram_xml text;

ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS diagram_svg text;

-- Create index for diagram notes for faster queries
CREATE INDEX IF NOT EXISTS idx_notes_diagram ON public.notes(note_type) WHERE note_type = 'diagram';

-- Comments for documentation
COMMENT ON COLUMN public.notes.diagram_xml IS 'Draw.io diagram XML data (mxfile format)';
COMMENT ON COLUMN public.notes.diagram_svg IS 'Exported SVG representation of the diagram for preview';
