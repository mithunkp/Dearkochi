-- Add image_url column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS image_url text;
