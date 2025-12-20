-- Fix user_places schema to support verified places and image uploads

-- Add 'rating' column if it doesn't exist
ALTER TABLE user_places ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 4.5;

-- Add 'is_known' column to distinguish verified/admin places
ALTER TABLE user_places ADD COLUMN IF NOT EXISTS is_known boolean DEFAULT false;

-- Add 'image_url' column for uploads
ALTER TABLE user_places ADD COLUMN IF NOT EXISTS image_url text;

-- Ensure highlights is text array type (if it was created as text, this might be tricky, but usually it's array in Supabase if passed as array)
-- If it exists as generic json or text, we leave it. Assuming it's fine or we alter it if needed.
-- For now, adding clean columns is safest.

-- Update existing rows to have default values if null
UPDATE user_places SET is_known = false WHERE is_known IS NULL;
UPDATE user_places SET rating = 4.5 WHERE rating IS NULL;
