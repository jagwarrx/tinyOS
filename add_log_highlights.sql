-- Add is_highlighted column to activity_log table
ALTER TABLE activity_log
ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT FALSE;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_activity_log_highlighted
ON activity_log(is_highlighted)
WHERE is_highlighted = TRUE;
