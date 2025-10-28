-- Migration: Create music_links table for storing background audio sources

-- Create music_links table
CREATE TABLE IF NOT EXISTS music_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('spotify', 'youtube')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_music_links_type ON music_links(type);
CREATE INDEX idx_music_links_default ON music_links(is_default);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_music_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER music_links_updated_at
  BEFORE UPDATE ON music_links
  FOR EACH ROW
  EXECUTE FUNCTION update_music_links_updated_at();

-- Add comments
COMMENT ON TABLE music_links IS 'Stores background audio sources (Spotify playlists, YouTube videos) for focus music';
COMMENT ON COLUMN music_links.title IS 'User-friendly name for the audio source (e.g., "Focus Playlist", "Brown Noise")';
COMMENT ON COLUMN music_links.url IS 'Full URL to Spotify playlist or YouTube video';
COMMENT ON COLUMN music_links.type IS 'Type of audio source: spotify or youtube';
COMMENT ON COLUMN music_links.is_default IS 'Whether this is the default audio source to show first';

-- Insert default music links (your current ones)
INSERT INTO music_links (title, url, type, is_default) VALUES
  ('Focus Playlist', 'https://open.spotify.com/playlist/5yMiEajnPz4b3u0R9K69m3?si=dFSQ4yOOSSqzJbCa2X2zzA&pi=u-W-LD_nwNRFyC&nd=1&dlsi=d2e6b2819cf34af2', 'spotify', true),
  ('Brown Noise', 'https://www.youtube.com/watch?v=RqzGzwTY-6w', 'youtube', false);
