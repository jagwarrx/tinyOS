-- Add workspace_data column to tasks table
-- This stores scratchpad and chat history for workspace sessions > 2 minutes

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workspace_data JSONB;

-- Add comment explaining the field
COMMENT ON COLUMN tasks.workspace_data IS 'Stores workspace session data (scratchpad, chat history) for sessions > 2 minutes';
