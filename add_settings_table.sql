-- Migration: Create settings table for application configuration

-- Create settings table with key-value pairs
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- Add comments
COMMENT ON TABLE settings IS 'Application-wide settings and configuration stored as key-value pairs';
COMMENT ON COLUMN settings.key IS 'Unique setting key (e.g., "music_links", "theme", "shortcuts")';
COMMENT ON COLUMN settings.value IS 'Setting value stored as JSONB for flexibility';
COMMENT ON COLUMN settings.description IS 'Human-readable description of what this setting does';

-- Insert default music links
INSERT INTO settings (key, value, description) VALUES
  (
    'music_links',
    jsonb_build_object(
      'spotify', jsonb_build_array(
        jsonb_build_object(
          'id', gen_random_uuid()::text,
          'title', 'Focus Playlist',
          'url', 'https://open.spotify.com/playlist/5yMiEajnPz4b3u0R9K69m3?si=dFSQ4yOOSSqzJbCa2X2zzA&pi=u-W-LD_nwNRFyC&nd=1&dlsi=d2e6b2819cf34af2',
          'is_default', true
        )
      ),
      'youtube', jsonb_build_array(
        jsonb_build_object(
          'id', gen_random_uuid()::text,
          'title', 'Brown Noise',
          'url', 'https://www.youtube.com/watch?v=RqzGzwTY-6w',
          'is_default', true
        )
      )
    ),
    'Background audio links organized by type (spotify/youtube)'
  );

-- Example structure for other future settings:
-- INSERT INTO settings (key, value, description) VALUES
--   ('theme', '"dark"'::jsonb, 'Application theme: light or dark'),
--   ('keyboard_shortcuts', '{"save": "Ctrl+S", "search": "Ctrl+K"}'::jsonb, 'Custom keyboard shortcuts'),
--   ('ui_preferences', '{"sidebar_width": 300, "show_terminal": true}'::jsonb, 'UI layout preferences');
