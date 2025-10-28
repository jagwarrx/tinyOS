-- Add activity_log table for tracking user actions

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    entity_ref_id TEXT,
    entity_title TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_activity_log_timestamp ON activity_log (timestamp DESC);
CREATE INDEX idx_activity_log_action_type ON activity_log (action_type);
CREATE INDEX idx_activity_log_entity_type ON activity_log (entity_type);
CREATE INDEX idx_activity_log_entity_id ON activity_log (entity_id);

-- Add comment
COMMENT ON TABLE activity_log IS 'Tracks all user actions and activities for the log page';
