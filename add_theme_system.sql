-- Migration: Add theme system support to settings table
-- This migration enables the new theme system with Sonokai and Monokai Pro variants

-- Ensure theme key exists in settings table
-- Default to 'sonokai-default' if not set
INSERT INTO settings (key, value, description)
VALUES ('theme', '"sonokai-default"'::jsonb, 'Active theme ID (e.g., sonokai-default, monokai-classic)')
ON CONFLICT (key) DO UPDATE
  SET description = 'Active theme ID (e.g., sonokai-default, monokai-classic)';

-- Add comment for future reference
COMMENT ON TABLE settings IS 'Application-wide settings and configuration. Theme system uses the "theme" key to store active theme ID.';

-- List of available theme IDs:
-- Sonokai variants:
--   - sonokai-default
--   - sonokai-atlantis
--   - sonokai-andromeda
--   - sonokai-shusia
--   - sonokai-maia
--   - sonokai-espresso
--
-- Monokai Pro variants:
--   - monokai-classic
--   - monokai-machine
--   - monokai-octagon
--   - monokai-ristretto
--   - monokai-spectrum
